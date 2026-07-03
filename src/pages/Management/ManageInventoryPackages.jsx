// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  Plus,
  Edit,
  Trash2,
  Boxes,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { useCrudPermissions } from "@/components/PermissionsContext";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetInventoryPackagesPaginated,
  useInventoryPackageMutations,
  useGetAllInventoryItems,
} from "@/hooks/useInventoryMutations";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
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
const itemTypeOptions = [
  { value: InventoryItemType.ONE_TIME, label: translate("Consumable") },
  { value: InventoryItemType.REUSABLE, label: translate("Reusable")   },
];

const defaultPackageField = {
  package_name: "",
  description: "",
  gender_type: InventoryPackageGenderType.ANY,
  age_group: InventoryPackageAgeGroup.ADULT,
  health_condition: InventoryPackageHealthCondition.NORMAL,
  body_size: null,
  status: ActiveInactiveStatus.ACTIVE,
  packageItems: [{ itemId: "", quantity_required: 1, item_type: InventoryItemType.ONE_TIME }],
};

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
}

function statusBadge(status) {
  return status === ActiveInactiveStatus.ACTIVE
    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{translate("Active")}</span>
    : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{translate("Inactive")}</span>;
}

export default function ManageInventoryPackages() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageInventoryPackages /> : <ManageInventoryPackagesDesktop />;
}

// ── Package Items Sub-form ────────────────────────────────────────────────────

function PackageItemsForm({ control, errors, allItems }) {
  const { fields, append, remove } = useFieldArray({ control, name: "packageItems" });
  const watchedItems = useWatch({ control, name: "packageItems" });

  const itemMap = Object.fromEntries((allItems ?? []).map((i) => [String(i.id), i]));

  const handleItemSelect = (index, itemId, onChange) => {
    onChange(Number(itemId));
    const selectedItem = itemMap[itemId];
    if (selectedItem) {
      // Auto-fill item_type from the selected item's type
      const currentFields = watchedItems ?? [];
      // We use Controller for item_type, so we set via form setValue — handled in onChange below
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{translate("Package Items")} <span className="text-red-500">*</span></Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ itemId: "", quantity_required: 1, item_type: InventoryItemType.ONE_TIME })}
        >
          <Plus className="w-3 h-3 mr-1" />
          {translate("Add Item")}
        </Button>
      </div>

      {errors?.packageItems && !Array.isArray(errors.packageItems) && (
        <p className="text-xs text-red-500">{errors.packageItems.message}</p>
      )}

      <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-700">
              <TableHead>{translate("Item")}</TableHead>
              <TableHead className="w-24 text-center">{translate("Qty")}</TableHead>
              <TableHead className="w-36">{translate("Type")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const selectedItemId = watchedItems?.[index]?.itemId;
              const selectedItem = selectedItemId ? itemMap[String(selectedItemId)] : null;

              return (
                <TableRow key={field.id}>
                  {/* Item select */}
                  <TableCell className="py-2">
                    <Controller
                      name={`packageItems.${index}.itemId`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: f }) => (
                        <Select
                          value={String(f.value || "")}
                          onValueChange={(val) => {
                            f.onChange(Number(val));
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm dark:border-slate-600 dark:bg-slate-800">
                            <SelectValue placeholder={translate("Select item")} />
                          </SelectTrigger>
                          <SelectContent>
                            {(allItems ?? []).map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.item_name}
                                {item.item_code ? ` (${item.item_code})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors?.packageItems?.[index]?.itemId && (
                      <p className="text-xs text-red-500 mt-0.5">{translate("Required")}</p>
                    )}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="py-2">
                    <Controller
                      name={`packageItems.${index}.quantity_required`}
                      control={control}
                      rules={{ required: true, min: 1 }}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          min={1}
                          className="h-8 text-sm text-center dark:border-slate-600 dark:bg-slate-800"
                          value={f.value}
                          onChange={(e) => f.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </TableCell>

                  {/* Item type */}
                  <TableCell className="py-2">
                    <Controller
                      name={`packageItems.${index}.item_type`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="h-8 text-sm dark:border-slate-600 dark:bg-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {itemTypeOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>

                  {/* Remove */}
                  <TableCell className="py-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function ManageInventoryPackagesDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("inventory-packages");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage      = parseInt(searchParams.get("page") || "1");
  const urlName      = searchParams.get("name") || "";
  const urlGender    = searchParams.get("gender") || "all";
  const urlStatus    = searchParams.get("status") || "all";
  const urlSortField = searchParams.get("sortField") || "";
  const urlSortOrder = searchParams.get("sortOrder") || "";

  const [tempName, setTempName]       = useState(urlName);
  const [tempGender, setTempGender]   = useState(urlGender);
  const [tempStatus, setTempStatus]   = useState(urlStatus);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempName(urlName);
    setTempGender(urlGender);
    setTempStatus(urlStatus);
  }, [urlName, urlGender, urlStatus]);

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingPackage, setEditingPackage]     = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete]   = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultPackageField,
  });

  const { packagesList, total, totalPages, isLoading } = useGetInventoryPackagesPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName || undefined,
    filterGender: urlGender !== "all" ? urlGender : undefined,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });

  const { itemsList: allItems } = useGetAllInventoryItems();
  const { createPackage, updatePackage, deletePackage } = useInventoryPackageMutations();

  const handleSearch = () => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      np.set("page", "1");
      tempName   ? np.set("name", tempName)   : np.delete("name");
      tempGender !== "all" ? np.set("gender", tempGender) : np.delete("gender");
      tempStatus !== "all" ? np.set("status", tempStatus) : np.delete("status");
      return np;
    });
  };

  const handleReset = () => {
    setTempName(""); setTempGender("all"); setTempStatus("all");
    setSearchParams((p) => { const np = new URLSearchParams(p); ["name","gender","status","page"].forEach((k) => np.delete(k)); return np; });
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

  const openAddDialog = () => {
    setEditingPackage(null);
    reset(defaultPackageField);
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
      status: pkg.status,
      packageItems: pkg.packageItems?.length
        ? pkg.packageItems.map((pi) => ({ itemId: pi.itemId, quantity_required: pi.quantity_required, item_type: pi.item_type }))
        : [{ itemId: "", quantity_required: 1, item_type: InventoryItemType.ONE_TIME }],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      description: data.description || undefined,
      body_size: data.body_size || undefined,
      packageItems: data.packageItems.map((pi) => ({
        itemId: Number(pi.itemId),
        quantity_required: Number(pi.quantity_required),
        item_type: pi.item_type,
      })),
    };

    if (editingPackage) {
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

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Packages"), page: "ManageInventoryPackages" },
      ]} />
      <AccessDeniedComponent />
    </div>
  );

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
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add Package")}
          </Button>
        )}
      </div>

      <SearchBar
        value={tempName}
        onChange={setTempName}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder={translate("Package name")}
        buttonClassName="bg-indigo-600 text-white"
        filtersClassName="grid grid-cols-2 sm:grid-cols-2 gap-3"
      >
        <Select value={tempGender} onValueChange={setTempGender}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Gender")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Genders")}</SelectItem>
            {genderOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={tempStatus} onValueChange={setTempStatus}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Status")}</SelectItem>
            <SelectItem value={ActiveInactiveStatus.ACTIVE}>{translate("Active")}</SelectItem>
            <SelectItem value={ActiveInactiveStatus.INACTIVE}>{translate("Inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </SearchBar>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("package_name")}>
                  <span className="flex items-center">
                    {translate("Package Name")}
                    <SortIcon field="package_name" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("gender_type")}>
                  <span className="flex items-center">
                    {translate("Gender")}
                    <SortIcon field="gender_type" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead>{translate("Age Group")}</TableHead>
                <TableHead>{translate("Health")}</TableHead>
                <TableHead className="text-center">{translate("Items")}</TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("status")}>
                  <span className="flex items-center justify-center">
                    {translate("Status")}
                    <SortIcon field="status" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={7} />
              ) : packagesList.length === 0 ? (
                <NoDataTableComponent colSpan={7} />
              ) : (
                packagesList.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div>{pkg.package_name}</div>
                      {pkg.description && (
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{pkg.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{pkg.gender_type}</TableCell>
                    <TableCell>{pkg.age_group}</TableCell>
                    <TableCell>{pkg.health_condition}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold">
                        {pkg.packageItems?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(pkg.status)}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(pkg)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
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

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? translate("Edit Package") : translate("Add Package")}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? translate("Update package details and items") : translate("Create a new jenazah package")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Package details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInputForm name="package_name" control={control} label={translate("Package Name")} required errors={errors} />
              <SelectForm name="status" control={control} label={translate("Status")} options={statusOptions} required errors={errors} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectForm name="gender_type"     control={control} label={translate("Gender")}          options={genderOptions}  required errors={errors} />
              <SelectForm name="age_group"        control={control} label={translate("Age Group")}       options={ageGroupOptions} required errors={errors} />
              <SelectForm name="health_condition" control={control} label={translate("Health Condition")} options={healthOptions}  required errors={errors} />
              <SelectForm name="body_size"        control={control} label={translate("Body Size")}       options={bodySizeOptions} placeholder={translate("Optional")} errors={errors} />
            </div>

            <TextInputForm name="description" control={control} label={translate("Description")} placeholder={translate("Optional")} errors={errors} />

            {/* Dynamic package items */}
            <PackageItemsForm control={control} errors={errors} allItems={allItems} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? translate("Saving...") : editingPackage ? translate("Update") : translate("Create")}
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
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("inventory-packages");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("name") || "";
  const [tempName, setTempName] = useState(urlName);
  const [itemsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingPackage, setEditingPackage]     = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete]   = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultPackageField,
  });

  const { packagesList, total, totalPages, isLoading } = useGetInventoryPackagesPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName || undefined,
  });

  const { itemsList: allItems } = useGetAllInventoryItems();
  const { createPackage, updatePackage, deletePackage } = useInventoryPackageMutations();

  const handleSearch = () => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); tempName ? n.set("name", tempName) : n.delete("name"); return n; });
  };
  const handleReset = () => {
    setTempName("");
    setSearchParams((p) => { const n = new URLSearchParams(p); ["name","page"].forEach((k) => n.delete(k)); return n; });
  };

  const openAddDialog = () => { setEditingPackage(null); reset(defaultPackageField); setIsDialogOpen(true); };
  const openEditDialog = (pkg) => {
    setEditingPackage(pkg);
    reset({
      package_name: pkg.package_name, description: pkg.description ?? "", gender_type: pkg.gender_type, age_group: pkg.age_group, health_condition: pkg.health_condition, body_size: pkg.body_size ?? null, status: pkg.status,
      packageItems: pkg.packageItems?.length ? pkg.packageItems.map((pi) => ({ itemId: pi.itemId, quantity_required: pi.quantity_required, item_type: pi.item_type })) : [{ itemId: "", quantity_required: 1, item_type: InventoryItemType.ONE_TIME }],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = { ...data, description: data.description || undefined, body_size: data.body_size || undefined, packageItems: data.packageItems.map((pi) => ({ itemId: Number(pi.itemId), quantity_required: Number(pi.quantity_required), item_type: pi.item_type })) };
    if (editingPackage) {
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

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

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
        {canCreate && (
          <Button size="sm" onClick={openAddDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <SearchBar value={tempName} onChange={setTempName} onSearch={handleSearch} onReset={handleReset} placeholder={translate("Search package")} buttonClassName="bg-indigo-600 text-white" />

      {isLoading ? (
        <PageLoadingComponent />
      ) : packagesList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No packages found")}</p>
      ) : (
        <div className="space-y-2">
          {packagesList.map((pkg) => (
            <Card key={pkg.id} className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{pkg.package_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pkg.gender_type} · {pkg.age_group} · {pkg.health_condition}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {statusBadge(pkg.status)}
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        {pkg.packageItems?.length ?? 0} {translate("items")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(pkg)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })} itemsPerPage={itemsPerPage} totalItems={total} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{editingPackage ? translate("Edit Package") : translate("Add Package")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm name="package_name" control={control} label={translate("Package Name")} required errors={errors} />
            <SelectForm name="gender_type" control={control} label={translate("Gender")} options={genderOptions} required errors={errors} />
            <SelectForm name="age_group" control={control} label={translate("Age Group")} options={ageGroupOptions} required errors={errors} />
            <SelectForm name="health_condition" control={control} label={translate("Health Condition")} options={healthOptions} required errors={errors} />
            <SelectForm name="status" control={control} label={translate("Status")} options={statusOptions} required errors={errors} />
            <PackageItemsForm control={control} errors={errors} allItems={allItems} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate("Cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? translate("Saving...") : editingPackage ? translate("Update") : translate("Create")}
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
