import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Loader2, X } from "lucide-react";
import type { Genre } from "@/types/anime.types";

interface GenreFormProps {
  genre: Genre | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function GenreForm({ genre, onSave, onCancel, isLoading }: GenreFormProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      nameVi: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (genre) {
      reset({
        name: genre.name as string,
        nameVi: genre.nameVi || "",
        slug: genre.slug as string,
      });
    } else {
      reset({ name: "", nameVi: "", slug: "" });
    }
  }, [genre, reset]);

  const watchedName = watch("name");
  useEffect(() => {
    if (!genre && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setValue("slug", slug);
    }
  }, [watchedName, genre, setValue]);

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {genre ? "Sửa thể loại" : "Thêm thể loại mới"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên tiếng Anh *</Label>
          <Input 
            {...register("name", { required: "Tên gốc là bắt buộc" })} 
            placeholder="Ví dụ: Isekai"
            className="border-slate-300 bg-white"
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên tiếng Việt</Label>
          <Input 
            {...register("nameVi")} 
            placeholder="Ví dụ: Dị giới"
            className="border-slate-300 bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Slug *</Label>
          <Input 
            {...register("slug", { required: "Slug là bắt buộc" })} 
            placeholder="isekai"
            className="border-slate-300 bg-white font-mono text-sm"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
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
            {genre ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
