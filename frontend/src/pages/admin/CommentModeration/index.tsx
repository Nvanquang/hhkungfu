import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentTab } from "./components/CommentTab";
import { RatingTab } from "./components/RatingTab";
import { MessageSquare, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "../shared/components";

const TABS = {
  COMMENTS: "comments",
  RATINGS: "ratings",
};

export default function AdminCommentModeration() {
  const [activeTab, setActiveTab] = useState<string>(TABS.COMMENTS);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Bình luận & Đánh giá"
        description="Kiểm duyệt và phản hồi ý kiến từ người dùng để duy trì chất lượng cộng đồng."
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col w-full"
      >
          <div className="border-b border-slate-200">
            <TabsList variant="line" className="bg-transparent h-auto p-0 gap-12 flex w-fit rounded-none justify-start">
              <TabsTrigger
                value={TABS.COMMENTS}
                className={cn(
                  "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                  activeTab === TABS.COMMENTS && "text-blue-600 font-bold"
                )}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Bình luận
              </TabsTrigger>
              <TabsTrigger
                value={TABS.RATINGS}
                className={cn(
                  "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                  activeTab === TABS.RATINGS && "text-blue-600 font-bold"
                )}
              >
                <Star className="mr-2 h-4 w-4" />
                Đánh giá
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full mt-6">
            <TabsContent value={TABS.COMMENTS} className="m-0 border-none p-0 outline-none">
              <CommentTab />
            </TabsContent>

            <TabsContent value={TABS.RATINGS} className="m-0 border-none p-0 outline-none">
              <RatingTab isActive={activeTab === TABS.RATINGS} />
            </TabsContent>
          </div>
        </Tabs>
    </div>
  );
}
