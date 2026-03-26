// Tab "Tập phim": thanh filter sort/lọc/tìm kiếm và grid các nút tập với trạng thái watched, watching, locked.
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Play, Lock, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimeEpisodes } from "../../hooks/useAnimeEpisodes";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface Props {
  animeId: number;
  animeSlug: string;
  totalEpisodeCount: number;
}

export function EpisodesTab({ animeId, animeSlug, totalEpisodeCount }: Props) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");

  // Use React Query hook for fetching
  const { data, isLoading, isError, error } = useAnimeEpisodes(animeId, { limit: 100 });
  const episodes = data?.items ?? [];
  const { user } = useAuthStore();
  const isUserVip = user?.isVip ?? false;

  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    // Get watched status for all episodes to use in filtering
    const episodeStats = result.map(ep => {
      const savedProgress = localStorage.getItem(`progress_${ep.id}`);
      const progressSeconds = savedProgress ? parseInt(savedProgress) : 0;
      const isWatched = ep.durationSeconds && ep.durationSeconds > 0 
        ? progressSeconds / ep.durationSeconds > 0.9 
        : false;
      return { id: ep.id, isWatched };
    });

    // Search
    if (search) {
      result = result.filter(ep => 
        ep.episodeNumber.toString().includes(search) || 
        (ep.title && ep.title.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter
    if (filter === "watched") {
      result = result.filter(ep => episodeStats.find(s => s.id === ep.id)?.isWatched);
    } else if (filter === "unwatched") {
      result = result.filter(ep => !episodeStats.find(s => s.id === ep.id)?.isWatched);
    }

    // Sort
    result.sort((a, b) => {
      return sortOrder === "asc"
        ? a.episodeNumber - b.episodeNumber
        : b.episodeNumber - a.episodeNumber;
    });

    return result;
  }, [episodes, search, sortOrder, filter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-medium">Đang tải danh sách tập phim...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive border border-destructive/20 rounded-xl bg-destructive/5">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p className="text-sm font-semibold">Không thể tải danh sách tập phim</p>
        <p className="text-xs mt-1 opacity-80">{(error as Error)?.message || "Đã có lỗi xảy ra"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-1/2 sm:w-auto gap-2">
            <span className="text-sm text-muted-foreground font-medium hidden sm:inline shrink-0">Sắp xếp:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="h-9 px-3 py-1 w-full sm:w-auto rounded-md bg-muted/60 border border-border/40 text-sm font-medium focus:ring-1 focus:ring-primary outline-none hover:bg-muted transition-colors appearance-none cursor-pointer"
            >
              <option value="desc">Mới nhất ▾</option>
              <option value="asc">Cũ nhất ▾</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-1/2 sm:w-auto gap-2">
            <span className="text-sm text-muted-foreground font-medium hidden sm:inline shrink-0">Lọc:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="h-9 px-3 py-1 w-full sm:w-auto rounded-md bg-muted/60 border border-border/40 text-sm font-medium focus:ring-1 focus:ring-primary outline-none hover:bg-muted transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tất cả ▾</option>
              <option value="unwatched">Chưa xem</option>
              <option value="watched">Đã xem</option>
            </select>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm tập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/30 border border-border/50 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
      </div>

      {/* Episode grid */}
      <div className="rounded-xl border border-border/40 p-4 md:p-6 bg-muted/10 shadow-sm">
        {filteredEpisodes.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-2.5 md:gap-3">
            {filteredEpisodes.map((ep) => {
              const num = ep.episodeNumber;
              
              // Get watch progress from localStorage
              const savedProgress = localStorage.getItem(`progress_${ep.id}`);
              const progressSeconds = savedProgress ? parseInt(savedProgress) : 0;
              
              const isWatched = ep.durationSeconds && ep.durationSeconds > 0 
                ? progressSeconds / ep.durationSeconds > 0.9 
                : false;
              
              const isWatching = progressSeconds > 0 && !isWatched;
              const progressPercent = ep.durationSeconds && ep.durationSeconds > 0 
                ? Math.min((progressSeconds / ep.durationSeconds) * 100, 100)
                : 0;

              const isLocked = ep.isVipOnly && !isUserVip;

              return (
                <Link
                  key={ep.id}
                  to={isLocked ? "#" : `/watch/${animeSlug}/${num}`}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      toast.error("Yêu cầu tài khoản VIP", {
                        description: `Tập ${num} dành riêng cho thành viên VIP`,
                        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                      });
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center p-2 h-11 text-[13px] md:text-sm font-semibold rounded-md border transition-all duration-200 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isLocked ? "bg-muted/40 text-muted-foreground border-border/40 cursor-not-allowed opacity-70" :
                      isWatching ? "bg-primary/5 text-primary border-primary/50 shadow-sm" :
                        isWatched ? "bg-card text-muted-foreground border-border hover:border-foreground/30 opacity-60 hover:opacity-100" :
                          "bg-card text-foreground border-border hover:bg-muted hover:border-muted-foreground/30 hover:-translate-y-0.5 shadow-sm hover:shadow"
                  )}
                  title={`Tập ${num} ${ep.title ? `— ${ep.title}` : ""}`}
                >
                  <span className="flex items-center gap-1.5 z-10 transition-transform">
                    {isLocked && <Lock className="w-3.5 h-3.5 -ml-1 text-muted-foreground" />}
                    {isWatching && <Play className="w-3 h-3 fill-current -ml-1" />}
                    {!(isLocked || isWatching) && "Tập "}
                    {num}
                  </span>
                  {isWatched && <Check className="absolute top-1 right-1 w-2.5 h-2.5 text-green-500 z-10" />}
                  {isWatching && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary/20">
                      <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Không tìm thấy tập phim nào.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-medium px-1">
        * Tổng số {totalEpisodeCount} tập. Danh sách được cập nhật liên tục.
      </p>
    </div>
  );
}