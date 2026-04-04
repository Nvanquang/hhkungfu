import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { AnimeSummary } from "@/types/anime.types";

interface DeleteAnimeDialogProps {
  anime: AnimeSummary | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteAnimeDialog({ anime, onClose, onConfirm, isLoading }: DeleteAnimeDialogProps) {
  if (!anime) return null;

  return (
    <Dialog open={!!anime} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6 border border-red-100/50 shadow-sm animate-in zoom-in duration-500">
             <AlertTriangle className="h-10 w-10" />
          </div>
          
          <DialogHeader className="p-0 mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Xác nhận xóa?
            </DialogTitle>
            <p className="text-slate-500 text-sm leading-relaxed px-2 font-medium">
              Bạn đang chuẩn bị xóa Anime <span className="text-red-600 font-bold">"{anime.title}"</span>. Hành động này là vĩnh viễn và không thể khôi phục.
            </p>
          </DialogHeader>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-500 font-extrabold uppercase text-[11px] tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all"
              onClick={onClose}
              disabled={isLoading}
            >
              Quay lại
            </Button>
            <Button
              variant="default"
              className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-extrabold uppercase text-[11px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý
                </>
              ) : (
                "Xóa vĩnh viễn"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tính năng bảo mật: Quản trị viên cao cấp</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
