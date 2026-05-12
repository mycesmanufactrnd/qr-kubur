// @ts-nocheck
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
    // { label: translate("Suggestions"), value: suggestionCount, icon: FileText, page: "ManageSuggestions", loading: isOGDSLoading, color: "amber" },
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
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 tracking-wider">{today}</p>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-100 -tracking-wide m-0">
              {translate("Admin Dashboard")}
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Activity size={13} />
              {currentUser?.full_name || translate("Admin")}
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-col gap-1.5 items-end">
              <Link
                to={createPageUrl("SuperAdminDashboard")}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 no-underline"
              >
                <Sparkles size={11} />
                Super
              </Link>
              <Link
                to={createPageUrl("TahfizDashboard")}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 no-underline"
              >
                <BookOpen size={11} />
                Tahfiz
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Overdue Alert */}
        {isGraveServices && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3.5 py-2.5 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[13px] text-amber-800 dark:text-amber-300 flex-1">
              {totalPendingQuo > 0
                ? `${totalPendingQuo} quotation${totalPendingQuo > 1 ? "s" : ""} pending review`
                : "All quotations are up to date"}
            </span>
            <Bell size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
        )}

        {/* Core Stats */}
        <SectionLabel label={translate("Overview")} />
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {coreStats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Khairat */}
        {isHasManageMosque && (
          <>
            <SectionLabel label={translate("Khairat Kematian")} />
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {charityStats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>
          </>
        )}

        {/* Quotations */}
        {isGraveServices && (
          <>
            <SectionLabel label={translate("Quotations")} />
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {quoStats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>
          </>
        )}

        {/* Donations */}
        {isCanBeDonated && (
          <>
            <SectionLabel label={translate("Donations")} />
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <Link to={createPageUrl("ManageDonations")} className="block no-underline">
                <div className="rounded-2xl p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-slate-100 dark:border-white/5 h-full">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 bg-rose-100 dark:bg-rose-800/60 shrink-0">
                    <Heart size={14} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="text-[11px] font-medium leading-tight mb-1 text-slate-500 dark:text-slate-400">{translate("Total Donations")}</p>
                  <p className="text-[22px] font-bold leading-none tracking-tight text-rose-800 dark:text-rose-300">
                    {isDDVLoading ? <span className="text-slate-300 dark:text-slate-600">—</span> : donationCount.toLocaleString()}
                  </p>
                </div>
              </Link>
              <div className="rounded-2xl p-3.5 bg-green-50 dark:bg-green-900/20 border border-slate-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 bg-green-100 dark:bg-green-800/60 shrink-0">
                  <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-[11px] font-medium leading-tight mb-1 text-slate-500 dark:text-slate-400">{translate("Verified Donation")}</p>
                <p className="text-[17px] font-bold leading-none tracking-tight text-green-800 dark:text-green-300">
                  {isDDVLoading ? <span className="text-slate-300 dark:text-slate-600">—</span> : formatRM(donationVerified)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <SectionLabel label={translate("Quick Actions")} />
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-5">
          {quickActions.map((a, i) => (
            <Link key={i} to={createPageUrl(a.page)} className="block no-underline">
              <div className="flex items-center gap-3 px-3.5 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorMap[a.color]?.icon ?? colorMap.blue.icon}`}>
                  <a.icon size={14} className={colorMap[a.color]?.iconText ?? colorMap.blue.iconText} />
                </div>
                <span className="text-[14px] text-slate-700 dark:text-slate-200 flex-1 font-medium">{a.label}</span>
                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
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
  return (
    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 mt-1">
      {label}
    </p>
  );
}

function StatCard({ label, value, icon: Icon, page, loading, isMoney, color = "blue", wide }) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <Link
      to={createPageUrl(page)}
      className={`block no-underline ${wide ? "col-span-2" : ""}`}
    >
      <div className={`rounded-2xl h-full border border-slate-100 dark:border-white/5 ${c.card} ${wide ? "flex items-center gap-3 px-3.5 py-3" : "p-3.5"}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.icon} ${wide ? "" : "mb-2.5"}`}>
          <Icon size={14} className={c.iconText} />
        </div>
        <div>
          <p className="text-[11px] font-medium leading-tight mb-1 text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`font-bold leading-none tracking-tight ${isMoney ? "text-[17px]" : "text-[22px]"} ${c.value}`}>
            {loading
              ? <span className="text-slate-300 dark:text-slate-600">—</span>
              : isMoney ? formatRM(value) : value.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Color map (Tailwind classes) ── */
const colorMap = {
  green:  { card: "bg-green-50 dark:bg-green-900/20",   icon: "bg-green-100 dark:bg-green-800/60",   iconText: "text-green-600 dark:text-green-400",   value: "text-green-800 dark:text-green-300" },
  blue:   { card: "bg-blue-50 dark:bg-blue-900/20",     icon: "bg-blue-100 dark:bg-blue-800/60",     iconText: "text-blue-600 dark:text-blue-400",     value: "text-blue-800 dark:text-blue-300" },
  violet: { card: "bg-violet-50 dark:bg-violet-900/20", icon: "bg-violet-100 dark:bg-violet-800/60", iconText: "text-violet-600 dark:text-violet-400", value: "text-violet-800 dark:text-violet-300" },
  amber:  { card: "bg-amber-50 dark:bg-amber-900/20",   icon: "bg-amber-100 dark:bg-amber-800/60",   iconText: "text-amber-600 dark:text-amber-400",   value: "text-amber-800 dark:text-amber-300" },
  orange: { card: "bg-orange-50 dark:bg-orange-900/20", icon: "bg-orange-100 dark:bg-orange-800/60", iconText: "text-orange-600 dark:text-orange-400", value: "text-orange-800 dark:text-orange-300" },
  sky:    { card: "bg-sky-50 dark:bg-sky-900/20",       icon: "bg-sky-100 dark:bg-sky-800/60",       iconText: "text-sky-600 dark:text-sky-400",       value: "text-sky-800 dark:text-sky-300" },
  teal:   { card: "bg-teal-50 dark:bg-teal-900/20",     icon: "bg-teal-100 dark:bg-teal-800/60",     iconText: "text-teal-600 dark:text-teal-400",     value: "text-teal-800 dark:text-teal-300" },
  rose:   { card: "bg-rose-50 dark:bg-rose-900/20",     icon: "bg-rose-100 dark:bg-rose-800/60",     iconText: "text-rose-600 dark:text-rose-400",     value: "text-rose-800 dark:text-rose-300" },
  indigo: { card: "bg-indigo-50 dark:bg-indigo-900/20", icon: "bg-indigo-100 dark:bg-indigo-800/60", iconText: "text-indigo-600 dark:text-indigo-400", value: "text-indigo-800 dark:text-indigo-300" },
  stone:  { card: "bg-stone-50 dark:bg-stone-900/20",   icon: "bg-stone-100 dark:bg-stone-800/60",   iconText: "text-stone-600 dark:text-stone-400",   value: "text-stone-800 dark:text-stone-300" },
  purple: { card: "bg-purple-50 dark:bg-purple-900/20", icon: "bg-purple-100 dark:bg-purple-800/60", iconText: "text-purple-600 dark:text-purple-400", value: "text-purple-800 dark:text-purple-300" },
};
