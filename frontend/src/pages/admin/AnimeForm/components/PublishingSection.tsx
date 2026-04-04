import { Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import { FieldRow, NativeSelect } from "./FormControls";
import { STATUSES, TYPES, SEASONS } from "../anime-form.constants";
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { AnimeStatus, AnimeType, AnimeSeason } from "@/types/anime.types";

interface PublishingSectionProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function PublishingSection({ register, watch, setValue }: PublishingSectionProps) {
  const watchedStatus = watch("status");
  const watchedType = watch("type");
  const watchedSeason = watch("season");

  return (
    <LightPanel className="space-y-4 py-5 px-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
         <div className="h-5 w-1 bg-amber-500 rounded-full"></div>
         <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Phân loại & Phát sóng</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldRow label="Trạng thái hiện tại" required>
          <NativeSelect
            value={watchedStatus}
            onChange={(v) => setValue("status", v as AnimeStatus)}
            options={STATUSES}
          />
        </FieldRow>

        <FieldRow label="Loại hình Anime" required>
          <NativeSelect
            value={watchedType}
            onChange={(v) => setValue("type", v as AnimeType)}
            options={TYPES}
          />
        </FieldRow>

        <FieldRow label="Mùa phát sóng (Season)">
          <NativeSelect
            value={watchedSeason ?? ""}
            onChange={(v) => setValue("season", (v || undefined) as AnimeSeason | undefined)}
            options={SEASONS}
            placeholder="-- Chọn mùa phát sóng --"
          />
        </FieldRow>

        <FieldRow label="Năm phát sóng (Year)">
          <Input
            type="number"
            {...register("year", { min: 1900, max: 2100 })}
            placeholder="Ví dụ: 2025"
            className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-amber-500/10 font-bold transition-all"
          />
        </FieldRow>

        <FieldRow label="Ngày bắt đầu chiếu">
          <Input
            type="date"
            {...register("airedFrom")}
            className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-slate-700"
          />
        </FieldRow>

        <FieldRow label="Ngày kết thúc chiếu">
          <Input
            type="date"
            {...register("airedTo")}
            className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-slate-700"
          />
        </FieldRow>

        <FieldRow label="Tổng số tập (Total Episodes)">
          <Input
            type="number"
            {...register("totalEpisodes", { min: 0 })}
            placeholder="Ví dụ: 24"
            className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold"
          />
        </FieldRow>

        <FieldRow label="Thời lượng tập (Phút)">
          <Input
            type="number"
            {...register("episodeDuration", { min: 1 })}
            placeholder="Ví dụ: 24"
            className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold"
          />
        </FieldRow>
      </div>
    </LightPanel>
  );
}
