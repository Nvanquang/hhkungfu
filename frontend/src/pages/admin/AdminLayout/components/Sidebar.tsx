import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui";
import { ADMIN_NAV_ITEMS } from "@/pages/admin/shared/constants/navigation";
import { ChevronLeft, ChevronRight, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserDto } from "@/types";

interface SidebarProps {
  user: UserDto | null;
  logout: () => void | Promise<void>;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export function Sidebar({ user, logout, isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <aside className={cn(
      "hidden shrink-0 border-r border-slate-200 bg-white p-4 lg:flex flex-col transition-all duration-300 ease-in-out relative h-screen sticky top-0",
      isCollapsed ? "w-20" : "w-52"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-800 transition-transform active:scale-95"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Logo Section */}
      <div className={cn(
        "mb-8 flex items-center gap-3 overflow-hidden transition-all duration-300",
        isCollapsed ? "px-1 justify-center" : "px-2"
      )}>
        <Link to="/admin" className="block shrink-0">
          <img
            src="/logos/logo-hhkungfu.png"
            alt="Logo"
            className={cn("w-auto object-contain transition-all duration-300", isCollapsed ? "h-10" : "h-12")}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {/* Back to Home Link */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition",
            isCollapsed && "justify-center"
          )}
          title="Về trang khách"
        >
          <Home className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Về trang chủ</span>}
        </Link>

        <div className="my-4 border-t border-slate-100 mx-2" />

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              title={isCollapsed ? item.label : ""}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  isCollapsed && "justify-center",
                  isActive
                    ? "bg-blue-50 font-bold text-blue-600 shadow-sm ring-1 ring-blue-100/50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", isCollapsed ? "h-5 w-5" : "h-4.5 w-4.5")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className={cn(
        "mt-auto border-t border-slate-200 pt-4 px-2",
        isCollapsed ? "flex flex-col items-center gap-4" : "block"
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-9 w-9 rounded-full bg-slate-200 object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 border-2 border-white shadow-sm">
                  {user?.username?.charAt(0).toUpperCase() || "A"}
                </div>
              )}
              <p className="text-sm font-bold text-slate-800 truncate">{user?.username ?? "Admin"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </>
        ) : (
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
