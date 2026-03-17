# Wireframe — Admin Episode & Video Pipeline
**Routes:** `/admin/animes/:id/episodes` · `/admin/animes/:id/episodes/new` · `/admin/upload/:episodeId`
**Files:** `pages/admin/EpisodeManager.tsx` · `pages/admin/VideoUpload.tsx`

---

## 1. QUẢN LÝ TẬP PHIM — `/admin/animes/:id/episodes`

### Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  ← Danh sách Anime  /  Jujutsu Kaisen  /  Quản lý tập       │
│          │                                                               │
│          │  ┌─── HEADER ────────────────────────────────────────────┐   │
│          │  │  [img 48px]  Jujutsu Kaisen · TV · ONGOING            │   │
│          │  │              24 tập · 2020 · MAPPA                    │   │
│          │  │                              [+ Thêm tập]             │   │
│          │  └───────────────────────────────────────────────────────┘   │
│          │                                                               │
│          │  ┌─── DANH SÁCH TẬP ─────────────────────────────────────┐  │
│          │  │  Tập  Tên tập              Thời lượng  Video    Sub  ⋮  │  │
│          │  │  ─────────────────────────────────────────────────────  │  │
│          │  │  01   Ryomen Sukuna         24:00      ● READY   VI EN [⋮]│ │
│          │  │  02   For Myself            24:00      ● READY   VI    [⋮]│ │
│          │  │  03   Girl of Steel         24:00      ⏳ PROCESSING  [⋮]│ │
│          │  │                                        ████░░ 66%         │ │
│          │  │  04   Curse Womb Must Die   24:00      ○ PENDING    -  [⋮]│ │
│          │  │  05   Fearsome Womb         -          ○ PENDING    -  [⋮]│ │
│          │  │  ...                                                       │ │
│          │  │  ─────────────────────────────────────────────────────  │  │
│          │  │  Trang 1/1                                    24 tập      │ │
│          │  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

--- DROPDOWN [⋮] cho từng tập ---
┌─────────────────────┐
│  ✏️  Sửa thông tin  │
│  ⬆️  Upload video   │  ← chỉ hiện khi PENDING hoặc FAILED
│  🔄  Transcode lại  │  ← chỉ hiện khi READY hoặc FAILED
│  📋  Lịch sử encode │
│  📝  Phụ đề         │
│  🗑  Xóa tập        │
└─────────────────────┘
```

### Mobile

```
┌──────────────────────────────────┐
│  ☰  Jujutsu Kaisen — Tập phim   │
├──────────────────────────────────┤
│  [img] TV · ONGOING · 24 tập     │
│  2020 · MAPPA          [+ Thêm]  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │  Tập 01  Ryomen Sukuna     │  │
│  │  24:00  ● READY  VI EN     │  │
│  │  [Upload] [Sửa] [⋮]       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Tập 03  Girl of Steel     │  │
│  │  ⏳ PROCESSING             │  │
│  │  ████████░░░░  66%         │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Tập 04  Curse Womb...     │  │
│  │  ○ PENDING  [Upload Video] │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 2. THÊM / SỬA THÔNG TIN TẬP — Form Sidebar hoặc Modal

### Desktop — Slide-in panel bên phải khi nhấn "Sửa thông tin"

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Danh sách tập — làm mờ]  │  ┌─── PANEL (w-96, slide từ phải) ──────┐  │
│                             │  │  ✕  Sửa Tập 01                       │  │
│                             │  │  ─────────────────────────────────   │  │
│                             │  │  Số tập *                            │  │
│                             │  │  [01___________________________]     │  │
│                             │  │  Tên tập                             │  │
│                             │  │  [Ryomen Sukuna________________]     │  │
│                             │  │  Mô tả                               │  │
│                             │  │  [________________________________]  │  │
│                             │  │  Ngày phát sóng                      │  │
│                             │  │  [2020-10-03____________________]    │  │
│                             │  │  Thumbnail                           │  │
│                             │  │  [img hiện tại / Chọn ảnh mới]      │  │
│                             │  │  Có Vietsub  [toggle ON]             │  │
│                             │  │  Có Engsub   [toggle OFF]            │  │
│                             │  │                                      │  │
│                             │  │  PHỤ ĐỀ                              │  │
│                             │  │  ┌──── VI — Vietsub ───────────────┐ │  │
│                             │  │  │ URL: [https://...ep01.vi.vtt] ✕ │ │  │
│                             │  │  └──────────────────────────────── ┘ │  │
│                             │  │  [+ Thêm file phụ đề]               │  │
│                             │  │                                      │  │
│                             │  │  [Hủy]            [Lưu]             │  │
│                             │  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile — Full screen modal

```
┌──────────────────────────────────┐
│  ✕  Sửa Tập 01                  │
├──────────────────────────────────┤
│  Số tập *  [01]                  │
│  Tên tập   [Ryomen Sukuna]       │
│  Mô tả     [________________]    │
│  Ngày phát [2020-10-03]          │
│  Vietsub   [toggle ON]           │
│  Engsub    [toggle OFF]          │
├──────────────────────────────────┤
│  Phụ đề                          │
│  VI: [https://...ep01.vi.vtt] ✕  │
│  [+ Thêm phụ đề]                 │
├──────────────────────────────────┤
│  [Hủy]          [Lưu]            │
└──────────────────────────────────┘
```

---

## 3. UPLOAD & TRANSCODE VIDEO — `/admin/upload/:episodeId`

### Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  ← Tập phim  /  Upload Video — Tập 04: "Curse Womb Must Die" │
│          │                                                               │
│          │  ┌─── CỘT TRÁI (flex-1) ──────┐ ┌── CỘT PHẢI (w-80) ──────┐ │
│          │  │                             │ │                           │ │
│          │  │  UPLOAD FILE               │ │  THÔNG TIN TẬP            │ │
│          │  │  ┌───────────────────────┐ │ │  Tập 04                   │ │
│          │  │  │                       │ │ │  Curse Womb Must Die      │ │
│          │  │  │   📁                  │ │ │  Jujutsu Kaisen           │ │
│          │  │  │   Kéo thả file MP4    │ │ │  ○ PENDING                │ │
│          │  │  │   vào đây             │ │ │                           │ │
│          │  │  │   hoặc                │ │ │  CHỌN CHẤT LƯỢNG          │ │
│          │  │  │   [Chọn file video]   │ │ │  ☑ 360p  (bắt buộc)      │ │
│          │  │  │                       │ │ │  ☑ 720p                   │ │
│          │  │  └───────────────────────┘ │ │  ☑ 1080p                  │ │
│          │  │  MP4 / MKV / AVI · max 2GB │ │                           │ │
│          │  │                             │ │  LƯU Ý                    │ │
│          │  │  ── Sau khi chọn file ──    │ │  • Transcode có thể mất  │ │
│          │  │  ┌───────────────────────┐ │ │    5–15 phút tùy độ dài  │ │
│          │  │  │ 📄 ep04_raw.mp4       │ │ │  • File gốc tự xóa sau   │ │
│          │  │  │ 2.1 GB                │ │ │    khi encode xong       │ │
│          │  │  │ ████████████░░ 87%    │ │ │  • Không tắt tab này     │ │
│          │  │  │ Đang upload... 87%    │ │ │    khi đang upload       │ │
│          │  │  └───────────────────────┘ │ │                           │ │
│          │  │                             │ └───────────────────────────┘ │
│          │  │  TIẾN TRÌNH TRANSCODE      │                               │
│          │  │  ┌───────────────────────┐ │                               │
│          │  │  │  ⏳ Đang xử lý...     │ │                               │
│          │  │  │                       │ │                               │
│          │  │  │  Encoding 720p...     │ │                               │
│          │  │  │  ██████████░░░  66%   │ │                               │
│          │  │  │                       │ │                               │
│          │  │  │  ✓ 360p  hoàn thành   │ │                               │
│          │  │  │  ⏳ 720p  đang chạy   │ │                               │
│          │  │  │  ○ 1080p chờ          │ │                               │
│          │  │  └───────────────────────┘ │                               │
│          │  │                             │                               │
│          │  │  ── Khi DONE ──            │                               │
│          │  │  ┌───────────────────────┐ │                               │
│          │  │  │  ✅ Transcode xong!   │ │                               │
│          │  │  │  Video đã sẵn sàng    │ │                               │
│          │  │  │  [▶ Xem thử]          │ │                               │
│          │  │  │  [← Về danh sách tập] │ │                               │
│          │  │  └───────────────────────┘ │                               │
│          │  │                             │                               │
│          │  │  [Hủy upload]  [Bắt đầu Upload]│                          │
│          │  └─────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌──────────────────────────────────┐
│  ☰  Upload Video — Tập 04        │
├──────────────────────────────────┤
│  Tập 04 · Curse Womb Must Die    │
│  Jujutsu Kaisen · ○ PENDING      │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │  📁 Kéo thả hoặc           │  │
│  │     [Chọn file video]      │  │
│  │  MP4/MKV/AVI · max 2GB    │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Chất lượng                      │
│  ☑ 360p  ☑ 720p  ☑ 1080p        │
├──────────────────────────────────┤
│  Sau khi chọn file:              │
│  📄 ep04_raw.mp4  (2.1 GB)       │
│  ████████████░░░  87%            │
│  Đang upload...                  │
├──────────────────────────────────┤
│  Transcode:                      │
│  ✓ 360p  hoàn thành              │
│  ⏳ 720p  ██████░░░  66%         │
│  ○ 1080p  chờ                    │
├──────────────────────────────────┤
│  [Hủy]      [Bắt đầu Upload]     │
└──────────────────────────────────┘
```

---

## 4. LỊCH SỬ TRANSCODE — Modal khi nhấn "Lịch sử encode"

### Desktop & Mobile (dùng chung dialog)

```
┌──────────────────────────────────────────────────┐
│  Lịch sử Transcode — Tập 01: Ryomen Sukuna       │
│  ──────────────────────────────────────────────  │
│  #  Thời gian          Trạng thái  Thời lượng    │
│  3  10/03 10:08        ✅ DONE      8 phút 32s   │
│  2  09/03 22:15        ✕ FAILED     2 phút 10s   │
│     Lỗi: FFmpeg error: Invalid codec             │
│  1  09/03 22:10        ✕ FAILED     0 phút 05s   │
│     Lỗi: File corrupted                          │
│  ──────────────────────────────────────────────  │
│                                     [Đóng]       │
└──────────────────────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Badge video status:** `READY` = xanh lá, `PROCESSING` = xanh dương + progress bar inline, `PENDING` = xám, `FAILED` = đỏ
- **Progress bar inline** trong bảng danh sách tập khi đang PROCESSING — cập nhật qua polling 3 giây (không cần giữ SSE connection cho toàn bộ bảng)
- **Upload zone:** drag & drop bằng thư viện Uppy, hiển thị preview tên file + size sau khi chọn
- **Upload progress và transcode progress** là 2 phase riêng biệt, hiển thị tuần tự
- **Checklist 3 bước** bên phải (360p ✓ / 720p ⏳ / 1080p ○) cập nhật realtime qua SSE
- **Khi DONE:** tự chuyển trạng thái card, hiện nút "Xem thử" mở player trong modal nhỏ
- **Khi FAILED:** hiện nút "Xem lỗi" + "Thử lại" — gọi API transcode lại job mới
- **Slide-in panel** cho form sửa tập thay vì navigate sang trang mới — giữ context danh sách
