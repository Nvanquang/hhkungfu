import { usePaymentResult } from "./hooks/usePaymentResult";
import { ResultSuccess, ResultFailed, ResultPending } from "./components/ResultStates";

export default function PaymentResultPage() {
  const { orderCode, result, isLoading, isError } = usePaymentResult();

  if (!orderCode) {
    return (
      <div className="min-h-[60vh] p-20 text-center text-muted-foreground">
        Mã đơn hàng (orderId) không hợp lệ.
      </div>
    );
  }

  // Still fetching initial data or polling while PENDING
  if (isLoading || (result?.status === "PENDING")) {
    // Note: if polling expires (after 60s hook stops polling), we might still be PENDING technically
    // But for UI purpose, let's treat long PENDING as a timeout failure
    // We can infer this if it's PENDING but query is no longer fetching
    return <ResultPending orderCode={orderCode} />;
  }

  if (isError) {
    return <ResultFailed orderCode={orderCode} />;
  }

  if (result?.status === "PAID") {
    return <ResultSuccess result={result} />;
  }

  // FAILED, EXPIRED, CANCELLED, REFUNDED go here
  return <ResultFailed orderCode={orderCode} />;
}
