// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileManageMosques from "@/pages/Mobile/ManageMosques";
import { translate } from "@/utils/translations";
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  Save,
  ImageIcon,
  MapPin,
  Upload,
  Download,
  FileText,
} from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { showError, showSuccess } from "@/components/ToastrNotification";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import SearchBar from "@/components/forms/SearchBar";

import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { ACCEPTED_UPLOAD_TYPES, STATES_MY } from "@/utils/enums";
import { defaultMosqueTemplateHeaders } from "@/utils/defaulttemplateheader";
import { validateFields } from "@/utils/validations";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";

import {
  useGetMosquePaginated,
  useMosqueMutations,
} from "@/mutations/useMosqueMutations";

import { useGetOrganisationPaginated } from "@/mutations/useOrganisationMutations";
import { defaultMosqueField } from "@/utils/defaultformfields";
import { useForm } from "react-hook-form";
import CheckboxForm from "@/components/forms/CheckboxForm";

export default function ManageMosques() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileManageMosques />;
  return <ManageMosquesDesktop />;
}

function ManageMosquesDesktop() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    currentUserStates,
  } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("mosques");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("name") || "";
  const urlState = searchParams.get("state") || "";
  const urlCanArrangeFuneral = searchParams.get("canarrangefuneral") || "";
  const urlHasDeathCharity = searchParams.get("hasdeathcharity") || "";

  const [tempName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);
  const [tempCanArrangeFuneral, setTempCanArrangeFuneral] =
    useState(urlCanArrangeFuneral);
  const [tempHasDeathCharity, setTempHasDeathCharity] =
    useState(urlHasDeathCharity);

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
    setTempCanArrangeFuneral(urlCanArrangeFuneral);
    setTempHasDeathCharity(urlHasDeathCharity);
  }, [urlName, urlState, urlCanArrangeFuneral, urlHasDeathCharity]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMosque, setEditingMosque] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mosqueToDelete, setMosqueToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photoFileKey, setPhotoFileKey] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const downloadMosqueTemplate = () => {
    const csv = defaultMosqueTemplateHeaders.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mosques_template.csv";
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

      const res = await fetch("/api/upload/mosques/bulk", {
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
        showSuccess(`${count} ${translate("mosques imported successfully")}`);
      }

      setUploadDialogOpen(false);
      setUploadFile(null);
      refetchMosques();
    } catch (err) {
      console.error(err);
      showError(translate("Import failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: defaultMosqueField });

  const photourl = watch("photourl") || "";

  useEffect(() => {
    if (!photourl) {
      setPhotoUrlInput("");
      return;
    }

    if (/^https?:\/\//i.test(photourl)) {
      setPhotoUrlInput(photourl);
      return;
    }
    if (photoUrlInput && photourl !== photoUrlInput) {
      setPhotoUrlInput("");
    }
  }, [photourl, photoUrlInput]);

  const currentOrganisationId = currentUser?.organisation?.id ?? null;
  const isOrgScoped = !isSuperAdmin && !!currentOrganisationId;

  const {
    mosquesList,
    totalPages,
    isLoading,
    refetch: refetchMosques,
  } = useGetMosquePaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState,
    filterOrganisationId: isOrgScoped ? currentOrganisationId : undefined,
    filterCanArrangeFuneral: urlCanArrangeFuneral || undefined,
    filterHasDeathCharity: urlHasDeathCharity || undefined,
  });

  const { organisationsList, isLoading: orgLoading } =
    useGetOrganisationPaginated({});

  const { createMosque, updateMosque, deleteMosque } = useMosqueMutations();

  const tableItems = mosquesList.items;
  const tableLoading = isLoading;
  const effectiveTotal = mosquesList.total;
  const effectiveTotalPages = totalPages;

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      appendCurrentUserToFormData(formDataUpload);

      const res = await fetch("/api/upload/bucket-mosque", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return;
      }

      const data = await res.json();
      setValue("photourl", data.file_url);
      setPhotoUrlInput("");
      showSuccess(translate("Photo uploaded"));
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    const params = { page: "1" };
    if (tempName) params.name = tempName;
    if (tempState) params.state = tempState;
    if (tempCanArrangeFuneral) params.canarrangefuneral = tempCanArrangeFuneral;
    if (tempHasDeathCharity) params.hasdeathcharity = tempHasDeathCharity;
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempName("");
    setTempState("");
    setTempCanArrangeFuneral("");
    setTempHasDeathCharity("");
    setSearchParams({ page: "1" });
  };

  const openEditDialog = (mosque) => {
    setEditingMosque(mosque);
    reset({
      ...mosque,
      organisation: mosque.organisation?.id?.toString() ?? null,
      latitude: mosque.latitude?.toString() || "",
      longitude: mosque.longitude?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    const defaultOrganisation =
      currentOrganisationId ?? organisationsList?.items?.[0]?.id ?? "";
    setEditingMosque(null);
    reset({
      ...defaultMosqueField,
      organisation: defaultOrganisation ? String(defaultOrganisation) : "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const payload = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      organisation: formData.organisation
        ? { id: Number(formData.organisation) }
        : null,
    };

    try {
      if (editingMosque) {
        await updateMosque.mutateAsync({ id: editingMosque.id, data: payload });
      } else {
        await createMosque.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      reset(defaultMosqueField);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!mosqueToDelete) return;
    await deleteMosque.mutateAsync(mosqueToDelete.id);
    setDeleteDialogOpen(false);
    setMosqueToDelete(null);
  };

  if (loadingUser || permissionsLoading || orgLoading)
    return <PageLoadingComponent />;

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            {
              label: isSuperAdmin
                ? translate("Super Admin Dashboard")
                : translate("Admin Dashboard"),
              page: isSuperAdmin ? "SuperadminDashboard" : "AdminDashboard",
            },
            {
              label: translate("Manage Mosques"),
              page: "ManageMosques",
            },
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
          {
            label: isSuperAdmin
              ? translate("Super Admin Dashboard")
              : translate("Admin Dashboard"),
            page: isSuperAdmin ? "SuperadminDashboard" : "AdminDashboard",
          },
          {
            label: translate("Manage Mosques"),
            page: "ManageMosques",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Landmark className="w-6 h-6 text-stone-600" />
          {translate("Manage Mosques")}
        </h1>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setUploadFile(null);
                setUploadDialogOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {translate("Upload Mosque")}
            </Button>
            <Button
              onClick={openAddDialog}
              className="bg-stone-600 hover:bg-stone-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translate("Add Mosque")}
            </Button>
          </div>
        )}
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        buttonClassName="bg-stone-600 hover:bg-stone-700 text-white"
        filters={[
          {
            type: "text",
            key: "name",
            value: tempName,
            onChange: setTempName,
            label: translate("Name"),
          },
          {
            type: "select",
            key: "state",
            value: tempState,
            onChange: setTempState,
            label: translate("State"),
            options: STATES_MY.map((state) => ({ value: state, label: state })),
          },
          {
            type: "select",
            key: "canarrangefuneral",
            value: tempCanArrangeFuneral,
            onChange: setTempCanArrangeFuneral,
            label: translate("Can Arrange Funeral"),
            options: [
              { value: "true", label: translate("Yes") },
              { value: "false", label: translate("No") },
            ],
          },
          {
            type: "select",
            key: "hasdeathcharity",
            value: tempHasDeathCharity,
            onChange: setTempHasDeathCharity,
            label: translate("Has Death Charity"),
            options: [
              { value: "true", label: translate("Yes") },
              { value: "false", label: translate("No") },
            ],
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Mosque name")}</TableHead>
                <TableHead className="text-center">
                  {translate("PIC Name")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("State")}
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
              {tableLoading ? (
                <InlineLoadingComponent isTable colSpan={5} />
              ) : tableItems.length === 0 ? (
                <NoDataTableComponent colSpan={5} />
              ) : (
                tableItems.map((mosque) => (
                  <TableRow key={mosque.id}>
                    <TableCell className="font-medium">{mosque.name}</TableCell>
                    <TableCell className="text-center">
                      {mosque.picname}
                    </TableCell>
                    <TableCell className="text-center">
                      {mosque.state}
                    </TableCell>
                    <TableCell>
                      <img
                        src={resolveFileUrl(mosque.photourl, "bucket-mosque")}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        alt="photo"
                        className="w-12 h-10 object-cover rounded mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(mosque)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMosqueToDelete(mosque);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {effectiveTotalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={effectiveTotalPages}
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
            totalItems={effectiveTotal}
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
              {translate("Upload Mosques via CSV / Excel")}
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
                  ({defaultMosqueTemplateHeaders.length} {translate("columns")})
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadMosqueTemplate}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {translate("Download")}
              </Button>
            </div>

            <label
              htmlFor="mosque-file-upload"
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
                    ? "border-stone-400 bg-stone-50 dark:border-stone-500 dark:bg-stone-900/20"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-600 dark:hover:bg-stone-800"
              }`}
            >
              <input
                id="mosque-file-upload"
                type="file"
                accept={ACCEPTED_UPLOAD_TYPES}
                className="hidden"
                onChange={handleUploadFileDrop}
              />
              {uploadFile ? (
                <>
                  <FileText className="w-8 h-8 text-stone-500" />
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-stone-500">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMosque
                ? translate("Edit Mosque")
                : translate("Add Mosque")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm
              name="name"
              control={control}
              label={translate("Mosque name")}
              required
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
            <TextInputForm
              name="address"
              control={control}
              label={translate("Address")}
              isTextArea
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="email"
                control={control}
                label={translate("Email")}
              />
              <TextInputForm
                name="url"
                control={control}
                label={translate("Website / URL")}
              />
            </div>

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
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!navigator.geolocation) return;
                setIsLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setValue("latitude", pos.coords.latitude.toFixed(16));
                    setValue("longitude", pos.coords.longitude.toFixed(16));
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

            <SelectForm
              name="organisation"
              control={control}
              placeholder={translate("Select Organisation")}
              label={translate("Organisation")}
              options={(organisationsList?.items || []).map((org) => ({
                label: org.name,
                value: org.id,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="picname"
                control={control}
                label={translate("PIC Name")}
                required
                errors={errors}
              />
              <TextInputForm
                name="picphoneno"
                control={control}
                label={translate("PIC Phone No.")}
                required
                errors={errors}
              />
            </div>

            <CheckboxForm
              name="canarrangefuneral"
              control={control}
              label={translate("Can Arrange Funeral")}
            />

            <CheckboxForm
              name="hasdeathcharity"
              control={control}
              label={translate("Has Qariah & Death Charity")}
            />

            <div className="space-y-2">
              <Label>{translate("Photo")}</Label>
              <div className="flex items-center gap-3">
                <Input
                  key={photoFileKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                    <span>{translate("Uploading...")}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-stone-500 dark:text-slate-400">
                  {translate("Or paste image URL")}
                </Label>
                <Input
                  type="url"
                  placeholder="https://"
                  value={photoUrlInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPhotoUrlInput(value);
                    setValue("photourl", value);
                    if (value) {
                      setPhotoFileKey((prev) => prev + 1);
                    }
                  }}
                />
              </div>

              {photourl && (
                <div className="mt-3 relative w-40 h-40 group">
                  <img
                    src={
                      photoUrlInput
                        ? photoUrlInput
                        : resolveFileUrl(photourl, "bucket-mosque")
                    }
                    alt="Mosque preview"
                    className="w-full h-full object-cover rounded-lg border-2 border-stone-100 dark:border-slate-700 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <ImageIcon className="text-white w-8 h-8" />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Close")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || uploading}
                className="bg-stone-600 hover:bg-stone-700 min-w-[100px]"
              >
                {isSubmitting ? (
                  <InlineLoadingComponent />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> {translate("Save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Mosque")}
        description={`${translate("Delete")} "${mosqueToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
