// @ts-nocheck
import React from "react";
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
  Wrench,
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
    {
      label: translate("Assets In Use"),
      value: stats?.assetsInUse ?? 0,
      icon: Wrench,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
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
                { label: translate("Manage Assets"),   page: "ManageInventoryAssets",   icon: Wrench,          color: "purple" },
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
                          {tx.item_name_snapshot || tx.item?.item_name || "-"}
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
                          {formatDate(tx.transaction_date)}
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
