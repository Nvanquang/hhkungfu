import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, User, LogOut, Settings, Clock, Bookmark, Crown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useLogout";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

interface WatchNavbarProps {
  animeTitle: string | null;
  animeSlug: string;
  episodeTitle: string | null;
  episodeNumber: number;
}

export function WatchNavbar({ animeTitle, animeSlug, episodeTitle, episodeNumber }: WatchNavbarProps) {
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="h-12 bg-black/90 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 text-sm">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img
            src="/logos/logo-hhkungfu.png"
            alt="Hhkungfu"
            className="h-12 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </Link>

        {animeTitle && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <Link
              to={`/anime/${animeSlug}`}
              className="text-white/70 hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            >
              {animeTitle}
            </Link>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <span className="text-white/90 truncate max-w-[120px] sm:max-w-[240px]">
          Tập {episodeNumber}
          {episodeTitle ? ` "${episodeTitle}"` : ""}
        </span>
      </div>

      {/* Right: user avatar with dropdown */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button 
                variant="ghost" 
                className="w-8 h-8 p-0 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl z-[60]">
              <div className="px-3 py-3 border-b border-border/50 mb-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tài khoản</p>
                <p className="font-bold text-foreground mt-1 truncate">{user.username}</p>
              </div>
              
              <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate(`/profile/${user.id}`)}>
                <User className="mr-3 w-4 h-4 text-primary" /> Trang cá nhân
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/me/bookmarks')}>
                <Bookmark className="mr-3 w-4 h-4 text-primary" /> Danh sách bookmarks
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/me/history')}>
                <Clock className="mr-3 w-4 h-4 text-primary" /> Lịch sử xem
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/settings')}>
                <Settings className="mr-3 w-4 h-4 text-primary" /> Cài đặt
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-1 opacity-50" />
              
              {user.isVip && (
                <>
                  <DropdownMenuItem className="cursor-pointer text-amber-500 font-bold bg-amber-500/5 rounded-xl py-2.5 my-0.5" onClick={() => navigate('/vip')}>
                    <Crown className="mr-3 w-4 h-4 fill-amber-500/20" /> Gói VIP của tôi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 opacity-50" />
                </>
              )}
              
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-red-50/5 rounded-xl font-bold py-2.5 my-0.5">
                <LogOut className="mr-3 w-4 h-4" /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className="text-xs text-white/60 hover:text-white transition-colors">
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
}
