# Module: Admin
**Package:** `com.hhkungfu.admin`
**Phụ trách:** Dashboard tổng quan, quản lý user, analytics, upload ảnh

> **Lưu ý:** Các API CRUD anime/episode/video của admin nằm trong module tương ứng (module-anime.md, module-episode-video.md, module-subscription-payment.md). File này chỉ chứa các API thuần admin: dashboard, user management, analytics.

---

## 1. Database — Không có bảng riêng

Module Admin đọc dữ liệu từ các bảng của module khác:
- `users` — quản lý user
- `animes`, `episodes` — thống kê nội dung
- `user_subscriptions`, `payments` — thống kê doanh thu
- `transcode_jobs` — monitor pipeline
- Redis `anime:trending`, `viewcount:ep:*` — analytics realtime

---

## 2. Package Structure

```
com.hhkungfu.admin/
├── controller/
│   ├── AdminDashboardController.java   -- GET /admin/dashboard
│   ├── AdminUserController.java        -- GET/PATCH /admin/users
│   ├── AdminAnalyticsController.java   -- GET /admin/analytics/*
│   └── AdminUploadController.java      -- POST /admin/upload/image
├── service/
│   ├── AdminDashboardService.java
│   ├── AdminUserService.java
│   ├── AdminAnalyticsService.java
│   └── CloudinaryService.java          -- Upload ảnh
├── dto/
│   └── response/
│       ├── DashboardDto.java
│       ├── AdminUserDto.java
│       └── AnalyticsDto.java
└── security/
    └── AdminOnly.java                  -- @PreAuthorize("hasRole('ADMIN')")
```

---

## 3. API Endpoints

### GET `/api/v1/admin/dashboard`
**Auth:** ADMIN

**Logic:**
```java
// Tổng hợp từ nhiều bảng — không cache, luôn fresh
long totalAnimes   = animeRepository.countNotDeleted();
long totalEpisodes = episodeRepository.countNotDeleted();
long totalUsers    = userRepository.count();
long totalViews    = episodeRepository.sumViewCount();

long newUsersToday = userRepository.countCreatedSince(startOfToday);
long viewsToday    = // Từ Redis viewcount:ep:* hoặc watch_history.watched_at

int pendingJobs  = transcodeJobRepository.countByStatus(QUEUED);
int runningJobs  = transcodeJobRepository.countByStatus(RUNNING);
int failedJobs   = transcodeJobRepository.countRecentFailed(last24Hours);

List<TopAnime> topAnimes = animeRepository.findTopByViewCount(5);

// Revenue
BigDecimal revenueThisMonth = paymentRepository.sumPaidAmount(startOfMonth);
long newSubscriptionsToday  = subscriptionRepository.countActivatedSince(startOfToday);
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "totalAnimes":   350,
    "totalEpisodes": 8200,
    "totalUsers":    12400,
    "totalViews":    5800000,

    "newUsersToday": 45,
    "viewsToday":    28000,

    "revenueThisMonth":      14850000,
    "newSubscriptionsToday": 8,

    "transcodeJobs": {
      "pending": 2,
      "running": 1,
      "failedLast24h": 3
    },

    "topAnimes": [
      { "id": 1, "title": "Naruto Shippuden", "viewCount": 1500000 },
      { "id": 2, "title": "Jujutsu Kaisen",   "viewCount": 980000 }
    ],

    "recentActivity": [
      { "type": "VIDEO_READY",    "message": "Tập 5 JJK → READY",          "at": "10 phút trước" },
      { "type": "USER_REGISTER",  "message": "user@mail.com đăng ký",       "at": "25 phút trước" },
      { "type": "TRANSCODE_FAIL", "message": "Transcode thất bại: ep#203",  "at": "2 giờ trước" }
    ]
  }
}
```

---

### GET `/api/v1/admin/users`
**Auth:** ADMIN

**Query Params:**
| Param | Mô tả |
|---|---|
| `page` | Default 1 |
| `limit` | Default 20 |
| `search` | Tìm theo email hoặc username (ILIKE) |
| `role` | `USER` \| `ADMIN` |
| `isActive` | `true` \| `false` |

**Logic:**
```sql
SELECT u.*,
  (SELECT COUNT(*) FROM watch_history wh WHERE wh.user_id = u.id) AS total_watched,
  -- VIP status
  EXISTS (
    SELECT 1 FROM user_subscriptions s
    WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.expires_at > NOW()
  ) AS is_vip,
  (SELECT s.expires_at FROM user_subscriptions s
   WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.expires_at > NOW()
   ORDER BY s.expires_at DESC LIMIT 1) AS vip_expires_at
FROM users u
WHERE (:search IS NULL OR u.email ILIKE '%' || :search || '%' OR u.username ILIKE '%' || :search || '%')
  AND (:role IS NULL OR u.role = :role)
  AND (:isActive IS NULL OR u.is_active = :isActive)
ORDER BY u.created_at DESC
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid", "email": "naruto@example.com", "username": "naruto_fan",
        "avatarUrl": "https://...", "role": "USER",
        "isActive": true, "emailVerified": true,
        "provider": "LOCAL",
        "isVip": true, "vipExpiresAt": "2026-06-11T...",
        "totalWatched": 150,
        "createdAt": "2026-01-01T..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 12400, "totalPages": 621 }
  }
}
```

---

### PATCH `/api/v1/admin/users/:id/role`
**Auth:** ADMIN

**Request:** `{ "role": "ADMIN" }` — `USER` | `ADMIN`

**Business rules:**
- Không thể tự thay đổi role của chính mình
- Không thể hạ role admin cuối cùng còn lại

**Flow:**
1. Lấy `callerId` từ JWT
2. Nếu `targetId = callerId` → `CANNOT_MODIFY_SELF` 400
3. UPDATE `users.role`

**Response `200`:**
```jsonc
{ "success": true, "data": { "id": "uuid", "role": "ADMIN" } }
```

**Errors:** `USER_NOT_FOUND` 404 | `CANNOT_MODIFY_SELF` 400

---

### PATCH `/api/v1/admin/users/:id/status`
**Auth:** ADMIN

**Request:** `{ "isActive": false }`

**Business rules:**
- Không thể khóa chính mình
- Khi khóa user: DEL Redis `refresh:{userId}` → force logout ngay lập tức

**Flow:**
1. Kiểm tra không tự khóa mình
2. UPDATE `users.is_active`
3. Nếu `isActive = false` → DEL Redis `refresh:{userId}`

**Response `204`:** No content

**Errors:** `USER_NOT_FOUND` 404 | `CANNOT_MODIFY_SELF` 400

---

### PATCH `/api/v1/admin/animes/:id/featured`
**Auth:** ADMIN

**Request:** `{ "isFeatured": true }`

**Flow:**
1. UPDATE `animes.is_featured`
2. Invalidate Redis cache `anime:featured`, `anime:{id}`

**Response `204`:** No content

---

### GET `/api/v1/admin/analytics/views`
**Auth:** ADMIN

**Query Params:** `period` (`today` | `week` | `month`) | `limit` (default 10)

**Logic:**
```java
// Xác định khoảng thời gian
LocalDateTime from = switch (period) {
    case "today" -> startOfToday;
    case "week"  -> now.minusDays(7);
    case "month" -> now.minusDays(30);
};

// Top anime theo view trong khoảng
List<TopAnime> topAnimes = watchHistoryRepository.findTopAnimesByPeriod(from, now, limit);

// Chart data: số views mỗi ngày
List<DailyViews> chart = watchHistoryRepository.findDailyViewsByPeriod(from, now);
// SELECT DATE(watched_at) as date, COUNT(*) as views
// FROM watch_history WHERE watched_at BETWEEN :from AND :now
// GROUP BY DATE(watched_at) ORDER BY date ASC

// Revenue chart
List<DailyRevenue> revenueChart = paymentRepository.findDailyRevenue(from, now);
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "period": "week",
    "totalViews": 180000,
    "totalRevenue": 4470000,
    "newSubscriptions": 30,

    "topAnimes": [
      { "id": 1, "title": "Naruto",         "views": 42000 },
      { "id": 2, "title": "Jujutsu Kaisen", "views": 38500 }
    ],

    "topGenres": [
      { "name": "Action", "nameVi": "Hành động", "views": 95000 },
      { "name": "Shounen", "nameVi": "Thiếu niên", "views": 60000 }
    ],

    "viewsChart": [
      { "date": "2026-03-06", "views": 25000 },
      { "date": "2026-03-07", "views": 28000 },
      { "date": "2026-03-08", "views": 22000 }
    ],

    "revenueChart": [
      { "date": "2026-03-06", "amount": 640000 },
      { "date": "2026-03-07", "amount": 700000 }
    ],

    "transcodeHealth": {
      "totalJobs": 1240, "successJobs": 1230,
      "failedJobs": 8,   "activeJobs": 2,
      "successRate": 99.2,
      "recentFailed": [
        { "jobId": 55, "episodeId": 203, "error": "FFmpeg error: Invalid codec", "at": "2026-03-09T..." }
      ]
    }
  }
}
```

---

### POST `/api/v1/admin/upload/image`
**Auth:** ADMIN | **Content-Type:** `multipart/form-data`

**Request Form:**
| Field | Bắt buộc | Mô tả |
|---|---|---|
| `file` | ✅ | JPEG/PNG/WebP, max 5MB |
| `folder` | ✅ | `thumbnails` \| `banners` \| `avatars` \| `studios` |

**Flow:**
```java
// Dùng Cloudinary SDK
Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
    ObjectUtils.asMap(
        "folder", "hhkungfu/" + folder,
        "resource_type", "image",
        "allowed_formats", new String[]{"jpg","png","webp"},
        "max_bytes", 5 * 1024 * 1024
    )
);
```

**Response `201`:**
```jsonc
{
  "success": true,
  "data": {
    "url":      "https://res.cloudinary.com/demo/image/upload/.../jjk.jpg",
    "publicId": "hhkungfu/thumbnails/jjk",
    "width": 800, "height": 1200,
    "format": "jpg", "bytes": 124500
  }
}
```

**Errors:** `INVALID_FILE_TYPE` 400 | `FILE_TOO_LARGE` 400

---

## 4. Security — Áp Dụng Cho Tất Cả Admin API

```java
// SecurityConfig.java
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

// Hoặc dùng annotation trên từng method
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> dashboard() { ... }
```

---

## 5. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `USER_NOT_FOUND` | 404 | Không tìm thấy user |
| `CANNOT_MODIFY_SELF` | 400 | Admin không thể tự thay đổi role/status của mình |
| `INVALID_FILE_TYPE` | 400 | File không phải ảnh hợp lệ |
| `FILE_TOO_LARGE` | 400 | File vượt quá 5MB |
| `ANIME_NOT_FOUND` | 404 | Không tìm thấy anime |
