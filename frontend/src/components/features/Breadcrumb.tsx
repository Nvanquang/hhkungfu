// Thanh điều hướng breadcrumb dùng chung cho tất cả các trang, nhận vào mảng items với label và href tùy chọn.
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Link to="/" className="flex items-center hover:text-foreground transition-colors shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            {isLast || !item.href ? (
              <span className={cn("truncate", isLast ? "text-foreground font-medium" : "")}>
                {item.label}
              </span>
            ) : (
              <Link to={item.href} className="truncate hover:text-foreground transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}