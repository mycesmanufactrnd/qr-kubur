// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Navigation,
  MapPin,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/Forms/TextInputForm.jsx";
import SelectForm from "@/components/Forms/SelectForm";
import CheckboxForm from "@/components/Forms/CheckboxForm";
import FileUploadForm from "@/components/Forms/FileUploadForm";
import { translate } from "@/utils/translations";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { STATES_MY } from "@/utils/enums";
import {
  useGetMosquePaginated,
  useMosqueMutations,
  useGetMosquesByOrganisationId,
} from "@/hooks/useMosqueMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { defaultMosqueField } from "@/utils/defaultformfields";

// ─── Mosque card ──────────────────────────────────────────────────────────────

function MosqueCard({ mosque, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {mosque.photourl && (
        <img
          src={resolveFileUrl(mosque.photourl, "bucket-mosque")}
          alt={mosque.name}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {mosque.name}
          </p>
          {mosque.state && (
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-0.5">
              {mosque.state}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {mosque.picname && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {mosque.picname}
            </span>
          )}
          {mosque.picphoneno && (
            <span>{mosque.picphoneno}</span>
          )}
        </div>

        {(mosque.canarrangefuneral || mosque.hasdeathcharity) && (
          <div className="flex flex-wrap gap-1.5">
            {mosque.canarrangefuneral && (
              <span className="text-xs bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 rounded-lg px-2 py-0.5">
                {translate("Can Arrange Funeral")}
              </span>
            )}
            {mosque.hasdeathcharity && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg px-2 py-0.5">
                {translate("Has Death Charity")}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <button
              onClick={() => onEdit(mosque)}
              className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(mosque)}
              className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {translate("Delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Form sheet ───────────────────────────────────────────────────────────────

function MosqueFormSheet({
  editing,
  onClose,
  onSubmit,
  isSubmitting,
  uploading,
  handleFileUpload,
  isSuperAdmin,
  currentUserStates,
  orgOptions,
}) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          organisation: editing.organisation?.id?.toString() ?? null,
          latitude: editing.latitude?.toString() || "",
          longitude: editing.longitude?.toString() || "",
        }
      : defaultMosqueField,
  });

  const [isLocating, setIsLocating] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude.toFixed(16));
        setValue("longitude", pos.coords.longitude.toFixed(16));
        setIsLocating(false);
      },
      () => setIsLocating(false),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {editing ? translate("Edit Mosque") : translate("Add Mosque")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <TextInputForm
          name="name"
          control={control}
          label={translate("Mosque name")}
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
        <TextInputForm
          name="address"
          control={control}
          label={translate("Address")}
          isTextArea
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm name="email" control={control} label={translate("Email")} isEmail />
          <TextInputForm name="url" control={control} label={translate("Website / URL")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
        <button
          type="button"
          onClick={getLocation}
          disabled={isLocating}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 active:opacity-70 disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {isLocating ? translate("Getting location...") : translate("Get Current Location")}
        </button>
        <SelectForm
          name="organisation"
          control={control}
          label={translate("Organisation")}
          placeholder={translate("Select Organisation")}
          options={orgOptions}
        />
        <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-2">
          <CheckboxForm name="canarrangefuneral" control={control} label={translate("Can Arrange Funeral")} />
          <CheckboxForm name="hasdeathcharity" control={control} label={translate("Has Death Charity")} />
        </div>
        <FileUploadForm
          name="photourl"
          control={control}
          label={translate("Photo")}
          bucketName="bucket-mosque"
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          translate={translate}
        />
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || uploading}
          className="w-full h-12 rounded-2xl bg-stone-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MobileManageMosques() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    currentUserStates,
  } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("mosques");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedName, setAppliedName] = useState("");
  const [appliedState, setAppliedState] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingMosque, setEditingMosque] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mosqueToDelete, setMosqueToDelete] = useState(null);

  const currentOrganisationId = currentUser?.organisation?.id ?? null;
  const isOrgScoped = !isSuperAdmin && !!currentOrganisationId;

  const { mosquesList, totalPages, isLoading } = useGetMosquePaginated({
    page,
    pageSize: itemsPerPage,
    filterName: appliedName,
    filterState: appliedState === "all" ? undefined : appliedState,
  });

  const { data: mosquesByOrganisation = [], isLoading: loadingOrgMosques } =
    useGetMosquesByOrganisationId(isOrgScoped ? currentOrganisationId : null);

  const { organisationsList, isLoading: orgLoading } = useGetOrganisationPaginated({});

  const { createMosque, updateMosque, deleteMosque } = useMosqueMutations();

  // Client-side filter + pagination for org-scoped users
  const normalizedSearch = appliedName.trim().toLowerCase();
  const filteredOrgMosques = isOrgScoped
    ? (mosquesByOrganisation || []).filter((m) => {
        const matchesName = normalizedSearch
          ? (m?.name || "").toLowerCase().includes(normalizedSearch)
          : true;
        const matchesState = appliedState === "all" ? true : m?.state === appliedState;
        return matchesName && matchesState;
      })
    : [];

  const effectiveTotalPages = isOrgScoped
    ? Math.max(1, Math.ceil(filteredOrgMosques.length / itemsPerPage))
    : totalPages;

  const effectiveTotalItems = isOrgScoped ? filteredOrgMosques.length : mosquesList.total;

  const pagedOrgMosques = isOrgScoped
    ? filteredOrgMosques.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : [];

  const listItems = isOrgScoped ? pagedOrgMosques : mosquesList.items;
  const listLoading = isOrgScoped ? loadingOrgMosques : isLoading;

  useEffect(() => {
    const open = formOpen || deleteDialogOpen;
    document.body.style.overflow = open ? "hidden" : "";
    document.body.style.touchAction = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [formOpen, deleteDialogOpen]);

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      appendCurrentUserToFormData(fd);
      const res = await fetch(`/api/upload/${bucketName}`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showError(d.error || translate("Failed to upload photo"));
        return null;
      }
      const data = await res.json();
      showSuccess(translate("Photo uploaded"));
      return data.file_url;
    } catch {
      showError(translate("Failed to upload photo"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingMosque(null);
    setFormOpen(true);
  };

  const openEdit = (mosque) => {
    setEditingMosque(mosque);
    setFormOpen(true);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
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
      setFormOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!mosqueToDelete) return;
    await deleteMosque.mutateAsync(mosqueToDelete.id);
    setDeleteDialogOpen(false);
    setMosqueToDelete(null);
  };

  const orgOptions = (organisationsList?.items || []).map((o) => ({
    value: o.id,
    label: o.name,
  }));

  if (loadingUser || permissionsLoading || orgLoading) return <LoadingUser />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6 dark:bg-slate-900">
        <BackNavigation title={translate("Manage Mosques")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                { label: translate("Name"), type: "text", searchColumn: "name" },
                ...(isSuperAdmin ? [{ label: translate("State"), type: "select", searchColumn: "state", options: STATES_MY.map(s => ({ id: s, name: s })) }] : []),
              ]}
              onApplyFilter={(f) => {
                setAppliedName(f.name || "");
                setAppliedState(f.state || "all");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={openAdd}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Card list */}
          {listLoading ? (
            <InlineLoadingComponent />
          ) : listItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
              <Landmark className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listItems.map((mosque) => (
                <MosqueCard
                  key={mosque.id}
                  mosque={mosque}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={(m) => { setMosqueToDelete(m); setDeleteDialogOpen(true); }}
                />
              ))}
            </div>
          )}

          {effectiveTotalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={effectiveTotalPages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={() => {}}
                totalItems={effectiveTotalItems}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <MosqueFormSheet
          editing={editingMosque}
          onClose={() => setFormOpen(false)}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          isSuperAdmin={isSuperAdmin}
          currentUserStates={currentUserStates}
          orgOptions={orgOptions}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Mosque")}
        description={`${translate("Delete")} "${mosqueToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </>
  );
}
