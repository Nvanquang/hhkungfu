import { useState } from "react";
import { useBookmarks } from "@/hooks/useUser";
import { AnimeCard } from "@/components/features/AnimeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Search as SearchIcon, SlidersHorizontal, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import type { AnimeSummary } from "@/types/anime.types";

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useBookmarks(page);

  const filteredItems = data?.items.filter((item) => {
    const matchesSearch = item.animeTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "ongoing" && item.status === "ONGOING") || 
      (activeTab === "completed" && item.status === "COMPLETED");
    
    return matchesSearch && matchesTab;
  }) || [];

  return (
    <div className="main-container px-0 md:px-4 lg:px-8 py-0 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Mobile Header (Wireframe: ← Yêu thích (85) | 🔍) */}
      <div className="sticky top-0 z-50 md:hidden flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-md border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-bold text-lg">Bookmark ({data?.pagination.total || 0})</h2>
        <button className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors">
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 md:px-0">
        <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Bookmark className="h-8 w-8 text-primary fill-primary" />
              Bookmark
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data?.pagination.total || 0} anime đã lưu
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm trong danh sách..." 
              className="pl-9 h-10 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-transparent p-0 h-auto gap-6 border-none">
              <TabsTrigger
                value="all"
                className="p-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent shadow-none"
              >
                Tất cả
              </TabsTrigger>
              <TabsTrigger
                value="ongoing"
                className="p-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent shadow-none"
              >
                Đang chiếu
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="p-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent shadow-none"
              >
                Hoàn thành
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Mới thêm nhất</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="space-y-10">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 mt-6">
                {filteredItems.map((item) => {
                  const animeSummary: AnimeSummary = {
                    id: item.animeId,
                    title: item.animeTitle,
                    titleVi: null,
                    slug: item.slug,
                    thumbnailUrl: item.thumbnail,
                    bannerUrl: null,
                    status: item.status,
                    type: item.type as any,
                    totalEpisodes: item.totalEpisodes,
                    year: item.year,
                    malScore: item.averageScore,
                    viewCount: 0,
                    hasVipContent: item.hasVipContent,
                    genres: [],
                    isBookmarked: true,
                  };

                  const handleRemove = async (id: number) => {
                    try {
                      await userService.removeBookmark(id);
                      toast.success("Đã xóa khỏi danh sách bookmark");
                      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
                    } catch (error) {
                      toast.error("Có lỗi xảy ra khi xóa bookmark");
                    }
                  };

                  return (
                    <AnimeCard
                      key={item.animeId}
                      anime={animeSummary}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">Không tìm thấy anime nào khớp với tìm kiếm của bạn.</p>
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="text-primary hover:underline mt-2 text-sm font-medium"
                >
                  Xóa tìm kiếm
                </button>
              </div>
            )}

            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="pt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={page === i + 1}
                          onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage(p => Math.min(data.pagination.totalPages, p + 1)); }}
                        className={page === data.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20">
            <EmptyState
              icon={Bookmark}
              title="Danh sách trống"
              description="Hãy lưu những bộ phim bạn thích để xem lại sau nhé!"
            />
          </div>
        )}
      </div>
    </div>
  );
}
