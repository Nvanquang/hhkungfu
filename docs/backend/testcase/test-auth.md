# Test Cases — Module Auth
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller

---

## Conventions

```java
// Annotations chung
@ExtendWith(MockitoExtension.class)          // Unit test (Service, Repository)
@WebMvcTest(AuthController.class)            // Controller layer
@DataJpaTest                                 // Repository layer
@ActiveProfiles("test")

// Base package
// com.hhkungfu.auth.repository / .service / .controller
```

---

## TẦNG 1 — REPOSITORY

### `UserRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class UserRepositoryTest {

    @Autowired UserRepository userRepository;

    // ── Fixture ──────────────────────────────────────────────────────────
    User buildUser(String email, String username) {
        return User.builder()
            .email(email).username(username)
            .password("hashed").provider(Provider.LOCAL)
            .role(Role.USER).emailVerified(false).isActive(true)
            .build();
    }

    // ── findByEmail ───────────────────────────────────────────────────────
    @Test
    void findByEmail_existingEmail_returnsUser() {
        userRepository.save(buildUser("a@test.com", "user_a"));
        Optional<User> result = userRepository.findByEmail("a@test.com");
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("a@test.com");
    }

    @Test
    void findByEmail_nonExistingEmail_returnsEmpty() {
        Optional<User> result = userRepository.findByEmail("notfound@test.com");
        assertThat(result).isEmpty();
    }

    // ── findByUsername ─────────────────────────────────────────────────────
    @Test
    void findByUsername_existingUsername_returnsUser() {
        userRepository.save(buildUser("b@test.com", "user_b"));
        Optional<User> result = userRepository.findByUsername("user_b");
        assertThat(result).isPresent();
    }

    @Test
    void findByUsername_nonExisting_returnsEmpty() {
        assertThat(userRepository.findByUsername("ghost")).isEmpty();
    }

    // ── existsByEmail ──────────────────────────────────────────────────────
    @Test
    void existsByEmail_existingEmail_returnsTrue() {
        userRepository.save(buildUser("c@test.com", "user_c"));
        assertThat(userRepository.existsByEmail("c@test.com")).isTrue();
    }

    @Test
    void existsByEmail_nonExisting_returnsFalse() {
        assertThat(userRepository.existsByEmail("none@test.com")).isFalse();
    }

    // ── existsByUsername ───────────────────────────────────────────────────
    @Test
    void existsByUsername_existingUsername_returnsTrue() {
        userRepository.save(buildUser("d@test.com", "user_d"));
        assertThat(userRepository.existsByUsername("user_d")).isTrue();
    }

    // ── email unique constraint ────────────────────────────────────────────
    @Test
    void save_duplicateEmail_throwsException() {
        userRepository.save(buildUser("dup@test.com", "user_e1"));
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(buildUser("dup@test.com", "user_e2"));
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── username unique constraint ─────────────────────────────────────────
    @Test
    void save_duplicateUsername_throwsException() {
        userRepository.save(buildUser("e1@test.com", "dup_user"));
        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(buildUser("e2@test.com", "dup_user"));
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ── emailVerified default ─────────────────────────────────────────────
    @Test
    void save_newUser_emailVerifiedIsFalseByDefault() {
        User saved = userRepository.save(buildUser("f@test.com", "user_f"));
        assertThat(saved.isEmailVerified()).isFalse();
    }
}
```

---

### `UserOtpRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class UserOtpRepositoryTest {

    @Autowired UserOtpRepository otpRepository;
    @Autowired UserRepository    userRepository;

    User savedUser;

    @BeforeEach
    void setup() {
        savedUser = userRepository.save(User.builder()
            .email("otp@test.com").username("otp_user")
            .password("hash").provider(Provider.LOCAL)
            .role(Role.USER).emailVerified(false).isActive(true).build());
    }

    UserOtp buildOtp(String code, OtpType type, boolean used, int minutesFromNow) {
        return UserOtp.builder()
            .userId(savedUser.getId()).otpCode(code).otpType(type)
            .expiresAt(LocalDateTime.now().plusMinutes(minutesFromNow))
            .isUsed(used).build();
    }

    // ── findActiveOtp ──────────────────────────────────────────────────────
    @Test
    void findActiveOtp_validOtp_returnsOtp() {
        otpRepository.save(buildOtp("123456", OtpType.VERIFY_EMAIL, false, 10));
        Optional<UserOtp> result = otpRepository.findActiveOtp(
            savedUser.getId(), OtpType.VERIFY_EMAIL, LocalDateTime.now());
        assertThat(result).isPresent();
        assertThat(result.get().getOtpCode()).isEqualTo("123456");
    }

    @Test
    void findActiveOtp_usedOtp_returnsEmpty() {
        otpRepository.save(buildOtp("111111", OtpType.VERIFY_EMAIL, true, 10));
        Optional<UserOtp> result = otpRepository.findActiveOtp(
            savedUser.getId(), OtpType.VERIFY_EMAIL, LocalDateTime.now());
        assertThat(result).isEmpty();
    }

    @Test
    void findActiveOtp_expiredOtp_returnsEmpty() {
        otpRepository.save(buildOtp("222222", OtpType.VERIFY_EMAIL, false, -5)); // quá khứ
        Optional<UserOtp> result = otpRepository.findActiveOtp(
            savedUser.getId(), OtpType.VERIFY_EMAIL, LocalDateTime.now());
        assertThat(result).isEmpty();
    }

    @Test
    void findActiveOtp_wrongType_returnsEmpty() {
        otpRepository.save(buildOtp("333333", OtpType.FORGOT_PASSWORD, false, 10));
        Optional<UserOtp> result = otpRepository.findActiveOtp(
            savedUser.getId(), OtpType.VERIFY_EMAIL, LocalDateTime.now());
        assertThat(result).isEmpty();
    }

    // ── markAllUsed ────────────────────────────────────────────────────────
    @Test
    void markAllUsed_marksPendingOtpsAsUsed() {
        otpRepository.save(buildOtp("444444", OtpType.VERIFY_EMAIL, false, 10));
        otpRepository.save(buildOtp("555555", OtpType.VERIFY_EMAIL, false, 10));
        otpRepository.markAllUsed(savedUser.getId(), OtpType.VERIFY_EMAIL);
        List<UserOtp> all = otpRepository.findByUserIdAndOtpType(savedUser.getId(), OtpType.VERIFY_EMAIL);
        assertThat(all).allMatch(UserOtp::isUsed);
    }
}
```

---

## TẦNG 2 — SERVICE

### `AuthServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository        userRepository;
    @Mock UserOtpRepository     otpRepository;
    @Mock PasswordEncoder       passwordEncoder;
    @Mock JwtUtil               jwtUtil;
    @Mock RedisService          redisService;
    @Mock OtpService            otpService;

    @InjectMocks AuthService authService;

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTER
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void register_validInput_savesUserAndReturnsTokens() {
        RegisterRequest req = new RegisterRequest("u@test.com", "user1", "Pass123!");
        when(userRepository.existsByEmail("u@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("user1")).thenReturn(false);
        when(passwordEncoder.encode("Pass123!")).thenReturn("hashed");
        User savedUser = buildUser("u@test.com", "user1");
        when(userRepository.save(any())).thenReturn(savedUser);
        when(jwtUtil.generateAccessToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh_token");

        AuthResponse result = authService.register(req);

        assertThat(result.getAccessToken()).isEqualTo("access_token");
        assertThat(result.getUser().getEmail()).isEqualTo("u@test.com");
        verify(otpService).sendVerifyEmail(savedUser);
        verify(redisService).set(startsWith("refresh:"), eq("refresh_token"), any());
    }

    @Test
    void register_duplicateEmail_throwsEmailAlreadyExists() {
        when(userRepository.existsByEmail("dup@test.com")).thenReturn(true);
        assertThatThrownBy(() ->
            authService.register(new RegisterRequest("dup@test.com", "user2", "Pass123!"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("EMAIL_ALREADY_EXISTS");
    }

    @Test
    void register_duplicateUsername_throwsUsernameAlreadyExists() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("taken")).thenReturn(true);
        assertThatThrownBy(() ->
            authService.register(new RegisterRequest("new@test.com", "taken", "Pass123!"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("USERNAME_ALREADY_EXISTS");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void login_validCredentials_returnsTokens() {
        User user = buildUser("u@test.com", "user1");
        user.setActive(true);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Pass123!", user.getPassword())).thenReturn(true);
        when(jwtUtil.generateAccessToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh_token");

        AuthResponse result = authService.login(new LoginRequest("u@test.com", "Pass123!"));

        assertThat(result.getAccessToken()).isNotNull();
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        User user = buildUser("u@test.com", "user1");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("u@test.com", "Wrong!"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("INVALID_CREDENTIALS");
    }

    @Test
    void login_emailNotFound_throwsInvalidCredentials() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() ->
            authService.login(new LoginRequest("ghost@test.com", "Pass123!"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("INVALID_CREDENTIALS");
    }

    @Test
    void login_disabledAccount_throwsAccountDisabled() {
        User user = buildUser("u@test.com", "user1");
        user.setActive(false);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("u@test.com", "Pass123!"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("ACCOUNT_DISABLED");
    }

    @Test
    void login_googleAccount_throwsOauthAccount() {
        User user = buildUser("g@test.com", "google_user");
        user.setProvider(Provider.GOOGLE);
        when(userRepository.findByEmail("g@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("g@test.com", "any"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("OAUTH_ACCOUNT");
    }

    @Test
    void login_unverifiedEmail_stillSucceeds_returnsFlagFalse() {
        User user = buildUser("u@test.com", "user1");
        user.setEmailVerified(false);
        user.setActive(true);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(jwtUtil.generateAccessToken(any())).thenReturn("token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse result = authService.login(new LoginRequest("u@test.com", "Pass123!"));

        assertThat(result.getUser().isEmailVerified()).isFalse();
        assertThat(result.getAccessToken()).isNotNull(); // không bị chặn
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFY EMAIL
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void verifyEmail_validOtp_setsEmailVerifiedTrue() {
        User user = buildUser("v@test.com", "verify_user");
        UserOtp otp = buildOtp(user.getId(), "482910", OtpType.VERIFY_EMAIL, false, 10);
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));
        when(otpRepository.findActiveOtp(user.getId(), OtpType.VERIFY_EMAIL, any()))
            .thenReturn(Optional.of(otp));

        authService.verifyEmail(new VerifyOtpRequest("v@test.com", "482910"));

        assertThat(otp.isUsed()).isTrue();
        verify(userRepository).save(argThat(u -> u.isEmailVerified()));
    }

    @Test
    void verifyEmail_wrongOtpCode_throwsOtpInvalid() {
        User user = buildUser("v@test.com", "verify_user");
        UserOtp otp = buildOtp(user.getId(), "111111", OtpType.VERIFY_EMAIL, false, 10);
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));
        when(otpRepository.findActiveOtp(any(), any(), any())).thenReturn(Optional.of(otp));

        assertThatThrownBy(() ->
            authService.verifyEmail(new VerifyOtpRequest("v@test.com", "999999"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("OTP_INVALID");
    }

    @Test
    void verifyEmail_noActiveOtp_throwsOtpInvalid() {
        User user = buildUser("v@test.com", "verify_user");
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));
        when(otpRepository.findActiveOtp(any(), any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            authService.verifyEmail(new VerifyOtpRequest("v@test.com", "000000"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("OTP_INVALID");
    }

    @Test
    void verifyEmail_alreadyVerified_throwsEmailAlreadyVerified() {
        User user = buildUser("v@test.com", "verify_user");
        user.setEmailVerified(true);
        when(userRepository.findByEmail("v@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() ->
            authService.verifyEmail(new VerifyOtpRequest("v@test.com", "123456"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("EMAIL_ALREADY_VERIFIED");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REFRESH TOKEN
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void refresh_validToken_returnsNewAccessToken() {
        UUID userId = UUID.randomUUID();
        User user = buildUser("r@test.com", "ref_user");
        user.setId(userId);
        when(jwtUtil.validateToken("refresh_token")).thenReturn(true);
        when(jwtUtil.extractUserId("refresh_token")).thenReturn(userId);
        when(jwtUtil.extractTokenType("refresh_token")).thenReturn("REFRESH");
        when(redisService.get("refresh:" + userId)).thenReturn("stored_hash");
        when(jwtUtil.hashToken("refresh_token")).thenReturn("stored_hash");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(user)).thenReturn("new_access_token");

        RefreshResponse result = authService.refreshToken(new RefreshTokenRequest("refresh_token"));

        assertThat(result.getAccessToken()).isEqualTo("new_access_token");
    }

    @Test
    void refresh_invalidToken_throwsInvalidRefreshToken() {
        when(jwtUtil.validateToken("bad_token")).thenReturn(false);
        assertThatThrownBy(() ->
            authService.refreshToken(new RefreshTokenRequest("bad_token"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("INVALID_REFRESH_TOKEN");
    }

    @Test
    void refresh_tokenNotInRedis_throwsInvalidRefreshToken() {
        UUID userId = UUID.randomUUID();
        when(jwtUtil.validateToken("refresh_token")).thenReturn(true);
        when(jwtUtil.extractUserId("refresh_token")).thenReturn(userId);
        when(jwtUtil.extractTokenType("refresh_token")).thenReturn("REFRESH");
        when(redisService.get("refresh:" + userId)).thenReturn(null); // không có trong Redis

        assertThatThrownBy(() ->
            authService.refreshToken(new RefreshTokenRequest("refresh_token"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("INVALID_REFRESH_TOKEN");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void logout_validUser_deletesRefreshTokenFromRedis() {
        UUID userId = UUID.randomUUID();
        authService.logout(userId);
        verify(redisService).delete("refresh:" + userId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FORGOT / RESET PASSWORD
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void forgotPassword_existingLocalUser_sendsOtp() {
        User user = buildUser("fp@test.com", "fp_user");
        user.setProvider(Provider.LOCAL);
        when(userRepository.findByEmail("fp@test.com")).thenReturn(Optional.of(user));
        when(redisService.hasKey("ratelimit:otp:fp@test.com")).thenReturn(false);

        authService.forgotPassword(new ForgotPasswordRequest("fp@test.com"));

        verify(otpService).sendForgotPasswordOtp(user);
    }

    @Test
    void forgotPassword_nonExistingEmail_returnsSuccessSilently() {
        // Tránh user enumeration — không throw exception
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        assertThatNoException().isThrownBy(() ->
            authService.forgotPassword(new ForgotPasswordRequest("ghost@test.com"))
        );
        verify(otpService, never()).sendForgotPasswordOtp(any());
    }

    @Test
    void forgotPassword_rateLimited_throwsOtpRateLimit() {
        User user = buildUser("fp@test.com", "fp_user");
        when(userRepository.findByEmail("fp@test.com")).thenReturn(Optional.of(user));
        when(redisService.hasKey("ratelimit:otp:fp@test.com")).thenReturn(true);

        assertThatThrownBy(() ->
            authService.forgotPassword(new ForgotPasswordRequest("fp@test.com"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("OTP_RATE_LIMIT");
    }

    @Test
    void resetPassword_validOtp_updatesPasswordAndForcesLogout() {
        User user = buildUser("rp@test.com", "rp_user");
        UserOtp otp = buildOtp(user.getId(), "654321", OtpType.FORGOT_PASSWORD, false, 5);
        when(userRepository.findByEmail("rp@test.com")).thenReturn(Optional.of(user));
        when(otpRepository.findActiveOtp(user.getId(), OtpType.FORGOT_PASSWORD, any()))
            .thenReturn(Optional.of(otp));
        when(passwordEncoder.encode("NewPass456!")).thenReturn("new_hashed");

        authService.resetPassword(new ResetPasswordRequest("rp@test.com", "654321", "NewPass456!"));

        verify(userRepository).save(argThat(u -> u.getPassword().equals("new_hashed")));
        verify(redisService).delete("refresh:" + user.getId()); // force logout
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    User buildUser(String email, String username) {
        User u = new User();
        u.setId(UUID.randomUUID()); u.setEmail(email); u.setUsername(username);
        u.setPassword("hashed"); u.setProvider(Provider.LOCAL);
        u.setRole(Role.USER); u.setEmailVerified(false); u.setActive(true);
        return u;
    }
    UserOtp buildOtp(UUID userId, String code, OtpType type, boolean used, int minutesFromNow) {
        UserOtp o = new UserOtp();
        o.setUserId(userId); o.setOtpCode(code); o.setOtpType(type);
        o.setUsed(used); o.setExpiresAt(LocalDateTime.now().plusMinutes(minutesFromNow));
        return o;
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `AuthControllerTest`
```java
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean  AuthService authService;
    @MockBean  JwtUtil     jwtUtil;

    // ── Helper ────────────────────────────────────────────────────────────
    AuthResponse buildAuthResponse() {
        UserDto user = UserDto.builder()
            .id(UUID.randomUUID()).email("u@test.com")
            .username("user1").role("USER").emailVerified(false).build();
        return AuthResponse.builder()
            .user(user).accessToken("access").refreshToken("refresh").expiresIn(86400).build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/register
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void register_validInput_returns201() throws Exception {
        when(authService.register(any())).thenReturn(buildAuthResponse());

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"email":"u@test.com","username":"user1","password":"Pass123!"}
                """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("access"))
            .andExpect(jsonPath("$.data.user.email").value("u@test.com"));
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""{"username":"user1","password":"Pass123!"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void register_invalidEmailFormat_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"not-email","username":"user1","password":"Pass123!"}"""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        when(authService.register(any())).thenThrow(
            new BusinessException("EMAIL_ALREADY_EXISTS", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"dup@test.com","username":"user2","password":"Pass123!"}"""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/login
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void login_validCredentials_returns200WithTokens() throws Exception {
        when(authService.login(any())).thenReturn(buildAuthResponse());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","password":"Pass123!"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").exists())
            .andExpect(jsonPath("$.data.refreshToken").exists());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        when(authService.login(any())).thenThrow(
            new BusinessException("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","password":"Wrong"}"""))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void login_disabledAccount_returns403() throws Exception {
        when(authService.login(any())).thenThrow(
            new BusinessException("ACCOUNT_DISABLED", HttpStatus.FORBIDDEN));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","password":"Pass123!"}"""))
            .andExpect(status().isForbidden());
    }

    @Test
    void login_missingPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com"}"""))
            .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/verify-email
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void verifyEmail_validOtp_returns200() throws Exception {
        doNothing().when(authService).verifyEmail(any());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","otpCode":"482910"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void verifyEmail_invalidOtp_returns400() throws Exception {
        doThrow(new BusinessException("OTP_INVALID", HttpStatus.BAD_REQUEST))
            .when(authService).verifyEmail(any());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","otpCode":"000000"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("OTP_INVALID"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/refresh
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void refresh_validToken_returns200WithNewAccessToken() throws Exception {
        when(authService.refreshToken(any())).thenReturn(
            RefreshResponse.builder().accessToken("new_access").expiresIn(86400).build());

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(APPLICATION_JSON)
                .content("""{"refreshToken":"valid_refresh"}"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").value("new_access"));
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        when(authService.refreshToken(any())).thenThrow(
            new BusinessException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED));

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(APPLICATION_JSON)
                .content("""{"refreshToken":"bad"}"""))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/logout
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void logout_authenticated_returns204() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer valid_token"))
            .andExpect(status().isNoContent());
        verify(authService).logout(any());
    }

    @Test
    void logout_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /auth/me
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser(username = "user1")
    void getMe_authenticated_returns200WithProfile() throws Exception {
        UserDto dto = UserDto.builder().id(UUID.randomUUID()).email("u@test.com")
            .username("user1").role("USER").emailVerified(true).build();
        when(authService.getMe(any())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("user1"))
            .andExpect(jsonPath("$.data.emailVerified").value(true));
    }

    @Test
    void getMe_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/forgot-password
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void forgotPassword_anyEmail_alwaysReturns200() throws Exception {
        // Kể cả email không tồn tại cũng trả 200 (tránh enumeration)
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"anyone@test.com"}"""))
            .andExpect(status().isOk());
    }

    @Test
    void forgotPassword_rateLimited_returns429() throws Exception {
        doThrow(new BusinessException("OTP_RATE_LIMIT", HttpStatus.TOO_MANY_REQUESTS))
            .when(authService).forgotPassword(any());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com"}"""))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error.code").value("OTP_RATE_LIMIT"));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /auth/reset-password
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void resetPassword_validOtp_returns200() throws Exception {
        doNothing().when(authService).resetPassword(any());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","otpCode":"654321","newPassword":"NewPass456!"}"""))
            .andExpect(status().isOk());
    }

    @Test
    void resetPassword_invalidOtp_returns400() throws Exception {
        doThrow(new BusinessException("OTP_INVALID", HttpStatus.BAD_REQUEST))
            .when(authService).resetPassword(any());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                .contentType(APPLICATION_JSON)
                .content("""{"email":"u@test.com","otpCode":"000000","newPassword":"NewPass456!"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("OTP_INVALID"));
    }
}
```
