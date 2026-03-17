# Lịch Làm Việc Cá Nhân — Anime Streaming Website

**Phiên bản:** 2.0
**Ngày bắt đầu dự kiến:** 2026-03-16
**Thời gian:** 12 tuần (~3 tháng)
**Giờ làm:** ~3–4h/ngày buổi tối + cuối tuần
**Stack:** Spring Boot + React SPA + FFmpeg Video Pipeline

---

## 1. Tổng Quan Lộ Trình

| Giai đoạn | Tuần | Mục tiêu |
|---|---|---|
| **Phase 1 — Nền tảng** | 1–2 | Setup, Auth, Anime CRUD cơ bản |
| **Phase 2 — Video Pipeline** | 3–5 | Upload, FFmpeg transcode, HLS stream ⭐ |
| **Phase 3 — Frontend** | 6–7 | React SPA, HLS.js player, trang xem phim |
| **Phase 4 — Tính năng** | 8–9 | Search, Bookmark, History, Comment, Rating |
| **Phase 5 — Redis & Polish** | 10–11 | Trending, Cache, Admin panel, Recommendation |
| **Phase 6 — Deploy** | 12 | Docker, Railway, Vercel, Monitoring |

---

## 2. Lịch Chi Tiết

---

### TUẦN 1 — Setup & Auth Backend
**Mục tiêu:** Spring Boot chạy được, đăng ký/đăng nhập hoạt động

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Khởi tạo Spring Boot project (Maven), thêm dependencies | 1.5h | ⬜ |
| Thứ 2 | Setup Docker Compose: PostgreSQL + Redis + Elasticsearch local | 1.5h | ⬜ |
| Thứ 3 | Cấu hình Flyway, viết V1__init_schema.sql, V2__seed_genres.sql | 2h | ⬜ |
| Thứ 4 | Entity: User — JPA mapping, Repository | 1.5h | ⬜ |
| Thứ 4 | Implement AuthService: register, login, JWT tạo/xác thực | 2h | ⬜ |
| Thứ 5 | JwtAuthFilter, SecurityConfig, phân quyền USER/ADMIN | 2h | ⬜ |
| Thứ 6 | AuthController: `/auth/register`, `/auth/login`, `/auth/me` | 1.5h | ⬜ |
| Thứ 6 | Implement refresh token + `/auth/refresh`, `/auth/logout` | 1.5h | ⬜ |
| Cuối tuần | OAuth2 Google login tích hợp | 2h | ⬜ |
| Cuối tuần | Test toàn bộ auth API bằng Bruno/Postman | 1h | ⬜ |

**Checklist cuối tuần 1:**
- [ ] Spring Boot khởi động không lỗi
- [ ] Flyway migration chạy thành công, bảng tạo đúng
- [ ] Register/Login trả về JWT hợp lệ
- [ ] Google OAuth2 redirect và trả về token

---

### TUẦN 2 — Anime Catalog CRUD
**Mục tiêu:** API anime, genre, studio hoàn chỉnh với Swagger UI

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Entity: Anime, Genre, Studio, AnimeGenres, AnimeStudios | 2h | ⬜ |
| Thứ 3 | AnimeRepository, GenreRepository, StudioRepository | 1.5h | ⬜ |
| Thứ 3 | AnimeService: CRUD, slug generation, soft delete | 2h | ⬜ |
| Thứ 4 | AnimeController: GET list (filter/sort/paginate), GET detail | 2h | ⬜ |
| Thứ 4 | AnimeController: POST, PUT, DELETE (Admin) | 1.5h | ⬜ |
| Thứ 5 | GenreController, StudioController | 1.5h | ⬜ |
| Thứ 5 | GlobalExceptionHandler: xử lý lỗi 400/404/409/500 chuẩn | 1.5h | ⬜ |
| Thứ 6 | Tích hợp Elasticsearch: index anime, search API | 2h | ⬜ |
| Cuối tuần | Setup Swagger UI, kiểm tra API docs sinh tự động | 1h | ⬜ |
| Cuối tuần | Viết Unit Test: AnimeService | 2h | ⬜ |

**Checklist cuối tuần 2:**
- [ ] CRUD anime hoạt động đúng
- [ ] Search trả về kết quả từ Elasticsearch
- [ ] Swagger UI hiển thị đầy đủ API
- [ ] Filter theo genre, year, status hoạt động

---

### TUẦN 3 — Video Upload & FFmpeg Setup ⭐
**Mục tiêu:** Upload file MP4, FFmpeg chạy được, tạo ra file HLS

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Entity: Episode, TranscodeJob, VideoFile | 2h | ⬜ |
| Thứ 2 | Cài FFmpeg local, test lệnh encode tay trên terminal | 1h | ⬜ |
| Thứ 3 | VideoUploadService: nhận multipart file, validate MIME type | 2h | ⬜ |
| Thứ 3 | Lưu file tạm vào `/tmp/uploads/`, trả jobId ngay (202) | 1.5h | ⬜ |
| Thứ 4 | Setup Spring Async + ThreadPoolExecutor config | 1h | ⬜ |
| Thứ 4 | TranscodeJob: gọi FFmpeg encode 360p → HLS segments | 3h | ⬜ |
| Thứ 5 | TranscodeJob: encode 720p + 1080p | 2h | ⬜ |
| Thứ 5 | Tạo master.m3u8 playlist link cả 3 quality | 1.5h | ⬜ |
| Thứ 6 | Cập nhật Episode.videoStatus và hls_path sau khi xong | 1h | ⬜ |
| Thứ 6 | Xóa file tạm sau transcode, xử lý FAILED case | 1h | ⬜ |
| Cuối tuần | Test end-to-end: upload MP4 → kiểm tra file HLS sinh ra | 2h | ⬜ |

**Checklist cuối tuần 3:**
- [ ] Upload file MP4 thành công (202 response)
- [ ] FFmpeg sinh được file 360p/720p/1080p HLS
- [ ] master.m3u8 trỏ đúng đến 3 quality
- [ ] Episode.videoStatus chuyển thành READY sau khi xong

---

### TUẦN 4 — SSE Progress & HLS Streaming ⭐
**Mục tiêu:** Client xem được tiến trình transcode + stream video HLS

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | VideoProgressController: SSE endpoint push progress realtime | 3h | ⬜ |
| Thứ 3 | Cập nhật progress vào Redis và TranscodeJob mỗi bước | 1.5h | ⬜ |
| Thứ 3 | GET `/admin/transcode/:jobId` — polling endpoint | 1h | ⬜ |
| Thứ 4 | VideoStreamController: phục vụ `.m3u8` file (MIME đúng) | 2h | ⬜ |
| Thứ 4 | Hỗ trợ HTTP Range header cho `.ts` segments (seek video) | 2h | ⬜ |
| Thứ 5 | LocalStorageService + R2StorageService (interface chung) | 2h | ⬜ |
| Thứ 5 | GET `/episodes/:id/stream-info` — trả về URL HLS + subtitles | 1.5h | ⬜ |
| Thứ 6 | DELETE video: xóa file HLS, reset videoStatus = PENDING | 1h | ⬜ |
| Thứ 6 | CORS config cho phép React SPA gọi API + stream | 1h | ⬜ |
| Cuối tuần | Test stream bằng VLC: mở URL m3u8, kiểm tra chuyển quality | 2h | ⬜ |

**Checklist cuối tuần 4:**
- [ ] SSE stream progress bar từ 0% → 100% đúng
- [ ] VLC mở được URL master.m3u8
- [ ] Range request hoạt động (seek video không cần tải lại)
- [ ] API stream-info trả về đủ 3 quality URL

---

### TUẦN 5 — Redis Cache & Trending ⭐
**Mục tiêu:** Cache hoạt động, trending anime lấy từ Redis

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Cấu hình Redis: Spring Cache, RedisTemplate, TTL | 2h | ⬜ |
| Thứ 2 | Cache anime detail + episode list với `@Cacheable` | 1.5h | ⬜ |
| Thứ 3 | ViewCountService: `ZINCRBY` Redis khi gọi `/view` | 1.5h | ⬜ |
| Thứ 3 | TrendingService: `ZRANGE` Redis → GET `/animes/trending` | 1.5h | ⬜ |
| Thứ 4 | ViewCountSyncJob: `@Scheduled` mỗi giờ sync Redis → PostgreSQL | 2h | ⬜ |
| Thứ 4 | Rate limiting theo IP bằng Redis counter | 1.5h | ⬜ |
| Thứ 5 | Cache invalidation khi update/delete anime | 1.5h | ⬜ |
| Thứ 6 | Test cache: log hit/miss, đo thời gian response | 1h | ⬜ |
| Cuối tuần | Viết Integration Test: VideoTranscodeService | 2h | ⬜ |
| Cuối tuần | Review + refactor code tuần 3–5 | 2h | ⬜ |

**Checklist cuối tuần 5:**
- [ ] Response anime detail < 50ms sau lần đầu (cache hit)
- [ ] Trending cập nhật sau mỗi lượt xem
- [ ] View count sync vào PostgreSQL mỗi giờ
- [ ] Rate limit block sau 100 req/phút

---

### TUẦN 6 — React SPA Setup + Trang Cơ Bản
**Mục tiêu:** React app chạy, hiển thị danh sách anime, trang chủ

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Khởi tạo Vite + React + TypeScript, cài dependencies | 1.5h | ⬜ |
| Thứ 2 | Setup React Router v6, cấu trúc pages/components | 1.5h | ⬜ |
| Thứ 3 | Axios instance + interceptors (attach JWT, refresh khi 401) | 2h | ⬜ |
| Thứ 3 | TanStack Query setup, custom hooks: `useAnimes`, `useAnime` | 2h | ⬜ |
| Thứ 4 | Zustand authStore: lưu user, token, login/logout actions | 1.5h | ⬜ |
| Thứ 4 | Header, Footer, layout component | 1.5h | ⬜ |
| Thứ 5 | Trang Home: banner featured, carousel trending, recently updated | 3h | ⬜ |
| Thứ 6 | AnimeCard, AnimeGrid components | 2h | ⬜ |
| Thứ 6 | Trang AnimeCatalog: danh sách + bộ lọc (genre, year, status) | 2h | ⬜ |
| Cuối tuần | Trang AnimeDetail: thông tin đầy đủ, danh sách tập | 3h | ⬜ |

**Checklist cuối tuần 6:**
- [ ] Trang chủ hiển thị dữ liệu thật từ API
- [ ] Filter anime hoạt động (URL params sync)
- [ ] Trang chi tiết anime load đúng

---

### TUẦN 7 — HLS.js Player & Trang Xem Phim ⭐
**Mục tiêu:** Xem phim HLS trong browser, chọn chất lượng, phụ đề

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Cài HLS.js + Video.js, tích hợp vào React | 2h | ⬜ |
| Thứ 2 | HlsPlayer component: load master.m3u8, auto play | 2h | ⬜ |
| Thứ 3 | QualitySelector: hiển thị 360p/720p/1080p, switch không gián đoạn | 2h | ⬜ |
| Thứ 3 | SubtitleSelector: load file .vtt, hiển thị phụ đề | 2h | ⬜ |
| Thứ 4 | Trang Watch: player + sidebar danh sách tập | 3h | ⬜ |
| Thứ 5 | Ghi lịch sử xem mỗi 15 giây (POST /watch-history) | 2h | ⬜ |
| Thứ 5 | "Tiếp tục xem": nhớ giây dừng lại, tự seek khi mở lại | 2h | ⬜ |
| Thứ 6 | Điều hướng tập trước/sau | 1h | ⬜ |
| Thứ 6 | Keyboard shortcuts: Space (pause), Arrow (seek), F (fullscreen) | 1.5h | ⬜ |
| Cuối tuần | Test trên nhiều browser (Chrome, Firefox, Safari) | 2h | ⬜ |

**Checklist cuối tuần 7:**
- [ ] HLS stream chạy mượt trong browser
- [ ] Chuyển quality 360p ↔ 1080p không bị đen màn hình
- [ ] Phụ đề hiển thị đúng
- [ ] "Tiếp tục xem" seek đúng vị trí

---

### TUẦN 8 — Login/Register Frontend + Search
**Mục tiêu:** Đăng nhập trên UI, tìm kiếm anime

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Trang Login, Register (React Hook Form + Zod validation) | 2.5h | ⬜ |
| Thứ 3 | ProtectedRoute component, redirect về login nếu chưa đăng nhập | 1.5h | ⬜ |
| Thứ 3 | Google OAuth2 button tích hợp FE | 1.5h | ⬜ |
| Thứ 4 | SearchBar component (debounce 300ms) | 1.5h | ⬜ |
| Thứ 4 | Trang Search: kết quả + filter panel (genre, year, status) | 2.5h | ⬜ |
| Thứ 5 | Trang Profile: thông tin user, avatar, stats | 2h | ⬜ |
| Thứ 5 | Form cập nhật profile, đổi mật khẩu | 2h | ⬜ |
| Thứ 6 | Trang History: danh sách đã xem | 1.5h | ⬜ |
| Thứ 6 | Trang Bookmarks + BookmarkButton toggle | 2h | ⬜ |
| Cuối tuần | Toast notifications (sonner), Dark mode | 2h | ⬜ |

---

### TUẦN 9 — Comment, Rating, Recommendation
**Mục tiêu:** Bình luận, đánh giá sao, gợi ý anime

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2–3 | Backend: CommentService, RatingService, CommentController, RatingController | 4h | ⬜ |
| Thứ 4 | Backend: RecommendationService (Content-Based) | 2h | ⬜ |
| Thứ 5 | Frontend: CommentSection trên trang Watch | 3h | ⬜ |
| Thứ 6 | Frontend: StarRating component, hiển thị điểm trung bình | 2h | ⬜ |
| Cuối tuần | Frontend: section gợi ý "Có thể bạn thích" | 2h | ⬜ |

---

### TUẦN 10–11 — Admin Panel + Video Upload UI
**Mục tiêu:** Admin thêm anime, upload video, theo dõi transcode

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Tuần 10 Thứ 2–3 | Admin Dashboard, bảng thống kê, AdminSidebar | 4h | ⬜ |
| Tuần 10 Thứ 4–5 | Admin Anime List + form thêm/sửa anime | 4h | ⬜ |
| Tuần 10 Thứ 6 | Admin User List: xem, khóa user, đổi role | 2h | ⬜ |
| Tuần 11 Thứ 2–3 | ⭐ VideoUpload page: drag & drop (Uppy), progress bar | 4h | ⬜ |
| Tuần 11 Thứ 4 | ⭐ TranscodeProgress: subscribe SSE, hiển thị real-time | 3h | ⬜ |
| Tuần 11 Thứ 5–6 | Episode Manager: thêm tập, gán video đã upload | 3h | ⬜ |

**Checklist cuối tuần 11:**
- [ ] Admin upload MP4 → thấy progress bar chạy realtime
- [ ] Sau khi transcode xong → video xuất hiện trên trang xem phim
- [ ] Admin quản lý được anime, tập, user

---

### TUẦN 12 — Deploy & Hoàn Thiện
**Mục tiêu:** Website chạy production, sẵn sàng demo

| Ngày | Việc làm | Giờ | Trạng thái |
|---|---|---|---|
| Thứ 2 | Viết Dockerfile (Spring Boot + FFmpeg), test build image | 2h | ⬜ |
| Thứ 3 | Deploy backend lên Railway, cấu hình biến môi trường | 2h | ⬜ |
| Thứ 3 | Deploy frontend lên Vercel, cấu hình VITE_API_BASE_URL | 1h | ⬜ |
| Thứ 4 | Cấu hình Cloudflare R2 cho HLS files production | 2h | ⬜ |
| Thứ 4 | Setup Sentry (error monitoring) cho cả FE và BE | 1.5h | ⬜ |
| Thứ 5 | Test end-to-end toàn bộ trên production | 3h | ⬜ |
| Thứ 6 | Fix bug production | 3h | ⬜ |
| Cuối tuần | Viết README.md đầy đủ (setup, kiến trúc, hướng dẫn chạy local) | 2h | ⬜ |
| Cuối tuần | **Demo hoàn chỉnh** 🎉 | — | ⬜ |

**Definition of Done — Checklist Cuối Cùng:**
- [ ] Upload video MP4 → xem được qua HLS trong browser
- [ ] Chọn chất lượng 360p / 720p / 1080p trên player
- [ ] SSE progress bar realtime khi transcode
- [ ] Trending anime cập nhật theo lượt xem (Redis)
- [ ] Search anime hoạt động (Elasticsearch)
- [ ] Đăng nhập Google OAuth2
- [ ] Comment, rating, bookmark hoạt động
- [ ] Admin panel đầy đủ
- [ ] Docker image build thành công
- [ ] Deploy production ổn định
- [ ] README đủ để người khác chạy local

---

## 3. Rủi Ro & Phương Án Dự Phòng

| Rủi ro | Khả năng | Xử lý |
|---|---|---|
| FFmpeg transcode chậm trên Railway free | Cao | Giới hạn max 720p cho free tier, 1080p optional |
| Railway free tier sleep sau 30 phút | Cao | UptimeRobot ping mỗi 5 phút |
| File HLS lớn, vượt giới hạn Railway storage | Trung bình | Chuyển sang Cloudflare R2 sớm hơn dự kiến |
| HLS.js không chạy trên Safari iOS | Thấp | Safari native hỗ trợ HLS — test thực tế |
| Tuần học bận, không đủ thời gian | Cao | Ưu tiên Phase 1–3 (video pipeline), cắt bớt admin panel |
