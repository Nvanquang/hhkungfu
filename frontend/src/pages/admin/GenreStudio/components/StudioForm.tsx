import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Loader2, X } from "lucide-react";
import type { Studio } from "@/types/anime.types";

interface StudioFormProps {
  studio: Studio | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function StudioForm({ studio, onSave, onCancel, isLoading }: StudioFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    if (studio) {
      reset({
        name: studio.name,
        logoUrl: studio.logoUrl || "",
      });
    } else {
      reset({ name: "", logoUrl: "" });
    }
  }, [studio, reset]);

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {studio ? "Sửa studio" : "Thêm studio mới"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên Studio *</Label>
          <Input 
            {...register("name", { required: "Tên studio là bắt buộc" })} 
            placeholder="Ví dụ: MAPPA"
            className="border-slate-300 bg-white"
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Logo (Cloudinary URL)</Label>
          <Input 
            {...register("logoUrl")} 
            placeholder="https://cloudinary.com/..."
            className="border-slate-300 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {studio ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
