// @ts-nocheck
import React from "react";
import { useIsNarrow } from "@/hooks/useIsNarrow";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";
import Breadcrumb from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import {
  Package,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  SlidersHorizontal,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ClipboardCheck,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useGetInventoryDashboardStats,
  useGetLowStockItems,
} from "@/hooks/useInventoryMutations";
import {
  InventoryItemStatus,
  InventoryTransactionType,
} from "@/utils/enums";

function txTypeLabel(type) {
  switch (type) {
    case InventoryTransactionType.STOCK_IN:   return { label: translate("Stock In"),   color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    case InventoryTransactionType.STOCK_OUT:  return { label: translate("Stock Out"),  color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    case InventoryTransactionType.RETURN:     return { label: translate("Return"),     color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    case InventoryTransactionType.ADJUSTMENT: return { label: translate("Adjustment"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    default: return { label: type, color: "" };
  }
}

function txTypeIcon(type) {
  switch (type) {
    case InventoryTransactionType.STOCK_IN:   return <TrendingUp className="h-3 w-3" />;
    case InventoryTransactionType.STOCK_OUT:  return <TrendingDown className="h-3 w-3" />;
    case InventoryTransactionType.RETURN:     return <RotateCcw className="h-3 w-3" />;
    case InventoryTransactionType.ADJUSTMENT: return <SlidersHorizontal className="h-3 w-3" />;
    default: return null;
  }
}

function statusLabel(status) {
  switch (status) {
    case InventoryItemStatus.AVAILABLE:    return { label: translate("Available"),    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    case InventoryItemStatus.LOW_STOCK:    return { label: translate("Low Stock"),    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    case InventoryItemStatus.OUT_OF_STOCK: return { label: translate("Out of Stock"), color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    default: return { label: status, color: "" };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InventoryDashboard() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryDashboard /> : <InventoryDashboardDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryDashboardDesktop() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const { stats, isLoading: statsLoading } = useGetInventoryDashboardStats();
  const { lowStockItems, isLoading: lowStockLoading } = useGetLowStockItems();

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const statCards = [
    {
      label: translate("Total Items"),
      value: stats?.totalItems ?? 0,
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: translate("Low Stock"),
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: translate("Out of Stock"),
      value: stats?.outOfStockCount ?? 0,
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translate("Inventory Dashboard")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {translate("Overview of inventory status and recent activity")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={createPageUrl("ManageInventoryItems")}>
              {translate("Manage Items")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border dark:border-slate-700 dark:bg-slate-800">
              <CardContent className="pt-6 pb-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {statsLoading ? "—" : card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
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
                { label: translate("Manage Items"),    page: "ManageInventoryItems",    icon: Package,         color: "blue" },
                { label: translate("Manage Packages"), page: "ManageInventoryPackages", icon: Boxes,           color: "indigo" },
                { label: translate("Stock In"),        page: "InventoryStockIn",        icon: ArrowDownToLine, color: "green" },
                { label: translate("Stock Out"),       page: "InventoryStockOut",       icon: ArrowUpFromLine, color: "red" },
                { label: translate("History"),         page: "InventoryHistory",        icon: History,         color: "orange" },
                { label: translate("Audit"),           page: "InventoryAudit",          icon: ClipboardCheck,  color: "teal" },
                { label: translate("Reports"),         page: "InventoryReports",        icon: BarChart3,       color: "pink" },
              ].map((action, i) => (
                <Link key={i} to={createPageUrl(action.page)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                  >
                    <action.icon className={`w-4 h-4 mr-3 text-${action.color}-600 group-hover:scale-110 transition-transform`} />
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

        {/* Recent Transactions */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {translate("Recent Transactions")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to={createPageUrl("InventoryHistory")}>
                  {translate("View All")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Item")}</TableHead>
                  <TableHead>{translate("Type")}</TableHead>
                  <TableHead className="text-right">{translate("Qty")}</TableHead>
                  <TableHead>{translate("Date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      {translate("Loading...")}
                    </TableCell>
                  </TableRow>
                ) : !stats?.recentTransactions?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      {translate("No transactions yet")}
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentTransactions.map((tx) => {
                    const { label, color } = txTypeLabel(tx.transaction_type);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium text-sm truncate max-w-[120px]">
                          {tx.item?.item_name || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                            {txTypeIcon(tx.transaction_type)}
                            {label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(tx.createdat)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {translate("Low Stock Alerts")}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to={createPageUrl("ManageInventoryItems")}>
                  {translate("Manage")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Item")}</TableHead>
                  <TableHead>{translate("Status")}</TableHead>
                  <TableHead className="text-right">{translate("Qty")}</TableHead>
                  <TableHead className="text-right">{translate("Min")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      {translate("Loading...")}
                    </TableCell>
                  </TableRow>
                ) : !lowStockItems.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      {translate("All items are sufficiently stocked")}
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.map((item) => {
                    const { label, color } = statusLabel(item.status);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm truncate max-w-[120px]">
                          {item.item_name}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                            {label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.current_quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-500">
                          {item.minimum_level}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryDashboard() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const { stats, isLoading: statsLoading } = useGetInventoryDashboardStats();
  const { lowStockItems, isLoading: lowStockLoading } = useGetLowStockItems();

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const statCards = [
    {
      label: translate("Total Items"),
      value: stats?.totalItems ?? 0,
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: translate("Low Stock"),
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: translate("Out of Stock"),
      value: stats?.outOfStockCount ?? 0,
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  const quickActions = [
    { label: translate("Manage Items"),    page: "ManageInventoryItems",    icon: Package,         color: "blue" },
    { label: translate("Manage Packages"), page: "ManageInventoryPackages", icon: Boxes,           color: "indigo" },
    { label: translate("Stock In"),        page: "InventoryStockIn",        icon: ArrowDownToLine, color: "green" },
    { label: translate("Stock Out"),       page: "InventoryStockOut",       icon: ArrowUpFromLine, color: "red" },
    { label: translate("History"),         page: "InventoryHistory",        icon: History,         color: "orange" },
    { label: translate("Audit"),           page: "InventoryAudit",          icon: ClipboardCheck,  color: "teal" },
    { label: translate("Reports"),         page: "InventoryReports",        icon: BarChart3,       color: "pink" },
  ];

  return (
    <div className="p-4 space-y-4">
      <Breadcrumb
        items={[
          { label: translate("Inventory"), page: "InventoryDashboard" },
        ]}
      />

      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {translate("Inventory Dashboard")}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {translate("Overview of inventory status and recent activity")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border dark:border-slate-700 dark:bg-slate-800">
              <CardContent className="p-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                  {statsLoading ? "—" : card.value}
                </p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1 leading-tight">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            {translate("Quick Actions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <Link key={i} to={createPageUrl(action.page)}>
                <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-100 dark:border-slate-700 py-3 px-2 active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
                  <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {translate("Low Stock Alerts")}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
              <Link to={createPageUrl("ManageInventoryItems")}>
                {translate("Manage")}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {lowStockLoading ? (
            <p className="text-center text-xs text-gray-400 py-4">{translate("Loading...")}</p>
          ) : !lowStockItems.length ? (
            <p className="text-center text-xs text-gray-400 py-4">{translate("All items are sufficiently stocked")}</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => {
                const { label, color } = statusLabel(item.status);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-slate-700/40 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.item_name}
                      </p>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
                        {label}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-xs text-gray-500">
                      {item.current_quantity} / {item.minimum_level}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {translate("Recent Transactions")}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
              <Link to={createPageUrl("InventoryHistory")}>
                {translate("View All")}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {statsLoading ? (
            <p className="text-center text-xs text-gray-400 py-4">{translate("Loading...")}</p>
          ) : !stats?.recentTransactions?.length ? (
            <p className="text-center text-xs text-gray-400 py-4">{translate("No transactions yet")}</p>
          ) : (
            <div className="space-y-2">
              {stats.recentTransactions.map((tx) => {
                const { label, color } = txTypeLabel(tx.transaction_type);
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-slate-700/40 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {tx.item?.item_name || "-"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
                          {txTypeIcon(tx.transaction_type)}
                          {label}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatDate(tx.createdat)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
