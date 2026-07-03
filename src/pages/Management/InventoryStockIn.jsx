// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import { TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAllInventoryItems,
  useGetInventoryTransactionsPaginated,
  useInventoryTransactionMutations,
} from "@/hooks/useInventoryMutations";
import { useForm, Controller } from "react-hook-form";
import { InventoryTransactionSource, InventoryTransactionType } from "@/utils/enums";

const sourceOptions = [
  { value: InventoryTransactionSource.MANUAL,  label: translate("Manual")  },
  { value: InventoryTransactionSource.SYSTEM,  label: translate("System")  },
];

const defaultStockInField = {
  itemId: "",
  quantity: 1,
  source: InventoryTransactionSource.MANUAL,
  notes: "",
};

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

export default function InventoryStockIn() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryStockIn /> : <InventoryStockInDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryStockInDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage      = parseInt(searchParams.get("page") || "1");
  const urlSortField = searchParams.get("sortField") || "";
  const urlSortOrder = searchParams.get("sortOrder") || "";
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultStockInField,
  });

  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { transactionsList, total, totalPages, isLoading: txLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: InventoryTransactionType.STOCK_IN,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });
  const { stockIn } = useInventoryTransactionMutations();

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

  const onSubmit = async (data) => {
    await stockIn.mutateAsync({
      itemId: Number(data.itemId),
      quantity: Number(data.quantity),
      source: data.source || InventoryTransactionSource.MANUAL,
      notes: data.notes || undefined,
    });
    reset(defaultStockInField);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Stock In")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-1 dark:bg-slate-800 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-green-700 dark:text-green-400">
              {translate("Record Stock In")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Item select */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {translate("Item")} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="itemId"
                  control={control}
                  rules={{ required: translate("Item diperlukan") }}
                  render={({ field }) => (
                    <Select
                      value={String(field.value || "")}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={itemsLoading}
                    >
                      <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
                        <SelectValue placeholder={translate("Select item")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allItems.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            <span className="flex items-center justify-between gap-2">
                              <span>{item.item_name}</span>
                              <span className="text-xs text-gray-400 font-mono">
                                ({item.current_quantity} {item.unit_type})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.itemId && (
                  <p className="text-xs text-red-500">{errors.itemId.message}</p>
                )}
              </div>

              {/* Quantity */}
              <TextInputForm
                name="quantity"
                control={control}
                label={translate("Quantity")}
                isNumber
                required
                errors={errors}
              />

              {/* Source */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Source")}</Label>
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Notes")}</Label>
                <Textarea
                  {...register("notes")}
                  placeholder={translate("Optional")}
                  rows={3}
                  className="resize-none dark:border-slate-600 dark:bg-slate-700"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {isSubmitting ? translate("Saving...") : translate("Record Stock In")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {translate("Stock In History")}
          </h2>
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
                    <TableHead>{translate("Item")}</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("quantity")}>
                      <span className="flex items-center justify-end">
                        {translate("Qty")}
                        <SortIcon field="quantity" current={urlSortField} order={urlSortOrder} />
                      </span>
                    </TableHead>
                    <TableHead className="text-right">{translate("After")}</TableHead>
                    <TableHead>{translate("Notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <InlineLoadingComponent isTable colSpan={5} />
                  ) : transactionsList.length === 0 ? (
                    <NoDataTableComponent colSpan={5} />
                  ) : (
                    transactionsList.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-gray-500">{formatDate(tx.transaction_date)}</TableCell>
                        <TableCell className="font-medium">{tx.item_name_snapshot || tx.item?.item_name || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-green-700 dark:text-green-400 font-semibold">
                          +{tx.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-500">
                          {tx.after_quantity}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                          {tx.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))
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
      </div>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryStockIn() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [showHistory, setShowHistory] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const [itemsPerPage] = useState(10);

  const { control, handleSubmit, reset, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultStockInField,
  });

  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { transactionsList, total, totalPages, isLoading: txLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: InventoryTransactionType.STOCK_IN,
  });
  const { stockIn } = useInventoryTransactionMutations();

  const onSubmit = async (data) => {
    await stockIn.mutateAsync({
      itemId: Number(data.itemId),
      quantity: Number(data.quantity),
      source: data.source || InventoryTransactionSource.MANUAL,
      notes: data.notes || undefined,
    });
    reset(defaultStockInField);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        {translate("Stock In")}
      </h1>

      {/* Form */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {translate("Item")} <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="itemId"
              control={control}
              rules={{ required: translate("Item diperlukan") }}
              render={({ field }) => (
                <Select value={String(field.value || "")} onValueChange={(val) => field.onChange(Number(val))} disabled={itemsLoading}>
                  <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
                    <SelectValue placeholder={translate("Select item")} />
                  </SelectTrigger>
                  <SelectContent>
                    {allItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.item_name} ({item.current_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.itemId && <p className="text-xs text-red-500">{errors.itemId.message}</p>}
          </div>

          <TextInputForm name="quantity" control={control} label={translate("Quantity")} isNumber required errors={errors} />

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Notes")}</Label>
            <Textarea {...register("notes")} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>

          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            {isSubmitting ? translate("Saving...") : translate("Record Stock In")}
          </Button>
        </CardContent>
      </Card>

      {/* Toggle history */}
      <Button variant="outline" className="w-full" onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? translate("Hide History") : translate("View Stock In History")}
      </Button>

      {showHistory && (
        <div className="space-y-2">
          {txLoading ? (
            <PageLoadingComponent />
          ) : transactionsList.length === 0 ? (
            <p className="text-center text-gray-400 py-6">{translate("No stock-in records yet")}</p>
          ) : (
            transactionsList.map((tx) => (
              <Card key={tx.id} className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {tx.item_name_snapshot || tx.item?.item_name || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.transaction_date)}</p>
                      {tx.notes && <p className="text-xs text-gray-500 mt-1">{tx.notes}</p>}
                    </div>
                    <span className="font-mono font-bold text-green-600 dark:text-green-400">+{tx.quantity}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })} itemsPerPage={itemsPerPage} totalItems={total} />
        </div>
      )}
    </div>
  );
}
