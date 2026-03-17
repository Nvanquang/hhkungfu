# Wireframe — Admin Anime Management
**Routes:** `/admin/animes` · `/admin/animes/new` · `/admin/animes/:id/edit`
**Files:** `pages/admin/AnimeList.tsx` · `pages/admin/AnimeForm.tsx`

---

## 1. DANH SÁCH ANIME — `/admin/animes`

### Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Anime Management                                             │
│          │  ┌───────────────────────────────────────────────────────┐   │
│          │  │  [+ Thêm Anime]                          350 anime    │   │
│          │  └───────────────────────────────────────────────────────┘   │
│          │                                                               │
│          │  ┌─── FILTER BAR ──────────────────────────────────────────┐ │
│          │  │  🔍 Tìm tên anime...  [Status ▾] [Type ▾] [Year ▾] [🔄]│ │
│          │  └─────────────────────────────────────────────────────────┘ │
│          │                                                               │
│          │  ┌─── TABLE ───────────────────────────────────────────────┐ │
│          │  │  □  Thumbnail  Tên                  Type  Status  Ep  ⋮ │ │
│          │  │  ────────────────────────────────────────────────────── │ │
│          │  │  □  [img 48px]  Jujutsu Kaisen       TV    ONGOING  24  │ │
│          │  │                 Chú Thuật Hồi Chiến                      │ │
│          │  │                 2020 · MAPPA          ·     ●          [⋮]│ │
│          │  │  ────────────────────────────────────────────────────── │ │
│          │  │  □  [img 48px]  Naruto Shippuden      TV    COMPLETED 500 │ │
│          │  │                 Naruto: Gió Lốc                           │ │
│          │  │                 2007 · Pierrot         ·     ○          [⋮]│ │
│          │  │  ────────────────────────────────────────────────────── │ │
│          │  │  □  [img 48px]  Chainsaw Man           TV    COMPLETED  12 │ │
│          │  │  ...                                                       │ │
│          │  │                                                            │ │
│          │  │  □ Chọn tất cả    [Xóa đã chọn]                          │ │
│          │  │  ────────────────────────────────────────────────────── │ │
│          │  │  Trang 1/18  ← 1  2  3  ... 18 →        20 / trang ▾    │ │
│          │  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

--- DROPDOWN MENU [⋮] ---
┌──────────────────┐
│  ✏️  Sửa         │
│  ⭐  Đặt nổi bật │
│  🎬  Quản lý tập │
│  🗑  Xóa         │
└──────────────────┘
```

### Mobile

```
┌──────────────────────────────────┐
│  ☰  Anime Management             │
│  [+ Thêm]              350 anime │
├──────────────────────────────────┤
│  🔍 Tìm tên anime...             │
│  [Status ▾]  [Type ▾]  [Year ▾]  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [img]  Jujutsu Kaisen      │  │
│  │        TV · ONGOING · 24ep │  │
│  │        2020 · MAPPA        │  │
│  │        [Sửa] [Tập] [⋮]    │  │  ← Nút inline thay dropdown
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ [img]  Naruto Shippuden    │  │
│  │        TV · COMPLETED ·500ep│ │
│  │        2007 · Pierrot      │  │
│  │        [Sửa] [Tập] [⋮]    │  │
│  └────────────────────────────┘  │
│  ...                             │
│  ← 1  2  3  ... 18 →             │
└──────────────────────────────────┘
```

---

## 2. THÊM / SỬA ANIME — `/admin/animes/new` hoặc `/admin/animes/:id/edit`

### Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  ← Danh sách Anime  /  Thêm Anime mới                        │
│          │                                                               │
│          │  ┌─── CỘT TRÁI (flex-1) ────┐  ┌─── CỘT PHẢI (w-80) ──────┐ │
│          │  │                           │  │                            │ │
│          │  │  THÔNG TIN CƠ BẢN         │  │  THUMBNAIL                 │ │
│          │  │  ─────────────────────    │  │  ┌──────────────────────┐  │ │
│          │  │  Tên gốc (tiếng Nhật) *   │  │  │                      │  │ │
│          │  │  [________________________]  │  │  [  Kéo thả ảnh vào  ]│  │ │
│          │  │                           │  │  │  hoặc [Chọn file]    │  │ │
│          │  │  Tên tiếng Việt           │  │  │                      │  │ │
│          │  │  [________________________]  │  └──────────────────────┘  │ │
│          │  │                           │  │  JPG/PNG/WebP · max 5MB    │ │
│          │  │  Tên khác (Enter để thêm) │  │                            │ │
│          │  │  [________________________]  │  BANNER                    │ │
│          │  │  [呪術廻戦 ✕]             │  │  ┌──────────────────────┐  │ │
│          │  │                           │  │  │  [Chọn ảnh banner]   │  │ │
│          │  │  Slug * (tự sinh)         │  │  └──────────────────────┘  │ │
│          │  │  [jujutsu-kaisen________] │  │                            │ │
│          │  │                           │  │  TRAILER YOUTUBE ID        │ │
│          │  │  Mô tả                    │  │  [__________________]      │ │
│          │  │  ┌──────────────────────┐ │  │  youtube.com/watch?v=[ID]  │ │
│          │  │  │ Textarea 4 dòng      │ │  │                            │ │
│          │  │  └──────────────────────┘ │  │  CÀI ĐẶT                   │ │
│          │  │                           │  │  Nổi bật  [toggle OFF]     │ │
│          │  │  PHÂN LOẠI               │  │  MAL Score [8.66_________] │ │
│          │  │  ─────────────────────   │  │  Độ tuổi   [PG-13 ▾]      │ │
│          │  │  Trạng thái *  [ONGOING▾]│  │                            │ │
│          │  │  Loại *        [TV ▾]    │  └────────────────────────────┘ │
│          │  │  Tổng số tập  [24______] │                                 │
│          │  │  Thời lượng   [24___] phút│                                │
│          │  │                           │                                 │
│          │  │  THỜI GIAN PHÁT SÓNG     │                                 │
│          │  │  Từ  [2020-10-03_______] │                                 │
│          │  │  Đến [________________] │                                  │
│          │  │  Mùa [FALL ▾]  Năm [2020]│                                │
│          │  │                           │                                 │
│          │  │  THỂ LOẠI                │                                 │
│          │  │  [Action ✕][Shounen ✕]   │                                 │
│          │  │  [+ Thêm thể loại ▾]     │                                 │
│          │  │                           │                                 │
│          │  │  STUDIO                   │                                 │
│          │  │  [MAPPA ✕]               │                                 │
│          │  │  [+ Thêm studio ▾]       │                                 │
│          │  │                           │                                 │
│          │  │  [Hủy]    [Lưu Anime]    │                                 │
│          │  └───────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile

```
┌──────────────────────────────────┐
│  ☰  ← Danh sách / Thêm Anime    │
├──────────────────────────────────┤
│  THUMBNAIL                       │
│  ┌────────────────────────────┐  │
│  │   [Kéo thả / Chọn ảnh]    │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Tên gốc *                       │
│  [__________________________]    │
│  Tên tiếng Việt                  │
│  [__________________________]    │
│  Slug *                          │
│  [jujutsu-kaisen___________]     │
│  Mô tả                           │
│  [__________________________]    │
│  [__________________________]    │
├──────────────────────────────────┤
│  Trạng thái   [ONGOING ▾]        │
│  Loại         [TV ▾]             │
│  Tổng số tập  [24]               │
│  Thời lượng   [24] phút          │
├──────────────────────────────────┤
│  Từ  [2020-10-03]  Đến [     ]   │
│  Mùa [FALL ▾]      Năm [2020]    │
├──────────────────────────────────┤
│  Thể loại                        │
│  [Action ✕] [Shounen ✕]          │
│  [+ Thêm thể loại]               │
├──────────────────────────────────┤
│  Studio                          │
│  [MAPPA ✕]                       │
│  [+ Thêm studio]                 │
├──────────────────────────────────┤
│  Banner · Trailer · MAL · Tuổi   │
│  [Xem thêm tùy chọn ▾]          │  ← Collapsible section
├──────────────────────────────────┤
│  [Hủy]          [Lưu Anime]      │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Danh sách:** Mỗi row có thumbnail nhỏ 48x48, 2 dòng tên (gốc + VI), badge status màu
- **Dropdown [⋮]** gồm: Sửa, Đặt nổi bật (toggle), Quản lý tập, Xóa (màu đỏ, có confirm dialog)
- **Form thêm/sửa:** 2 cột trên desktop — thông tin bên trái, media/settings bên phải
- **Slug:** tự động sinh từ title khi user gõ, vẫn cho phép sửa tay
- **Tên khác:** input tag kiểu chip — gõ Enter hoặc dấu phẩy để thêm tag mới
- **Thể loại & Studio:** dropdown multi-select dạng combobox, hiển thị dưới dạng chip có nút ✕
- **Mobile form:** các tùy chọn ít dùng (banner, trailer, MAL score) ẩn trong collapsible
- **Xóa:** phải confirm dialog "Bạn có chắc muốn xóa anime này? Hành động không thể hoàn tác."
