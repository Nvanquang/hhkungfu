import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { SectionHeader } from "../SectionHeader";
import { timeAgo } from "../../home.utils";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface RecentAnime {
  id: number;
  slug?: string | null;
  title?: string | null;
  thumbnailUrl?: string | null;
  latestEp?: number | null;
  latestEpAdded?: string | null;
}

interface Props {
  items: RecentAnime[];
  isLoading: boolean;
}

export function RecentlyUpdatedSection({ items, isLoading }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current || isLoading || !items.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        listRef.current!.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, listRef);
    return () => ctx.revert();
  }, [isLoading, items.length]);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="TẬP MỚI HÔM NAY"
        icon={<Sparkles className="h-5 w-5" />}
        action={{ label: "Xem thêm", href: "/anime?sort=updatedAt&order=desc" }}
      />
      <div ref={listRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
          : items.length
            ? items.map((a) => (
              <div key={a.id} className="group relative flex flex-col gap-2 w-full">
                <Link
                  to={`/watch/${a.slug}/${a.latestEp}`}
                  className={cn(
                    "block relative aspect-[2/3] w-full rounded-md overflow-hidden bg-muted/20",
                    "transition-all duration-300 ease-out hover:-translate-y-1.5 focus-visible:-translate-y-1.5 outline-none"
                  )}
                >
                  {a.thumbnailUrl ? (
                    <img
                      src={a.thumbnailUrl}
                      alt={a.title as string}
                      className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-md" strokeWidth={1.5} />
                  </div>

                  {/* Episode Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                      Tập {a.latestEp ?? "?"}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col gap-1 px-1">
                  <Link to={`/anime/${a.slug}`} className="hover:text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">
                    <h3 className="font-bold text-sm leading-tight line-clamp-1 tracking-tight" title={a.title as string}>
                      {a.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="capitalize">{a.latestEpAdded ? timeAgo(a.latestEpAdded) : ""}</span>
                  </div>
                </div>
              </div>
            ))
            : (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">Hôm nay chưa có tập phim mới!</p>
                  <p className="text-xs text-muted-foreground/50">Quay lại sau nhé, nội dung mới sẽ sớm được cập nhật.</p>
                </div>
              </div>
            )}
      </div>
    </section>
  );
}
