import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VipGateProps {
  thumbnailUrl?: string | null;
  episodeTitle?: string | null;
  episodeNumber: number;
}

export function VipGate({ thumbnailUrl, episodeTitle, episodeNumber }: VipGateProps) {
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
      {/* Blurred background thumbnail */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(8px)", transform: "scale(1.05)" }}
        />
      )}

      {/* Dark overlay 60% */}
      <div className="absolute inset-0 bg-black/60" />

      {/* VIP content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6 max-w-md">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Nội dung dành riêng cho VIP</h2>
          <p className="text-sm text-white/70">
            Tập {episodeNumber}
            {episodeTitle ? ` "${episodeTitle}"` : ""} và toàn bộ nội dung cao cấp
            chỉ dành cho thành viên VIP.
          </p>
        </div>

        <ul className="space-y-1.5 text-sm text-white/80 self-start w-full">
          {[
            "Xem 1080p không giới hạn",
            "Truy cập toàn bộ thư viện VIP",
            "Không quảng cáo",
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <span className="text-amber-400">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/vip"
          className={cn(
            buttonVariants({ size: "default" }),
            "w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0"
          )}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Nâng cấp VIP — Từ 59,000đ/th
        </Link>

        <p className="text-sm text-white/50">
          Đã có VIP?{" "}
          <Link to="/login" className="text-white underline underline-offset-2 hover:text-white/80">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
