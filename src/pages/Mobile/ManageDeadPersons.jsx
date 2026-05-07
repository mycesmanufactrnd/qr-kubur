import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
  QrCode,
  Navigation,
  User,
} from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import QRCodeDialog from "@/components/QRCodeDialog";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { translate } from "@/utils/translations";
import { resolveFileUrl } from "@/utils";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetDeadPersonPaginated,
  useDeadPersonMutations,
} from "@/hooks/useDeadPersonMutations";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import { trpc } from "@/utils/trpc";
import { defaultDeadPersonField } from "@/utils/defaultformfields";

// ─── Person card ───────────────────────────────────────────────────────────────

function PersonCard({ person, canEdit, canDelete, onEdit, onDelete, onQR }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        {person.photourl ? (
          <img
            src={resolveFileUrl(person.photourl, "dead-person")}
            alt={person.name}
            className="w-16 h-16 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-slate-300" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-slate-800 text-sm truncate">{person.name}</p>
          {person.icnumber && (
            <p className="text-xs text-slate-400 font-mono">{person.icnumber}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {person.dateofdeath && (
              <span>
                {translate("Died")}: {new Date(person.dateofdeath).toLocaleDateString("ms-MY")}
              </span>
            )}
            {person.grave?.name && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {person.grave.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => onQR(person)}
          className="flex items-center gap-1.5 text-xs text-emerald-600 border border-emerald-200 rounded-lg px-2.5 py-1.5 active:opacity-70"
        >
          <QrCode className="w-3.5 h-3.5" />
          QR
        </button>
        {canEdit && (
          <button
            onClick={() => onEdit(person)}
            className="flex items-center gap-1.5 text-xs text-sky-600 border border-sky-200 rounded-lg px-2.5 py-1.5 active:opacity-70"
          >
            <Edit className="w-3.5 h-3.5" />
            {translate("Edit")}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(person)}
            className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {translate("Delete")}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Form sheet ────────────────────────────────────────────────────────────────

function PersonFormSheet({ editing, onClose, onSubmit, graveOptions, isSubmitting, uploading, handleFileUpload }) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? { ...editing, grave: editing.grave?.id?.toString() ?? "" }
      : defaultDeadPersonField,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <h2 className="font-semibold text-slate-800 text-sm">
          {editing ? translate("Edit Deceased") : translate("Add Deceased")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <TextInputForm name="name" control={control} label={translate("Name")} required errors={errors} />
        <TextInputForm name="icnumber" control={control} label={translate("IC No.")} required errors={errors} />
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm name="dateofbirth" control={control} label={translate("Date of Birth")} isDate required errors={errors} />
          <TextInputForm name="dateofdeath" control={control} label={translate("Date of Death")} isDate required errors={errors} />
        </div>
        <TextInputForm name="causeofdeath" control={control} label={translate("Cause of Death")} />
        <SelectForm
          name="grave"
          control={control}
          label={translate("Grave")}
          placeholder={translate("Select Grave")}
          options={graveOptions}
          required
          errors={errors}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm name="latitude" control={control} label={translate("Latitude")} isNumber required errors={errors} />
          <TextInputForm name="longitude" control={control} label={translate("Longitude")} isNumber required errors={errors} />
        </div>
        <button
          type="button"
          onClick={getLocation}
          disabled={isLocating}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 active:opacity-70 disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {isLocating ? translate("Getting location...") : translate("Get Current Location")}
        </button>
        <TextInputForm name="biography" control={control} label={translate("Biography")} isTextArea />
        <FileUploadForm
          name="photourl"
          control={control}
          label={translate("Photo")}
          required
          errors={errors}
          bucketName="dead-person"
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          translate={translate}
        />
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || uploading}
          className="w-full h-12 rounded-2xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MobileManageDeadPersons() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions("dead_persons");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [appliedSearch, setAppliedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrPerson, setQRPerson] = useState({});

  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id, isIdOnly: true },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin },
  );

  useEffect(() => {
    if (parentAndChildQuery.data) setAccessibleOrgIds(parentAndChildQuery.data);
  }, [parentAndChildQuery.data]);

  const { deadPersonsList, totalPages, isLoading } = useGetDeadPersonPaginated({
    page,
    pageSize: itemsPerPage,
    filterName: appliedSearch,
    organisationIds: accessibleOrgIds,
  });

  const { gravesList } = useGetGravePaginated({ organisationIds: accessibleOrgIds });
  const { createDeadPerson, updateDeadPerson, deleteDeadPerson } = useDeadPersonMutations();

  // Lock body scroll when form/dialogs are open
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
      const res = await fetch(`/api/upload/${bucketName}`, { method: "POST", body: formData });
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

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      grave: formData.grave ? { id: Number(formData.grave) } : null,
    };
    try {
      if (editingPerson) {
        await updateDeadPerson.mutateAsync({ id: editingPerson.id, data: submitData });
      } else {
        await createDeadPerson.mutateAsync(submitData);
      }
      setFormOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    await deleteDeadPerson.mutateAsync(personToDelete.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  const graveOptions = gravesList.items.map((g) => ({ value: g.id, label: g.name }));

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Deceased")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                { label: translate("Name"), type: "text", searchColumn: "name" },
              ]}
              onApplyFilter={(f) => { setAppliedSearch(f.name || ""); setPage(1); }}
            />
            {canCreate && (
              <button
                onClick={() => { setEditingPerson(null); setFormOpen(true); }}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Card list */}
          {isLoading ? (
            <InlineLoadingComponent />
          ) : deadPersonsList.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deadPersonsList.items.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={(p) => { setEditingPerson(p); setFormOpen(true); }}
                  onDelete={(p) => { setPersonToDelete(p); setDeleteDialogOpen(true); }}
                  onQR={(p) => { setQRPerson({ type: "deadperson", id: p.id }); setQRDialogOpen(true); }}
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
                totalItems={deadPersonsList.total}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <PersonFormSheet
          editing={editingPerson}
          onClose={() => setFormOpen(false)}
          onSubmit={onSubmit}
          graveOptions={graveOptions}
          isSubmitting={isSubmitting}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={translate("Delete")}
        description={`${translate("Delete")} "${personToDelete?.name}"?`}
        variant="destructive"
      />

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrPerson}
      />
    </>
  );
}
