import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { paymentToyyibStatus } from "@/utils/enums";

export default function ToyyibPayStatusPage() {
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();

  useEffect(() => {
    const status_id = searchParams.get("status_id") || undefined;
    setPaymentInfo({
      status_id,
      statusText: status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown",
      billcode: searchParams.get("billcode") || undefined,
      order_id: searchParams.get("order_id") || undefined,
      msg: searchParams.get("msg") || undefined,
      transaction_id: searchParams.get("transaction_id") || undefined,
    });
  }, [searchParams]);

  const handleTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: 1,
        referenceNo: "TEST123",
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
        returnTo: '',
      });

      setPaymentInfo((prev) => ({
        ...prev,
        paymentUrl: bill.paymentUrl,
      }));
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!paymentInfo || !paymentInfo.statusText) return null;

  const statusColor =
    paymentInfo.statusText === "Success"
      ? "bg-green-100 text-green-800"
      : paymentInfo.statusText === "Pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 text-center">
        ToyyibPay Payment Details
      </h1>

      <div className="flex justify-center">
        <span className={`px-4 py-2 rounded-full font-semibold ${statusColor}`}>
          {paymentInfo.statusText}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
        {paymentInfo.billcode && <p><span className="font-medium">Bill Code:</span> {paymentInfo.billcode}</p>}
        {paymentInfo.order_id && <p><span className="font-medium">Order ID:</span> {paymentInfo.order_id}</p>}
        {paymentInfo.msg && <p><span className="font-medium">Message:</span> {paymentInfo.msg}</p>}
        {paymentInfo.transaction_id && <p><span className="font-medium">Transaction ID:</span> {paymentInfo.transaction_id}</p>}
        {paymentInfo.status_id && <p><span className="font-medium">Status ID:</span> {paymentInfo.status_id}</p>}
      </div>

      <div className="text-center">
        <button
          onClick={handleTest}
          disabled={loading}
          className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing..." : "Create / Test ToyyibPay Bill"}
        </button>
      </div>

      {paymentInfo.paymentUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <a
            href={paymentInfo.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-blue-600 font-semibold underline hover:text-blue-800 transition-colors"
          >
            Proceed to Payment
          </a>
          <p className="text-sm text-gray-600 break-all text-center">
            {paymentInfo.paymentUrl}
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-500 font-semibold text-center">{error}</p>
      )}
    </div>
  );
}
