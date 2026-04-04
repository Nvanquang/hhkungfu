import { LightPanel } from "@/pages/admin/shared/components";
import { FieldRow, NativeSelect, MultiCheckList } from "./FormControls";
import type { Genre, Studio } from "@/types/anime.types";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";

interface GenreStudioSectionProps {
  genres: Genre[];
  studios: Studio[];
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function GenreStudioSection({ genres, studios, watch, setValue }: GenreStudioSectionProps) {
  const watchedGenreIds = watch("genreIds") || [];
  const watchedStudioIds = watch("studioIds") || [];

  return (
    <LightPanel className="space-y-4 py-5 px-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
         <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
         <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Thể loại & Studio</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldRow label="Thể loại (Genres)">
          <MultiCheckList
            items={genres as any}
            selected={watchedGenreIds}
            onChange={(ids) => setValue("genreIds", ids)}
          />
          {watchedGenreIds.length > 0 && (
            <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded-full border border-emerald-100">
              Đã chọn: {watchedGenreIds.length} thể loại
            </p>
          )}
        </FieldRow>

        <FieldRow label="Xưởng phim (Studio)">
          <NativeSelect
            value={watchedStudioIds[0]?.toString() || ""}
            onChange={(v) => setValue("studioIds", v ? [Number(v)] : [])}
            options={studios.map(s => ({ value: s.id.toString(), label: s.name }))}
            placeholder="-- Chọn Studio sản xuất --"
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium italic">* Hiện tại chỉ hỗ trợ chọn 1 Studio chính.</p>
        </FieldRow>
      </div>
    </LightPanel>
  );
}
