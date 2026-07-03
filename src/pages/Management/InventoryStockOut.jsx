// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import { TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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
import { InventoryTransactionType } from "@/utils/enums";

const defaultStockOutField = {
  itemId: "",
  quantity: 1,
  reference_type: "",
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

export default function InventoryStockOut() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryStockOut /> : <InventoryStockOutDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryStockOutDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage      = parseInt(searchParams.get("page") || "1");
  const urlSortField = searchParams.get("sortField") || "";
  const urlSortOrder = searchParams.get("sortOrder") || "";
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { control, handleSubmit, reset, register, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultStockOutField,
  });

  const watchedItemId = watch("itemId");

  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { transactionsList, total, totalPages, isLoading: txLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: InventoryTransactionType.STOCK_OUT,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });
  const { stockOut } = useInventoryTransactionMutations();

  const selectedItem = allItems.find((i) => String(i.id) === String(watchedItemId));

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
    await stockOut.mutateAsync({
      itemId: Number(data.itemId),
      quantity: Number(data.quantity),
      reference_type: data.reference_type || undefined,
      notes: data.notes || undefined,
    });
    reset(defaultStockOutField);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Stock Out"), page: "InventoryStockOut" },
      ]} />

      <div className="flex items-center gap-2">
        <TrendingDown className="w-6 h-6 text-red-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Stock Out")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-1 dark:bg-slate-800 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-red-700 dark:text-red-400">
              {translate("Record Stock Out")}
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
                            <span className="flex items-center gap-2">
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
                {/* Stock warning */}
                {selectedItem && selectedItem.current_quantity === 0 && (
                  <p className="text-xs text-red-500 font-medium">
                    {translate("This item is out of stock")}
                  </p>
                )}
                {selectedItem && selectedItem.current_quantity > 0 && selectedItem.current_quantity <= selectedItem.minimum_level && (
                  <p className="text-xs text-yellow-600 font-medium">
                    {translate("Warning: stock is at minimum level")}
                  </p>
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

              {/* Reference type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Reference Type")}</Label>
                <input
                  {...register("reference_type")}
                  placeholder={translate("e.g. Purchase Order, Manual")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-600 dark:bg-slate-700"
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
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                {isSubmitting ? translate("Saving...") : translate("Record Stock Out")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {translate("Stock Out History")}
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
                    <TableHead>{translate("Reference")}</TableHead>
                    <TableHead>{translate("Notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <InlineLoadingComponent isTable colSpan={6} />
                  ) : transactionsList.length === 0 ? (
                    <NoDataTableComponent colSpan={6} />
                  ) : (
                    transactionsList.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-gray-500">{formatDate(tx.transaction_date)}</TableCell>
                        <TableCell className="font-medium">{tx.item_name_snapshot || tx.item?.item_name || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400 font-semibold">
                          {tx.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-500">
                          {tx.after_quantity}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {tx.reference_type || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
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

function MobileInventoryStockOut() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [showHistory, setShowHistory] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const [itemsPerPage] = useState(10);

  const { control, handleSubmit, reset, register, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultStockOutField,
  });

  const watchedItemId = watch("itemId");
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const selectedItem = allItems.find((i) => String(i.id) === String(watchedItemId));

  const { transactionsList, total, totalPages, isLoading: txLoading } = useGetInventoryTransactionsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterType: InventoryTransactionType.STOCK_OUT,
  });
  const { stockOut } = useInventoryTransactionMutations();

  const onSubmit = async (data) => {
    await stockOut.mutateAsync({
      itemId: Number(data.itemId),
      quantity: Number(data.quantity),
      reference_type: data.reference_type || undefined,
      notes: data.notes || undefined,
    });
    reset(defaultStockOutField);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Stock Out"), page: "InventoryStockOut" },
      ]} />

      <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-red-600" />
        {translate("Stock Out")}
      </h1>

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
            {selectedItem && selectedItem.current_quantity === 0 && (
              <p className="text-xs text-red-500 font-medium">{translate("This item is out of stock")}</p>
            )}
          </div>

          <TextInputForm name="quantity" control={control} label={translate("Quantity")} isNumber required errors={errors} />

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Notes")}</Label>
            <Textarea {...register("notes")} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>

          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
            <TrendingDown className="w-4 h-4 mr-2" />
            {isSubmitting ? translate("Saving...") : translate("Record Stock Out")}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? translate("Hide History") : translate("View Stock Out History")}
      </Button>

      {showHistory && (
        <div className="space-y-2">
          {txLoading ? (
            <PageLoadingComponent />
          ) : transactionsList.length === 0 ? (
            <p className="text-center text-gray-400 py-6">{translate("No stock-out records yet")}</p>
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
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">{tx.quantity}</span>
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
