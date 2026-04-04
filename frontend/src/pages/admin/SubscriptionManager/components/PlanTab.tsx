import { useState } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  Skeleton,
  EmptyState
} from "@/components/ui";
import { Plus, MoreVertical, Pencil, Power, PowerOff } from "lucide-react";
import { useAdminPlans } from "../hooks/useAdminSubscriptions";
import { cn } from "@/lib/utils";
import { PlanFormDialog } from "./PlanFormDialog";

export function PlanTab() {
  const { plans, isLoading, togglePlan } = useAdminPlans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <PlanTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Danh sách gói VIP</h2>
          <p className="text-sm text-slate-500">Quản lý các gói dịch vụ hiển thị cho người dùng.</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95">
          <Plus className="mr-2 h-4 w-4" />
          Thêm gói mới
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-12 font-bold text-slate-600 text-center">#</TableHead>
              <TableHead className="font-bold text-slate-600">Tên gói</TableHead>
              <TableHead className="font-bold text-slate-600">Số ngày</TableHead>
              <TableHead className="font-bold text-slate-600">Giá gốc</TableHead>
              <TableHead className="font-bold text-slate-600">Giá bán</TableHead>
              <TableHead className="font-bold text-slate-600">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans && plans.length > 0 ? (
              plans.map((plan, index) => (
                <TableRow key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="text-center text-slate-500 font-medium">{index + 1}</TableCell>
                  <TableCell className="font-bold text-slate-900">{plan.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                      {plan.durationDays} ngày
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 line-through text-sm">
                    {plan.originalPrice ? `${plan.originalPrice.toLocaleString()}đ` : "—"}
                  </TableCell>
                  <TableCell className="font-bold text-blue-600">
                    {plan.price.toLocaleString()}đ
                    {plan.originalPrice && (
                      <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        -{Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", plan.isActive ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                      <span className={cn("text-sm font-medium", plan.isActive ? "text-green-700" : "text-slate-500")}>
                        {plan.isActive ? "Bật" : "Tắt"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 transition-colors cursor-pointer outline-none">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                          onClick={() => handleEdit(plan)}
                          className="group cursor-pointer text-slate-900 focus:bg-slate-900 focus:text-white transition-colors"
                        >
                          <Pencil className="mr-2 h-4 w-4 text-slate-600 group-focus:text-white transition-colors" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => togglePlan(plan.id)}
                          className="group cursor-pointer text-slate-900 focus:bg-slate-900 focus:text-white transition-colors"
                        >
                          {plan.isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4 text-rose-600 group-focus:text-white transition-colors" />
                              <span>Tắt gói</span>
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4 text-emerald-600 group-focus:text-white transition-colors" />
                              <span>Bật gói</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <EmptyState
                    title="Chưa có gói VIP nào"
                    description="Hãy tạo gói VIP đầu tiên để người dùng có thể mua."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PlanFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingPlan={editingPlan}
      />

    </div>
  );
}

function PlanTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-12 bg-slate-50" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-t border-slate-200 flex items-center justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
