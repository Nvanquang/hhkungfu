# Module: User
**Package:** `com.hhkungfu.user`
**Phụ trách:** Profile, đổi mật khẩu, lịch sử xem, bookmark, đánh giá

---

## 1. Database Tables

### `users` (partial — chỉ fields dùng trong module này)
```sql
-- id, email, username, avatar_url, bio, role, email_verified, is_active, created_at
-- Xem schema đầy đủ trong module-auth.md
```

### `watch_history`
```sql
CREATE TABLE watch_history (
    user_id          UUID    NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    episode_id       BIGINT  NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    progress_seconds INTEGER NOT NULL DEFAULT 0,
    is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE khi progressSeconds > 85% của episode.duration_seconds
    watched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, episode_id)
);
CREATE INDEX idx_watch_history_user ON watch_history (user_id, watched_at DESC);
```

### `bookmarks`
```sql
CREATE TABLE bookmarks (
    user_id    UUID   NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id   BIGINT NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);
CREATE INDEX idx_bookmarks_user ON bookmarks (user_id, created_at DESC);
```

### `ratings`
```sql
CREATE TABLE ratings (
    user_id    UUID     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id   BIGINT   NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    score      SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);
CREATE INDEX idx_ratings_anime ON ratings (anime_id);
```

---

## 2. API Endpoints

### GET `/api/v1/users/:id/profile`
**Auth:** Không cần

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "id": "uuid", "username": "naruto_fan",
    "avatarUrl": "https://res.cloudinary.com/...",
    "bio": "Anime lover",
    "createdAt": "2026-01-01T...",
    "stats": {
      "totalWatched": 150,
      "totalBookmarks": 30
    }
  }
}
```

**Logic:**
```sql
-- totalWatched: số episode đã xem (is_completed = TRUE)
SELECT COUNT(*) FROM watch_history WHERE user_id = :id AND is_completed = TRUE

-- totalBookmarks
SELECT COUNT(*) FROM bookmarks WHERE user_id = :id
```

**Errors:** `USER_NOT_FOUND` 404

---

### PATCH `/api/v1/users/me/profile`
**Auth:** Cần đăng nhập

**Request:**
```jsonc
{
  "username":  "new_username",  // optional | 3–50 ký tự | a-z, 0-9, _
  "avatarUrl": "https://...",   // optional | URL Cloudinary đã upload trước
  "bio":       "Mô tả mới"      // optional | max 500 ký tự
}
```

**Flow:**
1. Nếu username thay đổi → check unique → `USERNAME_ALREADY_EXISTS` 409
2. UPDATE `users` (chỉ update fields được gửi)
3. Trả về profile đã cập nhật

**Response `200`:** UserProfileDto

**Errors:** `USERNAME_ALREADY_EXISTS` 409 | `VALIDATION_ERROR` 400

---

### PATCH `/api/v1/users/me/password`
**Auth:** Cần đăng nhập

**Request:**
```jsonc
{
  "currentPassword": "OldPass123!",
  "newPassword":     "NewPass456!"
}
```

**Flow:**
1. Tìm user theo JWT
2. Kiểm tra `provider = LOCAL` — nếu GOOGLE → `OAUTH_ACCOUNT_NO_PASSWORD` 400
3. BCrypt verify `currentPassword` → sai → `WRONG_PASSWORD` 401
4. Validate `newPassword` đủ mạnh
5. BCrypt hash `newPassword` → UPDATE `users.password`
6. Giữ nguyên refresh token (không force logout)

**Response `204`:** No content

**Errors:** `WRONG_PASSWORD` 401 | `OAUTH_ACCOUNT_NO_PASSWORD` 400 | `WEAK_PASSWORD` 400

---

### POST `/api/v1/users/me/watch-history`
**Auth:** Cần đăng nhập

**Mô tả:** UPSERT — FE gọi mỗi 15 giây khi đang xem.

**Request:**
```jsonc
{
  "episodeId":       101,    // required
  "progressSeconds": 450,    // required | >= 0
  "isCompleted":     false   // required
}
```

**Flow:**
```sql
INSERT INTO watch_history (user_id, episode_id, progress_seconds, is_completed, watched_at)
VALUES (:userId, :episodeId, :progress, :isCompleted, NOW())
ON CONFLICT (user_id, episode_id)
DO UPDATE SET
    progress_seconds = EXCLUDED.progress_seconds,
    is_completed     = EXCLUDED.is_completed,
    watched_at       = NOW();
```

**Logic:** `isCompleted = true` khi `progressSeconds > 0.85 * episode.duration_seconds`. FE tự tính, BE không re-validate.

**Response `204`:** No content

---

### GET `/api/v1/users/me/watch-history`
**Auth:** Cần đăng nhập | **Query Params:** `page`, `limit`

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "progressSeconds": 450, "isCompleted": false,
        "watchedAt": "2026-03-10T20:00:00Z",
        "episode": {
          "id": 101, "episodeNumber": 3, "title": "Curse Womb Must Die",
          "durationSeconds": 1380, "thumbnailUrl": "https://..."
        },
        "anime": {
          "id": 1, "title": "Jujutsu Kaisen",
          "slug": "jujutsu-kaisen", "thumbnailUrl": "https://..."
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
  }
}
```

---

### GET `/api/v1/users/me/watch-history/anime/:animeId`
**Auth:** Cần đăng nhập

**Mô tả:** Dùng cho nút "Tiếp tục xem" — lấy tập đang xem dở của 1 anime.

**Logic:**
```sql
SELECT wh.*, e.episode_number, e.thumbnail_url, e.duration_seconds
FROM watch_history wh
JOIN episodes e ON e.id = wh.episode_id
WHERE wh.user_id = :userId
  AND e.anime_id = :animeId
  AND wh.is_completed = FALSE  -- chưa xem xong
ORDER BY wh.watched_at DESC LIMIT 1
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "currentEpisode": { "id": 101, "episodeNumber": 3, "thumbnailUrl": "..." },
    "progressSeconds":      450,
    "isCompleted":          false,
    "progressPercent":      32.6,
    "totalWatchedEpisodes": 2,
    "lastWatchedAt":        "2026-03-10T20:00:00Z"
  }
}
// null nếu chưa xem anime này
```

---

### DELETE `/api/v1/users/me/watch-history`
**Auth:** Cần đăng nhập

**Mô tả:** Xóa toàn bộ lịch sử xem

**Response `204`:** No content

---

### POST `/api/v1/users/me/bookmarks/:animeId`
**Auth:** Cần đăng nhập | **Request Body:** Không có

**Flow:**
1. Kiểm tra anime tồn tại
2. Check đã bookmark → `ALREADY_BOOKMARKED` 409
3. INSERT `bookmarks`

**Response `201`:**
```jsonc
{ "success": true, "data": { "animeId": 1, "createdAt": "2026-03-10T..." } }
```

---

### DELETE `/api/v1/users/me/bookmarks/:animeId`
**Auth:** Cần đăng nhập

**Flow:** DELETE FROM `bookmarks` WHERE user_id = :userId AND anime_id = :animeId

**Response `204`:** No content

---

### GET `/api/v1/users/me/bookmarks/:animeId/status`
**Auth:** Cần đăng nhập

**Response `200`:**
```jsonc
{ "success": true, "data": { "bookmarked": true } }
```

---

### GET `/api/v1/users/me/bookmarks`
**Auth:** Cần đăng nhập | **Query Params:** `page`, `limit`

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "animeId": 1, "createdAt": "...",
        "anime": {
          "id": 1, "title": "Jujutsu Kaisen", "slug": "jujutsu-kaisen",
          "thumbnailUrl": "...", "status": "ONGOING", "totalEpisodes": 24
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 30, "totalPages": 2 }
  }
}
```

---

### POST `/api/v1/ratings/anime/:animeId`
**Auth:** Cần đăng nhập

**Mô tả:** UPSERT — gọi lại để thay đổi điểm.

**Request:** `{ "score": 9 }` — integer 1–10

**Flow:**
```sql
INSERT INTO ratings (user_id, anime_id, score)
VALUES (:userId, :animeId, :score)
ON CONFLICT (user_id, anime_id)
DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
```

**Response `200`:**
```jsonc
{ "success": true, "data": { "animeId": 1, "score": 9, "updatedAt": "..." } }
```

**Errors:** `ANIME_NOT_FOUND` 404 | `VALIDATION_ERROR` 400 (score ngoài 1-10)

---

### GET `/api/v1/ratings/anime/:animeId/me`
**Auth:** Cần đăng nhập

**Response `200`:**
```jsonc
{ "success": true, "data": { "score": 9 } }
// null nếu chưa đánh giá
```

---

### GET `/api/v1/ratings/anime/:animeId/summary`
**Auth:** Không cần

**Logic:**
```sql
SELECT
    AVG(score)::DECIMAL(4,2) AS average_score,
    COUNT(*) AS total_ratings,
    COUNT(*) FILTER (WHERE score = 10) AS s10,
    COUNT(*) FILTER (WHERE score = 9)  AS s9,
    ...
FROM ratings WHERE anime_id = :animeId
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "averageScore": 8.5, "totalRatings": 2400,
    "distribution": {
      "10": 450, "9": 600, "8": 700, "7": 350,
      "6": 200, "5": 60,  "4": 20,  "3": 10, "2": 5, "1": 5
    }
  }
}
```

---

## 4. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `USER_NOT_FOUND` | 404 | Không tìm thấy user |
| `USERNAME_ALREADY_EXISTS` | 409 | Username đã được dùng |
| `WRONG_PASSWORD` | 401 | Mật khẩu hiện tại sai |
| `OAUTH_ACCOUNT_NO_PASSWORD` | 400 | Tài khoản Google không có password |
| `WEAK_PASSWORD` | 400 | Mật khẩu không đủ mạnh |
| `ALREADY_BOOKMARKED` | 409 | Đã bookmark anime này rồi |
| `ANIME_NOT_FOUND` | 404 | Anime không tồn tại |
