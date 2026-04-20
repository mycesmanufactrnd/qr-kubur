import { useState, useEffect } from "react";
import { formatRM } from "../../utils/helpers";
import { resolveFileUrl } from '@/utils';
import NoDataTableComponent from "../NoDataTableComponent";
import { useGetOnlineTransaction } from "../../hooks/usePaymentDistributionMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export default function PaymentCellDetails({ payments = [], year }) {
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [transactionAccount, setTransactionAccount] = useState(null);

    const filteredPayments = payments.filter(p => {
        const fromYear = Number(p.coversfromyear);
        const toYear = Number(p.coverstoyear || p.coversfromyear);
        return year >= fromYear && year <= toYear;
    });

    const {
        onlineTransaction,
        isLoading: onlineTransactionLoading,
        refetch: refetchOnlineTransaction,
    } = useGetOnlineTransaction({
        referenceno: selectedPayment?.referenceno,
        enabled: false,
    });

    useEffect(() => {
        let isActive = true;

        if (!selectedPayment?.referenceno) {
            setTransactionAccount(null);
            return () => { isActive = false; };
        }

        refetchOnlineTransaction().then((res) => {
            if (!isActive) return;
            const transaction = res?.data ?? onlineTransaction;
            const accounts = Array.isArray(transaction?.accounts)
                ? [...transaction.accounts]
                : [];

            accounts.sort((a, b) => {
                const dateA = a?.createdat ? new Date(a.createdat).getTime() : 0;
                const dateB = b?.createdat ? new Date(b.createdat).getTime() : 0;
                return dateB - dateA;
            });

            setTransactionAccount(accounts[0] ?? null);
        });

        return () => { isActive = false; };
    }, [selectedPayment, refetchOnlineTransaction, onlineTransaction]);

    const getTransactionStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case "Paid":
                return (
                    <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge className="bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status || "-"}</Badge>;
        }
    };

    const getPaymentTypeBadge = (type) => {
        const badges = {
            full: "bg-emerald-100 text-emerald-700 border-emerald-200",
            partial: "bg-amber-100 text-amber-700 border-amber-200",
            advance: "bg-blue-100 text-blue-700 border-blue-200",
            default: "bg-slate-100 text-slate-700 border-slate-200"
        };
        return badges[type?.toLowerCase()] || badges.default;
    };

    const getPaymentMethodBadge = (method) => {
        const badges = {
            cash: "bg-green-50 text-green-700",
            card: "bg-purple-50 text-purple-700",
            bank: "bg-blue-50 text-blue-700",
            online: "bg-indigo-50 text-indigo-700",
            default: "bg-slate-50 text-slate-700"
        };
        return badges[method?.toLowerCase()] || badges.default;
    };

    const handleOpenDetail = (p) => {
        setSelectedPayment(p);
        setTransactionAccount(null);
        setDetailDialogOpen(true);
    };

    return (
        <div className="mb-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Year From
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Year To
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Method
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Reference No.
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Paid At
                            </th>
                            <th className="border-b-2 border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Transfer Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {filteredPayments.length === 0 ? (
                            <NoDataTableComponent colSpan={8} />
                        ) : (
                            filteredPayments.map((p, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-slate-50 transition-colors duration-150"
                                >
                                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                        {p.coversfromyear}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                        {p.coverstoyear || p.coversfromyear}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-900 font-semibold text-right">
                                        {formatRM(p.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPaymentTypeBadge(p.paymenttype)}`}>
                                            {p.paymenttype.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPaymentMethodBadge(p.paymentmethod)}`}>
                                            {p.paymentmethod.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                        {p.referenceno || <span className="text-slate-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {p.paidat ? (
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(p.paidat).toLocaleDateString('en-GB')}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleOpenDetail(p)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Status Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Payment Information</p>
                                <div>
                                    <p className="text-xs text-gray-500">Year Covered</p>
                                    <p className="font-semibold text-sm">
                                        {selectedPayment.coversfromyear}
                                        {selectedPayment.coverstoyear && selectedPayment.coverstoyear !== selectedPayment.coversfromyear
                                            ? ` – ${selectedPayment.coverstoyear}`
                                            : ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Amount</p>
                                    <p className="font-semibold text-sm">{formatRM(selectedPayment.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment Type</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPaymentTypeBadge(selectedPayment.paymenttype)}`}>
                                        {selectedPayment.paymenttype?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment Method</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPaymentMethodBadge(selectedPayment.paymentmethod)}`}>
                                        {selectedPayment.paymentmethod?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Reference No.</p>
                                    <p className="font-mono text-sm">{selectedPayment.referenceno || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Paid At</p>
                                    <p className="text-sm">
                                        {selectedPayment.paidat
                                            ? new Date(selectedPayment.paidat).toLocaleDateString('en-GB')
                                            : "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 border-l pl-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Platform Transfer Status</p>
                                        <p className="text-xs text-gray-400">
                                            This shows the status of fund transfer for this payment.
                                        </p>
                                    </div>
                                    {onlineTransactionLoading && (
                                        <span className="text-xs text-gray-400">Loading...</span>
                                    )}
                                </div>

                                {!onlineTransactionLoading && !transactionAccount && (
                                    <div className="text-sm text-gray-400">
                                        No online transaction account found
                                    </div>
                                )}

                                {transactionAccount && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            {getTransactionStatusBadge(transactionAccount.status)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Bank Name</p>
                                            <p className="font-semibold">{transactionAccount.bankname || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Account No</p>
                                            <p className="font-semibold">{transactionAccount.accountno || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Reference Transfer No</p>
                                            <p className="font-semibold">{transactionAccount.referencetransferno ?? "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Photo</p>
                                            {transactionAccount.photourl ? (
                                                <div className="space-y-2">
                                                    {resolveFileUrl(transactionAccount.photourl, "online-transaction") && (
                                                        <img
                                                            src={resolveFileUrl(transactionAccount.photourl, "online-transaction")}
                                                            alt="Transaction proof"
                                                            className="h-36 w-full rounded object-cover border"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">No photo uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
