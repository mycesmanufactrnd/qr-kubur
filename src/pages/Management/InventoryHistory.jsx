// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  History,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetInventoryTransactionsPaginated,
  useGetAllInventoryItems,
} from "@/hooks/useInventoryMutations";
import {
  InventoryTransactionSource,
  InventoryTransactionType,
} from "@/utils/enums";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TX_TYPE_CONFIG = {
  [InventoryTransactionType.STOCK_IN]: {
    label: "Stock In",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: TrendingUp,
    qtyColor: "text-green-700 dark:text-green-400",
    qtyPrefix: "+",
  },
  [InventoryTransactionType.STOCK_OUT]: {
    label: "Stock Out",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: TrendingDown,
    qtyColor: "text-red-600 dark:text-red-400",
    qtyPrefix: "",
  },
  [InventoryTransactionType.RETURN]: {
    label: "Return",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: RotateCcw,
    qtyColor: "text-blue-600 dark:text-blue-400",
    qtyPrefix: "+",
  },
  [InventoryTransactionType.ADJUSTMENT]: {
    label: "Adjustment",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: SlidersHorizontal,
    qtyColor: "text-yellow-700 dark:text-yellow-400",
    qtyPrefix: "",
  },
};

const sourceLabels = {
  [InventoryTransactionSource.MANUAL]:         "Manual",
  [InventoryTransactionSource.JENAZAH_MODULE]: "Jenazah",
  [InventoryTransactionSource.RETURN]:         "Return",
  [InventoryTransactionSource.SYSTEM]:         "System",
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
}

export default function InventoryHistory() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryHistory /> : <InventoryHistoryDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryHistoryDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage      = parseInt(searchParams.get("page") || "1");
  const urlType      = searchParams.get("type") || "all";
  const urlItemId    = searchParams.get("itemId") || "all";
  const urlSource    = searchParams.get("source") || "all";
  const urlDateFrom  = searchParams.get("dateFrom") || "";
  const urlDateTo    = searchParams.get("dateTo") || "";
  const urlSortField = searchParams.get("sortField") || "transaction_date";
  const urlSortOrder = searchParams.get("sortOrder") || "DESC";

  const [tempType, setTempType]       = useState(urlType);
  const [tempItemId, setTempItemId]   = useState(urlItemId);
  const [tempSource, setTempSource]   = useState(urlSource);
  const [tempDateFrom, setTempDateFrom] = useState(urlDateFrom);
  const [tempDateTo, setTempDateTo]   = useState(urlDateTo);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setTempType(urlType);
    setTempItemId(urlItemId);
    setTempSource(urlSource);
    setTempDateFrom(urlDateFrom);
    setTempDateTo(urlDateTo);
  }, [urlType, urlItemId, urlSource, urlDateFrom, urlDateTo]);

  const { itemsList: allItems } = useGetAllInventoryItems();

  const { transactionsList, total, totalPages, isLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: urlType !== "all" ? urlType : undefined,
    filterItemId: urlItemId !== "all" ? Number(urlItemId) : undefined,
    filterSource: urlSource !== "all" ? urlSource : undefined,
    dateFrom: urlDateFrom || undefined,
    dateTo: urlDateTo || undefined,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });

  const handleSearch = () => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      np.set("page", "1");
      tempType   !== "all" ? np.set("type", tempType)     : np.delete("type");
      tempItemId !== "all" ? np.set("itemId", tempItemId) : np.delete("itemId");
      tempSource !== "all" ? np.set("source", tempSource) : np.delete("source");
      tempDateFrom ? np.set("dateFrom", tempDateFrom) : np.delete("dateFrom");
      tempDateTo   ? np.set("dateTo",   tempDateTo)   : np.delete("dateTo");
      return np;
    });
  };

  const handleReset = () => {
    setTempType("all"); setTempItemId("all"); setTempSource("all");
    setTempDateFrom(""); setTempDateTo("");
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      ["type","itemId","source","dateFrom","dateTo","page"].forEach((k) => np.delete(k));
      return np;
    });
  };

  const handleSort = (field) => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      const cur = np.get("sortField");
      const ord = np.get("sortOrder");
      np.set("sortField", field);
      np.set("sortOrder", cur === field && ord === "ASC" ? "DESC" : "ASC");
      return np;
    });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Transaction History"), page: "InventoryHistory" },
      ]} />

      <div className="flex items-center gap-2">
        <History className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Transaction History")}
        </h1>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
          {total}
        </span>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={tempType} onValueChange={setTempType}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white focus:ring-0">
                <SelectValue placeholder={translate("Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Types")}</SelectItem>
                <SelectItem value={InventoryTransactionType.STOCK_IN}>{translate("Stock In")}</SelectItem>
                <SelectItem value={InventoryTransactionType.STOCK_OUT}>{translate("Stock Out")}</SelectItem>
                <SelectItem value={InventoryTransactionType.RETURN}>{translate("Return")}</SelectItem>
                <SelectItem value={InventoryTransactionType.ADJUSTMENT}>{translate("Adjustment")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tempItemId} onValueChange={setTempItemId}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white focus:ring-0">
                <SelectValue placeholder={translate("All Items")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Items")}</SelectItem>
                {allItems.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tempSource} onValueChange={setTempSource}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white focus:ring-0">
                <SelectValue placeholder={translate("Source")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Sources")}</SelectItem>
                {Object.entries(sourceLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={tempDateFrom}
              onChange={(e) => setTempDateFrom(e.target.value)}
              className="dark:border-slate-600 dark:bg-transparent dark:text-white"
            />

            <Input
              type="date"
              value={tempDateTo}
              onChange={(e) => setTempDateTo(e.target.value)}
              className="dark:border-slate-600 dark:bg-transparent dark:text-white"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSearch} className="bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-600 dark:hover:bg-slate-500">
              {translate("Search")}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {translate("Reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("transaction_date")}>
                  <span className="flex items-center">
                    {translate("Date")}
                    <SortIcon field="transaction_date" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("transaction_type")}>
                  <span className="flex items-center">
                    {translate("Type")}
                    <SortIcon field="transaction_type" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead>{translate("Item")}</TableHead>
                <TableHead>{translate("Package")}</TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("quantity")}>
                  <span className="flex items-center justify-end">
                    {translate("Qty")}
                    <SortIcon field="quantity" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="text-right">{translate("Before")}</TableHead>
                <TableHead className="text-right">{translate("After")}</TableHead>
                <TableHead>{translate("Source")}</TableHead>
                <TableHead>{translate("Notes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={9} />
              ) : transactionsList.length === 0 ? (
                <NoDataTableComponent colSpan={9} />
              ) : (
                transactionsList.map((tx) => {
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
                        {cfg?.qtyPrefix}{tx.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-400">{tx.before_quantity ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-gray-500">{tx.after_quantity ?? "—"}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {sourceLabels[tx.source] ?? tx.source ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[180px] truncate">
                        {tx.notes || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        currentPage={urlPage}
        totalPages={totalPages}
        onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setSearchParams((p) => { const np = new URLSearchParams(p); np.set("page", "1"); return np; }); }}
        totalItems={total}
      />
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryHistory() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage   = parseInt(searchParams.get("page") || "1");
  const urlType   = searchParams.get("type") || "all";
  const [tempType, setTempType] = useState(urlType);
  const [itemsPerPage] = useState(20);

  const { transactionsList, total, totalPages, isLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: urlType !== "all" ? urlType : undefined,
    sortField: "transaction_date",
    sortOrder: "DESC",
  });

  const handleTypeChange = (val) => {
    setTempType(val);
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set("page", "1");
      val !== "all" ? n.set("type", val) : n.delete("type");
      return n;
    });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("History"), page: "InventoryHistory" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          {translate("Transaction History")}
        </h1>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold font-mono text-slate-600 dark:text-slate-300">
          {total}
        </span>
      </div>

      {/* Type filter */}
      <Select value={tempType} onValueChange={handleTypeChange}>
        <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
          <SelectValue placeholder={translate("All Types")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{translate("All Types")}</SelectItem>
          <SelectItem value={InventoryTransactionType.STOCK_IN}>{translate("Stock In")}</SelectItem>
          <SelectItem value={InventoryTransactionType.STOCK_OUT}>{translate("Stock Out")}</SelectItem>
          <SelectItem value={InventoryTransactionType.RETURN}>{translate("Return")}</SelectItem>
          <SelectItem value={InventoryTransactionType.ADJUSTMENT}>{translate("Adjustment")}</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <PageLoadingComponent />
      ) : transactionsList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No transactions found")}</p>
      ) : (
        <div className="space-y-2">
          {transactionsList.map((tx) => {
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
                      {tx.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{tx.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-base ${cfg?.qtyColor ?? "text-gray-700"}`}>
                        {cfg?.qtyPrefix}{tx.quantity}
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

      <Pagination
        currentPage={urlPage}
        totalPages={totalPages}
        onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })}
        itemsPerPage={itemsPerPage}
        totalItems={total}
      />
    </div>
  );
}
