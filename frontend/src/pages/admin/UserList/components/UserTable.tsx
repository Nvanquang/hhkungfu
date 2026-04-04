import { Badge, Button } from "@/components/ui";

interface UserTableProps {
  users: any[];
  onToggleStatus: (u: any) => void;
  isUpdating: boolean;
}

export function UserTable({ users, onToggleStatus, isUpdating }: UserTableProps) {
  return (
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-400 font-medium pb-2 uppercase text-[10px] tracking-widest">
          <th className="pb-3 pr-3 font-semibold">Tài khoản & Email</th>
          <th className="pb-3 pr-3 font-semibold">Trạng thái</th>
          <th className="pb-3 pr-3 font-semibold">Ngày đăng ký</th>
          <th className="pb-3 pr-3 font-semibold">Vai trò</th>
          <th className="pb-3 pr-3 text-right font-semibold">Hành động</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50/50 transition">
            <td className="py-3 pr-3">
              <p className="font-bold text-slate-800 leading-tight">{u.username || "Chưa đặt tên"}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{u.email}</p>
            </td>
            <td className="py-3 pr-3">
              <Badge
                className={u.active === false
                  ? "bg-red-50 text-red-600 border border-red-100 shadow-none hover:bg-red-50"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none hover:bg-emerald-50"
                }
              >
                <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${u.active === false ? "bg-red-500" : "bg-emerald-500"}`}></div>
                {u.active === false ? "Bị khóa" : "Hoạt động"}
              </Badge>
            </td>
            <td className="py-3 pr-3 text-slate-500 font-medium">
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "N/A"}
            </td>
            <td className="py-3 pr-3 text-slate-500 font-medium">
              {u.role}
            </td>
            <td className="py-3 pr-3 text-right">
              <Button
                variant="outline"
                disabled={isUpdating}
                className={`h-8 border-slate-200 bg-white text-xs font-bold transition-all shadow-sm ${u.active
                    ? "text-red-500 hover:bg-red-50 hover:border-red-200"
                    : "text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200"
                  }`}
                onClick={() => onToggleStatus(u)}
              >
                {u.active ? "Khóa tài khoản" : "Mở khóa"}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
