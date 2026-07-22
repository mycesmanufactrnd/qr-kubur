// @ts-nocheck
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
  Eye,
} from "lucide-react";
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
import {
  appendCurrentUserToFormData,
  resolveFileUrl,
  createPageUrl,
} from "@/utils";
import { useNavigate } from "react-router-dom";
import MapLocationPicker from "@/components/MapLocationPicker";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import {
  useGetDeadPersonPaginated,
  useDeadPersonMutations,
} from "@/mutations/useDeadPersonMutations";
import { useGetGravePaginated } from "@/mutations/useGraveMutations";
import { trpc } from "@/utils/trpc";
import { defaultDeadPersonField } from "@/utils/defaultformfields";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";
import { parseDobFromIcNumber } from "@/utils/helpers";

function PersonCard({
  person,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onQR,
  onDetail,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        {person.photourl ? (
          <img
            src={resolveFileUrl(person.photourl, "bucket-dead-person")}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            alt={person.name}
            className="w-16 h-16 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-slate-300 dark:text-slate-500" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {person.name}
          </p>
          {person.icnumber && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {person.icnumber}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {person.dateofdeath && (
              <span>
                {translate("Died")}:{" "}
                {new Date(person.dateofdeath).toLocaleDateString("ms-MY")}
              </span>
            )}
            {person.grave?.name && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {person.grave.name}
              </span>
            )}
            {person.gravelot && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {translate("Grave Lot")}: {person.gravelot}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => onDetail(person)}
          className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
        >
          <Eye className="w-3.5 h-3.5" />
          {translate("Detail")}
        </button>
        <button
          onClick={() => onQR(person)}
          className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
        >
          <QrCode className="w-3.5 h-3.5" />
          QR
        </button>
        {canEdit && (
          <button
            onClick={() => onEdit(person)}
            className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
          >
            <Edit className="w-3.5 h-3.5" />
            {translate("Edit")}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(person)}
            className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {translate("Delete")}
          </button>
        )}
      </div>
    </div>
  );
}

function PersonFormSheet({
  editing,
  onClose,
  onSubmit,
  graveOptions,
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
      ? { ...editing, grave: editing.grave?.id?.toString() ?? "" }
      : defaultDeadPersonField,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const icnumberValue = watch("icnumber");

  useEffect(() => {
    if (editing) return;
    const dob = parseDobFromIcNumber(icnumberValue);
    if (dob) setValue("dateofbirth", dob);
  }, [icnumberValue, editing]);

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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {editing ? translate("Edit Deceased") : translate("Add Deceased")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <TextInputForm
          name="name"
          control={control}
          label={translate("Name")}
          required
          errors={errors}
        />
        <TextInputForm
          name="icnumber"
          isICNumber
          control={control}
          label={translate("IC No.")}
          errors={errors}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm
            name="dateofbirth"
            control={control}
            label={translate("Date of Birth")}
            isDate
            required
            errors={errors}
          />
          <TextInputForm
            name="dateofdeath"
            control={control}
            label={translate("Date of Death")}
            isDate
            required
            errors={errors}
          />
        </div>
        <TextInputForm
          name="causeofdeath"
          control={control}
          label={translate("Cause of Death")}
        />
        <SelectForm
          name="grave"
          control={control}
          label={translate("Grave")}
          placeholder={translate("Select Grave")}
          options={graveOptions}
          required
          errors={errors}
        />
        <TextInputForm
          name="gravelot"
          control={control}
          label={translate("Grave Lot")}
          required
          errors={errors}
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
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 text-sm font-medium text-blue-700 dark:text-blue-400 active:opacity-70"
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
        <TextInputForm
          name="biography"
          control={control}
          label={translate("Biography")}
          isTextArea
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInputForm
            name="heirname"
            control={control}
            label={translate("Nama Waris")}
            errors={errors}
          />
          <TextInputForm
            name="heirphoneno"
            control={control}
            label={translate("No. Tel. Waris")}
            errors={errors}
          />
        </div>
        <FileUploadForm
          name="photourl"
          control={control}
          label={translate("Photo")}
          errors={errors}
          bucketName="bucket-dead-person"
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          translate={translate}
        />
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
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

export default function MobileManageDeadPersons() {
  const navigate = useNavigate();
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } =
    useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("dead_persons");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedGraveLot, setAppliedGraveLot] = useState("");

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
    filterGraveLot: appliedGraveLot,
    organisationIds: accessibleOrgIds,
  });

  const { gravesList } = useGetGravePaginated({
    organisationIds: accessibleOrgIds,
  });
  const { createDeadPerson, updateDeadPerson, deleteDeadPerson } =
    useDeadPersonMutations();

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

  const onSubmit = async (formData) => {
    const selectedGrave = gravesList.items.find(
      (grave) => Number(grave.id) === Number(formData.grave),
    );

    let latitude = formData.latitude ? parseFloat(formData.latitude) : null;

    let longitude = formData.longitude ? parseFloat(formData.longitude) : null;

    if ((!latitude || latitude === 0) && selectedGrave?.latitude != null) {
      latitude = parseFloat(selectedGrave.latitude);
    }

    if ((!longitude || longitude === 0) && selectedGrave?.longitude != null) {
      longitude = parseFloat(selectedGrave.longitude);
    }

    setIsSubmitting(true);
    const submitData = {
      ...formData,
      latitude,
      longitude,
      grave: formData.grave ? { id: Number(formData.grave) } : null,
      gravelot: formData.gravelot?.trim() || null,
    };
    try {
      if (editingPerson) {
        await updateDeadPerson.mutateAsync({
          id: editingPerson.id,
          data: submitData,
        });
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

  const graveOptions = gravesList.items.map((g) => ({
    value: g.id,
    label: g.name,
  }));

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
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
                {
                  label: translate("Name"),
                  type: "text",
                  searchColumn: "name",
                },
                {
                  label: translate("Grave Lot"),
                  type: "text",
                  searchColumn: "gravelot",
                },
              ]}
              onApplyFilter={(f) => {
                setAppliedSearch(f.name || "");
                setAppliedGraveLot(f.gravelot || "");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={() => {
                  setEditingPerson(null);
                  setFormOpen(true);
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <InlineLoadingComponent isPage />
          ) : deadPersonsList.items.length === 0 ? (
            <MobileEmptyList icon={Users} title={translate("No records")} />
          ) : (
            <div className="space-y-3">
              {deadPersonsList.items.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onDetail={(p) =>
                    navigate(`${createPageUrl("DetailJenazah")}?id=${p.id}`)
                  }
                  onEdit={(p) => {
                    setEditingPerson(p);
                    setFormOpen(true);
                  }}
                  onDelete={(p) => {
                    setPersonToDelete(p);
                    setDeleteDialogOpen(true);
                  }}
                  onQR={(p) => {
                    setQRPerson({ type: "deadperson", id: p.id });
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
