// Skeleton loading placeholder toàn trang khi đang fetch dữ liệu anime lần đầu.
import { Skeleton } from "@/components/ui";

export function DetailSkeleton() {
  return (
    <div className="w-full bg-background min-h-screen pb-12">
      <Skeleton className="relative h-44 md:h-72 w-full overflow-hidden rounded-none bg-muted/30" />
      <div className="container mx-auto px-4 md:px-8 relative z-10 -mt-12 md:-mt-24">
        <section className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="flex gap-4 md:block shrink-0">
            <Skeleton className="w-24 h-36 md:w-48 md:h-72 shrink-0 rounded-lg md:rounded-xl shadow-2xl" />
          </div>
          <div className="flex flex-col space-y-4 flex-1 md:pt-28 lg:pt-28">
            <Skeleton className="h-10 w-3/4 max-w-lg hidden md:block" />
            <Skeleton className="h-6 w-1/3 max-w-sm hidden md:block" />
            <Skeleton className="h-6 w-1/2 max-w-md mt-4 hidden md:block" />
            <div className="flex flex-col md:flex-row gap-3 pt-3">
              <Skeleton className="h-12 w-full md:w-36 rounded-lg" />
              <Skeleton className="h-12 w-full md:w-48 rounded-lg" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}