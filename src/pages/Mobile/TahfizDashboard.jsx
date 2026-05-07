import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  Users,
  Heart,
  Calendar,
  UserCheck,
  CheckCircle2,
  Sparkles,
  List,
  CreditCard,
  BarChart,
  ChevronRight,
  Activity,
} from "lucide-react";
import { translate } from "@/utils/translations";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import { useAdminAccess } from "@/utils/auth";
import { useGetAdminDashboardStats } from "@/hooks/useDashboardMutations";
import { formatRM } from "@/utils/helpers";

export default function MobileTahfizDashboard() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const isReady = !!currentUser?.tahfizcenter?.id;

  const { TTRStats, DDVStats, isTTRLoading, isDDVLoading } = useGetAdminDashboardStats({
    currentUser,
    isSuperAdmin,
    statsNeeded: ["TTR", "DDV"],
    enabled: isReady,
  });

  const tahfizCount = TTRStats?.tahfizCount ?? 0;
  const tahlilRequestCount = TTRStats?.tahlilRequestCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const today = new Date().toLocaleDateString("en-MY", {
    weekday: "long", day: "numeric", month: "long",
  });

  const coreStats = [
    { label: translate("Tahfiz Centers"), value: tahfizCount, icon: BookOpen, page: "ManageTahfizCenters", loading: isTTRLoading, color: "amber" },
    { label: translate("Tahlil Requests"), value: tahlilRequestCount, icon: Calendar, page: "ManageTahlilRequests", loading: isTTRLoading, color: "teal" },
    { label: translate("Total Donations"), value: donationCount, icon: Heart, page: "ManageDonations", loading: isDDVLoading, color: "rose" },
    { label: translate("Verified Donations"), value: donationVerified, icon: CheckCircle2, page: "ManageDonations", loading: isDDVLoading, isMoney: true, color: "green" },
  ];

  const quickActions = [
    { label: translate("Manage Tahfiz Centers"), page: "ManageTahfizCenters", icon: BookOpen, color: "amber" },
    { label: translate("Manage Tahlil Requests"), page: "ManageTahlilRequests", icon: Calendar, color: "teal" },
    { label: translate("Manage Donations"), page: "ManageDonations", icon: Heart, color: "rose" },
    { label: translate("Financial Reports"), page: "FinancialReports", icon: BarChart, color: "indigo" },
    { label: translate("Manage Activity Posts"), page: "ManageActivityPosts", icon: List, color: "amber" },
    { label: translate("My Payment Config"), page: "ManagePaymentConfig", icon: CreditCard, color: "teal" },
    { label: translate("Manage Users"), page: "ManageUsers", icon: Users, color: "blue" },
    { label: translate("Manage Permissions"), page: "ManagePermissions", icon: UserCheck, color: "violet" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.dateText}>{today}</p>
            <h1 style={styles.headerTitle}>{translate("Tahfiz Dashboard")}</h1>
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
              <Link to={createPageUrl("AdminDashboard")} style={{ ...styles.chip, ...styles.chipGreen }}>
                <BookOpen size={11} />
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={styles.body}>

        <SectionLabel label={translate("Overview")} />
        <div style={styles.grid}>
          {coreStats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Quick Actions */}
        <SectionLabel label={translate("Quick Actions")} />
        <div style={styles.actionList}>
          {quickActions.map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)} style={styles.actionLink}>
              <div style={{
                ...styles.actionRow,
                ...(i === quickActions.length - 1 ? { borderBottom: "none" } : {}),
              }}>
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
    </div>
  );
}

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
  teal:   { card: { background: "#f0fdfa" }, icon: { background: "#ccfbf1" }, iconColor: "#0d9488" },
  rose:   { card: { background: "#fff1f2" }, icon: { background: "#ffe4e6" }, iconColor: "#e11d48" },
  indigo: { card: { background: "#eef2ff" }, icon: { background: "#e0e7ff" }, iconColor: "#4338ca" },
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