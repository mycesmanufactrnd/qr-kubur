// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useState, useMemo } from "react";
import { translate } from "@/utils/translations";
import { TrendingUp, Search, Package, RefreshCw } from "lucide-react";
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

const itemTypeOptions = [
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

// ── Item Checkbox (consumable) ────────────────────────────────────────────────

function ConsumableCheckbox({ item, checked, qty, onToggle, onQtyChange }) {
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
    </div>
  );
}

// ── Asset Checkbox (reusable, return only) ────────────────────────────────────

function AssetCheckbox({ item, checked, assetId, onToggle, onAssetChange }) {
  const inUseAssets = (item.assets ?? []).filter((a) => a.current_status === "IN_USE");

  if (inUseAssets.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-1 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
        ${checked
          ? "border-purple-400 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-600"
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
          className="w-4 h-4 accent-purple-600 cursor-pointer shrink-0"
        />
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {item.item_name}
            {item.item_code && (
              <span className="text-xs text-gray-400 ml-1.5">({item.item_code})</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {inUseAssets.length} {translate("aset sedang digunakan")}
          </p>
        </div>
      </div>
      {checked && (
        <div className="pl-7 mt-1" onClick={(e) => e.stopPropagation()}>
          <select
            value={assetId ?? ""}
            onChange={(e) => onAssetChange(item.id, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full text-xs border rounded-md px-2 py-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">{translate("Pilih aset (wajib)")}</option>
            {inUseAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_number ?? `Asset #${a.id}`}
                {a.assigned_to ? ` — Kes: ${a.assigned_to}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Shared form hook ──────────────────────────────────────────────────────────

function useStockInForm(defaultType) {
  const [date, setDate]         = useState(todayDate);
  const [time, setTime]         = useState(nowTime);
  const [type, setType]         = useState(defaultType);
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

  const setAssetId = (id, assetId) => {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], assetId } }));
  };

  const resetForm = () => {
    setDate(todayDate());
    setTime(nowTime());
    setType(defaultType);
    setNotes("");
    setSelected({});
  };

  const selectedCount = Object.keys(selected).length;

  return { date, setDate, time, setTime, type, setType, notes, setNotes, selected, toggleItem, setQty, setAssetId, resetForm, selectedCount };
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

// ── Tab Button ────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
        ${active
          ? color === "green"
            ? "bg-green-600 text-white border-green-600"
            : "bg-purple-600 text-white border-purple-600"
          : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-gray-300"
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function InventoryStockInDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const { itemsList: allItems, isLoading: itemsLoading } = useGetAllInventoryItems();
  const { stockIn } = useInventoryTransactionMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [searchItems, setSearchItems] = useState("");
  const [searchAssets, setSearchAssets] = useState("");

  const consumableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.ONE_TIME),
    [allItems],
  );
  const reusableItemsWithInUse = useMemo(
    () => (allItems ?? []).filter(
      (i) => i.item_type === InventoryItemType.REUSABLE &&
             (i.assets ?? []).some((a) => a.current_status === "IN_USE")
    ),
    [allItems],
  );

  const itemsForm  = useStockInForm(InventoryTransactionSource.RESTOCK);
  const assetsForm = useStockInForm(InventoryTransactionSource.RETURN);

  const filteredItems  = useMemo(() => filterItems(consumableItems, searchItems), [consumableItems, searchItems]);
  const filteredAssets = useMemo(() => filterItems(reusableItemsWithInUse, searchAssets), [reusableItemsWithInUse, searchAssets]);

  const handleSubmitItems = async () => {
    if (itemsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { qty }] of Object.entries(itemsForm.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: itemsForm.type,
          notes: itemsForm.notes || undefined,
        });
      }
      itemsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssets = async () => {
    if (assetsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { assetId }] of Object.entries(assetsForm.selected)) {
        if (!assetId) continue;
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: 1,
          assetId,
          source: InventoryTransactionSource.RETURN,
          notes: assetsForm.notes || undefined,
        });
      }
      assetsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.fullname;
  const isItemsTab = activeTab === "items";
  const activeForm = isItemsTab ? itemsForm : assetsForm;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translate("Stock In")}
          </h1>
        </div>
        <div className="flex gap-2">
          <TabButton
            active={activeTab === "items"}
            onClick={() => setActiveTab("items")}
            icon={Package}
            label={translate("Item")}
            color="green"
          />
          <TabButton
            active={activeTab === "assets"}
            onClick={() => setActiveTab("assets")}
            icon={RefreshCw}
            label={translate("Aset")}
            color="purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Left: Form details ──────────────────────────────────────────── */}
        <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className={`text-base font-semibold ${isItemsTab ? "text-green-700 dark:text-green-400" : "text-purple-700 dark:text-purple-400"}`}>
              {translate("Transaction Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Date")} <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={activeForm.date}
                  onChange={(e) => activeForm.setDate(e.target.value)}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Time")} <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  value={activeForm.time}
                  onChange={(e) => activeForm.setTime(e.target.value)}
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

            {isItemsTab ? (
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
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{translate("Type")}</Label>
                <Input
                  value={translate("Pulangan")}
                  readOnly
                  className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default"
                />
                <p className="text-xs text-gray-400">{translate("Daftarkan aset baru di halaman Aset")}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Notes")}</Label>
              <Textarea
                value={activeForm.notes}
                onChange={(e) => activeForm.setNotes(e.target.value)}
                placeholder={translate("Optional")}
                rows={3}
                className="resize-none dark:border-slate-600 dark:bg-slate-700"
              />
            </div>

            <Button
              onClick={isItemsTab ? handleSubmitItems : handleSubmitAssets}
              disabled={isSubmitting || activeForm.selectedCount === 0}
              className={`w-full text-white ${isItemsTab ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isSubmitting
                ? translate("Saving...")
                : activeForm.selectedCount === 0
                  ? translate("Select items first")
                  : `${translate("Record Stock In")} (${activeForm.selectedCount})`
              }
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Item/Asset list ───────────────────────────────────────── */}
        <div className="lg:col-span-3">

          {isItemsTab ? (
            <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {translate("Consumable Items")}
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
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600" />
                  {translate("Aset Sedang Digunakan")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchAssets}
                    onChange={(e) => setSearchAssets(e.target.value)}
                    placeholder={translate("Search assets...")}
                    className="pl-9 dark:border-slate-600 dark:bg-slate-700"
                  />
                </div>
                {itemsLoading ? (
                  <p className="text-center text-sm text-gray-400 py-6">{translate("Loading...")}</p>
                ) : filteredAssets.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">{translate("Tiada aset sedang digunakan")}</p>
                ) : (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredAssets.map((item) => (
                      <AssetCheckbox
                        key={item.id}
                        item={item}
                        checked={!!assetsForm.selected[item.id]}
                        assetId={assetsForm.selected[item.id]?.assetId}
                        onToggle={assetsForm.toggleItem}
                        onAssetChange={assetsForm.setAssetId}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
  const [activeTab, setActiveTab] = useState("items");
  const [searchItems, setSearchItems] = useState("");
  const [searchAssets, setSearchAssets] = useState("");

  const consumableItems = useMemo(
    () => (allItems ?? []).filter((i) => i.item_type === InventoryItemType.ONE_TIME),
    [allItems],
  );
  const reusableItemsWithInUse = useMemo(
    () => (allItems ?? []).filter(
      (i) => i.item_type === InventoryItemType.REUSABLE &&
             (i.assets ?? []).some((a) => a.current_status === "IN_USE")
    ),
    [allItems],
  );

  const itemsForm  = useStockInForm(InventoryTransactionSource.RESTOCK);
  const assetsForm = useStockInForm(InventoryTransactionSource.RETURN);

  const filteredItems  = useMemo(() => filterItems(consumableItems, searchItems), [consumableItems, searchItems]);
  const filteredAssets = useMemo(() => filterItems(reusableItemsWithInUse, searchAssets), [reusableItemsWithInUse, searchAssets]);

  const handleSubmitItems = async () => {
    if (itemsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { qty }] of Object.entries(itemsForm.selected)) {
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: Number(qty),
          source: itemsForm.type,
          notes: itemsForm.notes || undefined,
        });
      }
      itemsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssets = async () => {
    if (assetsForm.selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      for (const [itemId, { assetId }] of Object.entries(assetsForm.selected)) {
        if (!assetId) continue;
        await stockIn.mutateAsync({
          itemId: Number(itemId),
          quantity: 1,
          assetId,
          source: InventoryTransactionSource.RETURN,
          notes: assetsForm.notes || undefined,
        });
      }
      assetsForm.resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  const recordedBy = currentUser?.fullname || currentUser?.name || currentUser?.email;
  const isItemsTab = activeTab === "items";
  const activeForm = isItemsTab ? itemsForm : assetsForm;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Stock In"), page: "InventoryStockIn" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          {translate("Stock In")}
        </h1>
        <div className="flex gap-1.5">
          <TabButton active={isItemsTab} onClick={() => setActiveTab("items")} icon={Package} label={translate("Item")} color="green" />
          <TabButton active={!isItemsTab} onClick={() => setActiveTab("assets")} icon={RefreshCw} label={translate("Aset")} color="purple" />
        </div>
      </div>

      {/* Transaction details */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Date")}</Label>
              <Input type="date" value={activeForm.date} onChange={(e) => activeForm.setDate(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Time")}</Label>
              <Input type="time" value={activeForm.time} onChange={(e) => activeForm.setTime(e.target.value)} className="dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Recorded By")}</Label>
            <Input value={recordedBy} readOnly className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default" />
          </div>

          {isItemsTab ? (
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
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{translate("Type")}</Label>
              <Input value={translate("Pulangan")} readOnly className="dark:border-slate-600 dark:bg-slate-700/50 dark:text-gray-300 bg-gray-50 text-gray-600 cursor-default" />
              <p className="text-xs text-gray-400">{translate("Daftarkan aset baru di halaman Aset")}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{translate("Notes")}</Label>
            <Textarea value={activeForm.notes} onChange={(e) => activeForm.setNotes(e.target.value)} placeholder={translate("Optional")} rows={2} className="resize-none dark:border-slate-600 dark:bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* Item / Asset list */}
      {isItemsTab ? (
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
              <Input value={searchItems} onChange={(e) => setSearchItems(e.target.value)} placeholder={translate("Search items...")} className="pl-9 dark:border-slate-600 dark:bg-slate-700" />
            </div>
            {itemsLoading ? (
              <p className="text-center text-sm text-gray-400 py-4">{translate("Loading...")}</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">{translate("No items found")}</p>
            ) : (
              <div className="space-y-1.5">
                {filteredItems.map((item) => (
                  <ConsumableCheckbox key={item.id} item={item} checked={!!itemsForm.selected[item.id]} qty={itemsForm.selected[item.id]?.qty ?? 1} onToggle={itemsForm.toggleItem} onQtyChange={itemsForm.setQty} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              {translate("Aset Sedang Digunakan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchAssets} onChange={(e) => setSearchAssets(e.target.value)} placeholder={translate("Search assets...")} className="pl-9 dark:border-slate-600 dark:bg-slate-700" />
            </div>
            {itemsLoading ? (
              <p className="text-center text-sm text-gray-400 py-4">{translate("Loading...")}</p>
            ) : filteredAssets.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">{translate("Tiada aset sedang digunakan")}</p>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets.map((item) => (
                  <AssetCheckbox key={item.id} item={item} checked={!!assetsForm.selected[item.id]} assetId={assetsForm.selected[item.id]?.assetId} onToggle={assetsForm.toggleItem} onAssetChange={assetsForm.setAssetId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={isItemsTab ? handleSubmitItems : handleSubmitAssets}
        disabled={isSubmitting || activeForm.selectedCount === 0}
        className={`w-full text-white ${isItemsTab ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {isSubmitting
          ? translate("Saving...")
          : activeForm.selectedCount === 0
            ? translate("Select items first")
            : `${translate("Record Stock In")} (${activeForm.selectedCount})`
        }
      </Button>
    </div>
  );
}
