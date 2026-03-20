// Hero banner nổi bật phía đầu trang, hiển thị ảnh nền, thông tin anime, nút CTA và dot indicator để chuyển slide.
import { useNavigate } from "react-router-dom";
import { Flame, Play, Plus } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AnimeSummary } from "@/types";

interface Props {
  featured: AnimeSummary[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  isLoading: boolean;
  isError: boolean;
}

// Chiều cao section: mobile dùng aspect-ratio 2:3 (portrait poster), desktop full viewport trừ header
const SECTION_CLASS = "relative w-full aspect-[2/3] md:aspect-auto md:h-[calc(100vh-5rem)] md:min-h-[420px] overflow-hidden";

function HeroSkeleton() {
  return (
    <div className={SECTION_CLASS}>
      <div className="absolute inset-0 bg-muted/30 animate-pulse" />
    </div>
  );
}

export function HeroSection({ featured, activeIndex, setActiveIndex, isLoading, isError }: Props) {
  const navigate = useNavigate();

  if (isLoading) return <HeroSkeleton />;

  const heroAnime = featured.length ? featured[Math.min(activeIndex, featured.length - 1)] : null;

  if (isError || !heroAnime) {
    return (
      <div className={cn(SECTION_CLASS, "border border-border/50 bg-card flex items-center justify-center")}>
        <p className="text-sm text-muted-foreground">Không tải được anime nổi bật.</p>
      </div>
    );
  }

  const heroGenres = heroAnime.genres?.slice(0, 4) ?? [];

  // mobile: thumbnailUrl (portrait 2:3), desktop: bannerUrl (landscape 16:9)
  const mobileSrc  = heroAnime.thumbnailUrl ?? heroAnime.bannerUrl ?? "";
  const desktopSrc = heroAnime.bannerUrl    ?? heroAnime.thumbnailUrl ?? "";

  return (
    <section className={SECTION_CLASS}>
      {/* ── BG IMAGE ── */}
      {mobileSrc ? (
        <picture>
          {/* desktop: banner landscape */}
          <source media="(min-width: 768px)" srcSet={desktopSrc} />
          {/* mobile: thumbnail portrait */}
          <img
            src={mobileSrc}
            alt={heroAnime.title as string}
            // object-cover + object-center: fill 100% width/height, crop nếu dư, không méo
            className="absolute inset-0 w-full h-full object-cover object-center"
            // tắt upscale mờ, để trình duyệt tự chọn algorithm tốt nhất
            style={{ imageRendering: "auto" }}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-muted/30" />
      )}

      {/* ── OVERLAYS: tăng tương phản text, giống Netflix ── */}
      {/* gradient trái → phải: làm tối vùng text */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      {/* gradient dưới → trên: làm tối vùng bottom text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* overlay nhẹ toàn màn giúp ảnh đỡ chói */}
      <div className="absolute inset-0 bg-black/10" />

      {/* ── CONTENT ── */}
      <div className="relative h-full px-4 md:px-6 flex items-end pb-8 md:pb-10">
        <div className="max-w-xl space-y-4">
          <Badge variant="secondary" className="gap-1.5">
            <Flame className="h-3.5 w-3.5" />
            ĐANG HOT
          </Badge>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black tracking-tight text-white drop-shadow">{heroAnime.title}</h1>
            {heroAnime.titleVi ? (
              <p className="text-sm md:text-base text-white/70">{heroAnime.titleVi}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="font-semibold text-white">⭐ {heroAnime.malScore ?? "N/A"}</span>
            <span>|</span>
            <span>{heroAnime.type}</span>
            {heroAnime.totalEpisodes ? (
              <>
                <span>|</span>
                <span>{heroAnime.totalEpisodes} tập</span>
              </>
            ) : null}
          </div>

          {heroGenres.length ? (
            <p className="text-sm text-white/70">
              {heroGenres.map((g) => g.nameVi || g.name).join(" · ")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="gap-2" onClick={() => navigate(`/anime/${heroAnime.slug}`)}>
              <Play className="h-4 w-4 fill-current" />
              Xem ngay
            </Button>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10" type="button">
              <Plus className="h-4 w-4" />
              Bookmark
            </Button>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-2 pt-2">
            {featured.slice(0, 5).map((a, idx) => (
              <button
                key={a.id}
                type="button"
                aria-label={`Featured ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === activeIndex ? "bg-white w-6" : "w-2 bg-white/30 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}