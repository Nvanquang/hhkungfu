import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Crown, LogOut, Settings, Clock, Bookmark, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { 
  Button, 
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverAnchor,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  ScrollArea
} from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";
import { cn } from "@/lib/utils";
import type { AnimeSummary } from "@/types";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);

  const { data: genreRes } = useQuery({
    queryKey: ["genres"],
    queryFn: animeService.getGenres,
    staleTime: 1000 * 60 * 60,
  });
  const genres = genreRes?.data?.items || [];

  const { data: searchRes, isFetching: isSearchFetching } = useQuery({
    queryKey: ["header-search", debouncedQuery],
    queryFn: () => animeService.searchAnimes({ key: debouncedQuery, page: 1, limit: 10 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });
  const suggestions = searchRes?.data?.items ?? [];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e?: FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?key=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (slug: string) => {
    navigate(`/anime/${slug}`);
    setSearchQuery("");
    setIsFocused(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const showDropdown = isFocused && (debouncedQuery.length > 0 || isSearchFetching);

  return (
    <>
      {/* Backdrop for focused search */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] transition-opacity duration-300 pointer-events-none opacity-0",
          isFocused && "opacity-100 pointer-events-auto"
        )}
        onClick={() => setIsFocused(false)}
      />

      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled 
            ? "h-16 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
            : "h-20 bg-gradient-to-b from-background/90 to-transparent",
          isFocused && "bg-background/95 backdrop-blur-lg border-b border-border/50 h-16 shadow-2xl"
        )}
      >
        <div className="container h-full mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight shrink-0">
            <span>🎬 Hhkungfu</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center relative">
            
            {/* Search Component */}
            <div className={cn(
              "relative w-full transition-all duration-300",
              isFocused ? "max-w-2xl" : "max-w-sm"
            )}>
              <Popover open={showDropdown} onOpenChange={setIsFocused}>
                <PopoverAnchor asChild>
                  <form onSubmit={handleSearch} className="relative group">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                      isFocused ? "text-primary" : "text-muted-foreground"
                    )} />
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Tìm anime, tên nhân vật..."
                      className={cn(
                        "w-full pl-9 pr-10 bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all duration-300",
                        isFocused && "bg-background shadow-lg pr-12 ring-1 ring-primary/20 border-primary/20",
                        !isFocused && "hover:bg-muted/80"
                      )}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       {isSearchFetching && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </PopoverAnchor>

                <PopoverContent 
                  className="p-0 w-[var(--radix-popover-trigger-width)] mt-2 border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command className="bg-transparent">
                    <CommandList className="max-h-none">
                      <ScrollArea className="h-full max-h-[70vh]">
                        {isSearchFetching && suggestions.length === 0 ? (
                           <div className="p-4 space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-12 h-16 rounded-md bg-muted shrink-0" />
                                <div className="flex-1 py-1 space-y-2">
                                  <div className="h-4 bg-muted rounded w-3/4" />
                                  <div className="h-3 bg-muted rounded w-1/4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : suggestions.length > 0 ? (
                          <CommandGroup heading={<span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Kết quả tìm kiếm</span>}>
                            {suggestions.map((anime: AnimeSummary) => (
                              <CommandItem
                                key={anime.id}
                                onSelect={() => handleSelectSuggestion(anime.slug as string)}
                                className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted/80 transition-all rounded-lg mx-1 my-0.5"
                              >
                                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-muted transition-transform group-hover:scale-105 shrink-0 shadow-sm">
                                  {anime.thumbnailUrl ? (
                                    <img 
                                      src={anime.thumbnailUrl} 
                                      alt={anime.title as string} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                      <Search className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                    {anime.titleVi || anime.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase">
                                      {anime.type}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {anime.year || "N/A"}{anime.totalEpisodes ? ` • ${anime.totalEpisodes} tập` : ""}
                                    </span>
                                    {anime.malScore && (
                                       <span className="text-[11px] text-yellow-500 font-medium">
                                        ⭐ {anime.malScore}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                            <div className="p-2 pt-0">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-center text-xs font-bold text-primary hover:bg-primary/10 transition-colors py-2 rounded-xl"
                                onClick={() => handleSearch()}
                              >
                                Xem tất cả kết quả cho "{searchQuery}"
                              </Button>
                            </div>
                          </CommandGroup>
                        ) : (
                          <CommandEmpty className="py-10 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 opacity-20" />
                              <p>Không tìm thấy anime nào phù hợp</p>
                            </div>
                          </CommandEmpty>
                        )}
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {!isFocused && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" className="font-semibold text-sm h-12 hover:bg-transparent hover:text-primary transition-all px-0" />}>
                    Thể loại ▾
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[450px] p-4 grid grid-cols-3 gap-2 
                    bg-card/95 backdrop-blur-xl border-border/50 
                    shadow-2xl rounded-2xl z-50">
                    <div className="col-span-3 pb-2 border-b border-border/50 mb-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Khám phá thể loại</p>
                    </div>
                    {genres.length > 0 ? (
                      genres.slice(0, 15).map((genre) => (
                        <DropdownMenuItem 
                          key={genre.id} 
                          className="cursor-pointer font-medium hover:bg-primary/10 hover:text-primary rounded-lg transition-colors py-2"
                          onClick={() => navigate(`/anime?genre=${genre.slug}`)}
                        >
                          {genre.nameVi || genre.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="col-span-3 py-4 text-center text-muted-foreground text-xs italic">
                        Đang tải thể loại...
                      </div>
                    )}
                    <DropdownMenuSeparator className="col-span-3 my-2 opacity-50" />
                    <DropdownMenuItem 
                      className="col-span-3 justify-center text-primary font-bold cursor-pointer hover:bg-primary/5 rounded-xl transition-all" 
                      onClick={() => navigate('/anime')}
                    >
                      Tất cả thể loại →
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/anime?sort=updatedAt&order=asc" className="text-sm font-semibold hover:text-primary transition-all whitespace-nowrap">
                  Mới cập nhật
                </Link>
              </>
            )}
          </div>

          {/* Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {!user?.isVip && !isFocused && (
              <Button 
                variant="outline" 
                className="gap-2 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/20 hover:border-amber-500/50 text-amber-500 font-bold rounded-xl h-10 px-5 shadow-lg shadow-amber-500/5"
                onClick={() => navigate('/vip')}
              >
                <Crown className="w-4 h-4 fill-amber-500/20" />
                <span>Nâng cấp VIP ✨</span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-1 hover:bg-transparent" />}>
                  <div className="relative group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:scale-105 transition-transform">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-none gap-1 ml-1">
                    <span className="text-xs font-bold truncate max-w-[80px]">{user.username}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Thành viên</span>
                  </div>
                  <span className="text-muted-foreground ml-1 opacity-50">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
                  <div className="px-3 py-3 border-b border-border/50 mb-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tài khoản</p>
                    <p className="font-bold text-foreground mt-1 truncate">{user.username}</p>
                  </div>
                  <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/profile')}>
                    <User className="mr-3 w-4 h-4 text-primary" /> Trang cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/bookmarks')}>
                    <Bookmark className="mr-3 w-4 h-4 text-primary" /> Danh sách yêu thích
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-xl font-medium py-2.5 my-0.5" onClick={() => navigate('/history')}>
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="font-bold text-sm rounded-xl px-5" onClick={() => navigate('/login')}>
                  Đăng nhập
                </Button>
                <Button className="font-bold text-sm rounded-xl px-5 shadow-lg shadow-primary/20" onClick={() => navigate('/register')}>
                  Đăng ký
                </Button>
              </div>
            )}
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50 transition-colors" onClick={() => navigate("/search")} aria-label="Search">
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted/50 transition-colors"
              onClick={() => navigate(user ? "/profile" : "/login")}
              aria-label="User"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}