import { NavLink } from "react-router-dom";
import { ADMIN_NAV_ITEMS } from "@/pages/admin/shared/constants/navigation";

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <nav className="space-y-1.5">
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            onClick={onClose}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${
                isActive ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
