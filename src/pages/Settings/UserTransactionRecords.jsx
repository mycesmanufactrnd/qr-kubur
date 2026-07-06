// @ts-nocheck
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
import { QuotationStatus, TahlilStatus, JenazahCaseStatus } from "@/utils/enums";

const ENTITY_NAME_MAP = {
  donation: "Donation",
  tahlilrequest: "Tahlil Request",
  quotation: "Quotation",
  deathcharity: "Death Charity Payment",
  jenazahcase: "Kes Jenazah",
};

const ENTITY_COLOR = {
  donation: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800",
  tahlilrequest: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800",
  quotation: "text-sky-600 bg-sky-50 border-sky-100 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-800",
  deathcharity: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800",
  jenazahcase: "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800",
};

const QUOTATION_STATUS_CONFIG = {
  [QuotationStatus.PENDING]: { label: "Pending", Icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", iconColor: "text-amber-500 dark:text-amber-400" },
  [QuotationStatus.COMPLETED]: { label: "Completed", Icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", iconColor: "text-emerald-500 dark:text-emerald-400" },
  [QuotationStatus.REJECTED]: { label: "Rejected", Icon: XCircle, bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400", iconColor: "text-red-500 dark:text-red-400" },
};

const TAHLIL_STATUS_CONFIG = {
  [TahlilStatus.PENDING]: { label: "Pending", Icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", iconColor: "text-amber-500 dark:text-amber-400" },
  [TahlilStatus.ACCEPTED]: { label: "Accepted", Icon: BadgeCheck, bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400", iconColor: "text-blue-500 dark:text-blue-400" },
  [TahlilStatus.COMPLETED]: { label: "Completed", Icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", iconColor: "text-emerald-500 dark:text-emerald-400" },
};

const JENAZAH_STATUS_CONFIG = {
  [JenazahCaseStatus.PENDING]: { label: "Pending", Icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", iconColor: "text-amber-500 dark:text-amber-400" },
  [JenazahCaseStatus.APPROVED]: { label: "Approved", Icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", iconColor: "text-emerald-500 dark:text-emerald-400" },
  [JenazahCaseStatus.REJECTED]: { label: "Rejected", Icon: XCircle, bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400", iconColor: "text-red-500 dark:text-red-400" },
};

function StatusBadge({ status, configMap }) {
  const cfg = configMap?.[status];
  if (!cfg) return (
    <span className="px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{status || "-"}</span>
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
        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-white text-right max-w-[60%] break-words">
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
          ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
          : "bg-slate-50 border-slate-100 dark:bg-slate-700 dark:border-slate-600"
      }`}
    >
      <span className={`text-sm ${highlight ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
        {label}
      </span>
      <span className={`text-sm font-bold ${highlight ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
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

  const { data: jenazahDetail, isLoading: loadingJenazah } =
    trpc.jenazahCase.getByReferenceNo.useQuery(
      entityName === "jenazahcase" && selectedRecord?.referenceno
        ? { referenceno: selectedRecord.referenceno }
        : skipToken,
    );

  const isDetailLoading = loadingQuo || loadingTahlil || loadingDonation || loadingDC || loadingJenazah;

  const renderDetail = () => {
    if (isDetailLoading) {
      return (
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-center pb-1">
            <div className="h-9 w-32 bg-slate-100 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-600">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
          <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl" />
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

          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden divide-y divide-slate-100 dark:divide-slate-600">
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                {translate("Services")}
              </p>
              {q.selectedservices.map((s, i) => (
                <div key={i} className="flex justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-xl text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{s.service}</span>
                  <span className="font-semibold dark:text-white">{formatRM(s.price)}</span>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                {translate("Service Photos")}
              </p>
              <img
                src={resolveFileUrl(q.photourl, "bucket-organisation-services-proof")}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                alt={translate("Service completion")}
                className="h-48 w-full rounded-xl object-cover border border-slate-100 dark:border-slate-600"
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

          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden divide-y divide-slate-100 dark:divide-slate-600">
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                {translate("Deceased Names")}
              </p>
              {t.deceasednames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{name}</span>
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
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden divide-y divide-slate-100 dark:divide-slate-600">
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
            <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-xl">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wide font-semibold">{translate("Notes")}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{d.notes}</p>
            </div>
          )}
        </div>
      );
    }

    if (entityName === "deathcharity" && deathCharityDetail) {
      const dc = deathCharityDetail;
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden divide-y divide-slate-100 dark:divide-slate-600">
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

    if (entityName === "jenazahcase" && jenazahDetail) {
      const j = jenazahDetail;
      const jd = j.details ?? {};
      return (
        <div className="space-y-4">
          <div className="flex justify-center pb-1">
            <StatusBadge status={j.status} configMap={JENAZAH_STATUS_CONFIG} />
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 overflow-hidden divide-y divide-slate-100 dark:divide-slate-600">
            <InfoRow icon={Building2} label={translate("Mosque")} value={j.mosque?.name} />
            <InfoRow icon={Building2} label={translate("Address")} value={j.mosque?.address} />
            <InfoRow icon={User} label={translate("Deceased")} value={jd.deceasedFullname} />
            <InfoRow icon={BadgeCheck} label={translate("IC No.")} value={jd.deceasedIcnumber} />
            <InfoRow icon={User} label={translate("Nama Waris")} value={jd.heirname} />
            <InfoRow icon={Phone} label={translate("No. Tel. Waris")} value={jd.heirphoneno} />
            <InfoRow
              icon={Calendar}
              label={translate("Burial Date")}
              value={jd.burialDate ? new Date(jd.burialDate).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
          </div>

          {j.adminremarks && (
            <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-xl">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wide font-semibold">{translate("Notes")}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{j.adminremarks}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-8 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {translate("No details found")}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12 dark:bg-slate-900">
      <BackNavigation title={translate("Transaction Record")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {translate("Account")}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
              {googleUser?.name || "-"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {email || translate("Google account not found")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {translate("Transaction Record")}
            </p>
          </div>

          {isLoading && (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full w-36" />
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-20" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-16" />
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400 dark:text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-500 dark:text-red-400">
                {translate("Failed to load transaction records")}
              </p>
            </div>
          )}

          {!isLoading && !error && !email && (
            <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed">
                {translate("Please sign in with Google to view your transaction records")}
              </p>
            </div>
          )}

          {!isLoading && !error && !!email && records.length === 0 && (
            <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {translate("No transaction record found")}
              </p>
            </div>
          )}

          {!isLoading && !error && records.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {records.map((record) => {
                const key = record.entityname?.toLowerCase()?.trim();
                const colorClass = ENTITY_COLOR[key] || "text-slate-600 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-700 dark:border-slate-600";
                return (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <p className="text-sm font-semibold truncate text-slate-700 dark:text-white">
                          {record.referenceno || "-"}
                        </p>
                      </div>

                      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {formatEntityName(record.entityname)}
                      </span>

                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <Clock3 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-xs">
                          {formatRelativeTime(record.createdat)}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) setSelectedRecord(null); }}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white dark:bg-slate-800">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {formatEntityName(selectedRecord?.entityname)}
            </DialogTitle>
            <p className="text-lg font-bold tracking-widest font-mono text-slate-800 dark:text-white">
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
