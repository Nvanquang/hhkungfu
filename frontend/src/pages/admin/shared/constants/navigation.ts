import type { LucideIcon } from "lucide-react";
import { BarChart3, Clapperboard, CreditCard, LayoutDashboard, MessageSquare, Tags, Users } from "lucide-react";

export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Tổng quan", to: "/admin", icon: LayoutDashboard },
  { label: "Anime", to: "/admin/animes", icon: Clapperboard },
  { label: "Thể loại & Studio", to: "/admin/genres-studios", icon: Tags },
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Bình luận & Đánh giá", to: "/admin/comments", icon: MessageSquare },
  { label: "Gói & Thanh toán", to: "/admin/subscriptions", icon: CreditCard },
  { label: "Phân tích", to: "/admin/analytics", icon: BarChart3 },
];
