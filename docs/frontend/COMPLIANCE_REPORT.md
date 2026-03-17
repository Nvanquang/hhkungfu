# Báo cáo tuân thủ — Frontend vs FRONTEND-DESIGN & UI_COMPONENT_MAP & FRONTEND

Kiểm tra ngày: 2025-03 (theo codebase hiện tại).

---

## 1. UI_COMPONENT_MAP.md

### Đã tuân thủ

| Yêu cầu | Trạng thái |
|--------|------------|
| Primitive trong `src/components/ui/`, dùng design tokens | ✅ Button, Input, Card, Form, Label, v.v. dùng Tailwind + biến CSS (--primary, --border...) |
| **Import từ barrel** `@/components/ui` | ✅ Đã thêm `src/components/ui/index.ts` và chuyển toàn bộ Auth pages sang `import { Button, Input, ... } from "@/components/ui"` |
| Form + FormControl, FormLabel, FormMessage | ✅ Đang dùng đúng pattern |
| Card, CardHeader, CardContent... | ✅ Đang dùng |
| Toast / thông báo | ✅ Dùng **sonner** (toast.success / toast.error) trong apiClient; map ghi "Toast: title, description, variant" — sonner đáp ứng nhu cầu notification |

### Chưa có / khác so với map

| Thành phần | Map yêu cầu | Hiện trạng |
|------------|-------------|------------|
| **Button** | `loading`, `asChild` | Button hiện không có prop `loading` (có thể bổ sung sau) |
| **Input** | `label`, `error` | Label/error đang tách qua Form + FormLabel/FormMessage — chấp nhận được |
| **Textarea, Select, Checkbox, RadioGroup, Switch** | Trong map | Chưa có component trong `ui/` |
| **Badge, Avatar, Drawer, Tooltip, Skeleton, Separator, Spinner, EmptyState** | Trong map | Chưa có trong `ui/` |
| **Layout** | RootLayout, Header, Footer, PageWrapper, Sidebar | Chỉ có `AuthLayout`; chưa có layout chính (MainLayout, Header, Footer...) |
| **Common** | ErrorBoundary, ErrorState, Loader, QuantityInput, PriceDisplay, StarRating, ImageWithFallback, ConfirmDialog | Chưa có thư mục `components/common/` |
| **Features** | ProductCard, CartItem, v.v. | Chưa có `components/features/` (dự án anime, sẽ map sang domain anime) |

---

## 2. FRONTEND-DESIGN.md

### Đã tuân thủ

| Yêu cầu | Trạng thái |
|--------|------------|
| Tránh font mặc định AI (Inter, Roboto, Arial) | ✅ Dùng **Geist Variable** (`@fontsource-variable/geist`) |
| Màu qua CSS variables | ✅ Toàn bộ màu trong `index.css` dùng `:root` / `.dark` (--background, --foreground, --primary, --card...) |
| Semantic HTML, accessible | ✅ Form dùng label, aria; Button/Input có focus-visible, aria-invalid |
| Code sạch, modular | ✅ Component tách file, dùng `cn()` cho class |

### Cần lưu ý / chưa đạt

| Yêu cầu | Trạng thái |
|--------|------------|
| **Typography**: 1 display + 1 body font | ⚠️ Hiện chỉ 1 font (Geist Variable). Có thể bổ sung 1 font display cho heading khi có thiết kế rõ |
| **Differentiation anchor** (“screenshot không logo vẫn nhận ra”) | ⚠️ Chưa có tuyên bố rõ; auth đã có hướng dark + gradient — nên ghi lại trong design system |
| **DFII score, Aesthetic name** | ⚠️ Chưa có design direction summary (DFII, tên aesthetic) trong repo — nên bổ sung khi lock design |
| **Motion**: purposeful, sparse | ✅ Chưa thấy motion thừa; có thể thêm ít entrance/hover khi cần |
| **Anti-patterns**: No purple-on-white SaaS, no default symmetrical sections | ✅ Auth không dùng gradient tím-trắng mặc định; layout auth không đối xứng cứng |

---

## 3. FRONTEND.md (conventions & structure)

### Đã tuân thủ

| Mục | Trạng thái |
|-----|------------|
| React 18, Vite, TypeScript, React Router | ✅ (FRONTEND ghi React 18, hiện tại dùng React 19 — nên cập nhật doc) |
| Lazy load pages | ✅ Login, Register, ... dùng `lazy(() => import(...))` |
| Store Zustand trong `store/` | ✅ `store/authStore.ts` |
| Services: axios instance, interceptors | ✅ `services/apiClient.ts` + authService |
| Styling: `cn()`, design tokens (primary, muted, destructive...) | ✅ |
| Named export component, default export page | ✅ Các page Auth dùng `export default function Login()` |
| Types: Dto, ApiResponse, ErrorResponse | ✅ `types/api.types.ts`, auth.types, user.types |

### Khác so với doc

| Mục | FRONTEND.md | Thực tế |
|-----|-------------|---------|
| Package manager | pnpm | Đang dùng **npm** (có package-lock.json). Nên thống nhất: hoặc chuyển sang pnpm hoặc sửa doc thành npm |
| Cấu trúc page | Mỗi route = folder với `index.tsx`, `components/`, `hooks/`, `api.ts` | Hiện Auth là nhiều file trong `pages/Auth/` (Login.tsx, Register.tsx...) — phù hợp giai đoạn chỉ có auth; khi thêm Home, AnimeDetail... nên chuyển dần sang cấu trúc folder + index.tsx + api.ts |
| next-themes, Framer Motion | Trong bảng 1.3 | Chưa cài; dark đang dùng class `.dark` thủ công trên layout auth |
| Video: HLS.js, Video.js | Trong doc | Chưa có — sẽ cần khi làm trang xem phim |

---

## 4. Hành động đã thực hiện (trong lần kiểm tra này)

1. **Barrel `@/components/ui`**  
   - Thêm `src/components/ui/index.ts` re-export toàn bộ primitive (Button, Input, Card, Form, Label, PasswordInput, InputOTP, Dialog, DropdownMenu, Pagination, Tabs, Table).

2. **Import theo UI_COMPONENT_MAP**  
   - Các trang Auth (Login, Register, ForgotPassword, ResetPassword, VerifyEmail) chuyển sang `import { ... } from "@/components/ui"`.

3. **Import nội bộ ui/**  
   - form.tsx, PasswordInput.tsx, dialog.tsx, pagination.tsx dùng relative import (`./label`, `./input`, `./button`) để tránh vòng và thống nhất với barrel.

---

## 5. Checklist nên làm tiếp (đề xuất)

- [ ] Thống nhất package manager (npm vs pnpm) và cập nhật FRONTEND.md.
- [ ] Bổ sung Button prop `loading` (và nếu cần `asChild`) khi có nhu cầu.
- [ ] Khi có layout chính: thêm RootLayout/MainLayout, Header, Footer, PageWrapper theo UI_COMPONENT_MAP.
- [ ] Tạo `components/common/` với ít nhất ErrorBoundary, Loader, EmptyState khi cần.
- [ ] Cập nhật FRONTEND.md: React 19, bỏ/ghi chú next-themes & Framer Motion nếu không dùng.
- [ ] (Tùy chọn) Thêm 1 font display và ghi Design Direction Summary (DFII, tên aesthetic) theo FRONTEND-DESIGN.

---

**Kết luận:** Dự án đã tuân thủ phần lớn UI_COMPONENT_MAP (barrel, design tokens, pattern Form/Card), FRONTEND-DESIGN (font không mặc định, màu biến CSS, không anti-pattern rõ ràng) và FRONTEND (store, services, lazy, conventions). Các điểm còn thiếu chủ yếu là thiếu component/layout chưa triển khai và vài chi tiết doc (pnpm vs npm, cấu trúc page, DFII).
