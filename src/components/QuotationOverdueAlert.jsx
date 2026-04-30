import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { QUOTATION_OVERDUE_DAYS, QuotationStatus } from "@/utils/enums";
import { useGetAllQuotations } from "@/hooks/useQuotationMutations";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";

export default function QuotationOverdueAlert() {
  const [collapsed, setCollapsed] = useState(false);
  const { items } = useGetAllQuotations();

  const overdueItems = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - QUOTATION_OVERDUE_DAYS);
    return items.filter(
      (q) =>
        q.status === QuotationStatus.PENDING &&
        new Date(q.createdat) < cutoff,
    );
  }, [items]);

  if (overdueItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl rounded-xl overflow-hidden border border-amber-300">
      <div
        className="flex items-center justify-between px-4 py-3 bg-amber-500 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">
            {overdueItems.length} {translate("Overdue Quotation(s)")}
          </span>
        </div>
        {collapsed ? (
          <ChevronUp className="w-4 h-4 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </div>

      {!collapsed && (
        <div className="bg-white max-h-64 overflow-y-auto">
          <p className="px-4 pt-3 pb-1 text-xs text-gray-500">
            {translate("Pending quotations older than")} {QUOTATION_OVERDUE_DAYS} {translate("days — action required")}
          </p>
          <div className="divide-y divide-gray-100">
            {overdueItems.map((q) => (
              <Link
                key={q.id}
                to={createPageUrl("ManageQuotations")}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {q.payername || translate("No Name")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {q.referenceno || "-"} &bull;{" "}
                    {new Date(q.createdat).toLocaleDateString("ms-MY")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
