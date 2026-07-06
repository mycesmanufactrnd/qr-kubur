// @ts-nocheck
import React, { useMemo, useState } from "react";
import { translate } from "@/utils/translations";
import { Plus, Edit, Trash2, Package, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAllInventoryItems,
  useInventoryItemMutations,
} from "@/hooks/useInventoryMutations";
import { useForm } from "react-hook-form";
import {
  InventoryAssetCondition,
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryUnitType,
} from "@/utils/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

const defaultItemField = {
  item_code: "",
  item_name: "",
  category: InventoryItemCategory.PERSEDIAAN_JENAZAH,
  item_type: InventoryItemType.ONE_TIME,
  unit_type: InventoryUnitType.PCS,
  current_quantity: 0,
  minimum_level: 0,
  location: "",
  description: "",
  condition: InventoryAssetCondition.GOOD,
};

const categoryOptions = Object.values(InventoryItemCategory).map((v) => ({
  value: v,
  label: v,
}));

const itemTypeOptions = [
  { value: InventoryItemType.ONE_TIME, label: translate("Habis Guna (Consumable)") },
  { value: InventoryItemType.REUSABLE, label: translate("Boleh Guna Semula (Reusable)") },
];

const unitTypeOptions = Object.values(InventoryUnitType).map((v) => ({
  value: v,
  label: v.toUpperCase(),
}));

const conditionOptions = [
  { value: InventoryAssetCondition.GOOD, label: "Baik (Good)" },
  { value: InventoryAssetCondition.DAMAGED, label: "Rosak (Damaged)" },
  { value: InventoryAssetCondition.MAINTENANCE, label: "Penyelenggaraan (Maintenance)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status) {
  switch (status) {
    case InventoryItemStatus.AVAILABLE:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{translate("Available")}</span>;
    case InventoryItemStatus.LOW_STOCK:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{translate("Low Stock")}</span>;
    case InventoryItemStatus.OUT_OF_STOCK:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{translate("Out of Stock")}</span>;
    case InventoryItemStatus.IN_USE:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{translate("In Use")}</span>;
    case InventoryItemStatus.MISSING:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{translate("Missing")}</span>;
    case InventoryItemStatus.MAINTENANCE:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">{translate("Maintenance")}</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{status}</span>;
  }
}

function typeBadge(item_type) {
  return item_type === InventoryItemType.REUSABLE ? (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      Reusable
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
      Consumable
    </span>
  );
}

// ── Location Detail Popup ─────────────────────────────────────────────────────

function LocationDetailDialog({ location, items, open, onClose, onEdit, onDelete, onAddItem, hasAdminAccess }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                {location}
              </DialogTitle>
              <DialogDescription>{items.length} {translate("item(s)")}</DialogDescription>
            </div>
            {hasAdminAccess && (
              <Button size="sm" onClick={onAddItem} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" />
                {translate("Add Item")}
              </Button>
            )}
          </div>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{translate("No items in this location.")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-600 text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-3 font-medium">{translate("Item Name")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Code")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Category")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Type")}</th>
                  <th className="pb-2 pr-3 font-medium text-right">{translate("Qty")}</th>
                  <th className="pb-2 pr-3 font-medium text-right">{translate("Min")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Status")}</th>
                  {hasAdminAccess && <th className="pb-2 font-medium text-center">{translate("Actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b dark:border-slate-700 last:border-0">
                    <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">{item.item_name}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-gray-400">{item.item_code || "—"}</td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{item.category}</td>
                    <td className="py-2 pr-3">{typeBadge(item.item_type)}</td>
                    <td className="py-2 pr-3 text-right font-mono">
                      {item.item_type !== InventoryItemType.REUSABLE ? `${item.current_quantity} ${item.unit_type}` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-500">
                      {item.item_type !== InventoryItemType.REUSABLE ? item.minimum_level : "—"}
                    </td>
                    <td className="py-2 pr-3">{statusBadge(item.status)}</td>
                    {hasAdminAccess && (
                      <td className="py-2 text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => { onClose(); onEdit(item); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => { onClose(); onDelete(item); }}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── LocationCard ──────────────────────────────────────────────────────────────

function LocationCard({
  location,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteLocation,
  onOpenDetail,
  hasAdminAccess,
  style,
}) {
  return (
    <>
      <Card
        style={style}
        className="border shadow-sm dark:bg-slate-800 dark:border-slate-700 cursor-pointer hover:shadow-xl hover:scale-105 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
        onClick={onOpenDetail}
      >
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-gray-800 dark:text-white min-w-0">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="truncate">{location}</span>
            </CardTitle>
            {hasAdminAccess && (
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  onClick={onAddItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {translate("Add Item")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={onDeleteLocation}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
            {items.length} {translate("item(s)")}
          </p>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-1 space-y-1">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              {translate("No items yet.")}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                  {item.item_name}
                </span>
                {statusBadge(item.status)}
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ManageInventoryItems() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { itemsList, isLoading } = useGetAllInventoryItems();

  // Local state for pending locations (added but no items yet)
  const [pendingLocations, setPendingLocations] = useState([]);
  const [addLocDialog, setAddLocDialog] = useState(false);
  const [newLocName, setNewLocName] = useState("");

  // Location detail popup
  const [detailLocation, setDetailLocation] = useState(null);
  const [returnToLocation, setReturnToLocation] = useState(null);

  // Item dialog state
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { createItem, updateItem, deleteItem, deleteByLocation } = useInventoryItemMutations();

  const [deleteLocDialog, setDeleteLocDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: defaultItemField });

  const watchedType = watch("item_type");
  const isReusable = watchedType === InventoryItemType.REUSABLE;

  // Group DB items by location
  const locationGroups = useMemo(() => {
    const groups = {};
    for (const item of itemsList) {
      const loc = item.location || "Tiada Lokasi";
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(item);
    }
    return groups;
  }, [itemsList]);

  // Merge DB locations + pending empty locations
  const allLocations = useMemo(() => {
    const dbLocs = Object.keys(locationGroups);
    const pending = pendingLocations.filter((l) => !dbLocs.includes(l));
    return [...dbLocs, ...pending];
  }, [locationGroups, pendingLocations]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddLocation = () => {
    const loc = newLocName.trim();
    if (!loc || allLocations.includes(loc)) return;
    setPendingLocations((prev) => [...prev, loc]);
    setNewLocName("");
    setAddLocDialog(false);
  };

  const openAddItemForLocation = (location) => {
    setReturnToLocation(detailLocation);
    setDetailLocation(null);
    setEditingItem(null);
    reset({ ...defaultItemField, location });
    setIsItemDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setReturnToLocation(detailLocation);
    setDetailLocation(null);
    setEditingItem(item);
    reset({
      item_code: item.item_code ?? "",
      item_name: item.item_name,
      category: item.category,
      item_type: item.item_type,
      unit_type: item.unit_type,
      current_quantity: item.current_quantity,
      minimum_level: item.minimum_level,
      location: item.location ?? "",
      description: item.description ?? "",
      condition: InventoryAssetCondition.GOOD,
    });
    setIsItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setIsItemDialogOpen(false);
    if (returnToLocation) {
      setDetailLocation(returnToLocation);
      setReturnToLocation(null);
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      item_code: data.item_code || undefined,
      item_name: data.item_name,
      category: data.category,
      item_type: data.item_type,
      unit_type: isReusable ? InventoryUnitType.PCS : data.unit_type,
      current_quantity: isReusable ? 1 : Number(data.current_quantity),
      minimum_level: isReusable ? 1 : Number(data.minimum_level),
      location: data.location || undefined,
      description: data.description || undefined,
    };

    if (editingItem) {
      await updateItem.mutateAsync(
        { id: editingItem.id, data: payload },
        { onSuccess: () => closeItemDialog() },
      );
    } else {
      await createItem.mutateAsync(payload, {
        onSuccess: () => {
          closeItemDialog();
          // Remove from pending once the item is saved to DB
          setPendingLocations((prev) =>
            prev.filter((l) => l !== data.location),
          );
        },
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    // Pending location (no items) — just remove from local state
    if (!locationGroups[locationToDelete] || locationGroups[locationToDelete].length === 0) {
      setPendingLocations((prev) => prev.filter((l) => l !== locationToDelete));
    } else {
      await deleteByLocation.mutateAsync(locationToDelete);
    }
    setDeleteLocDialog(false);
    setLocationToDelete(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
          { label: translate("Inventory Items"), page: "ManageInventoryItems" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Package className="w-6 h-6 text-blue-600" />
          {translate("Inventory Items")}
        </h1>
        {hasAdminAccess && (
          <Button
            onClick={() => setAddLocDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add Location")}
          </Button>
        )}
      </div>

      {/* Location grid */}
      {isLoading ? (
        <PageLoadingComponent />
      ) : allLocations.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{translate("No locations added yet")}</p>
          <p className="text-sm mt-1">
            {translate("Click 'Add Location' to set up your inventory storage areas")}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {allLocations.map((location) => {
            const cols = Math.min(allLocations.length, 3);
            return (
            <LocationCard
              key={location}
              style={{ width: `calc((100% - ${(cols - 1) * 16}px) / ${cols})` }}
              location={location}
              items={locationGroups[location] || []}
              onAddItem={() => openAddItemForLocation(location)}
              onEditItem={openEditDialog}
              onDeleteItem={(item) => {
                setItemToDelete(item);
                setDeleteDialogOpen(true);
              }}
              onDeleteLocation={() => {
                setLocationToDelete(location);
                setDeleteLocDialog(true);
              }}
              onOpenDetail={() => setDetailLocation(location)}
              hasAdminAccess={hasAdminAccess}
            />
            );
          })}
        </div>
      )}

      {/* ── Location Detail Popup ───────────────────────────────────────────── */}
      <LocationDetailDialog
        location={detailLocation}
        items={detailLocation ? (locationGroups[detailLocation] || []) : []}
        open={!!detailLocation}
        onClose={() => setDetailLocation(null)}
        onEdit={openEditDialog}
        onDelete={(item) => { setDetailLocation(null); setItemToDelete(item); setDeleteDialogOpen(true); }}
        onAddItem={() => openAddItemForLocation(detailLocation)}
        hasAdminAccess={hasAdminAccess}
      />

      {/* ── Add Location Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addLocDialog} onOpenChange={setAddLocDialog}>
        <DialogContent className="max-w-sm dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Add Location")}</DialogTitle>
            <DialogDescription>
              {translate("Enter a name for your inventory storage area")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{translate("Location Name")}</Label>
            <Input
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
              placeholder={translate("e.g. Stor A, Bilik Barang")}
              className="dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLocDialog(false)}>
              {translate("Cancel")}
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={!newLocName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {translate("Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Item Dialog ──────────────────────────────────────────── */}
      <Dialog open={isItemDialogOpen} onOpenChange={(open) => { if (!open) closeItemDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? translate("Edit Item") : translate("Add Item")}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? translate("Update inventory item details")
                : translate("Add a new inventory item to this location")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInputForm
                name="item_name"
                control={control}
                label={translate("Item Name")}
                required
                errors={errors}
              />
              <TextInputForm
                name="item_code"
                control={control}
                label={translate("Item Code")}
                placeholder={translate("Optional")}
                errors={errors}
              />
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectForm
                name="category"
                control={control}
                label={translate("Category")}
                options={categoryOptions}
                required
                errors={errors}
              />
              <SelectForm
                name="item_type"
                control={control}
                label={translate("Type")}
                options={itemTypeOptions}
                required
                errors={errors}
              />
            </div>

            {/* Condition */}
            <SelectForm
              name="condition"
              control={control}
              label={translate("Condition")}
              options={conditionOptions}
              disabled={!isReusable}
              errors={errors}
            />

            {/* Qty, Min Level, Unit — all disabled for reusable */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInputForm
                name="current_quantity"
                control={control}
                label={translate("Current Quantity")}
                isNumber
                required={!isReusable}
                disabled={isReusable}
                errors={errors}
              />
              <TextInputForm
                name="minimum_level"
                control={control}
                label={translate("Minimum Level")}
                isNumber
                required={!isReusable}
                disabled={isReusable}
                errors={errors}
              />
              <SelectForm
                name="unit_type"
                control={control}
                label={translate("Unit")}
                options={unitTypeOptions}
                required={!isReusable}
                disabled={isReusable}
                errors={errors}
              />
            </div>

            {/* Description */}
            <TextInputForm
              name="description"
              control={control}
              label={translate("Description")}
              placeholder={translate("Optional")}
              errors={errors}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeItemDialog}
              >
                {translate("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting
                  ? translate("Saving...")
                  : editingItem
                    ? translate("Update")
                    : translate("Add Item")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      {deleteDialogOpen && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title={translate("Delete Item")}
          description={translate("This action cannot be undone.")}
          isDelete
          itemToDelete={itemToDelete?.item_name}
        />
      )}

      {deleteLocDialog && (
        <ConfirmDialog
          open={deleteLocDialog}
          onOpenChange={setDeleteLocDialog}
          onConfirm={handleDeleteLocation}
          title={translate("Delete Location")}
          description={translate("All items and their transaction history in this location will be permanently deleted.")}
          isDelete
          itemToDelete={locationToDelete}
        />
      )}
    </div>
  );
}
