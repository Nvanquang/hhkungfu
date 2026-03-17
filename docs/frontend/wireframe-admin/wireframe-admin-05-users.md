# Wireframe — Admin User Management
**Route:** `/admin/users`
**File:** `pages/admin/UserList.tsx`

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Quản lý Người dùng                                           │
│          │                                                               │
│          │  ┌─── FILTER BAR ──────────────────────────────────────────┐ │
│          │  │  🔍 Tìm email hoặc username...  [Role ▾] [Trạng thái ▾] │ │
│          │  │                                                12,400 users│
│          │  └─────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── TABLE ───────────────────────────────────────────────┐ │
│          │  │  Avatar  Thông tin              Role   Status   Ngày tạo ⋮│ │
│          │  │  ──────────────────────────────────────────────────────  │ │
│          │  │                                                            │ │
│          │  │  [av]  naruto_fan               USER   ● Hoạt động        │ │
│          │  │        naruto@example.com               10/01/2026   [⋮]  │ │
│          │  │                                                            │ │
│          │  │  [av]  anime_admin              ADMIN  ● Hoạt động        │ │
│          │  │        admin@hhkungfu.com                 01/01/2026   [⋮]  │ │
│          │  │                                                            │ │
│          │  │  [av]  spammer_123              USER   ✕ Bị khóa          │ │
│          │  │        spam@mail.com                    05/03/2026   [⋮]  │ │
│          │  │                                                            │ │
│          │  │  [av]  sakura_watcher           USER   ● Hoạt động        │ │
│          │  │        sakura@mail.com                  08/02/2026   [⋮]  │ │
│          │  │  ...                                                       │ │
│          │  │  ──────────────────────────────────────────────────────  │ │
│          │  │  Trang 1/621          ← 1  2  3  ...  621 →  20/trang ▾  │ │
│          │  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

--- DROPDOWN [⋮] ---
┌──────────────────────────┐
│  👤  Xem profile         │
│  🛡  Đặt làm Admin       │  ← Nếu đang là USER
│  👤  Hạ xuống User       │  ← Nếu đang là ADMIN
│  🔒  Khóa tài khoản      │  ← Nếu đang Hoạt động  (màu vàng)
│  🔓  Mở khóa             │  ← Nếu đang Bị khóa    (màu xanh)
└──────────────────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  ☰  Quản lý Người dùng           │
├──────────────────────────────────┤
│  🔍 Tìm email, username...       │
│  [Role ▾]        [Trạng thái ▾]  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [av]  naruto_fan  USER  ●  │  │
│  │       naruto@example.com   │  │
│  │       Tham gia 10/01/2026  │  │
│  │                       [⋮]  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ [av]  spammer_123  USER  ✕ │  │  ← ✕ đỏ = bị khóa
│  │       spam@mail.com        │  │
│  │       Tham gia 05/03/2026  │  │
│  │                       [⋮]  │  │
│  └────────────────────────────┘  │
│  ...                             │
│  ← 1  2  3  ...  →              │
└──────────────────────────────────┘
```

---

## CONFIRM DIALOGS

### Khóa tài khoản

```
┌──────────────────────────────────────────────┐
│  Khóa tài khoản                              │
│  ────────────────────────────────────────    │
│  Bạn có chắc muốn khóa tài khoản của         │
│  naruto_fan (naruto@example.com)?             │
│                                              │
│  Người dùng sẽ không thể đăng nhập cho       │
│  đến khi được mở khóa.                       │
│                                              │
│  [Hủy]                     [Khóa tài khoản] │
└──────────────────────────────────────────────┘
```

### Thay đổi Role

```
┌──────────────────────────────────────────────┐
│  Thay đổi quyền                              │
│  ────────────────────────────────────────    │
│  Bạn có chắc muốn cấp quyền ADMIN cho        │
│  naruto_fan?                                  │
│                                              │
│  Admin có toàn quyền quản lý nội dung        │
│  và người dùng trên hệ thống.                │
│                                              │
│  [Hủy]                       [Xác nhận]      │
└──────────────────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Avatar:** hiển thị ảnh nếu có, fallback là chữ cái đầu username (bg màu ngẫu nhiên cố định theo userId)
- **Badge Role:** `ADMIN` = tím (màu nổi bật), `USER` = xám
- **Badge Status:** `● Hoạt động` = xanh lá, `✕ Bị khóa` = đỏ
- **Dropdown [⋮]** thay đổi option tùy trạng thái hiện tại của user (không hiện option không hợp lệ)
- **Không thể khóa hoặc hạ role** chính mình (admin đang đăng nhập) — disable option + tooltip
- **Tìm kiếm:** debounce 300ms, tìm theo cả email lẫn username cùng lúc
- **Phân trang:** 20 user/trang, tổng có thể lên tới hàng nghìn trang nên dùng input số trang trực tiếp thay vì hiển thị tất cả số trang
