// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/index";
import {
  MapPin,
  Users,
  Building2,
  Heart,
  FileText,
  TrendingUp,
  BookOpen,
  Clock,
  UserCheck,
  List,
  Activity,
  Sparkles,
  ArrowUpRight,
  Landmark,
  User2,
  Diamond,
  ListCheck,
  ShieldAlert,
  CreditCard,
  ClipboardList,
  BarChart,
  Menu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate } from "@/utils/translations";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import { useAdminAccess } from "@/utils/auth";
import { useGetAdminDashboardStats } from "@/hooks/useDashboardMutations";
import { formatRM } from "@/utils/helpers";
import { useMemo } from "react";
import QuotationOverdueAlert from "@/components/QuotationOverdueAlert";
import MobileAdminDashboard from "@/pages/Mobile/AdminDashboard";

export default function AdminDashboard() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileAdminDashboard />;
  return <AdminDashboardDesktop />;
}

function AdminDashboardDesktop() {
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

  const statsNeeded = useMemo(() => {
    const arr = ["OS"];

    if (isOrgCanManageGrave) arr.push("GD");
    if (isOrgCanBeDonated) arr.push("DDV");
    if (isOrgCanManageMosque) arr.push("CMC");
    if (isOrgGraveService) arr.push("QUO");

    return arr;
  }, [isOrgCanManageGrave, isOrgCanBeDonated, isOrgCanManageMosque, isOrgGraveService]);

  const isReady = !!currentUser?.organisation?.id;

  const {
    OSStats,
    GDStats,
    DDVStats,
    CMCStats,
    QUOStats,
    isOSLoading,
    isGDLoading,
    isDDVLoading,
    isCMCLoading,
    isQUOLoading,
  } = useGetAdminDashboardStats({
    currentUser,
    isSuperAdmin,
    statsNeeded,
    enabled: isReady,
  });

  const organisationCount = OSStats?.organisationCount ?? 0;
  const suggestionCount = OSStats?.suggestionCount ?? 0;
  const graveCount = GDStats?.graveCount ?? 0;
  const deadPersonCount = GDStats?.deadPersonCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;
  const deathCharityCount = CMCStats?.deathCharityCount ?? 0;
  const deathCharityMemberCount = CMCStats?.deathCharityMemberCount ?? 0;
  const deathCharityTotalPayout = CMCStats?.deathCharityTotalPayout ?? 0;
  const totalPendingQuo = QUOStats?.totalPendingQuo ?? 0;
  const totalCompleteQuo = QUOStats?.totalCompleteQuo ?? 0;
  const totalPayoutQuo = QUOStats?.totalPayoutQuo ?? 0;

  const quickStats = [
    ...(isOrgCanManageGrave
      ? [
          {
            label: translate("Total Graves"),
            value: graveCount || 0,
            icon: MapPin,
            page: "ManageGraves",
            loading: isGDLoading,
            cardGradient:
              "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
            iconGradient: "from-emerald-500 to-teal-500",
            textGradient:
              "from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
            textColor: "text-emerald-700 dark:text-emerald-400",
          },
          {
            label: translate("Total Deceased"),
            value: deadPersonCount || 0,
            icon: Users,
            page: "ManageDeadPersons",
            loading: isGDLoading,
            cardGradient:
              "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
            iconGradient: "from-blue-500 to-cyan-500",
            textGradient:
              "from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400",
            textColor: "text-blue-700 dark:text-blue-400",
          },
        ]
      : []),
    {
      label: translate("Total Organisations"),
      value: organisationCount || 0,
      icon: Building2,
      page: "ManageOrganisations",
      loading: isOSLoading,
      cardGradient:
        "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
      iconGradient: "from-violet-500 to-purple-500",
      textGradient:
        "from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400",
      textColor: "text-violet-700 dark:text-violet-400",
    },
  ];

  const deathCharity = [
    {
      label: translate("Total Khairat Kematian"),
      value: deathCharityCount || 0,
      icon: ListCheck,
      page: "ManageDeathCharity",
      loading: isCMCLoading,
      cardGradient:
        "from-amber-50 to-red-50 dark:from-amber-900/20 dark:to-red-900/20",
      iconGradient: "from-amber-500 to-red-500",
      textGradient:
        "from-amber-600 to-red-600 dark:from-amber-400 dark:to-red-400",
      textColor: "text-amber-700 dark:text-amber-400",
    },
    {
      label: translate("Total Ahli Khairat"),
      value: deathCharityMemberCount || 0,
      icon: User2,
      page: "ManageDeathCharityMember",
      loading: isCMCLoading,
      cardGradient:
        "from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20",
      iconGradient: "from-orange-500 to-blue-500",
      textGradient:
        "from-orange-600 to-blue-600 dark:from-orange-400 dark:to-blue-400",
      textColor: "text-orange-700 dark:text-orange-400",
    },
    {
      label: translate("Total Khairat Payout"),
      value: deathCharityTotalPayout || 0,
      icon: Diamond,
      page: "ManageDeathCharityClaim",
      loading: isCMCLoading,
      key: "money",
      cardGradient:
        "from-green-50 to-red-50 dark:from-green-900/20 dark:to-red-900/20",
      iconGradient: "from-green-500 to-red-500",
      textGradient:
        "from-green-600 to-red-600 dark:from-green-400 dark:to-red-400",
      textColor: "text-green-700 dark:text-green-400",
    },
  ];

  const quotations = [
    {
      label: translate("Total Pending Quotations"),
      value: totalPendingQuo || 0,
      icon: FileText,
      page: "ManageQuotations",
      loading: isQUOLoading,
      cardGradient:
        "from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20",
      iconGradient: "from-sky-500 to-blue-500",
      textGradient:
        "from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400",
      textColor: "text-sky-700 dark:text-sky-400",
    },
    {
      label: translate("Total Completed Quotations"),
      value: totalCompleteQuo || 0,
      icon: ListCheck,
      page: "ManageQuotations",
      loading: isQUOLoading,
      cardGradient:
        "from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20",
      iconGradient: "from-teal-500 to-green-500",
      textGradient:
        "from-teal-600 to-green-600 dark:from-teal-400 dark:to-green-400",
      textColor: "text-teal-700 dark:text-teal-400",
    },
    {
      label: translate("Total Quotation Payout"),
      value: totalPayoutQuo || 0,
      icon: Diamond,
      page: "ManageQuotations",
      loading: isQUOLoading,
      key: "money",
      cardGradient:
        "from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20",
      iconGradient: "from-indigo-500 to-violet-500",
      textGradient:
        "from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400",
      textColor: "text-indigo-700 dark:text-indigo-400",
    },
  ];

  const fullQuickStats = [
    ...quickStats,
    ...(isOrgCanManageMosque ? deathCharity : []),
    ...(isOrgGraveService ? quotations : []),
  ];

  const pendingItems = [
    {
      label: translate("Total Suggestions"),
      value: suggestionCount || 0,
      loading: isOSLoading,
      page: "ManageSuggestions",
      color: "amber",
      icon: FileText,
    },
    ...(isOrgCanBeDonated
      ? [
          {
            label: translate("Total Donations"),
            value: donationCount || 0,
            loading: isDDVLoading,
            page: "ManageDonations",
            color: "red",
            icon: Heart,
          },
        ]
      : []),
  ];

  if (loadingUser) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess || isTahfizAdmin) {
    return <AccessDeniedComponent />;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
                {translate("Admin Dashboard")}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {currentUser?.full_name || translate("Admin")} •{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin ? (
                <>
                  <Link to={createPageUrl("SuperAdminDashboard")}>
                    <Button
                      variant="outline"
                      className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      {translate("Super Admin")}
                    </Button>
                  </Link>

                  <Link to={createPageUrl("TahfizDashboard")}>
                    <Button
                      variant="outline"
                      className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      <BookOpen className="w-4 h-4" />
                      {translate("Tahfiz")}
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex gap-2 items-center">
                  <Link to={createPageUrl("StatisticDashboard")}>
                    <Button
                      variant="outline"
                      className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                    >
                      <BarChart className="w-4 h-4" />
                      {translate("Statistics")}
                    </Button>
                  </Link>

                  <Link to={createPageUrl("FinancialReports")}>
                    <Button
                      variant="outline"
                      className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      <Menu className="w-4 h-4" />
                      {translate("Financial Reports")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {fullQuickStats.map((stat, i) => (
            <Link key={i} to={createPageUrl(stat.page)} className="block group">
              <Card
                className={`hover:shadow-xl transition-all duration-300 border-0
              bg-gradient-to-br ${stat.cardGradient} hover:scale-105`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${stat.iconGradient}
                    rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${stat.textColor}`}
                      >
                        {stat.label}
                      </p>
                      <p
                        className={`text-right text-3xl font-bold bg-gradient-to-r
                      ${stat.textGradient} bg-clip-text text-transparent`}
                      >
                        {stat.loading
                          ? "—"
                          : stat.key === "money"
                            ? `${formatRM(stat.value)}`
                            : stat.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg h-full dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    {translate("Pending Approvals")}
                  </CardTitle>

                  <Badge
                    variant="secondary"
                    className="text-sm font-semibold px-3 py-1 bg-white/70 dark:bg-slate-700 backdrop-blur border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    {pendingItems.reduce(
                      (sum, item) => sum + (item.value || 0),
                      0,
                    )}{" "}
                    {translate("Total")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {pendingItems.map((item, i) => (
                    <Link key={i} to={createPageUrl(item.page)}>
                      <Card className="border-2 dark:border-slate-700 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-300 hover:shadow-md">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={`p-2.5 rounded-lg bg-${item.color}-100`}
                            >
                              <item.icon
                                className={`w-5 h-5 text-${item.color}-600`}
                              />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {item.loading ? (
                                <InlineLoadingComponent />
                              ) : (
                                item.value
                              )}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {item.label}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {isOrgCanBeDonated && (
                  <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                            {translate("Verified Donation")}
                          </p>
                          <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                            {isDDVLoading ? (
                              <InlineLoadingComponent />
                            ) : (
                              `${formatRM(donationVerified)}`
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-white dark:bg-slate-800 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {translate("Live tracking")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg h-full dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardTitle className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  {translate("Quick Actions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[
                    ...(isOrgCanManageGrave
                      ? [
                          {
                            label: translate("Manage Graves"),
                            page: "ManageGraves",
                            icon: MapPin,
                            color: "emerald",
                          },
                          {
                            label: translate("Manage Deceased"),
                            page: "ManageDeadPersons",
                            icon: Users,
                            color: "blue",
                          },
                        ]
                      : []),
                    {
                      label: translate("Manage Organisations"),
                      page: "ManageOrganisations",
                      icon: Building2,
                      color: "violet",
                    },
                    {
                      label: translate("Payment Config"),
                      page: "ManagePaymentConfig",
                      icon: CreditCard,
                      color: "emerald",
                    },
                    ...(isOrgCanBeDonated
                      ? [
                          {
                            label: translate("Manage Donations"),
                            page: "ManageDonations",
                            icon: Heart,
                            color: "red",
                          },
                        ]
                      : []),
                    {
                      label: translate("Manage Users"),
                      page: "ManageUsers",
                      icon: Users,
                      color: "indigo",
                    },
                    {
                      label: translate("Manage Permissions"),
                      page: "ManagePermissions",
                      icon: UserCheck,
                      color: "purple",
                    },
                    ...(isOrgCanManageMosque
                      ? [
                          {
                            label: translate("Manage Mosque"),
                            page: "ManageMosques",
                            icon: Landmark,
                            color: "stone",
                          },
                          {
                            label: translate("Manage Activity Posts"),
                            page: "ManageActivityPosts",
                            icon: List,
                            color: "amber",
                          },
                        ]
                      : []),
                    ...(isOrgGraveService
                      ? [
                          {
                            label: translate("Manage Quotations"),
                            page: "ManageQuotations",
                            icon: ClipboardList,
                            color: "sky",
                          },
                        ]
                      : []),
                  ].map((action, i) => (
                    <Link key={i} to={createPageUrl(action.page)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                      >
                        <action.icon
                          className={`w-4 h-4 mr-3 text-${action.color}-600 group-hover:scale-110 transition-transform`}
                        />
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                          {action.label}
                        </span>
                        <ArrowUpRight className="w-4 h-4 ml-auto text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isOrgGraveService && <QuotationOverdueAlert />}
    </>
  );
}
