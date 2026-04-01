import { cn } from "@/lib/utils";
import type { PaymentGateway } from "@/types";

interface GatewaySelectorProps {
  value: PaymentGateway;
  onChange: (gw: PaymentGateway) => void;
}

const GATEWAYS: { id: PaymentGateway; name: string; desc: string; icon: string }[] = [
  {
    id: "VNPAY",
    name: "VNPay",
    desc: "Thẻ ATM nội địa, Thẻ quốc tế VISA/MasterCard, QR Code",
    icon: "🏦",
  },
  {
    id: "MOMO",
    name: "MoMo",
    desc: "Thanh toán bằng ứng dụng ví điện tử MoMo",
    icon: "📱",
  },
];

export function GatewaySelector({ value, onChange }: GatewaySelectorProps) {
  return (
    <div className="space-y-4">
      {GATEWAYS.map((gw) => (
        <label
          key={gw.id}
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200",
            value === gw.id
              ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
              : "border-border/40 bg-card hover:bg-accent hover:border-border"
          )}
        >
          {/* Custom radio button visual */}
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              value === gw.id ? "border-amber-500" : "border-muted-foreground/50"
            )}
          >
            {value === gw.id && <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
          </div>

          <input
            type="radio"
            name="gateway"
            value={gw.id}
            checked={value === gw.id}
            onChange={() => onChange(gw.id)}
            className="sr-only"
          />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-xl shadow-sm border border-border/30">
              {gw.icon}
            </div>
            <div>
              <p className="font-semibold text-foreground">{gw.name}</p>
              <p className="text-xs text-muted-foreground">{gw.desc}</p>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
