// Tiêu đề section tái sử dụng, gồm icon tùy chọn bên trái và link "Xem tất cả" bên phải.
import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  title: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}

export function SectionHeader({ title, icon, action }: Props) {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={headerRef} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 mb-2 will-change-[transform,opacity]">
      <div className="flex items-center gap-3">
        {icon ? <span className="text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]">{icon}</span> : null}
        <h2 className="text-lg md:text-xl font-black tracking-tighter uppercase text-white/90">{title}</h2>
      </div>
      {action ? (
        <Link
          to={action.href}
          className="text-xs md:text-sm font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center gap-1 group"
        >
          {action.label} <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : null}
    </div>
  );
}