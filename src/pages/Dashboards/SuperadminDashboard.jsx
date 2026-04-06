import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Database,
  Terminal,
  Sparkles,
  List,
  CreditCard,
  Settings,
  UserCheck,
  UserX,
  Moon,
  Sun,
  Globe,
  Calendar,
  Gift,
  Zap,
  BookOpen,
  Home,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translate } from "@/utils/translations";
import AccessDeniedComponent from "@/components/AccessDeniedComponent.jsx";
import { useAdminAccess } from "@/utils/auth";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

// ─── Nav card ──────────────────────────────────────────────────────────────

const colorMap = {
  red: { bg: "bg-red-50", icon: "text-red-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-700" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-700" },
  purple: { bg: "bg-violet-50", icon: "text-violet-700" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-700" },
  blue: { bg: "bg-blue-50", icon: "text-blue-700" },
  green: { bg: "bg-green-50", icon: "text-green-700" },
  pink: { bg: "bg-pink-50", icon: "text-pink-700" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-700" },
  teal: { bg: "bg-teal-50", icon: "text-teal-700" },
};

function NavCard({ item }) {
  const colors = colorMap[item.color] ?? colorMap.indigo;
  return (
    <Link to={createPageUrl(item.page)}>
      <div className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 hover:bg-gray-50/60 transition-all duration-150 cursor-pointer">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            colors.bg,
          )}
        >
          <item.icon className={cn("w-4 h-4", colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {item.name}
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Section block ─────────────────────────────────────────────────────────

function Section({ title, items }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1">
        {translate(title)}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((item) => (
          <NavCard key={item.page} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function SuperadminDashboard() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();

  const superadminConfig = [
    {
      value: "users",
      title: translate("Users"),
      items: [
        {
          name: translate("Impersonate User"),
          page: "ImpersonateUser",
          icon: UserX,
          color: "red",
        },
        {
          name: translate("Manage Users"),
          page: "ManageUsers",
          icon: Users,
          color: "amber",
        },
        {
          name: translate("Manage Permissions"),
          page: "ManagePermissions",
          icon: UserCheck,
          color: "indigo",
        },
      ],
    },
    {
      value: "organisation",
      title: translate("Organisation"),
      sections: [
        {
          title: "Organisation",
          items: [
            {
              name: translate("Organisation Type"),
              page: "ManageOrganisationTypes",
              icon: List,
              color: "purple",
            },
            {
              name: translate("Manage Organisations"),
              page: "ManageOrganisations",
              icon: Database,
              color: "emerald",
            },
            {
              name: translate("Organisation Registrations"),
              page: "ManageTempOrganisations",
              icon: Users,
              color: "blue",
            },
          ],
        },
        {
          title: "Others",
          items: [
            {
              name: translate("Manage Tahfiz Centers"),
              page: "ManageTahfizCenters",
              icon: BookOpen,
              color: "amber",
            },
            {
              name: translate("Manage Private Organisations"),
              page: "ManagePrivateOrganisations",
              icon: Home,
              color: "red",
            },
            {
              name: translate("Manage Volunteer & NGO"),
              page: "ManageVolunteerNGO",
              icon: Users,
              color: "yellow",
            },
          ],
        },
      ],
    },
    {
      value: "payment",
      title: translate("Payment"),
      items: [
        {
          name: translate("Payment Platforms"),
          page: "ManagePaymentPlatforms",
          icon: CreditCard,
          color: "green",
        },
        {
          name: translate("Payment Fields"),
          page: "ManagePaymentFields",
          icon: Settings,
          color: "indigo",
        },
        {
          name: translate("ToyyibPay Config"),
          page: "ToyyibPayConfigPage",
          icon: Sun,
          color: "yellow",
        },
        {
          name: translate("Billplz Config"),
          page: "BillplzConfigPage",
          icon: Moon,
          color: "pink",
        },
      ],
    },
    {
      value: "system",
      title: translate("System"),
      items: [
        {
          name: translate("Activity Logs"),
          page: "ViewLogs",
          icon: Terminal,
          color: "pink",
        },
        {
          name: translate("Icons Library"),
          page: "IconLibrary",
          icon: Sparkles,
          color: "purple",
        },
        {
          name: translate("Manage Heritage"),
          page: "ManageHeritageSites",
          icon: Globe,
          color: "red",
        },
        {
          name: translate("Manage Islamic Events"),
          page: "ManageIslamicEvent",
          icon: Calendar,
          color: "emerald",
        },
        {
          name: translate("Manage Waqf Project"),
          page: "ManageWaqfProject",
          icon: Gift,
          color: "yellow",
        },
        {
          name: translate("Ollama"),
          page: "Ollama",
          icon: Zap,
          color: "indigo",
        },
      ],
    },
  ];

  if (loadingUser) return <PageLoadingComponent />;
  if (!isSuperAdmin) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <Shield className="w-[18px] h-[18px] text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              {translate("Super Admin Dashboard")}
            </h1>
            <p className="text-xs text-gray-400">
              {translate("System management console")}
            </p>
          </div>
        </div>
        <Link to={createPageUrl("AdminDashboard")}>
          <Badge className="flex items-center gap-1.5 w-fit bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer px-3 py-1.5">
            <Home className="w-3 h-3" />
            {translate("To Admin Dashboard")}
          </Badge>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={superadminConfig[0].value}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-gray-100/80 rounded-xl">
          {superadminConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg text-xs font-medium py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {superadminConfig.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-4 space-y-5"
          >
            {tab.sections ? (
              tab.sections.map((section) => (
                <Section
                  key={section.title}
                  title={section.title}
                  items={section.items}
                />
              ))
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tab.items?.map((item) => (
                  <NavCard key={item.page} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
