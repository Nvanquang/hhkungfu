// Tabs navigation (Nội dung / Tập phim / Nhận xét) bao gồm TabsList với underline style và render 3 TabsContent tương ứng.
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./tabs/OverviewTab";
import { EpisodesTab } from "./tabs/EpisodesTab";
import { CommentsTab } from "./tabs/CommentsTab";

const TABS = [
  { value: "overview", label: "Nội dung" },
  { value: "episodes", label: "Tập phim" },
  { value: "comments", label: "Nhận xét" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

interface Props {
  overviewProps: React.ComponentProps<typeof OverviewTab>;
  episodeCount: number;
}

export function DetailTabs({ overviewProps, episodeCount }: Props) {
  const [active, setActive] = useState<TabValue>("overview");

  return (
    <section className="mt-8 md:mt-0 w-full">
      {/* Tab list */}
      <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border/40">
        <div className="flex flex-row gap-6">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActive(value)}
              className={cn(
                "relative px-1 py-3 font-semibold text-base transition-colors whitespace-nowrap",
                "after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-t-sm after:transition-colors",
                active === value
                  ? "text-primary after:bg-primary"
                  : "text-muted-foreground hover:text-foreground after:bg-transparent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6 animate-in fade-in-50 duration-500">
        {active === "overview" && <OverviewTab {...overviewProps} />}
        {active === "episodes" && <EpisodesTab episodeCount={episodeCount} />}
        {active === "comments" && <CommentsTab />}
      </div>
    </section>
  );
}