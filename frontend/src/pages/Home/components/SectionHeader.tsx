// Tiêu đề section tái sử dụng, gồm icon tùy chọn bên trái và link "Xem tất cả" bên phải.
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}

export function SectionHeader({ title, icon, action }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-primary">{icon}</span> : null}
        <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {action ? (
        <Link
          to={action.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          {action.label} <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}