import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute } from "@/components/router/ProtectedRoute";
import { useAuthInit } from "@/hooks/useAuthInit";

// Lazy load auth pages
const Login = lazy(() => import("@/pages/Auth/Login"));
const Register = lazy(() => import("@/pages/Auth/Register"));
const VerifyEmail = lazy(() => import("@/pages/Auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/Auth/ResetPassword"));
const OAuthSuccess = lazy(() => import("@/pages/Auth/OAuthSuccess"));
const Logout = lazy(() => import("@/pages/Auth/Logout"));

// Simple placeholder for Home
const Home = () => (
  <div className="p-8 text-center text-xl">
    Welcome to Hhkungfu Home. <a href="/login" className="text-primary hover:underline">Login here</a>
  </div>
);

// App wrapper to use hooks correctly within the context (though useAuthStore can be anywhere, it's fine inside App)
function AppContent() {
  useAuthInit();

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <Suspense fallback={<div className="flex justify-center p-20">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/logout" element={<Logout />} />
          </Route>

          {/* Protected Routes Example */}
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard" element={<div className="p-8">Protected Dashboard</div>} />
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
