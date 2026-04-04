import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import type { UpdateProfileRequest, ChangePasswordRequest, ConfirmChangePasswordRequest } from "@/types/user.types";

export const USER_QUERY_KEYS = {
  profile: (id: string) => ["profile", id],
  history: (page: number) => ["history", page],
  animeHistory: (animeId: number) => ["history", "anime", animeId],
  bookmarks: (page: number) => ["bookmarks", page],
  bookmarkStatus: (animeId: number) => ["bookmarks", "status", animeId],
  ratingSummary: (animeId: number) => ["ratings", "summary", animeId],
  myRating: (animeId: number) => ["ratings", "me", animeId],
} as const;

export function useProfile(id: string) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(id),
    queryFn: () => userService.getProfile(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(data.id) });
      toast.success("Cập nhật hồ sơ thành công");
    },
    onError: () => {
      toast.error("Cập nhật hồ sơ thất bại");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: async () => {
      if (user) {
        // Gọi lại api getProfile để lấy thông tin mới (bao gồm avatarUrl mới)
        const profile = await userService.getProfile(user.id);
        // Cập nhật lại user trong authStore để UI (Header, Settings) thay đổi ngay lập tức
        updateUser(profile);
        
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(user.id) });
      }
      toast.success("Tải lên ảnh đại diện thành công");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Tải lên ảnh đại diện thất bại";
      toast.error(msg);
    },
  });
}

export function useRequestChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => userService.requestChangePassword(payload),
    onSuccess: () => {
      toast.success("Yêu cầu thành công. Vui lòng kiểm tra email.");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Yêu cầu thất bại";
      toast.error(message);
    },
  });
}

export function useConfirmChangePassword() {
  return useMutation({
    mutationFn: (payload: ConfirmChangePasswordRequest) => userService.confirmChangePassword(payload),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Xác nhận thất bại";
      toast.error(message);
    },
  });
}

export function useWatchHistory(page = 1) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.history(page),
    queryFn: () => userService.getWatchHistory(page),
  });
}

export function useBookmarks(page = 1) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.bookmarks(page),
    queryFn: () => userService.getBookmarks(page),
  });
}

export function useBookmarkStatus(animeId: number) {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: USER_QUERY_KEYS.bookmarkStatus(animeId),
    queryFn: () => userService.getBookmarkStatus(animeId),
    enabled: isLoggedIn && !!animeId,
  });
}

export function useToggleBookmark(animeId: number) {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  return useMutation({
    mutationFn: (isBookmarked: boolean) =>
      isBookmarked ? userService.removeBookmark(animeId) : userService.addBookmark(animeId),
    onMutate: async (isBookmarked) => {
      if (!isLoggedIn) {
        toast.error("Vui lòng đăng nhập để thực hiện hành động này");
        throw new Error("Unauthorized");
      }
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.bookmarkStatus(animeId) });
      const previousStatus = queryClient.getQueryData(USER_QUERY_KEYS.bookmarkStatus(animeId));
      queryClient.setQueryData(USER_QUERY_KEYS.bookmarkStatus(animeId), !isBookmarked);
      return { previousStatus };
    },
    onError: (_err, _newStatus, context: any) => {
      queryClient.setQueryData(USER_QUERY_KEYS.bookmarkStatus(animeId), context?.previousStatus);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.bookmarkStatus(animeId) });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useRatingSummary(animeId: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.ratingSummary(animeId),
    queryFn: () => userService.getRatingSummary(animeId),
    enabled: !!animeId,
  });
}

export function useMyRating(animeId: number) {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: USER_QUERY_KEYS.myRating(animeId),
    queryFn: () => userService.getMyRating(animeId),
    enabled: isLoggedIn && !!animeId,
  });
}

export function useRateAnime(animeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => userService.rateAnime(animeId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.ratingSummary(animeId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.myRating(animeId) });
      toast.success("Đánh giá thành công");
    },
  });
}
