import { Search } from "lucide-react";
import { Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";

interface UserFiltersProps {
  searchKey: string;
  setSearchKey: (v: string) => void;
  status: "" | "active" | "inactive";
  setStatus: (v: "" | "active" | "inactive") => void;
}

export function UserFilters({ searchKey, setSearchKey, status, setStatus }: UserFiltersProps) {
  return (
    <LightPanel className="grid gap-4 md:grid-cols-3">
      <div className="relative md:col-span-2">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <Input
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          placeholder="Tìm kiếm theo email hoặc tên người dùng..."
          className="border-slate-300 bg-white pl-10 h-10 rounded-lg focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>
      <div className="grid grid-cols-1">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | "active" | "inactive")}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đang bị khóa</option>
        </select>
      </div>
    </LightPanel>
  );
}
