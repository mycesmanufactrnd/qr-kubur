import { formatRM } from "../../utils/helpers";
import NoDataTableComponent from "../NoDataTableComponent";

export default function PaymentCellDetails({ payments = [], year }) {
    const filteredPayments = payments.filter(p => {
        const fromYear = Number(p.coversfromyear);
        const toYear = Number(p.coverstoyear || p.coversfromyear);
        return year >= fromYear && year <= toYear;
    });

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
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {filteredPayments.length === 0 ? (
                            <NoDataTableComponent colSpan={7} />
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}