import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/index";
import {
  MapPin, Users, Building2, Heart, FileText, TrendingUp,
  BookOpen, UserCheck, List, Activity, Sparkles, ArrowRight,
  Landmark, User2, Diamond, ListCheck, ShieldAlert, CreditCard,
  ClipboardList, BarChart, Bell, ChevronRight,
} from "lucide-react";
import { translate } from "@/utils/translations";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import { useAdminAccess } from "@/utils/auth";
import { useGetAdminDashboardStats } from "@/hooks/useDashboardMutations";
import { formatRM } from "@/utils/helpers";
import { useMemo } from "react";
import QuotationOverdueAlert from "@/components/QuotationOverdueAlert";

export default function MobileAdminDashboard() {
  const {
    currentUser, loadingUser, hasAdminAccess, isSuperAdmin, isTahfizAdmin,
  } = useAdminAccess();

  const org = currentUser?.organisation;
  const isGraveServices = !!org?.isgraveservices;
  const isCanBeDonated = !!org?.canbedonated;
  const isHasManageMosque = !!org?.canmanagemosque;

  const statsNeeded = useMemo(() => {
    const arr = ["OGDS"];
    if (isCanBeDonated) arr.push("DDV");
    if (isHasManageMosque) arr.push("CMC");
    if (isGraveServices) arr.push("QUO");
    return arr;
  }, [isCanBeDonated, isHasManageMosque, isGraveServices]);

  const isReady = !!currentUser?.organisation?.id;

  const {
    OGDSStats, DDVStats, CMCStats, QUOStats,
    isOGDSLoading, isDDVLoading, isCMCLoading, isQUOLoading,
  } = useGetAdminDashboardStats({ currentUser, isSuperAdmin, statsNeeded, enabled: isReady });

  const graveCount = OGDSStats?.graveCount ?? 0;
  const deadPersonCount = OGDSStats?.deadPersonCount ?? 0;
  const organisationCount = OGDSStats?.organisationCount ?? 0;
  const suggestionCount = OGDSStats?.suggestionCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;
  const deathCharityCount = CMCStats?.deathCharityCount ?? 0;
  const deathCharityMemberCount = CMCStats?.deathCharityMemberCount ?? 0;
  const deathCharityTotalPayout = CMCStats?.deathCharityTotalPayout ?? 0;
  const totalPendingQuo = QUOStats?.totalPendingQuo ?? 0;
  const totalCompleteQuo = QUOStats?.totalCompleteQuo ?? 0;
  const totalPayoutQuo = QUOStats?.totalPayoutQuo ?? 0;

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess || isTahfizAdmin) return <AccessDeniedComponent />;

  const today = new Date().toLocaleDateString("en-MY", {
    weekday: "long", day: "numeric", month: "long",
  });

  const coreStats = [
    { label: translate("Total Graves"), value: graveCount, icon: MapPin, page: "ManageGraves", loading: isOGDSLoading, color: "green" },
    { label: translate("Total Deceased"), value: deadPersonCount, icon: Users, page: "ManageDeadPersons", loading: isOGDSLoading, color: "blue" },
    { label: translate("Organisations"), value: organisationCount, icon: Building2, page: "ManageOrganisations", loading: isOGDSLoading, color: "violet" },
    { label: translate("Suggestions"), value: suggestionCount, icon: FileText, page: "ManageSuggestions", loading: isOGDSLoading, color: "amber" },
  ];

  const charityStats = [
    { label: translate("Khairat Kematian"), value: deathCharityCount, icon: ListCheck, page: "ManageDeathCharity", loading: isCMCLoading, color: "amber" },
    { label: translate("Ahli Khairat"), value: deathCharityMemberCount, icon: User2, page: "ManageDeathCharityMember", loading: isCMCLoading, color: "orange" },
    { label: translate("Total Payout"), value: deathCharityTotalPayout, icon: Diamond, page: "ManageDeathCharityClaim", loading: isCMCLoading, isMoney: true, color: "green", wide: true },
  ];

  const quoStats = [
    { label: translate("Pending"), value: totalPendingQuo, icon: FileText, page: "ManageQuotations", loading: isQUOLoading, color: "sky" },
    { label: translate("Completed"), value: totalCompleteQuo, icon: ListCheck, page: "ManageQuotations", loading: isQUOLoading, color: "green" },
    { label: translate("Total Payout"), value: totalPayoutQuo, icon: Diamond, page: "ManageQuotations", loading: isQUOLoading, isMoney: true, color: "violet", wide: true },
  ];

  const quickActions = [
    { label: translate("Manage Graves"), page: "ManageGraves", icon: MapPin, color: "green" },
    { label: translate("Manage Deceased"), page: "ManageDeadPersons", icon: Users, color: "blue" },
    { label: translate("Manage Organisations"), page: "ManageOrganisations", icon: Building2, color: "violet" },
    { label: translate("Financial Reports"), page: "FinancialReports", icon: BarChart, color: "indigo" },
    { label: translate("Payment Config"), page: "ManagePaymentConfig", icon: CreditCard, color: "teal" },
    ...(isCanBeDonated ? [{ label: translate("Manage Donations"), page: "ManageDonations", icon: Heart, color: "rose" }] : []),
    { label: translate("Manage Users"), page: "ManageUsers", icon: Users, color: "blue" },
    { label: translate("Manage Permissions"), page: "ManagePermissions", icon: UserCheck, color: "violet" },
    ...(isHasManageMosque ? [
      { label: translate("Manage Mosque"), page: "ManageMosques", icon: Landmark, color: "stone" },
      { label: translate("Activity Posts"), page: "ManageActivityPosts", icon: List, color: "amber" },
    ] : []),
    ...(isGraveServices ? [{ label: translate("Manage Quotations"), page: "ManageQuotations", icon: ClipboardList, color: "sky" }] : []),
  ];

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.dateText}>{today}</p>
            <h1 style={styles.headerTitle}>{translate("Admin Dashboard")}</h1>
            <p style={styles.headerSub}>
              <Activity size={13} style={{ marginRight: 4 }} />
              {currentUser?.full_name || translate("Admin")}
            </p>
          </div>
          {isSuperAdmin && (
            <div style={styles.roleChips}>
              <Link to={createPageUrl("SuperAdminDashboard")} style={styles.chip}>
                <Sparkles size={11} />
                Super
              </Link>
              <Link to={createPageUrl("TahfizDashboard")} style={{ ...styles.chip, ...styles.chipGreen }}>
                <BookOpen size={11} />
                Tahfiz
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={styles.body}>

        {/* Overdue Alert */}
        {isGraveServices && (
          <div style={styles.alert}>
            <div style={styles.alertDot} />
            <span style={styles.alertText}>
              {totalPendingQuo > 0
                ? `${totalPendingQuo} quotation${totalPendingQuo > 1 ? "s" : ""} pending review`
                : "All quotations are up to date"}
            </span>
            <Bell size={14} style={{ color: "#d97706" }} />
          </div>
        )}

        {/* Core Stats */}
        <SectionLabel label={translate("Overview")} />
        <div style={styles.grid}>
          {coreStats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Khairat */}
        {isHasManageMosque && (
          <>
            <SectionLabel label={translate("Khairat Kematian")} />
            <div style={styles.grid}>
              {charityStats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>
          </>
        )}

        {/* Quotations */}
        {isGraveServices && (
          <>
            <SectionLabel label={translate("Quotations")} />
            <div style={styles.grid}>
              {quoStats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>
          </>
        )}

        {/* Donations */}
        {isCanBeDonated && (
          <>
            <SectionLabel label={translate("Donations")} />
            <div style={styles.grid}>
              <Link to={createPageUrl("ManageDonations")} style={{ textDecoration: "none" }}>
                <div style={{ ...styles.statCard, ...colorMap.rose.card }}>
                  <div style={{ ...styles.iconWrap, ...colorMap.rose.icon }}>
                    <Heart size={14} color={colorMap.rose.iconColor} />
                  </div>
                  <p style={styles.statLabel}>{translate("Total Donations")}</p>
                  <p style={styles.statValue}>
                    {isDDVLoading ? "—" : donationCount.toLocaleString()}
                  </p>
                </div>
              </Link>
              <div style={{ ...styles.statCard, ...colorMap.green.card }}>
                <div style={{ ...styles.iconWrap, ...colorMap.green.icon }}>
                  <TrendingUp size={14} color={colorMap.green.iconColor} />
                </div>
                <p style={styles.statLabel}>{translate("Verified Donation")}</p>
                <p style={{ ...styles.statValue, fontSize: 16 }}>
                  {isDDVLoading ? "—" : formatRM(donationVerified)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <SectionLabel label={translate("Quick Actions")} />
        <div style={styles.actionList}>
          {quickActions.map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)} style={styles.actionLink}>
              <div style={styles.actionRow}>
                <div style={{ ...styles.actionIcon, ...colorMap[a.color]?.icon }}>
                  <a.icon size={14} color={colorMap[a.color]?.iconColor} />
                </div>
                <span style={styles.actionLabel}>{a.label}</span>
                <ChevronRight size={15} style={{ color: "#cbd5e1" }} />
              </div>
            </Link>
          ))}
        </div>

      </div>

      {isGraveServices && <QuotationOverdueAlert />}
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ label }) {
  return <p style={styles.sectionLabel}>{label}</p>;
}

function StatCard({ label, value, icon: Icon, page, loading, isMoney, color = "blue", wide }) {
  return (
    <Link
      to={createPageUrl(page)}
      style={{ textDecoration: "none", gridColumn: wide ? "span 2" : undefined }}
    >
      <div style={{ ...styles.statCard, ...colorMap[color]?.card, ...(wide ? styles.statCardWide : {}) }}>
        <div style={{ ...styles.iconWrap, ...colorMap[color]?.icon }}>
          <Icon size={14} color={colorMap[color]?.iconColor} />
        </div>
        <p style={styles.statLabel}>{label}</p>
        <p style={{ ...styles.statValue, ...(isMoney ? { fontSize: 17 } : {}) }}>
          {loading
            ? <span style={{ color: "#cbd5e1" }}>—</span>
            : isMoney
              ? formatRM(value)
              : value.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

/* ── Color map ── */
const colorMap = {
  green:  { card: { background: "#f0fdf4" }, icon: { background: "#dcfce7" }, iconColor: "#16a34a" },
  blue:   { card: { background: "#eff6ff" }, icon: { background: "#dbeafe" }, iconColor: "#2563eb" },
  violet: { card: { background: "#f5f3ff" }, icon: { background: "#ede9fe" }, iconColor: "#7c3aed" },
  amber:  { card: { background: "#fffbeb" }, icon: { background: "#fef3c7" }, iconColor: "#d97706" },
  orange: { card: { background: "#fff7ed" }, icon: { background: "#ffedd5" }, iconColor: "#ea580c" },
  sky:    { card: { background: "#f0f9ff" }, icon: { background: "#e0f2fe" }, iconColor: "#0284c7" },
  teal:   { card: { background: "#f0fdfa" }, icon: { background: "#ccfbf1" }, iconColor: "#0d9488" },
  rose:   { card: { background: "#fff1f2" }, icon: { background: "#ffe4e6" }, iconColor: "#e11d48" },
  indigo: { card: { background: "#eef2ff" }, icon: { background: "#e0e7ff" }, iconColor: "#4338ca" },
  stone:  { card: { background: "#fafaf9" }, icon: { background: "#f5f5f4" }, iconColor: "#78716c" },
  purple: { card: { background: "#faf5ff" }, icon: { background: "#f3e8ff" }, iconColor: "#9333ea" },
};

/* ── Styles ── */
const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: 32,
  },
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "20px 16px 16px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateText: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 2,
    letterSpacing: "0.04em",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  headerSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
  },
  roleChips: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    textDecoration: "none",
  },
  chipGreen: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  body: {
    padding: "16px 16px 0",
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 12,
    padding: "10px 14px",
    marginBottom: 20,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#f59e0b",
    flexShrink: 0,
  },
  alertText: {
    fontSize: 13,
    color: "#92400e",
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: "14px 14px 12px",
    border: "1px solid #f1f5f9",
    cursor: "pointer",
    display: "block",
  },
  statCardWide: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    background: "#e2e8f0",
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: 500,
    lineHeight: 1.3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  actionList: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    marginBottom: 20,
  },
  actionLink: {
    textDecoration: "none",
    display: "block",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 14px",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff",
    cursor: "pointer",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#f1f5f9",
  },
  actionLabel: {
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
    fontWeight: 500,
  },
};