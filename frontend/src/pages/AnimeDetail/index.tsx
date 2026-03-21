// Entry point trang chi tiết anime: lấy slug từ URL, gọi hook, xử lý loading/error rồi compose các component lại.
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    <div className="w-full min-h-screen bg-background pb-12">
      <HeroBanner
        title={anime.title as string}
        bannerUrl={anime.bannerUrl}
        thumbnailUrl={anime.thumbnailUrl}
        onBack={() => navigate(-1)}
      />

      <div className="main-container relative z-10 -mt-12 md:-mt-24">
        <Breadcrumb
          className="mb-4 hidden md:flex"
          items={[
            { label: "Khám phá Anime", href: "/anime" },
            { label: anime.title as string },
          ]}
        />
        <AnimeInfoSection
          animeId={anime.id}
          title={anime.title as string}
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

        <hr className="my-8 border-border/40 hidden md:block" />

        <DetailTabs
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