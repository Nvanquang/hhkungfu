# Báo cáo Cập nhật Bảo mật (Security Fixes Report)

**Ngày cập nhật:** 17/03/2026  
**Phạm vi:** Backend Spring Boot (Authentication & Authorization)  
**Cơ sở thực hiện:** OWASP Top 10 & SECURITY-AUDIT.md  

Tài liệu này tổng hợp chi tiết các lỗ hổng bảo mật đã được phát hiện và các giải pháp đã được thực thi trên source code để khắc phục.

---

## 1. OTP Brute Force (Mức độ: CAO 🔥)

**Lỗ hổng:** 
Hệ thống không giới hạn số lần xác thực OTP sai. Kẻ tấn công có thể dùng bot để brute-force 1 triệu trường hợp (6 số) của mã OTP trong thời hạn 10 phút, chiếm đoạt tài khoản dễ dàng qua tính năng Quên mật khẩu.

**File đã thay đổi:**
- `com.hhkungfu.backend.common.constant.RedisKeys.java`
- `com.hhkungfu.backend.module.auth.service.OtpService.java`

**Chi tiết giải pháp:**
- Bổ sung đếm số lần nhập sai OTP (Attempt Counter) được lưu trữ trên Redis sử dụng key `otp:attempt:{userId}:{otpType}` với TTL là 10 phút.
- Giới hạn tối đa **5 lần thử**. Nếu vượt quá 5 lần, hệ thống sẽ ném ra ngoại lệ `AuthException (TOO_MANY_REQUESTS)`.
- Xóa bộ đếm trên Redis sau khi xác minh OTP thành công.

---

## 2. Lỗ hổng cấu hình Refresh Token Cookie (Mức độ: TRUNG BÌNH 🟠)

**Lỗ hổng:** 
- `maxAge` của Refresh Token cookie bị set nhầm thành tuổi thọ của Access Token (rất ngắn), làm hỏng tính năng "Duy trì đăng nhập".
- Thiếu cờ `SameSite=Strict`, khiến endpoint `/refresh` dễ bị tấn công CSRF (Cross-Site Request Forgery) khi ứng dụng chạy với cấu hình `withCredentials = true`.

**File đã thay đổi:**
- `com.hhkungfu.backend.module.auth.controller.AuthController.java`

**Chi tiết giải pháp:**
- Chỉnh sửa phương thức `buildRefreshTokenCookie()`:
  - Cập nhật biến cấu hình `maxAge` thành `refreshTokenExpiration` (7 ngày).
  - Thêm thuộc tính `.sameSite("Strict")` để trình duyệt chỉ gửi cookie khi request xuất phát từ chính domain của ứng dụng.

---

## 3. Lộ lọt Access Token qua URL OAuth2 (Mức độ: TRUNG BÌNH 🟠)

**Lỗ hổng:** 
- Sau khi đăng nhập Google thành công, hệ thống gửi thẳng `AccessToken` về frontend qua Query Parameter của URL (ví dụ: `?token=...`). Các tham số này dễ dàng bị ghi lại trong lịch sử trình duyệt hoặc các proxy trung gian.
- Backend tạo `RefreshToken` trên Redis nhưng **quên không gửi** HttpOnly cookie cho người dùng đăng nhập bằng OAuth2, khiến họ bị văng ra ngoài ngay khi Access Token hết hạn.

**File đã thay đổi:**
- `com.hhkungfu.backend.config.OAuth2LoginSuccessHandler.java`

**Chi tiết giải pháp:**
- Cấu hình và thêm HttpOnly `refresh_token` cookie hoàn chỉnh (tương tự như đăng nhập cục bộ) gửi về header của Response.
- Thay vì truyền token trên Query Parameter (`?token=`), token hiện được gắn qua URL Fragment (`#token=`). Việc này an toàn hơn do trình duyệt *không* gửi fragment (`#`) lên network layer hay proxy server tiếp theo.

---

## 4. JWT không bị vô hiệu hóa khi Đăng xuất (Mức độ: THẤP / TRUNG BÌNH 🟡)

**Lỗ hổng:** 
Do tính chất Stateless của JWT, khi user ấn "Logout" hoặc đổi mật khẩu, ứng dụng mới chỉ xóa Refresh Token. Tuy nhiên, Access Token trên tay hacker (nếu bị lộ) vẫn dùng được bình thường cho tới thời điểm hết hạn tự nhiên.

**File đã thay đổi:**
- `application.yaml` (Hoặc `SecurityUtil.java` constant)
- `com.hhkungfu.backend.common.util.SecurityUtil.java`
- `com.hhkungfu.backend.module.auth.service.AuthService.java`
- `com.hhkungfu.backend.config.SecurityJwtConfiguration.java`

**Chi tiết giải pháp:**
1. **Giảm vòng đời Access Token**: Giá trị default `access-token-validity-in-seconds` được điều chỉnh giảm từ 24 tiếng (86400) xuống còn 15 phút (900s).
2. **Kỹ thuật Blacklist Logout timestamp**: 
   - Trong phương thức `logout()` của `AuthService.java`, ghi nhận lại *Thời điểm đăng xuất cuối cùng (Logout Timestamp)* của user lên Redis (`user:logout:{userId}`).
   - Bổ sung một `OAuth2TokenValidator` tùy chỉnh vào cấu hình `JwtDecoder` (`SecurityJwtConfiguration.java`). Khi frontend gọi API với một JWT, hệ thống sẽ đối chiếu `issuedAt` (Thời điểm phát hành) của token so với Logout Timestamp của người dùng đó (nếu có). 
   - Nếu Token được phát hành **trước** lệnh Logout gần nhất => Từ chối (Lỗi invalid_token).
