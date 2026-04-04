import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { Loader2, UploadCloud, AlertCircle, Image as ImageIcon, Layout as BannerIcon, X, Check } from "lucide-react";
import { animeService } from "@/services/animeService";
import { validateImage } from "@/utils/image-validation";
import { toast } from "sonner";
import type { AnimeSummary } from "@/types/anime.types";

interface ImageUploadDialogProps {
  anime: AnimeSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImageUploadDialog({ anime, onClose, onSuccess }: ImageUploadDialogProps) {
  // Pre-upload selection states
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect
  useEffect(() => {
    if (!anime) {
      setThumbFile(null);
      setBannerFile(null);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setThumbPreview(null);
      setBannerPreview(null);
    }
  }, [anime]);

  if (!anime) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "THUMBNAIL" | "BANNER") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Client-side validation (Magic Bytes, SVG scan, etc.)
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || "Ảnh không hợp lệ");
      e.target.value = "";
      return;
    }

    // 2. Set file and preview
    const previewUrl = URL.createObjectURL(file);
    if (type === "THUMBNAIL") {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbFile(file);
      setThumbPreview(previewUrl);
    } else {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerFile(file);
      setBannerPreview(previewUrl);
    }
    // Reset input so searching for the same file again works
    e.target.value = "";
  };

  const handleConfirmAll = async () => {
    if (!thumbFile && !bannerFile) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      // 1. Upload Thumbnail if selected
      if (thumbFile) {
        await animeService.uploadAnimeImage(anime.id, thumbFile, "THUMBNAIL");
        setThumbFile(null);
        if (thumbPreview) URL.revokeObjectURL(thumbPreview);
        setThumbPreview(null);
        successCount++;
      }

      // 2. Upload Banner if selected
      if (bannerFile) {
        await animeService.uploadAnimeImage(anime.id, bannerFile, "BANNER");
        setBannerFile(null);
        if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Đã cập nhật ${successCount} ảnh media cho: ${anime.title}`);
        onSuccess(); // Trigger refetch in table
        onClose(); // Đóng component sau khi xong
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi cập nhật media";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelSelection = (type: "THUMBNAIL" | "BANNER") => {
    if (type === "THUMBNAIL") {
      setThumbFile(null);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
    } else {
      setBannerFile(null);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
  };

  return (
    <Dialog open={!!anime} onOpenChange={(open) => !open && !isUploading && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-slate-900 px-6 py-5 relative">
          {/* Nút thoát X */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </Button>

          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
               <UploadCloud className="h-6 w-6" />
            </div>
            Quản lý Media
          </DialogTitle>
          <p className="text-slate-400 text-[11px] mt-1 font-bold uppercase tracking-widest">
            Anime: <span className="text-blue-400">{anime.title}</span>
          </p>
        </DialogHeader>

        <div className="p-6 space-y-7 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Thumbnail Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ImageIcon className="h-4 w-4 text-blue-500" /> Ảnh bìa đứng (2:3)
               </h4>

               <div className="flex gap-2">
                  {thumbFile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] uppercase font-bold text-slate-400 hover:text-red-500" 
                      onClick={() => cancelSelection("THUMBNAIL")} 
                      disabled={isUploading}
                    > Hủy </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] uppercase font-bold text-blue-600 border-blue-100 hover:bg-blue-50"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={isUploading}
                  > {thumbFile ? "Thay đổi" : "Chọn ảnh"} </Button>
               </div>
            </div>
            
            <div className={`relative aspect-[2/3] w-full max-w-[160px] mx-auto rounded-2xl border-2 border-dashed ${thumbFile ? 'border-amber-400 bg-amber-50/10' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-center overflow-hidden transition-all`}>
               {thumbPreview || anime.thumbnailUrl ? (
                 <img src={thumbPreview || anime.thumbnailUrl || ""} className={`h-full w-full object-cover ${thumbPreview ? 'opacity-90 scale-105 saturate-100' : 'saturate-50 contrast-125'}`} alt="Thumbnail" />
               ) : (
                 <div className="text-slate-300 flex flex-col items-center gap-2 p-4 text-center">
                    <ImageIcon className="h-10 w-10 opacity-20 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Trống</span>
                 </div>
               )}

               {thumbPreview && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-extrabold px-3 py-1 rounded-full shadow-lg border border-amber-400">CHỜ TẢI LÊN</div>
               )}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100/80"></div>

          {/* Banner Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <BannerIcon className="h-4 w-4 text-indigo-500" /> Ảnh bìa ngang (16:9)
               </h4>

               <div className="flex gap-2">
                  {bannerFile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] uppercase font-bold text-slate-400 hover:text-red-500" 
                      onClick={() => cancelSelection("BANNER")} 
                      disabled={isUploading}
                    > Hủy </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] uppercase font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploading}
                  > {bannerFile ? "Thay đổi" : "Chọn ảnh"} </Button>
               </div>
            </div>
            
            <div className={`relative aspect-video w-full rounded-2xl border-2 border-dashed ${bannerFile ? 'border-amber-400 bg-amber-50/10' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-center overflow-hidden transition-all`}>
               {bannerPreview || anime.bannerUrl ? (
                 <img src={bannerPreview || anime.bannerUrl || ""} className={`h-full w-full object-cover ${bannerPreview ? 'opacity-90 scale-105 saturate-100' : 'saturate-50 contrast-125'}`} alt="Banner" />
               ) : (
                 <div className="text-slate-300 flex flex-col items-center gap-2 p-6 text-center">
                    <BannerIcon className="h-10 w-10 opacity-20 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Trống</span>
                 </div>
               )}

               {bannerPreview && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-extrabold px-3 py-1 rounded-full shadow-lg border border-amber-400">CHỜ TẢI LÊN</div>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
             <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none">Chế độ an toàn</p>
             </div>
             <p className="text-[11px] text-blue-600/70 leading-relaxed font-bold">
                Tối đa 2MB/file. JPG/PNG/WEBP. Luôn scan Magic Bytes & SVG trước khi xử lý.
             </p>
          </div>
        </div>

        {/* Unified Bottom Confirmation Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
           {(!thumbFile && !bannerFile) ? (
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-2">Vui lòng chọn ảnh trước khi cập nhật</p>
           ) : (
             <div className="flex items-center gap-2 px-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">Đã sẵn sàng {(thumbFile && bannerFile) ? "2" : "1"} file</p>
             </div>
           )}

           <Button 
              className="h-11 px-8 min-w-[200px] bg-blue-600 text-white font-extrabold text-[12px] uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              disabled={(!thumbFile && !bannerFile) || isUploading}
              onClick={handleConfirmAll}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Xác nhận tải lên
                </>
              )}
            </Button>
        </div>

        <div className="hidden">
           <input type="file" ref={thumbInputRef} accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, "THUMBNAIL")} />
           <input type="file" ref={bannerInputRef} accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, "BANNER")} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
