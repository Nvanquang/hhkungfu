# Test Cases — Module Anime
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.anime`

---

## TẦNG 1 — REPOSITORY

### `AnimeRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class AnimeRepositoryTest {

    @Autowired AnimeRepository  animeRepository;
    @Autowired GenreRepository  genreRepository;
    @Autowired StudioRepository studioRepository;

    // ── Fixture ───────────────────────────────────────────────────────────
    Anime buildAnime(String title, String slug, AnimeStatus status, AnimeType type, int year) {
        return Anime.builder()
            .title(title).slug(slug).status(status).type(type)
            .year((short) year).viewCount(0L).isFeatured(false)
            .hasVipContent(false).build();
    }

    // ── findBySlug ────────────────────────────────────────────────────────
    @Test
    void findBySlug_existingSlug_returnsAnime() {
        animeRepository.save(buildAnime("Naruto", "naruto", COMPLETED, TV, 2002));
        Optional<Anime> result = animeRepository.findBySlugAndDeletedAtIsNull("naruto");
        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("Naruto");
    }

    @Test
    void findBySlug_nonExistingSlug_returnsEmpty() {
        assertThat(animeRepository.findBySlugAndDeletedAtIsNull("ghost")).isEmpty();
    }

    @Test
    void findBySlug_softDeletedAnime_returnsEmpty() {
        Anime anime = buildAnime("Deleted", "deleted-slug", COMPLETED, TV, 2020);
        anime.setDeletedAt(LocalDateTime.now());
        animeRepository.save(anime);
        assertThat(animeRepository.findBySlugAndDeletedAtIsNull("deleted-slug")).isEmpty();
    }

    // ── existsBySlug ──────────────────────────────────────────────────────
    @Test
    void existsBySlug_existingSlug_returnsTrue() {
        animeRepository.save(buildAnime("JJK", "jjk", ONGOING, TV, 2020));
        assertThat(animeRepository.existsBySlug("jjk")).isTrue();
    }

    @Test
    void existsBySlug_nonExisting_returnsFalse() {
        assertThat(animeRepository.existsBySlug("no-exist")).isFalse();
    }

    // ── findByStatus ──────────────────────────────────────────────────────
    @Test
    void findByStatusAndDeletedAtIsNull_returnsOnlyMatchingStatus() {
        animeRepository.save(buildAnime("A1", "a1", ONGOING,    TV, 2020));
        animeRepository.save(buildAnime("A2", "a2", COMPLETED,  TV, 2019));
        animeRepository.save(buildAnime("A3", "a3", ONGOING,    TV, 2021));

        Page<Anime> result = animeRepository.findByStatusAndDeletedAtIsNull(
            ONGOING, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(a -> a.getStatus() == ONGOING);
    }

    // ── findFeatured ──────────────────────────────────────────────────────
    @Test
    void findFeaturedAnimes_returnsOnlyFeatured() {
        Anime featured = buildAnime("JJK", "jjk-f", ONGOING, TV, 2020);
        featured.setFeatured(true);
        animeRepository.save(featured);
        animeRepository.save(buildAnime("Normal", "normal", ONGOING, TV, 2020));

        List<Anime> result = animeRepository.findFeaturedAnimes(10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isFeatured()).isTrue();
    }

    // ── slug unique constraint ─────────────────────────────────────────────
    @Test
    void save_duplicateSlug_throwsDataIntegrityViolation() {
        animeRepository.save(buildAnime("A", "same-slug", ONGOING, TV, 2020));
        assertThatThrownBy(() ->
            animeRepository.saveAndFlush(buildAnime("B", "same-slug", ONGOING, TV, 2021))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── soft delete ───────────────────────────────────────────────────────
    @Test
    void softDelete_setsDeletedAt_excludedFromQueries() {
        Anime anime = animeRepository.save(buildAnime("ToDelete", "to-delete", ONGOING, TV, 2020));
        animeRepository.softDelete(anime.getId(), LocalDateTime.now());

        Optional<Anime> found = animeRepository.findBySlugAndDeletedAtIsNull("to-delete");
        assertThat(found).isEmpty();

        // Vẫn tồn tại trong DB
        Optional<Anime> raw = animeRepository.findById(anime.getId());
        assertThat(raw).isPresent();
        assertThat(raw.get().getDeletedAt()).isNotNull();
    }

    // ── findTopByViewCount ────────────────────────────────────────────────
    @Test
    void findTopByViewCount_returnsOrderedByViewCountDesc() {
        Anime a1 = buildAnime("Low",  "low",  ONGOING, TV, 2020); a1.setViewCount(100L);
        Anime a2 = buildAnime("High", "high", ONGOING, TV, 2020); a2.setViewCount(9000L);
        Anime a3 = buildAnime("Mid",  "mid",  ONGOING, TV, 2020); a3.setViewCount(500L);
        animeRepository.saveAll(List.of(a1, a2, a3));

        List<Anime> top2 = animeRepository.findTopByViewCount(2);

        assertThat(top2).hasSize(2);
        assertThat(top2.get(0).getTitle()).isEqualTo("High");
        assertThat(top2.get(1).getTitle()).isEqualTo("Mid");
    }
}
```

---

### `GenreRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class GenreRepositoryTest {

    @Autowired GenreRepository genreRepository;

    Genre buildGenre(String name, String slug) {
        return Genre.builder().name(name).nameVi(name + "_vi").slug(slug).build();
    }

    @Test
    void findBySlug_existingSlug_returnsGenre() {
        genreRepository.save(buildGenre("Action", "action"));
        assertThat(genreRepository.findBySlug("action")).isPresent();
    }

    @Test
    void findBySlug_nonExisting_returnsEmpty() {
        assertThat(genreRepository.findBySlug("ghost")).isEmpty();
    }

    @Test
    void existsByName_existingName_returnsTrue() {
        genreRepository.save(buildGenre("Romance", "romance"));
        assertThat(genreRepository.existsByName("Romance")).isTrue();
    }

    @Test
    void save_duplicateSlug_throwsException() {
        genreRepository.save(buildGenre("G1", "same-slug"));
        assertThatThrownBy(() ->
            genreRepository.saveAndFlush(buildGenre("G2", "same-slug"))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findAll_returnsAllGenres() {
        genreRepository.save(buildGenre("Action",  "action"));
        genreRepository.save(buildGenre("Romance", "romance"));
        assertThat(genreRepository.findAll()).hasSize(2);
    }
}
```

---

## TẦNG 2 — SERVICE

### `AnimeServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class AnimeServiceTest {

    @Mock AnimeRepository        animeRepository;
    @Mock GenreRepository        genreRepository;
    @Mock StudioRepository       studioRepository;
    @Mock RedisService           redisService;
    @Mock AnimeSearchService     searchService;
    @Mock AnimeTrendingService   trendingService;

    @InjectMocks AnimeService animeService;

    // ── Fixture ───────────────────────────────────────────────────────────
    Anime buildAnime(Long id, String title, String slug) {
        Anime a = new Anime();
        a.setId(id); a.setTitle(title); a.setSlug(slug);
        a.setStatus(AnimeStatus.ONGOING); a.setType(AnimeType.TV);
        a.setViewCount(0L); a.setFeatured(false); a.setHasVipContent(false);
        return a;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getAnimeById / getAnimeBySlug
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getAnimeById_existingId_returnsCachedIfPresent() {
        AnimeDetailDto cached = new AnimeDetailDto();
        when(redisService.get("anime:1", AnimeDetailDto.class)).thenReturn(cached);

        AnimeDetailDto result = animeService.getAnimeById(1L);

        assertThat(result).isSameAs(cached);
        verify(animeRepository, never()).findById(any());
    }

    @Test
    void getAnimeById_cacheEmpty_queriesDbAndCaches() {
        when(redisService.get("anime:1", AnimeDetailDto.class)).thenReturn(null);
        Anime anime = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(anime));

        AnimeDetailDto result = animeService.getAnimeById(1L);

        assertThat(result).isNotNull();
        verify(redisService).set(eq("anime:1"), any(), any()); // đã cache
    }

    @Test
    void getAnimeById_notFound_throwsAnimeNotFound() {
        when(redisService.get(any(), any())).thenReturn(null);
        when(animeRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> animeService.getAnimeById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    @Test
    void getAnimeBySlug_validSlug_returnsAnimeDetail() {
        when(redisService.get("anime:slug:jjk", AnimeDetailDto.class)).thenReturn(null);
        Anime anime = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findBySlugAndDeletedAtIsNull("jjk")).thenReturn(Optional.of(anime));

        AnimeDetailDto result = animeService.getAnimeBySlug("jjk");

        assertThat(result.getSlug()).isEqualTo("jjk");
    }

    @Test
    void getAnimeBySlug_notFound_throwsAnimeNotFound() {
        when(redisService.get(any(), any())).thenReturn(null);
        when(animeRepository.findBySlugAndDeletedAtIsNull("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> animeService.getAnimeBySlug("nope"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getFeatured
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getFeatured_cacheHit_returnsCached() {
        List<AnimeSummaryDto> cached = List.of(new AnimeSummaryDto());
        when(redisService.get("anime:featured", List.class)).thenReturn(cached);

        List<AnimeSummaryDto> result = animeService.getFeatured();

        assertThat(result).isSameAs(cached);
        verify(animeRepository, never()).findFeaturedAnimes(anyInt());
    }

    @Test
    void getFeatured_cacheMiss_queriesDbAndCaches() {
        when(redisService.get("anime:featured", List.class)).thenReturn(null);
        when(animeRepository.findFeaturedAnimes(10)).thenReturn(List.of(buildAnime(1L, "JJK", "jjk")));

        List<AnimeSummaryDto> result = animeService.getFeatured();

        assertThat(result).isNotEmpty();
        verify(redisService).set(eq("anime:featured"), any(), eq(Duration.ofMinutes(10)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getTrending
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getTrending_redisHasData_returnsFromRedis() {
        List<Long> ids = List.of(2L, 1L, 3L);
        when(trendingService.getTrendingAnimeIds(10)).thenReturn(ids);
        when(animeRepository.findAllById(ids)).thenReturn(
            List.of(buildAnime(1L, "JJK", "jjk"), buildAnime(2L, "AOT", "aot"), buildAnime(3L, "DS", "ds"))
        );

        List<AnimeSummaryDto> result = animeService.getTrending(10);

        assertThat(result).hasSize(3);
        // Thứ tự phải giống Redis sorted set
        assertThat(result.get(0).getSlug()).isEqualTo("aot");
    }

    @Test
    void getTrending_redisEmpty_fallsBackToDb() {
        when(trendingService.getTrendingAnimeIds(10)).thenReturn(Collections.emptyList());
        when(animeRepository.findTopByViewCount(10)).thenReturn(List.of(buildAnime(1L, "JJK", "jjk")));

        List<AnimeSummaryDto> result = animeService.getTrending(10);

        assertThat(result).hasSize(1);
        verify(animeRepository).findTopByViewCount(10); // fallback DB
    }

    // ═══════════════════════════════════════════════════════════════════════
    // createAnime (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void createAnime_validRequest_savesAndIndexesEs() {
        AnimeCreateRequest req = buildCreateRequest("JJK", "jjk", List.of(1L), List.of(1L));
        when(animeRepository.existsBySlug("jjk")).thenReturn(false);
        when(genreRepository.findAllById(List.of(1L))).thenReturn(List.of(buildGenre(1L, "Action")));
        when(studioRepository.findAllById(List.of(1L))).thenReturn(List.of(buildStudio(1L, "MAPPA")));
        Anime saved = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.save(any())).thenReturn(saved);

        AnimeDetailDto result = animeService.createAnime(req);

        assertThat(result).isNotNull();
        verify(searchService).indexAnime(saved); // phải sync ES
    }

    @Test
    void createAnime_slugAlreadyExists_throwsSlugAlreadyExists() {
        when(animeRepository.existsBySlug("jjk")).thenReturn(true);

        assertThatThrownBy(() ->
            animeService.createAnime(buildCreateRequest("JJK", "jjk", List.of(), List.of()))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("SLUG_ALREADY_EXISTS");
    }

    @Test
    void createAnime_invalidGenreId_throwsGenreNotFound() {
        when(animeRepository.existsBySlug("jjk")).thenReturn(false);
        when(genreRepository.findAllById(List.of(999L))).thenReturn(Collections.emptyList());

        assertThatThrownBy(() ->
            animeService.createAnime(buildCreateRequest("JJK", "jjk", List.of(999L), List.of()))
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("GENRE_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // updateAnime (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void updateAnime_changeSlug_checksNewSlugUnique() {
        Anime existing = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(existing));
        when(animeRepository.existsBySlug("jjk-new")).thenReturn(false);
        when(animeRepository.save(any())).thenReturn(existing);

        AnimeUpdateRequest req = new AnimeUpdateRequest();
        req.setSlug("jjk-new");
        animeService.updateAnime(1L, req);

        verify(animeRepository).existsBySlug("jjk-new");
    }

    @Test
    void updateAnime_newSlugAlreadyTaken_throwsSlugAlreadyExists() {
        Anime existing = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(existing));
        when(animeRepository.existsBySlug("taken")).thenReturn(true);

        AnimeUpdateRequest req = new AnimeUpdateRequest();
        req.setSlug("taken");

        assertThatThrownBy(() -> animeService.updateAnime(1L, req))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("SLUG_ALREADY_EXISTS");
    }

    @Test
    void updateAnime_notFound_throwsAnimeNotFound() {
        when(animeRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> animeService.updateAnime(99L, new AnimeUpdateRequest()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    @Test
    void updateAnime_invalidatesCache() {
        Anime existing = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(existing));
        when(animeRepository.save(any())).thenReturn(existing);

        animeService.updateAnime(1L, new AnimeUpdateRequest());

        verify(redisService).delete("anime:1");
        verify(redisService).delete("anime:slug:jjk");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // deleteAnime (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void deleteAnime_existingAnime_softDeletesAndInvalidatesCache() {
        Anime anime = buildAnime(1L, "JJK", "jjk");
        when(animeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(anime));

        animeService.deleteAnime(1L);

        verify(animeRepository).softDelete(eq(1L), any(LocalDateTime.class));
        verify(redisService).delete("anime:1");
        verify(redisService).delete("anime:slug:jjk");
        verify(searchService).removeFromIndex(1L);
    }

    @Test
    void deleteAnime_notFound_throwsAnimeNotFound() {
        when(animeRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> animeService.deleteAnime(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("ANIME_NOT_FOUND");
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    AnimeCreateRequest buildCreateRequest(String title, String slug,
                                          List<Long> genreIds, List<Long> studioIds) {
        AnimeCreateRequest r = new AnimeCreateRequest();
        r.setTitle(title); r.setSlug(slug);
        r.setStatus(AnimeStatus.ONGOING); r.setType(AnimeType.TV);
        r.setGenreIds(genreIds); r.setStudioIds(studioIds);
        return r;
    }
    Genre buildGenre(Long id, String name) {
        Genre g = new Genre(); g.setId(id); g.setName(name); g.setSlug(name.toLowerCase()); return g;
    }
    Studio buildStudio(Long id, String name) {
        Studio s = new Studio(); s.setId(id); s.setName(name); return s;
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `AnimeControllerTest`
```java
@WebMvcTest(AnimeController.class)
@Import(SecurityConfig.class)
class AnimeControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean  AnimeService animeService;
    @MockBean  JwtUtil      jwtUtil;

    AnimeSummaryDto buildSummary(Long id, String title, String slug) {
        return AnimeSummaryDto.builder().id(id).title(title).slug(slug)
            .status("ONGOING").type("TV").build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /animes
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void listAnimes_noFilters_returns200WithPage() throws Exception {
        PageResponse<AnimeSummaryDto> page = new PageResponse<>(
            List.of(buildSummary(1L, "JJK", "jjk")), 1, 20, 1L, 1);
        when(animeService.listAnimes(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/animes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.items").isArray())
            .andExpect(jsonPath("$.data.items[0].slug").value("jjk"))
            .andExpect(jsonPath("$.data.pagination.total").value(1));
    }

    @Test
    void listAnimes_withStatusFilter_passesFilterToService() throws Exception {
        when(animeService.listAnimes(any())).thenReturn(new PageResponse<>(List.of(), 1, 20, 0L, 0));

        mockMvc.perform(get("/api/v1/animes").param("status", "ONGOING"))
            .andExpect(status().isOk());

        verify(animeService).listAnimes(argThat(p -> "ONGOING".equals(p.getStatus())));
    }

    @Test
    void listAnimes_invalidLimitOver100_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/animes").param("limit", "200"))
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /animes/:id
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getAnimeById_existingId_returns200WithDetail() throws Exception {
        AnimeDetailDto detail = AnimeDetailDto.builder().id(1L).title("JJK").slug("jjk").build();
        when(animeService.getAnimeById(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/animes/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.title").value("JJK"));
    }

    @Test
    void getAnimeBySlug_existingSlug_returns200() throws Exception {
        AnimeDetailDto detail = AnimeDetailDto.builder().id(1L).title("JJK").slug("jjk").build();
        when(animeService.getAnimeBySlug("jjk")).thenReturn(detail);

        mockMvc.perform(get("/api/v1/animes/jjk"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.slug").value("jjk"));
    }

    @Test
    void getAnime_notFound_returns404() throws Exception {
        when(animeService.getAnimeById(99L)).thenThrow(
            new ResourceNotFoundException("ANIME_NOT_FOUND", "Anime not found"));

        mockMvc.perform(get("/api/v1/animes/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("ANIME_NOT_FOUND"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /animes/trending
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getTrending_returns200WithItems() throws Exception {
        when(animeService.getTrending(10)).thenReturn(
            List.of(buildSummary(1L, "JJK", "jjk"), buildSummary(2L, "AOT", "aot")));

        mockMvc.perform(get("/api/v1/animes/trending"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items").isArray())
            .andExpect(jsonPath("$.data.items.length()").value(2));
    }

    @Test
    void getTrending_limitOverMax_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/animes/trending").param("limit", "50"))
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /animes/featured
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getFeatured_returns200() throws Exception {
        when(animeService.getFeatured()).thenReturn(List.of(buildSummary(1L, "JJK", "jjk")));

        mockMvc.perform(get("/api/v1/animes/featured"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items[0].slug").value("jjk"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /animes (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void createAnime_adminRole_returns201() throws Exception {
        AnimeDetailDto created = AnimeDetailDto.builder().id(1L).title("JJK").slug("jjk").build();
        when(animeService.createAnime(any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/animes")
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "title": "JJK", "slug": "jjk",
                      "status": "ONGOING", "type": "TV"
                    }
                """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.slug").value("jjk"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createAnime_userRole_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/animes")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"JJK","slug":"jjk","status":"ONGOING","type":"TV"}"""))
            .andExpect(status().isForbidden());
    }

    @Test
    void createAnime_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/animes")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"JJK","slug":"jjk","status":"ONGOING","type":"TV"}"""))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createAnime_duplicateSlug_returns409() throws Exception {
        when(animeService.createAnime(any())).thenThrow(
            new BusinessException("SLUG_ALREADY_EXISTS", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/animes")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"JJK","slug":"jjk","status":"ONGOING","type":"TV"}"""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("SLUG_ALREADY_EXISTS"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createAnime_missingRequiredFields_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/animes")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"JJK"}""")) // thiếu slug, status, type
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUT /animes/:id (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateAnime_validRequest_returns200() throws Exception {
        AnimeDetailDto updated = AnimeDetailDto.builder().id(1L).title("JJK S2").slug("jjk").build();
        when(animeService.updateAnime(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/v1/animes/1")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"JJK S2"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("JJK S2"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateAnime_notFound_returns404() throws Exception {
        when(animeService.updateAnime(eq(99L), any())).thenThrow(
            new ResourceNotFoundException("ANIME_NOT_FOUND", "Not found"));

        mockMvc.perform(put("/api/v1/animes/99")
                .contentType(APPLICATION_JSON)
                .content("""{"title":"X"}"""))
            .andExpect(status().isNotFound());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /animes/:id (Admin)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteAnime_existingId_returns204() throws Exception {
        doNothing().when(animeService).deleteAnime(1L);

        mockMvc.perform(delete("/api/v1/animes/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteAnime_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("ANIME_NOT_FOUND", "Not found"))
            .when(animeService).deleteAnime(99L);

        mockMvc.perform(delete("/api/v1/animes/99"))
            .andExpect(status().isNotFound());
    }
}
```
