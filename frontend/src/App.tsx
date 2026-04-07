import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";
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
const Watch = lazy(() => import("@/pages/Watch"));

// User module pages
const Profile = lazy(() => import("@/pages/Profile"));
const History = lazy(() => import("@/pages/History"));
const PaymentHistory = lazy(() => import("@/pages/PaymentHistory"));
const Bookmarks = lazy(() => import("@/pages/Bookmarks"));
const Settings = lazy(() => import("@/pages/Settings"));
const VerifyPasswordChange = lazy(() => import("@/pages/Settings/VerifyPasswordChange"));

// VIP
const VipPlans = lazy(() => import("@/pages/Vip/VipPlans"));
const VipCheckout = lazy(() => import("@/pages/Vip/VipCheckout"));
const PaymentResult = lazy(() => import("@/pages/Vip/PaymentResult"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout/index"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard/index"));
const AdminAnimeList = lazy(() => import("@/pages/admin/AnimeList/index"));
const AdminAnimeForm = lazy(() => import("@/pages/admin/AnimeForm/index"));
const AdminEpisodeManager = lazy(() => import("@/pages/admin/EpisodeManager/index"));
const AdminVideoUpload = lazy(() => import("@/pages/admin/VideoUpload/index"));
const AdminGenreStudio = lazy(() => import("@/pages/admin/GenreStudio/index"));
const AdminUserList = lazy(() => import("@/pages/admin/UserList/index"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics/index"));
const AdminCommentModeration = lazy(() => import("@/pages/admin/CommentModeration/index"));
const AdminSubscriptionManager = lazy(() => import("@/pages/admin/SubscriptionManager/index"));

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

            {/* Public Profile */}
            <Route path="/profile/:userId" element={<Profile />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div className="p-8">Protected Dashboard</div>} />
              <Route path="/me/history" element={<History />} />
              <Route path="/me/payments" element={<PaymentHistory />} />
              <Route path="/me/bookmarks" element={<Bookmarks />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/verify-password" element={<VerifyPasswordChange />} />
              <Route path="/vip/checkout" element={<VipCheckout />} />
            </Route>

            {/* Public VIP Pages */}
            <Route path="/vip" element={<VipPlans />} />
            <Route path="/vip/result" element={<PaymentResult />} />
          </Route>

          {/* Admin routes: must be authenticated AND have ADMIN role */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={["ADMIN"]} asOutlet />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="animes" element={<AdminAnimeList />} />
                <Route path="animes/new" element={<AdminAnimeForm />} />
                <Route path="animes/:id/edit" element={<AdminAnimeForm />} />
                <Route path="animes/:id/episodes" element={<AdminEpisodeManager />} />
                <Route path="animes/:id/episodes/new" element={<AdminEpisodeManager />} />
                <Route path="upload/:episodeId" element={<AdminVideoUpload />} />
                <Route path="genres-studios" element={<AdminGenreStudio />} />
                <Route path="users" element={<AdminUserList />} />
                <Route path="comments" element={<AdminCommentModeration />} />
                <Route path="subscriptions" element={<AdminSubscriptionManager />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
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

          {/* Watch page — standalone layout (no Header/Footer) */}
          <Route path="/watch/:animeSlug/:episodeNumber" element={<Watch />} />

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
