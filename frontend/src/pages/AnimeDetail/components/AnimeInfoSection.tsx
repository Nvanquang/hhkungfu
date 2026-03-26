// Khu vực thông tin chính gồm poster, title, score, metadata, genre tags, action buttons và star rating — layout khác nhau giữa mobile và desktop.
import { useEffect, useState } from "react";
import { Bookmark, Crown, Play, Star } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Genre, Studio } from "@/types";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  animeId: number;
  slug: string;
  title: string;
  titleOther: string | null;
  thumbnailUrl?: string | null;
  hasVipContent?: boolean;
  malScore?: number | null;
  viewCount?: number | null;
  status?: string | null;
  type?: string | null;
  totalEpisodes?: number | null;
  year?: number | null;
  studios?: Studio[];
  genres?: Genre[] | null;
  isBookmarked?: boolean;
}

export function AnimeInfoSection({
  animeId, slug, title, titleOther, thumbnailUrl, hasVipContent,
  malScore, viewCount, status, type, totalEpisodes, year, studios, genres,
  isBookmarked: initialIsBookmarked,
}: Props) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const score = await userService.getMyRating(animeId);
        setUserRating(score);
      } catch (error) {
        console.error("Failed to fetch user rating:", error);
      }
    };
    fetchUserRating();
  }, [animeId]);

  const handleRate = async (score: number) => {
    try {
      await userService.rateAnime(animeId, score);
      setUserRating(score);
      toast.success("Đánh giá thành công");
    } catch (error) {
      // toast is already handled by apiClient interceptor if configured
    }
  };

  const statusBadgeClass = cn(
    "font-bold",
    status === "ONGOING" && "bg-green-500/15 text-green-600 dark:text-green-400",
    status === "COMPLETED" && "bg-muted text-muted-foreground",
    status === "UPCOMING" && "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  );
  const statusLabel =
    status === "ONGOING" ? "● ĐANG CHIẾU" :
      status === "COMPLETED" ? "✓ HOÀN THÀNH" : "◷ SẮP RA MẮT";

  const scorePercent = Math.min(100, Math.max(0, ((malScore ?? 0) / 10) * 100));

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await userService.removeBookmark(animeId);
        toast.success("Đã xóa khỏi danh sách bookmarks");
        setIsBookmarked(false);
      } else {
        await userService.addBookmark(animeId);
        toast.success("Đã thêm vào danh sách bookmarks");
        setIsBookmarked(true);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  return (
    <section className="flex flex-col md:flex-row gap-4 md:gap-8">

      {/* POSTER + MOBILE TITLE ROW */}
      <div className="flex gap-4 md:block shrink-0">
        <div className="relative w-28 h-40 md:w-48 md:h-72 shrink-0 rounded-lg md:rounded-xl overflow-hidden border border-border/10 bg-muted shadow-[0_8px_30px_rgb(0,0,0,0.6)] z-20">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs md:text-sm text-muted-foreground text-center p-2 font-medium">No Poster</div>
          )}
          {hasVipContent && (
            <div className="absolute top-1 left-1 md:top-2 md:left-2">
              <span className="inline-flex items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-purple-600 px-1.5 py-0.5 text-[10px] md:text-xs font-black text-white shadow-md">
                <Crown className="h-3 w-3" /> VIP
              </span>
            </div>
          )}
        </div>

        {/* Mobile title (beside poster) */}
        <div className="flex flex-col justify-end pb-1 md:hidden space-y-1.5 w-full">
          <div className="space-y-0.5 drop-shadow-md">
            <h1 className="text-xl font-black tracking-tight line-clamp-2 leading-tight drop-shadow-sm">{title}</h1>
            {titleOther && <p className="text-[11px] text-muted-foreground line-clamp-1">{titleOther}</p>}
          </div>
          <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground drop-shadow-sm">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            {malScore ?? "N/A"}
            <span className="text-muted-foreground font-normal text-[11px] ml-0.5">({(viewCount ?? 0).toLocaleString()} <span className="hidden sm:inline">lượt xem</span>)</span>
          </div>
          <div className="h-1.5 w-full max-w-[120px] rounded-full bg-border/50 overflow-hidden shadow-inner">
            <div className="h-full bg-primary" style={{ width: `${scorePercent}%` }} />
          </div>
          <Badge variant="secondary" className={cn("w-fit text-[10px] px-1.5 py-0 mt-1 border-transparent", statusBadgeClass)}>
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* DESKTOP CONTENT */}
      <div className="flex flex-col space-y-4 flex-1 md:pt-28">

        {/* Desktop title block */}
        <div className="hidden md:flex flex-col space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md text-foreground">{title}</h1>
            {titleOther && <p className="text-base text-muted-foreground">{titleOther}</p>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-foreground font-semibold bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border/50 shadow-sm">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              {malScore ?? "N/A"} / 10
              <span className="text-muted-foreground font-medium text-xs ml-1">({(viewCount ?? 0).toLocaleString()} lượt xem)</span>
            </span>
            <div className="h-2 w-32 rounded-full bg-border/50 overflow-hidden shadow-inner">
              <div className="h-full bg-primary" style={{ width: `${scorePercent}%` }} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
            <Badge variant="secondary" className={cn("hidden md:inline-flex", statusBadgeClass)}>
              {statusLabel}
            </Badge>
            <div className="flex items-center gap-3 text-foreground/80">
              <span>🎬 {type}</span>
              {totalEpisodes ? <span>📺 {totalEpisodes} Tập</span> : null}
              {year ? <span>📅 {year}</span> : null}
            </div>
          </div>

          {studios?.length ? (
            <div className="text-sm text-muted-foreground hidden md:flex items-center gap-1.5">
              <img src={studios[0].logoUrl} alt={studios[0].name} className="h-6 object-cover" />
              <span className="font-medium text-foreground/80">{studios.map(s => s.name).join(' · ')}</span>
            </div>
          ) : null}

          {genres?.length ? (
            <div className="text-sm flex flex-wrap gap-1.5 mt-1">
              {genres.map(g => (
                <span key={g.id} className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer border border-border/30">
                  {g.nameVi || g.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 md:pt-3">
          <Button size="lg" className="gap-2 w-full sm:w-auto font-bold shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={() => navigate(`/watch/${slug}/1`)}>
            <Play className="h-4 w-4 fill-current" /> ▶ Xem Tập 1
          </Button>
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "gap-2 w-full sm:w-auto font-medium shadow-sm transition-colors",
              isBookmarked ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20" : "hover:bg-muted/50"
            )}
            onClick={handleToggleBookmark}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current text-red-500")} />
            {isBookmarked ? "Đã Bookmark" : "Bookmark"}
          </Button>
        </div>

        <div className="pt-2 flex items-center justify-center md:justify-start gap-3 text-sm">
          <span className="font-medium text-foreground hidden md:inline">★ Đánh giá của bạn:</span>
          <div className="flex gap-[2px] cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Star
                key={i}
                onMouseEnter={() => setHoverRating(i)}
                onClick={() => handleRate(i)}
                className={cn(
                  "h-[22px] w-[22px] transition-all duration-150",
                  (hoverRating || userRating) >= i ? "fill-yellow-500 text-yellow-500 scale-[1.15]" : "text-muted-foreground/30 hover:text-yellow-500"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}