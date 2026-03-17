# Test Cases — Module Subscription & Payment
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.subscription`

---

## TẦNG 1 — REPOSITORY

### `SubscriptionPlanRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class SubscriptionPlanRepositoryTest {

    @Autowired SubscriptionPlanRepository planRepository;

    SubscriptionPlan buildPlan(String name, int days, long price, boolean active, int order) {
        return SubscriptionPlan.builder()
            .name(name).durationDays(days)
            .price(BigDecimal.valueOf(price))
            .isActive(active).sortOrder((short) order)
            .build();
    }

    // ── findByIsActiveTrueOrderBySortOrderAsc ─────────────────────────────
    @Test
    void findActivePlans_returnsOnlyActiveOrderedBySortOrder() {
        planRepository.save(buildPlan("VIP 1 Năm",   365, 499000, true,  3));
        planRepository.save(buildPlan("VIP 1 Tháng", 30,  59000,  true,  1));
        planRepository.save(buildPlan("VIP 3 Tháng", 90,  149000, true,  2));
        planRepository.save(buildPlan("Inactive",    30,  59000,  false, 0));

        List<SubscriptionPlan> result = planRepository.findByIsActiveTrueOrderBySortOrderAsc();

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getName()).isEqualTo("VIP 1 Tháng");
        assertThat(result.get(1).getName()).isEqualTo("VIP 3 Tháng");
        assertThat(result.get(2).getName()).isEqualTo("VIP 1 Năm");
    }

    @Test
    void findActivePlans_noActivePlans_returnsEmpty() {
        planRepository.save(buildPlan("Inactive", 30, 59000, false, 0));
        assertThat(planRepository.findByIsActiveTrueOrderBySortOrderAsc()).isEmpty();
    }
}
```

---

### `UserSubscriptionRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class UserSubscriptionRepositoryTest {

    @Autowired UserSubscriptionRepository subRepository;
    @Autowired UserRepository             userRepository;
    @Autowired SubscriptionPlanRepository planRepository;

    UUID userId;
    Long planId;

    @BeforeEach
    void setup() {
        User user = userRepository.save(User.builder()
            .email("vip@test.com").username("vip_user")
            .password("hash").provider(Provider.LOCAL)
            .role(Role.USER).emailVerified(true).isActive(true).build());
        userId = user.getId();

        SubscriptionPlan plan = planRepository.save(SubscriptionPlan.builder()
            .name("VIP 1 Tháng").durationDays(30)
            .price(BigDecimal.valueOf(59000))
            .isActive(true).sortOrder((short) 1).build());
        planId = plan.getId();
    }

    UserSubscription buildSub(SubStatus status, LocalDateTime expiresAt) {
        return UserSubscription.builder()
            .userId(userId).planId(planId).status(status)
            .paidPrice(BigDecimal.valueOf(59000)).durationDays(30)
            .startedAt(LocalDateTime.now()).expiresAt(expiresAt)
            .build();
    }

    // ── isVipActive ───────────────────────────────────────────────────────
    @Test
    void isVipActive_activeNotExpired_returnsTrue() {
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().plusDays(30)));
        assertThat(subRepository.isVipActive(userId, LocalDateTime.now())).isTrue();
    }

    @Test
    void isVipActive_activeButExpired_returnsFalse() {
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().minusDays(1)));
        assertThat(subRepository.isVipActive(userId, LocalDateTime.now())).isFalse();
    }

    @Test
    void isVipActive_statusExpired_returnsFalse() {
        subRepository.save(buildSub(SubStatus.EXPIRED, LocalDateTime.now().plusDays(30)));
        assertThat(subRepository.isVipActive(userId, LocalDateTime.now())).isFalse();
    }

    @Test
    void isVipActive_noSubscription_returnsFalse() {
        assertThat(subRepository.isVipActive(userId, LocalDateTime.now())).isFalse();
    }

    // ── findCurrentActive ─────────────────────────────────────────────────
    @Test
    void findCurrentActive_multipleActiveSubs_returnsMostRecentExpiry() {
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().plusDays(10)));
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().plusDays(40)));

        Optional<UserSubscription> result = subRepository
            .findCurrentActive(userId, LocalDateTime.now());

        assertThat(result).isPresent();
        assertThat(result.get().getExpiresAt())
            .isAfter(LocalDateTime.now().plusDays(30)); // lấy cái xa nhất
    }

    @Test
    void findCurrentActive_noActiveSub_returnsEmpty() {
        subRepository.save(buildSub(SubStatus.EXPIRED, LocalDateTime.now().minusDays(1)));
        assertThat(subRepository.findCurrentActive(userId, LocalDateTime.now())).isEmpty();
    }

    // ── expireOverdue ─────────────────────────────────────────────────────
    @Test
    void expireOverdue_expiredActiveSubs_updatesStatusToExpired() {
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().minusHours(1)));
        subRepository.save(buildSub(SubStatus.ACTIVE, LocalDateTime.now().plusDays(10)));

        int count = subRepository.expireOverdue(LocalDateTime.now());

        assertThat(count).isEqualTo(1);
        List<UserSubscription> all = subRepository.findByUserId(userId);
        long expiredCount = all.stream().filter(s -> s.getStatus() == SubStatus.EXPIRED).count();
        assertThat(expiredCount).isEqualTo(1);
    }
}
```

---

### `PaymentRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class PaymentRepositoryTest {

    @Autowired PaymentRepository          paymentRepository;
    @Autowired UserSubscriptionRepository subRepository;
    @Autowired UserRepository             userRepository;
    @Autowired SubscriptionPlanRepository planRepository;

    UUID userId;
    Long subId;

    @BeforeEach
    void setup() {
        User user = userRepository.save(User.builder()
            .email("pay@test.com").username("pay_user")
            .password("hash").provider(Provider.LOCAL)
            .role(Role.USER).emailVerified(true).isActive(true).build());
        userId = user.getId();

        SubscriptionPlan plan = planRepository.save(SubscriptionPlan.builder()
            .name("VIP 1 Tháng").durationDays(30)
            .price(BigDecimal.valueOf(59000))
            .isActive(true).sortOrder((short) 1).build());

        UserSubscription sub = subRepository.save(UserSubscription.builder()
            .userId(userId).planId(plan.getId()).status(SubStatus.PENDING)
            .paidPrice(BigDecimal.valueOf(59000)).durationDays(30).build());
        subId = sub.getId();
    }

    Payment buildPayment(String orderCode, PaymentStatus status, int minutesToExpiry) {
        return Payment.builder()
            .subscriptionId(subId).userId(userId)
            .gateway(Gateway.VNPAY).amount(BigDecimal.valueOf(59000))
            .currency("VND").status(status).orderCode(orderCode)
            .orderInfo("VIP 1 Tháng")
            .expiredAt(LocalDateTime.now().plusMinutes(minutesToExpiry))
            .build();
    }

    // ── findByOrderCode ───────────────────────────────────────────────────
    @Test
    void findByOrderCode_existingCode_returnsPayment() {
        paymentRepository.save(buildPayment("ORD-001", PaymentStatus.PENDING, 15));
        Optional<Payment> result = paymentRepository.findByOrderCode("ORD-001");
        assertThat(result).isPresent();
        assertThat(result.get().getOrderCode()).isEqualTo("ORD-001");
    }

    @Test
    void findByOrderCode_notExisting_returnsEmpty() {
        assertThat(paymentRepository.findByOrderCode("NOPE")).isEmpty();
    }

    // ── orderCode unique constraint ────────────────────────────────────────
    @Test
    void save_duplicateOrderCode_throwsConstraintViolation() {
        paymentRepository.save(buildPayment("ORD-DUP", PaymentStatus.PENDING, 15));
        assertThatThrownBy(() ->
            paymentRepository.saveAndFlush(buildPayment("ORD-DUP", PaymentStatus.PENDING, 15))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── findExpiredPendingSubIds ──────────────────────────────────────────
    @Test
    void findExpiredPendingSubIds_returnsOverduePayments() {
        paymentRepository.save(buildPayment("ORD-EXP", PaymentStatus.PENDING, -5)); // hết hạn
        paymentRepository.save(buildPayment("ORD-OK",  PaymentStatus.PENDING, 10)); // còn hạn

        List<Long> expiredSubIds = paymentRepository.findExpiredPendingSubIds(LocalDateTime.now());

        assertThat(expiredSubIds).hasSize(1);
        assertThat(expiredSubIds.get(0)).isEqualTo(subId);
    }

    // ── bulkExpire ─────────────────────────────────────────────────────────
    @Test
    void bulkExpire_updatesPendingOverdueToExpired() {
        paymentRepository.save(buildPayment("ORD-E1", PaymentStatus.PENDING, -10));
        paymentRepository.save(buildPayment("ORD-E2", PaymentStatus.PENDING, -5));
        paymentRepository.save(buildPayment("ORD-E3", PaymentStatus.PENDING, 10)); // chưa hết

        int count = paymentRepository.bulkExpire(LocalDateTime.now());

        assertThat(count).isEqualTo(2);
    }

    // ── sumPaidAmount ─────────────────────────────────────────────────────
    @Test
    void sumPaidAmount_returnsCorrectTotal() {
        Payment p1 = buildPayment("ORD-P1", PaymentStatus.PAID, 0);
        p1.setPaidAt(LocalDateTime.now());
        Payment p2 = buildPayment("ORD-P2", PaymentStatus.PAID, 0);
        p2.setPaidAt(LocalDateTime.now());
        paymentRepository.saveAll(List.of(p1, p2));

        BigDecimal total = paymentRepository.sumPaidAmount(LocalDateTime.now().minusMinutes(1));

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(118000));
    }
}
```

---

## TẦNG 2 — SERVICE

### `SubscriptionServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock SubscriptionPlanRepository     planRepository;
    @Mock UserSubscriptionRepository     subRepository;
    @Mock PaymentRepository              paymentRepository;
    @Mock UserRepository                 userRepository;
    @Mock VNPayService                   vnPayService;
    @Mock MoMoService                    moMoService;
    @Mock RedisService                   redisService;

    @InjectMocks SubscriptionService subscriptionService;

    UUID  userId = UUID.randomUUID();
    Long  planId = 1L;

    User buildUser(boolean emailVerified) {
        User u = new User();
        u.setId(userId); u.setEmail("u@test.com"); u.setEmailVerified(emailVerified);
        return u;
    }

    SubscriptionPlan buildPlan(boolean active) {
        SubscriptionPlan p = new SubscriptionPlan();
        p.setId(planId); p.setName("VIP 1 Tháng");
        p.setDurationDays(30); p.setPrice(BigDecimal.valueOf(59000));
        p.setActive(active);
        return p;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // isVipActive (cache layer)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void isVipActive_cacheHit_returnsFromCache() {
        when(redisService.get("vip:status:" + userId, Boolean.class)).thenReturn(true);

        boolean result = subscriptionService.isVipActive(userId);

        assertThat(result).isTrue();
        verify(subRepository, never()).isVipActive(any(), any());
    }

    @Test
    void isVipActive_cacheMiss_queriesDbAndCaches() {
        when(redisService.get("vip:status:" + userId, Boolean.class)).thenReturn(null);
        when(subRepository.isVipActive(eq(userId), any())).thenReturn(true);

        boolean result = subscriptionService.isVipActive(userId);

        assertThat(result).isTrue();
        verify(redisService).set(eq("vip:status:" + userId), eq(true), eq(Duration.ofMinutes(5)));
    }

    @Test
    void isVipActive_noActiveSub_returnsFalseAndCaches() {
        when(redisService.get("vip:status:" + userId, Boolean.class)).thenReturn(null);
        when(subRepository.isVipActive(eq(userId), any())).thenReturn(false);

        boolean result = subscriptionService.isVipActive(userId);

        assertThat(result).isFalse();
        verify(redisService).set(eq("vip:status:" + userId), eq(false), any());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // initiatePayment
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void initiatePayment_validRequestVNPay_createsSubAndReturnsUrl() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(true)));
        when(planRepository.findById(planId)).thenReturn(Optional.of(buildPlan(true)));
        when(subRepository.findCurrentActive(eq(userId), any())).thenReturn(Optional.empty());

        UserSubscription savedSub = new UserSubscription(); savedSub.setId(10L);
        when(subRepository.save(any())).thenReturn(savedSub);
        Payment savedPayment = new Payment(); savedPayment.setId(20L);
        when(paymentRepository.save(any())).thenReturn(savedPayment);
        when(vnPayService.createPaymentUrl(any(), any())).thenReturn("https://vnpay.vn/pay?xxx");

        InitiatePaymentRequest req = new InitiatePaymentRequest(planId, "VNPAY");
        PaymentInitiateResponse result = subscriptionService.initiatePayment(userId, req);

        assertThat(result.getPaymentUrl()).startsWith("https://vnpay.vn");
        verify(subRepository).save(argThat(s -> s.getStatus() == SubStatus.PENDING));
        verify(paymentRepository).save(argThat(p -> p.getGateway() == Gateway.VNPAY));
    }

    @Test
    void initiatePayment_emailNotVerified_throwsEmailNotVerified() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(false)));

        assertThatThrownBy(() ->
            subscriptionService.initiatePayment(userId, new InitiatePaymentRequest(planId, "VNPAY"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("EMAIL_NOT_VERIFIED");
    }

    @Test
    void initiatePayment_planNotFound_throwsPlanNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(true)));
        when(planRepository.findById(planId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            subscriptionService.initiatePayment(userId, new InitiatePaymentRequest(planId, "VNPAY"))
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("PLAN_NOT_FOUND");
    }

    @Test
    void initiatePayment_planInactive_throwsPlanNotActive() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(true)));
        when(planRepository.findById(planId)).thenReturn(Optional.of(buildPlan(false)));

        assertThatThrownBy(() ->
            subscriptionService.initiatePayment(userId, new InitiatePaymentRequest(planId, "VNPAY"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("PLAN_NOT_ACTIVE");
    }

    @Test
    void initiatePayment_withExistingActiveSub_calculatesExtendedExpiry() {
        // Gia hạn: expires_at mới = expires_at cũ + 30 ngày
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(true)));
        when(planRepository.findById(planId)).thenReturn(Optional.of(buildPlan(true)));

        UserSubscription existingSub = new UserSubscription();
        existingSub.setExpiresAt(LocalDateTime.now().plusDays(10)); // còn 10 ngày
        when(subRepository.findCurrentActive(eq(userId), any())).thenReturn(Optional.of(existingSub));
        when(subRepository.save(any())).thenReturn(new UserSubscription());
        when(paymentRepository.save(any())).thenReturn(new Payment());
        when(vnPayService.createPaymentUrl(any(), any())).thenReturn("https://vnpay.vn/pay");

        subscriptionService.initiatePayment(userId, new InitiatePaymentRequest(planId, "VNPAY"));

        // Sub mới phải có previousSubId
        verify(subRepository).save(argThat(s -> s.getPreviousSubId() != null));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // handleVNPayCallback
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void handleVNPayCallback_successCode_activatesSubscription() {
        Payment payment = buildPayment("ORD-001", PaymentStatus.PENDING);
        payment.setSubscriptionId(10L);
        payment.setUserId(userId);
        UserSubscription sub = new UserSubscription();
        sub.setId(10L); sub.setDurationDays(30);

        when(vnPayService.verifySignature(any())).thenReturn(true);
        when(paymentRepository.findByOrderCode("ORD-001")).thenReturn(Optional.of(payment));
        when(subRepository.findById(10L)).thenReturn(Optional.of(sub));
        when(subRepository.findCurrentActive(eq(userId), any())).thenReturn(Optional.empty());

        Map<String, String> params = Map.of(
            "vnp_TxnRef", "ORD-001",
            "vnp_ResponseCode", "00",
            "vnp_TransactionNo", "123456",
            "vnp_Amount", "5900000"
        );

        subscriptionService.handleVNPayCallback(params);

        verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.PAID));
        verify(subRepository).save(argThat(s -> s.getStatus() == SubStatus.ACTIVE));
        verify(redisService).delete("vip:status:" + userId); // xóa cache
    }

    @Test
    void handleVNPayCallback_failedCode_cancelsSubscription() {
        Payment payment = buildPayment("ORD-002", PaymentStatus.PENDING);
        payment.setSubscriptionId(10L);
        UserSubscription sub = new UserSubscription(); sub.setId(10L);

        when(vnPayService.verifySignature(any())).thenReturn(true);
        when(paymentRepository.findByOrderCode("ORD-002")).thenReturn(Optional.of(payment));
        when(subRepository.findById(10L)).thenReturn(Optional.of(sub));

        Map<String, String> params = Map.of(
            "vnp_TxnRef", "ORD-002",
            "vnp_ResponseCode", "24", // hủy giao dịch
            "vnp_Amount", "5900000"
        );

        subscriptionService.handleVNPayCallback(params);

        verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.FAILED));
        verify(subRepository).save(argThat(s -> s.getStatus() == SubStatus.CANCELLED));
    }

    @Test
    void handleVNPayCallback_invalidSignature_throwsInvalidSignature() {
        when(vnPayService.verifySignature(any())).thenReturn(false);

        assertThatThrownBy(() ->
            subscriptionService.handleVNPayCallback(Map.of("vnp_SecureHash", "bad"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("INVALID_SIGNATURE");
    }

    @Test
    void handleVNPayCallback_alreadyPaid_idempotentNoDoubleActivation() {
        Payment payment = buildPayment("ORD-003", PaymentStatus.PAID); // đã xử lý rồi
        when(vnPayService.verifySignature(any())).thenReturn(true);
        when(paymentRepository.findByOrderCode("ORD-003")).thenReturn(Optional.of(payment));

        subscriptionService.handleVNPayCallback(
            Map.of("vnp_TxnRef", "ORD-003", "vnp_ResponseCode", "00", "vnp_Amount", "5900000"));

        // Không xử lý lại
        verify(subRepository, never()).save(any());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SubscriptionJobService (@Scheduled)
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void expireSubscriptions_callsRepositoryBulkExpire() {
        when(subRepository.expireOverdue(any())).thenReturn(5);
        // Gọi trực tiếp method scheduled
        SubscriptionJobService jobService = new SubscriptionJobService(subRepository, paymentRepository);
        jobService.expireSubscriptions();
        verify(subRepository).expireOverdue(any(LocalDateTime.class));
    }

    @Test
    void expireStalePayments_expiresPendingOverdueAndCancelsSubs() {
        when(paymentRepository.findExpiredPendingSubIds(any())).thenReturn(List.of(10L, 11L));
        when(paymentRepository.bulkExpire(any())).thenReturn(2);

        SubscriptionJobService jobService = new SubscriptionJobService(subRepository, paymentRepository);
        jobService.expireStalePayments();

        verify(paymentRepository).bulkExpire(any());
        verify(subRepository).bulkCancel(List.of(10L, 11L));
    }

    @Test
    void expireStalePayments_noExpiredPayments_doesNotCallBulkCancel() {
        when(paymentRepository.findExpiredPendingSubIds(any())).thenReturn(Collections.emptyList());
        when(paymentRepository.bulkExpire(any())).thenReturn(0);

        SubscriptionJobService jobService = new SubscriptionJobService(subRepository, paymentRepository);
        jobService.expireStalePayments();

        verify(subRepository, never()).bulkCancel(any());
    }

    // ── Helper ─────────────────────────────────────────────────────────────
    Payment buildPayment(String code, PaymentStatus status) {
        Payment p = new Payment();
        p.setOrderCode(code); p.setStatus(status);
        p.setGateway(Gateway.VNPAY); p.setAmount(BigDecimal.valueOf(59000));
        p.setUserId(userId);
        return p;
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `SubscriptionControllerTest`
```java
@WebMvcTest({SubscriptionController.class, PaymentCallbackController.class})
@Import(SecurityConfig.class)
class SubscriptionControllerTest {

    @Autowired MockMvc              mockMvc;
    @Autowired ObjectMapper         objectMapper;
    @MockBean  SubscriptionService  subscriptionService;
    @MockBean  JwtUtil              jwtUtil;

    // ═══════════════════════════════════════════════════════════════════════
    // GET /subscriptions/plans
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void getPlans_returns200WithAllActivePlans() throws Exception {
        List<SubscriptionPlanDto> plans = List.of(
            SubscriptionPlanDto.builder().id(1L).name("VIP 1 Tháng")
                .durationDays(30).price(59000L).isActive(true).sortOrder(1).build(),
            SubscriptionPlanDto.builder().id(2L).name("VIP 3 Tháng")
                .durationDays(90).price(149000L).savingPercent(16).isActive(true).sortOrder(2).build()
        );
        when(subscriptionService.getActivePlans()).thenReturn(plans);

        mockMvc.perform(get("/api/v1/subscriptions/plans"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items").isArray())
            .andExpect(jsonPath("$.data.items.length()").value(2))
            .andExpect(jsonPath("$.data.items[0].name").value("VIP 1 Tháng"))
            .andExpect(jsonPath("$.data.items[1].savingPercent").value(16));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /subscriptions/me
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void getMySubscription_vipUser_returns200WithStatus() throws Exception {
        UserSubscriptionDto dto = UserSubscriptionDto.builder()
            .isVip(true).planName("VIP 3 Tháng")
            .status("ACTIVE").daysRemaining(78).build();
        when(subscriptionService.getMySubscription(any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/subscriptions/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.isVip").value(true))
            .andExpect(jsonPath("$.data.daysRemaining").value(78));
    }

    @Test
    @WithMockUser
    void getMySubscription_noVip_returns200WithIsVipFalse() throws Exception {
        UserSubscriptionDto dto = UserSubscriptionDto.builder()
            .isVip(false).currentSubscription(null).build();
        when(subscriptionService.getMySubscription(any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/subscriptions/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.isVip").value(false))
            .andExpect(jsonPath("$.data.currentSubscription").doesNotExist());
    }

    @Test
    void getMySubscription_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/subscriptions/me"))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /subscriptions/initiate
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void initiatePayment_validRequest_returns200WithPaymentUrl() throws Exception {
        PaymentInitiateResponse response = PaymentInitiateResponse.builder()
            .paymentUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?xxx")
            .orderId("ORD-20260313143000-X7K2M9")
            .expiresIn(900)
            .build();
        when(subscriptionService.initiatePayment(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":1,"gateway":"VNPAY"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.paymentUrl").value(startsWith("https://sandbox.vnpayment")))
            .andExpect(jsonPath("$.data.orderId").value("ORD-20260313143000-X7K2M9"))
            .andExpect(jsonPath("$.data.expiresIn").value(900));
    }

    @Test
    @WithMockUser
    void initiatePayment_emailNotVerified_returns403() throws Exception {
        when(subscriptionService.initiatePayment(any(), any()))
            .thenThrow(new BusinessException("EMAIL_NOT_VERIFIED", HttpStatus.FORBIDDEN));

        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":1,"gateway":"VNPAY"}"""))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @WithMockUser
    void initiatePayment_planNotFound_returns404() throws Exception {
        when(subscriptionService.initiatePayment(any(), any()))
            .thenThrow(new ResourceNotFoundException("PLAN_NOT_FOUND", "Not found"));

        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":999,"gateway":"VNPAY"}"""))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void initiatePayment_planNotActive_returns400() throws Exception {
        when(subscriptionService.initiatePayment(any(), any()))
            .thenThrow(new BusinessException("PLAN_NOT_ACTIVE", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":1,"gateway":"VNPAY"}"""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void initiatePayment_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":1,"gateway":"VNPAY"}"""))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void initiatePayment_missingGateway_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/subscriptions/initiate")
                .contentType(APPLICATION_JSON)
                .content("""{"planId":1}"""))
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /payments/callback/vnpay
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void vnpayCallback_successCode_redirectsToSuccessPage() throws Exception {
        doNothing().when(subscriptionService).handleVNPayCallback(any());

        mockMvc.perform(get("/api/v1/payments/callback/vnpay")
                .param("vnp_TxnRef",       "ORD-001")
                .param("vnp_ResponseCode", "00")
                .param("vnp_Amount",       "5900000")
                .param("vnp_TransactionNo","123456")
                .param("vnp_SecureHash",   "validhash"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location",
                containsString("status=success")));
    }

    @Test
    void vnpayCallback_failedCode_redirectsToFailedPage() throws Exception {
        doNothing().when(subscriptionService).handleVNPayCallback(any());

        mockMvc.perform(get("/api/v1/payments/callback/vnpay")
                .param("vnp_TxnRef",       "ORD-002")
                .param("vnp_ResponseCode", "24") // người dùng hủy
                .param("vnp_Amount",       "5900000")
                .param("vnp_SecureHash",   "validhash"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location",
                containsString("status=failed")));
    }

    @Test
    void vnpayCallback_invalidSignature_redirectsToFailedPage() throws Exception {
        doThrow(new BusinessException("INVALID_SIGNATURE", HttpStatus.BAD_REQUEST))
            .when(subscriptionService).handleVNPayCallback(any());

        mockMvc.perform(get("/api/v1/payments/callback/vnpay")
                .param("vnp_TxnRef",     "ORD-003")
                .param("vnp_ResponseCode","00")
                .param("vnp_Amount",     "5900000")
                .param("vnp_SecureHash", "badsig"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location",
                containsString("status=failed")));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /payments/result/:orderId
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void getPaymentResult_paidOrder_returns200WithDetail() throws Exception {
        PaymentResultDto result = PaymentResultDto.builder()
            .orderId("ORD-001").status("PAID")
            .planName("VIP 3 Tháng").amount(149000L)
            .paidAt(LocalDateTime.now().toString()).build();
        when(subscriptionService.getPaymentResult(eq("ORD-001"), any())).thenReturn(result);

        mockMvc.perform(get("/api/v1/payments/result/ORD-001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PAID"))
            .andExpect(jsonPath("$.data.amount").value(149000));
    }

    @Test
    @WithMockUser
    void getPaymentResult_pendingOrder_returns200WithPendingStatus() throws Exception {
        PaymentResultDto result = PaymentResultDto.builder()
            .orderId("ORD-002").status("PENDING").build();
        when(subscriptionService.getPaymentResult(eq("ORD-002"), any())).thenReturn(result);

        mockMvc.perform(get("/api/v1/payments/result/ORD-002"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void getPaymentResult_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/payments/result/ORD-001"))
            .andExpect(status().isUnauthorized());
    }
}
```
