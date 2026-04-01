import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Tôi có thể hủy bất cứ lúc nào không?",
    a: "Gói VIP không tự gia hạn. Sau khi hết hạn, tài khoản sẽ trở về chế độ Free tự động. Không phát sinh phí thêm.",
  },
  {
    q: "Thanh toán có an toàn không?",
    a: "Tất cả giao dịch được xử lý qua VNPay và MoMo — các cổng thanh toán được Ngân hàng Nhà nước Việt Nam cấp phép, đạt chuẩn bảo mật PCI DSS.",
  },
  {
    q: "Tôi có thể dùng VIP trên bao nhiêu thiết bị?",
    a: "Tài khoản VIP có thể đăng nhập và sử dụng trên nhiều thiết bị cùng lúc.",
  },
  {
    q: "Điều gì xảy ra khi gói VIP hết hạn?",
    a: "Khi gói hết hạn, bạn sẽ không còn truy cập được nội dung VIP. Lịch sử xem và dữ liệu cá nhân vẫn được giữ nguyên.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>{faq.q}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open === i && "rotate-180"
              )}
            />
          </button>
          {open === i && (
            <div className="border-t border-border/40 bg-muted/10 px-5 py-4 text-sm text-muted-foreground">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
