// @ts-nocheck
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
    <div className="min-h-screen pb-8 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{today}</p>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{translate("Tahfiz Dashboard")}</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Activity size={13} />
              {currentUser?.full_name || translate("Admin")}
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-col gap-1.5 items-end">
              <Link
                to={createPageUrl("SuperAdminDashboard")}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 no-underline"
              >
                <Sparkles size={11} />
                Super
              </Link>
              <Link
                to={createPageUrl("AdminDashboard")}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 no-underline"
              >
                <BookOpen size={11} />
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <SectionLabel label={translate("Overview")} />
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {coreStats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        <SectionLabel label={translate("Quick Actions")} />
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-5">
          {quickActions.map((a, i) => (
            <Link
              key={i}
              to={createPageUrl(a.page)}
              className={`flex items-center gap-3 px-3.5 py-3 no-underline bg-white dark:bg-slate-800 active:bg-slate-50 dark:active:bg-slate-700 transition-colors ${
                i < quickActions.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorMap[a.color]?.iconBg}`}>
                <a.icon size={14} className={colorMap[a.color]?.iconColor} />
              </div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">{a.label}</span>
              <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 mt-1">
      {label}
    </p>
  );
}

function StatCard({ label, value, icon: Icon, page, loading, isMoney, color = "blue" }) {
  return (
    <Link to={createPageUrl(page)} className="no-underline">
      <div className={`rounded-2xl border p-3.5 ${colorMap[color]?.card}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${colorMap[color]?.iconBg}`}>
          <Icon size={14} className={colorMap[color]?.iconColor} />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mb-1">{label}</p>
        <p className={`font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight ${isMoney ? "text-[17px]" : "text-[22px]"}`}>
          {loading
            ? <span className="text-slate-200 dark:text-slate-700">—</span>
            : isMoney
              ? formatRM(value)
              : value.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

const colorMap = {
  green:  { card: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30",     iconBg: "bg-green-100 dark:bg-green-900/40",   iconColor: "text-green-600 dark:text-green-400" },
  blue:   { card: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30",         iconBg: "bg-blue-100 dark:bg-blue-900/40",     iconColor: "text-blue-600 dark:text-blue-400" },
  violet: { card: "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30", iconBg: "bg-violet-100 dark:bg-violet-900/40", iconColor: "text-violet-600 dark:text-violet-400" },
  amber:  { card: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30",     iconBg: "bg-amber-100 dark:bg-amber-900/40",   iconColor: "text-amber-600 dark:text-amber-400" },
  orange: { card: "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30", iconBg: "bg-orange-100 dark:bg-orange-900/40", iconColor: "text-orange-600 dark:text-orange-400" },
  teal:   { card: "bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/30",         iconBg: "bg-teal-100 dark:bg-teal-900/40",     iconColor: "text-teal-600 dark:text-teal-400" },
  rose:   { card: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30",         iconBg: "bg-rose-100 dark:bg-rose-900/40",     iconColor: "text-rose-600 dark:text-rose-400" },
  indigo: { card: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30", iconBg: "bg-indigo-100 dark:bg-indigo-900/40", iconColor: "text-indigo-600 dark:text-indigo-400" },
};
