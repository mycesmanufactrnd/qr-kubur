import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../utils/trpc";

export default function BillplzConfigPage() {
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 FIX: Call the billplz mutation instead of toyyibPay
  const createBillMutation = trpc.billplz.createBill.useMutation();

  useEffect(() => {
    // 🔹 Billplz standard return params usually include id and paid status
    const billId = searchParams.get("billplz[id]") || undefined;
    const isPaid = searchParams.get("billplz[paid]") === "true";
    
    setPaymentInfo({
      billId,
      statusText: billId ? (isPaid ? "Success" : "Pending") : "Waiting for Test",
    });
  }, [searchParams]);

  const handleTest = async () => {
    setLoading(true);
    setError(null);

    try {
      // 🔹 Call your billplz router
      const bill = await createBillMutation.mutateAsync({
        amount: 1, // Let's test with RM 10
        referenceNo: `TEST-BP-${Date.now()}`,
        name: "Billplz Test User",
        email: "test@example.com",
      });

      setPaymentInfo((prev) => ({
        ...prev,
        paymentUrl: bill.paymentUrl,
      }));
    } catch (err) {
      setError(err.message || "Failed to create Billplz bill");
    } finally {
      setLoading(false);
    }
  };

  if (!paymentInfo) return null;

  const statusColor =
    paymentInfo.statusText === "Success"
      ? "bg-green-100 text-green-800"
      : paymentInfo.statusText === "Pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 text-center">
        Billplz Sandbox Test
      </h1>

      <div className="flex justify-center">
        <span className={`px-4 py-2 rounded-full font-semibold ${statusColor}`}>
          {paymentInfo.statusText}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
        {paymentInfo.billId && <p><span className="font-medium">Bill ID:</span> {paymentInfo.billId}</p>}
      </div>

      <div className="text-center">
        <button
          onClick={handleTest}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing..." : "Generate Billplz Test Bill"}
        </button>
      </div>

      {paymentInfo.paymentUrl && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-2">
          <a
            href={paymentInfo.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
          >
            Proceed to Billplz Sandbox
          </a>
          <p className="text-sm text-gray-500 break-all text-center">
            {paymentInfo.paymentUrl}
          </p>
        </div>
      )}

      {error && <p className="text-red-500 font-semibold text-center mt-4">{error}</p>}
    </div>
  );
}