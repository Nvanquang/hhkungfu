# Module: Subscription & Payment

**Package:** `com.hhkungfu.backend.module.subscription`
**Phụ trách:** Gói VIP, mua gói, thanh toán VNPay/MoMo, callback, kiểm tra VIP, job hết hạn

---

## 1. Database Tables

### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id             BIGSERIAL     PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    duration_days  INTEGER       NOT NULL,
    price          DECIMAL(12,0) NOT NULL,
    original_price DECIMAL(12,0),
    description    TEXT,
    features       TEXT[],
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order     SMALLINT      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
    id               BIGSERIAL     PRIMARY KEY,
    user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id          BIGINT        NOT NULL REFERENCES subscription_plans(id),
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','ACTIVE','EXPIRED','CANCELLED')),
    started_at       TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    paid_price       DECIMAL(12,0),
    duration_days    INTEGER,
    previous_sub_id  BIGINT REFERENCES user_subscriptions(id),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sub_user_id ON user_subscriptions (user_id);
CREATE INDEX idx_sub_status  ON user_subscriptions (status);
CREATE INDEX idx_sub_active  ON user_subscriptions (user_id, expires_at DESC) WHERE status = 'ACTIVE';
CREATE INDEX idx_sub_expires ON user_subscriptions (expires_at) WHERE status = 'ACTIVE';
```

### `payments`
```sql
CREATE TABLE payments (
    id                     BIGSERIAL     PRIMARY KEY,
    subscription_id        BIGINT        NOT NULL REFERENCES user_subscriptions(id),
    user_id                UUID          NOT NULL REFERENCES users(id),
    gateway                VARCHAR(20)   NOT NULL CHECK (gateway IN ('VNPAY','MOMO')),
    amount                 DECIMAL(12,0) NOT NULL,
    currency               VARCHAR(3)    NOT NULL DEFAULT 'VND',
    status                 VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                               CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED','EXPIRED')),
    order_code             VARCHAR(100)  NOT NULL UNIQUE,
    -- Format: ORD{timestamp}{random4upcase} — only [a-zA-Z0-9], max 100 chars (VNPay requirement)
    order_info             VARCHAR(255),
    gateway_transaction_id VARCHAR(100),
    gateway_response_code  VARCHAR(10),
    gateway_response_data  JSONB,
    paid_at                TIMESTAMPTZ,
    expired_at             TIMESTAMPTZ,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_sub        ON payments (subscription_id);
CREATE INDEX idx_payments_user       ON payments (user_id);
CREATE INDEX idx_payments_order_code ON payments (order_code);
CREATE INDEX idx_payments_status     ON payments (status);
```

### Redis keys liên quan
| Key | TTL | Mô tả |
|---|---|---|
| `vip:status:{userId}` | 300s | Cache trạng thái VIP (5 phút) |

> **Lưu ý:** Cache `sub:plans` chưa được implement — `getPlans()` hiện truy vấn DB trực tiếp mỗi request.

---

## 2. Cấu hình (`application.yaml`)

```yaml
payment:
  vnpay:
    tmn-code: YOUR_TMN_CODE
    hash-secret: YOUR_HASH_SECRET
    payment-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    return-url: http://localhost:8080/api/v1/payments/callback/vnpay/return
    ipn-url: http://localhost:8080/api/v1/payments/callback/vnpay/ipn
  momo:
    partner-code: YOUR_PARTNER_CODE
    access-key: YOUR_ACCESS_KEY
    secret-key: YOUR_SECRET_KEY
    api-url: https://test-payment.momo.vn/v2/gateway/api/create
    redirect-url: http://localhost:3000/payment/result
    ipn-url: http://localhost:8080/api/v1/payments/callback/momo/ipn
```

Mapping được bind qua `PaymentProperties.java` (`@ConfigurationProperties(prefix = "payment")`).

---

## 3. API Endpoints

### GET `/api/v1/subscriptions/plans`
**Auth:** Không cần

**Logic:** Trả về danh sách gói đang active, sắp xếp theo `sortOrder` tăng dần.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": [
    {
      "id": 1, "name": "VIP 1 Tháng", "durationDays": 30,
      "price": 59000, "originalPrice": null,
      "description": "Trải nghiệm VIP trong 1 tháng",
      "features": ["Xem tất cả anime VIP-only", "Chất lượng 1080p", "Không quảng cáo"],
      "isActive": true, "sortOrder": 1
    }
  ]
}
```

---

### GET `/api/v1/subscriptions/me`
**Auth:** Cần đăng nhập

**Logic:** Tìm subscription `ACTIVE` mới nhất của user (theo `expiresAt DESC`). Trả `null` nếu không có.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "id": 12, "planName": "VIP 3 Tháng",
    "status": "ACTIVE",
    "startedAt": "2026-03-01T00:00:00Z",
    "expiresAt": "2026-05-30T00:00:00Z"
  }
}
// Nếu không có VIP: { "success": true, "data": null }
```

---

### POST `/api/v1/subscriptions/initiate`
**Auth:** Cần đăng nhập

**Request:**
```jsonc
{ "planId": 2, "gateway": "VNPAY" }   // gateway: "VNPAY" | "MOMO"
```

**Flow:**
```
1. Validate user tồn tại + emailVerified = true
2. Validate planId tồn tại + isActive = true
3. Kiểm tra nếu đã có PENDING payment cho plan này → lỗi PENDING_PAYMENT_EXISTS
4. Lấy subscription ACTIVE hiện tại (nếu có) → lưu vào previousSubscriptionId
5. INSERT user_subscriptions { status: PENDING, plan snapshot, previousSubscriptionId }
6. Sinh orderCode: "ORD" + System.currentTimeMillis() + random4 → strip ký tự non-alphanumeric
7. INSERT payments { status: PENDING, orderCode, expiredAt: NOW()+15m }
8. Gọi VNPayService/MoMoService.createPaymentUrl(orderCode, amount, orderInfo)
9. Trả về paymentUrl + orderId + expiresIn=900
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/...",
    "orderId": "ORD1742900400000X7K2",
    "expiresIn": 900
  }
}
```

**Errors:**
| Code | HTTP | Mô tả |
|---|---|---|
| `EMAIL_NOT_VERIFIED` | 400 | Email chưa xác thực |
| `PLAN_NOT_FOUND` | 404 | Gói không tồn tại |
| `PLAN_NOT_ACTIVE` | 400 | Gói đang bị ẩn |
| `PENDING_PAYMENT_EXISTS` | 400 | Đã có giao dịch PENDING cho gói này |
| `UNSUPPORTED_GATEWAY` | 400 | Gateway không hợp lệ |

---

### GET `/api/v1/payments/callback/vnpay/ipn`
**Auth:** Không cần (gọi từ VNPay server — Server-to-Server)

**Query Params (từ VNPay):**
```
vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount (x100), vnp_SecureHash, ...
```

**Flow:**
```
1. Verify chữ ký vnp_SecureHash với HMAC-SHA512 → lỗi INVALID_SIGNATURE nếu sai
2. Tìm payment theo orderCode = vnp_TxnRef (SELECT FOR UPDATE — pessimistic lock)
3. Idempotency: nếu payment.status == PAID → return luôn (không xử lý lại)
4. Kiểm tra amount: vnp_Amount / 100 phải == payment.amount → lỗi nếu sai
5. Nếu vnp_ResponseCode == "00":
   a. UPDATE payments: status=PAID, paidAt, gatewayTransactionId, responseData
   b. Tính expiresAt:
      - Nếu previousSubscriptionId != null VÀ sub đó còn ACTIVE → expiresAt = prevSub.expiresAt + durationDays
      - Ngược lại (không có sub trước hoặc sub đã EXPIRED) → expiresAt = NOW() + durationDays
   c. UPDATE user_subscriptions: status=ACTIVE, startedAt=NOW(), expiresAt
   d. DEL Redis vip:status:{userId}
6. Nếu responseCode != "00": payments → FAILED, user_subscriptions → CANCELLED
7. Trả về { "RspCode": "00", "Message": "Confirm Success" }
```

> **Lưu ý:** VNPay nhân 100 khi gửi amount (149.000đ → 14900000). Code đã chia 100 tại `processVNPayIPN`.

---

### GET `/api/v1/payments/callback/vnpay/return`
**Auth:** Không cần (browser redirect từ VNPay)

**Mô tả:** Chỉ đọc `vnp_TxnRef` và `vnp_ResponseCode` từ params, **không** gọi `PaymentService`. Redirect thẳng về frontend:
```
{returnUrl}?orderId={vnp_TxnRef}&status=success|failed
```

> **Lưu ý:** `vnp_ResponseCode == "00"` là thành công. IPN mới là nơi xử lý thực sự.

---

### POST `/api/v1/payments/callback/momo/ipn`
**Auth:** Không cần (gọi từ MoMo server — Server-to-Server)

**Body (JSON từ MoMo):**
```jsonc
{
  "orderId": "ORD1742900400000X7K2",
  "resultCode": 0,
  "transId": "2810459573",
  "amount": 149000,
  "message": "Thành công",
  "signature": "abc123..."
}
```

**Flow:**
```
1. Verify chữ ký HMAC-SHA256 → lỗi INVALID_SIGNATURE nếu sai
2. Tìm payment theo orderId (SELECT FOR UPDATE)
3. Idempotency check
4. Kiểm tra amount khớp payment.amount
5. Nếu resultCode == "0": kích hoạt subscription (flow giống VNPay)
6. Nếu resultCode != "0": FAILED + CANCELLED
7. Trả về HTTP 204
```

---

### GET `/api/v1/payments/callback/momo/return`
**Auth:** Không cần (browser redirect từ MoMo)

**Mô tả:** Chỉ đọc `orderId` và `resultCode`, **không** gọi `PaymentService`. Redirect về frontend:
```
{redirectUrl}?orderId={orderId}&status=success|failed
```

---

### GET `/api/v1/payments/result`
**Auth:** Cần đăng nhập | **Query:** `?orderCode=xxx`

**Mô tả:** Frontend polling sau khi redirect về để lấy kết quả thanh toán.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "orderId": "ORD1742900400000X7K2",
    "status": "PAID",
    "planName": "VIP 3 Tháng",
    "amount": 149000,
    "paidAt": "2026-03-26T14:32:00Z",
    "expiresAt": "2026-06-24T14:32:00Z"
  }
}
```

---

## 4. VNPay Integration (`VNPayService`)

### Tạo Payment URL
- Params được sắp xếp theo `TreeMap` (alphabetical).
- `vnp_Amount` = amount × 100.
- `orderCode` đã được làm sạch `[^a-zA-Z0-9]` trước khi truyền vào.
- Hash data: cả key lẫn value đều URL-encode, join bằng `&`.
- Ký bằng `HmacUtils.hmacSHA512(hashSecret, hashData)`.

### Verify Callback
- Lấy `vnp_SecureHash` ra khỏi params, remove `vnp_SecureHashType`.
- Build lại `hashData` từ params còn lại (cùng encoding).
- So sánh `equalsIgnoreCase`.

---

## 5. MoMo Integration (`MoMoService`)

### Tạo Payment URL
- Sinh `requestId = UUID.randomUUID()`.
- `requestType = "captureWallet"`.
- Raw signature format:
  ```
  accessKey=&amount=&extraData=&ipnUrl=&orderId=&orderInfo=&partnerCode=&redirectUrl=&requestId=&requestType=
  ```
- Ký bằng `HmacUtils.hmacSHA256(secretKey, rawSignature)`.
- Gọi MoMo API qua `RestTemplate.exchange()` với `ParameterizedTypeReference<Map<String, Object>>`.
- Trả về `response.get("payUrl")`.

### Verify Callback
- Raw signature format (callback):
  ```
  accessKey=&amount=&extraData=&message=&orderId=&orderInfo=&partnerCode=&requestId=&responseTime=&resultCode=&transId=
  ```
- So sánh `equalsIgnoreCase` với `signature` trong params.

---

## 6. Scheduled Jobs (`SubscriptionJobService`)

```java
// Chạy mỗi giờ — expire subscription hết hạn
@Scheduled(cron = "0 0 * * * *")
public void expireSubscriptions() {
    // UPDATE user_subscriptions SET status='EXPIRED'
    // WHERE status='ACTIVE' AND expires_at < NOW()
}

// Chạy mỗi 5 phút — expire payment quá 15 phút chưa thanh toán
@Scheduled(fixedRate = 300_000)
public void expireStalePayments() {
    // 1. SELECT subscription_id FROM payments WHERE status='PENDING' AND expired_at < NOW()
    // 2. UPDATE payments SET status='EXPIRED' WHERE status='PENDING' AND expired_at < NOW()
    // 3. UPDATE user_subscriptions SET status='CANCELLED' WHERE id IN (...)
}
```

> ⚠️ **Known limitation:** Bước 1 và 2 trong `expireStalePayments` dùng 2 câu query riêng biệt, không atomic. Nếu một payment được xử lý thành công giữa 2 query, subscription tương ứng có thể bị `CANCELLED` nhầm. Cần refactor thành 1 query hoặc dùng `RETURNING`.

---

## 7. isVip Check (Dùng Bởi Module Khác)

```java
// SubscriptionService.java
public boolean isVipActive(UUID userId) {
    String cacheKey = "vip:status:" + userId;
    Boolean cached = (Boolean) redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) return cached;

    boolean active = userSubscriptionRepository
        .findLatestActiveSubscription(userId, ZonedDateTime.now()).isPresent();
    redisTemplate.opsForValue().set(cacheKey, active, Duration.ofMinutes(5));
    return active;
}

// Phải gọi khi subscription được kích hoạt hoặc expired:
public void clearVipCache(UUID userId) {
    redisTemplate.delete("vip:status:" + userId);
}
```

---

## 8. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | Gói không tồn tại |
| `PLAN_NOT_ACTIVE` | 400 | Gói đang bị ẩn |
| `EMAIL_NOT_VERIFIED` | 400 | Cần xác thực email trước khi mua VIP |
| `PENDING_PAYMENT_EXISTS` | 400 | Đã có giao dịch PENDING cho gói này |
| `UNSUPPORTED_GATEWAY` | 400 | Gateway không hợp lệ |
| `PAYMENT_NOT_FOUND` | 404 | Không tìm thấy giao dịch |
| `INVALID_SIGNATURE` | 400 | Chữ ký từ gateway không hợp lệ |
| `AMOUNT_MISMATCH` | 400 | Số tiền callback không khớp DB |
| `VIP_REQUIRED` | 403 | Cần VIP để thực hiện hành động này |
