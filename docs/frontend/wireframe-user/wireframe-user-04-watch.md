# Wireframe — User · Watch
**Route:** `/watch/:animeSlug/:episodeNumber`
**File:** `pages/Watch.tsx`

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR (slim, h-12, dark)                                                    │
│  🎬 Hhkungfu      JJK > Tập 3 "Cậu bé thiên tài"                  [👤 ▾]    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌────────────────────────────────────────────────┐  ┌────────────────────┐ │
│  │                                                │  │                    │ │
│  │              VIDEO PLAYER                      │  │  DANH SÁCH TẬP    │ │
│  │         (aspect-ratio: 16/9, flex-1)           │  │  ─────────────── │ │
│  │                                                │  │  JJK Season 1    │ │
│  │                                                │  │  24 tập          │ │
│  │         ▶  (pause icon ở giữa khi pause)       │  │  ─────────────── │ │
│  │                                                │  │  ▶ Tập 1         │ │
│  │                                                │  │    Ryomen Sukuna │ │
│  │                                                │  │    24:03         │ │
│  │                                                │  │  ─────────────── │ │
│  │  ─────────────────────────────────────────     │  │  ▶ Tập 2         │ │
│  │  00:43 ●━━━━━━━━━━━━━━━━━━━━━━━━━  24:03      │  │    Để trở thành  │ │
│  │         └─ progress bar (seek)                  │  │    23:48         │ │
│  │                                                │  │  ─────────────── │ │
│  │  ▶  🔊 ━━━━━━  00:43 / 24:03   ⚙  ⛶  [↗]   │  │  ► Tập 3  ◀ NOW  │ │
│  │     └─vol  └─time         └set └full└pip        │  │    Cậu bé thiên  │ │
│  │                                                │  │    ██████████░░  │ │  ← progress
│  └────────────────────────────────────────────────┘  │    (đang xem)    │ │
│                                                       │  ─────────────── │ │
│  ┌────────────────────────────────────────────────┐  │  Tập 4           │ │
│  │  VIDEO INFO                                    │  │    24:15         │ │
│  │                                                │  │  ─────────────── │ │
│  │  Tập 3 — "Cậu bé thiên tài"        JJK S1     │  │  Tập 5           │ │
│  │  ─────────────────────────────────────────     │  │  ─────────────── │ │
│  │                                                │  │  Tập 6  ✨ VIP   │ │  ← VIP lock
│  │  [◀ Tập trước]              [Tập tiếp →]      │  │  🔒 Khóa         │ │
│  │                                                │  │  ─────────────── │ │
│  │  ⚡ Vietsub  ·  720p  ·  23:48                 │  │  ...             │ │
│  │                                                │  │                  │ │
│  │  Mô tả tập                                     │  │  [Xem anime]     │ │
│  │  Gojo dạy Itadori cách kiểm soát năng lượng    │  │  ← link về       │ │
│  │  lời nguyền trong khi nhiệm vụ nguy hiểm...    │  │  trang detail    │ │
│  └────────────────────────────────────────────────┘  └────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  COMMENT SECTION  (xem wireframe-user-07-comment)                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## DESKTOP — PLAYER CONTROLS CHI TIẾT

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO PLAYER                                        │
│                                                                             │
│                                                                             │
│       ┌──────────────────────────────────────────────────────────┐         │
│       │  NEXT EPISODE CARD (hiện trước 30s cuối, có thể dismiss) │         │
│       │  Tiếp theo: Tập 4 "Phép Lật"              [Xem ngay] [✕]│         │
│       └──────────────────────────────────────────────────────────┘         │
│                                                                             │
│                                                                             │
│  ──────────────────────────────────────────────────────────── (seek bar)   │
│   Chương: [──●──────────────────────────────────────────────]              │
│            00:43                                              24:03         │
│                                                                             │
│  ▶  🔊━━━━━━  00:43/24:03    CC  ⚙  ⛶  [↗ PiP]  [⛶ Fullscreen]          │
│  │   │           │            │   │   │                                     │
│  │   └─volume    └─time       │   │   └─fullscreen                          │
│  └─play/pause                  │   └─quality: 360/720/1080                 │
│                                 └─subtitle: Vietsub / Engsub / Tắt         │
└────────────────────────────────────────────────────────────────────────────┘

--- Dropdown ⚙ Chất lượng ---
┌──────────────────┐
│  Chất lượng       │
│  ────────────── │
│  ○ Tự động       │
│  ● 1080p         │
│  ○ 720p          │
│  ○ 360p          │
└──────────────────┘

--- Dropdown CC Phụ đề ---
┌──────────────────┐
│  Phụ đề           │
│  ────────────── │
│  ● Tiếng Việt    │
│  ○ English       │
│  ○ Tắt           │
└──────────────────┘
```

---

## DESKTOP — VIP GATE (Tập bị khóa)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌────────────────────────────────────────────────┐  ┌────────────────────┐ │
│  │                                                │  │  DANH SÁCH TẬP    │ │
│  │       VIP GATE OVERLAY                         │  │  ...               │ │
│  │   (trên nền thumbnail mờ của tập)              │  │  ─────────────── │ │
│  │                                                │  │  Tập 5  ✓ Xem   │ │
│  │         ✨                                      │  │  ─────────────── │ │
│  │                                                │  │  Tập 6  ✨ VIP  │ │
│  │    Nội dung dành riêng cho VIP                 │  │  🔒 Đang xem     │ │
│  │                                                │  │  ─────────────── │ │
│  │    Tập 6 "Phép Lật" và toàn bộ nội dung       │  │  Tập 7  ✨ VIP  │ │
│  │    cao cấp chỉ dành cho thành viên VIP.        │  │  🔒 Khóa         │ │
│  │                                                │  └────────────────────┘ │
│  │    ✓  Xem 1080p không giới hạn                │                         │
│  │    ✓  Truy cập toàn bộ thư viện VIP           │                         │
│  │    ✓  Không quảng cáo                         │                         │
│  │                                                │                         │
│  │    ┌─────────────────────────────────────┐     │                         │
│  │    │   ✨ Nâng cấp VIP — Từ 59,000đ/th  │     │                         │
│  │    └─────────────────────────────────────┘     │                         │
│  │                                                │                         │
│  │    Đã có VIP?  [Đăng nhập]                     │                         │
│  │                                                │                         │
│  └────────────────────────────────────────────────┘                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│ NAVBAR (minimal)                 │
│  ←    JJK · Tập 3         ⋮     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │     VIDEO PLAYER           │  │
│  │     aspect 16:9            │  │
│  │                            │  │
│  │            ▶               │  │
│  │                            │  │
│  │  ──────────────────────    │  │
│  │  ●━━━━━━━━━━━━━━━━━━  ━━  │  │
│  │  00:43         24:03       │  │
│  │                            │  │
│  │  ▶  🔊  00:43/24:03  ⚙ ⛶│  │
│  └────────────────────────────┘  │
│                                  │
│  ─────────────────────────────   │
│  Tập 3 — "Cậu bé thiên tài"     │
│  [◀ Tập 2]          [Tập 4 ▶]   │
│  ─────────────────────────────   │
│  ⚡ Vietsub · 720p · 23:48       │
│  ─────────────────────────────   │
│  Gojo dạy Itadori cách kiểm      │
│  soát năng lượng lời nguyền...   │
│  [Xem thêm]                      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ DANH SÁCH TẬP   [Thu gọn ▲]     │
│  ─────────────────────────────   │
│                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │✓T.1│ │✓T.2│ │▶T.3│ │ T.4│ │ T.5│  │
│  └────┘ └────┘ └────┘ └────┘ └────┘  │
│                ↑ ████░░            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ T.6│ │ T.7│ │ T.8│ │ T.9│ │T.10│  │
│  └────┘ └────┘ └────┘ └────┘ └────┘  │
│  ↑🔒VIP                              │
│                                  │
│  [Xem trang anime →]             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ COMMENT SECTION (collapse)       │
│  Nhận xét (128)  [Mở rộng ▼]    │
├──────────────────────────────────┤
│  🏠      🔍      📚      👤      │
└──────────────────────────────────┘
```

---

## MOBILE — VIP GATE

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │  [Blurred thumbnail 16:9]  │  │
│  │                            │  │
│  │      ✨                    │  │
│  │  Nội dung VIP              │  │
│  │  Tập này chỉ dành cho      │  │
│  │  thành viên VIP            │  │
│  │                            │  │
│  │  ✓ 1080p không giới hạn   │  │
│  │  ✓ Toàn bộ thư viện VIP   │  │
│  │  ✓ Không quảng cáo        │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ ✨ Nâng cấp VIP      │  │  │
│  │  └──────────────────────┘  │  │
│  │  Đã có VIP? [Đăng nhập]   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

### Layout Watch Page
- Desktop: player bên trái (flex-1) + sidebar danh sách tập bên phải (w-80, fixed height, scroll)
- Mobile: player full-width → info → episode list (accordion) → comments
- Navbar trên watch page dùng dark theme tối, slim hơn navbar thường

### Video Player (HLS.js)
- Auto chọn quality dựa theo bandwidth (`hls.js` adaptive streaming)
- Lưu progress vào server mỗi 15 giây: `POST /users/me/watch-history`
- Khi load tập đã xem dở: tự động seek đến `progressSeconds` đã lưu
- Phím tắt: Space (play/pause), ← → (±10s), F (fullscreen), M (mute)

### Next Episode Card
- Xuất hiện 30 giây trước khi kết thúc
- Auto-play sau 5 giây countdown (có thể hủy)
- Vị trí: góc dưới phải của player

### Episode List Sidebar (Desktop)
- Highlight tập đang xem (border primary, background nhẹ)
- Tập đã xem: opacity nhẹ + icon check nhỏ
- Progress bar mỏng dưới tập đang xem dở
- Tập VIP-lock: icon 🔒, text mờ, click → scroll/navigate đến VIP gate

### VIP Gate
- Thumbnail tập bị blur (CSS `filter: blur(8px)`)
- Overlay dark 60%
- Không render `<video>` — không load HLS khi chưa có VIP
- Button "Nâng cấp VIP" → `/vip` (trang subscription)

### Keyboard Shortcuts (Desktop)
```
Space         Play / Pause
← / →         Lùi / Tua 10 giây
↑ / ↓         Tăng / Giảm âm lượng 10%
F             Fullscreen toggle
M             Mute toggle
C             Bật/tắt phụ đề
```
