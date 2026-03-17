# FRONTEND.md — React SPA Frontend

> **Dành cho AI:** Đọc file này khi làm bất kỳ task nào liên quan đến frontend. File này chứa đủ context để viết code đúng convention ngay lần đầu mà không cần hỏi thêm.

---

## 0. Thông Tin Cơ Bản

| Mục | Giá trị |
|---|---|
| Framework | React 18 (SPA, không có SSR) |
| Build Tool | Vite 5 |
| Ngôn ngữ | TypeScript 5 (strict mode) |
| Package Manager | pnpm |
| Port dev | `5173` |
| Entry point | `src/main.tsx` |
| Router setup | `src/App.tsx` |

## 1. Frontend — React SPA

### 1.1 Core

| Hạng mục | Lựa chọn | Phiên bản | Lý do |
|---|---|---|---|
| Framework | **React** | 18.x | SPA, không cần SSR |
| Build Tool | **Vite** | 5.x | Nhanh, HMR tốt, cấu hình đơn giản |
| Ngôn ngữ | **TypeScript** | 5.x | Type safety |
| Package Manager | **pnpm** | 9.x | Nhanh, tiết kiệm |

### 1.2 Routing

| Thư viện | Vai trò |
|---|---|
| **React Router v6** | Client-side routing, nested routes, lazy loading |

### 1.3 UI & Styling

| Thư viện | Vai trò |
|---|---|
| **Tailwind CSS** | Utility-first CSS |
| **ShadCN/UI** | Component library (Button, Dialog, Card...) |
| **Lucide React** | Icons |
| **Framer Motion** | Animation, page transition |
| **next-themes** | Dark / Light mode |

### 1.4 State & Data Fetching

| Thư viện | Vai trò |
|---|---|
| **TanStack Query v5** | Server state: cache, refetch, loading/error |
| **Axios** | HTTP client gọi Spring Boot API |
| **Zustand** | Client state: auth user, player state, UI |

### 1.5 Video Player ⭐

| Thư viện | Vai trò |
|---|---|
| **HLS.js** | Parse và play HLS stream (`.m3u8`) trong browser |
| **Video.js** | Player UI với HLS.js plugin, custom controls |

> **Tại sao HLS.js?** Vì backend tự encode HLS, cần player hiểu được `.m3u8` playlist và tự chọn bitrate phù hợp bandwidth — đây là Adaptive Bitrate Streaming (ABR) như Netflix.

### 1.6 Form & Validation

| Thư viện | Vai trò |
|---|---|
| **React Hook Form** | Form management |
| **Zod** | Schema validation phía client |

### 1.7 Upload

| Thư viện | Vai trò |
|---|---|
| **Uppy** | UI upload file với progress bar, hỗ trợ chunked upload lớn |
| **Axios** | Gửi file tới Spring Boot với `onUploadProgress` |

---

## 2. Cấu Trúc Thư Mục

```
src/
├── pages/                # Mỗi folder = 1 route (lazy loaded)
│   ├── Home/
│   │   ├── index.tsx
│   │   ├── components/   # Component chỉ dùng trong page này
│   │   ├── hooks/
│   │   └── api.ts        # ⭐ API riêng của page
│   │
│   ├── AnimeDetail/
│   │   ├── index.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   │
│   └── Admin/
│       ├── index.tsx
│       ├── components/
│       └── api.ts
│
├── components/           # Reusable components toàn app
│   ├── layout/           # Header, Footer, Sidebar
│   ├── anime/            # AnimeCard, AnimeGrid, EpisodeList...
│   ├── video/            # HlsPlayer, QualitySelector...
│   ├── comment/          # CommentSection, CommentItem...
│   ├── search/           # SearchBar, FilterPanel
│   ├── auth/             # LoginForm, RegisterForm, ProtectedRoute
│   ├── common/           # Loader, EmptyState, Pagination...
│   └── ui/               # ShadCN/UI components (KHÔNG SỬA)
│
├── hooks/                # Global reusable hooks
├── store/                # Global state (Zustand)
├── services/             # Shared services
├── types/                # Global TypeScript interfaces
├── utils/                # Helper functions
├── constants/            # App constants
└── lib/                  # Third-party setup

```

---

## 3. Conventions — Code Style

### Component

```tsx
// ✅ Functional component với TypeScript props interface
interface AnimeCardProps {
  anime: AnimeSummaryDto;
  showBadge?: boolean;
  onClick?: (id: number) => void;
}

export function AnimeCard({ anime, showBadge = false, onClick }: AnimeCardProps) {
  return (
    <div className="..." onClick={() => onClick?.(anime.id)}>
      ...
    </div>
  );
}

// ✅ Export: named export cho components (không dùng default export)
// Ngoại lệ: pages dùng default export vì React.lazy yêu cầu
export default function HomePage() { ... }
```

### Đặt Tên

```
Components:  PascalCase  — AnimeCard, HlsPlayer, FilterPanel
Hooks:       camelCase, bắt đầu bằng "use" — useAnimes, useHlsPlayer
Services:    camelCase, kết thúc bằng "Service" — animeService, videoService
Stores:      camelCase, kết thúc bằng "Store" — authStore, playerStore
Types:       PascalCase, kết thúc bằng "Dto" hoặc "Types" — AnimeDto, ApiResponse
Constants:   SCREAMING_SNAKE_CASE — API_BASE_URL, VIDEO_QUALITIES
```

### Styling — Tailwind

```tsx
// ✅ Dùng cn() từ lib/utils để merge class có điều kiện
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isActive && "border-primary bg-primary/10",
  className  // cho phép override từ bên ngoài
)}>

// ✅ Màu sắc: dùng design tokens của ShadCN, không hardcode hex
// primary, secondary, muted, accent, destructive, card, border...
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="border-destructive"

// ❌ Tránh hardcode màu
className="bg-[#FF5733]"  // chỉ dùng khi thực sự cần thiết
```

---

## 4. Routing — React Router v6

```tsx
// App.tsx — cấu trúc routing
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load tất cả pages để code-splitting
const Home          = lazy(() => import("@/pages/Home"));
const AnimeDetail   = lazy(() => import("@/pages/AnimeDetail"));
const Watch         = lazy(() => import("@/pages/Watch"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="anime" element={<AnimeCatalog />} />
            <Route path="anime/:slug" element={<AnimeDetail />} />
            <Route path="watch/:episodeId" element={<Watch />} />
            <Route path="search" element={<Search />} />
            <Route path="genre/:slug" element={<GenrePage />} />
          </Route>

          {/* Auth routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile"   element={<Profile />} />
            <Route path="/history"   element={<History />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
          </Route>

          {/* Admin — cần role ADMIN */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="animes" element={<AdminAnimeList />} />
              <Route path="upload" element={<VideoUpload />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

---

## 5. Data Fetching — TanStack Query

```tsx
// ✅ Query key convention: mảng ["resource", id/params]
const QUERY_KEYS = {
  animes:     (params: AnimeFilterParams) => ["animes", params],
  anime:      (slug: string)              => ["anime", slug],
  episodes:   (animeId: number)           => ["episodes", animeId],
  trending:   ()                          => ["animes", "trending"],
  streamInfo: (episodeId: number)         => ["stream-info", episodeId],
  bookmarks:  ()                          => ["bookmarks"],
} as const;

// ✅ Custom hook — bọc useQuery
export function useAnime(slug: string) {
  return useQuery({
    queryKey: QUERY_KEYS.anime(slug),
    queryFn:  () => animeService.getBySlug(slug),
    staleTime: 5 * 60 * 1000,   // 5 phút — không refetch nếu data còn tươi
    enabled:   !!slug,           // Chỉ fetch khi slug có giá trị
  });
}

// ✅ Mutation với optimistic update
export function useBookmark(animeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isBookmarked: boolean) =>
      isBookmarked
        ? bookmarkService.remove(animeId)
        : bookmarkService.add(animeId),

    // Optimistic update: cập nhật UI trước, rollback nếu lỗi
    onMutate: async (isBookmarked) => {
      await queryClient.cancelQueries({ queryKey: ["bookmark-status", animeId] });
      const prev = queryClient.getQueryData(["bookmark-status", animeId]);
      queryClient.setQueryData(["bookmark-status", animeId], !isBookmarked);
      return { prev };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["bookmark-status", animeId], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-status", animeId] });
    },
  });
}

// ✅ Infinite scroll
export function useInfiniteAnimes(params: AnimeFilterParams) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.animes(params),
    queryFn:  ({ pageParam = 1 }) => animeService.getList({ ...params, page: pageParam }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    initialPageParam: 1,
  });
}
```

---

## 6. Axios — HTTP Client

```tsx
// services/api.ts — instance dùng chung
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: tự động đính JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: tự động refresh token khi 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { accessToken } = await authService.refresh();
        useAuthStore.getState().setToken(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// services/animeService.ts — pattern cho mọi service
export const animeService = {
  getList: async (params: AnimeFilterParams): Promise<PageResponse<AnimeSummaryDto>> => {
    const { data } = await api.get<ApiResponse<PageResponse<AnimeSummaryDto>>>("/animes", { params });
    return data.data;
  },

  getBySlug: async (slug: string): Promise<AnimeDto> => {
    const { data } = await api.get<ApiResponse<AnimeDto>>(`/animes/${slug}`);
    return data.data;
  },

  create: async (payload: CreateAnimeRequest): Promise<AnimeDto> => {
    const { data } = await api.post<ApiResponse<AnimeDto>>("/animes", payload);
    return data.data;
  },
};
```

---

## 7. Zustand — State Management

```tsx
// stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user:        UserDto | null;
  accessToken: string | null;
  isLoggedIn:  boolean;

  setAuth:  (user: UserDto, token: string) => void;
  setToken: (token: string) => void;
  logout:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isLoggedIn:  false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isLoggedIn: true }),

      setToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, isLoggedIn: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({        // Chỉ persist user, không persist token
        user: state.user,
      }),
    }
  )
);

// stores/playerStore.ts
interface PlayerState {
  volume:         number;            // 0–1
  isMuted:        boolean;
  currentQuality: "360p" | "720p" | "1080p" | "auto";
  playbackRate:   number;            // 0.5, 1, 1.25, 1.5, 2
  isFullscreen:   boolean;

  setVolume:   (v: number) => void;
  setQuality:  (q: string) => void;
}
```

---

## 8. HLS Player ⭐

```tsx
// hooks/useHlsPlayer.ts
import Hls from "hls.js";
import { useEffect, useRef } from "react";

export function useHlsPlayer(masterUrl: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);

  useEffect(() => {
    if (!masterUrl || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:   true,
        startLevel:     -1,          // -1 = auto quality
        capLevelToPlayerSize: true,  // Không load quality cao hơn size player
      });
      hls.loadSource(masterUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      return () => { hls.destroy(); };

    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      videoRef.current.src = masterUrl;
    }
  }, [masterUrl]);

  // Đổi quality
  const setQuality = (levelIndex: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = levelIndex;
  };

  return { videoRef, hlsRef, setQuality };
}

// components/video/HlsPlayer.tsx
export function HlsPlayer({ streamInfo }: { streamInfo: StreamInfoDto }) {
  const { videoRef, hlsRef, setQuality } = useHlsPlayer(streamInfo.masterUrl);
  const { currentQuality, setQuality: storeSetQuality } = usePlayerStore();

  return (
    <div className="relative w-full aspect-video bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={false}     // Custom controls
        playsInline
      />
      <QualitySelector
        qualities={streamInfo.qualities}
        current={currentQuality}
        onChange={(q, index) => {
          setQuality(index);
          storeSetQuality(q);
        }}
      />
      <SubtitleSelector subtitles={streamInfo.subtitles} videoRef={videoRef} />
    </div>
  );
}
```

---

## 9. SSE — Transcode Progress

```tsx
// hooks/useTranscodeSSE.ts
export function useTranscodeSSE(jobId: number | null) {
  const [progress, setProgress] = useState<TranscodeProgressDto | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const token = useAuthStore.getState().accessToken;
    const url   = `${import.meta.env.VITE_API_BASE_URL}/admin/transcode/${jobId}/progress`;

    // SSE cần token — dùng EventSource với custom header không được
    // → Dùng @microsoft/fetch-event-source để gửi header
    const controller = new AbortController();

    fetchEventSource(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal:  controller.signal,

      onmessage(event) {
        const data: TranscodeProgressDto = JSON.parse(event.data);
        setProgress(data);

        if (data.status === "DONE" || data.status === "FAILED") {
          controller.abort();   // Đóng connection khi xong
        }
      },
    });

    return () => controller.abort();
  }, [jobId]);

  return progress;
}

// components/video/TranscodeProgress.tsx
export function TranscodeProgress({ jobId }: { jobId: number }) {
  const progress = useTranscodeSSE(jobId);

  if (!progress) return <Skeleton className="h-4 w-full" />;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{progress.currentStep}</span>
        <span className="font-medium">{progress.progress}%</span>
      </div>
      <Progress value={progress.progress} className="h-2" />
      {progress.status === "DONE" && (
        <p className="text-sm text-green-600">✓ Transcode hoàn thành!</p>
      )}
      {progress.status === "FAILED" && (
        <p className="text-sm text-destructive">✗ Lỗi: {progress.error}</p>
      )}
    </div>
  );
}
```

---

## 10. Form — React Hook Form + Zod

```tsx
// ✅ Pattern chuẩn cho form với validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email:    z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await authService.login(data);
      useAuthStore.getState().setAuth(result.user, result.accessToken);
      navigate("/");
    } catch (error) {
      toast.error("Email hoặc mật khẩu không đúng");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
```

---

## 11. TypeScript Types

```tsx
// types/api.types.ts — dùng chung cho mọi API call
export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  error?:  { code: string; message: string };
}

export interface PageResponse<T> {
  items:      T[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

// types/anime.types.ts
export interface AnimeSummaryDto {
  id:           number;
  title:        string;
  titleVi:      string | null;
  slug:         string;
  thumbnailUrl: string | null;
  status:       "ONGOING" | "COMPLETED" | "UPCOMING";
  type:         "TV" | "MOVIE" | "OVA" | "SPECIAL" | "ONA";
  totalEpisodes: number | null;
  year:         number | null;
  malScore:     number | null;
  viewCount:    number;
  genres:       { id: number; name: string; slug: string }[];
}

// types/video.types.ts
export interface StreamInfoDto {
  episodeId:       number;
  videoStatus:     "PENDING" | "PROCESSING" | "READY" | "FAILED";
  masterUrl:       string;
  qualities:       { quality: string; url: string }[];
  subtitles:       { language: string; label: string; url: string }[];
  durationSeconds: number;
}

export interface TranscodeProgressDto {
  jobId:       number;
  status:      "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  progress:    number;    // 0–100
  currentStep: string;
  masterUrl?:  string;    // có khi DONE
  error?:      string;    // có khi FAILED
}
```

---

## 12. Environment Variables

```bash
# .env.local (local dev)
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_STREAM_BASE_URL=http://localhost:8080/files/hls

# .env.production
VITE_API_BASE_URL=https://your-app.railway.app/api/v1
VITE_STREAM_BASE_URL=https://pub-xxx.r2.dev/hls

# Truy cập trong code:
const apiUrl = import.meta.env.VITE_API_BASE_URL;
// Không bao giờ dùng process.env trong Vite
```

---

## 13. Alias Path

```tsx
// vite.config.ts — đã cấu hình sẵn
resolve: { alias: { "@": path.resolve(__dirname, "./src") } }

// Dùng trong code — luôn dùng alias, không dùng relative path dài
import { useAnime }    from "@/hooks/useAnimes";
import { animeService } from "@/services/animeService";
import { AnimeCard }    from "@/components/anime/AnimeCard";
import { cn }           from "@/lib/utils";
// ❌ Tránh: import { cn } from "../../../../lib/utils"
```

---

## 14. Loading & Error States

```tsx
// ✅ Pattern chuẩn cho mọi component fetch data
export function AnimeDetail({ slug }: { slug: string }) {
  const { data: anime, isLoading, isError, error } = useAnime(slug);

  if (isLoading) return <AnimeDetailSkeleton />;
  if (isError)   return <ErrorMessage message={(error as Error).message} />;
  if (!anime)    return <EmptyState message="Không tìm thấy anime" />;

  return <div>...</div>;
}

// Skeleton: luôn có skeleton riêng cho mỗi component lớn
export function AnimeDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />   {/* Banner */}
      <Skeleton className="h-8 w-1/3" />                 {/* Title */}
      <Skeleton className="h-4 w-full" />                {/* Description */}
    </div>
  );
}
```

---

## 15. Watch Progress — Ghi Lịch Sử

```tsx
// hooks/useWatchProgress.ts
// Ghi progress mỗi 15 giây khi đang xem, không spam API
export function useWatchProgress(episodeId: number, videoRef: RefObject<HTMLVideoElement>) {
  const { isLoggedIn } = useAuthStore();
  const mutation = useMutation({
    mutationFn: watchService.upsertProgress,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;

      const progressSeconds  = Math.floor(video.currentTime);
      const durationSeconds  = Math.floor(video.duration);
      const isCompleted      = durationSeconds > 0 && progressSeconds / durationSeconds > 0.85;

      mutation.mutate({ episodeId, progressSeconds, isCompleted });
    }, 15_000);  // 15 giây

    return () => clearInterval(interval);
  }, [episodeId, isLoggedIn]);
}
```

---

## 16. Checklist Khi Viết Code Mới

Trước khi submit bất kỳ code nào, AI phải tự kiểm tra:

- [ ] Component dùng TypeScript với interface props rõ ràng
- [ ] Named export cho components (không phải default), trừ pages
- [ ] Styling dùng Tailwind + `cn()` — không inline style, không hardcode màu
- [ ] Data fetching qua custom hook, không gọi axios trực tiếp trong component
- [ ] Query key đúng format mảng `["resource", id]`
- [ ] Loading state: có Skeleton component riêng
- [ ] Error state: có ErrorMessage component
- [ ] Form dùng React Hook Form + Zod resolver
- [ ] Environment variable dùng `import.meta.env.VITE_*`
- [ ] Import dùng alias `@/` không dùng relative path dài
- [ ] SSE connection có cleanup (abort controller trong useEffect return)
- [ ] HLS player có destroy() trong useEffect cleanup

---

## 17. Các Lỗi Thường Gặp — Tránh Ngay

```tsx
// ❌ Sai — gọi API trực tiếp trong component
function AnimeList() {
  useEffect(() => {
    axios.get("/animes").then(setAnimes);
  }, []);
}

// ✅ Đúng — dùng custom hook + TanStack Query
function AnimeList() {
  const { data, isLoading } = useAnimes();
}

// ❌ Sai — không cleanup SSE
useEffect(() => {
  const es = new EventSource(url);
  // Không return cleanup!
}, []);

// ✅ Đúng — luôn cleanup
useEffect(() => {
  const controller = new AbortController();
  fetchEventSource(url, { signal: controller.signal, ... });
  return () => controller.abort();   // Cleanup khi unmount
}, []);

// ❌ Sai — dùng process.env
const url = process.env.API_URL;

// ✅ Đúng — dùng import.meta.env với prefix VITE_
const url = import.meta.env.VITE_API_BASE_URL;

// ❌ Sai — không xử lý loading/error state
function Page() {
  const { data } = useAnime(slug);
  return <div>{data.title}</div>;  // Crash khi data chưa load
}

// ✅ Đúng — luôn handle loading và error
function Page() {
  const { data, isLoading, isError } = useAnime(slug);
  if (isLoading) return <Skeleton />;
  if (isError || !data) return <ErrorMessage />;
  return <div>{data.title}</div>;
}
```
