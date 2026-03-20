// Banner ảnh nền phía trên trang, hỗ trợ bannerUrl, fallback blur từ thumbnail, và nút back trên mobile.
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  bannerUrl?: string | null;
  thumbnailUrl?: string | null;
  onBack: () => void;
}

export function HeroBanner({ title, bannerUrl, thumbnailUrl, onBack }: Props) {
  return (
    <section className="relative w-full h-44 md:h-72 overflow-hidden bg-muted/20">
      {bannerUrl ? (
        <img src={bannerUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      ) : thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-30 brightness-50" />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <button
        type="button"
        onClick={onBack}
        className="md:hidden absolute top-4 left-4 z-20 flex items-center justify-center p-2 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </section>
  );
}