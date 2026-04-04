import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { CreditCard, History, Users } from "lucide-react";
import { PlanTab } from "./components/PlanTab";
import { PaymentTab } from "./components/PaymentTab";
import { VipMemberTab } from "./components/VipMemberTab";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "../shared/components";

export default function SubscriptionManager() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Subscription & Thanh toán"
        description="Quản lý gói VIP, theo dõi lịch sử thanh toán và danh sách thành viên VIP."
      />

      <Tabs
        defaultValue="plans"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex flex-col"
      >
        <div className="border-b border-slate-200 mb-6">
          <TabsList variant="line" className="h-auto p-0 bg-transparent gap-8">
            <TabsTrigger
              value="plans"
              className={cn(
                "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                activeTab === "plans" && "text-blue-600 font-bold"
              )}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Gói VIP</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className={cn(
                "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                activeTab === "payments" && "text-blue-600 font-bold"
              )}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Lịch sử thanh toán</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="vips"
              className={cn(
                "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                activeTab === "vips" && "text-blue-600 font-bold"
              )}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Thành viên VIP</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="mt-0 outline-none">
          <PlanTab />
        </TabsContent>

        <TabsContent value="payments" className="mt-0 outline-none">
          <PaymentTab />
        </TabsContent>

        <TabsContent value="vips" className="mt-0 outline-none">
          <VipMemberTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
