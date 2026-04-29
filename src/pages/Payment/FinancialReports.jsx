import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import { Landmark, TrendingUp, Download, ChevronDown } from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { MONTHS, ORG_SHARE } from "@/utils/enums";
import { formatRM, formatDate } from "@/utils/helpers";

const ALL_TABS = [
  { key: "donations", label: "Donations" },
  { key: "tahlils", label: "Tahlil", adminHidden: true },
  { key: "deathCharityPayments", label: "Death Charity", tahfizHidden: true },
  { key: "quotations", label: "Quotations", tahfizHidden: true },
];


const TAB_META = {
  donations: {
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    accent: "#d1fae5",
  },
  tahlils: { color: "#2563eb", bg: "rgba(37,99,235,0.08)", accent: "#dbeafe" },
  deathCharityPayments: {
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    accent: "#fef3c7",
  },
  quotations: {
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    accent: "#ede9fe",
  },
};

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
  let headers = [];
  let rows = [];
  let title = "";

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

  const escapeCSV = (val) => {
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csvLines = [
    escapeCSV(title),
    `Generated on,${formatDate(new Date())}`,
    `Period,${monthName} ${year}`,
    `Total Records,${rows.length}`,
    "",
    headers.map(escapeCSV).join(","),
    ...rows.map((r) => r.map(escapeCSV).join(",")),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activeTab}_${monthName}_${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FinancialReports() {
  const { loadingUser, hasAdminAccess, isTahfizAdmin, isAdmin, currentUser } =
    useAdminAccess();
  const { loading: permissionsLoading, canView } =
    useCrudPermissions("financial_reports");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState("donations");

  const enabled = !!currentUser?.id && !loadingUser;
  // Pure tahfiz admin (no org role): donations + tahlils only
  // Pure org admin (no tahfiz role): donations + deathCharity + quotations only
  // Both roles (e.g. superadmin): all tabs
  const TABS = ALL_TABS.filter((t) => {
    if (t.tahfizHidden && isTahfizAdmin && !isAdmin) return false;
    if (t.adminHidden && isAdmin && !isTahfizAdmin) return false;
    return true;
  });

  useEffect(() => {
    if (TABS.length > 0 && !TABS.find((t) => t.key === activeTab)) {
      setActiveTab(TABS[0].key);
    }
  }, [isTahfizAdmin, isAdmin]);

  const { data, isLoading } = trpc.financialReport.getByReferenceNo.useQuery(
    {
      year,
      month,
      checkRole: { admin: !!isAdmin, tahfiz: !!isTahfizAdmin },
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
    isTahfizAdmin && !isAdmin
      ? totalDonations + totalTahlil
      : isAdmin && !isTahfizAdmin
        ? totalDonations + totalDeathCharity + totalQuotations
        : totalDonations + totalTahlil + totalDeathCharity + totalQuotations;

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const dashboardLabel = isTahfizAdmin
    ? translate("Tahfiz Dashboard")
    : translate("Admin Dashboard");
  const dashboardPage = isTahfizAdmin ? "TahfizDashboard" : "AdminDashboard";

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: dashboardLabel, page: dashboardPage },
            { label: translate("Financial Reports"), page: "FinancialReports" },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  const allSummaryCards = [
    {
      key: "donations",
      label: "Donations",
      total: totalDonations,
      count: donations.length,
      color: "#059669",
      icon: "💚",
    },
    {
      key: "tahlils",
      label: "Tahlil",
      total: totalTahlil,
      count: tahlils.length,
      color: "#2563eb",
      icon: "💙",
      adminHidden: true,
    },
    {
      key: "deathCharityPayments",
      label: "Death Charity",
      total: totalDeathCharity,
      count: deathCharityPayments.length,
      color: "#d97706",
      icon: "🧡",
      tahfizHidden: true,
    },
    {
      key: "quotations",
      label: "Quotations",
      total: totalQuotations,
      count: quotations.length,
      color: "#7c3aed",
      icon: "💜",
      tahfizHidden: true,
    },
  ];

  const summaryCards = allSummaryCards.filter((c) => {
    if (c.tahfizHidden && isTahfizAdmin && !isAdmin) return false;
    if (c.adminHidden && isAdmin && !isTahfizAdmin) return false;
    return true;
  });
  const activeColor = TAB_META[activeTab]?.color ?? "#1c1917";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .fr-root * { font-family: 'DM Sans', sans-serif; }
        .fr-mono { font-family: 'DM Mono', monospace; }

        .fr-select {
          appearance: none;
          -webkit-appearance: none;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid #e7e5e4;
          background: #fafaf9;
          padding: 0 36px 0 12px;
          font-size: 13.5px;
          font-weight: 500;
          color: #1c1917;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .fr-select:focus {
          outline: none;
          border-color: #a8a29e;
          box-shadow: 0 0 0 3px rgba(168,162,158,0.15);
        }

        .fr-year-input {
          height: 38px;
          width: 88px;
          border-radius: 10px;
          border: 1.5px solid #e7e5e4;
          background: #fafaf9;
          padding: 0 12px;
          font-size: 13.5px;
          font-weight: 500;
          color: #1c1917;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'DM Mono', monospace;
        }
        .fr-year-input:focus {
          outline: none;
          border-color: #a8a29e;
          box-shadow: 0 0 0 3px rgba(168,162,158,0.15);
        }

        .fr-grand-total {
          background: linear-gradient(135deg, #1c1917 0%, #292524 60%, #3d3531 100%);
          border-radius: 18px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .fr-grand-total::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }
        .fr-grand-total::after {
          content: '';
          position: absolute;
          bottom: -40px;
          left: 30%;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.02);
        }

        .fr-summary-card {
          border-radius: 14px;
          border: 1.5px solid #f5f5f4;
          background: #ffffff;
          padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: default;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .fr-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          border-color: #e7e5e4;
        }

        .fr-card-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .fr-tab-bar {
          display: flex;
          border-bottom: 1.5px solid #f5f5f4;
          overflow-x: auto;
          padding: 0 4px;
          gap: 2px;
        }
        .fr-tab-bar::-webkit-scrollbar { display: none; }

        .fr-tab-btn {
          padding: 14px 20px;
          font-size: 13.5px;
          font-weight: 500;
          border: none;
          background: none;
          cursor: pointer;
          white-space: nowrap;
          color: #a8a29e;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -1.5px;
          transition: color 0.15s, border-color 0.15s;
          border-radius: 8px 8px 0 0;
          position: relative;
        }
        .fr-tab-btn:hover { color: #57534e; background: #fafaf9; }
        .fr-tab-btn.active { color: var(--tab-color); border-bottom-color: var(--tab-color); }

        .fr-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1.5px solid #e7e5e4;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          color: #44403c;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .fr-export-btn:hover {
          background: #fafaf9;
          border-color: #d6d3d1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          transform: translateY(-1px);
        }
        .fr-export-btn:active { transform: translateY(0); }

        .fr-table thead tr th {
          background: #fafaf9;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #a8a29e;
          padding: 12px 16px;
          border-bottom: 1.5px solid #f5f5f4;
        }
        .fr-table tbody tr td {
          padding: 13px 16px;
          font-size: 13.5px;
          color: #44403c;
          border-bottom: 1px solid #fafaf9;
        }
        .fr-table tbody tr:last-child td { border-bottom: none; }
        .fr-table tbody tr:hover td { background: #fafaf9; }

        .fr-ref-badge {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          background: #f5f5f4;
          color: #44403c;
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .fr-status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .fr-amount {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #1c1917;
        }

        .fr-outer-card {
          border-radius: 18px;
          border: 1.5px solid #f5f5f4;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        .fr-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-wrap: wrap;
          gap: 8px;
          background: #ffffff;
        }
      `}</style>

      <div className="fr-root space-y-6">
        <Breadcrumb
          items={[
            { label: dashboardLabel, page: dashboardPage },
            { label: translate("Financial Reports"), page: "FinancialReports" },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1c1917",
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: 0,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#f5f5f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Landmark style={{ width: 18, height: 18, color: "#78716c" }} />
            </span>
            {translate("Financial Reports")}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="fr-select"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="fr-year-input"
              min={2000}
              max={2100}
            />
          </div>
        </div>

        <div className="fr-grand-total">
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Grand Total — {MONTHS[month - 1]} {year}
            </p>
            <p
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {formatRM(grandTotal)}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                marginTop: 8,
                fontWeight: 400,
              }}
            >
              {summaryCards.reduce((s, c) => s + c.count, 0)} total transactions
            </p>
          </div>
          <TrendingUp
            style={{
              width: 44,
              height: 44,
              color: "rgba(255,255,255,0.12)",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {summaryCards.map(({ key, label, total, count, color, icon }) => (
            <div key={key} className="fr-summary-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span className="fr-card-dot" style={{ background: color }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#a8a29e",
                  }}
                >
                  {label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color,
                  fontFamily: "'DM Mono', monospace",
                  marginBottom: 4,
                }}
              >
                {formatRM(total)}
              </p>
              <p style={{ fontSize: 12, color: "#d6d3d1", fontWeight: 500 }}>
                {count} records
              </p>
            </div>
          ))}
        </div>

        <div className="fr-outer-card">
          <div
            className="fr-top-bar"
            style={{ paddingTop: 4, paddingBottom: 0 }}
          >
            <div
              className="fr-tab-bar"
              style={{ flex: 1, border: "none", padding: 0 }}
            >
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`fr-tab-btn ${activeTab === key ? "active" : ""}`}
                  style={{ "--tab-color": TAB_META[key]?.color ?? "#1c1917" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ padding: "8px 0 8px 12px" }}>
              <button
                className="fr-export-btn"
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
              >
                <Download style={{ width: 14, height: 14, color: "#78716c" }} />
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1.5px solid #f5f5f4" }}>
            {activeTab === "donations" && (
              <table
                className="fr-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4}>
                        <InlineLoadingComponent isTable colSpan={4} />
                      </td>
                    </tr>
                  ) : donations.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <NoDataTableComponent colSpan={4} />
                      </td>
                    </tr>
                  ) : (
                    donations.map((r) => (
                      <tr key={r.id}>
                        <td className="text-center">
                          <span className="fr-ref-badge">
                            {r.referenceno || "-"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="fr-amount">{formatRM(r.amount)}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className="fr-status-pill"
                            style={{
                              background:
                                r.status?.toLowerCase() === "paid"
                                  ? "#d1fae5"
                                  : "#f5f5f4",
                              color:
                                r.status?.toLowerCase() === "paid"
                                  ? "#065f46"
                                  : "#78716c",
                            }}
                          >
                            {r.status || "-"}
                          </span>
                        </td>
                        <td
                          className="text-center"
                          style={{ color: "#a8a29e", fontSize: 13 }}
                        >
                          {formatDate(r.createdat)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "tahlils" && (
              <table
                className="fr-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Service Amt</th>
                    <th>Platform Fee</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5}>
                        <InlineLoadingComponent isTable colSpan={5} />
                      </td>
                    </tr>
                  ) : tahlils.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <NoDataTableComponent colSpan={5} />
                      </td>
                    </tr>
                  ) : (
                    tahlils.map((r) => (
                      <tr key={r.id}>
                        <td className="text-center">
                          <span className="fr-ref-badge">
                            {r.referenceno || "-"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="fr-amount">
                            {formatRM(r.serviceamount)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className="fr-amount"
                            style={{ color: "#78716c" }}
                          >
                            {formatRM(r.platformfeeamount)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className="fr-status-pill"
                            style={{
                              background:
                                r.status?.toLowerCase() === "paid"
                                  ? "#dbeafe"
                                  : "#f5f5f4",
                              color:
                                r.status?.toLowerCase() === "paid"
                                  ? "#1d4ed8"
                                  : "#78716c",
                            }}
                          >
                            {r.status || "-"}
                          </span>
                        </td>
                        <td
                          className="text-center"
                          style={{ color: "#a8a29e", fontSize: 13 }}
                        >
                          {formatDate(r.createdat)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "deathCharityPayments" && (
              <table
                className="fr-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Date Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5}>
                        <InlineLoadingComponent isTable colSpan={5} />
                      </td>
                    </tr>
                  ) : deathCharityPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <NoDataTableComponent colSpan={5} />
                      </td>
                    </tr>
                  ) : (
                    deathCharityPayments.map((r) => (
                      <tr key={r.id}>
                        <td className="text-center">
                          <span className="fr-ref-badge">
                            {r.referenceno || "-"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="fr-amount">{formatRM(r.amount)}</span>
                        </td>
                        <td className="text-center" style={{ fontSize: 13 }}>
                          {r.paymenttype || "-"}
                        </td>
                        <td className="text-center">
                          <span
                            className="fr-status-pill"
                            style={{ background: "#fef3c7", color: "#92400e" }}
                          >
                            {r.paymentmethod || "-"}
                          </span>
                        </td>
                        <td
                          className="text-center"
                          style={{ color: "#a8a29e", fontSize: 13 }}
                        >
                          {formatDate(r.paidat)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "quotations" && (
              <table
                className="fr-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Payer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5}>
                        <InlineLoadingComponent isTable colSpan={5} />
                      </td>
                    </tr>
                  ) : quotations.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <NoDataTableComponent colSpan={5} />
                      </td>
                    </tr>
                  ) : (
                    quotations.map((r) => (
                      <tr key={r.id}>
                        <td className="text-center">
                          <span className="fr-ref-badge">
                            {r.referenceno || "-"}
                          </span>
                        </td>
                        <td
                          className="text-center"
                          style={{ fontWeight: 500, fontSize: 13.5 }}
                        >
                          {r.payername || "-"}
                        </td>
                        <td className="text-center">
                          <span className="fr-amount">
                            {formatRM(r.serviceamount * ORG_SHARE)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className="fr-status-pill"
                            style={{
                              background:
                                r.status?.toLowerCase() === "paid"
                                  ? "#ede9fe"
                                  : "#f5f5f4",
                              color:
                                r.status?.toLowerCase() === "paid"
                                  ? "#5b21b6"
                                  : "#78716c",
                            }}
                          >
                            {r.status || "-"}
                          </span>
                        </td>
                        <td
                          className="text-center"
                          style={{ color: "#a8a29e", fontSize: 13 }}
                        >
                          {formatDate(r.createdat)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
