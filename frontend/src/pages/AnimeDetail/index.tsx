// Entry point trang chi tiết anime: lấy slug từ URL, gọi hook, xử lý loading/error rồi compose các component lại.
import { useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { EmptyState } from "@/components/ui";
import { Breadcrumb } from "@/components/features/Breadcrumb";
import { useAnimeDetail } from "./hooks/useAnimeDetail";
import { DetailSkeleton } from "./components/DetailSkeleton";
import { HeroBanner } from "./components/HeroBanner";
import { AnimeInfoSection } from "./components/AnimeInfoSection";
import { DetailTabs } from "./components/DetailTabs";

export default function AnimeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const idOrSlug = slug ?? "";

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [idOrSlug]);

  const { anime, related, titleOther, mockEpisodeCount, isLoading, isError, isRelatedLoading, refetch } =
    useAnimeDetail(idOrSlug);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || isError || !anime) return;

    let ctx = gsap.context(() => {
      // 1. Zoom in & unblur banner background
      gsap.fromTo(".hero-bg-img", {
        scale: 1.15,
        filter: "blur(15px)",
      }, {
        scale: 1.05,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power3.out"
      });

      // 2. Poster slide up
      gsap.from(".info-poster", {
        y: 30,
        opacity: 0,
        filter: "blur(5px)",
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out"
      });

      // 3. Info metadata stagger
      gsap.from(".info-stagger", {
        y: 20,
        opacity: 0,
        filter: "blur(3px)",
        duration: 0.6,
        stagger: 0.08,
        delay: 0.2,
        ease: "power2.out"
      });

      // 4. Tabs reveal
      gsap.from(".tabs-section", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "power3.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, isError, anime]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !anime) {
    return (
      <div className="main-container py-8">
        <EmptyState
          title="Không tìm thấy anime"
          description="Anime không tồn tại hoặc đã bị xóa."
          action={{ label: "Thử lại", onClick: () => refetch() }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-background pb-12">
      <HeroBanner
        bannerUrl={anime.bannerUrl}
        thumbnailUrl={anime.thumbnailUrl}
        onBack={() => navigate(-1)}
      >
        <div className="main-container">
          <Breadcrumb
            className="mb-4 hidden md:flex opacity-80"
            items={[
              { label: "Khám phá Anime", href: "/anime" },
              { label: anime.titleVi as string },
            ]}
          />
          <AnimeInfoSection
            animeId={anime.id}
            slug={anime.slug as string}
            title={anime.titleVi as string}
            titleOther={titleOther}
            thumbnailUrl={anime.thumbnailUrl}
            hasVipContent={anime.hasVipContent}
            malScore={anime.malScore}
            viewCount={anime.viewCount}
            status={anime.status}
            type={anime.type}
            totalEpisodes={anime.totalEpisodes}
            year={anime.year}
            studios={anime.studios}
            genres={anime.genres}
            isBookmarked={anime.isBookmarked}
          />
        </div>
      </HeroBanner>

      <div className="tabs-section main-container relative z-10">
        <hr className="my-8 border-border/40 hidden md:block" />

        <DetailTabs
          animeId={anime.id}
          animeSlug={anime.slug as string}
          episodeCount={mockEpisodeCount}
          overviewProps={{
            description: anime.description,
            studios: anime.studios,
            year: anime.year,
            season: anime.season,
            totalEpisodes: anime.totalEpisodes,
            episodeDuration: anime.episodeDuration,
            ageRating: anime.ageRating,
            malScore: anime.malScore,
            animeId: anime.id,
            related,
            isRelatedLoading,
          }}
        />
      </div>
    </div>
  );
}