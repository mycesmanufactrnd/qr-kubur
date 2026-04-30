import { useMemo, useState } from "react";
import moment from "moment";
import {
  FileText,
  Hash,
  Clock3,
  Building2,
  User,
  Calendar,
  BadgeCheck,
  Heart,
  Banknote,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Image,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { skipToken } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatRM } from "@/utils/helpers";
import { resolveFileUrl } from "@/utils";
import { QuotationStatus, TahlilStatus } from "@/utils/enums";

const ENTITY_NAME_MAP = {
  donation: "Donation",
  tahlilrequest: "Tahlil Request",
  quotation: "Quotation",
  deathcharity: "Death Charity Payment",
};

const ENTITY_COLOR = {
  donation: "text-emerald-600 bg-emerald-50 border-emerald-100",
  tahlilrequest: "text-blue-600 bg-blue-50 border-blue-100",
  quotation: "text-sky-600 bg-sky-50 border-sky-100",
  deathcharity: "text-purple-600 bg-purple-50 border-purple-100",
};

const QUOTATION_STATUS_CONFIG = {
  [QuotationStatus.PENDING]: { label: "Pending", Icon: Clock, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", iconColor: "text-amber-500" },
  [QuotationStatus.COMPLETED]: { label: "Completed", Icon: CheckCircle, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", iconColor: "text-emerald-500" },
  [QuotationStatus.REJECTED]: { label: "Rejected", Icon: XCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", iconColor: "text-red-500" },
};

const TAHLIL_STATUS_CONFIG = {
  [TahlilStatus.PENDING]: { label: "Pending", Icon: Clock, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", iconColor: "text-amber-500" },
  [TahlilStatus.ACCEPTED]: { label: "Accepted", Icon: BadgeCheck, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconColor: "text-blue-500" },
  [TahlilStatus.COMPLETED]: { label: "Completed", Icon: CheckCircle, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", iconColor: "text-emerald-500" },
  [TahlilStatus.REJECTED]: { label: "Rejected", Icon: XCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", iconColor: "text-red-500" },
};

function StatusBadge({ status, configMap }) {
  const cfg = configMap?.[status];
  if (!cfg) return (
    <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-500">{status || "-"}</span>
  );
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      {translate(cfg.label)}
    </span>
  );
}

const formatEntityName = (name) => {
  if (!name) return "-";
  return ENTITY_NAME_MAP[name.toLowerCase().trim()] || name;
};

const formatRelativeTime = (createdat) => {
  if (!createdat) return "-";
  const parsed = moment(createdat);
  return parsed.isValid() ? parsed.fromNow() : "-";
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-slate-700 text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );
}

function AmountRow({ label, value, highlight }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
        highlight
          ? "bg-emerald-50 border-emerald-100"
          : "bg-slate-50 border-slate-100"
      }`}
    >
      <span className={`text-sm ${highlight ? "font-semibold text-emerald-700" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-slate-900"}`}>
        {formatRM(value)}
      </span>
    </div>
  );
}

export default function UserTransactionRecords() {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const googleUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("googleAuth") || sessionStorage.getItem("googleAuth");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, []);

  const email = googleUser?.email || "";

  const {
    data: records = [],
    isLoading,
    error,
  } = trpc.google.getTransactionRecords.useQuery(
    { email },
    { enabled: !!email },
  );

  const entityName = selectedRecord?.entityname?.toLowerCase()?.trim();

  const { data: quotationDetail, isLoading: loadingQuo } =
    trpc.quotation.getByReferenceNo.useQuery(
      entityName === "quotation" && selectedRecord?.referenceno
        ? { referenceno: selectedRecord.referenceno }
        : skipToken,
    );

  const { data: tahlilDetail, isLoading: loadingTahlil } =
    trpc.tahlilRequest.getByReferenceNo.useQuery(
      entityName === "tahlilrequest" && selectedRecord?.referenceno
        ? { referenceno: selectedRecord.referenceno }
        : skipToken,
    );

  const { data: donationDetail, isLoading: loadingDonation } =
    trpc.donation.getByReferenceNo.useQuery(
      entityName === "donation" && selectedRecord?.referenceno
        ? { referenceno: selectedRecord.referenceno }
        : skipToken,
    );

  const { data: deathCharityDetail, isLoading: loadingDC } =
    trpc.deathCharityPayment.getByReferenceNo.useQuery(
      entityName === "deathcharity" && selectedRecord?.referenceno
        ? { referenceno: selectedRecord.referenceno }
        : skipToken,
    );

  const isDetailLoading = loadingQuo || loadingTahlil || loadingDonation || loadingDC;

  const renderDetail = () => {
    if (isDetailLoading) {
      return (
        <div className="py-6 text-sm text-slate-400 text-center">
          {translate("Loading")}...
        </div>
      );
    }

    if (entityName === "quotation" && quotationDetail) {
      const q = quotationDetail;
      return (
        <div className="space-y-4">
          <div className="flex justify-center pb-1">
            <StatusBadge status={q.status} configMap={QUOTATION_STATUS_CONFIG} />
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
            <InfoRow icon={User} label={translate("Requester")} value={q.payername} />
            <InfoRow icon={Mail} label={translate("Email")} value={q.payeremail} />
            <InfoRow icon={Phone} label={translate("Phone")} value={q.payerphone} />
            <InfoRow icon={Building2} label={translate("Organisation")} value={q.organisation?.name} />
            <InfoRow icon={Heart} label={translate("Deceased")} value={q.deadperson?.name} />
            <InfoRow
              icon={Calendar}
              label={translate("Date")}
              value={q.createdat ? new Date(q.createdat).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
          </div>

          {q.selectedservices?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                {translate("Services")}
              </p>
              {q.selectedservices.map((s, i) => (
                <div key={i} className="flex justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                  <span className="text-slate-600">{s.service}</span>
                  <span className="font-semibold">{formatRM(s.price)}</span>
                </div>
              ))}
              {q.maintenancefeeamount != null && (
                <AmountRow label={translate("Maintenance Fee")} value={q.maintenancefeeamount} />
              )}
              {q.totalamount != null && (
                <AmountRow label={translate("Total Amount")} value={q.totalamount} highlight />
              )}
            </div>
          )}

          {q.photourl && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                {translate("Service Photos")}
              </p>
              <img
                src={resolveFileUrl(q.photourl, "bucket-organisation-services-proof")}
                alt={translate("Service completion")}
                className="h-48 w-full rounded-xl object-cover border border-slate-100"
              />
            </div>
          )}
        </div>
      );
    }

    if (entityName === "tahlilrequest" && tahlilDetail) {
      const t = tahlilDetail;
      return (
        <div className="space-y-4">
          <div className="flex justify-center pb-1">
            <StatusBadge status={t.status} configMap={TAHLIL_STATUS_CONFIG} />
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
            <InfoRow icon={User} label={translate("Requester")} value={t.requestorname} />
            <InfoRow icon={Building2} label={translate("Tahfiz Center")} value={t.tahfizcenter?.name} />
            <InfoRow
              icon={Calendar}
              label={translate("Date")}
              value={t.createdat ? new Date(t.createdat).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
            {t.suggesteddate && (
              <InfoRow
                icon={Calendar}
                label={translate("Suggested Date")}
                value={new Date(t.suggesteddate).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}
              />
            )}
          </div>

          {t.deceasednames?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                {translate("Deceased Names")}
              </p>
              {t.deceasednames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-700">{name}</span>
                </div>
              ))}
            </div>
          )}

          {t.serviceamount != null && (
            <div className="space-y-1.5">
              <AmountRow label={translate("Service Amount")} value={t.serviceamount} />
              {t.platformfeeamount != null && (
                <AmountRow label={translate("Total Paid")} value={Number(t.serviceamount) + Number(t.platformfeeamount)} highlight />
              )}
            </div>
          )}
        </div>
      );
    }

    if (entityName === "donation" && donationDetail) {
      const d = donationDetail;
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
            <InfoRow icon={User} label={translate("Donor")} value={d.donorname} />
            <InfoRow icon={Building2} label={translate("Organisation")} value={d.organisation?.name} />
            <InfoRow icon={Building2} label={translate("Tahfiz Center")} value={d.tahfizcenter?.name} />
            <InfoRow
              icon={Calendar}
              label={translate("Date")}
              value={d.createdat ? new Date(d.createdat).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
          </div>
          {d.amount != null && (
            <AmountRow label={translate("Donation Amount")} value={d.amount} highlight />
          )}
          {d.notes && (
            <div className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[11px] text-slate-400 mb-1 uppercase tracking-wide font-semibold">{translate("Notes")}</p>
              <p className="text-sm text-slate-700">{d.notes}</p>
            </div>
          )}
        </div>
      );
    }

    if (entityName === "deathcharity" && deathCharityDetail) {
      const dc = deathCharityDetail;
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
            <InfoRow icon={User} label={translate("Member")} value={dc.member?.fullname} />
            <InfoRow icon={Building2} label={translate("Organisation")} value={dc.member?.deathcharity?.organisation?.name} />
            <InfoRow icon={BadgeCheck} label={translate("Payment Type")} value={dc.paymenttype?.toUpperCase()} />
            <InfoRow icon={Banknote} label={translate("Payment Method")} value={dc.paymentmethod?.toUpperCase()} />
            <InfoRow
              icon={Calendar}
              label={translate("Year Covered")}
              value={dc.coversfromyear
                ? dc.coverstoyear && dc.coverstoyear !== dc.coversfromyear
                  ? `${dc.coversfromyear} – ${dc.coverstoyear}`
                  : `${dc.coversfromyear}`
                : null}
            />
            <InfoRow
              icon={Calendar}
              label={translate("Payment Date")}
              value={dc.paidat ? new Date(dc.paidat).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
          </div>
          {dc.amount != null && (
            <AmountRow label={translate("Payment Amount")} value={dc.amount} highlight />
          )}
        </div>
      );
    }

    return (
      <div className="py-6 text-sm text-slate-400 text-center">
        {translate("No details found")}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate("Transaction Record")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Account")}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {googleUser?.name || "-"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {email || translate("Google account not found")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Transaction Record")}
            </p>
          </div>

          {isLoading && (
            <div className="px-4 py-6 text-sm text-slate-500">
              {translate("Loading")}...
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-6 text-sm text-red-500">
              {translate("Failed to load transaction records")}
            </div>
          )}

          {!isLoading && !error && !email && (
            <div className="px-4 py-6 text-sm text-slate-500">
              {translate("Please sign in with Google to view your transaction records")}
            </div>
          )}

          {!isLoading && !error && !!email && records.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">
              {translate("No transaction record found")}
            </div>
          )}

          {!isLoading && !error && records.length > 0 && (
            <div className="divide-y divide-slate-100">
              {records.map((record) => {
                const key = record.entityname?.toLowerCase()?.trim();
                const colorClass = ENTITY_COLOR[key] || "text-slate-600 bg-slate-50 border-slate-100";
                return (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm font-semibold truncate">
                          {record.referenceno || "-"}
                        </p>
                      </div>

                      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {formatEntityName(record.entityname)}
                      </span>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock3 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-xs">
                          {formatRelativeTime(record.createdat)}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) setSelectedRecord(null); }}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              {formatEntityName(selectedRecord?.entityname)}
            </DialogTitle>
            <p className="text-lg font-bold tracking-widest font-mono text-slate-800">
              {selectedRecord?.referenceno || "-"}
            </p>
          </div>

          <div className="px-5 py-4">
            {renderDetail()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
