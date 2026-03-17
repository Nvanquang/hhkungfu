# Project Architecture

Scalable, maintainable frontend architecture for a React + TypeScript application.

---

## Folder Structure

```
src/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/
│   │
│   ├── ui/                     # Primitive UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Pagination.tsx
│   │
│   ├── layout/                 # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageWrapper.tsx
│   │
│   ├── common/                 # Reusable shared components
│   │   ├── Loader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ThemeToggle.tsx
│   │
│   └── features/               # Domain reusable components
│       ├── AnimeCard.tsx
│       ├── EpisodeItem.tsx
│       ├── CommentItem.tsx
│       └── SearchBar.tsx
│
├── pages/
│   │
│   ├── Home/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── AnimeCarousel.tsx
│   │   │   └── TrendingList.tsx
│   │   ├── hooks/
│   │   │   └── useHomeAnimes.ts
│   │   └── api.ts              # ⭐ API riêng page
│   │
│   ├── AnimeCatalog/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── FilterPanel.tsx
│   │   │   └── AnimeGrid.tsx
│   │   ├── hooks/
│   │   │   └── useAnimeCatalog.ts
│   │   └── api.ts
│   │
│   ├── AnimeDetail/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── AnimeInfo.tsx
│   │   │   ├── EpisodeList.tsx
│   │   │   └── CommentSection.tsx
│   │   ├── hooks/
│   │   │   └── useAnimeDetail.ts
│   │   └── api.ts
│   │
│   ├── Watch/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── QualitySelector.tsx
│   │   │   └── SubtitleSelector.tsx
│   │   ├── hooks/
│   │   │   └── useWatch.ts
│   │   └── api.ts
│   │
│   ├── Search/
│   │   ├── index.tsx
│   │   ├── hooks/
│   │   │   └── useSearch.ts
│   │   └── api.ts
│   │
│   ├── Auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── api.ts
│   │
│   ├── Profile/
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── WatchHistory.tsx
│   │   │   └── BookmarkList.tsx
│   │   └── api.ts
│   │
│   └── Admin/
│       ├── Dashboard.tsx
│       ├── AnimeManager.tsx
│       ├── EpisodeManager.tsx
│       ├── UserManager.tsx
│       └── api.ts
│
├── hooks/                      # Global reusable hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── usePagination.ts
│
├── store/                      # Global state
│   ├── authStore.ts
│   ├── playerStore.ts
│   └── uiStore.ts
│
├── services/                   # Shared services
│   └── apiClient.ts            # Axios instance + interceptors
│
├── lib/                        # Third-party setup
│   ├── queryClient.ts
│   └── axios.ts
│
├── types/
│   ├── anime.ts
│   ├── episode.ts
│   ├── user.ts
│   └── api.ts
│
├── utils/
│   ├── cn.ts
│   ├── format.ts
│   └── validators.ts
│
├── constants/
│   ├── routes.ts
│   └── config.ts
│
├── routes/
│   └── router.tsx
│
├── styles/
│   ├── globals.css
│   └── tokens.css
│
├── App.tsx
└── main.tsx
```