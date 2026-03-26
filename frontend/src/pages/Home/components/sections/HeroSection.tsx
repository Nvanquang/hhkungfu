/**
 * HeroSection – Ultra Cinematic redesign
 *
 * Visual layers (bottom to top):
 *  1. Background image          – Magnetic Mouse Parallax + Lens Auto-Focus + Infinite Breathing
 *  2. Depth gradient overlays   – left blackout + bottom scrim + subtle top fade
 *  3. Light sweep               – diagonal glow passing every ~8s (CSS animation)
 *  4. Floating dust particles   – 20 divs drifting upward (GSAP stagger loop)
 *  5. Content                   – badge → title (massive slam impact) → meta → genre  → buttons → dots
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Flame, Play } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AnimeSummary } from "@/types";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { gsap } from "gsap";

interface Props {
  featured: AnimeSummary[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  isLoading: boolean;
  isError: boolean;
  isPlayingIntro?: boolean;
}

const SECTION_CLASS = "relative w-full aspect-[2/3] md:aspect-auto md:h-[calc(100vh-5rem)] md:min-h-[420px] overflow-hidden";

const DUST = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 4.7) % 90}%`,
  size: 1 + (i % 3),
  dur: 4 + (i % 4),
  delay: i * 0.3,
}));

function HeroSkeleton() {
  return (
    <div className={SECTION_CLASS}>
      <div className="absolute inset-0 bg-muted/30 animate-pulse" />
    </div>
  );
}

export function HeroSection({ featured, activeIndex, setActiveIndex, isLoading, isError, isPlayingIntro = false }: Props) {
  const navigate = useNavigate();

  const sectionRef = useRef<HTMLElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  // ── 1. Không Gian Tương Tác Chuột (Magnetic Mouse Parallax & Scroll) ──
  useEffect(() => {
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      currentX = (e.clientX / window.innerWidth - 0.5) * 20; // range: -10 to 10
      currentY = (e.clientY / window.innerHeight - 0.5) * 20;
      updateParallax();
    };

    const handleScroll = () => {
      updateParallax();
    };

    const updateParallax = () => {
      const scrollYOffset = window.scrollY * 0.35;

      // Background moves counter to mouse + scroll Y
      gsap.to(bgImgRef.current, {
        x: -currentX * 1.5,
        y: scrollYOffset - currentY * 1.5,
        duration: 0.8,
        ease: "power2.out"
      });

      // Dust shifts slightly counter to mouse
      gsap.to(dustRef.current, {
        x: -currentX * 0.5,
        y: -currentY * 0.5,
        duration: 1.5,
        ease: "power2.out"
      });

      // Content floats WITH mouse slowly for 3D depth pop
      gsap.to(contentRef.current, {
        x: currentX * 0.8,
        y: currentY * 0.8,
        duration: 1.0,
        ease: "power2.out"
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ── 2. Entrance + Lens Focus + Heroic Title Impact ──
  useEffect(() => {
    if (isLoading || !contentRef.current || !bgImgRef.current || !titleRef.current) return;

    const bg = bgImgRef.current;
    const content = contentRef.current;
    const title = titleRef.current;
    const dust = dustRef.current;
    const light = lightRef.current;
    const flash = flashRef.current;
    const section = sectionRef.current;

    const groups = Array.from(content.querySelectorAll<HTMLElement>(".hc"));

    // GPU optimization
    gsap.set([bg, ...groups, title, flash, section], { willChange: "transform, opacity, filter" });

    // Initial state: Blurred and zoomed background (Lens Snap)
    gsap.set(bg, { scale: 1.15, filter: "blur(20px)", transformOrigin: "center center" });
    gsap.set(groups, { opacity: 0, y: 40, filter: "blur(8px)" });
    gsap.set(title, { scale: 2.2, opacity: 0, y: -40, filter: "blur(6px)" }); // Title prepares to drop
    if (flash) gsap.set(flash, { opacity: 0, scale: 0.2 });

    // VERY IMPORTANT: If the cinematic Intro is playing over the screen, STOP right here!
    // We already hid the content and set the pre-animation transforms. 
    // Now we wait in the dark until the Intro unmounts, revealing this frozen state, and THEN we play.
    if (isPlayingIntro) return;

    const tl = gsap.timeline();

    // A. Lens Snap Focus: Background violently snaps into focus like a cinematic camera
    tl.to(bg, {
      scale: 1.05,
      filter: "blur(0px)",
      duration: 1.4,
      ease: "power3.out"
    }, 0);

    // B. Title Slam: Giant text slams down into the page
    tl.to(title, {
      scale: 1,
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.45,
      ease: "power4.in" // Very fast, aggressive hit like a fighting game
    }, 0.35);

    // C. Impact FX: Screen shake + Fiery Flash exactly when the title hits (0.8s)
    tl.to(section, {
      y: 8,
      yoyo: true,
      repeat: 3,
      duration: 0.04,
      ease: "none"
    }, 0.8);

    if (flash) {
      tl.to(flash, {
        opacity: 0.8,
        scale: 1.5,
        duration: 0.1,
        ease: "power2.out"
      }, 0.8);
      tl.to(flash, {
        opacity: 0,
        duration: 1.2,
        ease: "power2.out"
      }, 0.9);
    }

    // D. Staggered reveal of the rest of the metadata
    tl.to(groups, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out"
    }, 0.9);

    // After entrance: smooth infinite breathing
    gsap.to(bg, {
      scale: 1.08,
      duration: 8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 1.5
    });

    // ── Light sweep (repeats every 8s) ──
    if (light) {
      const sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 7.5 });
      sweepTl
        .set(light, { x: "-100%", opacity: 0 })
        .to(light, { x: "-100%", opacity: 0.6, duration: 0.01, ease: "none" })
        .to(light, { x: "200%", duration: 1.4, ease: "power2.inOut" })
        .to(light, { opacity: 0, duration: 0.2, ease: "none" }, "-=0.2");
      sweepTl.delay(2.0);
    }

    // ── Dust particles ──
    if (dust) {
      const nodes = dust.querySelectorAll<HTMLElement>(".dp");
      gsap.set(nodes, { opacity: 0, y: 0 });
      nodes.forEach((node, i) => {
        const d = DUST[i]!;
        gsap.to(node, {
          opacity: 0.5,
          y: -(80 + d.dur * 20),
          duration: d.dur,
          delay: d.delay,
          ease: "power1.out",
          repeat: -1,
          repeatDelay: 0.5 + d.delay * 0.2,
          onRepeat: () => void gsap.set(node, { y: 0, opacity: 0 }),
        });
      });
    }

    return () => {
      tl.kill();
      gsap.killTweensOf([bg, dust, content, ...groups, title, flash, section, light]);
    };
  }, [isLoading, activeIndex, isPlayingIntro]);

  if (isLoading) return <HeroSkeleton />;

  const heroAnime = featured.length
    ? featured[Math.min(activeIndex, featured.length - 1)]
    : null;

  if (isError || !heroAnime) {
    return (
      <div className={cn(SECTION_CLASS, "border border-border/50 bg-card flex items-center justify-center")}>
        <p className="text-sm text-muted-foreground">Không tải được anime nổi bật.</p>
      </div>
    );
  }

  const heroGenres = heroAnime.genres?.slice(0, 4) ?? [];
  const mobileSrc = heroAnime.thumbnailUrl ?? heroAnime.bannerUrl ?? "";
  const desktopSrc = heroAnime.bannerUrl ?? heroAnime.thumbnailUrl ?? "";

  const handleToggleBookmark = async () => {
    if (!heroAnime) return;
    try {
      if (heroAnime.isBookmarked) {
        await userService.removeBookmark(heroAnime.id);
        toast.success("Đã xóa khỏi danh sách bookmarks");
        heroAnime.isBookmarked = false;
      } else {
        await userService.addBookmark(heroAnime.id);
        toast.success("Đã thêm vào danh sách bookmarks");
        heroAnime.isBookmarked = true;
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    }
  };

  return (
    <section ref={sectionRef} className={SECTION_CLASS}>

      {/* ── Layer 1: Background image ── */}
      {mobileSrc ? (
        <picture className="absolute inset-0 w-full h-full">
          <source media="(min-width: 768px)" srcSet={desktopSrc} />
          <img
            ref={bgImgRef}
            src={mobileSrc}
            alt={heroAnime.title as string}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ transformOrigin: "center center", scale: 1.15 }} // Extra padding for parallax
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-muted/30" ref={bgImgRef as unknown as React.RefObject<HTMLDivElement>} />
      )}

      {/* ── Layer 2: Cinematic gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* ── Layer 3: Moving light sweep ── */}
      <div
        ref={lightRef}
        className="pointer-events-none absolute inset-y-0 w-[45%] mix-blend-overlay"
        style={{
          background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.1) 70%, transparent 100%)",
          filter: "blur(4px)",
        }}
      />

      {/* ── Layer 4: Floating dust particles ── */}
      <div ref={dustRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {DUST.map((d) => (
          <div
            key={d.id}
            className="dp absolute bottom-0 rounded-full bg-white/70"
            style={{ left: d.left, width: d.size, height: d.size }}
          />
        ))}
      </div>

      {/* ── Layer 5: Content ── */}
      <div className="relative h-full px-5 md:px-10 flex items-end pb-10 md:pb-14">
        <div ref={contentRef} className="max-w-xl space-y-4">

          {/* Badge */}
          <div className="hc">
            <Badge
              variant="secondary"
              className="gap-1.5 bg-red-500/20 border border-red-500/50 text-red-200 backdrop-blur-sm px-3 py-1 font-semibold"
            >
              <Flame className="h-4 w-4 fill-red-500 text-red-500" />
              TOP THỊNH HÀNH
            </Badge>
          </div>

          {/* Title (The Slam Impact Target) */}
          <div className="space-y-1 relative" style={{ zIndex: 10 }}>
            {/* The dramatic bloom flash hidden directly behind the title */}
            <div
              ref={flashRef}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[250%] rounded-[100%] mix-blend-screen pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,69,0,0.6) 20%, rgba(0,0,0,0) 70%)",
                filter: "blur(25px)",
                zIndex: -1
              }}
            />

            <h1
              ref={titleRef}
              className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text leading-[1.1] pb-1"
              style={{
                backgroundImage: "linear-gradient(180deg, #ffffff 0%, #e0e0e0 50%, #aaaaaa 100%)",
                WebkitTextStroke: "1px rgba(0,0,0,0.4)",
                textShadow: "0 10px 40px rgba(0,0,0,0.8), 2px 2px 0px rgba(0,0,0,0.5)",
                transformOrigin: "left bottom",
              }}
            >
              {heroAnime.title}
            </h1>
            {heroAnime.titleVi ? (
              <p className="hc text-base md:text-lg text-white/70 font-medium drop-shadow-md">
                {heroAnime.titleVi}
              </p>
            ) : null}
          </div>

          {/* Meta */}
          <div className="hc flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:text-base text-white/80 pt-1">
            <span className="font-bold text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
              ★ {heroAnime.malScore ?? "N/A"}
            </span>
            <span className="text-white/40">|</span>
            <span className="font-semibold px-2 py-0.5 rounded-sm bg-white/10 backdrop-blur-md">
              {heroAnime.type}
            </span>
            {heroAnime.totalEpisodes ? (
              <>
                <span className="text-white/40">|</span>
                <span className="font-medium text-white/90">{heroAnime.totalEpisodes} Tập</span>
              </>
            ) : null}
          </div>

          {/* Genres */}
          {heroGenres.length ? (
            <div className="hc flex flex-wrap gap-2 pt-2">
              {heroGenres.map((g) => (
                <span
                  key={g.id ?? g.name}
                  className="text-xs md:text-sm px-3 py-1 rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-md hover:bg-white/20 transition-colors"
                >
                  {g.nameVi || g.name}
                </span>
              ))}
            </div>
          ) : null}

          {/* Buttons */}
          <div className="hc flex flex-wrap gap-3 pt-4">
            <Button
              size="lg"
              className="gap-2 shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] font-bold text-base px-8 transition-shadow"
              onClick={() => navigate(`/anime/${heroAnime.slug}`)}
            >
              <Play className="h-5 w-5 fill-current" />
              Xem Ngay
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "gap-2 border-white/30 text-white hover:bg-white/15 backdrop-blur-md font-semibold transition-all duration-200 text-base px-6",
                heroAnime.isBookmarked && "bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30"
              )}
              type="button"
              onClick={handleToggleBookmark}
            >
              <Bookmark className={cn("h-5 w-5", heroAnime.isBookmarked && "fill-current")} /> Bookmark
            </Button>
          </div>

          {/* Dot indicators */}
          <div className="hc flex items-center gap-2 pt-6">
            {featured.slice(0, 5).map((a, idx) => (
              <button
                key={a.id}
                type="button"
                aria-label={`Featured ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500 ease-out",
                  idx === activeIndex
                    ? "bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    : "w-2 bg-white/30 hover:bg-white/60"
                )}
              />
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}