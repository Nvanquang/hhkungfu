# Wireframe — Admin Genre & Studio Management
**Route:** `/admin/genres-studios`
**File:** `pages/admin/GenreStudio.tsx`

> Đây là trang đơn giản, gộp Genre và Studio trên cùng 1 trang — dùng Tab để chuyển đổi.

---

## DESKTOP (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR │  Genre & Studio                                               │
│          │                                                               │
│          │  [  Genre  |  Studio  ]   ← Tabs                             │
│          │  ────────────────────────────────────────────────────────    │
│          │                                                               │
│          │  ══════════════ TAB: GENRE ══════════════                    │
│          │                                                               │
│          │  ┌─── 2 CỘT ─────────────────────────────────────────────┐  │
│          │  │                                                          │  │
│          │  │  ┌── DANH SÁCH (flex-1) ──────────────────────────┐   │  │
│          │  │  │  🔍 Tìm thể loại...              16 thể loại   │   │  │
│          │  │  │  ─────────────────────────────────────────────  │   │  │
│          │  │  │  Tên EN          Tên VI        Slug        ⋮    │   │  │
│          │  │  │  Action          Hành động     action      [⋮]  │   │  │
│          │  │  │  Adventure       Phiêu lưu     adventure   [⋮]  │   │  │
│          │  │  │  Comedy          Hài hước      comedy      [⋮]  │   │  │
│          │  │  │  Drama           Kịch tính     drama       [⋮]  │   │  │
│          │  │  │  Fantasy         Kỳ ảo         fantasy     [⋮]  │   │  │
│          │  │  │  ...                                             │   │  │
│          │  │  └─────────────────────────────────────────────────┘   │  │
│          │  │                                                          │  │
│          │  │  ┌── FORM THÊM / SỬA (w-72) ─────────────────────┐   │  │
│          │  │  │  Thêm thể loại mới                             │   │  │
│          │  │  │  ─────────────────────────────────────────     │   │  │
│          │  │  │  Tên tiếng Anh *                               │   │  │
│          │  │  │  [Isekai_____________________________]         │   │  │
│          │  │  │  Tên tiếng Việt                                │   │  │
│          │  │  │  [Dị giới____________________________]         │   │  │
│          │  │  │  Slug * (tự sinh)                              │   │  │
│          │  │  │  [isekai_____________________________]         │   │  │
│          │  │  │                                                │   │  │
│          │  │  │  [Hủy]              [Lưu]                      │   │  │
│          │  │  └────────────────────────────────────────────────┘   │  │
│          │  └──────────────────────────────────────────────────────┘  │
│          │                                                               │
│          │  ══════════════ TAB: STUDIO ══════════════                   │
│          │  (layout tương tự Genre, form thêm có thêm field Logo URL)   │
│          │                                                               │
│          │  ┌─────────────────────────────────────────────────────────┐ │
│          │  │  Tên                Logo          Số Anime          ⋮   │ │
│          │  │  MAPPA              [img 32px]    45               [⋮]  │ │
│          │  │  Toei Animation     [img 32px]    120              [⋮]  │ │
│          │  │  Madhouse           [img 32px]    38               [⋮]  │ │
│          │  │  ...                                                      │ │
│          │  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

--- DROPDOWN [⋮] ---
┌────────────┐
│  ✏️  Sửa  │
│  🗑  Xóa  │
└────────────┘
```

---

## MOBILE (< 768px)

```
┌──────────────────────────────────┐
│  ☰  Genre & Studio               │
├──────────────────────────────────┤
│  [  Genre  |  Studio  ]          │
├──────────────────────────────────┤
│  🔍 Tìm thể loại...              │
│                     [+ Thêm mới] │
├──────────────────────────────────┤
│  Action       Hành động    [⋮]   │
│  Adventure    Phiêu lưu    [⋮]   │
│  Comedy       Hài hước     [⋮]   │
│  Drama        Kịch tính    [⋮]   │
│  Fantasy      Kỳ ảo        [⋮]   │
│  ...                             │
└──────────────────────────────────┘

--- BOTTOM SHEET khi nhấn [+ Thêm mới] hoặc [⋮ → Sửa] ---
┌──────────────────────────────────┐
│  ▔▔▔▔▔▔  (drag handle)          │
│  Thêm thể loại mới               │
│  ─────────────────────────────   │
│  Tên tiếng Anh *                 │
│  [Isekai_____________________]   │
│  Tên tiếng Việt                  │
│  [Dị giới___________________]    │
│  Slug *                          │
│  [isekai____________________]    │
│                                  │
│  [Hủy]          [Lưu]            │
└──────────────────────────────────┘
```

---

## Ghi Chú Thiết Kế

- **Gộp Genre và Studio** vào 1 trang vì cả hai đơn giản, ít data, quản lý tương tự nhau
- **Form thêm/sửa** đặt cố định bên phải danh sách trên desktop — không cần navigate trang mới
- Khi nhấn **Sửa** từ dropdown, form bên phải tự điền data của item đó, tiêu đề đổi thành "Sửa thể loại"
- **Studio** có thêm field Logo URL (input text nhập URL Cloudinary) và cột "Số Anime" hiển thị số lượng anime thuộc studio đó
- **Xóa** chỉ cho phép nếu không có anime nào đang dùng genre/studio đó — nếu có thì disable nút xóa + tooltip giải thích
- **Mobile:** dùng Bottom Sheet thay vì inline form — slide lên từ dưới màn hình
