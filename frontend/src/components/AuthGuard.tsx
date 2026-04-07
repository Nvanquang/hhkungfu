import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthGuard — wraps protected routes in React Router.
 *
 * Behaviour:
 *   • While bootstrapping (useAuthInit's initial refresh/me cycle):
 *       → render a centered full-screen spinner
 *   • After bootstrap, if NOT authenticated:
 *       → redirect to /login, preserving the intended URL in location state
 *         so the login page can return the user there after a successful login
 *   • Authenticated:
 *       → render child routes via <Outlet />
 *
 * Usage in App.tsx:
 *   <Route element={<AuthGuard />}>
 *     <Route path="/me/history" element={<History />} />
 *     ...
 *   </Route>
 */
export const AuthGuard = () => {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  // Show a spinner while the initial token refresh + /me fetch is running.
  // This prevents a flash of "redirect to /login" for users who ARE logged in.
  if (isBootstrapping) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  return <Outlet />;
};
