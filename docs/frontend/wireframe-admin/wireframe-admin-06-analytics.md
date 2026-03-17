# Wireframe — Admin Analytics
**Route:** `/admin/analytics`
**File:** `pages/admin/Analytics.tsx`

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Analytics                                                    │
│          │                                                               │
│          │  ┌─── FILTER ─────────────────────────────────────────────┐  │
│          │  │  Khoảng thời gian:  [Hôm nay]  [7 ngày]  [30 ngày] ←  │  │
│          │  └────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌──────────────────────────────┐ ┌──────────────────────┐  │
│          │  │  Tổng lượt xem (7 ngày)       │ │  Users mới (7 ngày)  │  │
│          │  │                               │ │                      │  │
│          │  │  180,000                      │ │  315                 │  │
│          │  │  ▲ 12% so với tuần trước      │ │  ▲ 8% so tuần trước │  │
│          │  └──────────────────────────────┘ └──────────────────────┘  │
│          │                                                               │
│          │  ┌─── BIỂU ĐỒ LƯỢT XEM THEO NGÀY ───────────────────────┐   │
│          │  │  Lượt xem                                              │   │
│          │  │  30k │                    ●                            │   │
│          │  │  25k │              ●  ●     ●                         │   │
│          │  │  20k │           ●              ●                      │   │
│          │  │  15k │        ●                    ●                   │   │
│          │  │  10k │─────────────────────────────────────────────   │   │
│          │  │       T2   T3   T4   T5   T6   T7   CN               │   │
│          │  │                                    (Recharts LineChart)│   │
│          │  └────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ┌─── TOP ANIME ──────────────────┐ ┌─── TOP GENRE ───────┐  │
│          │  │  #  Anime            Views      │ │  Thể loại   Views  │  │
│          │  │  ─────────────────────────────  │ │  ─────────────────  │  │
│          │  │  1  Naruto           42,000     │ │  Action     95,000 │  │
│          │  │     ████████████     23.3%      │ │  ██████     52.8%  │  │
│          │  │  2  Jujutsu Kaisen   38,500     │ │  Shounen    60,000 │  │
│          │  │     ███████████      21.4%      │ │  █████      33.3%  │  │
│          │  │  3  One Piece        35,200     │ │  Fantasy    25,000 │  │
│          │  │     ██████████       19.6%      │ │  ████       13.9%  │  │
│          │  │  4  Attack on Titan  29,800     │ │  ...               │  │
│          │  │  5  Demon Slayer     27,100     │ └────────────────────┘  │
│          │  │  ...                            │                          │
│          │  └────────────────────────────────┘                          │
│          │                                                               │
│          │  ┌─── VIDEO PIPELINE STATUS ──────────────────────────────┐  │
│          │  │  Tổng jobs    ✅ Thành công    ✕ Thất bại    ⏳ Đang chạy│  │
│          │  │  1,240        1,230 (99.2%)    8 (0.6%)      2          │  │
│          │  │                                                           │  │
│          │  │  Jobs thất bại gần đây:                                  │  │
│          │  │  ep#203 JJK — FFmpeg error: Invalid codec  09/03  [Retry]│  │
│          │  │  ep#89 OP  — File corrupted               08/03  [Retry] │  │
│          │  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  ☰  Analytics                    │
├──────────────────────────────────┤
│  [Hôm nay] [7 ngày] [30 ngày]   │
├──────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐        │
│  │ 180,000 │  │  315    │        │
│  │ Lượt xem│  │ Users   │        │
│  │  ▲ 12% │  │  ▲ 8%  │        │
│  └─────────┘  └─────────┘        │
├──────────────────────────────────┤
│  Lượt xem theo ngày              │
│  ┌────────────────────────────┐  │
│  │   [LineChart - Recharts]   │  │
│  │   Cuộn ngang nếu cần       │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Top Anime (7 ngày)              │
│  1  Naruto           42,000 ████ │
│  2  Jujutsu Kaisen   38,500 ███  │
│  3  One Piece        35,200 ███  │
│  4  Attack on Titan  29,800 ██   │
│  5  Demon Slayer     27,100 ██   │
├──────────────────────────────────┤
│  Top Genre                       │
│  Action   95,000  ██████         │
│  Shounen  60,000  ████           │
│  Fantasy  25,000  ██             │
├──────────────────────────────────┤
│  Video Pipeline                  │
│  ✅ 1,230  ✕ 8  ⏳ 2  (1,240)   │
│                                  │
│  Jobs lỗi gần đây:               │
│  ep#203 JJK — Invalid codec [↺]  │
│  ep#89 OP  — Corrupted      [↺]  │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Bộ lọc thời gian:** 3 nút toggle (Hôm nay / 7 ngày / 30 ngày), active state rõ ràng — fetch lại data khi đổi
- **2 summary cards** hàng đầu: số to + delta % so với kỳ trước (▲ xanh lá = tăng, ▼ đỏ = giảm)
- **Biểu đồ lượt xem:** dùng `Recharts LineChart` — responsive, tooltip hover hiện số cụ thể, trục X là ngày
- **Top Anime / Top Genre:** thanh progress bar màu nền nhạt thể hiện tỉ lệ % trực quan
- **Video Pipeline section:** tóm tắt health của hệ thống transcode — jobs lỗi có nút Retry gọi API transcode lại
- **Mobile chart:** wrapper `overflow-x-auto` để scroll ngang khi 30 ngày quá dài
- Không cần export CSV / báo cáo phức tạp — đây là dự án sinh viên, chỉ cần hiển thị số liệu cơ bản
