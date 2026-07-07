// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useCallback, useEffect, useState } from "react";
import MobileManageGraves from "@/pages/Mobile/ManageGraves";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  QrCode,
  Upload,
  Download,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import Breadcrumb from "@/components/Breadcrumb";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { showSuccess, showError } from "@/components/ToastrNotification";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { ACCEPTED_UPLOAD_TYPES, GraveStatus, STATES_MY } from "@/utils/enums";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetGravePaginated,
  useGraveMutations,
} from "@/hooks/useGraveMutations";
import { trpc } from "@/utils/trpc";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import QRCodeDialog from "@/components/QRCodeDialog";
import { defaultGraveField } from "@/utils/defaultformfields";
import { defaultGraveFilter } from "@/utils/defaultfilter";
import { defaultGraveTemplateHeaders } from "@/utils/defaulttemplateheader";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useForm } from "react-hook-form";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import MapLocationPicker from "@/components/MapLocationPicker";

export default function ManageGraves() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageGraves /> : <ManageGravesDesktop />;
}

function ManageGravesDesktop() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    currentUserStates,
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("name") || "";
  const urlBlock = searchParams.get("block") || "";
  const urlLot = searchParams.get("lot") || "";
  const urlState = searchParams.get("state") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlSortField = searchParams.get("sortField") || "";
  const urlSortOrder = searchParams.get("sortOrder") || "";

  const [tempName, setTempName] = useState(urlName);
  const [tempBlock, setTempBlock] = useState(urlBlock);
  const [tempLot, setTempLot] = useState(urlLot);
  const [tempState, setTempState] = useState(urlState);
  const [tempStatus, setTempStatus] = useState(urlStatus);

  useEffect(() => {
    setTempName(urlName);
    setTempBlock(urlBlock);
    setTempLot(urlLot);
    setTempState(urlState);
    setTempStatus(urlStatus);
  }, [urlName, urlBlock, urlLot, urlState, urlStatus]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultGraveField,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrGrave, setQRGrave] = useState({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const downloadGraveTemplate = () => {
    const csv = defaultGraveTemplateHeaders.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "graves_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadFileDrop = (e) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer?.files?.[0] ?? e.target?.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      showError(translate("Only CSV and Excel files are accepted"));
      return;
    }
    setUploadFile(file);
  };

  const handleSaveUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const token =
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/upload/graves/bulk", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.error || translate("Import failed"));
        return;
      }

      const { count, errors } = data;
      if (errors?.length > 0) {
        showError(
          `${count} ${translate("records imported")}, ${errors.length} ${translate("rows skipped")}: ${errors.slice(0, 3).join("; ")}`,
        );
      } else {
        showSuccess(`${count} ${translate("graves imported successfully")}`);
      }

      setUploadDialogOpen(false);
      setUploadFile(null);
      refetchGraves();
    } catch (err) {
      console.error(err);
      showError(translate("Import failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("graves");

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    {
      enabled:
        !!currentUser && !!currentUser?.organisation?.id && !isSuperAdmin,
    },
  );

  useEffect(() => {
    if (parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery.data);
    }
  }, [parentAndChildQuery.data]);

  const {
    gravesList,
    totalPages,
    isLoading,
    refetch: refetchGraves,
  } = useGetGravePaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState || undefined,
    filterStatus: urlStatus || undefined,
    filterBlock: urlBlock || undefined,
    filterLot: urlLot || undefined,
    organisationIds: accessibleOrgIds,
    sortField: urlSortField || undefined,
    sortOrder:
      urlSortOrder === "ASC" || urlSortOrder === "DESC"
        ? urlSortOrder
        : undefined,
  });

  const handleSort = (field) => {
    const newOrder =
      urlSortField === field && urlSortOrder === "ASC" ? "DESC" : "ASC";
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1",
      sortField: field,
      sortOrder: newOrder,
    });
  };

  const SortIcon = ({ field }) => {
    if (urlSortField !== field)
      return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return urlSortOrder === "ASC" ? (
      <ChevronUp className="w-3 h-3 ml-1 text-emerald-500" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 text-emerald-500" />
    );
  };

  const { organisationsList } = useGetOrganisationPaginated({});

  const { createGrave, updateGrave, deleteGrave, bulkDeleteGraves } =
    useGraveMutations();

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const allPageIds = gravesList.items.map((g) => g.id);
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const someSelected = allPageIds.some((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const confirmBulkDelete = async () => {
    await bulkDeleteGraves.mutateAsync(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setBulkDeleteDialogOpen(false);
      },
    });
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      appendCurrentUserToFormData(formDataUpload);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    const params = { ...defaultGraveFilter };
    if (tempName) params.name = tempName;
    if (tempBlock) params.block = tempBlock;
    if (tempLot) params.lot = tempLot;
    if (tempState) params.state = tempState;
    if (tempStatus) params.status = tempStatus;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingGrave(null);
    const defaultOrgId = currentUser?.organisation?.id;
    reset({
      ...defaultGraveField,
      organisation: defaultOrgId ? String(defaultOrgId) : "",
    });
    setShowMap(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    reset({
      ...grave,
      organisation: grave.organisation?.id?.toString() ?? "",
      status: grave.status ?? GraveStatus.ACTIVE,
      totalgraves: grave.totalgraves ?? 0,
      photourl: grave.photourl ?? "",
    });
    setShowMap(false);
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : "",
      longitude: formData.longitude ? parseFloat(formData.longitude) : "",
      organisation: formData.organisation
        ? { id: Number(formData.organisation) }
        : null,
      totalgraves: Number(formData.totalgraves) || 0,
    };

    if (editingGrave) {
      await updateGrave.mutateAsync(
        { id: editingGrave.id, data: submitData },
        {
          onSuccess: () => setIsDialogOpen(false),
        },
      );
    } else {
      await createGrave.mutateAsync(submitData, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const confirmDelete = async () => {
    if (!graveToDelete) return;
    await deleteGrave.mutateAsync(graveToDelete.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            { label: translate("Manage Cemetery"), page: "ManageGraves" },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Manage Cemetery"), page: "ManageGraves" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate("Manage Cemetery")}
        </h1>
        <div className="flex items-center gap-2">
          {canDelete && selectedIds.length > 0 && (
            <Button
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {translate("Delete")} ({selectedIds.length})
            </Button>
          )}
          {canCreate && (
            <>
              <Button
                onClick={() => {
                  setUploadFile(null);
                  setUploadDialogOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {translate("Upload New")}
              </Button>
              <Button
                onClick={openAddDialog}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {translate("Add Cemetery")}
              </Button>
            </>
          )}
        </div>
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        buttonClassName="bg-emerald-600 text-white"
        filters={[
          {
            type: "text",
            key: "name",
            value: tempName,
            onChange: setTempName,
            label: translate("Cemetery Name"),
          },
          {
            type: "select",
            key: "state",
            show: isSuperAdmin,
            value: tempState,
            onChange: setTempState,
            label: "Negeri",
            options: STATES_MY.map((state) => ({ value: state, label: state })),
          },
          {
            type: "select",
            key: "status",
            value: tempStatus,
            onChange: setTempStatus,
            label: "Status",
            options: [
              { value: "active", label: translate("Active") },
              { value: "full", label: translate("Full") },
              { value: "maintenance", label: translate("Maintenance") },
            ],
          },
          {
            type: "text",
            key: "block",
            value: tempBlock,
            onChange: setTempBlock,
            label: translate("Block"),
          },
          {
            type: "text",
            key: "lot",
            value: tempLot,
            onChange: setTempLot,
            label: translate("Lot"),
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {canDelete && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center">
                    {translate("Cemetery Name")}
                    <SortIcon field="name" />
                  </span>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none"
                  onClick={() => handleSort("totalgraves")}
                >
                  <span className="flex items-center justify-center">
                    {translate("Total Graves")}
                    <SortIcon field="totalgraves" />
                  </span>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none"
                  onClick={() => handleSort("state")}
                >
                  <span className="flex items-center justify-center">
                    {translate("State")}
                    <SortIcon field="state" />
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  {translate("Block")}/{translate("Lot")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none"
                  onClick={() => handleSort("status")}
                >
                  <span className="flex items-center justify-center">
                    {translate("Status")}
                    <SortIcon field="status" />
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  {translate("Image")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={7} />
              ) : gravesList.items.length === 0 ? (
                <NoDataTableComponent colSpan={7} />
              ) : (
                gravesList.items.map((grave) => (
                  <TableRow key={grave.id}>
                    {canDelete && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(grave.id)}
                          onCheckedChange={() => toggleSelectOne(grave.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{grave.name}</TableCell>
                    <TableCell className="text-center">
                      {grave.totalgraves}
                    </TableCell>
                    <TableCell className="text-center">{grave.state}</TableCell>
                    <TableCell className="text-center">
                      {grave.block && `${translate("block")} ${grave.block}`}
                      {grave.block && grave.lot && ", "}
                      {grave.lot && `${translate("lot")} ${grave.lot}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          grave.status === "active" ? "default" : "secondary"
                        }
                      >
                        {translate(
                          grave.status.charAt(0).toUpperCase() +
                            grave.status.slice(1),
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {grave.photourl ? (
                        <img
                          src={resolveFileUrl(grave.photourl, "bucket-grave")}
                          alt="photo"
                          referrerPolicy="no-referrer"
                          className="w-12 h-10 object-cover rounded mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.3";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-10 rounded mx-auto bg-slate-100 dark:bg-slate-700" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(grave)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGraveToDelete(grave);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQRGrave({ type: "grave", id: grave.id });
                          setQRDialogOpen(true);
                        }}
                      >
                        <QrCode className="w-4 h-4 text-green-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: p.toString(),
              })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
            }}
            totalItems={gravesList.total}
          />
        )}
      </Card>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setUploadFile(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {translate("Upload Cemetery via CSV / Excel")}
            </DialogTitle>
            <DialogDescription>
              {translate(
                "Download the template, fill in the data, then upload the file.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
              <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <FileText className="w-4 h-4 text-stone-400" />
                <span className="font-medium">{translate("CSV Template")}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  ({defaultGraveTemplateHeaders.length} {translate("columns")})
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadGraveTemplate}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {translate("Download")}
              </Button>
            </div>

            <label
              htmlFor="grave-file-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setUploadDragOver(true);
              }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleUploadFileDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors p-8 ${
                uploadDragOver
                  ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/20"
                  : uploadFile
                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-600 dark:hover:bg-stone-800"
              }`}
            >
              <input
                id="grave-file-upload"
                type="file"
                accept={ACCEPTED_UPLOAD_TYPES}
                className="hidden"
                onChange={handleUploadFileDrop}
              />
              {uploadFile ? (
                <>
                  <FileText className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-emerald-500">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setUploadFile(null);
                    }}
                    className="text-xs text-stone-400 hover:text-stone-600 underline mt-1 dark:text-stone-500 dark:hover:text-stone-300"
                  >
                    {translate("Remove")}
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-stone-300" />
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
                    {translate("Click or drag & drop your file here")}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    .csv, .xlsx, .xls
                  </p>
                </>
              )}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isUploading}
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
              }}
            >
              {translate("Cancel")}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!uploadFile || isUploading}
              onClick={handleSaveUpload}
            >
              <Save className="w-4 h-4 mr-2" />
              {isUploading ? translate("Importing...") : translate("Import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingGrave
                ? translate("Edit Cemetery")
                : translate("Add Cemetery")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
              {translate("Cemetery Details")}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="name"
                    control={control}
                    label={translate("Name")}
                    required
                    errors={errors}
                  />
                  <SelectForm
                    name="state"
                    control={control}
                    label={translate("State")}
                    placeholder={translate("Select states")}
                    options={isSuperAdmin ? STATES_MY : currentUserStates || []}
                    required
                    errors={errors}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="block"
                    control={control}
                    label={translate("Block")}
                  />
                  <TextInputForm
                    name="lot"
                    control={control}
                    label={translate("Lot")}
                  />
                </div>
                <TextInputForm
                  name="address"
                  control={control}
                  label={translate("Address")}
                  isTextArea
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="latitude"
                    control={control}
                    label={translate("Latitude")}
                    isNumber
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="longitude"
                    control={control}
                    label={translate("Longitude")}
                    isNumber
                    required
                    errors={errors}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-emerald-600 text-white"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      setIsLocating(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setValue("latitude", pos.coords.latitude.toFixed(6));
                          setValue(
                            "longitude",
                            pos.coords.longitude.toFixed(6),
                          );
                          setIsLocating(false);
                        },
                        () => {
                          setIsLocating(false);
                        },
                      );
                    }}
                    disabled={isLocating}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {isLocating
                      ? translate("Getting location...")
                      : translate("Get Current Location")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowMap((v) => !v)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {showMap ? translate("Hide Map") : translate("Pick on Map")}
                  </Button>
                </div>
                {showMap && (
                  <MapLocationPicker
                    lat={watch("latitude")}
                    lng={watch("longitude")}
                    onChange={(lat, lng) => {
                      setValue("latitude", lat.toFixed(6));
                      setValue("longitude", lng.toFixed(6));
                    }}
                    placeholder={translate("Search location...")}
                  />
                )}
              </div>

              <div className="space-y-4 border-l pl-6 dark:border-slate-600">
                <SelectForm
                  name="organisation"
                  control={control}
                  placeholder={translate("Select Organisation")}
                  label={translate("Managing Organisation")}
                  options={organisationsList.items.map((org) => ({
                    value: org.id,
                    label: org.name,
                  }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="picname"
                    control={control}
                    label={translate("PIC Name")}
                  />
                  <TextInputForm
                    name="picphoneno"
                    control={control}
                    label={translate("PIC Phone No.")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TextInputForm
                      name="totalgraves"
                      control={control}
                      label={translate("Total Graves")}
                      isNumber
                      errors={errors}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {translate("Number of graves in this cemetery")}
                    </p>
                  </div>
                  <SelectForm
                    name="status"
                    control={control}
                    label={translate("Status")}
                    placeholder={translate("Select Status")}
                    options={Object.values(GraveStatus).map((status) => ({
                      value: status,
                      label: translate(
                        status.charAt(0).toUpperCase() + status.slice(1),
                      ),
                    }))}
                    required
                    errors={errors}
                  />
                </div>
                <FileUploadForm
                  name="photourl"
                  control={control}
                  label={translate("Photo")}
                  errors={errors}
                  bucketName="bucket-grave"
                  uploading={uploading}
                  handleFileUpload={handleFileUpload}
                  translate={translate}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Close")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  isSubmitting ||
                  uploading ||
                  createGrave.isPending ||
                  updateGrave.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" /> {translate("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={translate("Delete Grave")}
        description={`${translate("Delete")} "${graveToDelete?.name}"?`}
        variant="destructive"
      />
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title={translate("Delete Graves")}
        description={`${translate("Delete")} ${selectedIds.length} ${translate("selected graves")}?`}
        variant="destructive"
      />
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrGrave}
      />
    </div>
  );
}
