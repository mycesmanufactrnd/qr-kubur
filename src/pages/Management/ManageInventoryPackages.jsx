// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  Plus,
  Edit,
  Trash2,
  Boxes,
  Eye,
  MapPin,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import SearchBar from "@/components/forms/SearchBar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetAllInventoryPackages,
  useInventoryPackageMutations,
  useGetAllInventoryItems,
} from "@/hooks/useInventoryMutations";
import { useForm, Controller } from "react-hook-form";
import {
  ActiveInactiveStatus,
  InventoryItemType,
  InventoryPackageAgeGroup,
  InventoryPackageBodySize,
  InventoryPackageGenderType,
  InventoryPackageHealthCondition,
} from "@/utils/enums";

// ── Options ───────────────────────────────────────────────────────────────────

const genderOptions = [
  { value: InventoryPackageGenderType.MALE,   label: translate("Male")   },
  { value: InventoryPackageGenderType.FEMALE, label: translate("Female") },
  { value: InventoryPackageGenderType.ANY,    label: translate("Any")    },
];
const ageGroupOptions = [
  { value: InventoryPackageAgeGroup.BABY,  label: translate("Baby")  },
  { value: InventoryPackageAgeGroup.CHILD, label: translate("Child") },
  { value: InventoryPackageAgeGroup.ADULT, label: translate("Adult") },
];
const healthOptions = [
  { value: InventoryPackageHealthCondition.NORMAL,     label: translate("Normal")     },
  { value: InventoryPackageHealthCondition.INFECTIOUS, label: translate("Infectious") },
  { value: InventoryPackageHealthCondition.SPECIAL,    label: translate("Special")    },
];
const bodySizeOptions = [
  { value: InventoryPackageBodySize.SMALL,  label: translate("Small")  },
  { value: InventoryPackageBodySize.MEDIUM, label: translate("Medium") },
  { value: InventoryPackageBodySize.LARGE,  label: translate("Large")  },
];
const statusOptions = [
  { value: ActiveInactiveStatus.ACTIVE,   label: translate("Active")   },
  { value: ActiveInactiveStatus.INACTIVE, label: translate("Inactive") },
];

const defaultPackageField = {
  package_name: "",
  description: "",
  gender_type: InventoryPackageGenderType.ANY,
  age_group: InventoryPackageAgeGroup.ADULT,
  health_condition: InventoryPackageHealthCondition.NORMAL,
  body_size: null,
  location: "",
  status: ActiveInactiveStatus.ACTIVE,
  packageItems: [],
};

function statusBadge(status) {
  return status === ActiveInactiveStatus.ACTIVE
    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{translate("Active")}</span>
    : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{translate("Inactive")}</span>;
}

// ── View Dialog ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right">{value ?? "—"}</span>
    </div>
  );
}

function PackageViewDialog({ pkg, open, onOpenChange, onEdit }) {
  if (!pkg) return null;

  const consumable = (pkg.packageItems ?? []).filter((pi) => pi.item_type === InventoryItemType.ONE_TIME);
  const reusable   = (pkg.packageItems ?? []).filter((pi) => pi.item_type === InventoryItemType.REUSABLE);

  const genderLabel = genderOptions.find((o) => o.value === pkg.gender_type)?.label ?? pkg.gender_type;
  const ageLabel    = ageGroupOptions.find((o) => o.value === pkg.age_group)?.label ?? pkg.age_group;
  const healthLabel = healthOptions.find((o) => o.value === pkg.health_condition)?.label ?? pkg.health_condition;
  const sizeLabel   = bodySizeOptions.find((o) => o.value === pkg.body_size)?.label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            {pkg.package_name}
          </DialogTitle>
          <DialogDescription>{pkg.description || translate("No description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Details */}
          <div className="rounded-lg border dark:border-slate-700 px-4 py-2">
            <DetailRow label={translate("Status")}           value={statusBadge(pkg.status)} />
            <DetailRow label={translate("Gender")}           value={genderLabel} />
            <DetailRow label={translate("Age Group")}        value={ageLabel} />
            <DetailRow label={translate("Health Condition")} value={healthLabel} />
            {sizeLabel && <DetailRow label={translate("Body Size")} value={sizeLabel} />}
          </div>

          {/* Items */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {translate("Package Items")}
              <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">
                {pkg.packageItems?.length ?? 0} {translate("items")}
              </span>
            </p>

            {consumable.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                  {translate("Consumable")}
                </p>
                <div className="space-y-1">
                  {consumable.map((pi) => (
                    <div key={pi.itemId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm">
                      <span className="text-gray-800 dark:text-gray-200">
                        {pi.item?.item_name ?? `Item #${pi.itemId}`}
                        {pi.item?.item_code && (
                          <span className="text-xs text-gray-400 ml-1.5">({pi.item.item_code})</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                        ×{pi.quantity_required}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reusable.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                  {translate("Reusable")}
                </p>
                <div className="space-y-1">
                  {reusable.map((pi) => (
                    <div key={pi.itemId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm">
                      <span className="text-gray-800 dark:text-gray-200">
                        {pi.item?.item_name ?? `Item #${pi.itemId}`}
                        {pi.item?.item_code && (
                          <span className="text-xs text-gray-400 ml-1.5">({pi.item.item_code})</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                        ×{pi.quantity_required}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(pkg.packageItems?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">{translate("No items in this package")}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{translate("Close")}</Button>
          {onEdit && (
            <Button onClick={() => { onOpenChange(false); onEdit(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Edit className="w-4 h-4 mr-2" />
              {translate("Edit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ManageInventoryPackages() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageInventoryPackages /> : <ManageInventoryPackagesDesktop />;
}

// ── Package Items Sub-form ────────────────────────────────────────────────────

function ItemCheckboxSection({ title, items, value, onToggle, onQtyChange }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-1 mb-2">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const checked = value.some((v) => v.itemId === item.id);
          const qty = value.find((v) => v.itemId === item.id)?.quantity_required ?? 1;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-pointer
                ${checked
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500"
                  : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                }`}
              onClick={() => onToggle(item)}
            >
              <input
                type="checkbox"
                id={`item-${item.id}`}
                checked={checked}
                onChange={() => onToggle(item)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
              />
              <label
                htmlFor={`item-${item.id}`}
                className="flex-1 text-sm cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {item.item_name}
                {item.item_code && (
                  <span className="text-xs text-gray-400 ml-1.5">({item.item_code})</span>
                )}
              </label>
              {checked && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onQtyChange(item.id, Math.max(1, qty - 1))}
                    className="h-7 w-7 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-base leading-none select-none"
                  >−</button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => onQtyChange(item.id, qty + 1)}
                    className="h-7 w-7 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-base leading-none select-none"
                  >+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PackageItemsForm({ control, errors, allItems, selectedLocation, onLocationChange }) {
  const items = allItems ?? [];

  const locationItems = selectedLocation
    ? items.filter((i) => i.location === selectedLocation)
    : [];

  const consumableItems = locationItems.filter((i) => i.item_type === InventoryItemType.ONE_TIME);
  const reusableItems   = locationItems.filter((i) => i.item_type === InventoryItemType.REUSABLE);

  return (
    <Controller
      name="packageItems"
      control={control}
      rules={{ validate: (v) => (v && v.length > 0) || translate("At least one item required") }}
      render={({ field }) => {
        const value = field.value ?? [];

        const toggle = (item) => {
          if (value.some((v) => v.itemId === item.id)) {
            field.onChange(value.filter((v) => v.itemId !== item.id));
          } else {
            field.onChange([...value, { itemId: item.id, quantity_required: 1, item_type: item.item_type }]);
          }
        };

        const setQty = (itemId, qty) => {
          field.onChange(value.map((v) => (v.itemId === itemId ? { ...v, quantity_required: qty } : v)));
        };

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {translate("Package Items")} <span className="text-red-500">*</span>
              </Label>
              {value.length > 0 && (
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {value.length} {translate("selected")}
                </span>
              )}
            </div>

            {errors?.packageItems && !Array.isArray(errors.packageItems) && (
              <p className="text-xs text-red-500">{errors.packageItems.message}</p>
            )}

            {!selectedLocation ? (
              <div className="border rounded-lg dark:border-slate-600 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                {translate("Select a location to view items")}
              </div>
            ) : locationItems.length === 0 ? (
              <div className="border rounded-lg dark:border-slate-600 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                {translate("No items found for this location")}
              </div>
            ) : (
              <div className="border rounded-lg dark:border-slate-600 p-3 space-y-4 max-h-72 overflow-y-auto">
                <ItemCheckboxSection
                  title={translate("Consumable")}
                  items={consumableItems}
                  value={value}
                  onToggle={toggle}
                  onQtyChange={setQty}
                />
                <ItemCheckboxSection
                  title={translate("Reusable")}
                  items={reusableItems}
                  value={value}
                  onToggle={toggle}
                  onQtyChange={setQty}
                />
              </div>
            )}
          </div>
        );
      }}
    />
  );
}

// ── Package Location Card ─────────────────────────────────────────────────────

function PackageLocationCard({ location, packages, onAddPackage, onView, onEdit, onDelete, hasAdminAccess, style }) {
  return (
    <Card
      style={style}
      className="border shadow-sm dark:bg-slate-800 dark:border-slate-700 cursor-pointer hover:shadow-xl hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
      onClick={() => onView(location)}
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-gray-800 dark:text-white min-w-0">
            <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">{location}</span>
          </CardTitle>
          {hasAdminAccess && (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={onAddPackage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {translate("Add")}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
          {packages.length} {translate("package(s)")}
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 space-y-1">
        {packages.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">{translate("No packages yet.")}</p>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-2 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{pkg.package_name}</span>
              {statusBadge(pkg.status)}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Package Location Detail Dialog ────────────────────────────────────────────

function PackageLocationDetailDialog({ location, packages, open, onClose, onView, onEdit, onDelete, onAddPackage, hasAdminAccess }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                {location}
              </DialogTitle>
              <DialogDescription>{packages.length} {translate("package(s)")}</DialogDescription>
            </div>
            {hasAdminAccess && (
              <Button size="sm" onClick={() => { onClose(); onAddPackage(); }} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" />
                {translate("Add Package")}
              </Button>
            )}
          </div>
        </DialogHeader>

        {packages.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{translate("No packages in this location.")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-600 text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-3 font-medium">{translate("Package Name")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Gender")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Age Group")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Health")}</th>
                  <th className="pb-2 pr-3 font-medium text-center">{translate("Items")}</th>
                  <th className="pb-2 pr-3 font-medium">{translate("Status")}</th>
                  <th className="pb-2 font-medium text-center">{translate("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b dark:border-slate-700 last:border-0">
                    <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">
                      {pkg.package_name}
                      {pkg.description && (
                        <div className="text-xs text-gray-400 font-normal truncate max-w-[160px]">{pkg.description}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{pkg.gender_type}</td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{pkg.age_group}</td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{pkg.health_condition}</td>
                    <td className="py-2 pr-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold">
                        {pkg.packageItems?.length ?? 0}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{statusBadge(pkg.status)}</td>
                    <td className="py-2 text-center">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { onClose(); onView(pkg); }}>
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                      {hasAdminAccess && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { onClose(); onEdit(pkg); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { onClose(); onDelete(pkg); }}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </>
                      )}
                    </td>
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

// ── Desktop ───────────────────────────────────────────────────────────────────

function ManageInventoryPackagesDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingPackage, setEditingPackage]     = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete]   = useState(null);
  const [viewingPackage, setViewingPackage]     = useState(null);
  const [detailLocation, setDetailLocation]     = useState(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultPackageField,
  });

  const { packagesList, isLoading } = useGetAllInventoryPackages();
  const { itemsList: allItems } = useGetAllInventoryItems();
  const { createPackage, updatePackage, deletePackage } = useInventoryPackageMutations();

  // Group packages by location (derived from their first item's location)
  const locationGroups = useMemo(() => {
    const groups = {};
    for (const pkg of packagesList) {
      const loc = pkg.location || translate("No Location");
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(pkg);
    }
    return groups;
  }, [packagesList]);

  const allLocations = Object.keys(locationGroups).sort();

  const openAddDialog = (location) => {
    setEditingPackage(null);
    reset({ ...defaultPackageField, location: location ?? "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg) => {
    setEditingPackage(pkg);
    reset({
      package_name: pkg.package_name,
      description: pkg.description ?? "",
      gender_type: pkg.gender_type,
      age_group: pkg.age_group,
      health_condition: pkg.health_condition,
      body_size: pkg.body_size ?? null,
      location: pkg.location ?? "",
      status: pkg.status,
      packageItems: pkg.packageItems?.length
        ? pkg.packageItems.map((pi) => ({ itemId: pi.itemId, quantity_required: pi.quantity_required, item_type: pi.item_type }))
        : [],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      description: data.description || undefined,
      body_size: data.body_size || undefined,
      location: data.location || undefined,
      packageItems: data.packageItems.map((pi) => ({
        itemId: Number(pi.itemId),
        quantity_required: Number(pi.quantity_required),
        item_type: pi.item_type,
      })),
    };

    if (editingPackage?.id) {
      await updatePackage.mutateAsync(
        { id: editingPackage.id, data: payload },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      await createPackage.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    await deletePackage.mutateAsync(packageToDelete.id);
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Packages"), page: "ManageInventoryPackages" },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Boxes className="w-6 h-6 text-indigo-600" />
          {translate("Inventory Packages")}
        </h1>
        {hasAdminAccess && (
          <Button onClick={() => openAddDialog()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add Package")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <PageLoadingComponent />
      ) : allLocations.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Boxes className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{translate("No packages yet")}</p>
          <p className="text-sm mt-1">{translate("Click 'Add Package' to create your first package")}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {allLocations.map((location) => {
            const cols = Math.min(allLocations.length, 3);
            return (
              <PackageLocationCard
                key={location}
                style={{ width: `calc((100% - ${(cols - 1) * 16}px) / ${cols})` }}
                location={location}
                packages={locationGroups[location] ?? []}
                onAddPackage={() => openAddDialog(location)}
                onView={() => setDetailLocation(location)}
                onEdit={openEditDialog}
                onDelete={(pkg) => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}
                hasAdminAccess={hasAdminAccess}
              />
            );
          })}
        </div>
      )}

      {/* Location detail popup */}
      <PackageLocationDetailDialog
        location={detailLocation}
        packages={detailLocation ? (locationGroups[detailLocation] ?? []) : []}
        open={!!detailLocation}
        onClose={() => setDetailLocation(null)}
        onView={(pkg) => setViewingPackage(pkg)}
        onEdit={openEditDialog}
        onDelete={(pkg) => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}
        onAddPackage={() => openAddDialog(detailLocation)}
        hasAdminAccess={hasAdminAccess}
      />

      {/* Package view dialog */}
      <PackageViewDialog
        pkg={viewingPackage}
        open={!!viewingPackage}
        onOpenChange={(o) => { if (!o) setViewingPackage(null); }}
        onEdit={hasAdminAccess ? () => { setViewingPackage(null); openEditDialog(viewingPackage); } : null}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingPackage?.id ? translate("Edit Package") : translate("Add Package")}
            </DialogTitle>
            <DialogDescription>
              {editingPackage?.id ? translate("Update package details and items") : translate("Create a new jenazah package")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Row 1: Location · Package Name · Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller
                name="location"
                control={control}
                rules={{ required: translate("Location is required") }}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {translate("Location")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(loc) => {
                        field.onChange(loc);
                        setValue("packageItems", []);
                      }}
                    >
                      <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                        <SelectValue placeholder={translate("Select location")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set((allItems ?? []).map((i) => i.location).filter(Boolean))).sort().map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors?.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
                  </div>
                )}
              />
              <TextInputForm name="package_name" control={control} label={translate("Package Name")} required errors={errors} />
              <SelectForm name="status" control={control} label={translate("Status")} options={statusOptions} required errors={errors} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectForm name="gender_type"     control={control} label={translate("Gender")}           options={genderOptions}  required errors={errors} />
              <SelectForm name="age_group"        control={control} label={translate("Age Group")}        options={ageGroupOptions} required errors={errors} />
              <SelectForm name="health_condition" control={control} label={translate("Health Condition")} options={healthOptions}   required errors={errors} />
              <SelectForm name="body_size"        control={control} label={translate("Body Size")}        options={bodySizeOptions} placeholder={translate("Optional")} errors={errors} />
            </div>

            <TextInputForm name="description" control={control} label={translate("Description")} placeholder={translate("Optional")} errors={errors} />

            <PackageItemsForm
              control={control}
              errors={errors}
              allItems={allItems}
              selectedLocation={watch("location") ?? ""}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? translate("Saving...") : editingPackage?.id ? translate("Update") : translate("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title={translate("Delete Package")}
          description={translate("This action cannot be undone. Package items will also be removed.")}
          isDelete
          itemToDelete={packageToDelete?.package_name}
        />
      )}
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileManageInventoryPackages() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingPackage, setEditingPackage]     = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete]   = useState(null);
  const [viewingPackage, setViewingPackage]     = useState(null);
  const [detailLocation, setDetailLocation]     = useState(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultPackageField,
  });

  const { packagesList, isLoading } = useGetAllInventoryPackages();
  const { itemsList: allItems } = useGetAllInventoryItems();
  const { createPackage, updatePackage, deletePackage } = useInventoryPackageMutations();

  const locationGroups = useMemo(() => {
    const groups = {};
    for (const pkg of packagesList) {
      const loc = pkg.location || translate("No Location");
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(pkg);
    }
    return groups;
  }, [packagesList]);

  const allLocations = Object.keys(locationGroups).sort();

  const openAddDialog = (location) => {
    setEditingPackage(null);
    reset({ ...defaultPackageField, location: location ?? "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg) => {
    setEditingPackage(pkg);
    reset({
      package_name: pkg.package_name, description: pkg.description ?? "", gender_type: pkg.gender_type,
      age_group: pkg.age_group, health_condition: pkg.health_condition, body_size: pkg.body_size ?? null, location: pkg.location ?? "", status: pkg.status,
      packageItems: pkg.packageItems?.length ? pkg.packageItems.map((pi) => ({ itemId: pi.itemId, quantity_required: pi.quantity_required, item_type: pi.item_type })) : [],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = { ...data, description: data.description || undefined, body_size: data.body_size || undefined, location: data.location || undefined, packageItems: data.packageItems.map((pi) => ({ itemId: Number(pi.itemId), quantity_required: Number(pi.quantity_required), item_type: pi.item_type })) };
    if (editingPackage?.id) {
      await updatePackage.mutateAsync({ id: editingPackage.id, data: payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      await createPackage.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    await deletePackage.mutateAsync(packageToDelete.id);
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Packages"), page: "ManageInventoryPackages" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Boxes className="w-5 h-5 text-indigo-600" />
          {translate("Packages")}
        </h1>
        {hasAdminAccess && (
          <Button size="sm" onClick={() => openAddDialog()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <PageLoadingComponent />
      ) : allLocations.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No packages found")}</p>
      ) : (
        <div className="space-y-3">
          {allLocations.map((location) => (
            <Card key={location} className="dark:bg-slate-800 dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200" onClick={() => setDetailLocation(location)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{location}</span>
                  </div>
                  {hasAdminAccess && (
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-2 text-xs shrink-0 ml-2"
                      onClick={(e) => { e.stopPropagation(); openAddDialog(location); }}>
                      <Plus className="w-3 h-3 mr-1" />{translate("Add")}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-6">
                  {(locationGroups[location] ?? []).length} {translate("package(s)")}
                </p>
                <div className="mt-2 pl-6 space-y-0.5">
                  {(locationGroups[location] ?? []).slice(0, 3).map((pkg) => (
                    <div key={pkg.id} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{pkg.package_name}</span>
                    </div>
                  ))}
                  {(locationGroups[location] ?? []).length > 3 && (
                    <p className="text-xs text-gray-400 pl-3">+{(locationGroups[location] ?? []).length - 3} {translate("more")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PackageLocationDetailDialog
        location={detailLocation}
        packages={detailLocation ? (locationGroups[detailLocation] ?? []) : []}
        open={!!detailLocation}
        onClose={() => setDetailLocation(null)}
        onView={(pkg) => setViewingPackage(pkg)}
        onEdit={openEditDialog}
        onDelete={(pkg) => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}
        onAddPackage={() => openAddDialog(detailLocation)}
        hasAdminAccess={hasAdminAccess}
      />

      <PackageViewDialog
        pkg={viewingPackage}
        open={!!viewingPackage}
        onOpenChange={(o) => { if (!o) setViewingPackage(null); }}
        onEdit={hasAdminAccess ? () => { setViewingPackage(null); openEditDialog(viewingPackage); } : null}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{editingPackage?.id ? translate("Edit Package") : translate("Add Package")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="location"
              control={control}
              rules={{ required: translate("Location is required") }}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {translate("Location")} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(loc) => { field.onChange(loc); setValue("packageItems", []); }}
                  >
                    <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                      <SelectValue placeholder={translate("Select location")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set((allItems ?? []).map((i) => i.location).filter(Boolean))).sort().map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
                </div>
              )}
            />
            <TextInputForm name="package_name" control={control} label={translate("Package Name")} required errors={errors} />
            <SelectForm name="status" control={control} label={translate("Status")} options={statusOptions} required errors={errors} />
            <SelectForm name="gender_type" control={control} label={translate("Gender")} options={genderOptions} required errors={errors} />
            <SelectForm name="age_group" control={control} label={translate("Age Group")} options={ageGroupOptions} required errors={errors} />
            <SelectForm name="health_condition" control={control} label={translate("Health Condition")} options={healthOptions} required errors={errors} />
            <PackageItemsForm
              control={control}
              errors={errors}
              allItems={allItems}
              selectedLocation={watch("location") ?? ""}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate("Cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? translate("Saving...") : editingPackage?.id ? translate("Update") : translate("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} title={translate("Delete Package")} description={translate("This action cannot be undone.")} isDelete itemToDelete={packageToDelete?.package_name} />
      )}
    </div>
  );
}
