import { Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import { FieldRow } from "./FormControls";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";

interface MediaSectionProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
}

export function MediaSection({ register, watch }: MediaSectionProps) {
  const thumbUrl = watch("thumbnailUrl");
  const bannerUrl = watch("bannerUrl");

  return (
    <LightPanel className="space-y-4 py-5 px-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
         <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
         <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Hình ảnh & Media</p>
      </div>

      <FieldRow label="Ảnh bìa đứng (Thumbnail URL)">
        <Input
          {...register("thumbnailUrl", { maxLength: 500 })}
          placeholder="https://cdn.example.com/thumb.jpg"
          className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
        />
        {thumbUrl && (
          <div className="mt-3 relative group">
            <img
              src={thumbUrl}
              alt="Thumbnail preview"
              className="h-48 w-full rounded-xl border border-slate-200 object-cover shadow-sm transition group-hover:shadow-md"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
               <span className="text-white text-xs font-bold uppercase tracking-widest">Preview</span>
            </div>
          </div>
        )}
      </FieldRow>

      <FieldRow label="Ảnh bìa ngang (Banner URL)">
        <Input
          {...register("bannerUrl", { maxLength: 500 })}
          placeholder="https://cdn.example.com/banner.jpg"
          className="border-slate-300 bg-white h-10 px-4 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
        />
        {bannerUrl && (
          <div className="mt-3 relative group">
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="h-28 w-full rounded-xl border border-slate-200 object-cover shadow-sm transition group-hover:shadow-md"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
               <span className="text-white text-xs font-bold uppercase tracking-widest">Preview Banner</span>
            </div>
          </div>
        )}
      </FieldRow>
    </LightPanel>
  );
}
