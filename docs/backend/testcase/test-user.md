# Test Cases — Module User
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.user`

---

## TẦNG 1 — REPOSITORY

### `WatchHistoryRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class WatchHistoryRepositoryTest {

    @Autowired WatchHistoryRepository watchHistoryRepository;
    @Autowired UserRepository         userRepository;
    @Autowired EpisodeRepository      episodeRepository;
    @Autowired AnimeRepository        animeRepository;

    UUID userId;
    Long animeId;
    Long ep1Id, ep2Id;

    @BeforeEach
    void setup() {
        User user = userRepository.save(User.builder()
            .email("wh@test.com").username("wh_user")
            .password("hash").provider(Provider.LOCAL)
            .role(Role.USER).emailVerified(true).isActive(true).build());
        userId = user.getId();

        Anime anime = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-wh").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build());
        animeId = anime.getId();

        ep1Id = episodeRepository.save(Episode.builder()
            .animeId(animeId).episodeNumber((short) 1)
            .videoStatus(READY).isVipOnly(false).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).durationSeconds(1440).build()).getId();

        ep2Id = episodeRepository.save(Episode.builder()
            .animeId(animeId).episodeNumber((short) 2)
            .videoStatus(READY).isVipOnly(false).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).durationSeconds(1440).build()).getId();
    }

    WatchHistory buildHistory(Long epId, int progress, boolean completed) {
        return WatchHistory.builder()
            .userId(userId).episodeId(epId)
            .progressSeconds(progress).isCompleted(completed)
            .watchedAt(LocalDateTime.now()).build();
    }

    // ── upsert ────────────────────────────────────────────────────────────
    @Test
    void upsert_newEntry_insertsRecord() {
        watchHistoryRepository.upsert(userId, ep1Id, 300, false);
        Optional<WatchHistory> result = watchHistoryRepository.findByUserIdAndEpisodeId(userId, ep1Id);
        assertThat(result).isPresent();
        assertThat(result.get().getProgressSeconds()).isEqualTo(300);
    }

    @Test
    void upsert_existingEntry_updatesProgress() {
        watchHistoryRepository.upsert(userId, ep1Id, 100, false);
        watchHistoryRepository.upsert(userId, ep1Id, 500, false);

        Optional<WatchHistory> result = watchHistoryRepository.findByUserIdAndEpisodeId(userId, ep1Id);
        assertThat(result).isPresent();
        assertThat(result.get().getProgressSeconds()).isEqualTo(500); // cập nhật
    }

    @Test
    void upsert_markCompleted_updatesIsCompletedTrue() {
        watchHistoryRepository.upsert(userId, ep1Id, 300, false);
        watchHistoryRepository.upsert(userId, ep1Id, 1380, true); // > 85%

        Optional<WatchHistory> result = watchHistoryRepository.findByUserIdAndEpisodeId(userId, ep1Id);
        assertThat(result.get().isCompleted()).isTrue();
    }

    // ── findByUserIdOrderByWatchedAtDesc ──────────────────────────────────
    @Test
    void findByUserId_returnsOrderedByWatchedAtDesc() throws InterruptedException {
        watchHistoryRepository.upsert(userId, ep1Id, 100, false);
        Thread.sleep(10);
        watchHistoryRepository.upsert(userId, ep2Id, 200, false);

        Page<WatchHistory> result = watchHistoryRepository
            .findByUserIdOrderByWatchedAtDesc(userId, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getEpisodeId()).isEqualTo(ep2Id); // mới nhất trước
    }

    // ── findCurrentEpisode (nút "Tiếp tục xem") ───────────────────────────
    @Test
    void findCurrentEpisode_incompletedEpisode_returnsIt() {
        watchHistoryRepository.upsert(userId, ep1Id, 1380, true);  // đã xem xong
        watchHistoryRepository.upsert(userId, ep2Id, 300, false);  // đang xem dở

        Optional<WatchHistory> result = watchHistoryRepository
            .findCurrentEpisodeByAnimeId(userId, animeId);

        assertThat(result).isPresent();
        assertThat(result.get().getEpisodeId()).isEqualTo(ep2Id);
    }

    @Test
    void findCurrentEpisode_allCompleted_returnsEmpty() {
        watchHistoryRepository.upsert(userId, ep1Id, 1380, true);
        watchHistoryRepository.upsert(userId, ep2Id, 1380, true);

        Optional<WatchHistory> result = watchHistoryRepository
            .findCurrentEpisodeByAnimeId(userId, animeId);

        assertThat(result).isEmpty();
    }

    @Test
    void findCurrentEpisode_neverWatched_returnsEmpty() {
        assertThat(watchHistoryRepository.findCurrentEpisodeByAnimeId(userId, animeId)).isEmpty();
    }

    // ── deleteAllByUserId ─────────────────────────────────────────────────
    @Test
    void deleteAllByUserId_removesAllHistory() {
        watchHistoryRepository.upsert(userId, ep1Id, 100, false);
        watchHistoryRepository.upsert(userId, ep2Id, 200, false);

        watchHistoryRepository.deleteAllByUserId(userId);

        Page<WatchHistory> remaining = watchHistoryRepository
            .findByUserIdOrderByWatchedAtDesc(userId, PageRequest.of(0, 10));
        assertThat(remaining.getContent()).isEmpty();
    }
}
```

---

### `BookmarkRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class BookmarkRepositoryTest {

    @Autowired BookmarkRepository bookmarkRepository;
    @Autowired UserRepository     userRepository;
    @Autowired AnimeRepository    animeRepository;

    UUID userId;
    Long animeId;

    @BeforeEach
    void setup() {
        userId = userRepository.save(User.builder()
            .email("bm@test.com").username("bm_user").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();
        animeId = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-bm").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build()).getId();
    }

    // ── existsByUserIdAndAnimeId ───────────────────────────────────────────
    @Test
    void existsByUserIdAndAnimeId_bookmarked_returnsTrue() {
        bookmarkRepository.save(Bookmark.builder().userId(userId).animeId(animeId).build());
        assertThat(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).isTrue();
    }

    @Test
    void existsByUserIdAndAnimeId_notBookmarked_returnsFalse() {
        assertThat(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).isFalse();
    }

    // ── deleteByUserIdAndAnimeId ───────────────────────────────────────────
    @Test
    void deleteByUserIdAndAnimeId_removesBookmark() {
        bookmarkRepository.save(Bookmark.builder().userId(userId).animeId(animeId).build());
        bookmarkRepository.deleteByUserIdAndAnimeId(userId, animeId);
        assertThat(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).isFalse();
    }

    // ── primary key unique ────────────────────────────────────────────────
    @Test
    void save_duplicateBookmark_throwsConstraintViolation() {
        bookmarkRepository.save(Bookmark.builder().userId(userId).animeId(animeId).build());
        assertThatThrownBy(() ->
            bookmarkRepository.saveAndFlush(Bookmark.builder().userId(userId).animeId(animeId).build())
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── findByUserIdOrderByCreatedAtDesc ──────────────────────────────────
    @Test
    void findByUserId_returnsBookmarksNewestFirst() throws InterruptedException {
        Long anime2 = animeRepository.save(Anime.builder()
            .title("AOT").slug("aot-bm").status(COMPLETED).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build()).getId();

        bookmarkRepository.save(Bookmark.builder().userId(userId).animeId(animeId).build());
        Thread.sleep(10);
        bookmarkRepository.save(Bookmark.builder().userId(userId).animeId(anime2).build());

        Page<Bookmark> result = bookmarkRepository
            .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getAnimeId()).isEqualTo(anime2);
    }
}
```

---

### `RatingRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class RatingRepositoryTest {

    @Autowired RatingRepository ratingRepository;
    @Autowired UserRepository   userRepository;
    @Autowired AnimeRepository  animeRepository;

    UUID userId;
    Long animeId;

    @BeforeEach
    void setup() {
        userId = userRepository.save(User.builder()
            .email("rt@test.com").username("rt_user").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();
        animeId = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-rt").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build()).getId();
    }

    // ── findByUserIdAndAnimeId ─────────────────────────────────────────────
    @Test
    void findByUserIdAndAnimeId_rated_returnsRating() {
        ratingRepository.save(Rating.builder().userId(userId).animeId(animeId).score((short) 9).build());
        Optional<Rating> result = ratingRepository.findByUserIdAndAnimeId(userId, animeId);
        assertThat(result).isPresent();
        assertThat(result.get().getScore()).isEqualTo((short) 9);
    }

    @Test
    void findByUserIdAndAnimeId_notRated_returnsEmpty() {
        assertThat(ratingRepository.findByUserIdAndAnimeId(userId, animeId)).isEmpty();
    }

    // ── getAverageSummary ─────────────────────────────────────────────────
    @Test
    void getAverageSummary_multipleRatings_returnsCorrectStats() {
        UUID user2 = userRepository.save(User.builder()
            .email("rt2@test.com").username("rt2_user").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        ratingRepository.save(Rating.builder().userId(userId).animeId(animeId).score((short) 8).build());
        ratingRepository.save(Rating.builder().userId(user2).animeId(animeId).score((short) 10).build());

        RatingSummaryProjection summary = ratingRepository.getAverageSummary(animeId);
        assertThat(summary.getTotalRatings()).isEqualTo(2);
        assertThat(summary.getAverageScore()).isEqualByComparingTo(BigDecimal.valueOf(9.0));
    }

    @Test
    void getAverageSummary_noRatings_returnsZero() {
        RatingSummaryProjection summary = ratingRepository.getAverageSummary(animeId);
        assertThat(summary.getTotalRatings()).isEqualTo(0);
    }
}
```

---

## TẦNG 2 — SERVICE

### `WatchHistoryServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class WatchHistoryServiceTest {

    @Mock WatchHistoryRepository watchHistoryRepository;
    @Mock EpisodeRepository      episodeRepository;
    @Mock AnimeRepository        animeRepository;

    @InjectMocks WatchHistoryService watchHistoryService;

    UUID userId  = UUID.randomUUID();
    Long animeId = 1L;
    Long ep1Id   = 101L;

    // ═══════════════════════════════════════════════════════════════════════
    // upsertHistory
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void upsertHistory_validRequest_callsRepositoryUpsert() {
        UpsertWatchHistoryRequest req = new UpsertWatchHistoryRequest(ep1Id, 450, false);
        watchHistoryService.upsertHistory(userId, req);
        verify(watchHistoryRepository).upsert(userId, ep1Id, 450, false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getHistory (pagination)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getHistory_returnsPagedResults() {
        WatchHistory wh = new WatchHistory();
        wh.setEpisodeId(ep1Id); wh.setProgressSeconds(450);
        Episode ep = new Episode(); ep.setId(ep1Id); ep.setAnimeId(animeId);
        Anime anime = new Anime(); anime.setId(animeId); anime.setTitle("JJK");

        when(watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(eq(userId), any()))
            .thenReturn(new PageImpl<>(List.of(wh)));
        when(episodeRepository.findAllById(List.of(ep1Id))).thenReturn(List.of(ep));
        when(animeRepository.findAllById(List.of(animeId))).thenReturn(List.of(anime));

        PageResponse<WatchHistoryItemDto> result = watchHistoryService
            .getHistory(userId, PageRequest.of(0, 20));

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getProgressSeconds()).isEqualTo(450);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getCurrentEpisode (nút "Tiếp tục xem")
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getCurrentEpisode_incompletedExists_returnsContinueInfo() {
        WatchHistory wh = new WatchHistory();
        wh.setEpisodeId(ep1Id); wh.setProgressSeconds(450); wh.setCompleted(false);
        Episode ep = new Episode(); ep.setId(ep1Id); ep.setEpisodeNumber((short) 3);
        ep.setDurationSeconds(1380);

        when(watchHistoryRepository.findCurrentEpisodeByAnimeId(userId, animeId))
            .thenReturn(Optional.of(wh));
        when(episodeRepository.findByIdAndDeletedAtIsNull(ep1Id)).thenReturn(Optional.of(ep));

        // Đếm số tập đã xem xong
        when(watchHistoryRepository.countCompletedByUserIdAndAnimeId(userId, animeId)).thenReturn(2L);

        ContinueWatchingDto result = watchHistoryService.getCurrentEpisode(userId, animeId);

        assertThat(result).isNotNull();
        assertThat(result.getProgressSeconds()).isEqualTo(450);
        assertThat(result.getProgressPercent()).isCloseTo(32.6, within(0.1));
        assertThat(result.getTotalWatchedEpisodes()).isEqualTo(2);
    }

    @Test
    void getCurrentEpisode_neverWatched_returnsNull() {
        when(watchHistoryRepository.findCurrentEpisodeByAnimeId(userId, animeId))
            .thenReturn(Optional.empty());

        ContinueWatchingDto result = watchHistoryService.getCurrentEpisode(userId, animeId);

        assertThat(result).isNull();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // deleteAllHistory
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void deleteAllHistory_callsRepositoryDelete() {
        watchHistoryService.deleteAllHistory(userId);
        verify(watchHistoryRepository).deleteAllByUserId(userId);
    }
}
```

---

### `BookmarkServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class BookmarkServiceTest {

    @Mock BookmarkRepository bookmarkRepository;
    @Mock AnimeRepository    animeRepository;

    @InjectMocks BookmarkService bookmarkService;

    UUID userId  = UUID.randomUUID();
    Long animeId = 1L;

    Anime buildAnime() {
        Anime a = new Anime(); a.setId(animeId); a.setTitle("JJK"); a.setSlug("jjk"); return a;
    }

    @Test
    void addBookmark_notYetBookmarked_savesBookmark() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId)).thenReturn(Optional.of(buildAnime()));
        when(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).thenReturn(false);

        bookmarkService.addBookmark(userId, animeId);

        verify(bookmarkRepository).save(argThat(b ->
            b.getUserId().equals(userId) && b.getAnimeId().equals(animeId)));
    }

    @Test
    void addBookmark_alreadyBookmarked_throwsAlreadyBookmarked() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId)).thenReturn(Optional.of(buildAnime()));
        when(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).thenReturn(true);

        assertThatThrownBy(() -> bookmarkService.addBookmark(userId, animeId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("ALREADY_BOOKMARKED");
    }

    @Test
    void addBookmark_animeNotFound_throwsAnimeNotFound() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookmarkService.addBookmark(userId, animeId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    @Test
    void removeBookmark_existingBookmark_deletesIt() {
        bookmarkService.removeBookmark(userId, animeId);
        verify(bookmarkRepository).deleteByUserIdAndAnimeId(userId, animeId);
    }

    @Test
    void isBookmarked_bookmarked_returnsTrue() {
        when(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).thenReturn(true);
        assertThat(bookmarkService.isBookmarked(userId, animeId)).isTrue();
    }

    @Test
    void isBookmarked_notBookmarked_returnsFalse() {
        when(bookmarkRepository.existsByUserIdAndAnimeId(userId, animeId)).thenReturn(false);
        assertThat(bookmarkService.isBookmarked(userId, animeId)).isFalse();
    }
}
```

---

### `RatingServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock RatingRepository ratingRepository;
    @Mock AnimeRepository  animeRepository;

    @InjectMocks RatingService ratingService;

    UUID userId  = UUID.randomUUID();
    Long animeId = 1L;

    @Test
    void upsertRating_newRating_savesRating() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId))
            .thenReturn(Optional.of(new Anime()));
        when(ratingRepository.findByUserIdAndAnimeId(userId, animeId))
            .thenReturn(Optional.empty());

        RatingRequest req = new RatingRequest(9);
        ratingService.upsertRating(userId, animeId, req);

        verify(ratingRepository).save(argThat(r -> r.getScore() == 9));
    }

    @Test
    void upsertRating_existingRating_updatesScore() {
        Rating existing = new Rating(); existing.setScore((short) 7);
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId))
            .thenReturn(Optional.of(new Anime()));
        when(ratingRepository.findByUserIdAndAnimeId(userId, animeId))
            .thenReturn(Optional.of(existing));

        ratingService.upsertRating(userId, animeId, new RatingRequest(10));

        verify(ratingRepository).save(argThat(r -> r.getScore() == 10));
    }

    @Test
    void upsertRating_animeNotFound_throwsAnimeNotFound() {
        when(animeRepository.findByIdAndDeletedAtIsNull(animeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ratingService.upsertRating(userId, animeId, new RatingRequest(8)))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    @Test
    void getMyRating_rated_returnsScore() {
        Rating rating = new Rating(); rating.setScore((short) 9);
        when(ratingRepository.findByUserIdAndAnimeId(userId, animeId))
            .thenReturn(Optional.of(rating));

        Optional<Short> result = ratingService.getMyRating(userId, animeId);
        assertThat(result).isPresent().hasValue((short) 9);
    }

    @Test
    void getMyRating_notRated_returnsEmpty() {
        when(ratingRepository.findByUserIdAndAnimeId(userId, animeId)).thenReturn(Optional.empty());
        assertThat(ratingService.getMyRating(userId, animeId)).isEmpty();
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `UserControllerTest`
```java
@WebMvcTest({UserProfileController.class, WatchHistoryController.class,
             BookmarkController.class, RatingController.class})
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired MockMvc          mockMvc;
    @Autowired ObjectMapper     objectMapper;
    @MockBean  UserService      userService;
    @MockBean  WatchHistoryService watchHistoryService;
    @MockBean  BookmarkService  bookmarkService;
    @MockBean  RatingService    ratingService;
    @MockBean  JwtUtil          jwtUtil;

    // ═══════════════════════════════════════════════════════════════════════
    // GET /users/:id/profile
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getProfile_existingUser_returns200() throws Exception {
        UserProfileDto dto = UserProfileDto.builder()
            .id(UUID.randomUUID()).username("naruto_fan")
            .bio("Anime lover").totalWatched(150).totalBookmarks(30).build();
        when(userService.getProfile(any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/users/" + UUID.randomUUID() + "/profile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("naruto_fan"))
            .andExpect(jsonPath("$.data.stats.totalWatched").value(150))
            .andExpect(jsonPath("$.data.stats.totalBookmarks").value(30));
    }

    @Test
    void getProfile_notFound_returns404() throws Exception {
        when(userService.getProfile(any()))
            .thenThrow(new ResourceNotFoundException("USER_NOT_FOUND", "Not found"));

        mockMvc.perform(get("/api/v1/users/" + UUID.randomUUID() + "/profile"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("USER_NOT_FOUND"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATCH /users/me/profile
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void updateProfile_validRequest_returns200() throws Exception {
        UserProfileDto updated = UserProfileDto.builder()
            .username("new_name").bio("Updated bio").build();
        when(userService.updateProfile(any(), any())).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/users/me/profile")
                .contentType(APPLICATION_JSON)
                .content("""{"username":"new_name","bio":"Updated bio"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("new_name"));
    }

    @Test
    @WithMockUser
    void updateProfile_duplicateUsername_returns409() throws Exception {
        when(userService.updateProfile(any(), any()))
            .thenThrow(new BusinessException("USERNAME_ALREADY_EXISTS", HttpStatus.CONFLICT));

        mockMvc.perform(patch("/api/v1/users/me/profile")
                .contentType(APPLICATION_JSON)
                .content("""{"username":"taken"}"""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("USERNAME_ALREADY_EXISTS"));
    }

    @Test
    void updateProfile_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/profile")
                .contentType(APPLICATION_JSON)
                .content("""{"username":"x"}"""))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATCH /users/me/password
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void changePassword_validRequest_returns204() throws Exception {
        doNothing().when(userService).changePassword(any(), any());

        mockMvc.perform(patch("/api/v1/users/me/password")
                .contentType(APPLICATION_JSON)
                .content("""{"currentPassword":"OldPass123!","newPassword":"NewPass456!"}"""))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void changePassword_wrongCurrentPassword_returns401() throws Exception {
        doThrow(new BusinessException("WRONG_PASSWORD", HttpStatus.UNAUTHORIZED))
            .when(userService).changePassword(any(), any());

        mockMvc.perform(patch("/api/v1/users/me/password")
                .contentType(APPLICATION_JSON)
                .content("""{"currentPassword":"Wrong!","newPassword":"NewPass456!"}"""))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("WRONG_PASSWORD"));
    }

    @Test
    @WithMockUser
    void changePassword_oauthAccount_returns400() throws Exception {
        doThrow(new BusinessException("OAUTH_ACCOUNT_NO_PASSWORD", HttpStatus.BAD_REQUEST))
            .when(userService).changePassword(any(), any());

        mockMvc.perform(patch("/api/v1/users/me/password")
                .contentType(APPLICATION_JSON)
                .content("""{"currentPassword":"any","newPassword":"NewPass456!"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("OAUTH_ACCOUNT_NO_PASSWORD"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /users/me/watch-history
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void upsertWatchHistory_validRequest_returns204() throws Exception {
        doNothing().when(watchHistoryService).upsertHistory(any(), any());

        mockMvc.perform(post("/api/v1/users/me/watch-history")
                .contentType(APPLICATION_JSON)
                .content("""{"episodeId":101,"progressSeconds":450,"isCompleted":false}"""))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void upsertWatchHistory_missingEpisodeId_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/watch-history")
                .contentType(APPLICATION_JSON)
                .content("""{"progressSeconds":450,"isCompleted":false}"""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void upsertWatchHistory_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/watch-history")
                .contentType(APPLICATION_JSON)
                .content("""{"episodeId":101,"progressSeconds":450,"isCompleted":false}"""))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /users/me/watch-history/anime/:animeId
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void getCurrentEpisode_hasProgress_returns200() throws Exception {
        ContinueWatchingDto dto = ContinueWatchingDto.builder()
            .progressSeconds(450).isCompleted(false)
            .progressPercent(32.6).totalWatchedEpisodes(2).build();
        when(watchHistoryService.getCurrentEpisode(any(), eq(1L))).thenReturn(dto);

        mockMvc.perform(get("/api/v1/users/me/watch-history/anime/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.progressPercent").value(32.6));
    }

    @Test
    @WithMockUser
    void getCurrentEpisode_neverWatched_returnsNullData() throws Exception {
        when(watchHistoryService.getCurrentEpisode(any(), eq(1L))).thenReturn(null);

        mockMvc.perform(get("/api/v1/users/me/watch-history/anime/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /users/me/bookmarks/:animeId
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void addBookmark_notYetBookmarked_returns201() throws Exception {
        doNothing().when(bookmarkService).addBookmark(any(), eq(1L));

        mockMvc.perform(post("/api/v1/users/me/bookmarks/1"))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser
    void addBookmark_alreadyBookmarked_returns409() throws Exception {
        doThrow(new BusinessException("ALREADY_BOOKMARKED", HttpStatus.CONFLICT))
            .when(bookmarkService).addBookmark(any(), eq(1L));

        mockMvc.perform(post("/api/v1/users/me/bookmarks/1"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("ALREADY_BOOKMARKED"));
    }

    @Test
    @WithMockUser
    void removeBookmark_existingBookmark_returns204() throws Exception {
        doNothing().when(bookmarkService).removeBookmark(any(), eq(1L));

        mockMvc.perform(delete("/api/v1/users/me/bookmarks/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void getBookmarkStatus_bookmarked_returnsTrue() throws Exception {
        when(bookmarkService.isBookmarked(any(), eq(1L))).thenReturn(true);

        mockMvc.perform(get("/api/v1/users/me/bookmarks/1/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.bookmarked").value(true));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /ratings/anime/:animeId (UPSERT)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void upsertRating_validScore_returns200() throws Exception {
        doNothing().when(ratingService).upsertRating(any(), eq(1L), any());

        mockMvc.perform(post("/api/v1/ratings/anime/1")
                .contentType(APPLICATION_JSON)
                .content("""{"score":9}"""))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void upsertRating_scoreOutOfRange_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/ratings/anime/1")
                .contentType(APPLICATION_JSON)
                .content("""{"score":11}"""))  // max là 10
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void upsertRating_scoreZero_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/ratings/anime/1")
                .contentType(APPLICATION_JSON)
                .content("""{"score":0}"""))   // min là 1
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /ratings/anime/:animeId/summary
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getRatingSummary_anyUser_returns200() throws Exception {
        RatingSummaryDto summary = RatingSummaryDto.builder()
            .averageScore(8.5).totalRatings(2400)
            .distribution(Map.of("10", 450, "9", 600)).build();
        when(ratingService.getSummary(1L)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/ratings/anime/1/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.averageScore").value(8.5))
            .andExpect(jsonPath("$.data.totalRatings").value(2400));
    }
}
```
