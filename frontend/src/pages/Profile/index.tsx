import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useUser";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: profile, isLoading, isError, error } = useProfile(userId!);

  if (isLoading) return <Loader fullPage />;

  if (isError) {
    return (
      <div className="container py-20 px-4">
        <EmptyState
          title="Lỗi tải hồ sơ"
          description={(error as any)?.response?.data?.error?.message || "Đã có lỗi xảy ra khi tải thông tin người dùng."}
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="main-container px-0 md:px-4 lg:px-8 py-0 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      <ProfileHeader profile={profile} />
      <div className="px-4 md:px-0 space-y-6 md:space-y-8">
        <ProfileStats profile={profile} />
      </div>
    </div>
  );
}
