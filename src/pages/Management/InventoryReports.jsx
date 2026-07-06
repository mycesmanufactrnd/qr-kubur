// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState } from "react";
import { translate } from "@/utils/translations";
import {
  FileBarChart2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import { trpc } from "@/utils/trpc";
import { useGetInventoryStockSummary } from "@/hooks/useInventoryMutations";
import {
  InventoryTransactionType,
  InventoryTransactionSource,
} from "@/utils/enums";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TX_TYPE_CONFIG = {
  [InventoryTransactionType.STOCK_IN]:   { label: "Stock In",   color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",     icon: TrendingUp,        qtyColor: "text-green-700 dark:text-green-400",  prefix: "+" },
  [InventoryTransactionType.STOCK_OUT]:  { label: "Stock Out",  color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",             icon: TrendingDown,      qtyColor: "text-red-600 dark:text-red-400",      prefix: ""  },
  [InventoryTransactionType.RETURN]:     { label: "Return",     color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",         icon: RotateCcw,         qtyColor: "text-blue-600 dark:text-blue-400",    prefix: "+" },
  [InventoryTransactionType.ADJUSTMENT]: { label: "Adjustment", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: SlidersHorizontal, qtyColor: "text-yellow-700 dark:text-yellow-400", prefix: ""  },
};

const sourceLabels = {
  [InventoryTransactionSource.RESTOCK]: "Restock",
  [InventoryTransactionSource.RETURN]:  "Pulangan",
  [InventoryTransactionSource.MANUAL]:  "Manual",
  [InventoryTransactionSource.KES]:     "Kes",
};

function txTypeBadge(type) {
  const cfg = TX_TYPE_CONFIG[type];
  if (!cfg) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{type}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {translate(cfg.label)}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ms-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

// Stock-level bar (visual width 0–100%)
function StockBar({ available, lowStock, outOfStock }) {
  const total = (available || 0) + (lowStock || 0) + (outOfStock || 0);
  if (!total) return null;
  const avPct  = Math.round(((available || 0) / total) * 100);
  const lowPct = Math.round(((lowStock || 0) / total) * 100);
  const outPct = 100 - avPct - lowPct;
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden gap-px">
      {avPct  > 0 && <div className="bg-green-500"  style={{ width: `${avPct}%` }} />}
      {lowPct > 0 && <div className="bg-yellow-400" style={{ width: `${lowPct}%` }} />}
      {outPct > 0 && <div className="bg-red-400"    style={{ width: `${outPct}%` }} />}
    </div>
  );
}

export default function InventoryReports() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryReports /> : <InventoryReportsDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryReportsDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgoStr());
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [filterType, setFilterType] = useState("all");
  const [queryParams, setQueryParams] = useState({
    dateFrom: thirtyDaysAgoStr(),
    dateTo:   todayStr(),
    filterType: undefined,
  });

  const { stockSummary, isLoading: summaryLoading } = useGetInventoryStockSummary();

  const { data: reportData, isLoading: reportLoading } = trpc.inventoryTransaction.getTransactionReport.useQuery(
    {
      dateFrom: queryParams.dateFrom,
      dateTo:   queryParams.dateTo,
      filterType: queryParams.filterType,
    },
    { enabled: hasAdminAccess && !!queryParams.dateFrom && !!queryParams.dateTo },
  );

  const handleSearch = () => {
    setQueryParams({
      dateFrom,
      dateTo,
      filterType: filterType !== "all" ? filterType : undefined,
    });
  };

  // Compute summary totals for the report
  const reportTotals = (reportData ?? []).reduce(
    (acc, tx) => {
      if (tx.transaction_type === InventoryTransactionType.STOCK_IN)  acc.stockIn  += tx.quantity;
      if (tx.transaction_type === InventoryTransactionType.STOCK_OUT) acc.stockOut += tx.quantity;
      if (tx.transaction_type === InventoryTransactionType.RETURN)    acc.returns  += tx.quantity;
      acc.total++;
      return acc;
    },
    { stockIn: 0, stockOut: 0, returns: 0, total: 0 },
  );

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"),    page: "AdminDashboard"    },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Reports"),            page: "InventoryReports"  },
      ]} />

      <div className="flex items-center gap-2">
        <FileBarChart2 className="w-6 h-6 text-orange-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Inventory Reports")}
        </h1>
      </div>

      {/* ── Stock Summary by Category ── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {translate("Stock Summary by Category")}
        </h2>
        <Card className="border-0 shadow-md dark:bg-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Category")}</TableHead>
                  <TableHead className="text-right">{translate("Total Items")}</TableHead>
                  <TableHead className="text-right">{translate("Total Qty")}</TableHead>
                  <TableHead className="text-right text-green-700 dark:text-green-400">{translate("Available")}</TableHead>
                  <TableHead className="text-right text-yellow-600 dark:text-yellow-400">{translate("Low Stock")}</TableHead>
                  <TableHead className="text-right text-red-600 dark:text-red-400">{translate("Out of Stock")}</TableHead>
                  <TableHead className="w-32">{translate("Distribution")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryLoading ? (
                  <InlineLoadingComponent isTable colSpan={7} />
                ) : !stockSummary.length ? (
                  <NoDataTableComponent colSpan={7} />
                ) : (
                  stockSummary.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="font-medium">{row.category}</TableCell>
                      <TableCell className="text-right font-mono">{row.total_items}</TableCell>
                      <TableCell className="text-right font-mono">{row.total_quantity ?? 0}</TableCell>
                      <TableCell className="text-right font-mono text-green-700 dark:text-green-400">{row.available_count}</TableCell>
                      <TableCell className="text-right font-mono text-yellow-600 dark:text-yellow-400">{row.low_stock_count}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 dark:text-red-400">{row.out_of_stock_count}</TableCell>
                      <TableCell>
                        <StockBar
                          available={Number(row.available_count)}
                          lowStock={Number(row.low_stock_count)}
                          outOfStock={Number(row.out_of_stock_count)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── Transaction Report ── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {translate("Transaction Report")}
        </h2>

        {/* Filter bar */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">{translate("From")}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="dark:border-slate-600 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">{translate("To")}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="dark:border-slate-600 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">{translate("Type")}</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="dark:border-slate-600 dark:bg-transparent dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translate("All Types")}</SelectItem>
                    <SelectItem value={InventoryTransactionType.STOCK_IN}>{translate("Stock In")}</SelectItem>
                    <SelectItem value={InventoryTransactionType.STOCK_OUT}>{translate("Stock Out")}</SelectItem>
                    <SelectItem value={InventoryTransactionType.RETURN}>{translate("Return")}</SelectItem>
                    <SelectItem value={InventoryTransactionType.ADJUSTMENT}>{translate("Adjustment")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <Search className="w-4 h-4 mr-2" />
                  {translate("Generate")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary stat cards */}
        {!reportLoading && reportData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: translate("Total Transactions"), value: reportTotals.total,   color: "text-gray-700 dark:text-gray-200"         },
              { label: translate("Stock In"),           value: reportTotals.stockIn,  color: "text-green-700 dark:text-green-400"        },
              { label: translate("Stock Out"),          value: reportTotals.stockOut, color: "text-red-600 dark:text-red-400"            },
              { label: translate("Returns"),            value: reportTotals.returns,  color: "text-blue-600 dark:text-blue-400"          },
            ].map((s) => (
              <Card key={s.label} className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 font-mono ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report table */}
        <Card className="border-0 shadow-md dark:bg-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Date")}</TableHead>
                  <TableHead>{translate("Type")}</TableHead>
                  <TableHead>{translate("Item")}</TableHead>
                  <TableHead>{translate("Package")}</TableHead>
                  <TableHead className="text-right">{translate("Qty")}</TableHead>
                  <TableHead className="text-right">{translate("Before")}</TableHead>
                  <TableHead className="text-right">{translate("After")}</TableHead>
                  <TableHead>{translate("Source")}</TableHead>
                  <TableHead>{translate("Recorded By")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLoading ? (
                  <InlineLoadingComponent isTable colSpan={9} />
                ) : !reportData || reportData.length === 0 ? (
                  <NoDataTableComponent colSpan={9} />
                ) : (
                  reportData.map((tx) => {
                    const cfg = TX_TYPE_CONFIG[tx.transaction_type];
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </TableCell>
                        <TableCell>{txTypeBadge(tx.transaction_type)}</TableCell>
                        <TableCell className="font-medium text-sm">
                          {tx.item_name_snapshot || tx.item?.item_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {tx.package_name_snapshot || "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${cfg?.qtyColor ?? ""}`}>
                          {cfg?.prefix}{tx.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-400">{tx.before_quantity ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-gray-500">{tx.after_quantity ?? "—"}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {sourceLabels[tx.source] ?? tx.source ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {tx.createdby?.full_name ?? tx.createdby?.username ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryReports() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgoStr());
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [filterType, setFilterType] = useState("all");
  const [queryParams, setQueryParams] = useState({
    dateFrom: thirtyDaysAgoStr(),
    dateTo:   todayStr(),
    filterType: undefined,
  });
  const [activeTab, setActiveTab] = useState("summary");

  const { stockSummary, isLoading: summaryLoading } = useGetInventoryStockSummary();

  const { data: reportData, isLoading: reportLoading } = trpc.inventoryTransaction.getTransactionReport.useQuery(
    { dateFrom: queryParams.dateFrom, dateTo: queryParams.dateTo, filterType: queryParams.filterType },
    { enabled: hasAdminAccess && !!queryParams.dateFrom && !!queryParams.dateTo },
  );

  const handleSearch = () => {
    setQueryParams({
      dateFrom,
      dateTo,
      filterType: filterType !== "all" ? filterType : undefined,
    });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Reports"),   page: "InventoryReports"  },
      ]} />

      <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FileBarChart2 className="w-5 h-5 text-orange-600" />
        {translate("Inventory Reports")}
      </h1>

      {/* Tab toggle */}
      <div className="flex rounded-lg border dark:border-slate-600 overflow-hidden">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 text-sm py-2 font-medium transition-colors ${activeTab === "summary" ? "bg-orange-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
        >
          {translate("Stock Summary")}
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`flex-1 text-sm py-2 font-medium transition-colors ${activeTab === "report" ? "bg-orange-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
        >
          {translate("Transactions")}
        </button>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-2">
          {summaryLoading ? (
            <PageLoadingComponent />
          ) : !stockSummary.length ? (
            <p className="text-center text-gray-400 py-8">{translate("No data")}</p>
          ) : (
            stockSummary.map((row) => (
              <Card key={row.category} className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{row.category}</p>
                    <span className="text-xs text-gray-400 font-mono">{row.total_items} items</span>
                  </div>
                  <StockBar
                    available={Number(row.available_count)}
                    lowStock={Number(row.low_stock_count)}
                    outOfStock={Number(row.out_of_stock_count)}
                  />
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-green-600">{translate("Available")}: <span className="font-mono font-semibold">{row.available_count}</span></span>
                    <span className="text-yellow-600">{translate("Low")}: <span className="font-mono font-semibold">{row.low_stock_count}</span></span>
                    <span className="text-red-600">{translate("Out")}: <span className="font-mono font-semibold">{row.out_of_stock_count}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "report" && (
        <div className="space-y-3">
          {/* Filters */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">{translate("From")}</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="dark:border-slate-600 dark:bg-transparent dark:text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">{translate("To")}</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="dark:border-slate-600 dark:bg-transparent dark:text-white" />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-transparent dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate("All Types")}</SelectItem>
                  <SelectItem value={InventoryTransactionType.STOCK_IN}>{translate("Stock In")}</SelectItem>
                  <SelectItem value={InventoryTransactionType.STOCK_OUT}>{translate("Stock Out")}</SelectItem>
                  <SelectItem value={InventoryTransactionType.RETURN}>{translate("Return")}</SelectItem>
                  <SelectItem value={InventoryTransactionType.ADJUSTMENT}>{translate("Adjustment")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Search className="w-4 h-4 mr-2" />
                {translate("Generate")}
              </Button>
            </CardContent>
          </Card>

          {reportLoading ? (
            <PageLoadingComponent />
          ) : !reportData || reportData.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{translate("No transactions in this period")}</p>
          ) : (
            <div className="space-y-2">
              {reportData.map((tx) => {
                const cfg = TX_TYPE_CONFIG[tx.transaction_type];
                return (
                  <Card key={tx.id} className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {txTypeBadge(tx.transaction_type)}
                            <span className="text-xs text-gray-400">{formatDate(tx.transaction_date)}</span>
                          </div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white mt-1 truncate">
                            {tx.item_name_snapshot || tx.item?.item_name || "—"}
                          </p>
                          {tx.package_name_snapshot && (
                            <p className="text-xs text-gray-400 truncate">{tx.package_name_snapshot}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono font-bold text-base ${cfg?.qtyColor ?? "text-gray-700"}`}>
                            {cfg?.prefix}{tx.quantity}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">→ {tx.after_quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
