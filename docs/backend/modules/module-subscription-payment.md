# Module: Subscription & Payment
**Package:** `com.hhkungfu.subscription`
**Phụ trách:** Gói VIP, mua gói, thanh toán VNPay/MoMo, callback, kiểm tra VIP, job hết hạn

---

## 1. Database Tables

### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id             BIGSERIAL     PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,         -- 'VIP 1 Tháng', 'VIP 1 Năm'
    duration_days  INTEGER       NOT NULL,          -- 30, 90, 365
    price          DECIMAL(12,0) NOT NULL,          -- VND
    original_price DECIMAL(12,0),                  -- Giá gốc (để hiện % tiết kiệm), NULL nếu không giảm
    description    TEXT,
    features       TEXT[],                          -- ['Xem 1080p', 'Không quảng cáo', ...]
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
    started_at       TIMESTAMPTZ,              -- Set khi payment PAID
    expires_at       TIMESTAMPTZ,              -- started_at + duration_days
    paid_price       DECIMAL(12,0),            -- Snapshot giá tại thời điểm mua
    duration_days    INTEGER,                   -- Snapshot duration
    previous_sub_id  BIGINT REFERENCES user_subscriptions(id),  -- Trỏ sub trước nếu gia hạn
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
    order_code             VARCHAR(50)   NOT NULL UNIQUE,
    -- Format: ORD-{yyyyMMddHHmmss}-{random6}
    order_info             VARCHAR(255),
    gateway_transaction_id VARCHAR(100),
    gateway_response_code  VARCHAR(10),
    gateway_response_data  JSONB,                -- Toàn bộ callback payload
    paid_at                TIMESTAMPTZ,
    expired_at             TIMESTAMPTZ,          -- Phiên thanh toán hết hạn sau 15 phút
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
| `sub:plans` | 3600s | Cache danh sách gói |

---

## 2. Package Structure

```
com.hhkungfu.subscription/
├── controller/
│   ├── SubscriptionController.java  -- GET /subscriptions/plans, POST /subscriptions/initiate
│   ├── PaymentCallbackController.java -- GET /payments/callback/vnpay, /momo
│   └── SubscriptionAdminController.java -- Admin: manage plans
├── service/
│   ├── SubscriptionService.java     -- initiate, activate, check vip
│   ├── VNPayService.java            -- tạo payment URL, verify callback
│   ├── MoMoService.java             -- tạo payment URL, verify callback
│   └── SubscriptionJobService.java  -- @Scheduled expire jobs
├── dto/
│   ├── request/
│   │   ├── InitiatePaymentRequest.java  -- { planId, gateway }
│   │   └── PlanCreateRequest.java
│   └── response/
│       ├── SubscriptionPlanDto.java
│       ├── UserSubscriptionDto.java
│       ├── PaymentInitiateResponse.java -- { paymentUrl, orderId }
│       └── PaymentResultDto.java
├── entity/
│   ├── SubscriptionPlan.java
│   ├── UserSubscription.java
│   └── Payment.java
└── repository/
    ├── SubscriptionPlanRepository.java
    ├── UserSubscriptionRepository.java
    └── PaymentRepository.java
```

---

## 3. API Endpoints

### GET `/api/v1/subscriptions/plans`
**Auth:** Không cần

**Logic:** Cache Redis `sub:plans` TTL 1 giờ. Tính % tiết kiệm từ `original_price`.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1, "name": "VIP 1 Tháng", "durationDays": 30,
        "price": 59000, "originalPrice": null, "savingPercent": null,
        "description": "Trải nghiệm VIP trong 1 tháng",
        "features": ["Xem tất cả anime VIP-only", "Chất lượng 1080p", "Không quảng cáo"],
        "isActive": true, "sortOrder": 1
      },
      {
        "id": 2, "name": "VIP 3 Tháng", "durationDays": 90,
        "price": 149000, "originalPrice": 177000, "savingPercent": 16,
        "description": "Tiết kiệm 16%",
        "features": ["Xem tất cả anime VIP-only", "Chất lượng 1080p", "Không quảng cáo", "Ưu tiên hỗ trợ"],
        "isActive": true, "sortOrder": 2
      },
      {
        "id": 3, "name": "VIP 1 Năm", "durationDays": 365,
        "price": 499000, "originalPrice": 708000, "savingPercent": 30,
        "description": "Lựa chọn tốt nhất",
        "features": ["Xem tất cả anime VIP-only", "Chất lượng 1080p", "Không quảng cáo", "Ưu tiên hỗ trợ", "Badge VIP đặc biệt"],
        "isActive": true, "sortOrder": 3
      }
    ]
  }
}
```

---

### GET `/api/v1/subscriptions/me`
**Auth:** Cần đăng nhập

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "isVip": true,
    "currentSubscription": {
      "id": 12, "planName": "VIP 3 Tháng",
      "status": "ACTIVE",
      "startedAt": "2026-03-01T00:00:00Z",
      "expiresAt": "2026-05-30T00:00:00Z",
      "daysRemaining": 78
    }
  }
}
// Nếu không có subscription: { "isVip": false, "currentSubscription": null }
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
1. Validate planId tồn tại + is_active = TRUE
2. Kiểm tra email_verified = TRUE → EMAIL_NOT_VERIFIED 403
3. Lấy subscription ACTIVE hiện tại (nếu có) để xác định expires_at gia hạn
4. INSERT user_subscriptions { status: PENDING, plan snapshot, previous_sub_id }
5. Sinh order_code: "ORD-20260313143000-X7K2M9"
6. INSERT payments { status: PENDING, order_code, expired_at: NOW()+15m }
7. Gọi VNPayService/MoMoService.createPaymentUrl(payment, plan)
8. Trả về paymentUrl + orderId
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "orderId": "ORD-20260313143000-X7K2M9",
    "expiresIn": 900
  }
}
```

**Errors:** `PLAN_NOT_FOUND` 404 | `PLAN_NOT_ACTIVE` 400 | `EMAIL_NOT_VERIFIED` 403

---

### GET `/api/v1/payments/callback/vnpay`
**Auth:** Không cần (gọi từ VNPay server)

**Query Params (từ VNPay):**
```
vnp_TxnRef=ORD-xxx
vnp_ResponseCode=00
vnp_TransactionNo=14242368
vnp_Amount=14900000   (x100 vì VNPay nhân 100)
vnp_SecureHash=abc123...
... (nhiều params khác)
```

**Flow:**
```
1. ⚠️ BẮT BUỘC: Verify chữ ký vnp_SecureHash với HMAC-SHA512
   → Nếu sai chữ ký → log cảnh báo, trả về RspCode=97, không xử lý tiếp

2. Tìm payment theo order_code = vnp_TxnRef

3. Idempotency: nếu payment.status đã là PAID → trả về RspCode=00 luôn (không xử lý lại)

4. Nếu vnp_ResponseCode = '00' (thành công):
   a. UPDATE payments: status=PAID, paid_at=NOW(),
      gateway_transaction_id=vnp_TransactionNo,
      gateway_response_code='00',
      gateway_response_data={toàn bộ params dạng JSON}
   b. Tính expires_at:
      - Nếu user có subscription ACTIVE → expires_at = sub_hiện_tại.expires_at + duration_days
      - Ngược lại → expires_at = NOW() + duration_days
   c. UPDATE user_subscriptions: status=ACTIVE, started_at=NOW(), expires_at=tính ở trên
   d. DEL Redis vip:status:{userId}  ← xóa cache VIP

5. Nếu vnp_ResponseCode != '00':
   a. UPDATE payments: status=FAILED, gateway_response_code=code
   b. UPDATE user_subscriptions: status=CANCELLED

6. Redirect về FE:
   - Thành công: https://hhkungfu.vercel.app/payment/result?status=success&orderId=ORD-xxx
   - Thất bại:   https://hhkungfu.vercel.app/payment/result?status=failed&orderId=ORD-xxx
```

> **Lưu ý:** VNPay trả về `vnp_Amount` đã nhân 100 (ví dụ 149.000đ → 14900000). Cần chia 100 khi so sánh.

---

### GET `/api/v1/payments/callback/momo`
**Auth:** Không cần (gọi từ MoMo server)

**Body (từ MoMo — POST thực ra, nhưng MoMo cũng hỗ trợ GET redirect):**
```jsonc
{
  "orderId": "ORD-xxx",
  "resultCode": 0,
  "transId": "2810459573",
  "amount": 149000,
  "message": "Thành công",
  "signature": "abc123..."
}
```

**Flow:**
```
1. Verify chữ ký HMAC-SHA256 với MoMo secret key
2. Tìm payment theo orderId
3. Idempotency check
4. Nếu resultCode = 0 (thành công): kích hoạt subscription (giống VNPay flow)
5. Nếu resultCode != 0: cancel
6. Redirect về FE
```

---

### GET `/api/v1/payments/result/:orderId`
**Auth:** Cần đăng nhập

**Mô tả:** FE polling sau khi redirect từ gateway để lấy kết quả thanh toán.

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "orderId": "ORD-xxx",
    "status": "PAID",                    // PENDING | PAID | FAILED | EXPIRED
    "planName": "VIP 3 Tháng",
    "amount": 149000,
    "paidAt": "2026-03-13T14:32:00Z",
    "expiresAt": "2026-06-11T14:32:00Z"  // null nếu chưa paid
  }
}
```

---

### GET `/api/v1/subscriptions/history`
**Auth:** Cần đăng nhập | **Query Params:** `page`, `limit`

**Response `200`:** Danh sách subscription + payment status, mới nhất trước

---

### POST `/api/v1/admin/subscriptions/plans` *(Admin)*
**Auth:** ADMIN | **Request:** Tất cả fields của subscription_plans

**Response `201`:** SubscriptionPlanDto

---

### PUT `/api/v1/admin/subscriptions/plans/:id` *(Admin)*
**Auth:** ADMIN | **Response `200`:** SubscriptionPlanDto cập nhật + invalidate cache `sub:plans`

---

### PATCH `/api/v1/admin/subscriptions/plans/:id/toggle` *(Admin)*
**Auth:** ADMIN | **Mô tả:** Toggle `is_active` — ẩn/hiện gói trên trang mua VIP

**Response `204`:** No content

---

## 4. VNPay Integration

### Tạo Payment URL
```java
public String createVNPayUrl(Payment payment, SubscriptionPlan plan, HttpServletRequest request) {
    Map<String, String> params = new TreeMap<>();
    params.put("vnp_Version", "2.1.0");
    params.put("vnp_Command", "pay");
    params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
    params.put("vnp_Amount", String.valueOf(payment.getAmount() * 100)); // Nhân 100
    params.put("vnp_CurrCode", "VND");
    params.put("vnp_TxnRef", payment.getOrderCode());
    params.put("vnp_OrderInfo", payment.getOrderInfo());
    params.put("vnp_OrderType", "other");
    params.put("vnp_Locale", "vn");
    params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl()); // /payments/callback/vnpay
    params.put("vnp_IpAddr", getClientIp(request));
    params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
    params.put("vnp_ExpireDate", LocalDateTime.now().plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

    // Tạo chuỗi hash data
    String hashData = params.entrySet().stream()
        .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
        .collect(Collectors.joining("&"));

    String secureHash = HmacSHA512(vnpayConfig.getHashSecret(), hashData);
    return vnpayConfig.getPaymentUrl() + "?" + hashData + "&vnp_SecureHash=" + secureHash;
}
```

### Verify Callback
```java
public boolean verifyVNPayCallback(Map<String, String> params) {
    String receivedHash = params.remove("vnp_SecureHash");
    params.remove("vnp_SecureHashType");

    String hashData = new TreeMap<>(params).entrySet().stream()
        .map(e -> e.getKey() + "=" + e.getValue())
        .collect(Collectors.joining("&"));

    String expectedHash = HmacSHA512(vnpayConfig.getHashSecret(), hashData);
    return expectedHash.equalsIgnoreCase(receivedHash);
}
```

---

## 5. MoMo Integration

### Tạo Payment URL
```java
public String createMoMoUrl(Payment payment) {
    String requestId = UUID.randomUUID().toString();
    String rawSignature = String.format(
        "accessKey=%s&amount=%s&extraData=&ipnUrl=%s&orderId=%s&orderInfo=%s&partnerCode=%s&redirectUrl=%s&requestId=%s&requestType=payWithATM",
        momoConfig.getAccessKey(), payment.getAmount(),
        momoConfig.getIpnUrl(),    payment.getOrderCode(),
        payment.getOrderInfo(),    momoConfig.getPartnerCode(),
        momoConfig.getRedirectUrl(), requestId
    );

    String signature = HmacSHA256(momoConfig.getSecretKey(), rawSignature);
    // Gọi MoMo API → nhận payUrl
}
```

---

## 6. Scheduled Jobs

```java
@Component
public class SubscriptionJobService {

    // Chạy mỗi giờ — expire subscription hết hạn
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expireSubscriptions() {
        int updated = userSubscriptionRepository.expireOverdue(LocalDateTime.now());
        // UPDATE user_subscriptions SET status='EXPIRED' WHERE status='ACTIVE' AND expires_at < NOW()
        log.info("Expired {} subscriptions", updated);
        // Không cần xóa Redis vip:status ở đây vì cache TTL 5 phút tự hết hạn
    }

    // Chạy mỗi 5 phút — expire payment quá 15 phút chưa thanh toán
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void expireStalePayments() {
        List<Long> expiredSubIds = paymentRepository.findExpiredPendingSubIds(LocalDateTime.now());
        // SELECT subscription_id FROM payments WHERE status='PENDING' AND expired_at < NOW()

        paymentRepository.bulkExpire(LocalDateTime.now());
        // UPDATE payments SET status='EXPIRED' WHERE status='PENDING' AND expired_at < NOW()

        if (!expiredSubIds.isEmpty()) {
            userSubscriptionRepository.bulkCancel(expiredSubIds);
            // UPDATE user_subscriptions SET status='CANCELLED' WHERE id IN (...)
        }
    }
}
```

---

## 7. isVip Check (Dùng Bởi Module Khác)

```java
// UserSubscriptionRepository.java
@Query("""
    SELECT EXISTS (
        SELECT 1 FROM UserSubscription s
        WHERE s.userId = :userId
          AND s.status = 'ACTIVE'
          AND s.expiresAt > :now
    )
""")
boolean isVipActive(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

// SubscriptionService.java — có cache Redis
public boolean isVipActive(UUID userId) {
    String cacheKey = "vip:status:" + userId;
    Boolean cached = redisService.get(cacheKey, Boolean.class);
    if (cached != null) return cached;

    boolean result = subscriptionRepository.isVipActive(userId, LocalDateTime.now());
    redisService.set(cacheKey, result, Duration.ofMinutes(5));
    return result;
}

// ⚠️ Phải gọi khi subscription activated hoặc expired:
redisService.delete("vip:status:" + userId);
```

---

## 8. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | Gói không tồn tại |
| `PLAN_NOT_ACTIVE` | 400 | Gói đang bị ẩn |
| `EMAIL_NOT_VERIFIED` | 403 | Cần xác thực email trước khi mua VIP |
| `PAYMENT_NOT_FOUND` | 404 | Không tìm thấy giao dịch |
| `PAYMENT_ALREADY_PROCESSED` | 409 | Giao dịch đã xử lý (idempotency) |
| `INVALID_SIGNATURE` | 400 | Chữ ký từ gateway không hợp lệ |
| `VIP_REQUIRED` | 403 | Cần VIP để thực hiện hành động này |
