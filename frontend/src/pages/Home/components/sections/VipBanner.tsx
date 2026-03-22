// Banner quảng cáo nâng cấp VIP, chỉ hiển thị khi user chưa có VIP.
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function VipBanner() {
  const navigate = useNavigate();
  const bannerRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: bannerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        }
      });
      tl.fromTo(
        bannerRef.current,
        { opacity: 0, scale: 0.95, filter: "brightness(0.5) blur(12px)" },
        { opacity: 1, scale: 1, filter: "brightness(1) blur(0px)", duration: 1.0, ease: "power3.out" }
      );
      // Continuous breath after entrance
      tl.to(
        bannerRef.current,
        { scale: 1.01, duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut" },
        "+=0.5"
      );

      // Light sweep
      if (lightRef.current) {
        const sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 5.5 });
        sweepTl
          .set(lightRef.current, { x: "-100%", opacity: 0 })
          .to(lightRef.current, { x: "-100%", opacity: 0.6, duration: 0.01 })
          .to(lightRef.current, { x: "400%", duration: 1.5, ease: "power1.inOut" })
          .to(lightRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
        sweepTl.delay(2); // start slightly after entrance
      }

    }, bannerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={bannerRef} className="rounded-2xl overflow-hidden border border-orange-500/30 will-change-[transform,opacity,filter] shadow-[0_10px_40px_rgba(249,115,22,0.15)]">
      <div className="relative px-6 py-8 md:px-10 md:py-10 bg-gradient-to-r from-zinc-950 via-[rgba(180,50,0,0.8)] to-[rgba(255,120,0,0.6)]">
        
        {/* Light sweep layer */}
        <div
          ref={lightRef}
          className="pointer-events-none absolute inset-y-0 w-[20%] z-10"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.2) 60%, transparent 100%)",
            transform: "skewX(-20deg)",
            filter: "blur(6px) drop-shadow(0 0 20px rgba(255,255,255,0.8))",
          }}
        />

        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.25),transparent_40%)]" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center z-20">
          <div className="space-y-2 text-white">
            <div className="inline-flex items-center gap-2 font-semibold">
              <Crown className="h-5 w-5" />
              NÂNG CẤP VIP — Xem không giới hạn
            </div>
            <div className="grid gap-1 text-sm text-white/90">
              <p>✓ Box phim độ nét 1080p</p>
              <p>✓ Không có quảng cáo</p>
              <p>✓ Tốc độ băng thông cao nhất</p>
              <p className="pt-2 font-bold text-orange-300 drop-shadow-[0_0_8px_rgba(255,165,0,0.5)]">Chỉ từ 59,000đ / tháng</p>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-orange-100 gap-2 font-bold shadow-[0_0_20px_rgba(255,255,255,0.6)] px-8 scale-105" onClick={() => navigate("/vip")}>
            <Sparkles className="h-4 w-4" />
            Dùng thử VIP ngay
          </Button>
        </div>
      </div>
    </section>
  );
}