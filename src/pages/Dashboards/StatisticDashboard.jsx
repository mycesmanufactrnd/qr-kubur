// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  MapPin,
  Users,
  Building2,
  FileText,
  BookOpen,
  Calendar,
  Heart,
  CheckCircle2,
  ListCheck,
  User2,
  Diamond,
  ClipboardList,
  ChevronLeft,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate } from "@/utils/translations";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAdminDashboardStats,
  useGetStatisticChartData,
  useGetStatisticOrgList,
  useGetStatisticGraveList,
  useGetStatisticDonationList,
} from "@/mutations/useDashboardMutations";
import { formatRM, formatDate } from "@/utils/helpers";
import { MONTHS_SHORT, PIE_COLORS } from "@/utils/enums";

function KpiCard({
  label,
  value,
  icon: Icon,
  color = "slate",
  loading,
  format = "number",
  sub,
}) {
  const cm = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      icon: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      val: "text-emerald-800 dark:text-emerald-300",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-400",
      val: "text-blue-800 dark:text-blue-300",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-900/20",
      icon: "bg-violet-500",
      text: "text-violet-700 dark:text-violet-400",
      val: "text-violet-800 dark:text-violet-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      icon: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      val: "text-amber-800 dark:text-amber-300",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-900/20",
      icon: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
      val: "text-rose-800 dark:text-rose-300",
    },
    teal: {
      bg: "bg-teal-50 dark:bg-teal-900/20",
      icon: "bg-teal-500",
      text: "text-teal-700 dark:text-teal-400",
      val: "text-teal-800 dark:text-teal-300",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      icon: "bg-orange-500",
      text: "text-orange-700 dark:text-orange-400",
      val: "text-orange-800 dark:text-orange-300",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: "bg-green-500",
      text: "text-green-700 dark:text-green-400",
      val: "text-green-800 dark:text-green-300",
    },
    sky: {
      bg: "bg-sky-50 dark:bg-sky-900/20",
      icon: "bg-sky-500",
      text: "text-sky-700 dark:text-sky-400",
      val: "text-sky-800 dark:text-sky-300",
    },
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      icon: "bg-indigo-500",
      text: "text-indigo-700 dark:text-indigo-400",
      val: "text-indigo-800 dark:text-indigo-300",
    },
    slate: {
      bg: "bg-slate-50 dark:bg-slate-800",
      icon: "bg-slate-500",
      text: "text-slate-700 dark:text-slate-400",
      val: "text-slate-800 dark:text-slate-300",
    },
  };
  const c = cm[color] ?? cm.slate;
  return (
    <Card className={`border-0 shadow-sm ${c.bg}`}>
      <CardContent className="p-5">
        <div className="mb-3">
          <div
            className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center shadow`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-1`}>
          {label}
        </p>
        <p className={`text-2xl font-bold ${c.val}`}>
          {loading
            ? "—"
            : format === "money"
              ? formatRM(value)
              : (value ?? 0).toLocaleString()}
        </p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, color = "slate" }) {
  const border = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    rose: "border-l-rose-500",
    teal: "border-l-teal-500",
    violet: "border-l-violet-500",
    sky: "border-l-sky-500",
    slate: "border-l-slate-400",
  };
  const text = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    teal: "text-teal-600 dark:text-teal-400",
    violet: "text-violet-600 dark:text-violet-400",
    sky: "text-sky-600 dark:text-sky-400",
    slate: "text-slate-600 dark:text-slate-400",
  };
  return (
    <div
      className={`flex items-center gap-3 mb-4 pl-3 border-l-4 ${border[color] ?? border.slate}`}
    >
      <Icon className={`w-5 h-5 ${text[color] ?? text.slate}`} />
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h2>
    </div>
  );
}

function ChartCard({ title, children, loading, minHeight = 260 }) {
  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {loading ? (
          <div
            style={{ minHeight }}
            className="flex items-center justify-center"
          >
            <InlineLoadingComponent />
          </div>
        ) : (
          <div style={{ minHeight }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

const fmtTooltipMoney = (v) => formatRM(v);
const fmtTooltipCount = (v) => v?.toLocaleString?.() ?? v;

const STATUS_COLOR = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function StatusBadge({ status }) {
  const s = String(status ?? "").toLowerCase();
  const cls = STATUS_COLOR[s] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function DataTable({
  columns,
  data = [],
  page,
  total,
  limit = 8,
  onPageChange,
  loading,
}) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <InlineLoadingComponent />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-slate-400 dark:text-slate-500"
                    >
                      {translate("No data")}
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr
                      key={row.id ?? i}
                      className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      {columns.map((c) => (
                        <td key={c.key} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          {c.render ? c.render(row) : (row[c.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
                {translate("of")} {total}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="h-7 px-3 text-xs"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="h-7 px-3 text-xs"
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function StatisticDashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    isTahfizAdmin,
    isOrganisationAdmin,
    isOrgCanManageMosque,
    isOrgGraveService,
    isOrgCanBeDonated,
    isOrgCanManageGrave,
  } = useAdminAccess();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [orgPage, setOrgPage] = useState(1);
  const [gravePage, setGravePage] = useState(1);
  const [donationPage, setDonationPage] = useState(1);

  const isReady = hasAdminAccess && !loadingUser;

  const statsNeeded = useMemo(() => {
    const arr = [];

    if (isOrganisationAdmin) arr.push("OS");

    if (isOrgCanManageGrave) arr.push("GD");

    if (isTahfizAdmin) arr.push("TTR");

    const needsDDV = isTahfizAdmin || isOrgCanBeDonated;
    if (needsDDV) arr.push("DDV");

    if (isOrganisationAdmin && isOrgCanManageMosque) arr.push("CMC");
    if (isOrganisationAdmin && isOrgGraveService) arr.push("QUO");

    return arr;
  }, [isOrganisationAdmin, isTahfizAdmin, isOrgCanBeDonated, isOrgCanManageMosque, isOrgGraveService]);

  const {
    OSStats,
    GDStats,
    TTRStats,
    DDVStats,
    CMCStats,
    QUOStats,
    isOSLoading,
    isGDLoading,
    isTTRLoading,
    isDDVLoading,
    isCMCLoading,
    isQUOLoading,
  } = useGetAdminDashboardStats({
    currentUser,
    isSuperAdmin,
    statsNeeded,
    enabled: isReady && statsNeeded.length > 0,
  });

  const { data: chartData, isLoading: isChartLoading } =
    useGetStatisticChartData({
      year,
      currentUser,
      hasOrg: isOrganisationAdmin,
      hasTahfiz: isTahfizAdmin,
      enabled: isReady && (isOrganisationAdmin || isTahfizAdmin),
    });

  const listEnabled = isReady;

  const { data: orgListData, isLoading: isOrgListLoading } =
    useGetStatisticOrgList({
      currentUser,
      hasOrg: isOrganisationAdmin,
      page: orgPage,
      enabled: listEnabled,
    });

  const { data: graveListData, isLoading: isGraveListLoading } =
    useGetStatisticGraveList({
      currentUser,
      hasOrg: isOrganisationAdmin,
      page: gravePage,
      enabled: listEnabled && isOrgCanManageGrave,
    });

  const { data: donationListData, isLoading: isDonationListLoading } =
    useGetStatisticDonationList({
      currentUser,
      hasOrg: isOrganisationAdmin,
      hasTahfiz: isTahfizAdmin,
      page: donationPage,
      enabled: listEnabled && (isOrgCanBeDonated || isTahfizAdmin),
    });

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent isPage/>;

  const orgCount = OSStats?.organisationCount ?? 0;
  const suggestionCount = OSStats?.suggestionCount ?? 0;
  const graveCount = GDStats?.graveCount ?? 0;
  const deadPersonCount = GDStats?.deadPersonCount ?? 0;
  const tahfizCount = TTRStats?.tahfizCount ?? 0;
  const tahlilRequestCount = TTRStats?.tahlilRequestCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;
  const deathCharityCount = CMCStats?.deathCharityCount ?? 0;
  const deathCharityMemberCount = CMCStats?.deathCharityMemberCount ?? 0;
  const deathCharityPayout = CMCStats?.deathCharityTotalPayout ?? 0;
  const pendingQuo = QUOStats?.totalPendingQuo ?? 0;
  const completeQuo = QUOStats?.totalCompleteQuo ?? 0;
  const payoutQuo = QUOStats?.totalPayoutQuo ?? 0;

  const addMonthLabel = (arr = []) =>
    arr.map((d, i) => ({ ...d, label: MONTHS_SHORT[i] }));

  const monthlyGravesData = addMonthLabel(chartData?.monthlyGraves);
  const monthlyDeadData = addMonthLabel(chartData?.monthlyDeadPersons);
  const monthlyDonationsData = addMonthLabel(chartData?.monthlyDonations);
  const monthlyTahlilData = addMonthLabel(chartData?.monthlyTahlil);
  const gravesByState = chartData?.gravesByState ?? [];
  const donationsByStatus = chartData?.donationsByStatus ?? [];

  // Merge graves + deceased for one combined line chart
  const combinedOrgMonthly = MONTHS_SHORT.map((label, i) => ({
    label,
    graves: monthlyGravesData[i]?.count ?? 0,
    deceased: monthlyDeadData[i]?.count ?? 0,
  }));

  const yearOptions = Array.from(
    { length: 6 },
    (_, i) => now.getFullYear() - i,
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
              {translate("Statistic Dashboard")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              {currentUser?.full_name || translate("Admin")} •{" "}
              {new Date().toLocaleDateString("en-MY", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
            >
              <ChevronLeft className="w-4 h-4" />
              {translate("Back")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {isOrganisationAdmin && (
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium px-3 py-1">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              {translate("Organisation Admin")}
            </Badge>
          )}
          {isTahfizAdmin && (
            <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-medium px-3 py-1">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              {translate("Tahfiz Admin")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {translate("Chart Year")}:
          </span>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none h-8 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {isOrganisationAdmin && (
          <div>
            <SectionHeader
              title={translate("Organisation & Cemetery")}
              icon={MapPin}
              color="emerald"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KpiCard
                label={translate("Organisations")}
                value={orgCount}
                icon={Building2}
                color="emerald"
                loading={isOSLoading}
              />
              {isOrgCanManageGrave && (
                <KpiCard
                  label={translate("Graves")}
                  value={graveCount}
                  icon={MapPin}
                  color="teal"
                  loading={isGDLoading}
                />
              )}
              {isOrgCanManageGrave && (
                <KpiCard
                  label={translate("Deceased")}
                  value={deadPersonCount}
                  icon={Users}
                  color="blue"
                  loading={isGDLoading}
                  sub={translate("Registered deceased")}
                />
              )}
              <KpiCard
                label={translate("Suggestions")}
                value={suggestionCount}
                icon={FileText}
                color="amber"
                loading={isOSLoading}
                sub={translate("Pending review")}
              />
            </div>

            {isOrgCanManageGrave && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard
                  title={`${translate("Monthly Graves & Deceased Added")} — ${year}`}
                  loading={isChartLoading}
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                      data={combinedOrgMonthly}
                      margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={fmtTooltipCount}
                        contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="graves"
                        name={translate("Graves")}
                        stroke="#059669"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="deceased"
                        name={translate("Deceased")}
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div>
                <ChartCard
                  title={translate("Graves by State")}
                  loading={isChartLoading}
                >
                  {gravesByState.length === 0 ? (
                    <div className="flex items-center justify-center h-56 text-slate-400 dark:text-slate-500 text-sm">
                      {translate("No data")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={gravesByState.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="state"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          width={72}
                        />
                        <Tooltip
                          formatter={fmtTooltipCount}
                          contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                        />
                        <Bar
                          dataKey="count"
                          name={translate("Graves")}
                          fill="#059669"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </div>)}

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {translate("Organisations")}
              </p>
              <DataTable
                columns={[
                  { key: "name", label: translate("Name") },
                  { key: "address", label: translate("Address") },
                  {
                    key: "status",
                    label: translate("Status"),
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                ]}
                data={orgListData?.items ?? []}
                page={orgPage}
                total={orgListData?.total ?? 0}
                onPageChange={setOrgPage}
                loading={isOrgListLoading}
              />
            </div>

            {isOrgCanManageGrave && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {translate("Graves")}
                </p>
                <DataTable
                  columns={[
                    { key: "name", label: translate("Name") },
                    { key: "orgName", label: translate("Organisation") },
                    { key: "state", label: translate("State") },
                    { key: "block", label: translate("Block") },
                    { key: "lot", label: translate("Lot") },
                    {
                      key: "status",
                      label: translate("Status"),
                      render: (row) => <StatusBadge status={row.status} />,
                    },
                  ]}
                  data={graveListData?.items ?? []}
                  page={gravePage}
                  total={graveListData?.total ?? 0}
                  onPageChange={setGravePage}
                  loading={isGraveListLoading}
                />
              </div>
            )}
          </div>
        )}

        {isTahfizAdmin && (
          <div>
            <SectionHeader
              title={translate("Tahfiz")}
              icon={BookOpen}
              color="amber"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KpiCard
                label={translate("Tahfiz Centers")}
                value={tahfizCount}
                icon={BookOpen}
                color="amber"
                loading={isTTRLoading}
              />
              <KpiCard
                label={translate("Pending Tahlil")}
                value={tahlilRequestCount}
                icon={Calendar}
                color="orange"
                loading={isTTRLoading}
                sub={translate("Awaiting response")}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title={`${translate("Monthly Tahlil Requests")} — ${year}`}
                loading={isChartLoading}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={monthlyTahlilData}
                    margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={fmtTooltipCount}
                      contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                    />
                    <Bar
                      dataKey="count"
                      name={translate("Tahlil Requests")}
                      fill="#d97706"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {(isOrgCanBeDonated || isTahfizAdmin) && (
          <div>
            <SectionHeader
              title={translate("Donations")}
              icon={Heart}
              color="rose"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KpiCard
                label={translate("Pending Donations")}
                value={donationCount}
                icon={Heart}
                color="rose"
                loading={isDDVLoading}
                sub={translate("Awaiting verification")}
              />
              <KpiCard
                label={translate("Verified Amount")}
                value={donationVerified}
                icon={CheckCircle2}
                color="green"
                loading={isDDVLoading}
                format="money"
                sub={translate("Total collected")}
              />
              {donationsByStatus.map((d, i) => (
                <KpiCard
                  key={d.status}
                  label={translate(
                    d.status.charAt(0).toUpperCase() + d.status.slice(1),
                  )}
                  value={d.count}
                  icon={Heart}
                  color={["rose", "green", "amber"][i % 3]}
                  loading={isDDVLoading}
                  sub={formatRM(d.amount)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard
                  title={`${translate("Monthly Donations")} — ${year}`}
                  loading={isChartLoading}
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={monthlyDonationsData}
                      margin={{ top: 4, right: 24, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v, name) =>
                          name === translate("Amount (RM)")
                            ? formatRM(v)
                            : fmtTooltipCount(v)
                        }
                        contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        name={translate("Count")}
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="amount"
                        name={translate("Amount (RM)")}
                        stroke="#059669"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <ChartCard
                title={translate("Donations by Status")}
                loading={isChartLoading}
              >
                {donationsByStatus.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-slate-400 dark:text-slate-500 text-sm">
                    {translate("No data")}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={donationsByStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                          fontSize={10}
                        >
                          {donationsByStatus.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={fmtTooltipCount}
                          contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {donationsByStatus.map((d, i) => (
                        <span
                          key={d.status}
                          className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          {d.status} ({d.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {translate("Recent Donations")}
              </p>
              <DataTable
                columns={[
                  { key: "donorname", label: translate("Donor") },
                  {
                    key: "source",
                    label: translate("Source"),
                    render: (row) => (
                      <span>
                        {row.source ?? "—"}
                        {row.sourceType === "tahfiz" && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400 text-xs">
                            (Tahfiz)
                          </span>
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "amount",
                    label: translate("Amount"),
                    render: (row) => formatRM(row.amount),
                  },
                  {
                    key: "status",
                    label: translate("Status"),
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "createdat",
                    label: translate("Date"),
                    render: (row) => formatDate(row.createdat),
                  },
                ]}
                data={donationListData?.items ?? []}
                page={donationPage}
                total={donationListData?.total ?? 0}
                onPageChange={setDonationPage}
                loading={isDonationListLoading}
              />
            </div>
          </div>
        )}

        {isOrgCanManageMosque && (
          <div>
            <SectionHeader
              title={translate("Death Charity (Khairat Kematian)")}
              icon={ListCheck}
              color="violet"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KpiCard
                label={translate("Khairat Kematian")}
                value={deathCharityCount}
                icon={ListCheck}
                color="violet"
                loading={isCMCLoading}
              />
              <KpiCard
                label={translate("Ahli Khairat")}
                value={deathCharityMemberCount}
                icon={User2}
                color="indigo"
                loading={isCMCLoading}
                sub={translate("Total members")}
              />
              <KpiCard
                label={translate("Total Payout")}
                value={deathCharityPayout}
                icon={Diamond}
                color="green"
                loading={isCMCLoading}
                format="money"
                sub={translate("Claims paid out")}
              />
            </div>
          </div>
        )}

        {isOrgGraveService && (
          <div>
            <SectionHeader
              title={translate("Quotations")}
              icon={ClipboardList}
              color="sky"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KpiCard
                label={translate("Pending")}
                value={pendingQuo}
                icon={ClipboardList}
                color="sky"
                loading={isQUOLoading}
                sub={translate("Awaiting action")}
              />
              <KpiCard
                label={translate("Completed")}
                value={completeQuo}
                icon={CheckCircle2}
                color="teal"
                loading={isQUOLoading}
              />
              <KpiCard
                label={translate("Revenue")}
                value={payoutQuo}
                icon={TrendingUp}
                color="indigo"
                loading={isQUOLoading}
                format="money"
                sub={translate("Organisation Share (95%)")}
              />
            </div>
          </div>
        )}

        <Card className="border-0 shadow-md bg-gradient-to-r from-slate-800 to-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                  {translate("Total Entities Under Management")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {(
                    graveCount +
                    deadPersonCount +
                    orgCount +
                    tahfizCount
                  ).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {[
                    isOrganisationAdmin &&
                      `${graveCount.toLocaleString()} ${translate("Graves")}`,
                    isOrganisationAdmin &&
                      `${deadPersonCount.toLocaleString()} ${translate("Deceased")}`,
                    isOrganisationAdmin &&
                      `${orgCount.toLocaleString()} ${translate("Orgs")}`,
                    isTahfizAdmin &&
                      `${tahfizCount.toLocaleString()} ${translate("Tahfiz")}`,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                  {translate("Total Revenue Tracked")}
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatRM(donationVerified + deathCharityPayout + payoutQuo)}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {[
                    (isOrgCanBeDonated || isTahfizAdmin) &&
                      `${formatRM(donationVerified)} ${translate("Donations")}`,
                    isOrgCanManageMosque &&
                      `${formatRM(deathCharityPayout)} ${translate("Khairat")}`,
                    isOrgGraveService &&
                      `${formatRM(payoutQuo)} ${translate("Quotations")}`,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
