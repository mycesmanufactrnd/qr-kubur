// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  Plus,
  Edit,
  Trash2,
  Wrench,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
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
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { showError } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetInventoryAssetsPaginated,
  useInventoryAssetMutations,
  useGetAllInventoryItems,
} from "@/hooks/useInventoryMutations";
import { useForm, Controller } from "react-hook-form";
import {
  InventoryAssetCondition,
  InventoryAssetStatus,
  InventoryItemType,
} from "@/utils/enums";

// ── Options ───────────────────────────────────────────────────────────────────

const conditionOptions = [
  { value: InventoryAssetCondition.GOOD,        label: translate("Good")        },
  { value: InventoryAssetCondition.DAMAGED,     label: translate("Damaged")     },
  { value: InventoryAssetCondition.MAINTENANCE, label: translate("Maintenance") },
  { value: InventoryAssetCondition.MISSING,     label: translate("Missing")     },
];

const statusOptions = [
  { value: InventoryAssetStatus.AVAILABLE,   label: translate("Available")   },
  { value: InventoryAssetStatus.IN_USE,      label: translate("In Use")      },
  { value: InventoryAssetStatus.MAINTENANCE, label: translate("Maintenance") },
  { value: InventoryAssetStatus.MISSING,     label: translate("Missing")     },
];

const defaultAssetField = {
  itemId: "",
  current_status: InventoryAssetStatus.AVAILABLE,
  condition: InventoryAssetCondition.GOOD,
  assigned_to: "",
  last_used_date: "",
  notes: "",
};

function statusBadge(status) {
  const map = {
    [InventoryAssetStatus.AVAILABLE]:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    [InventoryAssetStatus.IN_USE]:      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    [InventoryAssetStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    [InventoryAssetStatus.MISSING]:     "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  const labels = {
    [InventoryAssetStatus.AVAILABLE]:   translate("Available"),
    [InventoryAssetStatus.IN_USE]:      translate("In Use"),
    [InventoryAssetStatus.MAINTENANCE]: translate("Maintenance"),
    [InventoryAssetStatus.MISSING]:     translate("Missing"),
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function conditionBadge(condition) {
  const map = {
    [InventoryAssetCondition.GOOD]:        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    [InventoryAssetCondition.DAMAGED]:     "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    [InventoryAssetCondition.MAINTENANCE]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    [InventoryAssetCondition.MISSING]:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  const labels = {
    [InventoryAssetCondition.GOOD]:        translate("Good"),
    [InventoryAssetCondition.DAMAGED]:     translate("Damaged"),
    [InventoryAssetCondition.MAINTENANCE]: translate("Maintenance"),
    [InventoryAssetCondition.MISSING]:     translate("Missing"),
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[condition] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[condition] ?? condition}
    </span>
  );
}

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
}

// ── Shared Asset Form ─────────────────────────────────────────────────────────

function AssetForm({ control, handleSubmit, onSubmit, errors, isSubmitting, reusableItems, editingAsset, watch, onCancel }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Item dropdown — shows "CODE — Name" */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {translate("Item")} <span className="text-red-500">*</span>
        </label>
        <Controller
          name="itemId"
          control={control}
          rules={{ required: translate("Item diperlukan") }}
          render={({ field }) => (
            <Select
              value={String(field.value || "")}
              onValueChange={(val) => field.onChange(Number(val))}
              disabled={!!editingAsset}
            >
              <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <SelectValue placeholder={translate("Select reusable item")} />
              </SelectTrigger>
              <SelectContent>
                {reusableItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.item_code ? `${item.item_code} — ${item.item_name}` : item.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.itemId && <p className="text-xs text-red-500">{errors.itemId.message}</p>}
        {editingAsset && <p className="text-xs text-gray-400">{translate("Item cannot be changed after creation")}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectForm name="current_status" control={control} label={translate("Status")} options={statusOptions} required errors={errors} />
        <SelectForm name="condition" control={control} label={translate("Condition")} options={conditionOptions} required errors={errors} />
      </div>

      <TextInputForm name="assigned_to" control={control} label={translate("Assigned To")} placeholder={translate("Person or department")} errors={errors} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{translate("Last Used Date")}</label>
        <Controller
          name="last_used_date"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          )}
        />
      </div>

      <TextInputForm name="notes" control={control} label={translate("Notes")} placeholder={translate("Optional")} errors={errors} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{translate("Cancel")}</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
          {isSubmitting ? translate("Saving...") : editingAsset ? translate("Update") : translate("Create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ManageInventoryAssets() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageInventoryAssets /> : <ManageInventoryAssetsDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function ManageInventoryAssetsDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage        = parseInt(searchParams.get("page") || "1");
  const urlStatus      = searchParams.get("status") || "all";
  const urlCondition   = searchParams.get("condition") || "all";
  const urlItemId      = searchParams.get("itemId") || "all";
  const urlSortField   = searchParams.get("sortField") || "";
  const urlSortOrder   = searchParams.get("sortOrder") || "";

  const [tempStatus, setTempStatus]       = useState(urlStatus);
  const [tempCondition, setTempCondition] = useState(urlCondition);
  const [tempItemId, setTempItemId]       = useState(urlItemId);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempStatus(urlStatus);
    setTempCondition(urlCondition);
    setTempItemId(urlItemId);
  }, [urlStatus, urlCondition, urlItemId]);

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingAsset, setEditingAsset]         = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete]       = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultAssetField,
  });

  const { itemsList: allItems } = useGetAllInventoryItems();
  const reusableItems = allItems.filter((i) => i.item_type === InventoryItemType.REUSABLE);

  const { assetsList, total, totalPages, isLoading } = useGetInventoryAssetsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
    filterCondition: urlCondition !== "all" ? urlCondition : undefined,
    filterItemId: urlItemId !== "all" ? Number(urlItemId) : undefined,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });

  const { createAsset, updateAsset, deleteAsset } = useInventoryAssetMutations();

  const handleSearch = () => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      np.set("page", "1");
      tempStatus !== "all" ? np.set("status", tempStatus) : np.delete("status");
      tempCondition !== "all" ? np.set("condition", tempCondition) : np.delete("condition");
      tempItemId !== "all" ? np.set("itemId", tempItemId) : np.delete("itemId");
      return np;
    });
  };

  const handleReset = () => {
    setTempStatus("all"); setTempCondition("all"); setTempItemId("all");
    setSearchParams((p) => { const np = new URLSearchParams(p); ["status","condition","itemId","page"].forEach((k) => np.delete(k)); return np; });
  };

  const handleSort = (field) => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      np.set("sortField", field);
      np.set("sortOrder", np.get("sortField") === field && np.get("sortOrder") === "ASC" ? "DESC" : "ASC");
      return np;
    });
  };

  const openAddDialog = () => { setEditingAsset(null); reset(defaultAssetField); setIsDialogOpen(true); };
  const openEditDialog = (asset) => {
    setEditingAsset(asset);
    reset({
      itemId: asset.itemId,
      current_status: asset.current_status,
      condition: asset.condition,
      assigned_to: asset.assigned_to ?? "",
      last_used_date: asset.last_used_date ? asset.last_used_date.slice(0, 10) : "",
      notes: asset.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      itemId: Number(data.itemId),
      assigned_to: data.assigned_to || null,
      last_used_date: data.last_used_date || null,
      notes: data.notes || undefined,
    };
    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, data: payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      await createAsset.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAsset.mutateAsync(assetToDelete.id);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (err) {
      // Backend throws CONFLICT if IN_USE — error already shown via showApiError in mutation
    }
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Assets"), page: "ManageInventoryAssets" },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Wrench className="w-6 h-6 text-purple-600" />
          {translate("Reusable Assets")}
        </h1>
        {hasAdminAccess && (
          <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add Asset")}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={tempItemId} onValueChange={setTempItemId}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
                <SelectValue placeholder={translate("All Items")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Items")}</SelectItem>
                {reusableItems.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tempStatus} onValueChange={setTempStatus}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
                <SelectValue placeholder={translate("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Status")}</SelectItem>
                {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tempCondition} onValueChange={setTempCondition}>
              <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
                <SelectValue placeholder={translate("Condition")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Conditions")}</SelectItem>
                {conditionOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">{translate("Search")}</Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">{translate("Reset")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Item")}</TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("current_status")}>
                  <span className="flex items-center justify-center">
                    {translate("Status")}
                    <SortIcon field="current_status" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("condition")}>
                  <span className="flex items-center justify-center">
                    {translate("Condition")}
                    <SortIcon field="condition" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead>{translate("Assigned To")}</TableHead>
                <TableHead>{translate("Notes")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : assetsList.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                assetsList.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.item?.item_name ?? "—"}</TableCell>
                    <TableCell className="text-center">{statusBadge(asset.current_status)}</TableCell>
                    <TableCell className="text-center">{conditionBadge(asset.condition)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {asset.assignedJenazah
                        ? (asset.assignedJenazah.name ?? `ID: ${asset.assignedJenazahId}`)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                      {asset.notes || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasAdminAccess && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(asset)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasAdminAccess && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={asset.current_status === InventoryAssetStatus.IN_USE}
                          title={asset.current_status === InventoryAssetStatus.IN_USE ? translate("Cannot delete asset currently in use") : undefined}
                          onClick={() => { setAssetToDelete(asset); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className={`w-4 h-4 ${asset.current_status === InventoryAssetStatus.IN_USE ? "text-gray-300" : "text-red-500"}`} />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{editingAsset ? translate("Edit Asset") : translate("Add Asset")}</DialogTitle>
            <DialogDescription>
              {editingAsset ? translate("Update asset details") : translate("Register a new reusable asset")}
            </DialogDescription>
          </DialogHeader>

          <AssetForm
            control={control}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            reusableItems={reusableItems}
            editingAsset={editingAsset}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title={translate("Delete Asset")}
          description={translate("This action cannot be undone.")}
          isDelete
          itemToDelete={assetToDelete?.asset_number}
        />
      )}
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileManageInventoryAssets() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage    = parseInt(searchParams.get("page") || "1");
  const urlAssetNum = searchParams.get("assetNum") || "";
  const [tempAssetNum, setTempAssetNum] = useState(urlAssetNum);
  const [itemsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingAsset, setEditingAsset]         = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete]       = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultAssetField,
  });

  const { itemsList: allItems } = useGetAllInventoryItems();
  const reusableItems = allItems.filter((i) => i.item_type === InventoryItemType.REUSABLE);

  const { assetsList, total, totalPages, isLoading } = useGetInventoryAssetsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterAssetNumber: urlAssetNum || undefined,
  });

  const { createAsset, updateAsset, deleteAsset } = useInventoryAssetMutations();

  const handleSearch = () => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); tempAssetNum ? n.set("assetNum", tempAssetNum) : n.delete("assetNum"); return n; });
  };
  const handleReset = () => {
    setTempAssetNum("");
    setSearchParams((p) => { const n = new URLSearchParams(p); ["assetNum","page"].forEach((k) => n.delete(k)); return n; });
  };

  const openAddDialog = () => { setEditingAsset(null); reset(defaultAssetField); setIsDialogOpen(true); };
  const openEditDialog = (asset) => {
    setEditingAsset(asset);
    reset({
      itemId: asset.itemId,
      current_status: asset.current_status,
      condition: asset.condition,
      assigned_to: asset.assigned_to ?? "",
      last_used_date: asset.last_used_date ? asset.last_used_date.slice(0, 10) : "",
      notes: asset.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      itemId: Number(data.itemId),
      assigned_to: data.assigned_to || null,
      last_used_date: data.last_used_date || null,
      notes: data.notes || undefined,
    };
    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, data: payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      await createAsset.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    await deleteAsset.mutateAsync(assetToDelete.id);
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory"), page: "InventoryDashboard" },
        { label: translate("Assets"), page: "ManageInventoryAssets" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          {translate("Assets")}
        </h1>
        {hasAdminAccess && (
          <Button size="sm" onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <SearchBar value={tempAssetNum} onChange={setTempAssetNum} onSearch={handleSearch} onReset={handleReset} placeholder={translate("Asset number")} buttonClassName="bg-purple-600 text-white" />

      {isLoading ? (
        <PageLoadingComponent />
      ) : assetsList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No assets found")}</p>
      ) : (
        <div className="space-y-2">
          {assetsList.map((asset) => (
            <Card key={asset.id} className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold font-mono text-gray-900 dark:text-white">{asset.asset_number}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{asset.item?.item_name ?? "—"}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {statusBadge(asset.current_status)}
                      {conditionBadge(asset.condition)}
                    </div>
                    {asset.assignedJenazah && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {translate("Assigned")}: {asset.assignedJenazah.name ?? `ID: ${asset.assignedJenazahId}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {hasAdminAccess && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(asset)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasAdminAccess && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={asset.current_status === InventoryAssetStatus.IN_USE}
                        onClick={() => { setAssetToDelete(asset); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className={`w-4 h-4 ${asset.current_status === InventoryAssetStatus.IN_USE ? "text-gray-300" : "text-red-500"}`} />
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
            <DialogTitle>{editingAsset ? translate("Edit Asset") : translate("Add Asset")}</DialogTitle>
          </DialogHeader>
          <AssetForm
            control={control}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            reusableItems={reusableItems}
            editingAsset={editingAsset}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} title={translate("Delete Asset")} description={translate("This action cannot be undone.")} isDelete itemToDelete={assetToDelete?.asset_number} />
      )}
    </div>
  );
}
