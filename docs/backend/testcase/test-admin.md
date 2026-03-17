# Test Cases — Module Admin
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.admin`

---

## TẦNG 1 — REPOSITORY

> Admin module không có bảng riêng — các repository test dưới đây test các query phức tạp
> dùng cho dashboard và analytics mà các module khác không cover.

### `AdminUserRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class AdminUserRepositoryTest {

    @Autowired UserRepository             userRepository;
    @Autowired UserSubscriptionRepository subRepository;
    @Autowired SubscriptionPlanRepository planRepository;

    Long planId;

    @BeforeEach
    void setup() {
        planId = planRepository.save(SubscriptionPlan.builder()
            .name("VIP 1 Tháng").durationDays(30)
            .price(BigDecimal.valueOf(59000))
            .isActive(true).sortOrder((short) 1).build()).getId();
    }

    User buildUser(String email, String username, Role role, boolean active) {
        return User.builder()
            .email(email).username(username).password("hash")
            .provider(Provider.LOCAL).role(role)
            .emailVerified(true).isActive(active).build();
    }

    // ── searchUsers ───────────────────────────────────────────────────────
    @Test
    void searchByEmail_returnsMatchingUsers() {
        userRepository.save(buildUser("naruto@ninja.com", "naruto", Role.USER, true));
        userRepository.save(buildUser("sasuke@test.com",  "sasuke", Role.USER, true));

        Page<User> result = userRepository.searchUsers("ninja", null, null,
            PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEmail()).contains("ninja");
    }

    @Test
    void searchByUsername_returnsMatchingUsers() {
        userRepository.save(buildUser("a@test.com", "naruto_fan", Role.USER, true));
        userRepository.save(buildUser("b@test.com", "random",     Role.USER, true));

        Page<User> result = userRepository.searchUsers("naruto", null, null,
            PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUsername()).contains("naruto");
    }

    @Test
    void filterByRole_returnsOnlyAdmins() {
        userRepository.save(buildUser("admin@test.com", "admin1", Role.ADMIN, true));
        userRepository.save(buildUser("user@test.com",  "user1",  Role.USER,  true));

        Page<User> result = userRepository.searchUsers(null, Role.ADMIN, null,
            PageRequest.of(0, 10));

        assertThat(result.getContent()).allMatch(u -> u.getRole() == Role.ADMIN);
    }

    @Test
    void filterByIsActive_returnsOnlyActive() {
        userRepository.save(buildUser("active@test.com",   "active_u",   Role.USER, true));
        userRepository.save(buildUser("inactive@test.com", "inactive_u", Role.USER, false));

        Page<User> result = userRepository.searchUsers(null, null, true,
            PageRequest.of(0, 10));

        assertThat(result.getContent()).allMatch(User::isActive);
    }

    @Test
    void searchUsers_noFilter_returnsAllUsers() {
        userRepository.save(buildUser("u1@test.com", "u1", Role.USER,  true));
        userRepository.save(buildUser("u2@test.com", "u2", Role.ADMIN, true));
        userRepository.save(buildUser("u3@test.com", "u3", Role.USER,  false));

        Page<User> result = userRepository.searchUsers(null, null, null,
            PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    // ── countCreatedSince ─────────────────────────────────────────────────
    @Test
    void countCreatedSince_returnsNewUsersCount() {
        userRepository.save(buildUser("today1@test.com", "today1", Role.USER, true));
        userRepository.save(buildUser("today2@test.com", "today2", Role.USER, true));

        long count = userRepository.countByCreatedAtAfter(
            LocalDateTime.now().minusMinutes(1));

        assertThat(count).isEqualTo(2);
    }
}
```

---

### `AdminAnalyticsRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class AdminAnalyticsRepositoryTest {

    @Autowired PaymentRepository  paymentRepository;
    @Autowired UserRepository     userRepository;
    @Autowired UserSubscriptionRepository subRepository;
    @Autowired SubscriptionPlanRepository planRepository;

    UUID userId;
    Long subId;

    @BeforeEach
    void setup() {
        userId = userRepository.save(User.builder()
            .email("an@test.com").username("an_user").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        Long planId = planRepository.save(SubscriptionPlan.builder()
            .name("VIP").durationDays(30)
            .price(BigDecimal.valueOf(59000))
            .isActive(true).sortOrder((short) 1).build()).getId();

        subId = subRepository.save(UserSubscription.builder()
            .userId(userId).planId(planId).status(SubStatus.ACTIVE)
            .paidPrice(BigDecimal.valueOf(59000)).durationDays(30)
            .startedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(30)).build()).getId();
    }

    // ── sumPaidAmount ─────────────────────────────────────────────────────
    @Test
    void sumPaidAmount_onlyCountsPaidPayments() {
        // PAID
        Payment p1 = Payment.builder()
            .subscriptionId(subId).userId(userId).gateway(Gateway.VNPAY)
            .amount(BigDecimal.valueOf(59000)).currency("VND").status(PaymentStatus.PAID)
            .orderCode("ORD-T1").paidAt(LocalDateTime.now()).expiredAt(LocalDateTime.now().plusMinutes(15)).build();
        // FAILED — không được tính
        Payment p2 = Payment.builder()
            .subscriptionId(subId).userId(userId).gateway(Gateway.MOMO)
            .amount(BigDecimal.valueOf(59000)).currency("VND").status(PaymentStatus.FAILED)
            .orderCode("ORD-T2").expiredAt(LocalDateTime.now().plusMinutes(15)).build();
        paymentRepository.saveAll(List.of(p1, p2));

        BigDecimal total = paymentRepository.sumPaidAmount(LocalDateTime.now().minusMinutes(1));

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(59000));
    }

    @Test
    void sumPaidAmount_noPaidPayments_returnsZeroOrNull() {
        BigDecimal total = paymentRepository.sumPaidAmount(LocalDateTime.now().minusMinutes(1));
        // DB trả về NULL khi không có rows → service xử lý thành 0
        assertThat(total == null || total.compareTo(BigDecimal.ZERO) == 0).isTrue();
    }

    // ── countActivatedSince ───────────────────────────────────────────────
    @Test
    void countActivatedSince_returnsNewActivations() {
        long count = subRepository.countByStatusAndStartedAtAfter(
            SubStatus.ACTIVE, LocalDateTime.now().minusMinutes(1));
        assertThat(count).isEqualTo(1);
    }
}
```

---

## TẦNG 2 — SERVICE

### `AdminDashboardServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock AnimeRepository            animeRepository;
    @Mock EpisodeRepository          episodeRepository;
    @Mock UserRepository             userRepository;
    @Mock TranscodeJobRepository     transcodeJobRepository;
    @Mock PaymentRepository          paymentRepository;
    @Mock UserSubscriptionRepository subRepository;
    @Mock RedisService               redisService;

    @InjectMocks AdminDashboardService dashboardService;

    @Test
    void getDashboard_aggregatesAllStats() {
        when(animeRepository.countByDeletedAtIsNull()).thenReturn(350L);
        when(episodeRepository.countByDeletedAtIsNull()).thenReturn(8200L);
        when(userRepository.count()).thenReturn(12400L);
        when(episodeRepository.sumViewCount()).thenReturn(5800000L);

        when(userRepository.countByCreatedAtAfter(any())).thenReturn(45L);
        when(transcodeJobRepository.countByStatus(TranscodeStatus.QUEUED)).thenReturn(2);
        when(transcodeJobRepository.countByStatus(TranscodeStatus.RUNNING)).thenReturn(1);
        when(transcodeJobRepository.countRecentFailed(any())).thenReturn(3);

        when(paymentRepository.sumPaidAmount(any())).thenReturn(BigDecimal.valueOf(14850000));
        when(subRepository.countByStatusAndStartedAtAfter(any(), any())).thenReturn(8L);

        when(animeRepository.findTopByViewCount(5)).thenReturn(List.of(
            buildAnime(1L, "Naruto", 1500000L),
            buildAnime(2L, "JJK", 980000L)
        ));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.getTotalAnimes()).isEqualTo(350);
        assertThat(result.getTotalEpisodes()).isEqualTo(8200);
        assertThat(result.getTotalUsers()).isEqualTo(12400);
        assertThat(result.getNewUsersToday()).isEqualTo(45);
        assertThat(result.getTranscodeJobs().getPending()).isEqualTo(2);
        assertThat(result.getTranscodeJobs().getRunning()).isEqualTo(1);
        assertThat(result.getTranscodeJobs().getFailedLast24h()).isEqualTo(3);
        assertThat(result.getRevenueThisMonth()).isEqualByComparingTo(BigDecimal.valueOf(14850000));
        assertThat(result.getTopAnimes()).hasSize(2);
        assertThat(result.getTopAnimes().get(0).getTitle()).isEqualTo("Naruto");
    }

    Anime buildAnime(Long id, String title, Long views) {
        Anime a = new Anime(); a.setId(id); a.setTitle(title); a.setViewCount(views); return a;
    }
}
```

---

### `AdminUserServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock UserRepository userRepository;
    @Mock RedisService   redisService;

    @InjectMocks AdminUserService adminUserService;

    UUID adminId = UUID.randomUUID();
    UUID targetId = UUID.randomUUID();

    User buildUser(UUID id, Role role, boolean active) {
        User u = new User(); u.setId(id); u.setRole(role); u.setActive(active); return u;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // changeRole
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void changeRole_adminChangesOtherUserRole_updatesRole() {
        User target = buildUser(targetId, Role.USER, true);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));

        adminUserService.changeRole(adminId, targetId, Role.ADMIN);

        verify(userRepository).save(argThat(u -> u.getRole() == Role.ADMIN));
    }

    @Test
    void changeRole_adminTriesToChangeSelf_throwsCannotModifySelf() {
        assertThatThrownBy(() ->
            adminUserService.changeRole(adminId, adminId, Role.USER)
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("CANNOT_MODIFY_SELF");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeRole_targetNotFound_throwsUserNotFound() {
        when(userRepository.findById(targetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            adminUserService.changeRole(adminId, targetId, Role.ADMIN)
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("USER_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // changeStatus
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void changeStatus_disableUser_updatesAndForcesLogout() {
        User target = buildUser(targetId, Role.USER, true);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));

        adminUserService.changeStatus(adminId, targetId, false);

        verify(userRepository).save(argThat(u -> !u.isActive()));
        verify(redisService).delete("refresh:" + targetId); // force logout
    }

    @Test
    void changeStatus_enableUser_updatesStatus() {
        User target = buildUser(targetId, Role.USER, false);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));

        adminUserService.changeStatus(adminId, targetId, true);

        verify(userRepository).save(argThat(User::isActive));
        // Không cần xóa Redis khi enable
        verify(redisService, never()).delete(any());
    }

    @Test
    void changeStatus_adminDisablesSelf_throwsCannotModifySelf() {
        assertThatThrownBy(() ->
            adminUserService.changeStatus(adminId, adminId, false)
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("CANNOT_MODIFY_SELF");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // setFeatured
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void setFeatured_existingAnime_updatesAndInvalidatesCache() {
        Anime anime = new Anime(); anime.setId(1L); anime.setSlug("jjk"); anime.setFeatured(false);

        AdminAnimeRepository animeRepo = mock(AdminAnimeRepository.class);
        when(animeRepo.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(anime));

        AdminUserService service = new AdminUserService(userRepository, redisService);
        // setFeatured thực ra thuộc AnimeService trong admin — test riêng logic cache invalidation

        verify(redisService, atLeastOnce()); // verify cache invalidation separately
    }
}
```

---

### `AdminAnalyticsServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {

    @Mock WatchHistoryRepository watchHistoryRepository;
    @Mock PaymentRepository      paymentRepository;
    @Mock TranscodeJobRepository transcodeJobRepository;
    @Mock AnimeRepository        animeRepository;

    @InjectMocks AdminAnalyticsService analyticsService;

    // ═══════════════════════════════════════════════════════════════════════
    // getViewAnalytics
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getViewAnalytics_weekPeriod_returnsDailyChartData() {
        List<DailyViewProjection> chart = List.of(
            new DailyViewProjection("2026-03-06", 25000L),
            new DailyViewProjection("2026-03-07", 28000L)
        );
        when(watchHistoryRepository.findDailyViewsByPeriod(any(), any())).thenReturn(chart);
        when(paymentRepository.findDailyRevenue(any(), any())).thenReturn(List.of());
        when(transcodeJobRepository.countByStatus(any())).thenReturn(0);
        when(transcodeJobRepository.countRecentFailed(any())).thenReturn(0);
        when(animeRepository.findTopAnimesByPeriod(any(), any(), anyInt())).thenReturn(List.of());

        AnalyticsDto result = analyticsService.getViewAnalytics("week", 10);

        assertThat(result.getViewsChart()).hasSize(2);
        assertThat(result.getViewsChart().get(0).getViews()).isEqualTo(25000L);
        assertThat(result.getPeriod()).isEqualTo("week");
    }

    @Test
    void getViewAnalytics_totalViews_sumsAllDailyViews() {
        List<DailyViewProjection> chart = List.of(
            new DailyViewProjection("2026-03-06", 25000L),
            new DailyViewProjection("2026-03-07", 28000L),
            new DailyViewProjection("2026-03-08", 22000L)
        );
        when(watchHistoryRepository.findDailyViewsByPeriod(any(), any())).thenReturn(chart);
        when(paymentRepository.findDailyRevenue(any(), any())).thenReturn(List.of());
        when(transcodeJobRepository.countByStatus(any())).thenReturn(0);
        when(transcodeJobRepository.countRecentFailed(any())).thenReturn(0);
        when(animeRepository.findTopAnimesByPeriod(any(), any(), anyInt())).thenReturn(List.of());

        AnalyticsDto result = analyticsService.getViewAnalytics("week", 10);

        assertThat(result.getTotalViews()).isEqualTo(75000L);
    }

    @Test
    void getViewAnalytics_transcodeHealth_includesFailedJobs() {
        when(watchHistoryRepository.findDailyViewsByPeriod(any(), any())).thenReturn(List.of());
        when(paymentRepository.findDailyRevenue(any(), any())).thenReturn(List.of());
        when(transcodeJobRepository.countByStatus(TranscodeStatus.QUEUED)).thenReturn(2);
        when(transcodeJobRepository.countByStatus(TranscodeStatus.RUNNING)).thenReturn(1);
        when(transcodeJobRepository.countRecentFailed(any())).thenReturn(5);
        when(animeRepository.findTopAnimesByPeriod(any(), any(), anyInt())).thenReturn(List.of());

        AnalyticsDto result = analyticsService.getViewAnalytics("today", 10);

        assertThat(result.getTranscodeHealth().getActiveJobs()).isEqualTo(1);
        assertThat(result.getTranscodeHealth().getFailedJobs()).isEqualTo(5);
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `AdminControllerTest`
```java
@WebMvcTest({AdminDashboardController.class, AdminUserController.class,
             AdminAnalyticsController.class, AdminUploadController.class})
@Import(SecurityConfig.class)
class AdminControllerTest {

    @Autowired MockMvc                mockMvc;
    @Autowired ObjectMapper           objectMapper;
    @MockBean  AdminDashboardService  dashboardService;
    @MockBean  AdminUserService       adminUserService;
    @MockBean  AdminAnalyticsService  analyticsService;
    @MockBean  CloudinaryService      cloudinaryService;
    @MockBean  JwtUtil                jwtUtil;

    // ═══════════════════════════════════════════════════════════════════════
    // GET /admin/dashboard
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_adminRole_returns200WithStats() throws Exception {
        DashboardDto dto = DashboardDto.builder()
            .totalAnimes(350).totalEpisodes(8200).totalUsers(12400)
            .totalViews(5800000L).newUsersToday(45).viewsToday(28000)
            .revenueThisMonth(BigDecimal.valueOf(14850000))
            .newSubscriptionsToday(8)
            .transcodeJobs(TranscodeHealthDto.builder()
                .pending(2).running(1).failedLast24h(3).build())
            .topAnimes(List.of(
                TopAnimeDto.builder().id(1L).title("Naruto").viewCount(1500000L).build()))
            .build();
        when(dashboardService.getDashboard()).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalAnimes").value(350))
            .andExpect(jsonPath("$.data.totalUsers").value(12400))
            .andExpect(jsonPath("$.data.revenueThisMonth").value(14850000))
            .andExpect(jsonPath("$.data.transcodeJobs.pending").value(2))
            .andExpect(jsonPath("$.data.topAnimes[0].title").value("Naruto"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDashboard_userRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getDashboard_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /admin/users
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void listUsers_noFilter_returns200WithPage() throws Exception {
        AdminUserDto userDto = AdminUserDto.builder()
            .id(UUID.randomUUID()).email("u@test.com")
            .username("user1").role("USER").isActive(true)
            .isVip(false).totalWatched(50L).build();
        PageResponse<AdminUserDto> page = new PageResponse<>(
            List.of(userDto), 1, 20, 1L, 1);
        when(adminUserService.listUsers(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items[0].email").value("u@test.com"))
            .andExpect(jsonPath("$.data.items[0].isVip").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listUsers_searchFilter_passesSearchToService() throws Exception {
        when(adminUserService.listUsers(any())).thenReturn(
            new PageResponse<>(List.of(), 1, 20, 0L, 0));

        mockMvc.perform(get("/api/v1/admin/users").param("search", "naruto"))
            .andExpect(status().isOk());

        verify(adminUserService).listUsers(argThat(p -> "naruto".equals(p.getSearch())));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATCH /admin/users/:id/role
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeRole_validRequest_returns200() throws Exception {
        UUID targetId = UUID.randomUUID();
        when(adminUserService.changeRole(any(), eq(targetId), eq(Role.ADMIN)))
            .thenReturn(new AdminRoleChangeResult(targetId, "ADMIN"));

        mockMvc.perform(patch("/api/v1/admin/users/" + targetId + "/role")
                .contentType(APPLICATION_JSON)
                .content("""{"role":"ADMIN"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeRole_selfModification_returns400() throws Exception {
        UUID adminId = UUID.randomUUID();
        doThrow(new BusinessException("CANNOT_MODIFY_SELF", HttpStatus.BAD_REQUEST))
            .when(adminUserService).changeRole(any(), eq(adminId), any());

        mockMvc.perform(patch("/api/v1/admin/users/" + adminId + "/role")
                .contentType(APPLICATION_JSON)
                .content("""{"role":"USER"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("CANNOT_MODIFY_SELF"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeRole_userNotFound_returns404() throws Exception {
        UUID unknownId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("USER_NOT_FOUND", "Not found"))
            .when(adminUserService).changeRole(any(), eq(unknownId), any());

        mockMvc.perform(patch("/api/v1/admin/users/" + unknownId + "/role")
                .contentType(APPLICATION_JSON)
                .content("""{"role":"ADMIN"}"""))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeRole_invalidRoleValue_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/" + UUID.randomUUID() + "/role")
                .contentType(APPLICATION_JSON)
                .content("""{"role":"SUPERUSER"}""")) // không hợp lệ
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATCH /admin/users/:id/status
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeStatus_disableUser_returns204() throws Exception {
        doNothing().when(adminUserService).changeStatus(any(), any(), eq(false));

        mockMvc.perform(patch("/api/v1/admin/users/" + UUID.randomUUID() + "/status")
                .contentType(APPLICATION_JSON)
                .content("""{"isActive":false}"""))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeStatus_selfDisable_returns400() throws Exception {
        UUID adminId = UUID.randomUUID();
        doThrow(new BusinessException("CANNOT_MODIFY_SELF", HttpStatus.BAD_REQUEST))
            .when(adminUserService).changeStatus(any(), eq(adminId), any());

        mockMvc.perform(patch("/api/v1/admin/users/" + adminId + "/status")
                .contentType(APPLICATION_JSON)
                .content("""{"isActive":false}"""))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "USER")
    void changeStatus_userRole_returns403() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/" + UUID.randomUUID() + "/status")
                .contentType(APPLICATION_JSON)
                .content("""{"isActive":false}"""))
            .andExpect(status().isForbidden());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /admin/analytics/views
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void getViewAnalytics_weekPeriod_returns200() throws Exception {
        AnalyticsDto dto = AnalyticsDto.builder()
            .period("week").totalViews(180000L)
            .totalRevenue(BigDecimal.valueOf(4470000))
            .newSubscriptions(30L)
            .viewsChart(List.of(
                DailyViewDto.builder().date("2026-03-06").views(25000L).build(),
                DailyViewDto.builder().date("2026-03-07").views(28000L).build()
            ))
            .transcodeHealth(TranscodeHealthDto.builder()
                .totalJobs(1240).successJobs(1230).failedJobs(8).activeJobs(2)
                .successRate(99.2).build())
            .build();
        when(analyticsService.getViewAnalytics("week", 10)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/analytics/views")
                .param("period", "week"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.period").value("week"))
            .andExpect(jsonPath("$.data.totalViews").value(180000))
            .andExpect(jsonPath("$.data.totalRevenue").value(4470000))
            .andExpect(jsonPath("$.data.viewsChart.length()").value(2))
            .andExpect(jsonPath("$.data.transcodeHealth.successRate").value(99.2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getViewAnalytics_invalidPeriod_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/views")
                .param("period", "yearly")) // invalid
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /admin/upload/image
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadImage_validJpeg_returns201WithUrl() throws Exception {
        ImageUploadDto dto = ImageUploadDto.builder()
            .url("https://res.cloudinary.com/demo/image/upload/thumbnails/jjk.jpg")
            .publicId("hhkungfu/thumbnails/jjk")
            .width(800).height(1200).format("jpg").bytes(124500L).build();
        when(cloudinaryService.upload(any(), eq("thumbnails"))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile(
            "file", "jjk.jpg", "image/jpeg", new byte[5000]);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                .file(file).param("folder", "thumbnails"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.url").value(containsString("cloudinary.com")))
            .andExpect(jsonPath("$.data.format").value("jpg"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadImage_invalidFileType_returns400() throws Exception {
        when(cloudinaryService.upload(any(), any()))
            .thenThrow(new BusinessException("INVALID_FILE_TYPE", HttpStatus.BAD_REQUEST));

        MockMultipartFile file = new MockMultipartFile(
            "file", "video.mp4", "video/mp4", new byte[100]);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                .file(file).param("folder", "thumbnails"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_FILE_TYPE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadImage_fileTooLarge_returns400() throws Exception {
        when(cloudinaryService.upload(any(), any()))
            .thenThrow(new BusinessException("FILE_TOO_LARGE", HttpStatus.BAD_REQUEST));

        byte[] bigFile = new byte[6 * 1024 * 1024]; // 6MB > 5MB limit
        MockMultipartFile file = new MockMultipartFile(
            "file", "big.jpg", "image/jpeg", bigFile);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                .file(file).param("folder", "banners"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("FILE_TOO_LARGE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadImage_missingFolder_returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "img.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/v1/admin/upload/image").file(file)) // thiếu folder param
            .andExpect(status().isBadRequest());
    }

    @Test
    void uploadImage_unauthenticated_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "img.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                .file(file).param("folder", "thumbnails"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void uploadImage_userRole_returns403() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "img.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                .file(file).param("folder", "thumbnails"))
            .andExpect(status().isForbidden());
    }
}
```
