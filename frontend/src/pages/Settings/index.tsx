import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useLogout";
import { useUpdateProfile, useRequestChangePassword, useUploadAvatar } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Crown, CreditCard, Loader2, ChevronLeft, Clock, Eye, EyeOff, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const profileSchema = z.object({
  username: z.string().min(3, "Tên người dùng phải có ít nhất 3 ký tự"),
  bio: z.string().max(200, "Giới thiệu tối đa 200 ký tự").optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const requestChangePassword = useRequestChangePassword();

  const [activeTab, setActiveTab] = useState("profile");
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdateProfile = (data: any) => {
    updateProfile.mutate(data);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ảnh đại diện phải nhỏ hơn 2MB");
        return;
      }
      uploadAvatar.mutate(file);
    }
  };

  const onChangePassword = (data: any) => {
    requestChangePassword.mutate(
      {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          navigate("/settings/verify-password");
        },
      }
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "history", label: "Lịch sử xem", icon: Clock },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "billing", label: "VIP & Thanh toán", icon: Crown },
  ];

  const getTitle = () => {
    if (activeTab === "profile") return "Hồ sơ cá nhân";
    if (activeTab === "security") return "Bảo mật";
    if (activeTab === "billing") return "VIP & Thanh toán";
    return "Cài đặt";
  };

  return (
    <div className="main-container px-0 md:px-4 lg:px-8 py-0 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 md:hidden flex items-center gap-4 px-4 h-14 bg-background/80 backdrop-blur-md border-b">
        <button
          onClick={() => isMenuOpen ? navigate("/") : setIsMenuOpen(true)}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-bold text-lg">{isMenuOpen ? "Cài đặt" : getTitle()}</h2>
      </div>

      <div className="px-4 md:px-0 lg:max-w-3xl lg:mx-auto">
        {/* Desktop Page Title */}
        <div className="hidden md:block space-y-1 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý tài khoản và tùy chọn của bạn.</p>
        </div>

        {/* Mobile Menu List */}
        {isMenuOpen && (
          <div className="md:hidden space-y-2 py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "history") {
                    navigate("/me/history");
                    return;
                  }
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground opacity-50" />
              </button>
            ))}

            <div className="pt-4 border-t mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-card border rounded-xl text-red-500 hover:bg-red-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span className="font-bold">Đăng xuất</span>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 opacity-50" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop Tabs & Mobile Content */}
        <div className={cn(isMenuOpen && "hidden md:block")}>
          {/* FIX: flex-col để TabsList nằm TRÊN, TabsContent nằm DƯỚI */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">

            <TabsList className="hidden md:flex items-center gap-0.5 p-1.5 rounded-[13px] w-fit h-auto bg-white/5 border border-white/[0.08]">
              {[
                { value: "profile", icon: User, label: "Hồ sơ" },
                { value: "security", icon: Shield, label: "Bảo mật" },
                { value: "billing", icon: CreditCard, label: "VIP & Thanh toán" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  style={activeTab === value ? {
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    boxShadow: "0 2px 14px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                  } : {
                    backgroundColor: "transparent",
                    color: "rgba(255,255,255,0.4)",
                  }}
                  className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-[9px] text-[13.5px] font-semibold tracking-wide whitespace-nowrap border-none transition-all duration-200 hover:!bg-white/10 hover:!text-white/70"
                >
                  <Icon className="h-[14px] w-[14px] shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật tên hiển thị, ảnh đại diện và tiểu sử của bạn.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative group">
                          <div className="h-24 w-24 rounded-2xl border-2 border-primary/20 bg-muted overflow-hidden relative">
                            {uploadAvatar.isPending && (
                              <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                              </div>
                            )}
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-3xl font-bold bg-primary/10 text-primary">
                                {user?.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                              disabled={uploadAvatar.isPending}
                            >
                              <Camera className="h-6 w-6 text-white" />
                            </button>
                          </div>
                          
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            accept="image/*" 
                            className="hidden" 
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center max-w-[120px]">Tải ảnh từ máy tính để đổi avatar.</p>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Tên người dùng</Label>
                          <Input id="username" {...profileForm.register("username")} />
                          {profileForm.formState.errors.username && (
                            <p className="text-xs text-destructive">{(profileForm.formState.errors.username as any).message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Tiểu sử</Label>
                          <textarea
                            id="bio"
                            {...profileForm.register("bio")}
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Viết vài dòng giới thiệu bản thân..."
                          />
                          {profileForm.formState.errors.bio && (
                            <p className="text-xs text-destructive">{(profileForm.formState.errors.bio as any).message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={updateProfile.isPending} className="w-full md:w-auto rounded-full px-8">
                        {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0">
              <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle>Đổi mật khẩu</CardTitle>
                  <CardDescription>Đảm bảo tài khoản của bạn luôn an toàn.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {user?.provider === "GOOGLE" ? (
                    <div className="py-6 flex flex-col items-center gap-4 text-center">
                      <div className="p-4 rounded-full bg-blue-500/10 text-blue-500">
                        <Shield className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold">Đăng nhập qua Google</h3>
                        <p className="text-sm text-muted-foreground">Tài khoản của bạn được bảo mật bởi Google. Không cần đổi mật khẩu tại đây.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                        <div className="relative">
                          <Input
                            id="oldPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            className="pr-10"
                            {...passwordForm.register("oldPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.oldPassword && (
                          <p className="text-xs text-destructive">{(passwordForm.formState.errors.oldPassword as any).message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Mật khẩu mới</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            className="pr-10"
                            {...passwordForm.register("newPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-xs text-destructive">{(passwordForm.formState.errors.newPassword as any).message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            className="pr-10"
                            {...passwordForm.register("confirmPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive">{(passwordForm.formState.errors.confirmPassword as any).message}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={requestChangePassword.isPending} className="w-full md:w-auto rounded-full px-8">
                          {requestChangePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Cập nhật mật khẩu
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-0">
              <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle>Gói dịch vụ</CardTitle>
                  <CardDescription>Xem trạng thái VIP và lịch sử giao dịch.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="rounded-xl border p-4 md:p-6 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-amber-500/20 text-amber-500 shadow-inner shrink-0">
                        <Crown className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl">{user?.isVip ? "Gói VIP Premium" : "Gói Miễn Phí"}</h3>
                          {user?.isVip && <Badge className="bg-amber-500 text-[10px] h-4">ACTIVE</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {user?.isVip
                            ? "Tận hưởng anime chất lượng cao không quảng cáo"
                            : "Nâng cấp lên VIP để xem anime không quảng cáo"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={user?.isVip ? "outline" : "default"}
                      className={!user?.isVip
                        ? "bg-amber-600 hover:bg-amber-700 h-10 px-8 rounded-full w-full md:w-auto"
                        : "rounded-full w-full md:w-auto"}
                    >
                      {user?.isVip ? "Gia hạn gói" : "Nâng cấp ngay"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}