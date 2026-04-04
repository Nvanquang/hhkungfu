import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import { animeService } from "@/services/animeService";
import type { CreateAnimeRequest, Genre, Studio, AnimeDetail } from "@/types/anime.types";

// Import Sections
import { BasicInfoSection } from "./components/BasicInfoSection";
import { PublishingSection } from "./components/PublishingSection";
import { GenreStudioSection } from "./components/GenreStudioSection";
import { RatingsSettingsSection } from "./components/RatingsSettingsSection";

type FormValues = Omit<CreateAnimeRequest, "genreIds" | "studioIds" | "titleOther"> & {
  titleOther: string[];
  genreIds: number[];
  studioIds: number[];
};

export default function AnimeFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      titleVi: "",
      titleOther: [],
      slug: "",
      description: "",
      thumbnailUrl: "",
      bannerUrl: "",
      status: "ONGOING",
      type: "TV",
      totalEpisodes: undefined,
      episodeDuration: undefined,
      airedFrom: "",
      airedTo: "",
      season: undefined,
      year: undefined,
      ageRating: undefined,
      malScore: undefined,
      isFeatured: false,
      genreIds: [],
      studioIds: [],
    },
  });

  // Map AnimeDetail to FormValues
  const populateForm = useCallback((anime: AnimeDetail) => {
    reset({
      title: anime.title || "",
      titleVi: anime.titleVi || "",
      titleOther: anime.titleOther || [],
      slug: anime.slug || "",
      description: anime.description || "",
      thumbnailUrl: anime.thumbnailUrl || "",
      bannerUrl: anime.bannerUrl || "",
      status: anime.status,
      type: anime.type,
      totalEpisodes: anime.totalEpisodes ?? undefined,
      episodeDuration: anime.episodeDuration ?? undefined,
      airedFrom: anime.airedFrom || "",
      airedTo: anime.airedTo || "",
      season: anime.season ?? undefined,
      year: anime.year ?? undefined,
      ageRating: anime.ageRating ?? undefined,
      malScore: anime.malScore ?? undefined,
      isFeatured: !!anime.isFeatured,
      genreIds: anime.genres?.map(g => g.id) || [],
      studioIds: anime.studios?.map(s => s.id) || [],
    });
  }, [reset]);

  // Load data
  useEffect(() => {
    const init = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          animeService.getGenres(),
          animeService.getStudios()
        ]);
        setGenres(gRes.data);
        setStudios(sRes.data);

        if (isEdit && id) {
          const detailId = Number(id);
          const stateAnime = location.state?.anime as AnimeDetail | undefined;
          
          if (stateAnime) {
            populateForm(stateAnime);
          }

          const data = await animeService.getAnimeById(detailId);
          populateForm(data.data);
        }
      } catch (err) {
        setError("Không thể tải thông tin cần thiết.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isEdit, id, location.state, populateForm]);

  // Auto-generate slug from title (only for new anime)
  const watchedTitle = watch("title");
  useEffect(() => {
    if (isEdit) return;
    const slug = watchedTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setValue("slug", slug, { shouldValidate: false });
  }, [watchedTitle, isEdit, setValue]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    setError(null);
    try {
      const payload: CreateAnimeRequest = {
        ...data,
        malScore: data.malScore ? Number(data.malScore) : undefined,
        totalEpisodes: data.totalEpisodes ? Number(data.totalEpisodes) : undefined,
        episodeDuration: data.episodeDuration ? Number(data.episodeDuration) : undefined,
        year: data.year ? Number(data.year) : undefined,
        airedFrom: data.airedFrom || undefined,
        airedTo: data.airedTo || undefined,
        season: data.season || undefined,
        ageRating: data.ageRating || undefined,
      };

      if (isEdit && id) {
        await animeService.updateAnime(Number(id), payload);
      } else {
        await animeService.createAnime(payload);
      }
      navigate("/admin/animes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi, vui lòng thử lại.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-20">
        <div className="relative">
           <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-100 rounded-full animate-pulse"></div>
           </div>
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Đang tải thông tin phim...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-[1400px] mx-auto pb-10">
      {/* Sticky Header */}
      <LightPanel className="sticky top-0 z-30 flex items-center justify-between py-4 px-6 shadow-md border-b border-slate-100 backdrop-blur-sm bg-white/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
            {isEdit ? "CẬP NHẬT ANIME" : "TRÌNH TẠO ANIME MỚI"}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Hệ thống quản trị HHKungfu</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 font-bold h-10 px-6 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => navigate("/admin/animes")}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-bold h-10 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Lưu thay đổi" : "Xuất bản Anime"}
          </Button>
        </div>
      </LightPanel>

      {error && (
        <div className="rounded-xl border-2 border-red-100 bg-red-50/50 px-6 py-4 text-sm font-bold text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">!</div>
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column: Data Input */}
        <div className="space-y-6">
          <BasicInfoSection register={register} errors={errors} watch={watch} setValue={setValue} />
          
          <PublishingSection register={register} watch={watch} setValue={setValue} />
          
          <GenreStudioSection genres={genres} studios={studios} watch={watch} setValue={setValue} />
        </div>

        {/* Right Column: Media and Settings */}
        <div className="space-y-6 lg:sticky lg:top-24 self-start">
          <RatingsSettingsSection register={register} watch={watch} setValue={setValue} />
          
          <LightPanel className="bg-slate-900 border-slate-800 py-4 px-6">
             <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Mẹo nhỏ</p>
             <p className="text-xs text-slate-300 leading-relaxed">Luôn kiểm tra kỹ Slug trước khi lưu để đảm bảo chính xác đường dẫn cho người dùng.</p>
          </LightPanel>
        </div>
      </div>
    </form>
  );
}
