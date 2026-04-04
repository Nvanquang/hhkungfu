import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button, 
  Badge 
} from "@/components/ui";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface PaymentDetailModalProps {
  payment: any;
  onClose: () => void;
}

export function PaymentDetailModal({ payment, onClose }: PaymentDetailModalProps) {
  if (!payment) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payment, null, 2));
    toast.success("Đã sao chép dữ liệu JSON");
  };

  return (
    <Dialog
      open={!!payment}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-3xl bg-white border-none shadow-2xl p-0 overflow-hidden text-left">
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Chi tiết thanh toán
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-400">
            Mã đơn: {payment.orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thông tin đơn hàng</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
                  <span className="font-bold text-slate-800">{payment.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Gói đăng ký:</span>
                  <span className="font-bold text-slate-800">{payment.planName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Số tiền:</span>
                  <span className="font-bold text-slate-900">{payment.amount.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Ngày tạo:</span>
                  <span className="text-slate-800 font-medium">{new Date(payment.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200 pl-6 hidden md:block">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Người dùng</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Username:</span>
                  <span className="font-bold text-slate-800">{payment.user.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-slate-800 font-medium truncate max-w-[150px]" title={payment.user.email}>{payment.user.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">User ID:</span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">{payment.user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                Gateway Response
                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200 bg-slate-50">{payment.gateway}</Badge>
              </h4>
              <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 transition-all" onClick={handleCopy}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                SAO CHÉP JSON
              </Button>
            </div>
            <div className="relative group">
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-auto max-h-[300px] custom-scrollbar selection:bg-blue-500 selection:text-white border border-slate-800 leading-relaxed shadow-inner">
                {payment.gatewayResponse 
                  ? JSON.stringify(JSON.parse(payment.gatewayResponse), null, 2) 
                  : "// Không có dữ liệu phản hồi từ gateway"}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Button variant="outline" className="h-10 border-slate-200 text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-900 px-8 transition-all" onClick={() => onClose()}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
