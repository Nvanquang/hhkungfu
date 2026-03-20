// Banner quảng cáo nâng cấp VIP, chỉ hiển thị khi user chưa có VIP.
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function VipBanner() {
  const navigate = useNavigate();
  return (
    <section className="rounded-2xl overflow-hidden border border-border/50">
      <div className="relative px-6 py-8 md:px-10 md:py-10 bg-gradient-to-r from-purple-700/70 via-fuchsia-600/40 to-amber-400/40">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.25),transparent_40%)]" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2 text-white">
            <div className="inline-flex items-center gap-2 font-semibold">
              <Crown className="h-5 w-5" />
              NÂNG CẤP VIP — Xem không giới hạn
            </div>
            <div className="grid gap-1 text-sm text-white/90">
              <p>✓ Xem 1080p</p>
              <p>✓ Không quảng cáo</p>
              <p>✓ Tải xuống xem offline</p>
              <p className="pt-1 font-semibold">Chỉ từ 59,000đ / tháng</p>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-white/90 gap-2" onClick={() => navigate("/vip")}>
            <Sparkles className="h-4 w-4" />
            Dùng thử VIP ngay
          </Button>
        </div>
      </div>
    </section>
  );
}