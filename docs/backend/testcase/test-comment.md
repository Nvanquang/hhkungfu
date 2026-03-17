# Test Cases — Module Comment
**Stack:** JUnit 5 · Mockito · Spring Boot Test · MockMvc
**Tầng:** Repository → Service → Controller
**Package:** `com.hhkungfu.comment`

---

## TẦNG 1 — REPOSITORY

### `CommentRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class CommentRepositoryTest {

    @Autowired CommentRepository     commentRepository;
    @Autowired CommentLikeRepository likeRepository;
    @Autowired UserRepository        userRepository;
    @Autowired EpisodeRepository     episodeRepository;
    @Autowired AnimeRepository       animeRepository;

    UUID user1Id, user2Id;
    Long episodeId;

    @BeforeEach
    void setup() {
        user1Id = userRepository.save(User.builder()
            .email("c1@test.com").username("c_user1").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        user2Id = userRepository.save(User.builder()
            .email("c2@test.com").username("c_user2").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        Long animeId = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-cm").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build()).getId();

        episodeId = episodeRepository.save(Episode.builder()
            .animeId(animeId).episodeNumber((short) 1)
            .videoStatus(READY).isVipOnly(false).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).build()).getId();
    }

    Comment buildComment(UUID userId, Long parentId, String content) {
        return Comment.builder()
            .userId(userId).episodeId(episodeId).parentId(parentId)
            .content(content).likeCount(0).isPinned(false).build();
    }

    // ── findRootComments (parent_id IS NULL) ──────────────────────────────
    @Test
    void findRootComments_returnsOnlyRootNotDeleted() {
        Comment root  = commentRepository.save(buildComment(user1Id, null, "Root comment"));
        Comment reply = commentRepository.save(buildComment(user1Id, root.getId(), "Reply"));
        Comment deleted = buildComment(user2Id, null, "Deleted");
        deleted.setDeletedAt(LocalDateTime.now());
        commentRepository.save(deleted);

        Page<Comment> result = commentRepository.findRootByEpisodeId(
            episodeId, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(root.getId());
    }

    @Test
    void findRootComments_pinnedFirst() {
        commentRepository.save(buildComment(user1Id, null, "Normal 1"));
        commentRepository.save(buildComment(user1Id, null, "Normal 2"));
        Comment pinned = buildComment(user2Id, null, "Pinned");
        pinned.setPinned(true);
        commentRepository.save(pinned);

        Page<Comment> result = commentRepository.findRootByEpisodeId(
            episodeId, PageRequest.of(0, 10));

        assertThat(result.getContent().get(0).isPinned()).isTrue();
    }

    // ── findReplies ───────────────────────────────────────────────────────
    @Test
    void findReplies_returnsOnlyChildrenOfParent() {
        Comment root1 = commentRepository.save(buildComment(user1Id, null, "Root 1"));
        Comment root2 = commentRepository.save(buildComment(user1Id, null, "Root 2"));
        commentRepository.save(buildComment(user2Id, root1.getId(), "Reply to root1"));
        commentRepository.save(buildComment(user2Id, root2.getId(), "Reply to root2"));

        Page<Comment> replies = commentRepository.findRepliesByParentId(
            root1.getId(), PageRequest.of(0, 10));

        assertThat(replies.getContent()).hasSize(1);
        assertThat(replies.getContent().get(0).getParentId()).isEqualTo(root1.getId());
    }

    @Test
    void findReplies_excludesSoftDeleted() {
        Comment root = commentRepository.save(buildComment(user1Id, null, "Root"));
        Comment reply = buildComment(user2Id, root.getId(), "Deleted reply");
        reply.setDeletedAt(LocalDateTime.now());
        commentRepository.save(reply);

        Page<Comment> replies = commentRepository.findRepliesByParentId(
            root.getId(), PageRequest.of(0, 10));

        assertThat(replies.getContent()).isEmpty();
    }

    // ── countReplies ──────────────────────────────────────────────────────
    @Test
    void countReplies_returnsCorrectCount() {
        Comment root = commentRepository.save(buildComment(user1Id, null, "Root"));
        commentRepository.save(buildComment(user1Id, root.getId(), "Reply 1"));
        commentRepository.save(buildComment(user2Id, root.getId(), "Reply 2"));

        int count = commentRepository.countRepliesByParentId(root.getId());
        assertThat(count).isEqualTo(2);
    }

    // ── soft delete ───────────────────────────────────────────────────────
    @Test
    void softDelete_setsDeletedAt_notReturnedInQuery() {
        Comment comment = commentRepository.save(buildComment(user1Id, null, "To delete"));
        commentRepository.softDelete(comment.getId(), LocalDateTime.now());

        Page<Comment> result = commentRepository.findRootByEpisodeId(
            episodeId, PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }
}
```

---

### `CommentLikeRepositoryTest`
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class CommentLikeRepositoryTest {

    @Autowired CommentLikeRepository likeRepository;
    @Autowired CommentRepository     commentRepository;
    @Autowired UserRepository        userRepository;
    @Autowired EpisodeRepository     episodeRepository;
    @Autowired AnimeRepository       animeRepository;

    UUID user1Id, user2Id;
    Long commentId;

    @BeforeEach
    void setup() {
        user1Id = userRepository.save(User.builder()
            .email("l1@test.com").username("l_user1").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        user2Id = userRepository.save(User.builder()
            .email("l2@test.com").username("l_user2").password("hash")
            .provider(Provider.LOCAL).role(Role.USER)
            .emailVerified(true).isActive(true).build()).getId();

        Long animeId = animeRepository.save(Anime.builder()
            .title("JJK").slug("jjk-lk").status(ONGOING).type(TV)
            .viewCount(0L).isFeatured(false).hasVipContent(false).build()).getId();

        Long epId = episodeRepository.save(Episode.builder()
            .animeId(animeId).episodeNumber((short) 1)
            .videoStatus(READY).isVipOnly(false).viewCount(0L)
            .hasVietsub(false).hasEngsub(false).build()).getId();

        commentId = commentRepository.save(Comment.builder()
            .userId(user1Id).episodeId(epId).content("Test comment")
            .likeCount(0).isPinned(false).build()).getId();
    }

    // ── existsByUserIdAndCommentId ─────────────────────────────────────────
    @Test
    void existsByUserIdAndCommentId_liked_returnsTrue() {
        likeRepository.save(CommentLike.builder().userId(user1Id).commentId(commentId).build());
        assertThat(likeRepository.existsByUserIdAndCommentId(user1Id, commentId)).isTrue();
    }

    @Test
    void existsByUserIdAndCommentId_notLiked_returnsFalse() {
        assertThat(likeRepository.existsByUserIdAndCommentId(user2Id, commentId)).isFalse();
    }

    // ── deleteByUserIdAndCommentId ─────────────────────────────────────────
    @Test
    void deleteByUserIdAndCommentId_removesLike() {
        likeRepository.save(CommentLike.builder().userId(user1Id).commentId(commentId).build());
        likeRepository.deleteByUserIdAndCommentId(user1Id, commentId);
        assertThat(likeRepository.existsByUserIdAndCommentId(user1Id, commentId)).isFalse();
    }

    // ── primary key unique constraint ─────────────────────────────────────
    @Test
    void save_duplicateLike_throwsConstraintViolation() {
        likeRepository.save(CommentLike.builder().userId(user1Id).commentId(commentId).build());
        assertThatThrownBy(() ->
            likeRepository.saveAndFlush(
                CommentLike.builder().userId(user1Id).commentId(commentId).build())
        ).isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

---

## TẦNG 2 — SERVICE

### `CommentServiceTest`
```java
@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock CommentRepository     commentRepository;
    @Mock CommentLikeRepository likeRepository;
    @Mock EpisodeRepository     episodeRepository;

    @InjectMocks CommentService commentService;

    UUID  user1Id   = UUID.randomUUID();
    UUID  user2Id   = UUID.randomUUID();
    Long  episodeId = 101L;
    Long  commentId = 1L;

    Comment buildComment(Long id, UUID userId, Long parentId) {
        Comment c = new Comment();
        c.setId(id); c.setUserId(userId); c.setEpisodeId(episodeId);
        c.setParentId(parentId); c.setContent("Test"); c.setLikeCount(0);
        return c;
    }

    Episode buildEpisode() {
        Episode e = new Episode(); e.setId(episodeId); return e;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // createComment
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void createComment_rootComment_savesWithNullParent() {
        when(episodeRepository.findByIdAndDeletedAtIsNull(episodeId))
            .thenReturn(Optional.of(buildEpisode()));
        Comment saved = buildComment(commentId, user1Id, null);
        when(commentRepository.save(any())).thenReturn(saved);

        CommentCreateRequest req = new CommentCreateRequest("Root comment", null);
        CommentDto result = commentService.createComment(episodeId, user1Id, req);

        assertThat(result).isNotNull();
        verify(commentRepository).save(argThat(c -> c.getParentId() == null));
    }

    @Test
    void createComment_reply_savesWithParentId() {
        when(episodeRepository.findByIdAndDeletedAtIsNull(episodeId))
            .thenReturn(Optional.of(buildEpisode()));
        Comment parent = buildComment(commentId, user2Id, null); // root comment
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(parent));
        Comment saved = buildComment(2L, user1Id, commentId);
        when(commentRepository.save(any())).thenReturn(saved);

        CommentCreateRequest req = new CommentCreateRequest("Reply text", commentId);
        commentService.createComment(episodeId, user1Id, req);

        verify(commentRepository).save(argThat(c -> c.getParentId().equals(commentId)));
    }

    @Test
    void createComment_nestedReply_throwsNestedReplyNotAllowed() {
        // parent đã là reply (có parentId != null) → không cho reply of reply
        when(episodeRepository.findByIdAndDeletedAtIsNull(episodeId))
            .thenReturn(Optional.of(buildEpisode()));
        Comment parent = buildComment(commentId, user2Id, 999L); // parent là reply
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(parent));

        CommentCreateRequest req = new CommentCreateRequest("Nested reply", commentId);

        assertThatThrownBy(() -> commentService.createComment(episodeId, user1Id, req))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("NESTED_REPLY_NOT_ALLOWED");
    }

    @Test
    void createComment_episodeNotFound_throwsEpisodeNotFound() {
        when(episodeRepository.findByIdAndDeletedAtIsNull(episodeId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            commentService.createComment(episodeId, user1Id,
                new CommentCreateRequest("text", null))
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("EPISODE_NOT_FOUND");
    }

    @Test
    void createComment_parentCommentNotFound_throwsCommentNotFound() {
        when(episodeRepository.findByIdAndDeletedAtIsNull(episodeId))
            .thenReturn(Optional.of(buildEpisode()));
        when(commentRepository.findByIdAndDeletedAtIsNull(999L))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            commentService.createComment(episodeId, user1Id,
                new CommentCreateRequest("text", 999L))
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("COMMENT_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // updateComment
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void updateComment_ownerUpdates_updatesContent() {
        Comment comment = buildComment(commentId, user1Id, null);
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));
        when(commentRepository.save(any())).thenReturn(comment);

        CommentUpdateRequest req = new CommentUpdateRequest("Updated content");
        commentService.updateComment(commentId, user1Id, req);

        verify(commentRepository).save(argThat(c -> c.getContent().equals("Updated content")));
    }

    @Test
    void updateComment_nonOwner_throwsForbidden() {
        Comment comment = buildComment(commentId, user1Id, null); // owner = user1
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));

        assertThatThrownBy(() ->
            commentService.updateComment(commentId, user2Id, // user2 không phải owner
                new CommentUpdateRequest("Hijack"))
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("FORBIDDEN");
    }

    @Test
    void updateComment_commentNotFound_throwsCommentNotFound() {
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            commentService.updateComment(commentId, user1Id, new CommentUpdateRequest("x"))
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("COMMENT_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // deleteComment
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void deleteComment_ownerDeletes_softDeletes() {
        Comment comment = buildComment(commentId, user1Id, null);
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));

        commentService.deleteComment(commentId, user1Id, Role.USER);

        verify(commentRepository).softDelete(eq(commentId), any(LocalDateTime.class));
    }

    @Test
    void deleteComment_adminDeletes_softDeletesAnyComment() {
        Comment comment = buildComment(commentId, user1Id, null); // owner = user1
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));

        // user2 là ADMIN → được xóa
        commentService.deleteComment(commentId, user2Id, Role.ADMIN);

        verify(commentRepository).softDelete(eq(commentId), any());
    }

    @Test
    void deleteComment_nonOwnerNonAdmin_throwsForbidden() {
        Comment comment = buildComment(commentId, user1Id, null);
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));

        assertThatThrownBy(() ->
            commentService.deleteComment(commentId, user2Id, Role.USER)
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("FORBIDDEN");
    }

    @Test
    void deleteComment_notFound_throwsCommentNotFound() {
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            commentService.deleteComment(commentId, user1Id, Role.USER)
        ).isInstanceOf(ResourceNotFoundException.class)
         .hasMessageContaining("COMMENT_NOT_FOUND");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // toggleLike
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void toggleLike_notYetLiked_addsLikeAndReturnsTrue() {
        Comment comment = buildComment(commentId, user2Id, null);
        comment.setLikeCount(5);
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));
        when(likeRepository.existsByUserIdAndCommentId(user1Id, commentId)).thenReturn(false);
        when(commentRepository.save(any())).thenReturn(comment);

        CommentLikeResponse result = commentService.toggleLike(commentId, user1Id);

        assertThat(result.isLiked()).isTrue();
        assertThat(result.getLikeCount()).isEqualTo(6);
        verify(likeRepository).save(any());
    }

    @Test
    void toggleLike_alreadyLiked_removesLikeAndReturnsFalse() {
        Comment comment = buildComment(commentId, user2Id, null);
        comment.setLikeCount(5);
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.of(comment));
        when(likeRepository.existsByUserIdAndCommentId(user1Id, commentId)).thenReturn(true);
        when(commentRepository.save(any())).thenReturn(comment);

        CommentLikeResponse result = commentService.toggleLike(commentId, user1Id);

        assertThat(result.isLiked()).isFalse();
        assertThat(result.getLikeCount()).isEqualTo(4);
        verify(likeRepository).deleteByUserIdAndCommentId(user1Id, commentId);
    }

    @Test
    void toggleLike_commentNotFound_throwsCommentNotFound() {
        when(commentRepository.findByIdAndDeletedAtIsNull(commentId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.toggleLike(commentId, user1Id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("COMMENT_NOT_FOUND");
    }
}
```

---

## TẦNG 3 — CONTROLLER

### `CommentControllerTest`
```java
@WebMvcTest(CommentController.class)
@Import(SecurityConfig.class)
class CommentControllerTest {

    @Autowired MockMvc         mockMvc;
    @Autowired ObjectMapper    objectMapper;
    @MockBean  CommentService  commentService;
    @MockBean  JwtUtil         jwtUtil;

    CommentDto buildCommentDto(Long id, boolean pinned) {
        return CommentDto.builder()
            .id(id).content("Test comment").likeCount(5)
            .isPinned(pinned).replyCount(2).isLikedByMe(false)
            .user(UserSummaryDto.builder().id(UUID.randomUUID()).username("user1").build())
            .createdAt(LocalDateTime.now().toString()).build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /episodes/:episodeId/comments
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void listComments_returns200WithPagedComments() throws Exception {
        PageResponse<CommentDto> page = new PageResponse<>(
            List.of(buildCommentDto(1L, true), buildCommentDto(2L, false)),
            1, 20, 2L, 1);
        when(commentService.listComments(eq(101L), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/episodes/101/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items").isArray())
            .andExpect(jsonPath("$.data.items.length()").value(2))
            .andExpect(jsonPath("$.data.items[0].isPinned").value(true))  // pinned trước
            .andExpect(jsonPath("$.data.items[1].isPinned").value(false));
    }

    @Test
    void listComments_noAuth_returns200() throws Exception {
        // Không cần đăng nhập
        when(commentService.listComments(eq(101L), any(), isNull()))
            .thenReturn(new PageResponse<>(List.of(), 1, 20, 0L, 0));

        mockMvc.perform(get("/api/v1/episodes/101/comments"))
            .andExpect(status().isOk());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /comments/:commentId/replies
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    void listReplies_existingParent_returns200() throws Exception {
        PageResponse<CommentDto> page = new PageResponse<>(
            List.of(buildCommentDto(10L, false)), 1, 20, 1L, 1);
        when(commentService.listReplies(eq(1L), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/comments/1/replies"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    void listReplies_notFound_returns404() throws Exception {
        when(commentService.listReplies(eq(999L), any()))
            .thenThrow(new ResourceNotFoundException("COMMENT_NOT_FOUND", "Not found"));

        mockMvc.perform(get("/api/v1/comments/999/replies"))
            .andExpect(status().isNotFound());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /episodes/:episodeId/comments
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void createComment_rootComment_returns201() throws Exception {
        CommentDto created = buildCommentDto(1L, false);
        when(commentService.createComment(eq(101L), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/episodes/101/comments")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Tập này hay quá!","parentId":null}"""))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.content").value("Test comment"));
    }

    @Test
    @WithMockUser
    void createComment_reply_returns201WithParentId() throws Exception {
        CommentDto created = buildCommentDto(10L, false);
        when(commentService.createComment(eq(101L), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/episodes/101/comments")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Reply text","parentId":1}"""))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser
    void createComment_nestedReply_returns400() throws Exception {
        when(commentService.createComment(eq(101L), any(), any()))
            .thenThrow(new BusinessException("NESTED_REPLY_NOT_ALLOWED", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/v1/episodes/101/comments")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Nested reply","parentId":10}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("NESTED_REPLY_NOT_ALLOWED"));
    }

    @Test
    @WithMockUser
    void createComment_emptyContent_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/episodes/101/comments")
                .contentType(APPLICATION_JSON)
                .content("""{"content":""}"""))  // content rỗng
            .andExpect(status().isBadRequest());
    }

    @Test
    void createComment_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/episodes/101/comments")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Test"}"""))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATCH /comments/:id
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void updateComment_ownerUpdates_returns200() throws Exception {
        CommentDto updated = buildCommentDto(1L, false);
        when(commentService.updateComment(eq(1L), any(), any())).thenReturn(updated);

        mockMvc.perform(patch("/api/v1/comments/1")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Updated content"}"""))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void updateComment_nonOwner_returns403() throws Exception {
        when(commentService.updateComment(eq(1L), any(), any()))
            .thenThrow(new BusinessException("FORBIDDEN", HttpStatus.FORBIDDEN));

        mockMvc.perform(patch("/api/v1/comments/1")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"Hijack"}"""))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser
    void updateComment_missingContent_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/comments/1")
                .contentType(APPLICATION_JSON)
                .content("""{}"""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void updateComment_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/comments/1")
                .contentType(APPLICATION_JSON)
                .content("""{"content":"x"}"""))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /comments/:id
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void deleteComment_ownerDeletes_returns204() throws Exception {
        doNothing().when(commentService).deleteComment(eq(1L), any(), any());

        mockMvc.perform(delete("/api/v1/comments/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void deleteComment_nonOwnerNonAdmin_returns403() throws Exception {
        doThrow(new BusinessException("FORBIDDEN", HttpStatus.FORBIDDEN))
            .when(commentService).deleteComment(eq(1L), any(), any());

        mockMvc.perform(delete("/api/v1/comments/1"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void deleteComment_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("COMMENT_NOT_FOUND", "Not found"))
            .when(commentService).deleteComment(eq(999L), any(), any());

        mockMvc.perform(delete("/api/v1/comments/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteComment_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/comments/1"))
            .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /comments/:id/like
    // ═══════════════════════════════════════════════════════════════════════

    @Test
    @WithMockUser
    void toggleLike_notYetLiked_returns200WithLikedTrue() throws Exception {
        CommentLikeResponse resp = CommentLikeResponse.builder()
            .liked(true).likeCount(6).build();
        when(commentService.toggleLike(eq(1L), any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/comments/1/like"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.liked").value(true))
            .andExpect(jsonPath("$.data.likeCount").value(6));
    }

    @Test
    @WithMockUser
    void toggleLike_alreadyLiked_returns200WithLikedFalse() throws Exception {
        CommentLikeResponse resp = CommentLikeResponse.builder()
            .liked(false).likeCount(4).build();
        when(commentService.toggleLike(eq(1L), any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/comments/1/like"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.liked").value(false))
            .andExpect(jsonPath("$.data.likeCount").value(4));
    }

    @Test
    @WithMockUser
    void toggleLike_commentNotFound_returns404() throws Exception {
        when(commentService.toggleLike(eq(999L), any()))
            .thenThrow(new ResourceNotFoundException("COMMENT_NOT_FOUND", "Not found"));

        mockMvc.perform(post("/api/v1/comments/999/like"))
            .andExpect(status().isNotFound());
    }

    @Test
    void toggleLike_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/comments/1/like"))
            .andExpect(status().isUnauthorized());
    }
}
```
