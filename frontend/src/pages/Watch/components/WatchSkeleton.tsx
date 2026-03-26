export function WatchSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-black animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-12 bg-white/5 border-b border-white/10 flex items-center px-4 gap-3">
        <div className="w-24 h-5 bg-white/10 rounded" />
        <div className="w-3 h-3 bg-white/5 rounded" />
        <div className="w-32 h-4 bg-white/10 rounded" />
      </div>

      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Player skeleton */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="w-full aspect-video bg-white/5 rounded-xl" />

          {/* Video info skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-2/3 bg-white/10 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-white/5 rounded-lg" />
              <div className="h-8 w-24 bg-white/5 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-white/5 rounded-full" />
              <div className="h-5 w-12 bg-white/5 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-4/5 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar skeleton (desktop) */}
        <div className="hidden lg:flex flex-col w-80 bg-white/5 rounded-xl overflow-hidden">
          <div className="h-12 border-b border-white/10 px-4 flex flex-col justify-center gap-1">
            <div className="h-3 w-32 bg-white/10 rounded" />
            <div className="h-2 w-16 bg-white/5 rounded" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3 py-3 border-b border-white/5">
              <div className="h-3 w-1/2 bg-white/10 rounded mb-1.5" />
              <div className="h-2 w-1/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
