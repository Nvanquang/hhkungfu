import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface RoleGuardProps {
  /** At least one of these roles must be in the user's roles array */
  allowedRoles: string[];
  /**
   * Rendered when the user lacks the required role.
   * Defaults to a redirect to /unauthorized.
   */
  fallback?: ReactNode;
  /**
   * Set to true when using RoleGuard as a React Router <Route element>.
   * Renders <Outlet /> for children instead of the `children` prop.
   */
  asOutlet?: boolean;
  children?: ReactNode;
}

/**
 * RoleGuard — conditionally render UI or route children based on user roles.
 *
 * ── Usage as a Route element (wraps child routes) ──
 *   <Route element={<AuthGuard />}>
 *     <Route element={<RoleGuard allowedRoles={["ADMIN"]} asOutlet />}>
 *       <Route path="/admin" element={<AdminLayout />} />
 *     </Route>
 *   </Route>
 *
 * ── Usage as an inline wrapper (wraps JSX children) ──
 *   <RoleGuard allowedRoles={["ADMIN"]} fallback={<p>Access denied</p>}>
 *     <AdminPanel />
 *   </RoleGuard>
 *
 * Note: Always nest inside <AuthGuard /> for route usage — RoleGuard assumes
 * the user IS authenticated (it only checks role, not auth status).
 */
export const RoleGuard = ({
  allowedRoles,
  fallback,
  asOutlet = false,
  children,
}: RoleGuardProps) => {
  const roles = useAuthStore((s) => s.roles);
  const hasRole = allowedRoles.some((r) => roles.includes(r));

  if (!hasRole) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  if (asOutlet) return <Outlet />;
  return <>{children}</>;
};
