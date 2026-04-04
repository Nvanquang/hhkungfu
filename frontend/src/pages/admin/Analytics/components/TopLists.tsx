import { LightPanel } from "@/pages/admin/shared/components";

interface TopItem {
  id?: number | string;
  title?: string;
  name?: string;
  nameVi?: string;
  views: number;
}

export function TopLists({
  animes,
  genres,
  totalViews,
}: {
  animes: TopItem[];
  genres: TopItem[];
  totalViews: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TopSection title="Top Anime" items={animes} total={totalViews} type="anime" />
      <TopSection title="Top Thể loại" items={genres} total={totalViews} type="genre" />
    </div>
  );
}

function TopSection({
  title,
  items,
  total,
  type,
}: {
  title: string;
  items: TopItem[];
  total: number;
  type: "anime" | "genre";
}) {
  return (
    <LightPanel className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="space-y-4 pt-1">
        {items.length === 0 && <p className="py-2 text-center text-xs text-slate-400">Không có dữ liệu.</p>}
        {items.map((item, idx) => {
          const percent = total > 0 ? (item.views / total) * 100 : 0;
          const label = type === "anime" ? item.title : item.nameVi || item.name;

          return (
            <div key={idx} className="group space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="text-slate-400 font-mono">{idx + 1}</span>
                  <span className="line-clamp-1">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">{item.views.toLocaleString()}</span>
                  <span className="w-10 text-right text-xs text-slate-400">{percent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500/80 transition-all duration-1000 group-hover:bg-blue-600"
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </LightPanel>
  );
}
