const BENEFITS = [
  {
    icon: "📺",
    title: "Xem 1080p",
    desc: "Chất lượng hình ảnh cao nhất",
  },
  {
    icon: "🎯",
    title: "Toàn bộ nội dung VIP",
    desc: "Độc quyền không giới hạn",
  },
  {
    icon: "⬇️",
    title: "Tải về xem offline",
    desc: "Xem mọi lúc mọi nơi",
  },
  {
    icon: "🚫",
    title: "Không quảng cáo",
    desc: "Trải nghiệm tập trung",
  },
];

export function BenefitGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BENEFITS.map((b) => (
        <div
          key={b.title}
          className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/60 p-4 text-center backdrop-blur-sm"
        >
          <span className="text-3xl">{b.icon}</span>
          <p className="text-sm font-semibold text-foreground">{b.title}</p>
          <p className="text-xs text-muted-foreground">{b.desc}</p>
        </div>
      ))}
    </div>
  );
}
