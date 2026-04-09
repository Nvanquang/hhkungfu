// Tab "Nội dung": mô tả anime, danh sách nhân vật chính mockup, sidebar thông tin thêm và section anime tương tự.

import { PaginatedGrid } from "@/pages/Home/components/PaginatedGrid";
import { SectionHeader } from "@/pages/Home/components/SectionHeader";
import type { AnimeSummary, Studio } from "@/types";

interface Props {
  description?: string | null;
  studios?: Studio[];
  year?: number | null;
  season?: string | null;
  totalEpisodes?: number | null;
  episodeDuration?: number | null;
  ageRating?: string | null;
  malScore?: number | null;
  animeId?: number;
  related: AnimeSummary[];
  isRelatedLoading: boolean;
}

export function OverviewTab({
  description, studios, year, season, totalEpisodes,
  episodeDuration, ageRating, malScore, animeId, related, isRelatedLoading,
}: Props) {
  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

        {/* Left */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="font-bold text-foreground opacity-90 text-[15px]">THÔNG TIN CHUNG</h3>
            <div className="relative text-sm md:text-[15px] text-muted-foreground/90 leading-relaxed font-normal">
              <p className="line-clamp-4">{description || "Chưa có nội dung mô tả chi tiết cho phim này."}</p>
              {description && (
                <button className="text-primary hover:text-primary/80 font-semibold hover:underline mt-1.5 transition-colors">
                  [Xem thêm]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="bg-muted/10 border border-border/40 rounded-xl p-6 space-y-4 h-fit shrink-0">
          <h3 className="font-bold text-foreground opacity-90 border-b border-border/40 pb-3 text-[15px]">THÔNG TIN THÊM</h3>
          <div className="grid gap-4 text-sm">
            {studios?.length ? (
              <div className="flex justify-between items-start gap-4">
                <span className="text-muted-foreground shrink-0">Studio</span>
                <span className="font-medium text-right">{studios.map(s => s.name).join(', ')}</span>
              </div>
            ) : null}
            {year ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Năm</span><span className="font-medium">{year}</span></div> : null}
            {season ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Mùa</span><span className="font-medium">{season}</span></div> : null}
            {totalEpisodes ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Tập</span><span className="font-medium">{totalEpisodes}</span></div> : null}
            {episodeDuration ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Thời lượng</span><span className="font-medium">~{episodeDuration} phút</span></div> : null}
            {ageRating ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Độ tuổi</span><span className="font-medium">{ageRating}</span></div> : null}
            {malScore ? <div className="flex justify-between items-center gap-4"><span className="text-muted-foreground shrink-0">Nguồn</span><span className="font-medium">Manga</span></div> : null}
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground shrink-0">Xếp hạng</span>
              <span className="font-medium text-amber-500">#{animeId} (MAL)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related — thiết kế giống TrendingSection */}
      <section className="space-y-4 pt-2">
        <SectionHeader
          title="ANIME TƯƠNG TỰ"
          action={{ label: "Xem Khám phá", href: "/anime" }}
        />
        <PaginatedGrid
          items={related}
          isLoading={isRelatedLoading}
          emptyText="Chưa có dữ liệu anime tương tự."
        />
      </section>
    </div>
  );
}