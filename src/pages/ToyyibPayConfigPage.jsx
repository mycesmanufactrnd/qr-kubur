import { useState } from "react";
import { trpc } from "../utils/trpc";

export default function ToyyibPayConfigPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: 1,
        referenceNo: "TEST123",
        name: "Test User",
        email: "test@example.com",
        phone: "0123456789",
      });

      setResult(JSON.stringify(bill, null, 2));
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-50 rounded-lg shadow-md space-y-4">
      <h2 className="text-lg font-bold">ToyyibPay Config Test</h2>

      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test ToyyibPay Config"}
      </button>

      {result && (
        <div>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {result}
          </pre>
          <a
            href={JSON.parse(result).paymentUrl}
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Go to Payment
          </a>
        </div>
      )}

      {error && (
        <p className="text-red-500 font-semibold">Error: {error}</p>
      )}
    </div>
  );
}
