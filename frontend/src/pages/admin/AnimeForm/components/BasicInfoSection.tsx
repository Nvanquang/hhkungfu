import { Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import { FieldRow, TitleOtherEditor } from "./FormControls";
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

interface BasicInfoSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function BasicInfoSection({ register, errors, watch, setValue }: BasicInfoSectionProps) {
  const watchedTitleOther = watch("titleOther");

  return (
    <LightPanel className="space-y-4 py-5 px-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
         <div className="h-5 w-1 bg-blue-600 rounded-full"></div>
         <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Thông tin cơ bản</p>
      </div>

      <FieldRow label="Tên gốc (Title)" required>
        <Input
          {...register("title", { required: "Tên gốc là bắt buộc" })}
          placeholder="Ví dụ: Naruto Shippuden"
          className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
        />
        {errors.title && <p className="text-xs font-bold text-red-500 mt-1">{errors.title.message as string}</p>}
      </FieldRow>

      <FieldRow label="Tên tiếng Việt (Title Vietnamese)">
        <Input
          {...register("titleVi")}
          placeholder="Ví dụ: Naruto Phần 2"
          className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
        />
      </FieldRow>

      <FieldRow label="Slug (URL Friendly Name)" required>
        <Input
          {...register("slug", {
            required: "Slug là bắt buộc",
            pattern: { value: /^[a-z0-9-]+$/, message: "Chỉ dùng a-z, 0-9, dấu gạch ngang" },
          })}
          placeholder="naruto-shippuden"
          className="border-slate-300 bg-white font-mono text-sm h-10 px-4 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-blue-700 bg-blue-50/20"
        />
        {errors.slug && <p className="text-xs font-bold text-red-500 mt-1">{errors.slug.message as string}</p>}
      </FieldRow>

      <FieldRow label="Tên khác (Alternative Titles)">
        <TitleOtherEditor
          value={watchedTitleOther || []}
          onChange={(v) => setValue("titleOther", v)}
        />
      </FieldRow>

      <FieldRow label="Mô tả nội dung (Description)">
        <textarea
          {...register("description")}
          placeholder="Tóm tắt nội dung anime tại đây..."
          rows={6}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium leading-relaxed resize-none cursor-auto"
        />
      </FieldRow>
    </LightPanel>
  );
}
