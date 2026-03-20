// Tab "Tập phim": thanh filter sort/lọc/tìm kiếm và grid các nút tập với trạng thái watched, watching, locked.
import { Search, Play, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  episodeCount: number;
}

export function EpisodesTab({ episodeCount }: Props) {
  return (
    <div className="space-y-6">
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-1/2 sm:w-auto gap-2">
            <span className="text-sm text-muted-foreground font-medium hidden sm:inline shrink-0">Sắp xếp:</span>
            <select className="h-9 px-3 py-1 w-full sm:w-auto rounded-md bg-muted/60 border border-border/40 text-sm font-medium focus:ring-1 focus:ring-primary outline-none hover:bg-muted transition-colors appearance-none cursor-pointer">
              <option>Mới nhất ▾</option>
              <option>Cũ nhất ▾</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-1/2 sm:w-auto gap-2">
            <span className="text-sm text-muted-foreground font-medium hidden sm:inline shrink-0">Lọc:</span>
            <select className="h-9 px-3 py-1 w-full sm:w-auto rounded-md bg-muted/60 border border-border/40 text-sm font-medium focus:ring-1 focus:ring-primary outline-none hover:bg-muted transition-colors appearance-none cursor-pointer">
              <option>Tất cả ▾</option>
              <option>Chưa xem</option>
              <option>Đã xem</option>
            </select>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Tìm tập..." className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/30 border border-border/50 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-colors" />
        </div>
      </div>

      {/* Episode grid */}
      <div className="rounded-xl border border-border/40 p-4 md:p-6 bg-muted/10 shadow-sm">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-2.5 md:gap-3">
          {Array.from({ length: episodeCount }).map((_, i) => {
            const ep = i + 1;
            const isWatched  = ep === 1 || ep === 2;
            const isWatching = ep === 3 || ep === 12;
            const isLocked   = ep === 24;

            return (
              <button
                key={ep}
                className={cn(
                  "relative flex items-center justify-center p-2 h-11 text-[13px] md:text-sm font-semibold rounded-md border transition-all duration-200 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isLocked   ? "bg-background/40 text-muted-foreground border-transparent cursor-not-allowed" :
                  isWatching ? "bg-primary/5 text-primary border-primary/50 shadow-sm" :
                  isWatched  ? "bg-card text-muted-foreground border-border hover:border-foreground/30 opacity-60 hover:opacity-100" :
                               "bg-card text-foreground border-border hover:bg-muted hover:border-muted-foreground/30 hover:-translate-y-0.5 shadow-sm hover:shadow"
                )}
                title={`Tập ${ep} — Hành trình mới · 24 phút`}
              >
                <span className="flex items-center gap-1.5 z-10 transition-transform">
                  {isLocked   && <Lock className="w-3.5 h-3.5 -ml-1 text-muted-foreground" />}
                  {isWatching && <Play className="w-3 h-3 fill-current -ml-1" />}
                  {!(isLocked || isWatching) && "T."}
                  {ep}
                </span>
                {isWatched && <Check className="absolute top-1 right-1 w-2.5 h-2.5 text-green-500 z-10" />}
                {isWatching && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary/20">
                    <div className="h-full bg-primary" style={{ width: "45%" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}