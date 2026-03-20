# BACKEND.md — Spring Boot Backend

> **Dành cho AI:** Đọc file này khi làm bất kỳ task nào liên quan đến backend. File này chứa đủ context để viết code đúng convention ngay lần đầu mà không cần hỏi thêm.

---

## 0. Thông Tin Cơ Bản

| Mục | Giá trị |
|---|---|
| Ngôn ngữ | Java 17 (Virtual Threads enabled) |
| Framework | Spring Boot 3.3.x |
| Build | Grovy 3.9+ |
| Package gốc | `com.hhkungfu` |
| Port | `8080` |
| Entry point | `AnimeStreamingApplication.java` |

## 1. Backend — Spring Boot

### 1.1 Core Framework

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| **Spring Boot** | 3.3.x | Framework nền tảng |
| **Spring Web MVC** | built-in | REST API, request handling |
| **Spring Data JPA** | built-in | ORM, truy vấn PostgreSQL |
| **Spring Security** | built-in | JWT Auth, OAuth2, phân quyền |
| **Spring Validation** | built-in | Validate request body (Bean Validation) |
| **Spring Async** | built-in | Chạy FFmpeg transcode không block request |
| **Spring Scheduling** | built-in | Cron job sync view count Redis → DB |
| **Spring Actuator** | built-in | Health check, metrics |
| **Springdoc OpenAPI** | 2.x | Swagger UI tự động sinh API docs |

### 1.2 Ngôn Ngữ & Build

| Hạng mục | Lựa chọn | Phiên bản |
|---|---|---|
| Ngôn ngữ | Java | 17 (LTS — Virtual Threads) |
| Build Tool | Grovy | 3.9+ |
| Runtime | OpenJDK | 17 |

### 1.3 Video Pipeline ⭐ (Điểm Cốt Lõi)

| Thư viện / Công cụ | Vai trò |
|---|---|
| **FFmpeg** (binary) | Transcode video MP4 → HLS multi-bitrate |
| **net.bramp.ffmpeg** (Java wrapper) | Gọi FFmpeg từ Java, track progress |
| **Spring Async + ThreadPoolExecutor** | Chạy transcode job bất đồng bộ, không block API |
| **Server-Sent Events (SSE)** | Push tiến trình transcode realtime lên client |
| **Apache Commons FileUpload** | Xử lý multipart upload file lớn |
| **Java NIO** | Đọc/ghi file HLS hiệu quả |

**Luồng video pipeline:**
```
Client upload MP4
      │
      ▼ (multipart/form-data)
Spring Controller nhận file
      │
      ▼
Lưu file tạm vào /tmp/uploads/
      │
      ▼ (@Async)
FFmpeg Worker:
  ├── Encode 360p  → /storage/hls/{id}/360p/  (index.m3u8 + *.ts)
  ├── Encode 720p  → /storage/hls/{id}/720p/
  └── Encode 1080p → /storage/hls/{id}/1080p/
      │
      ▼
Tạo master playlist → /storage/hls/{id}/master.m3u8
      │
      ▼
Cập nhật DB: episode.status = READY, hls_path = "/hls/{id}/master.m3u8"
      │
      ▼ (SSE)
Thông báo client: transcode hoàn thành
```

### 1.4 Authentication & Security

| Thư viện | Vai trò |
|---|---|
| **JJWT** (io.jsonwebtoken) | Tạo và xác thực JWT access/refresh token |
| **Spring Security OAuth2 Client** | Đăng nhập Google |
| **BCryptPasswordEncoder** | Hash mật khẩu |

### 1.5 Database

| Thư viện | Vai trò |
|---|---|
| **PostgreSQL JDBC Driver** | Kết nối PostgreSQL |
| **Flyway** | Migration schema, version control DB |
| **HikariCP** | Connection pool (built-in Spring Boot) |

### 1.6 Cache — Redis ⭐

| Thư viện | Vai trò |
|---|---|
| **Spring Data Redis** | Tích hợp Redis |
| **Lettuce** | Redis client (built-in Spring) |
| **Spring Cache `@Cacheable`** | Cache kết quả method tự động |

**Chiến lược Redis:**
- Cache anime detail, episode list (TTL 1h)
- Trending Sorted Set: `ZINCRBY` mỗi lượt xem, `ZRANGE` để lấy top
- Rate limit counter theo IP
- Session refresh token

### 1.7 Search

| Thư viện | Vai trò |
|---|---|
| **PostgreSQL FTS** | Fallback full-text search |

### 1.8 Tiện Ích

| Thư viện | Vai trò |
|---|---|
| **MapStruct** | Mapping Entity ↔ DTO |
| **Lombok** | Giảm boilerplate (getter, setter, builder) |
| **Jackson** | JSON serialization |
| **Apache Tika** | Detect MIME type file upload (kiểm tra đúng video) |
| **turkraft.springfilter** | filter data |

### 1.9 Testing

| Thư viện | Vai trò |
|---|---|
| **JUnit 5** | Unit test |
| **Mockito** | Mock dependencies |
| **Spring Boot Test** | Integration test |
| **Testcontainers** | Test với PostgreSQL/Redis thật trong Docker |
| **MockMvc** | Test REST API endpoints |
---

## 2. Cấu Trúc Package (Package-by-Feature)

```
com.hhkungfu/
├── config/              # Cấu hình toàn app (Security, Redis, Async, Swagger...)
├── common/              # Dùng chung: response wrapper, exception, validator, util
├── module/
│   ├── auth/            # Đăng ký, đăng nhập, JWT, OAuth2
│   ├── user/            # Profile, password
│   ├── anime/           # Catalog anime, genre, studio
│   ├── video/           # ⭐ Upload, transcode FFmpeg, stream HLS
│   ├── watch/           # Watch history, progress
│   ├── interaction/     # Bookmark, rating, comment
│   ├── trending/        # Redis view count, trending list
│   ├── recommendation/  # Content-based filtering
│   └── admin/           # Dashboard, analytics, quản lý
└── infrastructure/
    ├── storage/         # LocalStorageService, R2StorageService
    ├── cache/           # RedisCacheService
    ├── search/          # ElasticsearchService
    └── media/           # CloudinaryService
```

### Cấu Trúc Bên Trong Mỗi Module

```
module/{name}/
├── controller/     # @RestController — chỉ nhận request, gọi service, trả response
├── service/        # @Service — business logic
├── repository/     # @Repository — extends JpaRepository
├── entity/         # @Entity JPA
├── dto/            # Request/Response DTOs (record hoặc class)
├── enums/          # Enum types của module
└── mapper/         # MapStruct mapper (Entity ↔ DTO)
```

---

## 3. Conventions — Code Style

### Đặt Tên

```java
// Controller: tên module + "Controller"
AnimeController, VideoUploadController, AuthController

// Service: tên chức năng + "Service"
AnimeService, VideoTranscodeService, JwtService

// Repository: tên Entity + "Repository"
AnimeRepository, EpisodeRepository

// Entity: danh từ số ít, PascalCase
Anime, Episode, User, TranscodeJob

// DTO: mô tả nội dung rõ ràng
AnimeDto              // response đầy đủ
AnimeSummaryDto       // response rút gọn dùng trong danh sách
CreateAnimeRequest    // request tạo mới
UpdateAnimeRequest    // request cập nhật
TranscodeProgressDto  // SSE event payload
StreamInfoDto         // thông tin stream trả về client
```

### Entity

```java
// ✅ Đúng — Entity chuẩn
@Entity
@Table(name = "animes")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Anime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnimeStatus status;

    // Quan hệ Many-to-Many: luôn dùng Set, không dùng List
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "anime_genres",
        joinColumns = @JoinColumn(name = "anime_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new HashSet<>();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;   // Soft delete

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

// ✅ Enum dùng STRING, không dùng ORDINAL
public enum AnimeStatus { ONGOING, COMPLETED, UPCOMING }
public enum VideoStatus { PENDING, PROCESSING, READY, FAILED }
public enum VideoQuality { Q_360P, Q_720P, Q_1080P }
```

### DTO

```java
// ✅ Dùng Java record cho immutable DTOs
public record CreateAnimeRequest(
    @NotBlank @Size(max = 255) String title,
    @NotBlank @Pattern(regexp = "^[a-z0-9-]+$") String slug,
    @NotNull AnimeStatus status,
    @NotNull AnimeType type,
    @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal malScore,
    List<Long> genreIds,
    List<Long> studioIds
) {}

// ✅ Response DTO — dùng class thông thường nếu cần builder
@Getter @Builder
public class AnimeDto {
    private Long id;
    private String title;
    private String slug;
    // ...
}
```

### Service

```java
// ✅ Service chuẩn — transactional, exception rõ ràng
@Service
@RequiredArgsConstructor
public class AnimeService {

    private final AnimeRepository animeRepository;
    private final AnimeMapper animeMapper;
    private final RedisCacheService cacheService;

    @Transactional(readOnly = true)
    public AnimeDto getBySlug(String slug) {
        // 1. Thử cache trước
        return cacheService.getAnime(slug)
            .orElseGet(() -> {
                // 2. Query DB
                Anime anime = animeRepository.findBySlugAndDeletedAtIsNull(slug)
                    .orElseThrow(() -> new ResourceNotFoundException("Anime not found by slug" {slug}, "ANIME", "animenotfound"));
                AnimeDto dto = animeMapper.toDto(anime);
                // 3. Lưu cache
                cacheService.putAnime(slug, dto);
                return dto;
            });
    }

    @Transactional
    public AnimeDto create(CreateAnimeRequest request) {
        if (animeRepository.existsBySlug(request.slug())) {
            throw new BusinessException("Slug already exists", "ANIME", "slugalreadyexists");
        }
        Anime anime = animeMapper.toEntity(request);
        return animeMapper.toDto(animeRepository.save(anime));
    }
}
```

### Controller

```java
// ✅ Controller chuẩn — mỏng, chỉ delegate xuống service
@Slf4j
@RestController
@RequestMapping("/api/v1/animes")
@RequiredArgsConstructor
@Tag(name = "Anime", description = "Anime catalog APIs")
public class AnimeController {

    private final AnimeService animeService;

    @GetMapping
    @ApiMessage("Get animes successfully")
    @Operation(summary = "Get animes", description = "Get paginated list of animes")
    @ApiResponse(responseCode = "200", description = "Animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getAnimes(
            AnimeFilterRequest request) {
        return ResponseEntity.ok(animeService.getAnimes(request));
    }

    @GetMapping("/{idOrSlug}")
    @ApiMessage("Get anime details successfully")
    @Operation(summary = "Get anime details", description = "Get anime details by ID or Slug")
    @ApiResponse(responseCode = "200", description = "Anime details retrieved successfully")
    public ResponseEntity<AnimeDetailDto> getAnimeDetails(@PathVariable("idOrSlug") String idOrSlug) {
        log.info("REST request to get anime details: {}", idOrSlug);
        return ResponseEntity.ok(animeService.getByIdOrSlug(idOrSlug));
    }
}
```

### Exception Handling

```java
// ✅ Dùng exception tập trung, không throw RuntimeException trực tiếp (java/com/hhkugfu/backend/common/exception)
throw new ResourceNotFoundException("Anime not found by slug" {slug}, "ANIME", "animenotfound");
throw new BusinessException("Slug already exists", "ANIME", "slugalreadyexists");
// GlobalExceptionHandler xử lý và trả về ApiResponse.error(...)
```

---

## 4. Response Wrapper

```java
// Tất cả API success đều trả về ApiResponse
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    private Instant timestamp;
}

// Tất cả API error đều trả về ErrorResponse
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private Object error;
    private Instant timestamp;
}

// Danh sách phân trang
@Getter @Builder
public class PageResponse<T> {
    private List<T> items;
    private PaginationMeta pagination;

    @Getter @Builder
    public static class PaginationMeta {
        private int page;
        private int limit;
        private long total;
        private int totalPages;
    }
}

//Custom response
@RestControllerAdvice
public class CustomResponseBodyAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        try {
            String path = ((ServletWebRequest) RequestContextHolder.getRequestAttributes())
                    .getRequest()
                    .getRequestURI();

            return !(path.startsWith("/v3/api-docs") ||
                    path.startsWith("/swagger") ||
                    path.startsWith("/swagger-ui") ||
                    path.startsWith("/actuator") ||
                    path.contains("api-docs"));
        } catch (Exception e) {
            return true; // fallback an toàn
        }
    }

    @Override
    public Object beforeBodyWrite(Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {

        HttpServletResponse httpResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = httpResponse.getStatus();

        if (body instanceof byte[] || body instanceof String || body instanceof Resource) {
            return body;
        }

        if (body instanceof com.wms.backend.shared.dto.response.ApiResponse) {
            return body;
        }

        // Tránh can thiệp vào các response không phải JSON như Swagger
        if (selectedContentType != null && !selectedContentType.includes(MediaType.APPLICATION_JSON) && status < 400) {
            return body;
        }

        if (status >= 400) {
            ErrorResponse errorResponse = ErrorResponse.builder()
                    .success(false)
                    .error(body)
                    .timestamp(java.time.Instant.now())
                    .build();
            return errorResponse;
        }

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setSuccess(true);
        apiResponse.setData(body);
        apiResponse.setMessage("CALL API SUCCESS");
        apiResponse.setTimestamp(java.time.Instant.now());

        ApiMessage apiMessage = returnType.getMethodAnnotation(ApiMessage.class);
        if (apiMessage != null) {
            apiResponse.setMessage(apiMessage.value());
        }

        return apiResponse;
    }
}
```

---

## 5. Video Pipeline — Chi Tiết Kỹ Thuật ⭐

Đây là phần quan trọng nhất và phức tạp nhất của dự án.

### Luồng Đầy Đủ

```
POST /api/v1/admin/episodes/{id}/upload (multipart/form-data)
│
├── VideoUploadController.uploadVideo()
│   ├── Validate: MIME type (video/mp4, video/x-matroska...)
│   ├── Validate: file size <= 2GB
│   └── Gọi VideoUploadService.initiateUpload()
│
├── VideoUploadService.initiateUpload()
│   ├── Lưu file tạm: /tmp/uploads/{UUID}.mp4
│   ├── Tạo TranscodeJob { status=QUEUED, episodeId, inputPath }
│   ├── Save TranscodeJob vào DB
│   └── Gọi @Async VideoTranscodeService.transcode(jobId)
│
├── Response 202: { jobId, status: "QUEUED" }   ← trả về NGAY
│
└── [BACKGROUND] VideoTranscodeService.transcode(jobId)
    ├── Update TranscodeJob { status=RUNNING, startedAt }
    ├── Update Episode { videoStatus=PROCESSING }
    │
    ├── FFmpeg encode 360p:
    │   ffmpeg -i input.mp4 \
    │     -vf scale=640:360 -c:v libx264 -crf 23 -preset fast \
    │     -c:a aac -b:a 128k \
    │     -hls_time 10 -hls_list_size 0 -hls_segment_type mpegts \
    │     -hls_segment_filename "storage/hls/{id}/360p/seg%03d.ts" \
    │     "storage/hls/{id}/360p/index.m3u8"
    │   → Update progress = 33%  → SSE push
    │
    ├── FFmpeg encode 720p → progress = 66% → SSE push
    ├── FFmpeg encode 1080p → progress = 99% → SSE push
    │
    ├── Tạo master.m3u8:
    │   #EXTM3U
    │   #EXT-X-VERSION:3
    │   #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
    │   360p/index.m3u8
    │   #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
    │   720p/index.m3u8
    │   #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
    │   1080p/index.m3u8
    │
    ├── Upload tất cả file lên R2 (nếu production)
    ├── Ghi VideoFile records vào DB
    ├── Update Episode { videoStatus=READY, hlsPath, hlsBaseUrl }
    ├── Update TranscodeJob { status=DONE, progress=100, completedAt }
    ├── Xóa file tạm /tmp/uploads/{UUID}.mp4
    └── SSE push event "done"
```

### FFmpeg Command Patterns

```java
// 360p
new FFmpegBuilder()
    .setInput(inputPath)
    .overrideOutputFiles(true)
    .addOutput(outputDir + "/360p/index.m3u8")
        .setVideoCodec("libx264")
        .setVideoFilter("scale=640:360")
        .setConstantRateFactor(23)
        .setPreset("fast")
        .setAudioCodec("aac")
        .setAudioBitRate(128_000)
        .addExtraArgs("-hls_time", "10")
        .addExtraArgs("-hls_list_size", "0")
        .addExtraArgs("-hls_segment_type", "mpegts")
        .addExtraArgs("-hls_segment_filename", outputDir + "/360p/seg%03d.ts")
        .done()
    .build();
```

### SSE Implementation

```java
// VideoProgressController — SSE endpoint
@GetMapping(value = "/admin/transcode/{jobId}/progress",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamProgress(@PathVariable Long jobId) {
    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
    // Lưu emitter vào Map<jobId, SseEmitter>
    // TranscodeService gọi emitter.send() khi progress cập nhật
    return emitter;
}

// Payload SSE
public record TranscodeProgressDto(
    Long jobId,
    String status,       // RUNNING | DONE | FAILED
    int progress,        // 0–100
    String currentStep,  // "Encoding 720p..."
    String masterUrl,    // chỉ có khi DONE
    String error         // chỉ có khi FAILED
) {}
```

### ThreadPoolExecutor Config

```java
// AsyncConfig.java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "transcodeExecutor")
    public Executor transcodeExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);      // Chạy 2 job cùng lúc
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(10);    // Tối đa 10 job đang chờ
        executor.setThreadNamePrefix("transcode-");
        executor.initialize();
        return executor;
    }
}

// Dùng trong service
@Async("transcodeExecutor")
public CompletableFuture<Void> transcode(Long jobId) { ... }
```

---

## 6. Redis — Patterns Sử Dụng

```java
// Keys chuẩn — luôn dùng constants, không hardcode string
public final class RedisKeys {
    public static String anime(Long id)         { return "anime:" + id; }
    public static String animeSlug(String slug) { return "anime:slug:" + slug; }
    public static String trending()             { return "anime:trending"; }
    public static String viewCount(Long epId)   { return "viewcount:ep:" + epId; }
    public static String rateLimit(String ip)   { return "ratelimit:" + ip; }
    public static String refresh(String userId) { return "refresh:" + userId; }
}

// Cache-Aside pattern
public Optional<AnimeDto> getAnime(String slug) {
    String key = RedisKeys.animeSlug(slug);
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) return Optional.of(objectMapper.readValue(json, AnimeDto.class));
    return Optional.empty();
}

// Trending — Redis Sorted Set
public void incrementView(Long animeId) {
    redisTemplate.opsForZSet().incrementScore(
        RedisKeys.trending(), animeId.toString(), 1.0
    );
}

public List<Long> getTopTrending(int limit) {
    Set<String> ids = redisTemplate.opsForZSet()
        .reverseRange(RedisKeys.trending(), 0, limit - 1);
    return ids.stream().map(Long::parseLong).toList();
}
```

---

## 7. Security

```java
// JWT: access token 24h, refresh token 7 ngày
// Stored: access trong memory (FE), refresh trong Redis

// Các endpoint PUBLIC (không cần JWT):
GET  /api/v1/animes/**
GET  /api/v1/genres/**
GET  /api/v1/studios/**
GET  /api/v1/episodes/*/stream-info
POST /api/v1/episodes/*/view
GET  /files/hls/**
GET  /api/v1/recommendations/popular
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh

// Cần USER role:
POST /api/v1/users/me/**
POST /api/v1/ratings/**
POST /api/v1/bookmarks/**
POST /api/v1/.../comments

// Cần ADMIN role:
POST   /api/v1/animes
PUT    /api/v1/animes/**
DELETE /api/v1/animes/**
POST   /api/v1/admin/**
```

---

## 8. Database Access Patterns

```java
// ✅ Repository: dùng method name khi đơn giản
Optional<Anime> findBySlugAndDeletedAtIsNull(String slug);
List<Anime> findByIsFeaturedTrueAndDeletedAtIsNull();
boolean existsBySlug(String slug);

// ✅ Dùng @Query JPQL khi cần JOIN phức tạp
@Query("""
    SELECT DISTINCT a FROM Anime a
    LEFT JOIN FETCH a.genres g
    WHERE (:status IS NULL OR a.status = :status)
      AND (:year IS NULL OR a.year = :year)
      AND a.deletedAt IS NULL
    ORDER BY a.viewCount DESC
""")
Page<Anime> findWithFilters(
    @Param("status") AnimeStatus status,
    @Param("year") Integer year,
    Pageable pageable
);

// ✅ Pageable: tạo từ request params
Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "viewCount"));

// ✅ Lazy loading: luôn dùng LAZY, không dùng EAGER
// Tránh N+1: dùng JOIN FETCH khi cần data của quan hệ
```

---

## 9. Storage Abstraction

```java
// Interface — backend không quan tâm local hay R2
public interface StorageService {
    String save(byte[] data, String path);   // Trả về public URL
    void delete(String path);
    boolean exists(String path);
    Resource load(String path);              // Cho stream file
}

// Dev: LocalStorageService implements StorageService
// Prod: R2StorageService implements StorageService

// Chọn implementation qua @ConditionalOnProperty
@ConditionalOnProperty(name = "storage.type", havingValue = "local")
@Service public class LocalStorageService implements StorageService { ... }

@ConditionalOnProperty(name = "storage.type", havingValue = "r2")
@Service public class R2StorageService implements StorageService { ... }
```

---

## 10. application.yml — Cấu Hình Quan Trọng

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate          # KHÔNG dùng create/update — chỉ dùng Flyway
    open-in-view: false           # Tắt OSIV để tránh lazy load ngoài transaction

  flyway:
    enabled: true
    locations: classpath:db/migration

  data:
    redis:
      host: ${SPRING_REDIS_HOST:localhost}
      port: ${SPRING_REDIS_PORT:6379}

  servlet:
    multipart:
      max-file-size: 2GB
      max-request-size: 2GB

jwt:
  secret: ${JWT_SECRET}
  expiration-ms: 86400000         # 24h

storage:
  type: ${STORAGE_TYPE:local}
  local-path: ${STORAGE_LOCAL_PATH:/app/storage}
  base-url: ${STORAGE_BASE_URL:http://localhost:8080/files}

app:
  cors:
    allowed-origins:
      - http://localhost:5173
      - ${FRONTEND_URL:}
```

---

## 11. Testing Conventions

```java
// Unit test: dùng Mockito, test service riêng lẻ
@ExtendWith(MockitoExtension.class)
class AnimeServiceTest {
    @Mock AnimeRepository animeRepository;
    @Mock AnimeMapper animeMapper;
    @InjectMocks AnimeService animeService;

    @Test
    void getBySlug_whenExists_returnsDto() { ... }

    @Test
    void getBySlug_whenNotFound_throwsResourceNotFoundException() { ... }
}

// Integration test: dùng Testcontainers với DB thật
@SpringBootTest
@Testcontainers
class VideoUploadIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void uploadAndTranscode_fullPipeline() { ... }
}

// API test: dùng MockMvc
@WebMvcTest(AnimeController.class)
class AnimeControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean AnimeService animeService;

    @Test
    void getAnimes_returnsPagedList() throws Exception {
        mockMvc.perform(get("/api/v1/animes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }
}
```

---

## 12. Checklist Khi Viết Code Mới

Trước khi submit bất kỳ code nào, AI phải tự kiểm tra:

- [ ] Entity dùng `@Enumerated(EnumType.STRING)`, không dùng ORDINAL
- [ ] Quan hệ dùng `FetchType.LAZY`, không dùng EAGER
- [ ] Controller không chứa business logic
- [ ] Service method có `@Transactional` hoặc `@Transactional(readOnly = true)`
- [ ] Response luôn wrap trong `ApiResponse<T>`
- [ ] Exception dùng custom exception class, không throw `RuntimeException` trực tiếp
- [ ] DTO validation dùng Bean Validation annotations (`@NotBlank`, `@Size`, etc.)
- [ ] Redis key dùng `RedisKeys.*()` constants, không hardcode string
- [ ] File HLS path không trả về absolute path — chỉ trả về public URL
- [ ] FFmpeg job chạy trong `@Async` thread pool, không chạy trong request thread
- [ ] Unit test cho mọi service method mới

---

## 13. Các Lỗi Thường Gặp — Tránh Ngay

```java
// ❌ Sai — EAGER loading gây N+1
@ManyToMany(fetch = FetchType.EAGER)

// ✅ Đúng — LAZY + JOIN FETCH khi cần
@ManyToMany(fetch = FetchType.LAZY)

// ❌ Sai — ddl-auto tự sửa schema
spring.jpa.hibernate.ddl-auto=update

// ✅ Đúng — chỉ validate, Flyway quản lý schema
spring.jpa.hibernate.ddl-auto=validate

// ❌ Sai — chạy FFmpeg trong request thread, block tới hết transcode
public AnimeDto uploadVideo(...) {
    ffmpegService.transcode(file); // Block 5–10 phút
    return response;
}

// ✅ Đúng — trả 202 ngay, transcode chạy nền
public UploadResponse uploadVideo(...) {
    Long jobId = uploadService.initiateUpload(file); // Lưu file + tạo job
    transcodeService.transcode(jobId);               // @Async, không block
    return new UploadResponse(jobId, "QUEUED");      // Trả 202 ngay
}

// ❌ Sai — hardcode Redis key
redisTemplate.opsForValue().set("anime:" + id, json);

// ✅ Đúng — dùng constant
redisTemplate.opsForValue().set(RedisKeys.anime(id), json);
```
