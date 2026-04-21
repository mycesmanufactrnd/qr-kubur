import { useEffect, useState } from "react";
import {
  Search,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Calendar,
  Phone,
  Mail,
  Heart,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { showError } from "@/components/ToastrNotification";
import { QuotationStatus } from "@/utils/enums";
import BackNavigation from "@/components/BackNavigation";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveFileUrl } from "@/utils";
import { formatRM } from "@/utils/helpers";

const STATUS_CONFIG = {
  [QuotationStatus.PENDING]: {
    label: translate("Pending"),
    icon: Clock,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    iconColor: "text-amber-500",
  },
  [QuotationStatus.COMPLETED]: {
    label: translate("Completed"),
    icon: CheckCircle,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    iconColor: "text-emerald-500",
  },
  [QuotationStatus.REJECTED]: {
    label: translate("Rejected"),
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    iconColor: "text-red-500",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg)
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-500">
        {status}
      </span>
    );
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      {cfg.label}
    </span>
  );
}

export default function CheckServiceStatus() {
  const [referenceId, setReferenceId] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [searching, setSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: quotation, isLoading } =
    trpc.quotation.getByReferenceNo.useQuery(
      searchKey ? { referenceno: searchKey } : skipToken,
      { enabled: !!searchKey },
    );

  useEffect(() => {
    if (!searchKey) return;
    if (!isLoading) {
      setSearching(false);
      if (!quotation) {
        showError(translate("Service not found"));
        return;
      }
      setIsDialogOpen(true);
    }
  }, [quotation, isLoading, searchKey]);

  const handleSearch = () => {
    if (!referenceId.trim()) {
      showError(translate("Please enter Reference No."));
      return;
    }
    setSearching(true);
    setSearchKey(referenceId.trim());
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSearchKey("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title={translate("Service Status")} />

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-2 pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-200 mb-1">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            {translate("Check Service Status")}
          </h2>
          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
            {translate("Enter reference number to check your service status.")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
          <div className="px-4 py-3 -mx-4 -mt-4 mb-0 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600">
              {translate("Service Search")}
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {translate("Transaction Reference No.")}
            </label>
            <Input
              placeholder={`${translate("Example")}: QUO-2024-0001`}
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-200 active:opacity-80 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {searching ? translate("Searching...") : translate("Search Status")}
          </Button>
        </div>

        <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-blue-600 leading-relaxed">
            <span className="font-bold">{translate("Tip")}:</span> {translate("Your reference number can be found in the payment receipt sent to your email.")}
          </p>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              {translate("Service Application Status")}
            </DialogTitle>
            {quotation && (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-lg font-bold tracking-widest font-mono text-slate-800">
                  {quotation.referenceno}
                </span>
                <StatusBadge status={quotation.status} />
              </div>
            )}
          </div>

          {quotation && (
            <div className="px-5 py-4 space-y-5">
              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {quotation.payername && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Requester")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {quotation.payername}
                    </span>
                  </div>
                )}
                {quotation.payeremail && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Email")}
                      </span>
                    </div>
                    <span className="text-sm text-slate-700 text-right max-w-[55%] break-all">
                      {quotation.payeremail}
                    </span>
                  </div>
                )}
                {quotation.payerphone && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Phone No")}
                      </span>
                    </div>
                    <span className="text-sm text-slate-700">{quotation.payerphone}</span>
                  </div>
                )}
                {quotation.organisation && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Organisation")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-right max-w-[55%]">
                      {quotation.organisation.name}
                    </span>
                  </div>
                )}
                {quotation.deadperson && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Deceased")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-right max-w-[55%]">
                      {quotation.deadperson.name}
                    </span>
                  </div>
                )}
                {quotation.createdat && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {translate("Date")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(quotation.createdat).toLocaleDateString("ms-MY", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {quotation.selectedservices?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate("Services")}
                  </p>
                  <div className="space-y-1.5">
                    {quotation.selectedservices.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <span className="text-sm font-medium text-slate-700">{s.service}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatRM(s.price)}</span>
                      </div>
                    ))}
                  </div>
                  {quotation.totalamount != null && (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                      <span className="text-sm font-semibold text-sky-700">{translate("Total Amount")}</span>
                      <span className="text-sm font-bold text-sky-700">{formatRM(quotation.totalamount)}</span>
                    </div>
                  )}
                </div>
              )}

              {quotation.photourl && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate("Service Photos")}
                  </p>
                  <img
                    src={resolveFileUrl(quotation.photourl, "organisation-services")}
                    alt="Service completion"
                    className="h-48 w-full rounded-xl object-cover border border-slate-100"
                  />
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold active:opacity-70 transition-opacity"
              >
                {translate("Close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
