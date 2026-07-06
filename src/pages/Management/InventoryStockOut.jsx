// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState, useMemo } from "react";
import { translate } from "@/utils/translations";
import { TrendingDown, Search, Package } from "lucide-react";
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
  useGetAllInventoryPackages,
  useInventoryTransactionMutations,
} from "@/hooks/useInventoryMutations";
import { InventoryItemType } from "@/utils/enums";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function filterItems(items, search) {
  if (!search.trim()) return items;
  const q = search.toLowerCase();
  return items.filter(
    (i) =>
      i.item_name.toLowerCase().includes(q) ||
      (i.item_code && i.item_code.toLowerCase().includes(q)),
  );
}

// ── Item Checkbox ─────────────────────────────────────────────────────────────

function ItemCheckbox({ item, checked, qty, onToggle, onQtyChange }) {
  const isOutOfStock = item.current_quantity === 0;
  const isOverStock  = checked && qty > item.current_quantity;
  return (
    <div
      className={`flex flex-col gap-1 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
        ${isOutOfStock
          ? "border-gray-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
          : isOverStock
            ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-500"
            : checked
              ? "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-600"
              : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
        }`}
      onClick={() => !isOutOfStock && onToggle(item.id)}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={isOutOfStock}
          onChange={() => !isOutOfStock && onToggle(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-red-600 cursor-pointer shrink-0"
        />
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {item.item_name}
            {item.item_code && (
              <span className="text-xs text-gray-400 ml-1.5">({item.item_code})</span>
            )}
          </p>
          <p className={`text-xs mt-0.5 ${item.current_quantity === 0 ? "text-red-500" : item.current_quantity <= item.minimum_level ? "text-yellow-500" : "text-gray-400"}`}>
            {translate("Stok")}: {item.current_quantity} {item.unit_type}
            {item.current_quantity === 0 && " — Tiada stok"}
            {item.current_quantity > 0 && item.current_quantity <= item.minimum_level && " — Rendah"}
          </p>
        </div>
        {checked && (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-gray-500">{translate("Qty")}:</span>
            <div className={`flex items-center border rounded-md overflow-hidden ${isOverStock ? "border-orange-400" : "dark:border-slate-600"}`}>
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
      {isOverStock && (
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium pl-7">
          ⚠ {translate("Qty melebihi stok semasa")} ({item.current_quantity} {item.unit_type} {translate("tersedia")})
        </p>
      )}
    </div>
  );
}

// ── Shared form state ─────────────────────────────────────────────────────────

function useStockOutForm() {
  const [date, setDate]                   = useState(todayDate);
  const [time, setTime]                   = useState(nowTime);
  const [notes, setNotes]                 = useState("");
  const [selected, setSelected]           = useState({});
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const toggleItem = (id) => {
    setSelected((prev) => {
      if (prev[id]) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id, qty) => setSelected((prev) => ({ ...prev, [id]: qty }));

  const applyPackage = (pkg) => {
    if (!pkg) { setSelectedPackageId(""); return; }
    setSelectedPackageId(String(pkg.id));
    const newSelected = {};
    for (const pi of pkg.packageItems ?? []) {
      newSelected[pi.itemId] = pi.quantity_required;
    }
    setSelected(newSelected);
  };

  const resetForm = () => {
    setDate(todayDate());
    setTime(nowTime());
    setNotes("");
    setSelected({});
    setSelectedPackageId("");
  };

  const selectedCount = Object.keys(selected).length;

  return { date, setDate, time, setTime, notes, setNotes, selected, toggleItem, setQty, applyPackage, selectedPackageId, resetForm, selectedCount };
}

export default function InventoryStockOut() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryStockOut /> : <InventoryStockOutDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryStockOutDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { packagesList } = useGetAllInventoryPackages();
  const { stockOut } = useInventoryTransactionMutations();
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

  const form = useStockOutForm();

  const filteredConsumable = useMemo(() => filterItems(consumableItems, searchConsumable), [consumableItems, searchConsumable]);
  const filteredReusable   = useMemo(() => filterItems(reusableItems,   searchReusable),   [reusableItems,   searchReusable]);

  const hasOverStock = useMemo(() =>
    Object.entries(form.selected).some(([itemId, qty]) => {
      const item = allItems.find((i) => String(i.id) === String(itemId));
      return item && qty > item.current_quantity;
    }),
    [form.selected, allItems],
  );

  const handleSubmit = async () => {
    if (form.selectedCount === 0 || hasOverStock) return;
    const transactionDate = `${form.date}T${form.time}:00`;
    setIsSubmitting(true);
    try {
      for (const [itemId, qty] of Object.entries(form.selected)) {
        await stockOut.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
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
        { label: translate("Stock Out"), page: "InventoryStockOut" },
      ]} />

      <div className="flex items-center gap-2">
        <TrendingDown className="w-6 h-6 text-red-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Stock Out")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Left: Transaction Details ───────────────────────────────────── */}
        <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-red-700 dark:text-red-400">
              {translate("Transaction Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Tarikh")} <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => form.setDate(e.target.value)}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Masa")} <span className="text-red-500">*</span></Label>
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
              <Label className="text-sm font-medium">{translate("Pakej")}</Label>
              <Select
                value={form.selectedPackageId}
                onValueChange={(val) => {
                  if (val === "none") { form.applyPackage(null); return; }
                  const pkg = packagesList.find((p) => String(p.id) === val);
                  form.applyPackage(pkg ?? null);
                }}
              >
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <SelectValue placeholder={translate("Pilih pakej (pilihan)")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{translate("Tiada pakej")}</SelectItem>
                  {packagesList.map((pkg) => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      {pkg.package_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.selectedPackageId && (
                <p className="text-xs text-blue-500">
                  {translate("Item pakej dipilih secara automatik. Anda boleh nyahpilih mana-mana item.")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Catatan")}</Label>
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
              disabled={isSubmitting || form.selectedCount === 0 || hasOverStock}
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              {isSubmitting
                ? translate("Saving...")
                : hasOverStock
                  ? translate("Qty melebihi stok — semak semula")
                  : form.selectedCount === 0
                    ? translate("Select items first")
                    : `${translate("Record Stock Out")} (${form.selectedCount})`
              }
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Item Lists ───────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Consumable */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                {translate("Consumable Items")}
              </CardTitle>
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
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                {translate("Reusable Items")}
              </CardTitle>
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

function MobileInventoryStockOut() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { packagesList } = useGetAllInventoryPackages();
  const { stockOut } = useInventoryTransactionMutations();
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

  const form = useStockOutForm();

  const filteredConsumable = useMemo(() => filterItems(consumableItems, searchConsumable), [consumableItems, searchConsumable]);
  const filteredReusable   = useMemo(() => filterItems(reusableItems,   searchReusable),   [reusableItems,   searchReusable]);

  const hasOverStock = useMemo(() =>
    Object.entries(form.selected).some(([itemId, qty]) => {
      const item = allItems.find((i) => String(i.id) === String(itemId));
      return item && qty > item.current_quantity;
    }),
    [form.selected, allItems],
  );

  const handleSubmit = async () => {
    if (form.selectedCount === 0 || hasOverStock) return;
    const transactionDate = `${form.date}T${form.time}:00`;
    setIsSubmitting(true);
    try {
      for (const [itemId, qty] of Object.entries(form.selected)) {
        await stockOut.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Tarikh")}</Label>
              <Input type="date" value={form.date} onChange={(e) => form.setDate(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Masa")}</Label>
              <Input type="time" value={form.time} onChange={(e) => form.setTime(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Recorded By")}</Label>
            <Input value={recordedBy} readOnly className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Pakej")}</Label>
            <Select
              value={form.selectedPackageId}
              onValueChange={(val) => {
                if (val === "none") { form.applyPackage(null); return; }
                const pkg = packagesList.find((p) => String(p.id) === val);
                form.applyPackage(pkg ?? null);
              }}
            >
              <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <SelectValue placeholder={translate("Pilih pakej (pilihan)")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{translate("Tiada pakej")}</SelectItem>
                {packagesList.map((pkg) => (
                  <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.package_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.selectedPackageId && (
              <p className="text-xs text-blue-500">{translate("Item pakej dipilih secara automatik. Anda boleh nyahpilih mana-mana item.")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Catatan")}</Label>
            <Textarea value={form.notes} onChange={(e) => form.setNotes(e.target.value)} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* Consumable Items */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-red-600" />
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
        disabled={isSubmitting || form.selectedCount === 0 || hasOverStock}
        className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
      >
        <TrendingDown className="w-4 h-4 mr-2" />
        {isSubmitting
          ? translate("Saving...")
          : hasOverStock
            ? translate("Qty melebihi stok — semak semula")
            : form.selectedCount === 0
              ? translate("Select items first")
              : `${translate("Record Stock Out")} (${form.selectedCount})`
        }
      </Button>
    </div>
  );
}
