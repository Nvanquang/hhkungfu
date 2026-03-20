# Module: Anime
**Package:** `com.hhkungfu.anime`
**Phụ trách:** CRUD anime, thể loại, studio, tìm kiếm Elasticsearch, trending Redis, featured

---

## 1. Database Tables

### `animes`
```sql
CREATE TABLE animes (
    id               BIGSERIAL    PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    title_vi         VARCHAR(255),
    title_other      TEXT[],
    slug             VARCHAR(255) NOT NULL UNIQUE,
    description      TEXT,
    thumbnail_url    VARCHAR(500),
    banner_url       VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING'
                         CHECK (status IN ('ONGOING','COMPLETED','UPCOMING')),
    type             VARCHAR(20)  NOT NULL DEFAULT 'TV'
                         CHECK (type IN ('TV','MOVIE','OVA','SPECIAL','ONA')),
    total_episodes   INTEGER,
    episode_duration INTEGER,            -- phút
    aired_from       DATE,
    aired_to         DATE,
    season           VARCHAR(10)  CHECK (season IN ('WINTER','SPRING','SUMMER','FALL')),
    year             SMALLINT,
    age_rating       VARCHAR(10)  CHECK (age_rating IN ('G','PG','PG-13','R','R+')),
    mal_score        DECIMAL(4,2) CHECK (mal_score BETWEEN 0 AND 10),
    view_count       BIGINT       NOT NULL DEFAULT 0,
    is_featured      BOOLEAN      NOT NULL DEFAULT FALSE,
    has_vip_content  BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Tự sync qua trigger khi episodes.is_vip_only thay đổi
    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### `genres`
```sql
CREATE TABLE genres (
    id      BIGSERIAL   PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    name_vi VARCHAR(50),
    slug    VARCHAR(50) NOT NULL UNIQUE
);
```

### `studios`
```sql
CREATE TABLE studios (
    id       BIGSERIAL    PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500)
);
```

### `anime_genres` (n-n)
```sql
CREATE TABLE anime_genres (
    anime_id BIGINT NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);
```

### `anime_studios` (n-n)
```sql
CREATE TABLE anime_studios (
    anime_id  BIGINT NOT NULL REFERENCES animes(id)  ON DELETE CASCADE,
    studio_id BIGINT NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);
```

### Redis keys liên quan
| Key | Kiểu | TTL | Mô tả |
|---|---|---|---|
| `anime:{id}` | String JSON | 3600s | Cache chi tiết anime |
| `anime:slug:{slug}` | String JSON | 3600s | Cache anime theo slug |
| `anime:featured` | String JSON | 600s | Danh sách featured |
| `anime:trending` | Sorted Set | Không hết | score = view count 24h |


---

## 3. API Endpoints

### GET `/api/v1/animes`
**Auth:** Không cần

**Query Params:**
| Param | Kiểu | Default | Mô tả |
|---|---|---|---|
| `page` | int | 1 | |
| `limit` | int | 20 | max 100 |
| `sort` | string | `createdAt` | `viewCount` \| `malScore` \| `createdAt` \| `year` |
| `order` | string | `desc` | `asc` \| `desc` |
| `status` | string | | `ONGOING` \| `COMPLETED` \| `UPCOMING` |
| `type` | string | | `TV` \| `MOVIE` \| `OVA` \| `SPECIAL` \| `ONA` |
| `year` | int | | |
| `season` | string | | `WINTER` \| `SPRING` \| `SUMMER` \| `FALL` |
| `genreId` | long | | |
| `studioId` | long | | |

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1, "title": "Jujutsu Kaisen", "titleVi": "Chú Thuật Hồi Chiến",
        "slug": "jujutsu-kaisen", "thumbnailUrl": "https://...",
        "status": "ONGOING", "type": "TV", "totalEpisodes": 24,
        "year": 2020, "malScore": 8.66, "viewCount": 980000,
        "hasVipContent": false,
        "genres": [{ "id": 1, "name": "Action", "slug": "action" }]
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 350, "totalPages": 18 }
  }
}
```

---

### GET `/api/v1/animes/:id`
**Auth:** Không cần — `:id` là BIGINT ID hoặc slug string

**Logic:** Nếu param là số → query by `id`, nếu là string → query by `slug`. Cache Redis `anime:{id}` hoặc `anime:slug:{slug}` TTL 1 giờ.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "id": 1, "title": "Jujutsu Kaisen", "titleVi": "Chú Thuật Hồi Chiến",
    "titleOther": ["呪術廻戦"], "slug": "jujutsu-kaisen",
    "description": "...", "thumbnailUrl": "...", "bannerUrl": "...",
    "status": "ONGOING", "type": "TV", "totalEpisodes": 24,
    "episodeDuration": 24, "airedFrom": "2020-10-03", "airedTo": null,
    "season": "FALL", "year": 2020, "ageRating": "PG-13",
    "malScore": 8.66, "viewCount": 980000, "isFeatured": true,
    "hasVipContent": false,
    "genres": [{ "id": 1, "name": "Action", "nameVi": "Hành động", "slug": "action" }],
    "studios": [{ "id": 1, "name": "MAPPA", "logoUrl": "..." }],
    "averageRating": 8.9, "totalRatings": 3200,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**Errors:** `ANIME_NOT_FOUND` 404

---

### GET `/api/v1/animes/search`
**Auth:** Không cần

**Query Params:** `q` (required) | `page` | `limit` | `genreId` | `year` | `status`

**Logic:** Query Elasticsearch index `animes`. Fallback về PostgreSQL full-text nếu ES không available.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [ /* AnimeSummaryDto */ ],
    "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 },
    "meta": { "query": "jujutsu", "engine": "elasticsearch" }
  }
}
```

---

### GET `/api/v1/animes/trending`
**Auth:** Không cần | **Query Params:** `limit` (default 10, max 20)

**Logic:**
```
1. ZREVRANGE anime:trending 0 (limit-1) WITHSCORES từ Redis
2. Lấy list animeId → batch query DB (hoặc cache)
3. Nếu Redis empty → fallback query DB ORDER BY view_count DESC
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [ /* AnimeSummaryDto */ ],
    "meta": { "cachedAt": "2026-03-10T10:00:00Z" }
  }
}
```

---

### GET `/api/v1/animes/featured`
**Auth:** Không cần

**Logic:** Cache Redis `anime:featured` TTL 10 phút. Query: `WHERE is_featured = TRUE AND deleted_at IS NULL` ORDER BY `updated_at DESC` LIMIT 10.

**Response `200`:** `{ "success": true, "data": { "items": [ /* AnimeSummaryDto */ ] } }`

---

### GET `/api/v1/animes/recently-updated`
**Auth:** Không cần | **Query Params:** `page`, `limit`

**Logic:** JOIN episodes → lấy anime có episode được thêm gần đây nhất, kèm thông tin tập mới nhất.

```sql
SELECT DISTINCT ON (a.id) a.*, e.episode_number as latest_ep, e.created_at as latest_ep_added
FROM animes a
JOIN episodes e ON e.anime_id = a.id
WHERE a.deleted_at IS NULL AND e.deleted_at IS NULL AND e.video_status = 'READY'
ORDER BY a.id, e.created_at DESC
```

---

### GET `/api/v1/animes/:id/related`
**Auth:** Không cần | **Query Params:** `limit` (default 8)

**Logic:** Lấy anime có cùng genre, loại trừ anime hiện tại, ORDER BY `view_count DESC`.

```sql
SELECT a.* FROM animes a
JOIN anime_genres ag ON ag.anime_id = a.id
WHERE ag.genre_id IN (SELECT genre_id FROM anime_genres WHERE anime_id = :id)
  AND a.id != :id AND a.deleted_at IS NULL
GROUP BY a.id
ORDER BY a.view_count DESC LIMIT :limit
```

---

### POST `/api/v1/animes` *(Admin)*
**Auth:** ADMIN

**Request:**
```jsonc
{
  "title": "Jujutsu Kaisen",       // required
  "titleVi": "Chú Thuật Hồi Chiến",
  "titleOther": ["呪術廻戦"],
  "slug": "jujutsu-kaisen",        // required | unique
  "description": "...",
  "thumbnailUrl": "https://...",
  "bannerUrl": "https://...",
  "status": "ONGOING",             // required
  "type": "TV",                    // required
  "totalEpisodes": 24,
  "episodeDuration": 24,
  "airedFrom": "2020-10-03",
  "airedTo": null,
  "season": "FALL",
  "year": 2020,
  "ageRating": "PG-13",
  "malScore": 8.66,
  "isFeatured": false,
  "genreIds": [1, 12],
  "studioIds": [1]
}
```

**Flow:**
1. Check slug unique → `SLUG_ALREADY_EXISTS` 409
2. Validate genreIds tồn tại
3. INSERT `animes`
4. INSERT `anime_genres`, `anime_studios`
5. Index vào Elasticsearch
6. Invalidate cache `anime:featured` nếu `isFeatured = true`

**Response `201`:** AnimeDetailDto

---

### PUT `/api/v1/animes/:id` *(Admin)*
**Auth:** ADMIN | **Request:** Giống POST, tất cả optional

**Flow:**
1. Nếu slug thay đổi → check unique
2. UPDATE `animes`
3. Sync `anime_genres`, `anime_studios` (delete all → insert mới)
4. Reindex Elasticsearch
5. Invalidate Redis cache `anime:{id}`, `anime:slug:{slug}`, `anime:featured`

**Response `200`:** AnimeDetailDto

---

### DELETE `/api/v1/animes/:id` *(Admin)*
**Auth:** ADMIN | **Mô tả:** Soft delete — set `deleted_at = NOW()`

**Flow:** UPDATE `deleted_at` → invalidate cache → remove khỏi ES index

**Response `204`:** No content

**Errors:** `ANIME_NOT_FOUND` 404

---

### GET `/api/v1/genres`
**Auth:** Không cần

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [{ "id": 1, "name": "Action", "nameVi": "Hành động", "slug": "action" }]
  }
}
```

---

### GET `/api/v1/genres/:slug/animes`
**Auth:** Không cần | **Query Params:** `page`, `limit`, `sort`, `order`, `year`, `status`

**Response `200`:** Danh sách AnimeSummaryDto + `meta.genre`

**Errors:** `GENRE_NOT_FOUND` 404

---

### POST `/api/v1/genres` *(Admin)*
**Auth:** ADMIN

**Request:** `{ "name": "Isekai", "nameVi": "Dị giới", "slug": "isekai" }`

**Response `201`:** GenreDto

**Errors:** `GENRE_ALREADY_EXISTS` 409

---

### GET `/api/v1/studios`
**Auth:** Không cần | **Response `200`:** Danh sách tất cả studios

---

### GET `/api/v1/studios/:id/animes`
**Auth:** Không cần | **Query Params:** `page`, `limit`

**Response `200`:** Danh sách AnimeSummaryDto + `meta.studio`

---

## 4. Business Logic Chi Tiết

### View Count Flow
```
User xem tập → POST /episodes/:id/view
  → INCR Redis viewcount:ep:{episodeId}
  → ZINCRBY Redis anime:trending {animeId} 1

Job @Scheduled mỗi 1 giờ:
  → Đọc tất cả viewcount:ep:* keys
  → Batch UPDATE episodes.view_count += delta
  → Tính tổng per anime → UPDATE animes.view_count
  → DEL các viewcount:ep:* keys đã sync

Job @Scheduled mỗi 24 giờ (0:00):
  → Xóa Redis key anime:trending
  → Rebuild từ view_count 24 giờ qua (từ bảng watch_history hoặc analytics)
```

### Elasticsearch Sync
```java
// Sau mỗi POST/PUT/DELETE anime → sync ES
@Async
public void indexAnime(Anime anime) {
    AnimeDocument doc = AnimeDocument.from(anime);
    elasticsearchOperations.save(doc);
}

// AnimeDocument fields để search:
// title, title_vi, title_other[], description, genres[].name
```

### has_vip_content trigger (đã định nghĩa trong DB)
```
Khi episodes.is_vip_only thay đổi:
  → Trigger fn_sync_anime_vip_flag() tự UPDATE animes.has_vip_content
  → Không cần xử lý trong Java code
  → Nhưng phải invalidate Redis cache anime:{id} sau khi trigger chạy
```

---

## 5. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `ANIME_NOT_FOUND` | 404 | Không tìm thấy anime |
| `SLUG_ALREADY_EXISTS` | 409 | Slug đã tồn tại |
| `GENRE_NOT_FOUND` | 404 | Genre không tồn tại |
| `GENRE_ALREADY_EXISTS` | 409 | Genre đã tồn tại |
| `STUDIO_NOT_FOUND` | 404 | Studio không tồn tại |
| `VALIDATION_ERROR` | 400 | Input không hợp lệ |
