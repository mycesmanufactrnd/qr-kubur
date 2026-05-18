// @ts-nocheck
import { useState, useEffect } from "react";
import { translate } from "@/utils/translations";
import { Download } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { MONTHS, ORG_SHARE } from "@/utils/enums";
import { formatRM, formatDate } from "@/utils/helpers";

const ALL_TABS = [
  {
    key: "donations",
    label: "Donations",
    color: "#059669",
    bg: "#d1fae5",
    text: "#065f46",
  },
  {
    key: "tahlils",
    label: "Tahlil",
    color: "#2563eb",
    bg: "#dbeafe",
    text: "#1d4ed8",
  },
  {
    key: "deathCharityPayments",
    label: "Death Charity",
    color: "#d97706",
    bg: "#fef3c7",
    text: "#92400e",
  },
  {
    key: "quotations",
    label: "Quotations",
    color: "#7c3aed",
    bg: "#ede9fe",
    text: "#5b21b6",
  },
];

function exportToCSV({
  activeTab,
  donations,
  tahlils,
  deathCharityPayments,
  quotations,
  month,
  year,
}) {
  const monthName = MONTHS[month - 1];
  let headers = [],
    rows = [],
    title = "";

  if (activeTab === "donations") {
    title = `Donations Report — ${monthName} ${year}`;
    headers = ["Reference No", "Amount (RM)", "Status", "Date"];
    rows = donations.map((r) => [
      r.referenceno || "-",
      Number(r.amount || 0).toFixed(2),
      r.status || "-",
      formatDate(r.createdat),
    ]);
  } else if (activeTab === "tahlils") {
    title = `Tahlil Report — ${monthName} ${year}`;
    headers = [
      "Reference No",
      "Service Amount (RM)",
      "Platform Fee (RM)",
      "Total (RM)",
      "Status",
      "Date",
    ];
    rows = tahlils.map((r) => [
      r.referenceno || "-",
      Number(r.serviceamount || 0).toFixed(2),
      Number(r.platformfeeamount || 0).toFixed(2),
      (Number(r.serviceamount || 0) + Number(r.platformfeeamount || 0)).toFixed(
        2,
      ),
      r.status || "-",
      formatDate(r.createdat),
    ]);
  } else if (activeTab === "deathCharityPayments") {
    title = `Death Charity Payments Report — ${monthName} ${year}`;
    headers = [
      "Reference No",
      "Amount (RM)",
      "Payment Type",
      "Payment Method",
      "Date Paid",
    ];
    rows = deathCharityPayments.map((r) => [
      r.referenceno || "-",
      Number(r.amount || 0).toFixed(2),
      r.paymenttype || "-",
      r.paymentmethod || "-",
      formatDate(r.paidat),
    ]);
  } else if (activeTab === "quotations") {
    title = `Quotations Report — ${monthName} ${year}`;
    headers = [
      "Reference No",
      "Payer Name",
      "Total Amount (RM)",
      "Status",
      "Date",
    ];
    rows = quotations.map((r) => [
      r.referenceno || "-",
      r.payername || "-",
      Number(r.serviceamount * ORG_SHARE || 0).toFixed(2),
      r.status || "-",
      formatDate(r.createdat),
    ]);
  }

  const esc = (val) => {
    const s = String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    esc(title),
    `Generated on,${formatDate(new Date())}`,
    `Period,${monthName} ${year}`,
    `Total Records,${rows.length}`,
    "",
    headers.map(esc).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activeTab}_${monthName}_${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ status, colors }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{
        background: status?.toLowerCase() === "paid" ? colors.bg : "#f5f5f4",
        color: status?.toLowerCase() === "paid" ? colors.text : "#78716c",
      }}
    >
      {status || "-"}
    </span>
  );
}

function RefBadge({ value }) {
  return (
    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
      {value || "-"}
    </span>
  );
}

export default function MobileFinancialReports() {
  const {
    loadingUser,
    hasAdminAccess,
    isTahfizAdmin,
    isOrganisationAdmin,
    isOrgCanManageMosque,
    isOrgGraveService,
    isOrgCanBeDonated,
    currentUser,
  } = useAdminAccess();
  const { loading: permissionsLoading, canView } =
    useCrudPermissions("financial_reports");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState("donations");

  const enabled = !!currentUser?.id && !loadingUser;

  const TABS = ALL_TABS.filter(({ key }) => {
    if (key === "donations") return isOrgCanBeDonated || isTahfizAdmin;
    if (key === "tahlils") return isTahfizAdmin;
    if (key === "deathCharityPayments") return isOrgCanManageMosque;
    if (key === "quotations") return isOrgGraveService;
    return false;
  });

  useEffect(() => {
    if (TABS.length > 0 && !TABS.find((t) => t.key === activeTab)) {
      setActiveTab(TABS[0].key);
    }
  }, [
    isTahfizAdmin,
    isOrganisationAdmin,
    isOrgCanBeDonated,
    isOrgCanManageMosque,
    isOrgGraveService,
  ]);

  const { data, isLoading } = trpc.financialReport.getByReferenceNo.useQuery(
    {
      year,
      month,
      checkRole: { admin: !!isOrganisationAdmin, tahfiz: !!isTahfizAdmin },
      currentUser: {
        id: currentUser?.id ?? 0,
        organisation: currentUser?.organisation?.id
          ? { id: currentUser.organisation.id }
          : null,
        tahfizcenter: currentUser?.tahfizcenter?.id
          ? { id: currentUser.tahfizcenter.id }
          : null,
      },
    },
    { enabled },
  );

  const donations = data?.donations ?? [];
  const tahlils = data?.tahlils ?? [];
  const deathCharityPayments = data?.deathCharityPayments ?? [];
  const quotations = data?.quotations ?? [];

  const totalDonations = donations.reduce(
    (s, d) => s + Number(d.amount || 0),
    0,
  );
  const totalTahlil = tahlils.reduce(
    (s, t) =>
      s + Number(t.serviceamount || 0) + Number(t.platformfeeamount || 0),
    0,
  );
  const totalDeathCharity = deathCharityPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );
  const totalQuotations = quotations.reduce(
    (s, q) => s + Number(q.serviceamount * ORG_SHARE || 0),
    0,
  );

  const grandTotal =
    (isOrgCanBeDonated || isTahfizAdmin ? totalDonations : 0) +
    (isTahfizAdmin ? totalTahlil : 0) +
    (isOrgCanManageMosque ? totalDeathCharity : 0) +
    (isOrgGraveService ? totalQuotations : 0);

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  const allSummaryCards = [
    {
      key: "donations",
      label: "Donations",
      total: totalDonations,
      count: donations.length,
      color: "#059669",
    },
    {
      key: "tahlils",
      label: "Tahlil",
      total: totalTahlil,
      count: tahlils.length,
      color: "#2563eb",
    },
    {
      key: "deathCharityPayments",
      label: "Death Charity",
      total: totalDeathCharity,
      count: deathCharityPayments.length,
      color: "#d97706",
    },
    {
      key: "quotations",
      label: "Quotations",
      total: totalQuotations,
      count: quotations.length,
      color: "#7c3aed",
    },
  ];

  const summaryCards = allSummaryCards.filter(({ key }) => {
    if (key === "donations") return isOrgCanBeDonated || isTahfizAdmin;
    if (key === "tahlils") return isTahfizAdmin;
    if (key === "deathCharityPayments") return isOrgCanManageMosque;
    if (key === "quotations") return isOrgGraveService;
    return false;
  });

  const activeTabMeta = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title={translate("Financial Reports")} />

      <div className="px-3 space-y-3">
        {/* Period selector + Export */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 px-3 focus:outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={2100}
            className="w-20 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 px-3 focus:outline-none"
          />
          <button
            onClick={() =>
              exportToCSV({
                activeTab,
                donations,
                tahlils,
                deathCharityPayments,
                quotations,
                month,
                year,
              })
            }
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 active:opacity-70 shrink-0"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>

        {/* Grand total */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #1c1917 0%, #292524 60%, #3d3531 100%)",
            borderRadius: 16,
            padding: "20px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {translate("Grand Total")} — {MONTHS[month - 1]} {year}
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
              fontFamily: "monospace",
            }}
          >
            {formatRM(grandTotal)}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              marginTop: 6,
            }}
          >
            {summaryCards.reduce((s, c) => s + c.count, 0)} {translate("total transactions")}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {summaryCards.map(({ key, label, total, count, color }) => (
            <div
              key={key}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3.5 shadow-sm"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {translate(label)}
                </span>
              </div>
              <p
                className="text-base font-bold"
                style={{ color, fontFamily: "monospace" }}
              >
                {formatRM(total)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {count} {translate("records")}
              </p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-scrollbar:hidden]">
          {TABS.map(({ key, label, color, bg, text }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-all active:opacity-70"
              style={
                activeTab === key
                  ? {
                      background: bg,
                      color: text,
                      border: `1.5px solid ${color}40`,
                    }
                  : {
                      background: "transparent",
                      color: "#a8a29e",
                      border: "1.5px solid #e7e5e4",
                    }
              }
            >
              {translate(label)}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {isLoading ? (
          <InlineLoadingComponent />
        ) : (
          <>
            {activeTab === "donations" &&
              (donations.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">
                  {translate("No records")}
                </p>
              ) : (
                <div className="space-y-2">
                  {donations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <RefBadge value={r.referenceno} />
                        <span
                          className="font-bold text-sm"
                          style={{ color: "#059669", fontFamily: "monospace" }}
                        >
                          {formatRM(r.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusPill
                          status={r.status}
                          colors={{ bg: "#d1fae5", text: "#065f46" }}
                        />
                        <span className="text-xs text-slate-400">
                          {formatDate(r.createdat)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {activeTab === "tahlils" &&
              (tahlils.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">
                  {translate("No records")}
                </p>
              ) : (
                <div className="space-y-2">
                  {tahlils.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <RefBadge value={r.referenceno} />
                        <span
                          className="font-bold text-sm"
                          style={{ color: "#2563eb", fontFamily: "monospace" }}
                        >
                          {formatRM(
                            Number(r.serviceamount || 0) +
                              Number(r.platformfeeamount || 0),
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex gap-2 text-xs text-slate-400">
                          <span>{translate("Svc")}: {formatRM(r.serviceamount)}</span>
                          <span>{translate("Fee")}: {formatRM(r.platformfeeamount)}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(r.createdat)}
                        </span>
                      </div>
                      <StatusPill
                        status={r.status}
                        colors={{ bg: "#dbeafe", text: "#1d4ed8" }}
                      />
                    </div>
                  ))}
                </div>
              ))}

            {activeTab === "deathCharityPayments" &&
              (deathCharityPayments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">
                  {translate("No records")}
                </p>
              ) : (
                <div className="space-y-2">
                  {deathCharityPayments.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <RefBadge value={r.referenceno} />
                        <span
                          className="font-bold text-sm"
                          style={{ color: "#d97706", fontFamily: "monospace" }}
                        >
                          {formatRM(r.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {r.paymenttype || "-"}
                          </span>
                          {r.paymentmethod && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                              }}
                            >
                              {r.paymentmethod}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(r.paidat)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {activeTab === "quotations" &&
              (quotations.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">
                  {translate("No records")}
                </p>
              ) : (
                <div className="space-y-2">
                  {quotations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <RefBadge value={r.referenceno} />
                        <span
                          className="font-bold text-sm"
                          style={{ color: "#7c3aed", fontFamily: "monospace" }}
                        >
                          {formatRM(r.serviceamount * ORG_SHARE)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {r.payername || "-"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(r.createdat)}
                        </span>
                      </div>
                      <StatusPill
                        status={r.status}
                        colors={{ bg: "#ede9fe", text: "#5b21b6" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
