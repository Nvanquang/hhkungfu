import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MoreVertical,
  Pin,
  Trash2,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Heart,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { animeService } from "@/services/animeService";
import type { AdminCommentListData } from "@/types/admin.types";
import type { AnimeSummary } from "@/types/anime.types";
import { LightPanel } from "@/pages/admin/shared/components/LightPanel";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export function CommentTab() {
  const [data, setData] = useState<AdminCommentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [animeId, setAnimeId] = useState<string>("");
  const [type, setType] = useState<string>("all");
  const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined);

  const [animes, setAnimes] = useState<AnimeSummary[]>([]);

  const fetchAnimes = async () => {
    try {
      const res = await animeService.getAnimes({ limit: 100 });
      setAnimes(res.data.items);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listComments({
        page,
        limit: 15,
        search: search || undefined,
        animeId: animeId ? parseInt(animeId) : undefined,
        type: type === "all" || type === "pinned" ? undefined : type,
        isDeleted: isDeleted,
        // Backend handles "pinned" filter if we send type="pinned" but let's check
      });

      // If client-side "pinned" filter is active, we might need special handling
      // depending on how the backend implemented it.
      // Assuming backend supports type="pinned"
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách bình luận");
    } finally {
      setLoading(false);
    }
  }, [page, search, animeId, type, isDeleted]);

  useEffect(() => {
    fetchAnimes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComments();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchComments]);

  const handleTogglePin = async (id: number) => {
    try {
      await adminService.togglePinComment(id);
      toast.success("Đã cập nhật trạng thái ghim");
      fetchComments();
    } catch (error) {
      toast.error("Thao tác thất bại");
    }
  };

  const confirmDelete = async (comment: any) => {
    const message = `Bạn có chắc chắn muốn xóa bình luận của ${comment.user.username}?\n\n"${comment.content}"\n\nHành động này cũng sẽ ẩn tất cả ${comment.replyCount} phản hồi liên quan.`;
    if (window.confirm(message)) {
      try {
        await adminService.deleteCommentAdmin(comment.id);
        toast.success("Đã ẩn bình luận");
        fetchComments();
      } catch (error) {
        toast.error("Thao tác thất bại");
      }
    }
  };

  const resetFilters = () => {
    setSearch("");
    setAnimeId("");
    setType("all");
    setIsDeleted(undefined);
    setPage(1);
  };

  const FILTERS = [
    { label: "Tất cả", value: "all", deleted: undefined },
    { label: "Root", value: "root", deleted: false },
    { label: "Reply", value: "reply", deleted: false },
    { label: "Đã xóa", value: "all", deleted: true },
    { label: "Được ghim", value: "pinned", deleted: false },
  ];

  return (
    <div className="space-y-6">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm nội dung, username..."
              className="pl-10 h-10 border-slate-200 bg-white rounded-xl focus:ring-blue-500/20"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            value={animeId}
            onChange={(e) => { setAnimeId(e.target.value); setPage(1); }}
            className="h-10 px-3 pl-2 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Anime: Tất cả</option>
            {animes.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="h-10 px-3 pl-2 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Loại: Tất cả</option>
            <option value="root">Loại: Root</option>
            <option value="reply">Loại: Reply</option>
            <option value="pinned">Loại: Được ghim</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {data && (
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
              Tổng: {data.pagination.total.toLocaleString()} bình luận
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-400 hover:text-blue-600">
            <X className="h-4 w-4 mr-1" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Filter Chips Layer */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Bộ lọc nhanh:</span>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {FILTERS.map((f) => {
            const isActive = type === f.value && isDeleted === f.deleted;
            return (
              <button
                key={f.label}
                onClick={() => { setType(f.value); setIsDeleted(f.deleted); setPage(1); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Area */}
      <LightPanel className="overflow-hidden border-slate-100 p-0 shadow-xl shadow-slate-200/40 rounded-2xl ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 border-b border-slate-100">Người dùng</th>
                <th className="px-6 py-4 border-b border-slate-100 min-w-[300px]">Nội dung</th>
                <th className="px-6 py-4 border-b border-slate-100">Tập phim</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    Lượt <Heart className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-10 bg-slate-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <MessageSquare className="h-10 w-10 opacity-20" />
                      <p className="text-lg font-medium">Không tìm thấy bình luận nào</p>
                      <Button variant="link" onClick={resetFilters}>Xóa bộ lọc</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map((comment) => (
                  <tr
                    key={comment.id}
                    className={cn(
                      "group transition-all duration-200",
                      comment.isPinned ? "bg-blue-50/50 border-l-4 border-blue-600" : "hover:bg-slate-50/80",
                      comment.deletedAt && "bg-red-50/30 opacity-70"
                    )}
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        {comment.user.avatarUrl ? (
                          <img
                            src={comment.user.avatarUrl}
                            className="h-9 w-9 rounded-full bg-slate-200 object-cover border-2 border-white shadow-sm"
                            alt={comment.user.username}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 border-2 border-white shadow-sm">
                            {comment.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate">{comment.user.username}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {comment.user.id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-lg">
                      <div className={cn(
                        "text-slate-700 leading-relaxed",
                        comment.deletedAt && "line-through text-slate-400"
                      )}>
                        {comment.isPinned && <Pin className="inline-block h-3.5 w-3.5 mr-2 text-blue-600 fill-current" />}
                        {comment.content}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                        {comment.replyCount > 0 && !comment.parentId && (
                          <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            └─ {comment.replyCount} câu trả lời
                          </span>
                        )}
                        {comment.deletedAt && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Đã xóa</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{comment.animeName}</span>
                        <span className="text-slate-500 text-xs mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded">Tập {comment.episodeNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-center font-bold text-slate-600">
                      {comment.likeCount}
                    </td>
                    <td className="pl-16 pr-1 py-4 text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border border-slate-200 bg-white shadow-2xl z-50">
                          {!comment.deletedAt ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleTogglePin(comment.id)}
                                className="rounded-lg py-2.5 cursor-pointer text-slate-700 font-medium focus:bg-blue-50 focus:text-blue-600"
                              >
                                <Pin className="mr-3 h-4 w-4" />
                                {comment.isPinned ? "Bỏ ghim bình luận" : "Ghim lên đầu tập"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/watch/${comment.id}`, '_blank')}
                                className="rounded-lg py-2.5 cursor-pointer text-slate-700 font-medium focus:bg-blue-50 focus:text-blue-600"
                              >
                                <ExternalLink className="mr-3 h-4 w-4" />
                                Xem tập phim liên quan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                className="rounded-lg py-2.5 text-red-600 font-bold cursor-pointer focus:bg-red-50 focus:text-red-600"
                                onClick={() => confirmDelete(comment)}
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Xóa bình luận
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() => window.open(`/watch/${comment.id}`, '_blank')}
                                className="rounded-lg py-2.5 cursor-pointer text-slate-700 font-medium focus:bg-blue-50 focus:text-blue-600"
                              >
                                <ExternalLink className="mr-3 h-4 w-4" />
                                Xem tập phim liên quan
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled className="opacity-50 grayscale cursor-not-allowed py-2.5 font-medium italic text-slate-400">
                                (Đã xóa - Không thể khôi phục)
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <span className="text-xs font-medium text-slate-400">
              Trang {page} / {data.pagination.totalPages} — Hiển thị {data.items.length} của {data.pagination.total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="size-4 mr-1" /> Trước
              </Button>

              <div className="hidden sm:flex items-center gap-1 mx-2">
                {[...Array(data.pagination.totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Show current and nearby pages
                  if (p === 1 || p === data.pagination.totalPages || Math.abs(p - page) <= 1) {
                    return (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-9 w-9 p-0 rounded-xl font-bold",
                          page === p ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-200"
                        )}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  }
                  if (Math.abs(p - page) === 2) return <span key={p} className="px-1 text-slate-300">...</span>;
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Sau <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </LightPanel>

    </div>
  );
}
