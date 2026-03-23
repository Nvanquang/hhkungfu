# Module: Episode & Video Pipeline
**Package:** `com.hhkungfu.episode` + `com.hhkungfu.video`
**Phụ trách:** CRUD tập phim, upload video, FFmpeg transcode HLS, SSE progress, stream HLS

---

## 1. Database Tables

### `episodes`
```sql
CREATE TABLE episodes (
    id               BIGSERIAL    PRIMARY KEY,
    anime_id         BIGINT       NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    episode_number   SMALLINT     NOT NULL,
    title            VARCHAR(255),
    description      TEXT,
    thumbnail_url    VARCHAR(500),
    is_vip_only      BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE → chỉ user có subscription ACTIVE mới stream được
    video_status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                         CHECK (video_status IN ('PENDING','PROCESSING','READY','FAILED')),
    hls_path         VARCHAR(500),     -- VD: hls/ep-101/master.m3u8
    hls_base_url     VARCHAR(500),     -- URL public đầy đủ để HLS.js dùng
    duration_seconds INTEGER,
    file_size_bytes  BIGINT,
    has_vietsub      BOOLEAN      NOT NULL DEFAULT FALSE,
    has_engsub       BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count       BIGINT       NOT NULL DEFAULT 0,
    aired_date       DATE,
    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_episodes_per_anime UNIQUE (anime_id, episode_number)
);
CREATE INDEX idx_episodes_anime_id ON episodes (anime_id, episode_number ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_episodes_status   ON episodes (video_status);
CREATE INDEX idx_episodes_vip      ON episodes (is_vip_only) WHERE deleted_at IS NULL;
```

### `video_files`
```sql
CREATE TABLE video_files (
    id         BIGSERIAL    PRIMARY KEY,
    episode_id BIGINT       NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    quality    VARCHAR(10)  NOT NULL CHECK (quality IN ('360p','720p','1080p')),
    file_path  VARCHAR(500) NOT NULL,   -- Path trên R2/local storage
    file_type  VARCHAR(10)  NOT NULL CHECK (file_type IN ('PLAYLIST','SEGMENT')),
    file_name  VARCHAR(255) NOT NULL,
    file_size  BIGINT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_video_files_episode ON video_files (episode_id, quality);
```

### `transcode_jobs`
```sql
CREATE TABLE transcode_jobs (
    id            BIGSERIAL   PRIMARY KEY,
    episode_id    BIGINT      NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                      CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
    progress      SMALLINT    NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    current_step  VARCHAR(100),         -- "Encoding 720p..."
    input_path    VARCHAR(500) NOT NULL, -- Path file gốc tạm
    output_dir    VARCHAR(500),          -- Thư mục output HLS
    error_message TEXT,
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transcode_episode ON transcode_jobs (episode_id);
CREATE INDEX idx_transcode_status  ON transcode_jobs (status);
```

### `subtitles`
```sql
CREATE TABLE subtitles (
    id         BIGSERIAL   PRIMARY KEY,
    episode_id BIGINT      NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    language   VARCHAR(10) NOT NULL,   -- 'vi', 'en', 'ja'
    label      VARCHAR(50) NOT NULL,   -- 'Vietsub', 'Engsub'
    url        VARCHAR(500) NOT NULL   -- URL file .vtt
);
CREATE INDEX idx_subtitles_episode ON subtitles (episode_id);
```

### Redis keys liên quan
| Key | TTL | Mô tả |
|---|---|---|
| `episode:{id}` | 1800s | Cache chi tiết episode |
| `episode:{id}:stream` | 1800s | Cache stream-info (HLS URLs + subtitles) |
| `viewcount:ep:{id}` | Không hết | Counter lượt xem realtime |
| `transcode:progress:{jobId}` | 3600s | Cache tiến trình transcode |


---

## 3. API Endpoints

### GET `/api/v1/animes/:animeId/episodes`
**Auth:** Không cần | **Query Params:** `page`, `limit` (default 50), `order` (asc default)

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101, "animeId": 1, "episodeNumber": 1,
        "title": "Ryomen Sukuna", "thumbnailUrl": "https://...",
        "durationSeconds": 1440, "videoStatus": "READY",
        "isVipOnly": false,
        "hasVietsub": true, "hasEngsub": false,
        "viewCount": 350000, "airedDate": "2020-10-03"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 24, "totalPages": 1 }
  }
}
```

---

### GET `/api/v1/animes/:animeId/episodes/:episodeNumber`
**Auth:** Không cần

**Response `200`:** Giống item trên + thêm `description`, `hlsBaseUrl`, `subtitles[]`

---

### GET `/api/v1/episodes/:id/stream-info`
**Auth:** Tùy — nếu `is_vip_only = TRUE` thì cần đăng nhập + VIP

**Logic:**
```
1. Lấy episode từ cache Redis hoặc DB
2. Nếu episode.videoStatus != READY → EPISODE_NOT_READY 409
3. Nếu episode.isVipOnly = TRUE:
   a. Nếu chưa đăng nhập → VIP_REQUIRED 403
   b. Check Redis vip:status:{userId} (cache 5 phút)
      hoặc query user_subscriptions WHERE status=ACTIVE AND expires_at > NOW()
   c. Nếu không phải VIP → VIP_REQUIRED 403
4. Increment Redis viewcount:ep:{id}
5. ZINCRBY anime:trending {animeId} 1
6. Trả về stream-info từ cache hoặc build mới
```

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "episodeId": 101, "videoStatus": "READY",
    "masterUrl": "https://cdn.example.com/hls/ep-101/master.m3u8",
    "qualities": [
      { "quality": "360p",  "url": "https://.../ep-101/360p/index.m3u8" },
      { "quality": "720p",  "url": "https://.../ep-101/720p/index.m3u8" },
      { "quality": "1080p", "url": "https://.../ep-101/1080p/index.m3u8" }
    ],
    "subtitles": [
      { "language": "vi", "label": "Vietsub", "url": "https://.../ep-101.vi.vtt" }
    ],
    "durationSeconds": 1440
  }
}
```

**Errors:** `EPISODE_NOT_READY` 409 | `VIP_REQUIRED` 403 | `EPISODE_NOT_FOUND` 404

---

### POST `/api/v1/episodes/:id/view`
**Auth:** Không cần

**Logic:**
```
INCR Redis viewcount:ep:{id}
ZINCRBY Redis anime:trending {animeId} 1
```

**Response `204`:** No content

---

### POST `/api/v1/animes/:animeId/episodes` *(Admin)*
**Auth:** ADMIN

**Request:**
```jsonc
{
  "episodeNumber": 1,             // required | unique trong anime
  "title": "Ryomen Sukuna",
  "description": "...",
  "thumbnailUrl": "https://...",
  "isVipOnly": false,             // default false
  "hasVietsub": true,
  "hasEngsub": false,
  "airedDate": "2020-10-03"
}
```

**Flow:** INSERT episode với `video_status = PENDING`. Upload video qua API riêng.

**Response `201`:** EpisodeDto với `videoStatus: "PENDING"`

**Errors:** `EPISODE_NUMBER_EXISTS` 409 | `ANIME_NOT_FOUND` 404

---

### PUT `/api/v1/episodes/:id` *(Admin)*
**Auth:** ADMIN | **Request:** Tất cả optional

**Flow:** UPDATE → nếu `is_vip_only` thay đổi, trigger DB tự sync `animes.has_vip_content` → invalidate cache `anime:{animeId}`

**Response `200`:** EpisodeDto

---

### DELETE `/api/v1/episodes/:id` *(Admin)*
**Auth:** ADMIN | **Mô tả:** Soft delete

**Response `204`:** No content

---

### POST `/api/v1/admin/episodes/:id/upload` *(Admin)*
**Auth:** ADMIN | **Content-Type:** `multipart/form-data`

**Request Form:**
| Field | Bắt buộc | Mô tả |
|---|---|---|
| `file` | ✅ | MP4/MKV/AVI, max 2GB |
| `qualities` | | Comma-separated: `360p,720p,1080p` — default: tất cả |

**Flow:**
```
1. Validate file: type (MP4/MKV/AVI), size (max 2GB)
2. Kiểm tra episode tồn tại, video_status != PROCESSING → VIDEO_ALREADY_PROCESSING 409
3. Lưu file tạm: /tmp/uploads/{uuid}.{ext}
4. INSERT transcode_jobs { status: QUEUED, input_path: /tmp/uploads/... }
5. UPDATE episodes.video_status = PROCESSING
6. Gọi @Async TranscodeService.runTranscode(jobId)
7. Trả về 202 ngay lập tức
```

**Response `202`:**
```jsonc
{
  "success": true,
  "data": { "episodeId": 101, "jobId": 55, "status": "QUEUED",
            "message": "Video đã được tiếp nhận, đang xếp hàng transcode" }
}
```

**Errors:** `INVALID_FILE_TYPE` 400 | `FILE_TOO_LARGE` 400 | `VIDEO_ALREADY_PROCESSING` 409

---

### GET `/api/v1/admin/transcode/:jobId/progress` *(SSE)*
**Auth:** ADMIN | **Content-Type:** `text/event-stream`

**Implementation:**
```java
@GetMapping(value = "/transcode/{jobId}/progress",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamProgress(@PathVariable Long jobId) {
    SseEmitter emitter = new SseEmitter(0L); // không timeout
    scheduledExecutor.scheduleAtFixedRate(() -> {
        TranscodeJob job = transcodeJobRepository.findById(jobId).orElseThrow();
        try {
            if (job.getStatus() == DONE || job.getStatus() == FAILED) {
                emitter.send(SseEmitter.event()
                    .name(job.getStatus() == DONE ? "done" : "error")
                    .data(buildPayload(job)));
                emitter.complete();
                return;
            }
            emitter.send(SseEmitter.event().name("progress").data(buildPayload(job)));
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }, 0, 2, TimeUnit.SECONDS);
    return emitter;
}
```

**SSE Events:**
```
event: progress
data: { "jobId": 55, "status": "RUNNING", "progress": 33, "currentStep": "Encoding 360p..." }

event: done
data: { "jobId": 55, "status": "DONE", "progress": 100, "masterUrl": "https://.../master.m3u8" }

event: error
data: { "jobId": 55, "status": "FAILED", "error": "FFmpeg error: Invalid codec" }
```

---

### GET `/api/v1/admin/transcode/:jobId`
**Auth:** ADMIN | **Mô tả:** Polling thay vì SSE

**Response `200`:**
```jsonc
{
  "success": true,
  "data": {
    "jobId": 55, "episodeId": 101, "status": "DONE", "progress": 100,
    "currentStep": "Completed", "startedAt": "...", "completedAt": "...",
    "errorMessage": null
  }
}
```

---

### GET `/api/v1/admin/episodes/:id/transcode-history`
**Auth:** ADMIN | **Response `200`:** Danh sách transcode_jobs của episode, mới nhất trước

---

### DELETE `/api/v1/admin/episodes/:id/video`
**Auth:** ADMIN

**Flow:**
```
1. Xóa các file HLS trên storage (gọi StorageService.deleteDirectory)
2. DELETE video_files WHERE episode_id = :id
3. DELETE transcode_jobs WHERE episode_id = :id
4. UPDATE episodes SET video_status = PENDING, hls_path = NULL, hls_base_url = NULL
5. Invalidate cache episode:{id}, episode:{id}:stream
```

**Response `204`:** No content

---

### GET `/api/v1/files/hls/:episodeId/master.m3u8`
**Auth:** Không cần (VIP check đã xảy ra ở stream-info)

**Response `200`:** `Content-Type: application/vnd.apple.mpegurl` — nội dung file .m3u8

---

### GET `/api/v1/files/hls/:episodeId/:quality/index.m3u8`
**Auth:** Không cần

**Response `200`:** `Content-Type: application/vnd.apple.mpegurl`

---

### GET `/api/v1/files/hls/:episodeId/:quality/:segment.ts`
**Auth:** Không cần | **Hỗ trợ:** `Range` header

**Logic:**
```java
// Đọc Range header
String range = request.getHeader("Range"); // "bytes=0-1048575"
// Serve partial content
response.setStatus(206);
response.setHeader("Content-Range", "bytes 0-1048575/10485760");
response.setHeader("Accept-Ranges", "bytes");
```

**Response:** `200` hoặc `206` | `Content-Type: video/mp2t`

---

## 4. FFmpeg Transcode Pipeline

### TranscodeService.runTranscode() — @Async

```java
@Async
public void runTranscode(Long jobId) {
    TranscodeJob job = findById(jobId);

    try {
        // 1. Update status RUNNING
        job.setStatus(RUNNING);
        job.setStartedAt(LocalDateTime.now());
        save(job);

        String inputPath = job.getInputPath();
        String outputDir = "/tmp/hls/ep-" + job.getEpisodeId();

        // 2. Encode 360p
        job.setCurrentStep("Encoding 360p...");
        save(job);
        runFfmpeg(inputPath, outputDir + "/360p", 640, 360, "800k");
        job.setProgress(33);
        save(job);

        // 3. Encode 720p
        job.setCurrentStep("Encoding 720p...");
        save(job);
        runFfmpeg(inputPath, outputDir + "/720p", 1280, 720, "2500k");
        job.setProgress(66);
        save(job);

        // 4. Encode 1080p
        job.setCurrentStep("Encoding 1080p...");
        save(job);
        runFfmpeg(inputPath, outputDir + "/1080p", 1920, 1080, "5000k");
        job.setProgress(99);
        save(job);

        // 5. Tạo master.m3u8
        createMasterPlaylist(outputDir);

        // 6. Upload lên Cloudflare R2 (hoặc giữ local)
        storageService.uploadDirectory(outputDir, "hls/ep-" + job.getEpisodeId());

        // 7. Ghi video_files vào DB
        saveVideoFiles(job.getEpisodeId(), outputDir);

        // 8. Update episode
        episodeRepository.updateVideoReady(
            job.getEpisodeId(),
            "hls/ep-" + job.getEpisodeId() + "/master.m3u8",
            buildHlsBaseUrl(job.getEpisodeId())
        );

        // 9. Done
        job.setStatus(DONE);
        job.setProgress(100);
        job.setCurrentStep("Completed");
        job.setCompletedAt(LocalDateTime.now());
        save(job);

        // 10. Xóa file gốc
        Files.deleteIfExists(Path.of(inputPath));

        // 11. Invalidate cache
        redisService.delete("episode:" + job.getEpisodeId());
        redisService.delete("episode:" + job.getEpisodeId() + ":stream");

    } catch (Exception e) {
        job.setStatus(FAILED);
        job.setErrorMessage(e.getMessage());
        job.setCompletedAt(LocalDateTime.now());
        save(job);
        episodeRepository.updateVideoStatus(job.getEpisodeId(), "FAILED");
    }
}
```

### FFmpeg Command
```bash
ffmpeg -i input.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 -b:v 2500k \
  -c:a aac -b:a 128k \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "output/720p/segment_%03d.ts" \
  output/720p/index.m3u8
```

### master.m3u8 Format
```m3u8
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
```

---

## 5. VIP Check Logic

```java
// Trong EpisodeService.getStreamInfo()
public StreamInfoDto getStreamInfo(Long episodeId, UUID userId) {
    Episode ep = episodeRepository.findById(episodeId)
        .orElseThrow(() -> new ResourceNotFoundException("Episode not found", "EPISODE", ErrorConstants.EPISODE_NOT_FOUND.getCode()));

    if (ep.getVideoStatus() != VideoStatus.READY)
        throw new BusinessException("Episode not ready", "EPISODE", ErrorConstants.EPISODE_NOT_READY.getCode());

    if (ep.isVipOnly()) {
        if (userId == null)
            throw new BusinessException("VIP required", "EPISODE", ErrorConstants.VIP_REQUIRED.getCode());

        // Check cache Redis trước
        Boolean cachedVip = redisService.get("vip:status:" + userId, Boolean.class);
        if (cachedVip == null) {
            boolean isVip = subscriptionRepository.isVipActive(userId, LocalDateTime.now());
            redisService.set("vip:status:" + userId, isVip, Duration.ofMinutes(5));
            cachedVip = isVip;
        }
        if (!cachedVip)
            throw new BusinessException("VIP required", "EPISODE", ErrorConstants.VIP_REQUIRED.getCode());
    }

    // Increment view count
    redisService.increment("viewcount:ep:" + episodeId);
    redisService.zincrby("anime:trending", ep.getAnimeId(), 1);

    return buildStreamInfo(ep);
}
```

---

## 6. Error Codes

| Code | HTTP | Mô tả |
|---|---|---|
| `EPISODE_NOT_FOUND` | 404 | Không tìm thấy tập |
| `EPISODE_NUMBER_EXISTS` | 409 | Số tập đã tồn tại trong anime |
| `EPISODE_NOT_READY` | 409 | Video chưa transcode xong |
| `VIP_REQUIRED` | 403 | Cần VIP để xem tập này |
| `VIDEO_ALREADY_PROCESSING` | 409 | Đang transcode, không upload đè được |
| `INVALID_FILE_TYPE` | 400 | File không phải MP4/MKV/AVI |
| `FILE_TOO_LARGE` | 400 | File vượt quá 2GB |
| `TRANSCODE_JOB_NOT_FOUND` | 404 | Không tìm thấy job |
