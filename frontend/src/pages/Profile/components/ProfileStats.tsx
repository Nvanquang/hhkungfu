import type { UserProfileDto } from "@/types/user.types";
import { PlayCircle, Bookmark } from "lucide-react";

interface ProfileStatsProps {
  profile: UserProfileDto;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    {
      label: "Đã xem",
      mobileLabel: "tập",
      value: profile.stats.totalWatched,
      unit: "tập",
      icon: PlayCircle,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Bookmark",
      mobileLabel: "book",
      value: profile.stats.totalBookmarks,
      unit: "anime",
      icon: Bookmark,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 px-1 md:px-0">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border rounded-xl p-3 md:p-5 flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 hover:border-primary/20 transition-all duration-200 shadow-sm group">
          <div className={`p-2 md:p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-200 hidden sm:flex`}>
            <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <div className="text-center md:text-left">
            <div className="text-lg md:text-2xl font-bold tracking-tight">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider line-clamp-1">
              <span className="md:hidden">{stat.mobileLabel}</span>
              <span className="hidden md:inline">{stat.label} ({stat.unit})</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
