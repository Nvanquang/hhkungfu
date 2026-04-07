import { useMemo, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useLogout";
import { ADMIN_NAV_ITEMS } from "@/pages/admin/shared/constants/navigation";
import { Sidebar } from "@/pages/admin/AdminLayout/components/Sidebar";
import { MobileHeader } from "@/pages/admin/AdminLayout/components/MobileHeader";
import { MobileNav } from "@/pages/admin/AdminLayout/components/MobileNav";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();
  const logout = useLogout();
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const match = ADMIN_NAV_ITEMS.find((item) => item.to === location.pathname);
    return match?.label ?? "Quản trị";
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.add("admin-page");
    return () => {
      document.body.classList.remove("admin-page");
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Desktop Sidebar */}
        <Sidebar 
          user={user} 
          logout={() => logout()} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Mobile Header */}
          <MobileHeader
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            pageTitle={pageTitle}
          />

          {/* Mobile Navigation Menu */}
          {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
