// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
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
  useGetInventoryItemsPaginated,
  useInventoryItemMutations,
} from "@/hooks/useInventoryMutations";
import { useForm } from "react-hook-form";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryUnitType,
} from "@/utils/enums";

const defaultItemField = {
  item_code: "",
  item_name: "",
  category: InventoryItemCategory.KAFAN,
  item_type: InventoryItemType.ONE_TIME,
  unit_type: InventoryUnitType.PCS,
  description: "",
  current_quantity: 0,
  minimum_level: 0,
  maximum_level: null,
  unit_cost: null,
};

const categoryOptions = Object.values(InventoryItemCategory).map((v) => ({ value: v, label: v }));
const itemTypeOptions = [
  { value: InventoryItemType.ONE_TIME,  label: translate("Consumable") },
  { value: InventoryItemType.REUSABLE,  label: translate("Reusable")   },
];
const unitTypeOptions = Object.values(InventoryUnitType).map((v) => ({ value: v, label: v.toUpperCase() }));

function statusBadge(status) {
  switch (status) {
    case InventoryItemStatus.AVAILABLE:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{translate("Available")}</span>;
    case InventoryItemStatus.LOW_STOCK:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{translate("Low Stock")}</span>;
    case InventoryItemStatus.OUT_OF_STOCK:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{translate("Out of Stock")}</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{status}</span>;
  }
}

function SortIcon({ field, current, order }) {
  if (current !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "ASC"
    ? <ChevronUp className="ml-1 h-3 w-3" />
    : <ChevronDown className="ml-1 h-3 w-3" />;
}

export default function ManageInventoryItems() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageInventoryItems /> : <ManageInventoryItemsDesktop />;
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function ManageInventoryItemsDesktop() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("inventory-items");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage       = parseInt(searchParams.get("page") || "1");
  const urlName       = searchParams.get("name") || "";
  const urlCategory   = searchParams.get("category") || "all";
  const urlType       = searchParams.get("type") || "all";
  const urlStatus     = searchParams.get("status") || "all";
  const urlSortField  = searchParams.get("sortField") || "";
  const urlSortOrder  = searchParams.get("sortOrder") || "";

  const [tempName, setTempName]         = useState(urlName);
  const [tempCategory, setTempCategory] = useState(urlCategory);
  const [tempType, setTempType]         = useState(urlType);
  const [tempStatus, setTempStatus]     = useState(urlStatus);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempName(urlName);
    setTempCategory(urlCategory);
    setTempType(urlType);
    setTempStatus(urlStatus);
  }, [urlName, urlCategory, urlType, urlStatus]);

  const [isDialogOpen, setIsDialogOpen]       = useState(false);
  const [editingItem, setEditingItem]         = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultItemField,
  });

  const { itemsList, total, totalPages, isLoading } = useGetInventoryItemsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName || undefined,
    filterCategory: urlCategory !== "all" ? urlCategory : undefined,
    filterType: urlType !== "all" ? urlType : undefined,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
    sortField: urlSortField || undefined,
    sortOrder: urlSortOrder || undefined,
  });

  const { createItem, updateItem, deleteItem } = useInventoryItemMutations();

  const handleSearch = () => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      np.set("page", "1");
      tempName     ? np.set("name", tempName)         : np.delete("name");
      tempCategory !== "all" ? np.set("category", tempCategory) : np.delete("category");
      tempType     !== "all" ? np.set("type", tempType)         : np.delete("type");
      tempStatus   !== "all" ? np.set("status", tempStatus)     : np.delete("status");
      return np;
    });
  };

  const handleReset = () => {
    setTempName(""); setTempCategory("all"); setTempType("all"); setTempStatus("all");
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      ["name","category","type","status","page"].forEach((k) => np.delete(k));
      return np;
    });
  };

  const handleSort = (field) => {
    setSearchParams((p) => {
      const np = new URLSearchParams(p);
      const currentField = np.get("sortField");
      const currentOrder = np.get("sortOrder");
      if (currentField === field) {
        np.set("sortOrder", currentOrder === "ASC" ? "DESC" : "ASC");
      } else {
        np.set("sortField", field);
        np.set("sortOrder", "DESC");
      }
      return np;
    });
  };

  const openAddDialog = () => {
    setEditingItem(null);
    reset(defaultItemField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    reset({
      item_code: item.item_code ?? "",
      item_name: item.item_name,
      category: item.category,
      item_type: item.item_type,
      unit_type: item.unit_type,
      description: item.description ?? "",
      current_quantity: item.current_quantity,
      minimum_level: item.minimum_level,
      maximum_level: item.maximum_level ?? null,
      unit_cost: item.unit_cost ?? null,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      current_quantity: Number(data.current_quantity),
      minimum_level: Number(data.minimum_level),
      maximum_level: data.maximum_level !== null && data.maximum_level !== "" ? Number(data.maximum_level) : null,
      unit_cost: data.unit_cost !== null && data.unit_cost !== "" ? Number(data.unit_cost) : null,
      item_code: data.item_code || undefined,
      description: data.description || undefined,
    };

    if (editingItem) {
      await updateItem.mutateAsync(
        { id: editingItem.id, data: payload },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      await createItem.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Inventory Items"), page: "ManageInventoryItems" },
      ]} />
      <AccessDeniedComponent />
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Inventory Items"), page: "ManageInventoryItems" },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Package className="w-6 h-6 text-blue-600" />
          {translate("Inventory Items")}
        </h1>
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add Item")}
          </Button>
        )}
      </div>

      <SearchBar
        value={tempName}
        onChange={setTempName}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder={translate("Item name or code")}
        buttonClassName="bg-blue-600 text-white"
        filtersClassName="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <Select value={tempCategory} onValueChange={setTempCategory}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Categories")}</SelectItem>
            {categoryOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tempType} onValueChange={setTempType}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Types")}</SelectItem>
            {itemTypeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tempStatus} onValueChange={setTempStatus}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("All Status")}</SelectItem>
            <SelectItem value={InventoryItemStatus.AVAILABLE}>{translate("Available")}</SelectItem>
            <SelectItem value={InventoryItemStatus.LOW_STOCK}>{translate("Low Stock")}</SelectItem>
            <SelectItem value={InventoryItemStatus.OUT_OF_STOCK}>{translate("Out of Stock")}</SelectItem>
          </SelectContent>
        </Select>
      </SearchBar>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("item_name")}>
                  <span className="flex items-center">
                    {translate("Item Name")}
                    <SortIcon field="item_name" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead>{translate("Code")}</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("category")}>
                  <span className="flex items-center">
                    {translate("Category")}
                    <SortIcon field="category" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead>{translate("Type")}</TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("current_quantity")}>
                  <span className="flex items-center justify-end">
                    {translate("Qty")}
                    <SortIcon field="current_quantity" current={urlSortField} order={urlSortOrder} />
                  </span>
                </TableHead>
                <TableHead className="text-right">{translate("Min")}</TableHead>
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
                <InlineLoadingComponent isTable colSpan={8} />
              ) : itemsList.length === 0 ? (
                <NoDataTableComponent colSpan={8} />
              ) : (
                itemsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{item.item_code || "—"}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.item_type === InventoryItemType.REUSABLE
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      }`}>
                        {item.item_type === InventoryItemType.REUSABLE ? translate("Reusable") : translate("Consumable")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.current_quantity} {item.unit_type}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500">{item.minimum_level}</TableCell>
                    <TableCell className="text-center">{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                        >
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? translate("Edit Item") : translate("Add Item")}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? translate("Update inventory item details") : translate("Add a new inventory item")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <SelectForm
                name="unit_type"
                control={control}
                label={translate("Unit")}
                options={unitTypeOptions}
                required
                errors={errors}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInputForm
                name="current_quantity"
                control={control}
                label={translate("Current Quantity")}
                isNumber
                required
                errors={errors}
              />
              <TextInputForm
                name="minimum_level"
                control={control}
                label={translate("Minimum Level")}
                isNumber
                required
                errors={errors}
              />
              <TextInputForm
                name="maximum_level"
                control={control}
                label={translate("Maximum Level")}
                isNumber
                placeholder={translate("Optional")}
                errors={errors}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInputForm
                name="unit_cost"
                control={control}
                label={translate("Unit Cost (RM)")}
                isNumber
                placeholder={translate("Optional")}
                errors={errors}
              />
              <TextInputForm
                name="description"
                control={control}
                label={translate("Description")}
                placeholder={translate("Optional")}
                errors={errors}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? translate("Saving...") : editingItem ? translate("Update") : translate("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
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
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileManageInventoryItems() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("inventory-items");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage  = parseInt(searchParams.get("page") || "1");
  const urlName  = searchParams.get("name") || "";

  const [tempName, setTempName] = useState(urlName);
  const [itemsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen]         = useState(false);
  const [editingItem, setEditingItem]           = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete]         = useState(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultItemField,
  });

  const { itemsList, total, totalPages, isLoading } = useGetInventoryItemsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName || undefined,
  });

  const { createItem, updateItem, deleteItem } = useInventoryItemMutations();

  const handleSearch = () => {
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set("page","1"); tempName ? n.set("name", tempName) : n.delete("name"); return n; });
  };

  const handleReset = () => {
    setTempName("");
    setSearchParams((p) => { const n = new URLSearchParams(p); ["name","page"].forEach((k) => n.delete(k)); return n; });
  };

  const openAddDialog = () => { setEditingItem(null); reset(defaultItemField); setIsDialogOpen(true); };
  const openEditDialog = (item) => {
    setEditingItem(item);
    reset({ item_code: item.item_code ?? "", item_name: item.item_name, category: item.category, item_type: item.item_type, unit_type: item.unit_type, description: item.description ?? "", current_quantity: item.current_quantity, minimum_level: item.minimum_level, maximum_level: item.maximum_level ?? null, unit_cost: item.unit_cost ?? null });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = { ...data, current_quantity: Number(data.current_quantity), minimum_level: Number(data.minimum_level), maximum_level: data.maximum_level !== null && data.maximum_level !== "" ? Number(data.maximum_level) : null, unit_cost: data.unit_cost !== null && data.unit_cost !== "" ? Number(data.unit_cost) : null, item_code: data.item_code || undefined, description: data.description || undefined };
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data: payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      await createItem.mutateAsync(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4 p-4">
      <Breadcrumb items={[
        { label: translate("Inventory Dashboard"), page: "InventoryDashboard" },
        { label: translate("Items"), page: "ManageInventoryItems" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          {translate("Inventory Items")}
        </h1>
        {canCreate && (
          <Button size="sm" onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <SearchBar value={tempName} onChange={setTempName} onSearch={handleSearch} onReset={handleReset} placeholder={translate("Search item")} buttonClassName="bg-blue-600 text-white" />

      {isLoading ? (
        <PageLoadingComponent />
      ) : itemsList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{translate("No items found")}</p>
      ) : (
        <div className="space-y-2">
          {itemsList.map((item) => (
            <Card key={item.id} className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.item_code || "—"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {statusBadge(item.status)}
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{item.current_quantity} {item.unit_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}>
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

      <Pagination
        currentPage={urlPage}
        totalPages={totalPages}
        onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(p)); return n; })}
        itemsPerPage={itemsPerPage}
        totalItems={total}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{editingItem ? translate("Edit Item") : translate("Add Item")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm name="item_name" control={control} label={translate("Item Name")} required errors={errors} />
            <TextInputForm name="item_code" control={control} label={translate("Item Code")} placeholder={translate("Optional")} errors={errors} />
            <SelectForm name="category" control={control} label={translate("Category")} options={categoryOptions} required errors={errors} />
            <SelectForm name="item_type" control={control} label={translate("Type")} options={itemTypeOptions} required errors={errors} />
            <SelectForm name="unit_type" control={control} label={translate("Unit")} options={unitTypeOptions} required errors={errors} />
            <TextInputForm name="current_quantity" control={control} label={translate("Current Quantity")} isNumber required errors={errors} />
            <TextInputForm name="minimum_level" control={control} label={translate("Minimum Level")} isNumber required errors={errors} />
            <TextInputForm name="description" control={control} label={translate("Description")} placeholder={translate("Optional")} errors={errors} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate("Cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? translate("Saving...") : editingItem ? translate("Update") : translate("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} title={translate("Delete Item")} description={translate("This action cannot be undone.")} isDelete itemToDelete={itemToDelete?.item_name} />
      )}
    </div>
  );
}
