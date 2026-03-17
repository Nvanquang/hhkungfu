# Project Architecture
---

## 2. Backend — Spring Boot

```
backend/
│
├── src/
│   ├── main/
│   │   ├── java/com/hhkungfu/backend
│   │   │   │
│   │   │   ├── HhkungfuApplication.java    # Entry point
│   │   │   │
│   │   │   ├── config/                           # Cấu hình toàn cục
│   │   │   │   ├── SecurityConfig.java           # Spring Security, CORS, JWT filter
│   │   │   │   ├── RedisConfig.java              # Redis connection + CacheManager
│   │   │   │   ├── AsyncConfig.java              # ThreadPoolExecutor cho FFmpeg jobs
│   │   │   │   ├── ElasticsearchConfig.java      # Elasticsearch client
│   │   │   │   ├── SwaggerConfig.java            # Springdoc OpenAPI
│   │   │   │   └── StorageConfig.java            # Đường dẫn lưu file HLS
│   │   │   │
│   │   │   ├── common/                           # Dùng chung toàn app
│   │   │   │   ├── response/
│   │   │   │   │   ├── ApiResponse.java          # Wrapper response chuẩn
│   │   │   │   │   └── PageResponse.java         # Wrapper phân trang
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GlobalExceptionHandler.java  # @ControllerAdvice xử lý lỗi
│   │   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   │   ├── BusinessException.java
│   │   │   │   │   └── StorageException.java
│   │   │   │   ├── validator/
│   │   │   │   │   └── VideoFileValidator.java   # Kiểm tra MIME type file upload
│   │   │   │   └── util/
│   │   │   │       ├── SlugUtil.java             # Tạo slug từ title
│   │   │   │       └── FileUtil.java             # Helper xử lý file
│   │   │   │
│   │   │   ├── module/
│   │   │   │   │
│   │   │   │   ├── auth/                         # Xác thực người dùng
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── AuthController.java   # /api/v1/auth/**
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── AuthService.java
│   │   │   │   │   │   └── JwtService.java       # Tạo / xác thực JWT
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   │   └── AuthResponse.java
│   │   │   │   │   └── filter/
│   │   │   │   │       └── JwtAuthFilter.java    # Filter xác thực mỗi request
│   │   │   │   │
│   │   │   │   ├── user/                         # Quản lý người dùng
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── UserController.java   # /api/v1/users/**
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── UserService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── UserRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── User.java             # @Entity JPA
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── UserProfileDto.java
│   │   │   │   │       └── UpdateProfileRequest.java
│   │   │   │   │
│   │   │   │   ├── anime/                        # Quản lý anime catalog
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── AnimeController.java  # /api/v1/animes/**
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── AnimeService.java
│   │   │   │   │   │   └── AnimeSearchService.java  # Elasticsearch queries
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── AnimeRepository.java
│   │   │   │   │   │   ├── GenreRepository.java
│   │   │   │   │   │   └── StudioRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── Anime.java
│   │   │   │   │   │   ├── Genre.java
│   │   │   │   │   │   └── Studio.java
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── AnimeDto.java
│   │   │   │   │       ├── AnimeSummaryDto.java  # Dùng trong danh sách
│   │   │   │   │       ├── CreateAnimeRequest.java
│   │   │   │   │       └── UpdateAnimeRequest.java
│   │   │   │   │
│   │   │   │   ├── video/                        # ⭐ Video Pipeline Module
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   ├── VideoUploadController.java   # POST upload
│   │   │   │   │   │   ├── VideoStreamController.java   # GET stream HLS
│   │   │   │   │   │   └── VideoProgressController.java # SSE progress
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── VideoUploadService.java      # Nhận file, lưu tạm
│   │   │   │   │   │   ├── VideoTranscodeService.java   # Gọi FFmpeg (@Async)
│   │   │   │   │   │   ├── VideoStreamService.java      # Phục vụ HLS files
│   │   │   │   │   │   └── VideoStorageService.java     # CRUD file trên disk/R2
│   │   │   │   │   ├── job/
│   │   │   │   │   │   └── TranscodeJob.java            # Runnable transcode task
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── Episode.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── EpisodeDto.java
│   │   │   │   │   │   ├── StreamInfoDto.java           # URL HLS + subtitles
│   │   │   │   │   │   ├── UploadRequest.java
│   │   │   │   │   │   └── TranscodeProgressDto.java    # SSE event payload
│   │   │   │   │   └── enums/
│   │   │   │   │       ├── VideoStatus.java             # PENDING/PROCESSING/READY/FAILED
│   │   │   │   │       └── VideoQuality.java            # Q_360P/Q_720P/Q_1080P
│   │   │   │   │
│   │   │   │   ├── watch/                        # Lịch sử & tiến trình xem
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── WatchController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── WatchService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── WatchHistoryRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── WatchHistory.java
│   │   │   │   │   └── dto/
│   │   │   │   │       └── WatchProgressRequest.java
│   │   │   │   │
│   │   │   │   ├── interaction/                  # Bookmark, Rating, Comment
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   ├── BookmarkController.java
│   │   │   │   │   │   ├── RatingController.java
│   │   │   │   │   │   └── CommentController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── BookmarkService.java
│   │   │   │   │   │   ├── RatingService.java
│   │   │   │   │   │   └── CommentService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── BookmarkRepository.java
│   │   │   │   │   │   ├── RatingRepository.java
│   │   │   │   │   │   └── CommentRepository.java
│   │   │   │   │   └── entity/
│   │   │   │   │       ├── Bookmark.java
│   │   │   │   │       ├── Rating.java
│   │   │   │   │       └── Comment.java
│   │   │   │   │
│   │   │   │   ├── trending/                     # ⭐ Redis Trending Module
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── TrendingController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── ViewCountService.java    # Redis ZINCRBY
│   │   │   │   │   │   └── TrendingService.java     # Redis ZRANGE
│   │   │   │   │   └── scheduler/
│   │   │   │   │       └── ViewCountSyncJob.java    # Mỗi giờ sync Redis → PostgreSQL
│   │   │   │   │
│   │   │   │   ├── recommendation/               # Gợi ý anime
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── RecommendationController.java
│   │   │   │   │   └── service/
│   │   │   │   │       └── RecommendationService.java  # Content-Based Filtering
│   │   │   │   │
│   │   │   │   └── admin/                        # Admin panel APIs
│   │   │   │       ├── controller/
│   │   │   │       │   └── AdminController.java
│   │   │   │       └── service/
│   │   │   │           └── AdminService.java
│   │   │   │
│   │   │   └── infrastructure/                   # Tích hợp hệ thống ngoài
│   │   │       ├── storage/
│   │   │       │   ├── LocalStorageService.java  # Lưu file local (dev)
│   │   │       │   └── R2StorageService.java     # Cloudflare R2 (production)
│   │   │       ├── cache/
│   │   │       │   └── RedisCacheService.java    # Cache operations
│   │   │       ├── search/
│   │   │       │   └── ElasticsearchService.java # Index + search
│   │   │       └── media/
│   │   │           └── CloudinaryService.java    # Upload ảnh
│   │   │
│   │   └── resources/
│   │       ├── application.yml                   # Config chung
│   │       ├── application-dev.yml               # Config môi trường dev
│   │       ├── application-prod.yml              # Config môi trường production
│   │       └── db/migration/                     # Flyway SQL migrations
│   │           ├── V1__init_schema.sql
│   │           ├── V2__seed_genres.sql
│   │           └── V3__add_video_status.sql
│   │
│   └── test/
│       └── java/com/hhkungfu/backend
│           ├── module/
│           │   ├── auth/AuthServiceTest.java
│           │   ├── anime/AnimeServiceTest.java
│           │   └── video/VideoTranscodeServiceTest.java
│           └── integration/
│               └── VideoUploadIntegrationTest.java
│
├── Dockerfile                        # Build image chứa Spring Boot + FFmpeg
├── pom.xml
└── .env.example
```