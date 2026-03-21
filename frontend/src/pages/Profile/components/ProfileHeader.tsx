import { useAuthStore } from "@/store/authStore";
import type { UserProfileDto } from "@/types/user.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Calendar, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  profile: UserProfileDto;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isOwnProfile = currentUser?.id === profile.id;

  const formattedDate = profile.createdAt 
    ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))
    : "N/A";

  return (
    <div className="relative w-full">
      {/* Mobile Sticky Header (Wireframe: ← Trang cá nhân | ⚙) */}
      <div className="sticky top-0 z-50 md:hidden flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-md border-b">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-bold text-lg">Trang cá nhân</h2>
        <div className="flex items-center gap-1">
          {isOwnProfile && (
            <button 
              onClick={() => navigate("/settings")}
              className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden md:rounded-xl bg-card border-x-0 md:border border-y md:border shadow-sm">
        {/* Cover Banner (Wireframe: h-40 desktop, h-28 mobile) */}
        <div className="h-28 md:h-40 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-background border-b" />

        <div className="px-5 md:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Avatar (Wireframe: w-24 h-24, -mt-12) */}
            <div className="relative -mt-12 flex-shrink-0">
              <div className="h-24 w-24 rounded-2xl border-4 border-card bg-muted overflow-hidden shadow-xl">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 flex flex-col gap-1.5 pt-0 md:pt-4">
              <div className="flex flex-wrap items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    {profile.username}
                  </h1>
                  {profile.isVip && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-purple-600 border-none px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                      ✨ VIP
                    </Badge>
                  )}
                </div>

                {isOwnProfile && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden md:flex gap-2 rounded-full px-4 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Chỉnh sửa</span>
                  </Button>
                )}
              </div>
              
              <p className="text-muted-foreground text-sm max-w-2xl line-clamp-2 italic md:not-italic">
                {profile.bio || "Người dùng này chưa có lời giới thiệu nào."}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>Tham gia: {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
