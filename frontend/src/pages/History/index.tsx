import { useState, useMemo } from "react";
import { useWatchHistory } from "@/hooks/useUser";
import { userService } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Play, CheckCircle2, MoreVertical, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useWatchHistory(1);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (activeTab === "watching") return data.items.filter(i => !i.isCompleted);
    if (activeTab === "completed") return data.items.filter(i => i.isCompleted);
    return data.items;
  }, [data, activeTab]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};

    filteredItems.forEach(item => {
      const date = new Date(item.watchedAt);
      const now = new Date();
      let groupKey = "";

      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      if (isSameDay(date, now)) groupKey = "Hôm nay";
      else if (isSameDay(date, yesterday)) groupKey = "Hôm qua";
      else if ((now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000) groupKey = "Tuần này";
      else groupKey = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredItems]);

  const handleClearAll = async () => {
    setIsDeletingAll(true);
    try {
      await userService.clearWatchHistory();
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Đã xóa toàn bộ lịch sử xem");
    } catch (error) {
      toast.error("Không thể xóa lịch sử");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="main-container px-0 md:px-4 lg:px-8 py-0 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Mobile Header (Wireframe: ← Lịch sử xem | 🗑) */}
      <div className="sticky top-0 z-50 md:hidden flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-md border-b">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-bold text-lg">Lịch sử xem</h2>
        
        <Dialog>
          <DialogTrigger 
            render={
              <Button variant="ghost" size="icon" className="md:hidden -mr-2 hover:bg-muted rounded-full transition-colors text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            }
          />
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa lịch sử?</DialogTitle>
              <DialogDescription>
                Hành động này không thể hoàn tác. Tất cả tiến độ xem của bạn sẽ bị xóa sạch.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => { }}>Hủy</Button>
              <Button variant="destructive" className="flex-1 rounded-full" onClick={handleClearAll} disabled={isDeletingAll}>
                {isDeletingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa tất cả
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 md:px-0">
        <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Lịch sử xem</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Theo dõi tiến độ xem các bộ phim của bạn.
            </p>
          </div>

          <Dialog>
            <DialogTrigger 
              render={
                <Button variant="ghost" size="sm" className="hidden md:flex text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Xóa toàn bộ lịch sử</span>
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận xóa lịch sử?</DialogTitle>
                <DialogDescription>
                  Hành động này không thể hoàn tác. Tất cả tiến độ xem của bạn sẽ bị xóa sạch.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => { }}>Hủy</Button>
                <Button variant="destructive" onClick={handleClearAll} disabled={isDeletingAll}>
                  {isDeletingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xóa tất cả
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted/50 p-1 h-9 items-center justify-center rounded-lg">
              <TabsTrigger value="all" className="rounded-md px-4 py-1.5 text-xs font-medium">Tất cả</TabsTrigger>
              <TabsTrigger value="watching" className="rounded-md px-4 py-1.5 text-xs font-medium">Đang xem</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md px-4 py-1.5 text-xs font-medium">Đã hoàn thành</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="text-sm text-muted-foreground font-medium">
            Sắp xếp: <span className="text-foreground">Gần nhất</span>
          </div>
        </div>

      {isLoading ? (
        <div className="space-y-8 mt-4">
          {[1, 2].map(g => (
            <div key={g} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-10 mt-6">
          {Object.entries(groupedHistory).map(([group, items]) => (
            <div key={group} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                {group}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.lastEpisodeId} className="group relative bg-card border rounded-xl p-3 md:p-4 hover:border-primary/30 transition-all duration-200 shadow-sm flex flex-col md:flex-row gap-4">
                    <Link to={`/watch/${item.lastEpisodeId}`} className="relative aspect-video w-full md:w-40 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail}
                        alt={item.lastEpisodeTitle}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </Link>

                    <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                      <div className="mb-3 md:mb-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/anime/${item.animeSlug}`} className="hover:text-primary transition-colors truncate">
                            <h3 className="font-bold text-base line-clamp-1">{item.animeTitle}</h3>
                          </Link>
                          <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(item.watchedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          Tập {item.lastEpisodeNumber} — {item.lastEpisodeTitle}
                        </p>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center justify-between text-[11px] md:text-sm">
                          {item.isCompleted ? (
                            <span className="text-green-500 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                              Hoàn thành
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Xem đến {Math.floor(item.progressSeconds / 60)}:{String(item.progressSeconds % 60).padStart(2, '0')} / {Math.floor(item.durationSeconds / 60)}:00
                            </span>
                          )}
                          <Link to={`/watch/${item.lastEpisodeId}`} className="text-primary font-bold hover:underline">
                            {item.isCompleted ? "Xem lại" : "Xem tiếp"}
                          </Link>
                        </div>
                        <Progress value={(item.progressSeconds / item.durationSeconds) * 100} className="h-1.5" />
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20">
          <EmptyState
            icon={Play}
            title="Trống không"
            description={
              activeTab === "all"
                ? "Bạn chưa xem bộ phim nào cả."
                : activeTab === "watching"
                  ? "Bạn không có bộ phim nào đang xem dở."
                  : "Bạn chưa hoàn thành bộ phim nào."
            }
          />
        </div>
      )}
      </div>
    </div>
  );
}
