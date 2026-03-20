import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/router/ProtectedRoute";
import { useAuthInit } from "@/hooks/useAuthInit";

// Lazy load auth pages
const Login = lazy(() => import("@/pages/Auth/Login"));
const Register = lazy(() => import("@/pages/Auth/Register"));
const VerifyEmail = lazy(() => import("@/pages/Auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/Auth/ResetPassword"));
const OAuthSuccess = lazy(() => import("@/pages/Auth/OAuthSuccess"));

// Lazy load feature pages
const Home = lazy(() => import("@/pages/Home"));
const AnimeCatalog = lazy(() => import("@/pages/AnimeCatalog"));
const AnimeDetail = lazy(() => import("@/pages/AnimeDetail"));
const Search = lazy(() => import("@/pages/Search"));

// App wrapper to use hooks correctly within the context (though useAuthStore can be anywhere, it's fine inside App)
function AppContent() {
  useAuthInit();

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <Suspense fallback={<div className="flex justify-center p-20 min-h-screen items-center">Loading...</div>}>
        <Routes>
          {/* Main Layout Pages*/}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/anime" element={<AnimeCatalog />} />
            <Route path="/anime/:slug" element={<AnimeDetail />} />
            <Route path="/search" element={<Search />} />

            {/* Protected Routes Example */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div className="p-8">Protected Dashboard</div>} />
              <Route path="/history" element={<div className="p-8">Lịch sử xem</div>} />
              <Route path="/bookmarks" element={<div className="p-8">Danh sách yêu thích</div>} />
              <Route path="/profile" element={<div className="p-8">Trang cá nhân</div>} />
              <Route path="/settings" element={<div className="p-8">Cài đặt</div>} />
              <Route path="/vip" element={<div className="p-8">VIP</div>} />
            </Route>
          </Route>

          {/* Auth Pages without MainLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
