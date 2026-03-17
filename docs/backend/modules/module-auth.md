# Module: Auth
**Package:** `com.hhkungfu.auth`
**Phụ trách:** Đăng ký, đăng nhập, OAuth Google, xác thực email OTP, refresh token, logout

---

## 0. Overview
```java
// Tất cả API success đều trả về ApiResponse
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    private Instant timestamp;
}

// Tất cả API error đều trả về ErrorResponse
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private Object error;
    private Instant timestamp;
}

// Danh sách phân trang
@Getter @Builder
public class PageResponse<T> {
    private List<T> items;
    private PaginationMeta pagination;

    @Getter @Builder
    public static class PaginationMeta {
        private int page;
        private int limit;
        private long total;
        private int totalPages;
    }
}
```

## 1. Database Tables

### `users`
```sql
CREATE TABLE users (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255),                    -- NULL nếu OAuth Google
    username       VARCHAR(50)  NOT NULL UNIQUE,
    avatar_url     VARCHAR(500),
    bio            TEXT,
    provider       VARCHAR(20)  NOT NULL DEFAULT 'LOCAL'
                       CHECK (provider IN ('LOCAL', 'GOOGLE')),
    role           VARCHAR(20)  NOT NULL DEFAULT 'USER'
                       CHECK (role IN ('USER', 'ADMIN')),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### `user_otps`
```sql
CREATE TABLE user_otps (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code   VARCHAR(10) NOT NULL,
    otp_type   VARCHAR(20) NOT NULL
                   CHECK (otp_type IN ('VERIFY_EMAIL', 'RESET_PASSWORD', 'FORGOT_PASSWORD')),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Redis keys liên quan
| Key | TTL | Mô tả |
|---|---|---|
| `refresh:{userId}` | 7 ngày | Lưu refresh token hash |
| `ratelimit:otp:{email}` | 60s | Giới hạn gửi OTP (max 3 lần/phút) |

---

## 2. Package Structure

```
com.hhkungfu.auth/
├── controller/
│   └── AuthController.java          -- POST /auth/*
├── service/
│   ├── AuthService.java             -- login, register, refresh, logout
│   ├── OtpService.java              -- generate, send, verify OTP
│   └── OAuth2UserService.java       -- xử lý Google OAuth callback
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── RefreshTokenRequest.java
│   │   ├── VerifyOtpRequest.java
│   │   ├── ForgotPasswordRequest.java
│   │   └── ResetPasswordRequest.java
│   └── response/
│       ├── AuthResponse.java        -- accessToken, refreshToken, user
│       └── UserDto.java
├── entity/
│   ├── User.java
│   └── UserOtp.java
├── repository/
│   ├── UserRepository.java
│   └── UserOtpRepository.java
├── security/
│   ├── JwtUtil.java                 -- generate, validate JWT
│   ├── JwtAuthFilter.java           -- OncePerRequestFilter
│   └── SecurityConfig.java
└── exception/
    └── AuthException.java
```

---

## 3. API Endpoints

### POST `/api/v1/auth/register`
**Auth:** Không cần

**Request:**
```jsonc
{
  "email":    "user@example.com",  // required | email hợp lệ
  "username": "naruto_fan",         // required | 3–50 ký tự | a-z, 0-9, _
  "password": "Str0ng!Pass"         // required | min 8 ký tự | chữ hoa + số
}
```

**Flow:**
1. Validate input
2. Check email đã tồn tại → `EMAIL_ALREADY_EXISTS` 409
3. Check username đã tồn tại → `USERNAME_ALREADY_EXISTS` 409
4. BCrypt hash password
5. INSERT users (`email_verified = FALSE`, `provider = LOCAL`)
6. Gọi `OtpService.sendVerifyEmail(user)` — sinh OTP 6 số, lưu `user_otps`, gửi mail
7. Generate accessToken + refreshToken
8. Lưu refreshToken hash vào Redis `refresh:{userId}` TTL 7 ngày
9. Trả về 201

**Response `201`:**
```jsonc
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "username": "...", "role": "USER", "emailVerified": false },
    "accessToken":  "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn":    86400,
    "message": "Vui lòng kiểm tra email để xác thực tài khoản"
  }
}
```

**Errors:** `EMAIL_ALREADY_EXISTS` 409 | `USERNAME_ALREADY_EXISTS` 409 | `VALIDATION_ERROR` 400

---

### POST `/api/v1/auth/verify-email`
**Auth:** Không cần

**Request:**
```jsonc
{ "email": "user@example.com", "otpCode": "482910" }
```

**Flow:**
1. Tìm user theo email
2. Tìm OTP: `user_id = user.id AND otp_type = 'VERIFY_EMAIL' AND is_used = FALSE AND expires_at > NOW()`
3. Nếu không có → `OTP_INVALID` 400
4. So sánh `otpCode` với `otp_code` trong DB
5. Nếu sai → `OTP_INVALID` 400
6. UPDATE `user_otps.is_used = TRUE`
7. UPDATE `users.email_verified = TRUE`
8. Trả về 200

**Response `200`:**
```jsonc
{ "success": true, "data": { "message": "Xác thực email thành công" } }
```

**Errors:** `OTP_INVALID` 400 | `OTP_EXPIRED` 400 | `EMAIL_ALREADY_VERIFIED` 409

---

### POST `/api/v1/auth/resend-verification`
**Auth:** Không cần

**Request:** `{ "email": "user@example.com" }`

**Flow:**
1. Tìm user theo email
2. Nếu `email_verified = TRUE` → `EMAIL_ALREADY_VERIFIED` 409
3. Rate limit: check Redis `ratelimit:otp:{email}` — nếu tồn tại → `OTP_RATE_LIMIT` 429
4. Set Redis `ratelimit:otp:{email}` TTL 60s
5. Mark các OTP cũ `is_used = TRUE`
6. Sinh OTP mới, lưu `user_otps`, gửi mail

**Response `200`:** `{ "success": true, "data": { "message": "OTP đã được gửi lại" } }`

---

### POST `/api/v1/auth/login`
**Auth:** Không cần

**Request:**
```jsonc
{ "email": "user@example.com", "password": "Str0ng!Pass" }
```

**Flow:**
1. Tìm user theo email → không tìm thấy → `INVALID_CREDENTIALS` 401
2. Kiểm tra `provider = LOCAL` — nếu là GOOGLE → `OAUTH_ACCOUNT` 400
3. BCrypt verify password → sai → `INVALID_CREDENTIALS` 401
4. Kiểm tra `is_active = TRUE` → `ACCOUNT_DISABLED` 403
5. **Không chặn login khi `email_verified = FALSE`** — nhưng response trả về field `emailVerified: false` để FE hiển thị banner nhắc xác thực
6. Generate JWT accessToken (exp 24h) + refreshToken (exp 7d)
7. Lưu refreshToken hash vào Redis

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "username": "...", "role": "USER", "emailVerified": true },
    "accessToken":  "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn":    86400
  }
}
```

**Errors:** `INVALID_CREDENTIALS` 401 | `ACCOUNT_DISABLED` 403 | `OAUTH_ACCOUNT` 400

---

### POST `/api/v1/auth/refresh`
**Auth:** Không cần

**Request:** `{ "refreshToken": "eyJ..." }`

**Flow:**
1. Validate JWT signature + expiry của refreshToken
2. Extract `userId` từ claims
3. Lấy stored hash từ Redis `refresh:{userId}`
4. So sánh hash(refreshToken) với stored hash → khác → `INVALID_REFRESH_TOKEN` 401
5. Tìm user, kiểm tra `is_active`
6. Generate accessToken mới
7. Trả về accessToken mới (KHÔNG rotate refreshToken — giữ nguyên để không logout)

**Response `200`:**
```jsonc
{ "success": true, "data": { "accessToken": "eyJ...", "expiresIn": 86400 } }
```

**Errors:** `INVALID_REFRESH_TOKEN` 401 | `REFRESH_TOKEN_EXPIRED` 401

---

### POST `/api/v1/auth/logout`
**Auth:** Cần đăng nhập

**Flow:**
1. Extract `userId` từ JWT
2. DEL Redis key `refresh:{userId}`

**Response `204`:** No content

---

### GET `/api/v1/auth/me`
**Auth:** Cần đăng nhập

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "id": "uuid", "email": "...", "username": "...",
    "avatarUrl": "https://...", "bio": "...",
    "role": "USER", "provider": "LOCAL",
    "emailVerified": true,
    "createdAt": "2026-03-10T10:00:00Z"
  }
}
```

---

### POST `/api/v1/auth/forgot-password`
**Auth:** Không cần

**Request:** `{ "email": "user@example.com" }`

**Flow:**
1. Tìm user theo email — nếu không có → vẫn trả về 200 (tránh user enumeration)
2. Nếu `provider = GOOGLE` → bỏ qua (không có password)
3. Rate limit: check Redis `ratelimit:otp:{email}`
4. Mark OTP cũ `is_used = TRUE`
5. Sinh OTP `FORGOT_PASSWORD`, lưu DB, gửi mail

**Response `200`:** `{ "success": true, "data": { "message": "Nếu email tồn tại, OTP đã được gửi" } }`

---

### POST `/api/v1/auth/reset-password`
**Auth:** Không cần

**Request:**
```jsonc
{ "email": "user@example.com", "otpCode": "193847", "newPassword": "NewPass456!" }
```

**Flow:**
1. Tìm user theo email
2. Verify OTP `FORGOT_PASSWORD` (chưa dùng, chưa hết hạn)
3. BCrypt hash `newPassword`
4. UPDATE `users.password`
5. Mark OTP `is_used = TRUE`
6. DEL Redis `refresh:{userId}` — force logout tất cả thiết bị

**Response `200`:** `{ "success": true, "data": { "message": "Mật khẩu đã được cập nhật" } }`

**Errors:** `OTP_INVALID` 400 | `WEAK_PASSWORD` 400

---

### GET `/api/v1/auth/oauth2/google`
**Auth:** Không cần

**Mô tả:** Spring Security OAuth2 tự xử lý redirect đến Google. Không cần viết controller.

**Callback:** `GET /api/v1/auth/oauth2/callback/google`

**Flow (OAuth2UserService):**
1. Nhận Google profile (email, name, picture)
2. Tìm user theo email:
   - Nếu tồn tại + `provider = LOCAL` → trả lỗi `EMAIL_USED_WITH_PASSWORD` 409
   - Nếu tồn tại + `provider = GOOGLE` → login bình thường
   - Nếu không tồn tại → tạo user mới (`email_verified = TRUE`, `password = NULL`, `provider = GOOGLE`, username tự sinh)
3. Generate tokens
4. Redirect về FE: `https://hhkungfu.vercel.app/oauth/callback?token=eyJ...`

---

## 4. Business Logic Chi Tiết

### JWT Claims
```java
// Access Token — exp 24h
{
  "sub":      "uuid-user-id",
  "role":     "USER",            // dùng cho Spring Security hasRole()
  "email":    "user@example.com",
  "type":     "ACCESS",
  "iat":      1710000000,
  "exp":      1710086400
}

// Refresh Token — exp 7 ngày
{
  "sub":  "uuid-user-id",
  "type": "REFRESH",
  "iat":  1710000000,
  "exp":  1710604800
}
```

### OTP Logic
```java
// Sinh OTP 6 số
String otpCode = String.format("%06d", new SecureRandom().nextInt(999999));

// TTL: VERIFY_EMAIL = 10 phút, FORGOT/RESET_PASSWORD = 5 phút
LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

// Chỉ 1 OTP active per (user, type) tại 1 thời điểm
// Trước khi tạo mới → mark cũ is_used = TRUE
```

### Email_verified enforcement
```
- Đăng ký xong → email_verified = FALSE, vẫn nhận token
- Login → không chặn, nhưng trả về emailVerified: false
- FE hiển thị banner "Vui lòng xác thực email" với nút "Gửi lại OTP"
- Các API nhạy cảm (đổi mật khẩu, mua VIP) nên check email_verified = TRUE
```

---

## 5. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã được dùng |
| `USERNAME_ALREADY_EXISTS` | 409 | Username đã được dùng |
| `INVALID_CREDENTIALS` | 401 | Sai email hoặc password |
| `ACCOUNT_DISABLED` | 403 | Tài khoản bị khóa bởi admin |
| `OAUTH_ACCOUNT` | 400 | Tài khoản này đăng ký qua Google, không có password |
| `OTP_INVALID` | 400 | OTP sai hoặc đã dùng |
| `OTP_EXPIRED` | 400 | OTP hết hạn |
| `OTP_RATE_LIMIT` | 429 | Gửi OTP quá nhiều lần |
| `EMAIL_ALREADY_VERIFIED` | 409 | Email đã được xác thực |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token không hợp lệ |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token hết hạn |
| `WEAK_PASSWORD` | 400 | Password không đủ mạnh |
| `EMAIL_USED_WITH_PASSWORD` | 409 | Email đã đăng ký LOCAL, không dùng Google OAuth được |
