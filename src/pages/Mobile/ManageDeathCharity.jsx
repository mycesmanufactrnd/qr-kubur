import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Heart,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import { translate } from "@/utils/translations";
import { formatRM } from "@/utils/helpers";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { STATES_MY } from "@/utils/enums";
import {
  useGetDeathCharityPaginated,
  useDeathCharityMutations,
} from "@/hooks/useDeathCharityMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { useGetMosquesByOrganisationId } from "@/hooks/useMosqueMutations";
import { defaultDeathCharityField } from "@/utils/defaultformfields";

function DeathCharityCard({ item, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 text-sm leading-tight flex-1 min-w-0">
            {item.name}
          </p>
          <Badge
            className={`shrink-0 border-0 text-xs ${
              item.isactive
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.isactive ? translate("Active") : translate("Inactive")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {item.organisation?.name && (
            <span className="truncate">{item.organisation.name}</span>
          )}
          {item.state && (
            <span className="bg-slate-100 rounded-lg px-2 py-0.5 shrink-0">
              {item.state}
            </span>
          )}
        </div>

        {item.contactperson && (
          <p className="text-xs text-slate-400">{item.contactperson} {item.contactphone ? `· ${item.contactphone}` : ""}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
          {item.registrationfee != null && (
            <span>{translate("Reg Fee")}: <span className="font-medium text-slate-700">{formatRM(Number(item.registrationfee))}</span></span>
          )}
          {item.deathbenefitamount != null && (
            <span>{translate("Benefit")}: <span className="font-medium text-emerald-700">{formatRM(Number(item.deathbenefitamount))}</span></span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 text-xs text-sky-600 border border-sky-200 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
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


function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DeathCharityFormSheet({
  editing,
  onClose,
  onSubmit,
  isSubmitting,
  isSuperAdmin,
  currentUserStates,
  organisationOptions,
}) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          organisation: editing.organisation?.id?.toString() ?? "",
          isselfregister: editing.isselfregister ?? true,
        }
      : defaultDeathCharityField,
  });

  const organisationId = watch("organisation");

  const { data: mosqueList = [] } = useGetMosquesByOrganisationId(
    organisationId ? Number(organisationId) : null,
  );

  const mosqueOptions = mosqueList.map((m) => ({ value: m.id, label: m.name }));

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
          {editing ? translate("Edit Death Charity") : translate("Add Death Charity")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title={translate("Organisation Details")}>
          <SelectForm
            name="organisation"
            control={control}
            label={translate("Managing Organisation")}
            placeholder={translate("Select managing organisation")}
            options={organisationOptions}
            required
            errors={errors}
          />
          <SelectForm
            name="mosqueid"
            control={control}
            label={translate("Managing Mosque")}
            placeholder={translate("Select managing mosque")}
            options={mosqueOptions}
            required
            errors={errors}
          />
        </FormSection>

        <FormSection title={translate("Basic Information")}>
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
          <TextInputForm
            name="description"
            control={control}
            label={translate("Description")}
            isTextArea
          />
        </FormSection>

        <FormSection title={translate("Contact Information")}>
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="contactperson"
              control={control}
              label={translate("Contact Person")}
              required
              errors={errors}
            />
            <TextInputForm
              name="contactphone"
              control={control}
              label={translate("Contact Phone No.")}
              required
              errors={errors}
            />
          </div>
        </FormSection>

        <FormSection title={translate("Fee Information")}>
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="registrationfee"
              control={control}
              label={translate("Registration Fee")}
              isMoney
              required
              errors={errors}
            />
            <TextInputForm
              name="yearlyfee"
              control={control}
              label={translate("Yearly Fee")}
              isMoney
              required
              errors={errors}
            />
          </div>
          <TextInputForm
            name="deathbenefitamount"
            control={control}
            label={translate("Death Benefit Amount")}
            isMoney
            required
            errors={errors}
          />
        </FormSection>

        <FormSection title={translate("Coverage Details")}>
          <div className="grid grid-cols-2 gap-3">
            <CheckboxForm name="coversspouse" control={control} label={translate("Covers Spouse")} />
            <CheckboxForm name="coverschildren" control={control} label={translate("Covers Children")} />
          </div>
          <TextInputForm
            name="maxdependents"
            control={control}
            label={translate("Max Dependents")}
            isNumber
            required
            errors={errors}
          />
          <CheckboxForm
            name="isselfregister"
            control={control}
            label={translate("Allow Self Register")}
          />
        </FormSection>

        <FormSection title={translate("Status")}>
          <CheckboxForm name="isactive" control={control} label={translate("Active")} />
        </FormSection>
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? translate("Saving...") : translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MobileManageDeathCharity() {
  const { loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } =
    useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } =
    useCrudPermissions("death_charity");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedName, setAppliedName] = useState("");
  const [appliedState, setAppliedState] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { deathCharityList, totalPages, isLoading } = useGetDeathCharityPaginated({
    page,
    pageSize: itemsPerPage,
    filterName: appliedName,
    filterState: appliedState === "all" ? undefined : appliedState,
  });

  const { organisationsList } = useGetOrganisationPaginated({});
  const { createDeathCharity, updateDeathCharity, deleteDeathCharity } =
    useDeathCharityMutations();

  useEffect(() => {
    const open = formOpen || deleteDialogOpen;
    document.body.style.overflow = open ? "hidden" : "";
    document.body.style.touchAction = open ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [formOpen, deleteDialogOpen]);

  const openAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    const submitData = {
      ...formData,
      mosqueid: Number(formData.mosqueid) || null,
      registrationfee: Number(formData.registrationfee) || 0,
      yearlyfee: Number(formData.yearlyfee) || 0,
      deathbenefitamount: Number(formData.deathbenefitamount) || 0,
      maxdependents: Number(formData.maxdependents) || 0,
      organisation: formData.organisation
        ? { id: Number(formData.organisation) }
        : null,
    };
    try {
      if (editingItem) {
        await updateDeathCharity.mutateAsync({ id: editingItem.id, data: submitData });
      } else {
        await createDeathCharity.mutateAsync(submitData);
      }
      setFormOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDeathCharity.mutateAsync(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  const organisationOptions = organisationsList.items.map((o) => ({
    value: o.id,
    label: o.name,
  }));

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Death Charity")} />

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
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Card list */}
          {isLoading ? (
            <InlineLoadingComponent />
          ) : deathCharityList.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Heart className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deathCharityList.items.map((item) => (
                <DeathCharityCard
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onDelete={(i) => { setItemToDelete(i); setDeleteDialogOpen(true); }}
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
                totalItems={deathCharityList.total}
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <DeathCharityFormSheet
          editing={editingItem}
          onClose={() => setFormOpen(false)}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isSuperAdmin={isSuperAdmin}
          currentUserStates={currentUserStates}
          organisationOptions={organisationOptions}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Death Charity")}
        description={`${translate("Delete")} "${itemToDelete?.name ?? ""}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </>
  );
}
