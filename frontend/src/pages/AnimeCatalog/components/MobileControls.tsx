import { Filter, SortDesc, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { FilterChip } from "../hooks/useFilterChips";

interface Props {
  activeFilterChips: FilterChip[];
  onOpenFilter: () => void;
  onOpenSort: () => void;
  setParam: (key: string, value: string | number | undefined | null) => void;
}

export function MobileControls({ activeFilterChips, onOpenFilter, onOpenSort, setParam }: Props) {
  return (
    <div className="lg:hidden space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onOpenFilter}>
          <Filter className="h-4 w-4" /> Bộ lọc
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={onOpenSort}>
          <SortDesc className="h-4 w-4" /> Sắp xếp
        </Button>
      </div>

      {activeFilterChips.length ? (
        <div className="flex flex-wrap gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => setParam(chip.key, undefined)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold bg-background hover:bg-muted"
            >
              {chip.label} <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Hai nút "Bộ lọc" / "Sắp xếp" trên mobile cùng danh sách chip filter active, bấm chip để xóa filter đó.