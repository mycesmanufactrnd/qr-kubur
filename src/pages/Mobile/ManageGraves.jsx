// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  QrCode,
  Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import QRCodeDialog from "@/components/QRCodeDialog";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { translate } from "@/utils/translations";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import MapLocationPicker from "@/components/MapLocationPicker";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { GraveStatus, STATES_MY } from "@/utils/enums";
import {
  useGetGravePaginated,
  useGraveMutations,
} from "@/hooks/useGraveMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { trpc } from "@/utils/trpc";
import { defaultGraveField } from "@/utils/defaultformfields";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";

function GraveStatusBadge({ status }) {
  const map = {
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    full: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    maintenance:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <Badge
      className={`${map[status] ?? "bg-slate-100 text-slate-600"} border-0 text-xs capitalize`}
    >
      {translate(
        status ? status.charAt(0).toUpperCase() + status.slice(1) : "-",
      )}
    </Badge>
  );
}

function GraveCard({ grave, canEdit, canDelete, onEdit, onDelete, onQR }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {grave.photourl && (
        <img
          src={resolveFileUrl(grave.photourl, "bucket-grave")}
          alt={grave.name}
          referrerPolicy="no-referrer"
          className="w-full h-32 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {grave.name}
          </p>
          <GraveStatusBadge status={grave.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {grave.state && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {grave.state}
            </span>
          )}
          {(grave.block || grave.lot) && (
            <span>
              {grave.block && `${translate("Block")} ${grave.block}`}
              {grave.block && grave.lot && " · "}
              {grave.lot && `${translate("Lot")} ${grave.lot}`}
            </span>
          )}
          {grave.totalgraves != null && (
            <span>
              {grave.totalgraves} {translate("plots")}
            </span>
          )}
        </div>

        {grave.organisation?.name && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {grave.organisation.name}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onQR(grave)}
            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
          >
            <QrCode className="w-3.5 h-3.5" />
            QR
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(grave)}
              className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(grave)}
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

function GraveFormSheet({
  editing,
  onClose,
  onSubmit,
  orgOptions,
  stateOptions,
  isSubmitting,
  uploading,
  handleFileUpload,
}) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          organisation: editing.organisation?.id?.toString() ?? "",
          status: editing.status ?? GraveStatus.ACTIVE,
          totalgraves: editing.totalgraves ?? 0,
          photourl: editing.photourl ?? "",
        }
      : defaultGraveField,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude.toFixed(6));
        setValue("longitude", pos.coords.longitude.toFixed(6));
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
          {editing ? translate("Edit Grave") : translate("Add Grave")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
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
          options={stateOptions}
          required
          errors={errors}
        />
        <div className="grid grid-cols-2 gap-3">
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={getLocation}
            disabled={isLocating}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 active:opacity-70 disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            {isLocating
              ? translate("Getting location...")
              : translate("Get Current Location")}
          </button>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-700 dark:text-emerald-400 active:opacity-70"
          >
            <MapPin className="w-4 h-4" />
            {showMap ? translate("Hide Map") : translate("Pick on Map")}
          </button>
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
        <SelectForm
          name="organisation"
          control={control}
          label={translate("Managing Organisation")}
          placeholder={translate("Select Organisation")}
          options={orgOptions}
        />
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm
            name="totalgraves"
            control={control}
            label={translate("Total Graves")}
            isNumber
            required
            errors={errors}
          />
          <SelectForm
            name="status"
            control={control}
            label={translate("Status")}
            placeholder={translate("Select Status")}
            options={Object.values(GraveStatus).map((s) => ({
              value: s,
              label: translate(s.charAt(0).toUpperCase() + s.slice(1)),
            }))}
            required
            errors={errors}
          />
        </div>
        <FileUploadForm
          name="photourl"
          control={control}
          label={translate("Photo")}
          required
          errors={errors}
          bucketName="bucket-grave"
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
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MobileManageGraves() {
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
  } = useCrudPermissions("graves");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [appliedSearch, setAppliedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrGrave, setQRGrave] = useState({});

  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin },
  );

  useEffect(() => {
    if (parentAndChildQuery.data) setAccessibleOrgIds(parentAndChildQuery.data);
  }, [parentAndChildQuery.data]);

  const { gravesList, totalPages, isLoading } = useGetGravePaginated({
    page,
    pageSize: itemsPerPage,
    filterName: appliedSearch,
    organisationIds: accessibleOrgIds,
  });

  const { organisationsList } = useGetOrganisationPaginated({});
  const { createGrave, updateGrave, deleteGrave } = useGraveMutations();

  // Lock body scroll when form sheet or dialogs open
  useEffect(() => {
    const open = formOpen || qrDialogOpen || deleteDialogOpen;
    document.body.style.overflow = open ? "hidden" : "";
    document.body.style.touchAction = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [formOpen, qrDialogOpen, deleteDialogOpen]);

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || translate("Failed to upload photo"));
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
    setEditingGrave(null);
    setFormOpen(true);
  };

  const openEdit = (grave) => {
    setEditingGrave(grave);
    setFormOpen(true);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : "",
      longitude: formData.longitude ? parseFloat(formData.longitude) : "",
      organisation: formData.organisation
        ? { id: Number(formData.organisation) }
        : null,
      totalgraves: Number(formData.totalgraves) || 0,
    };
    try {
      if (editingGrave) {
        await updateGrave.mutateAsync({
          id: editingGrave.id,
          data: submitData,
        });
      } else {
        await createGrave.mutateAsync(submitData);
      }
      setFormOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!graveToDelete) return;
    await deleteGrave.mutateAsync(graveToDelete.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  const stateOptions = isSuperAdmin ? STATES_MY : currentUserStates || [];
  const orgOptions = organisationsList.items.map((o) => ({
    value: o.id,
    label: o.name,
  }));

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Graves")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                {
                  label: translate("Name"),
                  type: "text",
                  searchColumn: "name",
                },
              ]}
              onApplyFilter={(f) => {
                setAppliedSearch(f.name || "");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={openAdd}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <PageLoadingComponent />
          ) : gravesList.items.length === 0 ? (
            <MobileEmptyList icon={MapPin} title={translate("No records")} />
          ) : (
            <div className="space-y-3">
              {gravesList.items.map((grave) => (
                <GraveCard
                  key={grave.id}
                  grave={grave}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={(g) => {
                    setGraveToDelete(g);
                    setDeleteDialogOpen(true);
                  }}
                  onQR={(g) => {
                    setQRGrave({ type: "grave", id: g.id });
                    setQRDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={() => {}}
                totalItems={gravesList.total}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <GraveFormSheet
          editing={editingGrave}
          onClose={() => setFormOpen(false)}
          onSubmit={onSubmit}
          orgOptions={orgOptions}
          stateOptions={stateOptions}
          isSubmitting={isSubmitting}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={translate("Delete Grave")}
        description={`${translate("Delete")} "${graveToDelete?.name}"?`}
        variant="destructive"
      />

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrGrave}
      />
    </>
  );
}
