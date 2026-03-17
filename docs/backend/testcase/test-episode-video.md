# Test Cases — Module Episode & Video Pipeline
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.episode` + `com.hhkungfu.video`

---

## TẦNG 1 — REPOSITORY

### `EpisodeRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class EpisodeRepositoryTest {

    @Autowired EpisodeRepository episodeRepository;
    @Autowired AnimeRepository   animeRepository;

    Anime savedAnime;

    @BeforeEach
    void setup() {
        savedAnime = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build());
    }

    Episode buildEpisode(int number, VideoStatus status, boolean vipOnly) {
        return Episode.builder()
            .animeId(savedAnime.getId()).episodeNumber((short) number)
            .title("Ep " + number).videoStatus(status)
            .isVipOnly(vipOnly).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).build();
    }

    // ── findByAnimeIdAndEpisodeNumber ─────────────────────────────────────
    @Test
    void findByAnimeIdAndEpisodeNumber_existing_returnsEpisode() {
        episodeRepository.save(buildEpisode(1, READY, false));
        Optional<Episode> result = episodeRepository
            .findByAnimeIdAndEpisodeNumberAndDeletedAtIsNull(savedAnime.getId(), (short) 1);
        assertThat(result).isPresent();
        assertThat(result.get().getEpisodeNumber()).isEqualTo((short) 1);
    }

    @Test
    void findByAnimeIdAndEpisodeNumber_wrongAnimeId_returnsEmpty() {
        episodeRepository.save(buildEpisode(1, READY, false));
        Optional<Episode> result = episodeRepository
            .findByAnimeIdAndEpisodeNumberAndDeletedAtIsNull(UUID.randomUUID(), (short) 1);
        // animeId là BIGINT, dùng ID không tồn tại
        assertThat(result).isEmpty();
    }

    // ── existsByAnimeIdAndEpisodeNumber ───────────────────────────────────
    @Test
    void existsByAnimeIdAndEpisodeNumber_existing_returnsTrue() {
        episodeRepository.save(buildEpisode(2, PENDING, false));
        assertThat(episodeRepository
            .existsByAnimeIdAndEpisodeNumber(savedAnime.getId(), (short) 2)).isTrue();
    }

    @Test
    void existsByAnimeIdAndEpisodeNumber_notExisting_returnsFalse() {
        assertThat(episodeRepository
            .existsByAnimeIdAndEpisodeNumber(savedAnime.getId(), (short) 99)).isFalse();
    }

    // ── unique constraint ─────────────────────────────────────────────────
    @Test
    void save_duplicateEpisodeNumber_throwsConstraintViolation() {
        episodeRepository.save(buildEpisode(1, READY, false));
        assertThatThrownBy(() ->
            episodeRepository.saveAndFlush(buildEpisode(1, PENDING, false))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── findReadyEpisodesByAnimeId ─────────────────────────────────────────
    @Test
    void findByAnimeId_excludesSoftDeleted() {
        Episode ep1 = episodeRepository.save(buildEpisode(1, READY, false));
        Episode ep2 = episodeRepository.save(buildEpisode(2, READY, false));
        ep2.setDeletedAt(LocalDateTime.now());
        episodeRepository.save(ep2);

        List<Episode> result = episodeRepository
            .findByAnimeIdAndDeletedAtIsNullOrderByEpisodeNumberAsc(savedAnime.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(ep1.getId());
    }

    // ── updateVideoStatus ─────────────────────────────────────────────────
    @Test
    void updateVideoStatus_updatesCorrectly() {
        Episode ep = episodeRepository.save(buildEpisode(1, PENDING, false));
        episodeRepository.updateVideoStatus(ep.getId(), VideoStatus.PROCESSING);
        Episode updated = episodeRepository.findById(ep.getId()).orElseThrow();
        assertThat(updated.getVideoStatus()).isEqualTo(VideoStatus.PROCESSING);
    }

    // ── updateVideoReady ──────────────────────────────────────────────────
    @Test
    void updateVideoReady_setsHlsPathAndStatus() {
        Episode ep = episodeRepository.save(buildEpisode(1, PROCESSING, false));
        episodeRepository.updateVideoReady(ep.getId(), "hls/ep-1/master.m3u8", "https://cdn.test/hls/ep-1");
        Episode updated = episodeRepository.findById(ep.getId()).orElseThrow();
        assertThat(updated.getVideoStatus()).isEqualTo(VideoStatus.READY);
        assertThat(updated.getHlsPath()).isEqualTo("hls/ep-1/master.m3u8");
        assertThat(updated.getHlsBaseUrl()).isEqualTo("https://cdn.test/hls/ep-1");
    }
}
```

---

### `TranscodeJobRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class TranscodeJobRepositoryTest {

    @Autowired TranscodeJobRepository jobRepository;
    @Autowired EpisodeRepository      episodeRepository;
    @Autowired AnimeRepository        animeRepository;

    Long episodeId;

    @BeforeEach
    void setup() {
        Anime anime = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-tcj").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build());
        Episode ep = episodeRepository.save(Episode.builder()
            .animeId(anime.getId()).episodeNumber((short) 1)
            .videoStatus(PENDING).isVipOnly(false).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).build());
        episodeId = ep.getId();
    }

    TranscodeJob buildJob(TranscodeStatus status, int progress) {
        return TranscodeJob.builder()
            .episodeId(episodeId).status(status).progress((short) progress)
            .inputPath("/tmp/test.mp4").build();
    }

    @Test
    void findByEpisodeIdOrderByCreatedAtDesc_returnsMostRecentFirst() {
        TranscodeJob j1 = jobRepository.save(buildJob(TranscodeStatus.FAILED, 50));
        TranscodeJob j2 = jobRepository.save(buildJob(TranscodeStatus.DONE, 100));

        List<TranscodeJob> result = jobRepository
            .findByEpisodeIdOrderByCreatedAtDesc(episodeId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(j2.getId()); // mới nhất trước
    }

    @Test
    void countByStatus_returnsCorrectCount() {
        jobRepository.save(buildJob(TranscodeStatus.QUEUED,  0));
        jobRepository.save(buildJob(TranscodeStatus.QUEUED,  0));
        jobRepository.save(buildJob(TranscodeStatus.RUNNING, 50));

        assertThat(jobRepository.countByStatus(TranscodeStatus.QUEUED)).isEqualTo(2);
        assertThat(jobRepository.countByStatus(TranscodeStatus.RUNNING)).isEqualTo(1);
        assertThat(jobRepository.countByStatus(TranscodeStatus.DONE)).isEqualTo(0);
    }

    @Test
    void findByStatus_returnsMatchingJobs() {
        jobRepository.save(buildJob(TranscodeStatus.FAILED, 0));
        jobRepository.save(buildJob(TranscodeStatus.DONE,   100));

        List<TranscodeJob> failed = jobRepository.findByStatus(TranscodeStatus.FAILED);
        assertThat(failed).hasSize(1);
        assertThat(failed.get(0).getStatus()).isEqualTo(TranscodeStatus.FAILED);
    }
}
```

---

## TẦNG 2 — SERVICE

### `EpisodeServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class EpisodeServiceTest {

    @Mock EpisodeRepository          episodeRepository;
    @Mock AnimeRepository            animeRepository;
    @Mock RedisService               redisService;
    @Mock SubscriptionService        subscriptionService;

    @InjectMocks EpisodeService episodeService;

    UUID  userId  = UUID.randomUUID();
    Long  animeId = 1L;
    Long  epId    = 101L;

    Episode buildEpisode(Long id, VideoStatus status, boolean vipOnly) {
        Episode e = new Episode();
        e.setId(id); e.setAnimeId(animeId); e.setEpisodeNumber((short) 1);
        e.setVideoStatus(status); e.setVipOnly(vipOnly); e.setViewCount(0L);
        e.setHlsBaseUrl("https://cdn.test/hls/ep-" + id);
        e.setDurationSeconds(1440);
        return e;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getStreamInfo
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getStreamInfo_freeEpisodeNoLogin_returnsStreamInfo() {
        Episode ep = buildEpisode(epId, VideoStatus.READY, false);
        when(redisService.get("episode:" + epId + ":stream", StreamInfoDto.class)).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));

        StreamInfoDto result = episodeService.getStreamInfo(epId, null);

        assertThat(result).isNotNull();
        assertThat(result.getMasterUrl()).contains("hls");
    }

    @Test
    void getStreamInfo_vipEpisode_userIsVip_returnsStreamInfo() {
        Episode ep = buildEpisode(epId, VideoStatus.READY, true); // VIP-only
        when(redisService.get("episode:" + epId + ":stream", StreamInfoDto.class)).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));
        when(subscriptionService.isVipActive(userId)).thenReturn(true);

        StreamInfoDto result = episodeService.getStreamInfo(epId, userId);

        assertThat(result).isNotNull();
    }

    @Test
    void getStreamInfo_vipEpisode_userNotVip_throwsVipRequired() {
        Episode ep = buildEpisode(epId, VideoStatus.READY, true);
        when(redisService.get("episode:" + epId + ":stream", StreamInfoDto.class)).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));
        when(subscriptionService.isVipActive(userId)).thenReturn(false);

        assertThatThrownBy(() -> episodeService.getStreamInfo(epId, userId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("VIP_REQUIRED");
    }

    @Test
    void getStreamInfo_vipEpisode_notLoggedIn_throwsVipRequired() {
        Episode ep = buildEpisode(epId, VideoStatus.READY, true);
        when(redisService.get(any(), any())).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));

        assertThatThrownBy(() -> episodeService.getStreamInfo(epId, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("VIP_REQUIRED");
    }

    @Test
    void getStreamInfo_episodeNotReady_throwsEpisodeNotReady() {
        Episode ep = buildEpisode(epId, VideoStatus.PROCESSING, false);
        when(redisService.get(any(), any())).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));

        assertThatThrownBy(() -> episodeService.getStreamInfo(epId, null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("EPISODE_NOT_READY");
    }

    @Test
    void getStreamInfo_episodeNotFound_throwsEpisodeNotFound() {
        when(redisService.get(any(), any())).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> episodeService.getStreamInfo(epId, null))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("EPISODE_NOT_FOUND");
    }

    @Test
    void getStreamInfo_readyEpisode_incrementsViewCount() {
        Episode ep = buildEpisode(epId, VideoStatus.READY, false);
        when(redisService.get(any(), any())).thenReturn(null);
        when(episodeRepository.findByIdAndDeletedAtIsNull(epId)).thenReturn(Optional.of(ep));

        episodeService.getStreamInfo(epId, null);

        verify(redisService).increment("viewcount:ep:" + epId);
        verify(redisService).zincrby("anime:trending", animeId, 1);
    }

    @Test
    void getStreamInfo_cacheHit_returnsCachedAndSkipsDb() {
        StreamInfoDto cached = new StreamInfoDto();
        when(redisService.get("episode:" + epId + ":stream", StreamInfoDto.class)).thenReturn(cached);

        StreamInfoDto result = episodeService.getStreamInfo(epId, null);

        assertThat(result).isSameAs(cached);
        verify(episodeRepository, never()).findByIdAndDeletedAtIsNull(any());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // createEpisode
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void createEpisode_validRequest_returnsEpisodeWithPendingStatus() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId))
            .thenReturn(Optional.of(new Anime()));
        when(episodeRepository.existsByAnimeIdAndEpisodeNumber(animeId, (short) 1))
            .thenReturn(false);
        Episode saved = buildEpisode(epId, VideoStatus.PENDING, false);
        when(episodeRepository.save(any())).thenReturn(saved);

        EpisodeCreateRequest req = new EpisodeCreateRequest();
        req.setEpisodeNumber((short) 1);

        EpisodeDto result = episodeService.createEpisode(animeId, req);

        assertThat(result.getVideoStatus()).isEqualTo("PENDING");
    }

    @Test
    void createEpisode_duplicateNumber_throwsEpisodeNumberExists() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId))
            .thenReturn(Optional.of(new Anime()));
        when(episodeRepository.existsByAnimeIdAndEpisodeNumber(animeId, (short) 1))
            .thenReturn(true);

        EpisodeCreateRequest req = new EpisodeCreateRequest();
        req.setEpisodeNumber((short) 1);

        assertThatThrownBy(() -> episodeService.createEpisode(animeId, req))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("EPISODE_NUMBER_EXISTS");
    }

    @Test
    void createEpisode_animeNotFound_throwsAnimeNotFound() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            episodeService.createEpisode(animeId, new EpisodeCreateRequest())
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("ANIME_NOT_FOUND");
    }
}
```

---

### `VideoUploadServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class VideoUploadServiceTest {

    @Mock EpisodeRepository      episodeRepository;
    @Mock TranscodeJobRepository jobRepository;
    @Mock TranscodeService       transcodeService;

    @InjectMocks VideoUploadService uploadService;

    // ═══════════════════════════════════════════════════════════════════════
    // upload
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void upload_validMp4_createsJobAndStartsAsync() throws IOException {
        Episode ep = new Episode();
        ep.setId(101L); ep.setVideoStatus(VideoStatus.PENDING);
        when(episodeRepository.findByIdAndDeletedAtIsNull(101L)).thenReturn(Optional.of(ep));

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[1024]);

        TranscodeJob job = new TranscodeJob(); job.setId(55L);
        when(jobRepository.save(any())).thenReturn(job);

        UploadResponse result = uploadService.upload(101L, file);

        assertThat(result.getJobId()).isEqualTo(55L);
        assertThat(result.getStatus()).isEqualTo("QUEUED");
        verify(transcodeService).runTranscode(55L); // @Async gọi được
    }

    @Test
    void upload_invalidFileType_throwsInvalidFileType() {
        Episode ep = new Episode();
        ep.setId(101L); ep.setVideoStatus(VideoStatus.PENDING);
        when(episodeRepository.findByIdAndDeletedAtIsNull(101L)).thenReturn(Optional.of(ep));

        MockMultipartFile file = new MockMultipartFile(
            "file", "image.jpg", "image/jpeg", new byte[100]);

        assertThatThrownBy(() -> uploadService.upload(101L, file))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("INVALID_FILE_TYPE");
    }

    @Test
    void upload_episodeAlreadyProcessing_throwsVideoAlreadyProcessing() {
        Episode ep = new Episode();
        ep.setId(101L); ep.setVideoStatus(VideoStatus.PROCESSING); // đang transcode
        when(episodeRepository.findByIdAndDeletedAtIsNull(101L)).thenReturn(Optional.of(ep));

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[1024]);

        assertThatThrownBy(() -> uploadService.upload(101L, file))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("VIDEO_ALREADY_PROCESSING");
    }

    @Test
    void upload_episodeNotFound_throwsEpisodeNotFound() {
        when(episodeRepository.findByIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[1024]);

        assertThatThrownBy(() -> uploadService.upload(999L, file))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("EPISODE_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // deleteVideo
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void deleteVideo_existingEpisode_deletesFilesAndResetsStatus() {
        Episode ep = new Episode();
        ep.setId(101L); ep.setVideoStatus(VideoStatus.READY);
        ep.setHlsPath("hls/ep-101/master.m3u8");
        when(episodeRepository.findByIdAndDeletedAtIsNull(101L)).thenReturn(Optional.of(ep));

        uploadService.deleteVideo(101L);

        verify(episodeRepository).save(argThat(e ->
            e.getVideoStatus() == VideoStatus.PENDING && e.getHlsPath() == null));
        verify(jobRepository).deleteByEpisodeId(101L);
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `EpisodeControllerTest`
```java
@WebMvcTest(EpisodeController.class)
@Import(SecurityConfig.class)
class EpisodeControllerTest {

    @Autowired MockMvc       mockMvc;
    @Autowired ObjectMapper  objectMapper;
    @MockBean  EpisodeService episodeService;
    @MockBean  JwtUtil        jwtUtil;

    // ═══════════════════════════════════════════════════════════════════════
    // GET /animes/:animeId/episodes
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void listEpisodes_returns200WithItems() throws Exception {
        EpisodeDto ep = EpisodeDto.builder().id(101L).episodeNumber(1)
            .videoStatus("READY").isVipOnly(false).build();
        PageResponse<EpisodeDto> page = new PageResponse<>(List.of(ep), 1, 50, 1L, 1);
        when(episodeService.listEpisodes(eq(1L), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/animes/1/episodes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items[0].id").value(101))
            .andExpect(jsonPath("$.data.items[0].isVipOnly").value(false));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /episodes/:id/stream-info
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getStreamInfo_freeEpisode_returns200() throws Exception {
        StreamInfoDto info = StreamInfoDto.builder()
            .episodeId(101L).videoStatus("READY")
            .masterUrl("https://cdn.test/hls/ep-101/master.m3u8")
            .durationSeconds(1440).build();
        when(episodeService.getStreamInfo(eq(101L), any())).thenReturn(info);

        mockMvc.perform(get("/api/v1/episodes/101/stream-info"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.masterUrl").exists())
            .andExpect(jsonPath("$.data.videoStatus").value("READY"));
    }

    @Test
    void getStreamInfo_vipEpisodeNoAuth_returns403() throws Exception {
        when(episodeService.getStreamInfo(eq(101L), isNull()))
            .thenThrow(new BusinessException("VIP_REQUIRED", HttpStatus.FORBIDDEN));

        mockMvc.perform(get("/api/v1/episodes/101/stream-info"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("VIP_REQUIRED"));
    }

    @Test
    void getStreamInfo_episodeNotReady_returns409() throws Exception {
        when(episodeService.getStreamInfo(eq(101L), any()))
            .thenThrow(new BusinessException("EPISODE_NOT_READY", HttpStatus.CONFLICT));

        mockMvc.perform(get("/api/v1/episodes/101/stream-info"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("EPISODE_NOT_READY"));
    }

    @Test
    void getStreamInfo_episodeNotFound_returns404() throws Exception {
        when(episodeService.getStreamInfo(eq(999L), any()))
            .thenThrow(new ResourceNotFoundException("EPISODE_NOT_FOUND", "Not found"));

        mockMvc.perform(get("/api/v1/episodes/999/stream-info"))
            .andExpect(status().isNotFound());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /episodes/:id/view
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void recordView_returns204() throws Exception {
        doNothing().when(episodeService).recordView(101L);

        mockMvc.perform(post("/api/v1/episodes/101/view"))
            .andExpect(status().isNoContent());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /animes/:animeId/episodes (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEpisode_adminRole_returns201() throws Exception {
        EpisodeDto created = EpisodeDto.builder().id(101L).episodeNumber(1)
            .videoStatus("PENDING").isVipOnly(false).build();
        when(episodeService.createEpisode(eq(1L), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/animes/1/episodes")
                .contentType(APPLICATION_JSON)
                .content("""{"episodeNumber":1,"isVipOnly":false}"""))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.videoStatus").value("PENDING"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEpisode_duplicateNumber_returns409() throws Exception {
        when(episodeService.createEpisode(eq(1L), any()))
            .thenThrow(new BusinessException("EPISODE_NUMBER_EXISTS", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/animes/1/episodes")
                .contentType(APPLICATION_JSON)
                .content("""{"episodeNumber":1}"""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("EPISODE_NUMBER_EXISTS"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createEpisode_userRole_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/animes/1/episodes")
                .contentType(APPLICATION_JSON)
                .content("""{"episodeNumber":1}"""))
            .andExpect(status().isForbidden());
    }
}
```

---

### `VideoUploadControllerTest`
```java
@WebMvcTest(VideoUploadController.class)
@Import(SecurityConfig.class)
class VideoUploadControllerTest {

    @Autowired MockMvc            mockMvc;
    @MockBean  VideoUploadService uploadService;
    @MockBean  JwtUtil            jwtUtil;

    // ═══════════════════════════════════════════════════════════════════════
    // POST /admin/episodes/:id/upload
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void upload_validMp4_returns202WithJobId() throws Exception {
        UploadResponse response = UploadResponse.builder()
            .episodeId(101L).jobId(55L).status("QUEUED")
            .message("Video đã được tiếp nhận, đang xếp hàng transcode").build();
        when(uploadService.upload(eq(101L), any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[2048]);

        mockMvc.perform(multipart("/api/v1/admin/episodes/101/upload").file(file))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.data.jobId").value(55))
            .andExpect(jsonPath("$.data.status").value("QUEUED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void upload_invalidFileType_returns400() throws Exception {
        when(uploadService.upload(eq(101L), any()))
            .thenThrow(new BusinessException("INVALID_FILE_TYPE", HttpStatus.BAD_REQUEST));

        MockMultipartFile file = new MockMultipartFile(
            "file", "img.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/v1/admin/episodes/101/upload").file(file))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_FILE_TYPE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void upload_alreadyProcessing_returns409() throws Exception {
        when(uploadService.upload(eq(101L), any()))
            .thenThrow(new BusinessException("VIDEO_ALREADY_PROCESSING", HttpStatus.CONFLICT));

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[1024]);

        mockMvc.perform(multipart("/api/v1/admin/episodes/101/upload").file(file))
            .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void upload_missingFile_returns400() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/episodes/101/upload"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void upload_unauthenticated_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[1024]);

        mockMvc.perform(multipart("/api/v1/admin/episodes/101/upload").file(file))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /admin/transcode/:jobId
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void getTranscodeJob_existingJob_returns200() throws Exception {
        TranscodeJobDto dto = TranscodeJobDto.builder()
            .jobId(55L).episodeId(101L).status("DONE").progress(100).build();
        when(uploadService.getJobStatus(55L)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/transcode/55"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("DONE"))
            .andExpect(jsonPath("$.data.progress").value(100));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getTranscodeJob_notFound_returns404() throws Exception {
        when(uploadService.getJobStatus(999L))
            .thenThrow(new ResourceNotFoundException("TRANSCODE_JOB_NOT_FOUND", "Not found"));

        mockMvc.perform(get("/api/v1/admin/transcode/999"))
            .andExpect(status().isNotFound());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /admin/episodes/:id/video
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteVideo_existingEpisode_returns204() throws Exception {
        doNothing().when(uploadService).deleteVideo(101L);

        mockMvc.perform(delete("/api/v1/admin/episodes/101/video"))
            .andExpect(status().isNoContent());
    }
}
```
