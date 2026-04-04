# Wireframe — Admin · Kiểm Duyệt Bình Luận & Đánh Giá
**Route:** `/admin/comments`
**File:** `pages/admin/CommentModeration.tsx`

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Kiểm duyệt Bình luận & Đánh giá                            │
│          │                                                               │
│          │  TABS: [Bình luận]  [Đánh giá]                              │
│          │  ─────────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### TAB 1 — BÌNH LUẬN (`comments`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │                                                               │
│          │  Bình luận                                                   │
│          │                                                               │
│          │  ┌─── FILTER ───────────────────────────────────────────┐   │
│          │  │  🔍 Tìm nội dung, username...                         │   │
│          │  │  Anime: [Tất cả ▾]   Loại: [Tất cả ▾]  [Đã xóa ▾]  │   │
│          │  │                                   Tổng: 48,291 bình luận│
│          │  └──────────────────────────────────────────────────────┘   │
│          │                                                               │
│          │  Loại filter:                                                 │
│          │  [Tất cả] [Root] [Reply] [Đã bị xóa] [Được ghim]           │
│          │                                                               │
│          │  ┌─── TABLE ────────────────────────────────────────────┐   │
│          │  │  User          Nội dung            Tập       Lượt ♡  Action│
│          │  │  ──────────────────────────────────────────────────── │   │
│          │  │                                                         │   │
│          │  │  📌 [av] Admin  Tập này mở màn arc  JJK · T.3  245   [⋮]│   │  ← ghim
│          │  │  AnimEx         quan trọng nhất!...  2 ngày trước        │   │
│          │  │                                                         │   │
│          │  │  [av] naruto_fan Gojo Satoru xuất    JJK · T.3   48   [⋮]│   │
│          │  │                  hiện ở cuối tập...  1 giờ trước          │   │
│          │  │                  └─ 2 replies                             │   │
│          │  │                                                         │   │
│          │  │  [av] megumi_f   Animation MAPPA     JJK · T.3   31   [⋮]│   │
│          │  │                  tập này đỉnh thật.. 2 giờ trước          │   │
│          │  │                  └─ 5 replies                             │   │
│          │  │                                                         │   │
│          │  │  ~~[av] spammer  Xem phim lậu tại~~  AOT · T.87   0   [⋮]│   │  ← đã xóa
│          │  │  ~~123           website xxx.com~~   ~~3 giờ trước~~      │   │  ← strikethrough
│          │  │                                                         │   │
│          │  │  [av] sakura_b   Scene cuối tập này  DS · T.44    19   [⋮]│   │
│          │  │                  quá đẹp 😭          5 giờ trước          │   │
│          │  │  ...                                                    │   │
│          │  │  ──────────────────────────────────────────────────   │   │
│          │  │  Trang 1/2415         ← 1  2  3  ...  2415 →          │   │
│          │  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

--- DROPDOWN [⋮] (comment bình thường) ---
┌─────────────────────────────┐
│  📌  Ghim bình luận         │  ← nếu chưa ghim
│  📌  Bỏ ghim                │  ← nếu đang ghim
│  🔗  Xem tập phim liên quan │  → navigate /watch/:slug/:ep
│  🗑  Xóa bình luận          │  ← soft delete, màu đỏ
└─────────────────────────────┘

--- DROPDOWN [⋮] (comment đã xóa) ---
┌─────────────────────────────┐
│  🔗  Xem tập phim liên quan │
│  (Đã xóa — không thể khôi) │  ← text mờ, disabled
└─────────────────────────────┘

--- DIALOG: Xác nhận xóa ---
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠️  Xóa bình luận?                                             [✕]  │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Bình luận của naruto_fan:                                            │
│  "Gojo Satoru xuất hiện ở cuối tập này... OMG không thể tin!"        │
│                                                                       │
│  Bình luận này có 2 replies — tất cả replies cũng sẽ bị ẩn.         │
│                                                                       │
│                               [Hủy]    [Xóa]                        │
└──────────────────────────────────────────────────────────────────────┘

--- DIALOG: Xem chi tiết comment + replies ---
┌──────────────────────────────────────────────────────────────────────┐
│  Chi tiết bình luận                                             [✕]  │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  [av] naruto_fan  ✨ VIP              JJK · Tập 3 · 1 giờ trước     │
│  "Gojo Satoru xuất hiện ở cuối tập này... OMG không thể tin!         │
│   Scene đó animate đẹp vãi 😭🔥"                                     │
│  ♡ 48 lượt thích                                                     │
│                                                                       │
│  ─── Replies (2) ─────────────────────────────────────────────────  │
│                                                                       │
│  [av] sasuke_u · 45 phút                                            │
│  "@naruto_fan Đồng ý! Cảnh đó là highlight của tập 🙌"              │
│  ♡ 12    [🗑 Xóa]                                                    │
│                                                                       │
│  [av] sakura_b · 20 phút                                            │
│  "@naruto_fan Scene Gojo không thể không wow 👏"                     │
│  ♡ 8     [🗑 Xóa]                                                    │
│                                                                       │
│  Actions:  [📌 Ghim]  [🗑 Xóa comment gốc]  [🔗 Xem tập]           │
└──────────────────────────────────────────────────────────────────────┘
```

---

### TAB 2 — ĐÁNH GIÁ (`ratings`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │                                                               │
│          │  Đánh giá                                                    │
│          │                                                               │
│          │  ┌─── FILTER ───────────────────────────────────────────┐   │
│          │  │  🔍 Tìm tên anime...   Điểm: [Tất cả ▾]              │   │
│          │  │                                    Tổng: 62,840 đánh giá│
│          │  └──────────────────────────────────────────────────────┘   │
│          │                                                               │
│          │  ┌─── TABLE THEO ANIME ─────────────────────────────────┐   │
│          │  │  #   Anime              TB      Số đánh giá  Phân phối│   │
│          │  │  ──────────────────────────────────────────────────── │   │
│          │  │                                                         │   │
│          │  │  1   Jujutsu Kaisen     8.66    2,400        [Xem ▼]  │   │
│          │  │      ████████████░░  (histogram thu nhỏ)               │   │
│          │  │                                                         │   │
│          │  │  2   Attack on Titan   9.04    3,120        [Xem ▼]  │   │
│          │  │      █████████████░░                                   │   │
│          │  │                                                         │   │
│          │  │  3   Naruto Shippuden  8.43    4,800        [Xem ▼]  │   │
│          │  │      ████████████░░░                                   │   │
│          │  │                                                         │   │
│          │  │  4   Demon Slayer      8.73    1,950        [Xem ▼]  │   │
│          │  │      ████████████░░                                    │   │
│          │  │  ...                                                    │   │
│          │  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

--- Expand [Xem ▼] — Phân phối điểm theo anime ---
┌──────────────────────────────────────────────────────────────────────┐
│  Jujutsu Kaisen  —  Phân phối đánh giá               [Thu gọn ▲]   │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Điểm TB: 8.66 / 10        Tổng: 2,400 đánh giá                    │
│                                                                       │
│  10  ██████████████████  450 (18.8%)                                 │
│   9  ███████████████████████  600 (25.0%)                            │
│   8  ████████████████████████████  750 (31.3%)                       │
│   7  ████████████  320 (13.3%)                                       │
│   6  ████████  180 (7.5%)                                            │
│   5  ████  60  (2.5%)                                                │
│  1-4 ██   40  (1.7%)                                                 │
│                                                                       │
│  Xu hướng: ▲ +0.12 so với tháng trước  (1,800 → 2,400 đánh giá)   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  ☰  Bình luận & Đánh giá        │
├──────────────────────────────────┤
│  [Bình luận]      [Đánh giá]    │
├──────────────────────────────────┤

--- TAB: Bình luận ---
│  🔍 Tìm nội dung, username...   │
│  [Anime ▾]  [Loại ▾]            │
│                                  │
│  [Tất cả][Root][Reply][Đã xóa]  │  ← chips scroll ngang
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📌 Admin AnimEx  JJK·T.3  │  │  ← ghim
│  │ "Tập này mở màn arc..."   │  │
│  │ ♡ 245  2 ngày trước  [⋮]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ naruto_fan       JJK·T.3  │  │
│  │ "Gojo Satoru xuất hiện..." │  │
│  │ ♡ 48 · 2 replies  1h [⋮]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ~~spammer_123   AOT·T.87~~ │  │  ← đã xóa
│  │ ~~"Xem phim lậu tại..."~~  │  │
│  │ ♡ 0  3h trước   [⋮]        │  │
│  └────────────────────────────┘  │
│  ← 1  2  3  ... →               │

--- TAB: Đánh giá ---
│  🔍 Tìm tên anime...            │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Jujutsu Kaisen             │  │
│  │ ⭐ 8.66  ·  2,400 đánh giá │  │
│  │ ████████████░░             │  │
│  │                   [Xem ▼]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Attack on Titan            │  │
│  │ ⭐ 9.04  ·  3,120 đánh giá │  │
│  │ █████████████░░            │  │
│  │                   [Xem ▼]  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

### Tab Bình Luận
- Mặc định sort theo **mới nhất**, có thể đổi sang **nhiều like nhất**
- Comment đã xóa: vẫn hiện trong list với style strikethrough + background đỏ nhạt, để admin biết đã có hành động
- Ghim: mỗi tập chỉ nên ghim 1 comment — khi ghim comment mới, tự bỏ ghim comment cũ (confirm dialog)
- Click row → mở dialog chi tiết xem full content + replies
- Filter "Anime" → dropdown search tên anime (debounce 300ms)

### Tab Đánh Giá
- Read-only — admin không sửa/xóa đánh giá cá nhân
- Histogram ngang mỗi điểm (1–10), màu gradient xanh → đỏ
- Xu hướng so sánh với tháng trước giúp phát hiện review bombing
- Click tên anime → navigate `/admin/anime?search=tên`
