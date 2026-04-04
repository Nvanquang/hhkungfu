# Wireframe — Admin Analytics
**Route:** `/admin/analytics`
**File:** `pages/admin/Analytics.tsx`

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Analytics                                                    │
│          │                                                               │
│          │  ┌─── FILTER ─────────────────────────────────────────────┐ │
│          │  │  Khoảng thời gian:  [Hôm nay]  [7 ngày]  [30 ngày] ←  │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── SUMMARY CARDS ──────────────────────────────────────┐ │
│          │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│          │  │  │ 180,000  │ │   315    │ │14,850,000│ │  1,248   │  │ │
│          │  │  │ Lượt xem │ │Users mới │ │Doanh thu │ │VIP active│  │ │
│          │  │  │  ▲ 12%   │ │  ▲ 8%   │ │  ▲ 23%   │ │  ▲ 5%   │  │ │
│          │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── BIỂU ĐỒ LƯỢT XEM & DOANH THU THEO NGÀY ────────────┐ │
│          │  │  [● Lượt xem]  [● Doanh thu]   ← toggle hiện/ẩn line  │ │
│          │  │                                                          │ │
│          │  │  30k │                    ●                             │ │
│          │  │  25k │              ●  ●     ●                          │ │
│          │  │  20k │           ●              ●                       │ │
│          │  │  15k │        ●                    ●                    │ │
│          │  │  10k │──────────────────────────────────────────────   │ │
│          │  │       T2   T3   T4   T5   T6   T7   CN                 │ │
│          │  │  Hover tooltip: "T5 — 28,000 lượt xem · 3,500,000đ"   │ │
│          │  │                                    (Recharts LineChart) │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── SUBSCRIPTION ──────────────────────────────────────┐  │
│          │  │  Doanh thu theo gói (7 ngày)         Cổng thanh toán   │  │
│          │  │                                                         │  │
│          │  │  VIP 1 Tháng  2,950,000đ  ████░░░░  50 đơn            │  │
│          │  │  VIP 3 Tháng  7,450,000đ  ████████  50 đơn            │  │
│          │  │  VIP 1 Năm    4,490,000đ  ██████░░   9 đơn            │  │
│          │  │                                                         │  │
│          │  │  VNPay  ████████████████████  92%                      │  │
│          │  │  MoMo   ████  8%                                        │  │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── TOP ANIME ──────────────────┐ ┌─── TOP GENRE ───────┐ │
│          │  │  #  Anime            Views      │ │  Thể loại   Views  │ │
│          │  │  ─────────────────────────────  │ │  ─────────────────  │ │
│          │  │  1  Naruto           42,000     │ │  Action     95,000 │ │
│          │  │     ████████████     23.3%      │ │  ██████     52.8%  │ │
│          │  │  2  Jujutsu Kaisen   38,500     │ │  Shounen    60,000 │ │
│          │  │     ███████████      21.4%      │ │  █████      33.3%  │ │
│          │  │  3  One Piece        35,200     │ │  Fantasy    25,000 │ │
│          │  │     ██████████       19.6%      │ │  ████       13.9%  │ │
│          │  │  4  Attack on Titan  29,800     │ │  ...               │ │
│          │  │  5  Demon Slayer     27,100     │ └────────────────────┘ │
│          │  │  ...                            │                         │
│          │  └────────────────────────────────┘                         │
│          │                                                               │
│          │  ┌─── BÌNH LUẬN & ĐÁNH GIÁ ──────────────────────────────┐ │
│          │  │  ┌───────────────────────┐  ┌──────────────────────┐   │ │
│          │  │  │  Bình luận mới        │  │  Đánh giá mới        │   │ │
│          │  │  │  1,240   ▲ 18%        │  │  320   ▲ 5%          │   │ │
│          │  │  └───────────────────────┘  └──────────────────────┘   │ │
│          │  │                                                          │ │
│          │  │  Top tập nhiều bình luận nhất                           │ │
│          │  │  JJK · Tập 3         128 bình luận  ████████████       │ │
│          │  │  AOT · Tập 87         95 bình luận  █████████          │ │
│          │  │  One Piece · Tập 1100  72 bình luận  ███████           │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── VIDEO PIPELINE STATUS ─────────────────────────────┐  │
│          │  │  ✅ 1,230 (99.2%)   ✕ 8 (0.6%)   ⏳ 2   Tổng: 1,240  │  │
│          │  │                                                          │  │
│          │  │  Jobs lỗi gần đây:                                      │  │
│          │  │  ep#203 JJK — FFmpeg error: Invalid codec  09/03  [↺]  │  │
│          │  │  ep#89  OP  — File corrupted               08/03  [↺]  │  │
│          │  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  ☰  Analytics                    │
├──────────────────────────────────┤
│  [Hôm nay]  [7 ngày]  [30 ngày] │
├──────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐        │
│  │ 180,000 │  │   315   │        │
│  │ Lượt xem│  │Users mới│        │
│  │  ▲ 12%  │  │  ▲ 8%  │        │
│  └─────────┘  └─────────┘        │
│  ┌─────────┐  ┌─────────┐        │
│  │ 14,850K │  │  1,248  │        │
│  │Doanh thu│  │VIP activ│        │
│  │  ▲ 23%  │  │  ▲ 5%  │        │
│  └─────────┘  └─────────┘        │
├──────────────────────────────────┤
│  Lượt xem & Doanh thu            │
│  [● Views]  [● Revenue]          │
│  ┌────────────────────────────┐  │
│  │   [LineChart - Recharts]   │  │
│  │   overflow-x: scroll       │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Subscription (7 ngày)           │
│  VIP 1T  2,950,000đ  ████░░  50đ │
│  VIP 3T  7,450,000đ  ████████ 50đ│
│  VIP 1N  4,490,000đ  ██████░   9đ│
│  VNPay  ████████████████  92%    │
│  MoMo   ████  8%                 │
├──────────────────────────────────┤
│  Top Anime (7 ngày)              │
│  1  Naruto            42,000 ████│
│  2  Jujutsu Kaisen    38,500 ███ │
│  3  One Piece         35,200 ███ │
│  4  Attack on Titan   29,800 ██  │
│  5  Demon Slayer      27,100 ██  │
├──────────────────────────────────┤
│  Top Genre                       │
│  Action   95,000  ██████         │
│  Shounen  60,000  ████           │
│  Fantasy  25,000  ██             │
├──────────────────────────────────┤
│  Bình luận & Đánh giá            │
│  💬 1,240 bình luận   ▲ 18%      │
│  ⭐ 320 đánh giá      ▲ 5%       │
│                                  │
│  Top tập nhiều bình luận:        │
│  JJK · T.3       128  ████████  │
│  AOT · T.87       95  ██████    │
│  OP  · T.1100     72  █████     │
├──────────────────────────────────┤
│  Video Pipeline                  │
│  ✅ 1,230  ✕ 8  ⏳ 2  (1,240)   │
│                                  │
│  Jobs lỗi gần đây:               │
│  ep#203 JJK — Invalid codec [↺]  │
│  ep#89  OP  — Corrupted     [↺]  │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Bộ lọc thời gian:** 3 nút toggle (Hôm nay / 7 ngày / 30 ngày), active state rõ ràng — fetch lại toàn bộ data khi đổi
- **4 summary cards:** số to + delta % so kỳ trước (▲ xanh lá = tăng, ▼ đỏ = giảm), desktop 4 card 1 hàng, mobile 2×2
- **Biểu đồ dual-line:** `Recharts LineChart` với 2 line views + revenue, click legend để toggle ẩn/hiện từng line, tooltip hover hiện cả 2 giá trị cùng lúc
- **Subscription section:** progress bar ngang thể hiện tỉ lệ doanh thu từng gói, tỉ lệ gateway VNPay/MoMo dạng bar đơn giản
- **Top Anime / Top Genre:** thanh progress bar màu nền nhạt thể hiện tỉ lệ % trực quan, click tên anime → `/admin/anime?id=xxx`
- **Bình luận & Đánh giá:** top tập nhiều bình luận nhất giúp admin biết đâu là tập đang "hot" cần kiểm duyệt, click → `/admin/comments?episodeId=xxx`
- **Video Pipeline:** jobs lỗi có nút [↺] Retry gọi lại API transcode, click tên ep → `/admin/episodes/:id`
- **Mobile chart:** wrapper `overflow-x-auto` để scroll ngang khi filter 30 ngày
- Không cần export CSV — dự án sinh viên, chỉ cần hiển thị số liệu cơ bản
