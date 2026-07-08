// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState, useMemo, useEffect } from "react";
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
import { InventoryTransactionSource, InventoryItemType, InventoryItemStatus } from "@/utils/enums";

const itemTypeOptions = [
  { value: InventoryTransactionSource.RESTOCK, label: translate("Restock") },
  { value: InventoryTransactionSource.RETURN,  label: translate("Pulangan") },
];

const NO_LOCATION = "__NO_LOCATION__";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function getLocationsFromItems(items) {
  const set = new Set();
  for (const i of items) {
    set.add(i.location ? i.location : NO_LOCATION);
  }
  return Array.from(set).sort((a, b) => {
    if (a === NO_LOCATION) return 1;
    if (b === NO_LOCATION) return -1;
    return a.localeCompare(b);
  });
}

// ── Item Checkbox ─────────────────────────────────────────────────────────────

function ConsumableCheckbox({ item, checked, qty, onToggle, onQtyChange, showQty = true }) {
  return (
    <div
      className={`flex flex-col gap-1 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
        ${checked
          ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600"
          : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
        }`}
      onClick={() => onToggle(item.id)}
    >
      <div className="flex items-center gap-3">
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
          {showQty && (
            <p className="text-xs text-gray-400 mt-0.5">
              {translate("Stock")}: {item.current_quantity} {item.unit_type}
            </p>
          )}
        </div>
        {checked && showQty && (
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
    </div>
  );
}

// ── Type toggle (Consumable / Reusable) ───────────────────────────────────────

function ItemTypeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-600 p-1 bg-gray-50 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange(InventoryItemType.ONE_TIME)}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          value === InventoryItemType.ONE_TIME
            ? "bg-green-600 text-white shadow-sm"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        }`}
      >
        {translate("Consumable")}
      </button>
      <button
        type="button"
        onClick={() => onChange(InventoryItemType.REUSABLE)}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          value === InventoryItemType.REUSABLE
            ? "bg-purple-600 text-white shadow-sm"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        }`}
      >
        {translate("Reusable")}
      </button>
    </div>
  );
}

// ── Shared form hook ──────────────────────────────────────────────────────────

function useStockInForm(defaultType) {
  const [date, setDate]         = useState(todayDate);
  const [time, setTime]         = useState(nowTime);
  const [itemType, setItemType] = useState(InventoryItemType.ONE_TIME);
  const [type, setType]         = useState(defaultType);
  const [location, setLocation] = useState("");
  const [notes, setNotes]       = useState("");
  const [selected, setSelected] = useState({});

  const toggleItem = (id) => {
    setSelected((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { qty: 1 } };
    });
  };

  const setQty = (id, qty) => {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], qty } }));
  };

  const resetForm = () => {
    setDate(todayDate());
    setTime(nowTime());
    setType(defaultType);
    setLocation("");
    setNotes("");
    setSelected({});
  };

  const selectedCount = Object.keys(selected).length;

  return {
    date, setDate, time, setTime,
    itemType, setItemType,
    type, setType,
    location, setLocation,
    notes, setNotes,
    selected, toggleItem, setQty,
    resetForm, selectedCount,
  };
}

function filterByTypeAndEligibility(items, itemType) {
  return items.filter((i) => {
    if (i.item_type !== itemType) return false;
    // Reusable items already AVAILABLE are already in stock — nothing to stock in.
    if (itemType === InventoryItemType.REUSABLE && i.status === InventoryItemStatus.AVAILABLE) return false;
    return true;
  });
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

export default function InventoryStockIn() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileInventoryStockIn /> : <InventoryStockInDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryStockInDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { stockIn } = useInventoryTransactionMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchItems, setSearchItems] = useState("");

  const itemsForm = useStockInForm(InventoryTransactionSource.RESTOCK);

  const typedItems = useMemo(
    () => filterByTypeAndEligibility(allItems ?? [], itemsForm.itemType),
    [allItems, itemsForm.itemType],
  );

  const locations = useMemo(() => getLocationsFromItems(typedItems), [typedItems]);

  useEffect(() => {
    if (itemsForm.location && !locations.includes(itemsForm.location)) {
      itemsForm.setLocation("");
    }
  }, [locations]);

  const locationFilteredItems = useMemo(
    () => (itemsForm.location ? typedItems.filter((i) => (i.location || NO_LOCATION) === itemsForm.location) : typedItems),
    [typedItems, itemsForm.location],
  );

  const filteredItems = useMemo(() => filterItems(locationFilteredItems, searchItems), [locationFilteredItems, searchItems]);

  const handleItemTypeChange = (newType) => {
    itemsForm.setItemType(newType);
    itemsForm.setLocation("");
  };

  const handleSubmitItems = async () => {
    if (itemsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { qty }] of Object.entries(itemsForm.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: itemsForm.itemType === InventoryItemType.REUSABLE
            ? InventoryTransactionSource.MANUAL
            : itemsForm.type,
          notes: itemsForm.notes || undefined,
        });
      }
      itemsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.fullname;
  const isReusable = itemsForm.itemType === InventoryItemType.REUSABLE;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translate("Stock In")}
          </h1>
        </div>
        <ItemTypeToggle value={itemsForm.itemType} onChange={handleItemTypeChange} />
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
                  value={itemsForm.date}
                  onChange={(e) => itemsForm.setDate(e.target.value)}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Time")} <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  value={itemsForm.time}
                  onChange={(e) => itemsForm.setTime(e.target.value)}
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

            {!isReusable && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Type")} <span className="text-red-500">*</span></Label>
                <Select value={itemsForm.type} onValueChange={itemsForm.setType}>
                  <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Location")}</Label>
              <Select
                value={itemsForm.location || "all"}
                onValueChange={(val) => itemsForm.setLocation(val === "all" ? "" : val)}
              >
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <SelectValue placeholder={translate("All locations")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate("All locations")}</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc === NO_LOCATION ? translate("No location") : loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Notes")}</Label>
              <Textarea
                value={itemsForm.notes}
                onChange={(e) => itemsForm.setNotes(e.target.value)}
                placeholder={translate("Optional")}
                rows={3}
                className="resize-none dark:border-slate-600 dark:bg-slate-700"
              />
            </div>

            <Button
              onClick={handleSubmitItems}
              disabled={isSubmitting || itemsForm.selectedCount === 0}
              className="w-full text-white bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isSubmitting
                ? translate("Saving...")
                : itemsForm.selectedCount === 0
                  ? translate("Select items first")
                  : `${translate("Record Stock In")} (${itemsForm.selectedCount})`
              }
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Item list ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                {isReusable ? translate("Reusable Items") : translate("Consumable Items")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchItems}
                  onChange={(e) => setSearchItems(e.target.value)}
                  placeholder={translate("Search items...")}
                  className="pl-9 dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
              {itemsLoading ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("Loading...")}</p>
              ) : filteredItems.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">{translate("No items found")}</p>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <ConsumableCheckbox
                      key={item.id}
                      item={item}
                      checked={!!itemsForm.selected[item.id]}
                      qty={itemsForm.selected[item.id]?.qty ?? 1}
                      onToggle={itemsForm.toggleItem}
                      onQtyChange={itemsForm.setQty}
                      showQty={!isReusable}
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
  const [searchItems, setSearchItems] = useState("");

  const itemsForm = useStockInForm(InventoryTransactionSource.RESTOCK);

  const typedItems = useMemo(
    () => filterByTypeAndEligibility(allItems ?? [], itemsForm.itemType),
    [allItems, itemsForm.itemType],
  );

  const locations = useMemo(() => getLocationsFromItems(typedItems), [typedItems]);

  useEffect(() => {
    if (itemsForm.location && !locations.includes(itemsForm.location)) {
      itemsForm.setLocation("");
    }
  }, [locations]);

  const locationFilteredItems = useMemo(
    () => (itemsForm.location ? typedItems.filter((i) => (i.location || NO_LOCATION) === itemsForm.location) : typedItems),
    [typedItems, itemsForm.location],
  );

  const filteredItems = useMemo(() => filterItems(locationFilteredItems, searchItems), [locationFilteredItems, searchItems]);

  const handleItemTypeChange = (newType) => {
    itemsForm.setItemType(newType);
    itemsForm.setLocation("");
  };

  const handleSubmitItems = async () => {
    if (itemsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { qty }] of Object.entries(itemsForm.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: itemsForm.itemType === InventoryItemType.REUSABLE
            ? InventoryTransactionSource.MANUAL
            : itemsForm.type,
          notes: itemsForm.notes || undefined,
        });
      }
      itemsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.fullname || currentUser?.name || currentUser?.email;
  const isReusable = itemsForm.itemType === InventoryItemType.REUSABLE;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          {translate("Stock In")}
        </h1>
        <ItemTypeToggle value={itemsForm.itemType} onChange={handleItemTypeChange} />
      </div>

      {/* Transaction details */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Date")}</Label>
              <Input type="date" value={itemsForm.date} onChange={(e) => itemsForm.setDate(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Time")}</Label>
              <Input type="time" value={itemsForm.time} onChange={(e) => itemsForm.setTime(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Recorded By")}</Label>
            <Input value={recordedBy} readOnly className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default" />
          </div>

          {!isReusable && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Type")}</Label>
              <Select value={itemsForm.type} onValueChange={itemsForm.setType}>
                <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Location")}</Label>
            <Select
              value={itemsForm.location || "all"}
              onValueChange={(val) => itemsForm.setLocation(val === "all" ? "" : val)}
            >
              <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <SelectValue placeholder={translate("All locations")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All locations")}</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc === NO_LOCATION ? translate("No location") : loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Notes")}</Label>
            <Textarea value={itemsForm.notes} onChange={(e) => itemsForm.setNotes(e.target.value)} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* Item list */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            {isReusable ? translate("Reusable Items") : translate("Consumable Items")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchItems} onChange={(e) => setSearchItems(e.target.value)} placeholder={translate("Search items...")} className="pl-9 dark:border-slate-600 dark:bg-slate-700" />
          </div>
          {itemsLoading ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("Loading...")}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">{translate("No items found")}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredItems.map((item) => (
                <ConsumableCheckbox key={item.id} item={item} checked={!!itemsForm.selected[item.id]} qty={itemsForm.selected[item.id]?.qty ?? 1} onToggle={itemsForm.toggleItem} onQtyChange={itemsForm.setQty} showQty={!isReusable} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmitItems}
        disabled={isSubmitting || itemsForm.selectedCount === 0}
        className="w-full text-white bg-green-600 hover:bg-green-700"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {isSubmitting
          ? translate("Saving...")
          : itemsForm.selectedCount === 0
            ? translate("Select items first")
            : `${translate("Record Stock In")} (${itemsForm.selectedCount})`
        }
      </Button>
    </div>
  );
}
