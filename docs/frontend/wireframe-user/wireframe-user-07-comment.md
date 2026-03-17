# Wireframe — User · Comment
**Vị trí:** Embedded dưới video player trên `/watch/:slug/:ep`
**File:** `components/CommentSection.tsx`

---

## DESKTOP (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  NHẬN XÉT  (128 bình luận)                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ─── Ô NHẬP BÌNH LUẬN ───────────────────────────────────────────────────  │
│                                                                              │
│  ┌────┐  ┌──────────────────────────────────────────────────────────────┐  │
│  │[Av]│  │  Viết bình luận...                                           │  │
│  │    │  │                                                               │  │
│  │    │  └──────────────────────────────────────────────────────────────┘  │
│  └────┘     (Placeholder khi chưa đăng nhập: "Đăng nhập để bình luận")     │
│                                                              [Gửi]          │
│                                                                              │
│  ─── DANH SÁCH BÌNH LUẬN ────────────────────────────────────────────────  │
│                                                                              │
│  [Mới nhất ▾]                                                               │
│                                                                              │
│  ── Bình luận được ghim ────────────────────────────────────────────────   │  ← pinned, admin
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  📌 (pin icon)                                                        │  │
│  │  ┌────┐  Admin Hhkungfu                             ✨ VIP  · 2 ngày   │  │
│  │  │[Av]│  ─────────────────────────────────────────────────────────── │  │
│  │  │    │  Tập này mở màn cho arc quan trọng nhất! Hãy để lại cảm      │  │
│  │  └────┘  nhận của bạn phía dưới nhé 🔥                               │  │
│  │                                                                        │  │
│  │            ♡ 245  [Thích]   [Phản hồi]                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ── Bình luận (127) ────────────────────────────────────────────────────   │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────┐  naruto_fan                                ✨ VIP  · 1 giờ   │  │
│  │  │[Av]│  ─────────────────────────────────────────────────────────── │  │
│  │  │    │  Gojo Satoru xuất hiện ở cuối tập này... OMG không thể tin!  │  │
│  │  └────┘  Scene đó animate đẹp vãi 😭🔥                               │  │
│  │                                                                        │  │
│  │          ♡ 48  [Thích]   [Phản hồi]   [⋮]                           │  │  ← 3 chấm: sửa/xóa (owner)
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐    │  │
│  │  │  REPLIES (2)  [Thu gọn ▲]                                     │    │  │  ← replies section
│  │  │                                                               │    │  │
│  │  │  ┌───┐  sasuke_uchiha              ✨ VIP  · 45 phút         │    │  │
│  │  │  │[Av│  ──────────────────────────────────────────────────── │    │  │
│  │  │  │   │  @naruto_fan Đồng ý! Cảnh đó là highlight của tập 🙌 │    │  │
│  │  │  └───┘  ♡ 12  [Thích]   [⋮]                                 │    │  │
│  │  │                                                               │    │  │
│  │  │  ┌───┐  sakura_blossom                          · 20 phút   │    │  │
│  │  │  │[Av│  ──────────────────────────────────────────────────── │    │  │
│  │  │  │   │  @naruto_fan Scene Gojo không thể không wow 👏        │    │  │
│  │  │  └───┘  ♡ 8   [Thích]   [⋮]                                 │    │  │
│  │  │                                                               │    │  │
│  │  │  ┌───┐  ┌──────────────────────────────────────────────┐    │    │  │
│  │  │  │[Av│  │  @naruto_fan  Phản hồi...              [Gửi] │    │    │  │
│  │  │  └───┘  └──────────────────────────────────────────────┘    │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────┐  megumi_fushiguro                               · 2 giờ      │  │
│  │  │[Av]│  ─────────────────────────────────────────────────────────── │  │
│  │  │    │  Animation quality của MAPPA tập này đỉnh thật sự. Trận      │  │
│  │  └────┘  chiến cuối tập... 10 điểm không hỏi!                       │  │
│  │                                                                        │  │
│  │          ♡ 31  [Thích]   [Phản hồi]   [⋮]                           │  │
│  │                                                                        │  │
│  │  ── 5 phản hồi  [Xem phản hồi ▼]                                    │  │  ← collapsed
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────┐  itadori_yuji                                 · 3 giờ        │  │
│  │  │[Av]│  ─────────────────────────────────────────────────────────── │  │
│  │  │    │  Ai đây mới xem lần đầu không? Recommend luôn!              │  │
│  │  └────┘                                                               │  │
│  │          ♡ 19  [Thích]   [Phản hồi]   [⋮]                           │  │
│  │                                                                        │  │
│  │  ── Không có phản hồi  [Phản hồi]                                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                      [Xem thêm 120 bình luận]                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

--- Menu ⋮ (của chính chủ comment) ---
┌───────────────┐
│  ✏️  Chỉnh sửa │
│  🗑  Xóa       │
└───────────────┘

--- Menu ⋮ (của comment người khác) ---
┌─────────────────┐
│  🚩  Báo cáo   │
└─────────────────┘

--- State: Đang chỉnh sửa comment ---
│  ┌────┐  naruto_fan                                         ✏️ Đang sửa  │
│  │[Av]│  ────────────────────────────────────────────────────────────── │
│  │    │  ┌──────────────────────────────────────────────────────────┐   │
│  │    │  │  Gojo Satoru xuất hiện ở cuối tập...  [đang sửa text]   │   │
│  │    │  └──────────────────────────────────────────────────────────┘   │
│  └────┘       [Hủy]   [Lưu thay đổi]                                   │

--- State: Chưa đăng nhập ---
│  [Đăng nhập]  để viết bình luận và tương tác với cộng đồng              │
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  NHẬN XÉT  (128)     [Mới nhất▾]│
│  ─────────────────────────────   │
│                                  │
│  ┌──┐  ┌──────────────────────┐ │
│  │Av│  │ Viết bình luận...    │ │
│  └──┘  └──────────────────────┘ │
│                          [Gửi]   │
│                                  │
│  ── Ghim ─────────────────────  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📌  Admin Hhkungfu  · 2ng   │  │
│  │                            │  │
│  │ Tập này mở màn arc quan    │  │
│  │ trọng nhất! 🔥             │  │
│  │                            │  │
│  │ ♡ 245  [Thích] [Phản hồi] │  │
│  └────────────────────────────┘  │
│                                  │
│  ── Bình luận ─────────────────  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ┌──┐ naruto_fan ✨ · 1h   │  │
│  │ │Av│ Gojo Satoru xuất hiện │  │
│  │ └──┘ ở cuối tập... OMG!🔥 │  │
│  │                            │  │
│  │ ♡ 48  [Thích] [Phản hồi]  │  │  ← 3 chấm: long press
│  │                            │  │
│  │  ── 2 phản hồi [Xem ▼]   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ┌──┐ megumi_fushi · 2h    │  │
│  │ │Av│ Animation quality    │  │
│  │ └──┘ MAPPA tập này đỉnh! │  │
│  │                            │  │
│  │ ♡ 31  [Thích] [Phản hồi]  │  │
│  │  ── 5 phản hồi [Xem ▼]   │  │
│  └────────────────────────────┘  │
│                                  │
│  [Xem thêm 120 bình luận]       │
└──────────────────────────────────┘

--- Mobile: Phản hồi (expanded) ---
│  ┌────────────────────────────┐  │
│  │ ┌──┐ naruto_fan ✨ · 1h   │  │
│  │ │Av│ Gojo Satoru xuất hiện │  │
│  │ └──┘ OMG không thể tin!🔥 │  │
│  │ ♡ 48  [Thích] [Phản hồi]  │  │
│  │                            │  │
│  │  ── Phản hồi (2) [▲] ───  │  │
│  │                            │  │
│  │  ┌─┐ sasuke_u · 45p       │  │
│  │  │A│ @naruto_fan Đồng ý! │  │
│  │  └─┘ ♡ 12  [Thích]        │  │
│  │                            │  │
│  │  ┌─┐ sakura_b · 20p       │  │
│  │  │A│ @naruto_fan Wow 👏   │  │
│  │  └─┘ ♡ 8   [Thích]        │  │
│  │                            │  │
│  │  ┌─┐ ┌──────────────────┐ │  │
│  │  │A│ │@naruto_fan... Gửi│ │  │
│  │  └─┘ └──────────────────┘ │  │
│  └────────────────────────────┘  │

--- Mobile: Bottom sheet "Reply" ---
┌──────────────────────────────────┐
│  ── Phản hồi naruto_fan ──── ✕  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ @naruto_fan Phản hồi...    │  │
│  └────────────────────────────┘  │
│                          [Gửi]   │
└──────────────────────────────────┘
```

---

## STATES & INTERACTIONS

### Like Toggle
```
Chưa thích:   ♡ 48   [Thích]
Đang thích:   ♥ 49   [Đã thích]   ← filled, màu primary
→ Click lại:  ♡ 48   [Thích]      (toggle bỏ like)
```

### Load Replies
```
── 5 phản hồi  [Xem phản hồi ▼]   (collapsed)
  → click →
── Phản hồi (5)  [Thu gọn ▲]      (expanded, fetch /comments/:id/replies)
   [reply 1]
   [reply 2]
   ...
```

### Nhập comment
```
Trạng thái rỗng:
  Placeholder "Viết bình luận..."
  Nút [Gửi] disabled (mờ)

Khi đang gõ:
  Nút [Gửi] enabled
  Đếm ký tự: xxx/500

Khi gửi:
  Optimistic insert lên đầu danh sách
  Hiện spinner nhỏ trên nút [Gửi]
  Nếu lỗi: hoàn tác optimistic + toast error
```

### Phân trang / Load more
```
Lần đầu: hiện 10 comment đầu
[Xem thêm N bình luận] → load thêm 10
Sau khi hết: ẩn nút "Xem thêm"
```

### Chưa đăng nhập
```
Ô nhập bình luận: disabled, placeholder đổi thành
"Đăng nhập để bình luận"
Click vào ô → navigate to /login?redirect=current_url
Nút [Thích] / [Phản hồi]: click → toast "Đăng nhập để tương tác"
```

---

## Ghi Chú Thiết Kế

### Cấu Trúc Comment
- Chỉ 1 cấp reply (root → reply), không có nested reply
- Reply hiển thị thụt lề trái, border trái màu nhạt
- Pinned comment luôn ở đầu, có icon 📌 và badge "Ghim"

### Avatar
- Mặc định: initials (chữ cái đầu username) trên nền màu ngẫu nhiên
- VIP user: viền avatar gradient vàng/tím
- Admin: badge ⚙ nhỏ dưới góc avatar

### Badge VIP trên comment
- Text "✨ VIP" màu vàng nhỏ, nằm cạnh username
- Giúp phân biệt thành viên VIP trong cộng đồng

### Timestamp
- < 60s → "Vừa xong"
- < 60m → "X phút trước"
- < 24h → "X giờ trước"
- < 7d  → "X ngày trước"
- Còn lại → "DD/MM/YYYY"
- Hover timestamp → tooltip full datetime

### Scroll Behavior (Desktop)
- Comment section nằm ngoài player area, cuộn trang thường
- Không fixed, không nằm trong sidebar episode list

### Keyboard
- Ctrl + Enter → submit comment/reply (desktop)
- Escape → hủy reply / hủy edit
