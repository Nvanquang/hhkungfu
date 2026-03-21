// Entry point trang chủ, compose tất cả hooks và sections, chỉ giữ state activeGenre và wiring data xuống các section.
import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useHomeData } from "./hooks/useHomeData";
import { useFeaturedCarousel } from "./hooks/useFeaturedCarousel";
import { HeroSection } from "./components/sections/HeroSection";
import { TrendingSection } from "./components/sections/TrendingSection";
import { RecentlyUpdatedSection } from "./components/sections/RecentlyUpdatedSection";
import { GenreSection } from "./components/sections/GenreSection";
import { VipBanner } from "./components/sections/VipBanner";
import type { AnimeSummary } from "@/types";

export default function Home() {
  const { user } = useAuthStore();
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const {
    featured, isFeaturedLoading, isFeaturedError,
    trending, isTrendingLoading,
    recently, isRecentlyLoading,
    genres, isGenresLoading,
    genreAnimes, isGenreAnimesLoading,
  } = useHomeData(activeGenre);

  const { activeIndex, setActiveIndex } = useFeaturedCarousel(featured.length);

  const effectiveGenre = useMemo(
    () => activeGenre ?? (genres.length ? genres[0]!.slug ?? null : null),
    [activeGenre, genres]
  );
  const activeGenreData = genres.find((g) => g.slug === effectiveGenre);

  return (
    <div className="w-full">
      <HeroSection
        featured={featured}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        isLoading={isFeaturedLoading}
        isError={isFeaturedError}
      />
      <div className="main-container py-6 md:py-8 space-y-10">

        <TrendingSection items={trending as AnimeSummary[]} isLoading={isTrendingLoading} />

        <RecentlyUpdatedSection items={recently} isLoading={isRecentlyLoading} />

        <GenreSection
          genres={genres}
          isGenresLoading={isGenresLoading}
          effectiveGenre={effectiveGenre}
          activeGenreData={activeGenreData}
          genreAnimes={genreAnimes}
          isGenreAnimesLoading={isGenreAnimesLoading}
          onSelectGenre={setActiveGenre}
        />

        {!user?.isVip ? <VipBanner /> : null}
      </div>
    </div>
  );
}