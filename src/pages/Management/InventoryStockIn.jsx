// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState, useMemo } from "react";
import { translate } from "@/utils/translations";
import { TrendingUp, Search, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAllInventoryItems,
  useInventoryTransactionMutations,
} from "@/hooks/useInventoryMutations";
import { InventoryTransactionSource, InventoryItemType } from "@/utils/enums";

// Source options the user can pick
const typeOptions = [
  { value: InventoryTransactionSource.RESTOCK, label: translate("Restock") },
  { value: InventoryTransactionSource.RETURN,  label: translate("Pulangan") },
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

// ── Item Checkbox List ────────────────────────────────────────────────────────

function ItemCheckbox({ item, checked, qty, onToggle, onQtyChange }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
        ${checked
          ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600"
          : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
        }`}
      onClick={() => onToggle(item.id)}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 accent-green-600 cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {item.item_name}
          {item.item_code && (
            <span className="text-xs text-gray-400 ml-1.5">({item.item_code})</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {translate("Stock")}: {item.current_quantity} {item.unit_type}
        </p>
      </div>
      {checked && (
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-500">{translate("Qty")}:</span>
          <div className="flex items-center border rounded-md overflow-hidden dark:border-slate-600">
            <button
              type="button"
              onClick={() => onQtyChange(item.id, Math.max(1, qty - 1))}
              className="px-2 h-7 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-bold"
            >−</button>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => onQtyChange(item.id, Math.max(1, Number(e.target.value)))}
              className="h-7 w-12 text-sm text-center border-0 rounded-none dark:bg-slate-800 focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => onQtyChange(item.id, qty + 1)}
              className="px-2 h-7 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-bold"
            >+</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared form logic (used by both desktop and mobile) ───────────────────────

function useStockInForm() {
  const [date, setDate]         = useState(todayDate);
  const [time, setTime]         = useState(nowTime);
  const [type, setType]         = useState(InventoryTransactionSource.RESTOCK);
  const [notes, setNotes]       = useState("");
  const [selected, setSelected] = useState({}); // { [itemId]: qty }

  const toggleItem = (id) => {
    setSelected((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id, qty) => {
    setSelected((prev) => ({ ...prev, [id]: qty }));
  };

  const resetForm = () => {
    setDate(todayDate());
    setTime(nowTime());
    setType(InventoryTransactionSource.MANUAL);
    setNotes("");
    setSelected({});
  };

  const selectedCount = Object.keys(selected).length;

  return { date, setDate, time, setTime, type, setType, notes, setNotes, selected, toggleItem, setQty, resetForm, selectedCount };
}

export default function InventoryStockIn() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryStockIn /> : <InventoryStockInDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function filterItems(items, search) {
  if (!search.trim()) return items;
  const q = search.toLowerCase();
  return items.filter(
    (i) =>
      i.item_name.toLowerCase().includes(q) ||
      (i.item_code && i.item_code.toLowerCase().includes(q)),
  );
}

function InventoryStockInDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { stockIn } = useInventoryTransactionMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchConsumable, setSearchConsumable] = useState("");
  const [searchReusable, setSearchReusable]     = useState("");

  const consumableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.ONE_TIME),
    [allItems],
  );
  const reusableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.REUSABLE),
    [allItems],
  );

  const form = useStockInForm();

  const filteredConsumable = useMemo(() => filterItems(consumableItems, searchConsumable), [consumableItems, searchConsumable]);
  const filteredReusable   = useMemo(() => filterItems(reusableItems,   searchReusable),   [reusableItems,   searchReusable]);

  const handleSubmit = async () => {
    if (form.selectedCount === 0) return;
    const transactionDate = `${form.date}T${form.time}:00`;
    setIsSubmitting(true);
    try {
      for (const [itemId, qty] of Object.entries(form.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: form.type,
          notes: form.notes || undefined,
          transaction_date: transactionDate,
        });
      }
      form.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.fullname;

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Left: Form details ──────────────────────────────────────────── */}
        <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-green-700 dark:text-green-400">
              {translate("Transaction Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Date")} <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => form.setDate(e.target.value)}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Time")} <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => form.setTime(e.target.value)}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Recorded By")}</Label>
              <Input
                value={recordedBy}
                readOnly
                className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Type")} <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={form.setType}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                placeholder={translate("Optional")}
                rows={3}
                className="resize-none dark:border-slate-600 dark:bg-slate-700"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || form.selectedCount === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isSubmitting
                ? translate("Saving...")
                : form.selectedCount === 0
                  ? translate("Select items first")
                  : `${translate("Record Stock In")} (${form.selectedCount})`
              }
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Item sections ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Consumable */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {translate("Consumable Items")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchConsumable}
                  onChange={(e) => setSearchConsumable(e.target.value)}
                  placeholder={translate("Search consumable...")}
                  className="pl-9 dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
              {itemsLoading ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("Loading...")}</p>
              ) : filteredConsumable.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("No items found")}</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredConsumable.map((item) => (
                    <ItemCheckbox
                      key={item.id}
                      item={item}
                      checked={!!form.selected[item.id]}
                      qty={form.selected[item.id] ?? 1}
                      onToggle={form.toggleItem}
                      onQtyChange={form.setQty}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reusable */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  {translate("Reusable Items")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchReusable}
                  onChange={(e) => setSearchReusable(e.target.value)}
                  placeholder={translate("Search reusable...")}
                  className="pl-9 dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
              {itemsLoading ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("Loading...")}</p>
              ) : filteredReusable.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("No items found")}</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredReusable.map((item) => (
                    <ItemCheckbox
                      key={item.id}
                      item={item}
                      checked={!!form.selected[item.id]}
                      qty={form.selected[item.id] ?? 1}
                      onToggle={form.toggleItem}
                      onQtyChange={form.setQty}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileInventoryStockIn() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { stockIn } = useInventoryTransactionMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchConsumable, setSearchConsumable] = useState("");
  const [searchReusable, setSearchReusable]     = useState("");

  const consumableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.ONE_TIME),
    [allItems],
  );
  const reusableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.REUSABLE),
    [allItems],
  );

  const form = useStockInForm();

  const filteredConsumable = useMemo(() => filterItems(consumableItems, searchConsumable), [consumableItems, searchConsumable]);
  const filteredReusable   = useMemo(() => filterItems(reusableItems,   searchReusable),   [reusableItems,   searchReusable]);

  const handleSubmit = async () => {
    if (form.selectedCount === 0) return;
    const transactionDate = `${form.date}T${form.time}:00`;
    setIsSubmitting(true);
    try {
      for (const [itemId, qty] of Object.entries(form.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: form.type,
          notes: form.notes || undefined,
          transaction_date: transactionDate,
        });
      }
      form.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.name || currentUser?.email || translate("Current User");

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

      {/* Transaction details */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => form.setDate(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Time")}</Label>
              <Input type="time" value={form.time} onChange={(e) => form.setTime(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Recorded By")}</Label>
            <Input value={recordedBy} readOnly className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Type")}</Label>
            <Select value={form.type} onValueChange={form.setType}>
              <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Notes")}</Label>
            <Textarea value={form.notes} onChange={(e) => form.setNotes(e.target.value)} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* Consumable Items */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            {translate("Consumable Items")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchConsumable} onChange={(e) => setSearchConsumable(e.target.value)} placeholder={translate("Search consumable...")} className="pl-9 dark:border-slate-600 dark:bg-slate-700" />
          </div>
          {itemsLoading ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("Loading...")}</p>
          ) : filteredConsumable.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("No items found")}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredConsumable.map((item) => (
                <ItemCheckbox key={item.id} item={item} checked={!!form.selected[item.id]} qty={form.selected[item.id] ?? 1} onToggle={form.toggleItem} onQtyChange={form.setQty} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reusable Items */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            {translate("Reusable Items")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchReusable} onChange={(e) => setSearchReusable(e.target.value)} placeholder={translate("Search reusable...")} className="pl-9 dark:border-slate-600 dark:bg-slate-700" />
          </div>
          {itemsLoading ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("Loading...")}</p>
          ) : filteredReusable.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("No items found")}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredReusable.map((item) => (
                <ItemCheckbox key={item.id} item={item} checked={!!form.selected[item.id]} qty={form.selected[item.id] ?? 1} onToggle={form.toggleItem} onQtyChange={form.setQty} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || form.selectedCount === 0}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {isSubmitting
          ? translate("Saving...")
          : form.selectedCount === 0
            ? translate("Select items first")
            : `${translate("Record Stock In")} (${form.selectedCount})`
        }
      </Button>
    </div>
  );
}
