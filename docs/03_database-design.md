# Database Design — Anime Streaming Website

**Phiên bản:** 3.0
**Ngày cập nhật:** 2026-03-13
**Database:** PostgreSQL 16 (Supabase)
**ORM:** Spring Data JPA + Flyway migration
**Thay đổi so v2:** Thêm hệ thống VIP subscription + payment, tái cấu trúc role

---

## 1. Quyết Định Thiết Kế — VIP System

### Tại sao KHÔNG nhét VIP vào cột `role`?

```
❌ Sai — role = 'USER' | 'VIP' | 'ADMIN'

Vấn đề:
- VIP là trạng thái tạm thời (có hạn), role là quyền hệ thống (cố định)
- Không lưu được ngày hết hạn, lịch sử mua gói
- Khi hết hạn phải nhớ chạy job đổi role → dễ bug
- Không mở rộng được khi có nhiều gói (1 tháng, 3 tháng, 1 năm)
```

```
✅ Đúng — tách thành 2 khái niệm riêng:

users.role          = 'USER' | 'ADMIN'       (quyền hệ thống, không đổi)
user_subscriptions  = bảng riêng             (trạng thái VIP, có expires_at)
```

### Logic kiểm tra VIP trong code

```java
// Không check role, check subscription
public boolean isVip(UUID userId) {
    return subscriptionRepository.existsActiveSubscription(userId, LocalDateTime.now());
}

// Query
SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = :userId
      AND status = 'ACTIVE'
      AND expires_at > NOW()
)
```

### Mô hình subscription — gói tháng/năm

```
subscription_plans (gói cố định: 1 tháng, 3 tháng, 1 năm)
        │
        ▼
user_subscriptions (1 user có thể có nhiều lần mua — mỗi lần 1 bản ghi)
        │
        ▼
payments (1 lần mua = 1 payment — ghi nhận giao dịch thực tế qua VNPay/MoMo)
```

### Nội dung VIP-only

```
episodes.is_vip_only = TRUE  → chỉ user có subscription ACTIVE mới stream được
animes.has_vip_content = TRUE → flag để hiển thị badge VIP trên card
```

---

## 2. Sơ Đồ Quan Hệ Đầy Đủ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CORE                                          │
│                                                                         │
│  users ─────────────────────────────────────────────────────────────┐  │
│    │                                                                 │  │
│    ├──< user_subscriptions >── subscription_plans                   │  │
│    │          │                                                      │  │
│    │          └──< payments                                          │  │
│    │                                                                 │  │
│    ├──< watch_history >── episodes ──< subtitles                    │  │
│    │                          │       ──< video_files               │  │
│    │                          └──< transcode_jobs                   │  │
│    │                                                                 │  │
│    ├──< bookmarks >── animes ──< anime_genres >── genres            │  │
│    │                      └──< anime_studios >── studios            │  │
│    │                                                                 │  │
│    ├──< ratings >── animes                                          │  │
│    │                                                                 │  │
│    └──< comments (self-ref) >── episodes                            │  │
│              └──< comment_likes ───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SQL — Schema Đầy Đủ

```sql
-- ================================================================
-- ANIME STREAMING — DATABASE SCHEMA v3.0
-- PostgreSQL 16 | 2026-03-13
-- Flyway: V1__init_schema.sql
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ================================================================
-- BẢNG 1: users
-- Thay đổi v3: bỏ role VIP, chỉ còn USER | ADMIN
-- VIP status được xác định qua bảng user_subscriptions
-- ================================================================

CREATE TABLE users (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password    VARCHAR(255),
    username    VARCHAR(50)  NOT NULL,
    avatar_url  VARCHAR(500),
    avatar_public_id VARCHAR(255) NULL,
    bio         TEXT,
    provider    VARCHAR(20)  NOT NULL DEFAULT 'LOCAL'
                    CHECK (provider IN ('LOCAL', 'GOOGLE')),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER'
                    CHECK (role IN ('USER', 'ADMIN')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT uq_users_email    UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);

-- CREATE INDEX idx_users_email ON users (email);
-- CREATE INDEX idx_users_role  ON users (role);

COMMENT ON COLUMN users.role IS
    'USER = người dùng thường | ADMIN = quản trị viên.
     VIP không lưu ở đây — xem bảng user_subscriptions';

CREATE TABLE user_otps (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code    VARCHAR(10) NOT NULL,
    otp_type    VARCHAR(20) NOT NULL
                    CHECK (otp_type IN ('VERIFY_EMAIL', 'RESET_PASSWORD', 'FORGOT_PASSWORD ')),
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- BẢNG 2: subscription_plans
-- Các gói VIP admin định nghĩa: 1 tháng, 3 tháng, 1 năm...
-- ================================================================

CREATE TABLE subscription_plans (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,           -- 'VIP 1 Tháng', 'VIP 1 Năm'
    duration_days   INTEGER      NOT NULL,           -- 30, 90, 365
    price           DECIMAL(12,0) NOT NULL,          -- VND, không dùng thập phân
    original_price  DECIMAL(12,0),                  -- Giá gốc trước khi giảm (để hiện "Tiết kiệm X%")
    description     TEXT,
    features        TEXT[],                          -- ['Xem 1080p', 'Không quảng cáo', ...]
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT     NOT NULL DEFAULT 0, -- Thứ tự hiển thị
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN subscription_plans.price          IS 'Đơn vị: VND. Ví dụ: 59000 = 59.000đ';
COMMENT ON COLUMN subscription_plans.original_price IS 'NULL nếu không có khuyến mãi';
COMMENT ON COLUMN subscription_plans.features       IS 'Mảng mô tả quyền lợi, hiển thị trên trang mua gói';


-- ================================================================
-- BẢNG 3: user_subscriptions
-- Lịch sử và trạng thái VIP của mỗi user
-- Mỗi lần mua gói = 1 bản ghi mới
-- Khi gia hạn: tạo bản ghi mới, expires_at = expires_at cũ + duration
-- ================================================================

CREATE TABLE user_subscriptions (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         BIGINT       NOT NULL REFERENCES subscription_plans(id),

    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                            'PENDING',    -- Đã tạo đơn, chưa thanh toán
                            'ACTIVE',     -- Đang hoạt động
                            'EXPIRED',    -- Hết hạn (job tự chuyển)
                            'CANCELLED'   -- Hủy thủ công
                        )),

    started_at      TIMESTAMPTZ,              -- NULL khi còn PENDING, set khi payment PAID
    expires_at      TIMESTAMPTZ,              -- NULL khi còn PENDING

    -- Snapshot giá tại thời điểm mua (plan có thể thay đổi giá sau)
    paid_price      DECIMAL(12,0),
    duration_days   INTEGER,

    -- Theo dõi gia hạn
    previous_sub_id BIGINT REFERENCES user_subscriptions(id),  -- Sub trước đó nếu là gia hạn

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- CREATE INDEX idx_sub_user_id   ON user_subscriptions (user_id);
-- CREATE INDEX idx_sub_status    ON user_subscriptions (status);
-- CREATE INDEX idx_sub_expires   ON user_subscriptions (expires_at) WHERE status = 'ACTIVE';
-- CREATE INDEX idx_sub_active    ON user_subscriptions (user_id, expires_at DESC)
--                                  WHERE status = 'ACTIVE';

COMMENT ON COLUMN user_subscriptions.status IS
    'PENDING: chờ thanh toán |
     ACTIVE: đang dùng (expires_at > NOW()) |
     EXPIRED: job @Scheduled chạy mỗi giờ tự chuyển |
     CANCELLED: admin hoặc user hủy';
COMMENT ON COLUMN user_subscriptions.paid_price IS
    'Snapshot giá thực tế tại thời điểm mua, không bị ảnh hưởng khi plan đổi giá';
COMMENT ON COLUMN user_subscriptions.previous_sub_id IS
    'Trỏ về sub trước để truy vết chuỗi gia hạn';


-- ================================================================
-- BẢNG 4: payments
-- Ghi nhận giao dịch thực tế từ VNPay / MoMo
-- 1 subscription có thể có nhiều payment (nếu retry)
-- Chỉ 1 payment có status = PAID per subscription
-- ================================================================

CREATE TABLE payments (
    id                  BIGSERIAL    PRIMARY KEY,
    subscription_id     BIGINT       NOT NULL REFERENCES user_subscriptions(id),
    user_id             UUID         NOT NULL REFERENCES users(id),

    gateway             VARCHAR(20)  NOT NULL
                            CHECK (gateway IN ('VNPAY', 'MOMO')),
    amount              DECIMAL(12,0) NOT NULL,     -- VND
    currency            VARCHAR(3)   NOT NULL DEFAULT 'VND',

    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN (
                                'PENDING',    -- Đã tạo, chờ user thanh toán
                                'PAID',       -- Thanh toán thành công (nhận callback)
                                'FAILED',     -- Thất bại
                                'REFUNDED',   -- Đã hoàn tiền
                                'EXPIRED'     -- Quá 15 phút không thanh toán
                            )),

    -- Thông tin phiên thanh toán (gửi lên gateway)
    order_code          VARCHAR(50)  NOT NULL,   -- Mã đơn hàng gửi lên gateway (unique)
    order_info          VARCHAR(255),             -- Mô tả đơn hàng: "VIP 1 thang - user@mail"

    -- Thông tin trả về từ gateway (callback)
    gateway_transaction_id  VARCHAR(100),        -- Mã giao dịch của VNPay/MoMo
    gateway_response_code   VARCHAR(10),         -- '00' = thành công (VNPay), '0' (MoMo)
    gateway_response_data   JSONB,               -- Toàn bộ payload callback — dùng để đối soát



    -- Timestamps
    paid_at             TIMESTAMPTZ,
    expired_at          TIMESTAMPTZ,             -- Thời điểm phiên thanh toán hết hạn (15 phút)
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ADD CONSTRAINT uq_payments_order_code UNIQUE (order_code);

-- CREATE INDEX idx_payments_subscription ON payments (subscription_id);
-- CREATE INDEX idx_payments_user_id      ON payments (user_id);
-- CREATE INDEX idx_payments_status       ON payments (status);
-- CREATE INDEX idx_payments_order_code   ON payments (order_code);
-- CREATE INDEX idx_payments_gateway_txn  ON payments (gateway_transaction_id)
--                                         WHERE gateway_transaction_id IS NOT NULL;

COMMENT ON COLUMN payments.order_code IS
    'Mã unique gửi lên gateway. Format: ORD-{timestamp}-{random6}.
     VNPay dùng làm vnp_TxnRef, MoMo dùng làm orderId';
COMMENT ON COLUMN payments.gateway_response_data IS
    'JSONB — lưu nguyên toàn bộ callback payload để đối soát sau này.
     Không phụ thuộc vào việc parse đúng từng field';
COMMENT ON COLUMN payments.expired_at IS
    'Phiên thanh toán hết hạn sau 15 phút. Job định kỳ chuyển PENDING → EXPIRED';


-- ================================================================
-- BẢNG 5: genres
-- ================================================================

CREATE TABLE genres (
    id       BIGSERIAL    PRIMARY KEY,
    name     VARCHAR(50)  NOT NULL,
    name_vi  VARCHAR(50),
    slug     VARCHAR(50)  NOT NULL
);

ALTER TABLE genres ADD CONSTRAINT uq_genres_name UNIQUE (name);
ALTER TABLE genres ADD CONSTRAINT uq_genres_slug UNIQUE (slug);


-- ================================================================
-- BẢNG 6: studios
-- ================================================================

CREATE TABLE studios (
    id        BIGSERIAL    PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    logo_url  VARCHAR(500)
);

ALTER TABLE studios ADD CONSTRAINT uq_studios_name UNIQUE (name);


-- ================================================================
-- BẢNG 7: animes
-- Thay đổi v3: thêm has_vip_content để hiển thị badge VIP trên card
-- ================================================================

CREATE TABLE animes (
    id                  BIGSERIAL    PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    title_vi            VARCHAR(255),
    title_other         TEXT[],
    slug                VARCHAR(255) NOT NULL,
    description         TEXT,
    thumbnail_url       VARCHAR(500),
    banner_url          VARCHAR(500),
    thumbnail_public_id VARCHAR(255) NULL,
    banner_public_id    VARCHAR(255) NULL,

    status              VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING'
                            CHECK (status IN ('ONGOING','COMPLETED','UPCOMING')),
    type                VARCHAR(20)  NOT NULL DEFAULT 'TV'
                            CHECK (type IN ('TV','MOVIE','OVA','SPECIAL','ONA')),

    total_episodes      INTEGER,
    episode_duration    INTEGER,
    aired_from          DATE,
    aired_to            DATE,
    season              VARCHAR(10)  CHECK (season IN ('WINTER','SPRING','SUMMER','FALL')),
    year                SMALLINT,
    age_rating          VARCHAR(10)  CHECK (age_rating IN ('G','PG','PG-13','R','R+')),

    mal_score           DECIMAL(4,2) CHECK (mal_score BETWEEN 0 AND 10),
    view_count          BIGINT       NOT NULL DEFAULT 0,
    is_featured         BOOLEAN      NOT NULL DEFAULT FALSE,

    -- VIP
    has_vip_content     BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE khi có ít nhất 1 episode is_vip_only = TRUE
    -- Dùng để hiển thị badge VIP trên card mà không cần JOIN episodes
    -- Cập nhật bởi trigger khi episodes thay đổi

    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE animes ADD CONSTRAINT uq_animes_slug UNIQUE (slug);

-- CREATE INDEX idx_animes_slug        ON animes (slug);
-- CREATE INDEX idx_animes_status      ON animes (status)       WHERE deleted_at IS NULL;
-- CREATE INDEX idx_animes_type        ON animes (type)         WHERE deleted_at IS NULL;
-- CREATE INDEX idx_animes_year        ON animes (year)         WHERE deleted_at IS NULL;
-- CREATE INDEX idx_animes_is_featured ON animes (is_featured)  WHERE deleted_at IS NULL;
-- CREATE INDEX idx_animes_view_count  ON animes (view_count DESC);
-- CREATE INDEX idx_animes_vip         ON animes (has_vip_content) WHERE deleted_at IS NULL;
-- CREATE INDEX idx_animes_fts         ON animes USING GIN (
--     to_tsvector('english',
--         coalesce(title,'') || ' ' ||
--         coalesce(title_vi,'') || ' ' ||
--         coalesce(description,'')
--     )
-- );

COMMENT ON COLUMN animes.has_vip_content IS
    'Denormalized flag — TRUE nếu anime có ít nhất 1 tập VIP-only.
     Được sync tự động bởi trigger trg_sync_anime_vip_flag.
     Dùng để hiển thị badge VIP trên listing mà không JOIN episodes';


-- ================================================================
-- BẢNG 8: anime_genres
-- ================================================================

CREATE TABLE anime_genres (
    anime_id  BIGINT NOT NULL REFERENCES animes(id)  ON DELETE CASCADE,
    genre_id  BIGINT NOT NULL REFERENCES genres(id)  ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);
CREATE INDEX idx_anime_genres_genre ON anime_genres (genre_id);


-- ================================================================
-- BẢNG 9: anime_studios
-- ================================================================

CREATE TABLE anime_studios (
    anime_id   BIGINT NOT NULL REFERENCES animes(id)   ON DELETE CASCADE,
    studio_id  BIGINT NOT NULL REFERENCES studios(id)  ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);
CREATE INDEX idx_anime_studios_studio ON anime_studios (studio_id);


-- ================================================================
-- BẢNG 10: episodes
-- Thay đổi v3: thêm is_vip_only
-- ================================================================

CREATE TABLE episodes (
    id               BIGSERIAL    PRIMARY KEY,
    anime_id         BIGINT       NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    episode_number   SMALLINT     NOT NULL,
    title            VARCHAR(255),
    description      TEXT,
    thumbnail_url    VARCHAR(500),

    -- VIP control ⭐
    is_vip_only      BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE → chỉ user có subscription ACTIVE mới stream được
    -- FALSE → tất cả đều xem được (kể cả chưa đăng nhập)

    -- Video pipeline
    video_status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                         CHECK (video_status IN ('PENDING','PROCESSING','READY','FAILED')),
    hls_path         VARCHAR(500),
    hls_base_url     VARCHAR(500),

    duration_seconds INTEGER,
    file_size_bytes  BIGINT,
    has_vietsub      BOOLEAN      NOT NULL DEFAULT FALSE,
    has_engsub       BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count       BIGINT       NOT NULL DEFAULT 0,
    aired_date       DATE,

    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE episodes ADD CONSTRAINT uq_episodes_per_anime
    UNIQUE (anime_id, episode_number);

-- CREATE INDEX idx_episodes_anime_id   ON episodes (anime_id, episode_number ASC) WHERE deleted_at IS NULL;
-- CREATE INDEX idx_episodes_status     ON episodes (video_status);
-- CREATE INDEX idx_episodes_vip        ON episodes (is_vip_only) WHERE deleted_at IS NULL;

COMMENT ON COLUMN episodes.is_vip_only IS
    'TRUE → yêu cầu subscription ACTIVE để stream.
     Khi thay đổi cột này, trigger sẽ tự sync animes.has_vip_content';


-- ================================================================
-- BẢNG 11: video_files
-- ================================================================

CREATE TABLE video_files (
    id           BIGSERIAL    PRIMARY KEY,
    episode_id   BIGINT       NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    quality      VARCHAR(10)  NOT NULL CHECK (quality IN ('360p','720p','1080p')),
    file_path    VARCHAR(500) NOT NULL,
    file_type    VARCHAR(20)  NOT NULL CHECK (file_type IN ('PLAYLIST','SEGMENT', 'THUMBNAIL', 'SPRITE', 'VTT')),
    file_name    VARCHAR(255) NOT NULL,
    file_size    BIGINT,
    duration     INTEGER,
    bitrate      BIGINT,
    width        INTEGER,
    height       INTEGER,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- CREATE INDEX idx_video_files_episode ON video_files (episode_id, quality);


-- ================================================================
-- BẢNG 12: transcode_jobs
-- ================================================================

CREATE TABLE transcode_jobs (
    id              BIGSERIAL    PRIMARY KEY,
    episode_id      BIGINT       NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'QUEUED'
                        CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
    progress        SMALLINT     NOT NULL DEFAULT 0
                        CHECK (progress BETWEEN 0 AND 100),
    current_step    VARCHAR(100),
    input_path      VARCHAR(500) NOT NULL,
    output_dir      VARCHAR(500),
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    retry_count     INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- CREATE INDEX idx_transcode_jobs_episode ON transcode_jobs (episode_id);
-- CREATE INDEX idx_transcode_jobs_status  ON transcode_jobs (status);


-- ================================================================
-- BẢNG 13: subtitles
-- ================================================================

CREATE TABLE subtitles (
    id          BIGSERIAL    PRIMARY KEY,
    episode_id  BIGINT       NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    language    VARCHAR(10)  NOT NULL,
    label       VARCHAR(50)  NOT NULL,
    url         VARCHAR(500) NOT NULL
);
-- CREATE INDEX idx_subtitles_episode ON subtitles (episode_id);


-- ================================================================
-- BẢNG 14: watch_history
-- ================================================================

CREATE TABLE watch_history (
    user_id           UUID    NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    episode_id        BIGINT  NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    progress_seconds  INTEGER NOT NULL DEFAULT 0,
    is_completed      BOOLEAN NOT NULL DEFAULT FALSE,
    watched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, episode_id)
);
-- CREATE INDEX idx_watch_history_user ON watch_history (user_id, watched_at DESC);


-- ================================================================
-- BẢNG 15: bookmarks
-- ================================================================

CREATE TABLE bookmarks (
    user_id    UUID   NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id   BIGINT NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);
-- CREATE INDEX idx_bookmarks_user ON bookmarks (user_id, created_at DESC);


-- ================================================================
-- BẢNG 16: ratings
-- ================================================================

CREATE TABLE ratings (
    user_id    UUID     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id   BIGINT   NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    score      SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);
-- CREATE INDEX idx_ratings_anime ON ratings (anime_id);


-- ================================================================
-- BẢNG 17: comments
-- ================================================================

CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    episode_id  BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content     TEXT   NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    like_count  INTEGER NOT NULL DEFAULT 0,
    is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_episode ON comments (episode_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent  ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_user    ON comments (user_id);


-- ================================================================
-- BẢNG 18: comment_likes
-- ================================================================

CREATE TABLE comment_likes (
    user_id    UUID   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);


-- ================================================================
-- TRIGGERS
-- ================================================================

-- Tự động updated_at
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_animes_updated_at
    BEFORE UPDATE ON animes FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_ratings_updated_at
    BEFORE UPDATE ON ratings FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON subscription_plans FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at();

-- Sync like_count trên comments
CREATE OR REPLACE FUNCTION fn_sync_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_likes_sync
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION fn_sync_comment_like_count();

-- ⭐ Sync animes.has_vip_content khi episodes.is_vip_only thay đổi
-- Tránh phải JOIN episodes mỗi khi render anime card
CREATE OR REPLACE FUNCTION fn_sync_anime_vip_flag()
RETURNS TRIGGER AS $$
DECLARE
    target_anime_id BIGINT;
    vip_exists      BOOLEAN;
BEGIN
    -- Xác định anime_id bị ảnh hưởng
    IF TG_OP = 'DELETE' THEN
        target_anime_id := OLD.anime_id;
    ELSE
        target_anime_id := NEW.anime_id;
    END IF;

    -- Kiểm tra còn tập VIP nào không
    SELECT EXISTS (
        SELECT 1 FROM episodes
        WHERE anime_id = target_anime_id
          AND is_vip_only = TRUE
          AND deleted_at IS NULL
    ) INTO vip_exists;

    UPDATE animes
    SET has_vip_content = vip_exists
    WHERE id = target_anime_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_anime_vip_flag
    AFTER INSERT OR UPDATE OF is_vip_only OR DELETE ON episodes
    FOR EACH ROW EXECUTE FUNCTION fn_sync_anime_vip_flag();


-- ================================================================
-- DỮ LIỆU MẪU
-- Flyway: V2__seed_data.sql
-- ================================================================

-- Genres
INSERT INTO genres (name, name_vi, slug) VALUES
    ('Action',        'Hành động',           'action'),
    ('Adventure',     'Phiêu lưu',           'adventure'),
    ('Comedy',        'Hài hước',            'comedy'),
    ('Drama',         'Kịch tính',           'drama'),
    ('Fantasy',       'Kỳ ảo',               'fantasy'),
    ('Horror',        'Kinh dị',             'horror'),
    ('Isekai',        'Dị giới',             'isekai'),
    ('Mecha',         'Robot',               'mecha'),
    ('Mystery',       'Bí ẩn',               'mystery'),
    ('Romance',       'Lãng mạn',            'romance'),
    ('Sci-Fi',        'Khoa học viễn tưởng', 'sci-fi'),
    ('Shounen',       'Thiếu niên',          'shounen'),
    ('Slice of Life', 'Cuộc sống',           'slice-of-life'),
    ('Sports',        'Thể thao',            'sports'),
    ('Supernatural',  'Siêu nhiên',          'supernatural'),
    ('Thriller',      'Ly kỳ',               'thriller');

-- Studios
INSERT INTO studios (name) VALUES
    ('MAPPA'), ('Toei Animation'), ('Madhouse'),
    ('Pierrot'), ('A-1 Pictures'), ('Bones'),
    ('Wit Studio'), ('Ufotable'), ('Kyoto Animation');

-- Subscription plans mẫu
INSERT INTO subscription_plans
    (name, duration_days, price, original_price, description, features, sort_order)
VALUES
    (
        'VIP 1 Tháng', 30, 59000, NULL,
        'Trải nghiệm VIP trong 1 tháng',
        ARRAY['Xem tất cả anime VIP-only', 'Chất lượng 1080p', 'Không quảng cáo'],
        1
    ),
    (
        'VIP 3 Tháng', 90, 149000, 177000,
        'Tiết kiệm 16% so với mua 3 tháng lẻ',
        ARRAY['Xem tất cả anime VIP-only', 'Chất lượng 1080p', 'Không quảng cáo', 'Ưu tiên hỗ trợ'],
        2
    ),
    (
        'VIP 1 Năm', 365, 499000, 708000,
        'Tiết kiệm 30% — lựa chọn tốt nhất',
        ARRAY['Xem tất cả anime VIP-only', 'Chất lượng 1080p', 'Không quảng cáo', 'Ưu tiên hỗ trợ', 'Badge VIP đặc biệt'],
        3
    );
```

---

## 4. Luồng Thanh Toán Chi Tiết

### Khởi tạo thanh toán

```
POST /api/v1/subscriptions/initiate
{ planId: 2, gateway: "VNPAY" }

1. Kiểm tra user chưa có subscription ACTIVE
   (Nếu đã có → cho phép mua gia hạn, expires_at sẽ cộng thêm)

2. Tạo user_subscriptions { status: PENDING, plan_id, paid_price snapshot }

3. Tạo payments {
     subscription_id,
     gateway: VNPAY,
     amount: plan.price,
     order_code: "ORD-20260313-X7K2M9",   ← unique, gửi lên VNPay làm vnp_TxnRef
     order_info: "VIP 1 thang - naruto_fan",
     expired_at: NOW() + 15 phút
   }

4. Gọi VNPay API → nhận payment_url
5. Trả về { paymentUrl, orderId }
6. Frontend redirect user sang VNPay/MoMo
```

### Nhận callback thanh toán

```
GET /api/v1/payments/callback/vnpay?vnp_TxnRef=ORD-xxx&vnp_ResponseCode=00&...

1. Xác minh chữ ký (vnp_SecureHash) — BẮT BUỘC, không bỏ qua
2. Tìm payment theo order_code
3. Idempotency check: nếu payment đã PAID → bỏ qua (VNPay có thể gửi callback 2 lần)
4. Nếu vnp_ResponseCode = '00':
   - payments.status = PAID
   - payments.paid_at = NOW()
   - payments.gateway_transaction_id = vnp_TransactionNo
   - payments.gateway_response_data = {toàn bộ params} (JSONB)
   - user_subscriptions.status = ACTIVE
   - user_subscriptions.started_at = NOW()
   - user_subscriptions.expires_at = NOW() + duration_days
5. Nếu lỗi:
   - payments.status = FAILED
   - user_subscriptions.status = CANCELLED
6. Redirect về frontend: /payment/result?status=success|failed
```

### Gia hạn subscription

```
Khi user mua lại khi subscription ACTIVE:
- Tạo subscription mới với previous_sub_id = id của sub hiện tại
- expires_at = sub_hiện_tại.expires_at + duration_days
  (Không mất thời gian còn lại — cộng dồn từ expires_at cũ)
```

### Job định kỳ — Spring @Scheduled

```java
// Chạy mỗi giờ
@Scheduled(cron = "0 0 * * * *")
void expireSubscriptions() {
    // ACTIVE → EXPIRED khi expires_at < NOW()
    UPDATE user_subscriptions
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' AND expires_at < NOW();
}

// Chạy mỗi 5 phút
@Scheduled(fixedRate = 300_000)
void expireStalePayments() {
    // PENDING → EXPIRED khi quá 15 phút không thanh toán
    UPDATE payments
    SET status = 'EXPIRED'
    WHERE status = 'PENDING' AND expired_at < NOW();

    // Kéo theo subscription
    UPDATE user_subscriptions
    SET status = 'CANCELLED'
    WHERE status = 'PENDING'
      AND id IN (
          SELECT subscription_id FROM payments WHERE status = 'EXPIRED'
      );
}
```

---

## 5. Kiểm Tra Quyền VIP Trong Code

```java
// ✅ Cách đúng — query subscription, không dựa vào role
@Query("""
    SELECT EXISTS (
        SELECT 1 FROM UserSubscription s
        WHERE s.userId = :userId
          AND s.status = 'ACTIVE'
          AND s.expiresAt > :now
    )
""")
boolean isVipActive(@Param("userId") UUID userId,
                    @Param("now") LocalDateTime now);

// ✅ Gọi trong service
public StreamInfoDto getStreamInfo(Long episodeId, UUID userId) {
    Episode ep = episodeRepository.findById(episodeId)
        .orElseThrow(() -> new ResourceNotFoundException("Episode", episodeId));

    if (ep.isVipOnly()) {
        if (userId == null) throw new BusinessException("VIP_REQUIRED", "Đăng nhập và nâng cấp VIP để xem");
        boolean isVip = subscriptionRepository.isVipActive(userId, LocalDateTime.now());
        if (!isVip) throw new BusinessException("VIP_REQUIRED", "Nâng cấp VIP để xem tập này");
    }

    return buildStreamInfo(ep);
}
```

---

## 6. Redis — Cấu Trúc Key (Cập Nhật)

| Key | Kiểu | TTL | Mô tả |
|---|---|---|---|
| `anime:{id}` | String (JSON) | 3600s | Cache chi tiết anime |
| `anime:slug:{slug}` | String (JSON) | 3600s | Cache anime theo slug |
| `anime:featured` | String (JSON) | 600s | Danh sách anime nổi bật |
| `anime:trending` | Sorted Set | không hết | Score = view count 24h |
| `episode:{id}` | String (JSON) | 1800s | Cache chi tiết tập |
| `episode:{id}:stream` | String (JSON) | 1800s | Cache HLS URL + subtitles |
| `viewcount:ep:{id}` | String (counter) | không hết | Bộ đếm lượt xem realtime |
| `search:{hash}` | String (JSON) | 600s | Cache kết quả tìm kiếm |
| `ratelimit:{ip}` | String | 60s | Rate limit |
| `refresh:{userId}` | String | 604800s | Refresh token (7 ngày) |
| `transcode:progress:{jobId}` | String (JSON) | 3600s | Cache tiến trình transcode |
| `vip:status:{userId}` | String (boolean) | 300s | ⭐ Cache trạng thái VIP (5 phút) |
| `sub:plans` | String (JSON) | 3600s | ⭐ Cache danh sách gói VIP |

> **`vip:status:{userId}`** — Cache 5 phút để tránh query DB mỗi request xem phim. Phải xóa cache này ngay khi subscription chuyển ACTIVE hoặc EXPIRED.

---

## 7. Flyway Migration — Thứ Tự

| File | Nội dung |
|---|---|
| `V1__init_schema.sql` | Toàn bộ CREATE TABLE, INDEX, TRIGGER |
| `V2__seed_data.sql` | INSERT genres, studios, subscription_plans mẫu |
| `V3__add_payment_indexes.sql` | Index bổ sung nếu cần sau deploy |

---

## 8. Tổng Hợp Bảng

| # | Bảng | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản, role USER/ADMIN |
| 2 | `subscription_plans` | ⭐ Định nghĩa gói VIP (1 tháng, 3 tháng, 1 năm) |
| 3 | `user_subscriptions` | ⭐ Trạng thái VIP của từng user |
| 4 | `payments` | ⭐ Giao dịch thanh toán VNPay / MoMo |
| 5 | `genres` | Thể loại |
| 6 | `studios` | Studio sản xuất |
| 7 | `animes` | Catalog anime (+ `has_vip_content` flag) |
| 8 | `anime_genres` | n-n: anime ↔ genre |
| 9 | `anime_studios` | n-n: anime ↔ studio |
| 10 | `episodes` | Tập phim (+ `is_vip_only` flag) |
| 11 | `video_files` | File HLS sau transcode |
| 12 | `transcode_jobs` | Lịch sử job FFmpeg |
| 13 | `subtitles` | File phụ đề .vtt |
| 14 | `watch_history` | Tiến trình xem của user |
| 15 | `bookmarks` | Anime đã bookmark |
| 16 | `ratings` | Đánh giá 1–10 |
| 17 | `comments` | Bình luận (self-ref cho reply) |
| 18 | `comment_likes` | Like bình luận |