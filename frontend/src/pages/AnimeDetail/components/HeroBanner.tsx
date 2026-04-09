import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  bannerUrl?: string | null;
  thumbnailUrl?: string | null;
  onBack: () => void;
  children?: ReactNode;
}

export function HeroBanner({ bannerUrl, thumbnailUrl, onBack, children }: Props) {
  return (
    <section className="relative w-full flex flex-col justify-end bg-background min-h-[50vh]">
      {/* Lớp nền ảnh banner phủ kín chiều rộng màn hình, đóng vai trò như Hero Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={bannerUrl || thumbnailUrl || ""}
          alt=""
          className="hero-bg-img w-full h-full object-cover object-top lg:object-center opacity-90 transition-opacity duration-1000"
          aria-hidden="true"
        />
        {/* Lớp phủ dốc (gradient) từ bên trái sang: Giúp vùng chứa chữ (bên trái) đủ tối để đọc nét, nhưng vùng bên phải ảnh vẫn sáng rực rỡ */}
        <div className="absolute inset-y-0 left-0 w-3/4 md:w-3/5 bg-gradient-to-r from-background/95 via-background/60 to-transparent hidden md:block" />

        {/* Lớp gradient lớn từ dưới lên để làm tối dần, giúp phần nội dung chèn lên (children) luôn rõ nét và chuyển cảnh mượt xuống nội dung trang */}
        <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-background via-background/95 via-40% to-transparent" />

        {/* Làm tối mờ cạnh trên một chút để nút back và breadcrumb dễ nhìn hơn */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/60 to-transparent" />
      </div>

      {/* Vùng không gian cho children lồng vào trong banner (ví dụ: AnimeInfoSection) */}
      <div className="relative z-10 w-full pt-20 md:pt-40 pb-6 md:pb-12">
        {children}
      </div>

      {/* Nút back trên Mobile */}
      <button
        type="button"
        onClick={onBack}
        className="md:hidden absolute top-4 left-4 z-30 flex items-center justify-center p-2 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm text-foreground shadow-sm transition-colors"
        aria-label="Quay lại"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </section>
  );
}