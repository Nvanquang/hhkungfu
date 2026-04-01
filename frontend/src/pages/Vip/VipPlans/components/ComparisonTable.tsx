import { Check, X } from "lucide-react";

const ROWS = [
  { label: "Chất lượng tối đa", free: "720p", vip1m: "1080p", vip3m: "1080p", vip1y: "1080p" },
  { label: "Nội dung VIP", free: false, vip1m: true, vip3m: true, vip1y: true },
  { label: "Quảng cáo", free: "Có", vip1m: "Không", vip3m: "Không", vip1y: "Không" },
  { label: "Tải xuống offline", free: false, vip1m: true, vip3m: true, vip1y: true },
  { label: "Hỗ trợ ưu tiên", free: false, vip1m: false, vip3m: true, vip1y: true },
  { label: "Badge đặc biệt", free: false, vip1m: false, vip3m: "Vàng", vip1y: "Kim cương" },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-amber-400" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="py-3 pl-4 text-left font-medium text-muted-foreground">Tính năng</th>
            <th className="py-3 text-center font-medium text-muted-foreground">FREE</th>
            <th className="py-3 text-center font-medium text-muted-foreground">VIP 1 Tháng</th>
            <th className="py-3 text-center font-semibold text-amber-400">VIP 3 Tháng</th>
            <th className="py-3 pr-4 text-center font-medium text-muted-foreground">VIP 1 Năm</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 0 ? "bg-transparent" : "bg-muted/10"}
            >
              <td className="py-3 pl-4 font-medium text-foreground">{row.label}</td>
              <td className="py-3 text-center"><Cell value={row.free} /></td>
              <td className="py-3 text-center"><Cell value={row.vip1m} /></td>
              <td className="py-3 text-center"><Cell value={row.vip3m} /></td>
              <td className="py-3 pr-4 text-center"><Cell value={row.vip1y} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
