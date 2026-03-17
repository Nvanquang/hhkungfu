# Module: Comment
**Package:** `com.hhkungfu.comment`
**Phụ trách:** Bình luận tập phim, reply, like/unlike comment

---

## 1. Database Tables

### `comments`
```sql
CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    episode_id BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    parent_id  BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    -- NULL = comment gốc | có giá trị = reply của comment parent_id
    content    TEXT   NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    like_count INTEGER NOT NULL DEFAULT 0,
    -- Sync tự động bởi trigger trg_comment_likes_sync
    is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,    -- Soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_episode ON comments (episode_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent  ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_user    ON comments (user_id);
```

### `comment_likes`
```sql
CREATE TABLE comment_likes (
    user_id    UUID   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);
```

### Trigger sync like_count (đã định nghĩa trong DB init)
```sql
-- Tự động tăng/giảm comments.like_count khi INSERT/DELETE comment_likes
CREATE TRIGGER trg_comment_likes_sync
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION fn_sync_comment_like_count();
```

---

## 2. Package Structure

```
com.hhkungfu.comment/
├── controller/
│   └── CommentController.java
├── service/
│   └── CommentService.java
├── dto/
│   ├── request/
│   │   ├── CommentCreateRequest.java
│   │   └── CommentUpdateRequest.java
│   └── response/
│       └── CommentDto.java
├── entity/
│   ├── Comment.java
│   └── CommentLike.java
└── repository/
    ├── CommentRepository.java
    └── CommentLikeRepository.java
```

---

## 3. API Endpoints

### GET `/api/v1/episodes/:episodeId/comments`
**Auth:** Không cần (nhưng cần để biết `isLikedByMe`)

**Query Params:**
| Param | Default | Mô tả |
|---|---|---|
| `page` | 1 | |
| `limit` | 20 | |
| `sort` | `createdAt` | `createdAt` \| `likeCount` |
| `order` | `desc` | |

**Logic:**
```sql
-- Chỉ lấy comment gốc (parent_id IS NULL)
SELECT c.*, u.username, u.avatar_url,
       COUNT(r.id) FILTER (WHERE r.deleted_at IS NULL) AS reply_count,
       -- isLikedByMe: nếu user đã đăng nhập
       EXISTS (SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = :userId) AS is_liked_by_me
FROM comments c
JOIN users u ON u.id = c.user_id
LEFT JOIN comments r ON r.parent_id = c.id
WHERE c.episode_id = :episodeId AND c.parent_id IS NULL AND c.deleted_at IS NULL
GROUP BY c.id, u.id
ORDER BY c.is_pinned DESC, c.{sort} {order}
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1, "content": "Tập này hay quá!",
        "likeCount": 42, "isPinned": false, "replyCount": 5,
        "createdAt": "2026-03-10T...",
        "isLikedByMe": false,
        "user": { "id": "uuid", "username": "naruto_fan", "avatarUrl": "..." }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 120, "totalPages": 6 }
  }
}
```

---

### GET `/api/v1/comments/:commentId/replies`
**Auth:** Không cần | **Query Params:** `page`, `limit`

**Logic:** Giống trên nhưng `WHERE parent_id = :commentId`. Không có `replyCount` (không hỗ trợ nested reply > 1 cấp).

**Response `200`:** Danh sách CommentDto (không có `replyCount`)

**Errors:** `COMMENT_NOT_FOUND` 404

---

### POST `/api/v1/episodes/:episodeId/comments`
**Auth:** Cần đăng nhập

**Request:**
```jsonc
{
  "content":  "Tập này hay quá!",  // required | 1–2000 ký tự
  "parentId": null                  // optional | ID comment cha nếu là reply
}
```

**Flow:**
1. Kiểm tra episode tồn tại và không bị xóa
2. Nếu `parentId` có giá trị:
   - Kiểm tra comment cha tồn tại + chưa bị xóa
   - Kiểm tra comment cha thuộc đúng `episodeId`
   - Kiểm tra comment cha không phải là reply (không cho nested reply > 1 cấp) → `NESTED_REPLY_NOT_ALLOWED` 400
3. INSERT `comments`

**Response `201`:** CommentDto đầy đủ

**Errors:** `EPISODE_NOT_FOUND` 404 | `COMMENT_NOT_FOUND` 404 | `NESTED_REPLY_NOT_ALLOWED` 400

---

### PATCH `/api/v1/comments/:id`
**Auth:** Cần đăng nhập (chủ comment)

**Request:** `{ "content": "Nội dung đã sửa" }` — required

**Flow:**
1. Tìm comment
2. Kiểm tra `comment.user_id = JWT.userId` → không phải chủ → `FORBIDDEN` 403
3. UPDATE `comments.content`

**Response `200`:** CommentDto sau sửa

**Errors:** `COMMENT_NOT_FOUND` 404 | `FORBIDDEN` 403

---

### DELETE `/api/v1/comments/:id`
**Auth:** Cần đăng nhập (chủ comment hoặc ADMIN)

**Flow:**
1. Tìm comment
2. Kiểm tra `comment.user_id = JWT.userId` HOẶC `JWT.role = ADMIN`
3. Soft delete: UPDATE `comments.deleted_at = NOW()`
4. Reply con vẫn giữ nguyên trong DB nhưng FE sẽ không hiển thị vì comment cha đã ẩn

**Response `204`:** No content

**Errors:** `COMMENT_NOT_FOUND` 404 | `FORBIDDEN` 403

---

### POST `/api/v1/comments/:id/like`
**Auth:** Cần đăng nhập

**Mô tả:** Toggle like ↔ unlike.

**Flow:**
```java
boolean alreadyLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
if (alreadyLiked) {
    commentLikeRepository.deleteByUserIdAndCommentId(userId, commentId);
    // Trigger tự giảm like_count
    return CommentLikeResponse(liked: false, likeCount: comment.likeCount - 1);
} else {
    commentLikeRepository.save(new CommentLike(userId, commentId));
    // Trigger tự tăng like_count
    return CommentLikeResponse(liked: true, likeCount: comment.likeCount + 1);
}
```

**Response `200`:**
```jsonc
{ "success": true, "data": { "liked": true, "likeCount": 43 } }
```

**Errors:** `COMMENT_NOT_FOUND` 404

---

## 4. Business Rules

- **Giới hạn cấp reply:** Chỉ hỗ trợ 1 cấp. Comment gốc → reply, không cho reply của reply.
- **Soft delete hiển thị:** Comment bị xóa (`deleted_at != NULL`) không trả về trong API. Reply của comment đã xóa vẫn tồn tại trong DB nhưng không hiển thị vì không có comment cha.
- **Pinned comment:** Chỉ Admin set `is_pinned = TRUE`. Pinned comments luôn hiển thị đầu tiên (ORDER BY `is_pinned DESC`).
- **like_count** không cần đọc lại từ DB — trigger đã giữ đồng bộ realtime.

---

## 5. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `COMMENT_NOT_FOUND` | 404 | Không tìm thấy comment |
| `EPISODE_NOT_FOUND` | 404 | Không tìm thấy tập phim |
| `FORBIDDEN` | 403 | Không có quyền sửa/xóa comment này |
| `NESTED_REPLY_NOT_ALLOWED` | 400 | Không cho phép reply của reply |
