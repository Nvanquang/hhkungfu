import { Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import { FieldRow, NativeSelect } from "./FormControls";
import { AGE_RATINGS } from "../anime-form.constants";
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { AgeRating } from "@/types/anime.types";

interface RatingsSettingsSectionProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function RatingsSettingsSection({ register, watch, setValue }: RatingsSettingsSectionProps) {
  const watchedAgeRating = watch("ageRating");
  const watchedFeatured = watch("isFeatured");

  return (
    <LightPanel className="space-y-4 py-5 px-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
         <div className="h-5 w-1 bg-red-500 rounded-full"></div>
         <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Đánh giá & Cài đặt</p>
      </div>

      <FieldRow label="Phân loại độ tuổi (Age Rating)">
        <NativeSelect
          value={watchedAgeRating ?? ""}
          onChange={(v) => setValue("ageRating", (v || undefined) as AgeRating | undefined)}
          options={AGE_RATINGS}
          placeholder="-- Chọn độ tuổi --"
        />
      </FieldRow>

      <FieldRow label="Điểm MyAnimeList (MAL Score)">
        <Input
          type="number"
          step="0.01"
          min={0}
          max={10}
          {...register("malScore")}
          placeholder="Ví dụ: 8.50"
          className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-red-500/10 transition-all font-bold"
        />
      </FieldRow>

      <div className="pt-2">
        <label className="flex cursor-pointer items-center gap-3 group p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all">
          <input
            type="checkbox"
            className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
            checked={!!watchedFeatured}
            onChange={(e) => setValue("isFeatured", e.target.checked)}
          />
          <div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Đánh dấu Nổi bật (Featured)</span>
            <p className="text-[11px] text-slate-400 font-medium">Hiện thị Anime này tại khu vực Slide/Nổi bật ở Trang chủ</p>
          </div>
        </label>
      </div>
    </LightPanel>
  );
}
