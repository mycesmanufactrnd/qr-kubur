// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Bell,
  CheckCircle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { STATES_MY } from "@/utils/enums";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";
import { parseDobFromIcNumber } from "@/utils/helpers";

const DEFAULT_FORM = {
  fullname: "",
  icnumber: "",
  phone: "",
  email: "",
  address: "",
  isdeceased: false,
  createOrgId: null,
  createMosqueId: null,
  state: "",
  mosque: "",
  grave: "",
  gravelot: "",
  causeofdeath: "",
  dateofdeath: "",
  dateofbirth: "",
  heirname: "",
  heirphoneno: "",
};

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MemberCard({
  member,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onApprove,
  onReminder,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {member.fullname}
          </p>
          <Badge
            className={`shrink-0 border-0 text-xs ${
              member.isapproved
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {member.isapproved ? translate("Approved") : translate("Pending")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {member.icnumber && <span>{member.icnumber}</span>}
          {member.phone && <span>{member.phone}</span>}
          <span>
            {member.isdeceased ? translate("Arwah") : translate("Living")}
          </span>
        </div>

        {(member.organisation?.name || member.mosque?.name) && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {[member.organisation?.name, member.mosque?.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {canEdit && !member.isapproved && (
            <button
              onClick={() => onApprove(member)}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {translate("Approve")}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(member)}
              className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canEdit && member.isdeceased && (
            <button
              onClick={() => onReminder(member)}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Bell className="w-3.5 h-3.5" />
              {translate("Remind")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(member)}
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

function MemberFormSheet({
  editing,
  onClose,
  onSubmit,
  onApprove,
  isSubmitting,
  isApproving,
  userOrgId,
  isSuperAdmin,
  currentUserStates,
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
          ...DEFAULT_FORM,
          fullname: editing.fullname || "",
          icnumber: editing.icnumber || "",
          phone: editing.phone || "",
          email: editing.email || "",
          address: editing.address || "",
          isdeceased: editing.isdeceased || false,
          state: editing.mosque?.state || "",
          mosque: editing.mosque?.id ? String(editing.mosque.id) : "",
        }
      : DEFAULT_FORM,
  });

  const isdeceased = watch("isdeceased");
  const createOrgIdValue = watch("createOrgId");
  const dialogState = watch("state");
  const icnumberValue = watch("icnumber");

  // Derive date of birth from the IC number while marking someone newly deceased.
  // Skip when editing a member who was already deceased — that data is loaded from the DB record instead.
  useEffect(() => {
    if (!isdeceased || editing?.isdeceased) return;
    const dob = parseDobFromIcNumber(icnumberValue);
    if (dob) setValue("dateofbirth", dob);
  }, [icnumberValue, isdeceased, editing?.isdeceased]);

  const [isApprovedLocal, setIsApprovedLocal] = useState(
    editing?.isapproved ?? true,
  );

  const formDisabled = !!(editing && !isApprovedLocal);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const { data: allOrganisations = [] } =
    trpc.deathCharityMember.getOrganisations.useQuery({
      organisationId: userOrgId,
    });

  const { data: createMosques = [], isLoading: createMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: createOrgIdValue },
      { enabled: !editing && !!createOrgIdValue },
    );

  useEffect(() => {
    setValue("createMosqueId", null);
  }, [createOrgIdValue]);

  const { data: editMosques = [], isLoading: editMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { state: dialogState || null },
      { enabled: !!editing },
    );

  const deceasedOrgId =
    createOrgIdValue ?? editing?.organisation?.id ?? userOrgId ?? null;
  const { gravesList: deceasedGraves = { items: [] } } = useGetGravePaginated({
    organisationIds: deceasedOrgId ? [deceasedOrgId] : undefined,
    pageSize: 1000,
  });

  // Populate DeadPerson fields from the member's linked deadperson relation
  useEffect(() => {
    const existingDeadPerson = editing?.deadperson;
    if (!editing?.isdeceased || !existingDeadPerson) return;
    const toDateStr = (val) => {
      if (!val) return "";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    };
    setValue("gravelot", existingDeadPerson.gravelot ?? "");
    setValue("causeofdeath", existingDeadPerson.causeofdeath ?? "");
    setValue("dateofdeath", toDateStr(existingDeadPerson.dateofdeath));
    setValue("dateofbirth", toDateStr(existingDeadPerson.dateofbirth));
    setValue("heirname", existingDeadPerson.heirname ?? "");
    setValue("heirphoneno", existingDeadPerson.heirphoneno ?? "");
    if (existingDeadPerson.grave?.id) {
      setValue("grave", String(existingDeadPerson.grave.id));
    }
  }, [editing]);

  const stateOptions = isSuperAdmin ? STATES_MY : currentUserStates || [];

  const submitHandler = (formData) => {
    onSubmit({
      ...formData,
      selectedMosqueId: editing ? Number(formData.mosque) || null : undefined,
    });
  };

  const handleApproveClick = async () => {
    await onApprove(editing.id);
    setIsApprovedLocal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {editing
              ? translate("Edit Qariah Member")
              : translate("Add Qariah Member")}
          </h2>
          {editing && (
            <span
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                isApprovedLocal
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {isApprovedLocal ? translate("Approved") : translate("Pending")}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title={translate("Status")}>
          <div className="flex items-center gap-2">
            <Switch
              checked={isdeceased}
              onCheckedChange={(v) => {
                setValue("isdeceased", v);
                if (v && !editing?.isdeceased) {
                  setValue(
                    "dateofdeath",
                    new Date().toISOString().split("T")[0],
                  );
                }
              }}
              disabled={formDisabled}
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {translate("Deceased")}
            </span>
          </div>
        </FormSection>

        <FormSection title={translate("Member Information")}>
          <TextInputForm
            name="fullname"
            control={control}
            label={translate("Full Name")}
            required
            errors={errors}
            disabled={formDisabled}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="icnumber"
              isICNumber
              control={control}
              label={translate("IC No.")}
              required={isdeceased}
              errors={errors}
              disabled={formDisabled}
            />
            <TextInputForm
              name="phone"
              control={control}
              label={translate("Phone")}
              errors={errors}
              disabled={formDisabled}
            />
          </div>
          <TextInputForm
            name="email"
            control={control}
            label={translate("Email")}
            isEmail
            errors={errors}
            disabled={formDisabled}
          />
          <TextInputForm
            name="address"
            control={control}
            label={translate("Address")}
            isTextArea
            disabled={formDisabled}
          />
        </FormSection>

        {!editing && (
          <FormSection title={translate("Organisation & Mosque")}>
            <Select2Form
              name="createOrgId"
              control={control}
              label={translate("Organisation")}
              placeholder={translate("Select organisation...")}
              searchPlaceholder={translate("Search organisation...")}
              emptyMessage={translate("No organisation found.")}
              options={allOrganisations.map((o) => ({
                value: o.id,
                label: o.name,
              }))}
              required
              errors={errors}
            />
            <Select2Form
              name="createMosqueId"
              control={control}
              label={translate("Mosque")}
              placeholder={
                createOrgIdValue
                  ? translate("Select mosque...")
                  : translate("Select organisation first")
              }
              searchPlaceholder={translate("Search mosque...")}
              emptyMessage={translate("No mosque found.")}
              options={createMosques.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              required
              errors={errors}
              disabled={!createOrgIdValue}
              loading={createMosquesLoading}
              noSelectionMessage={translate(
                "Select organisation to see its mosques.",
              )}
            />
          </FormSection>
        )}

        {editing && (
          <FormSection title={translate("Mosque")}>
            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select state")}
              options={stateOptions}
              onValueChange={() => setValue("mosque", "")}
              disabled={formDisabled}
            />
            <Select2Form
              name="mosque"
              control={control}
              label={translate("Mosque")}
              placeholder={
                dialogState
                  ? translate("Select mosque...")
                  : translate("Select state first")
              }
              searchPlaceholder={translate("Search mosque...")}
              emptyMessage={translate("No mosque found.")}
              options={editMosques.map((m) => ({
                value: String(m.id),
                label: m.name,
              }))}
              disabled={formDisabled || !dialogState || editMosquesLoading}
              loading={editMosquesLoading}
              required
              errors={errors}
            />
          </FormSection>
        )}

        {isdeceased && (
          <FormSection title={translate("Dead Person Details")}>
            <SelectForm
              name="grave"
              control={control}
              label={translate("Cemetery")}
              placeholder={translate("Select Cemetery")}
              options={deceasedGraves.items.map((g) => ({
                value: g.id,
                label: g.name,
              }))}
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
            <TextInputForm
              name="causeofdeath"
              control={control}
              label={translate("Cause of Death")}
              required
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
              name="heirname"
              control={control}
              label={translate("Nama Waris")}
              required
              errors={errors}
            />
            <TextInputForm
              name="heirphoneno"
              control={control}
              label={translate("No. Tel. Waris")}
              required
              errors={errors}
            />
          </FormSection>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        {formDisabled ? (
          <button
            type="button"
            onClick={handleApproveClick}
            disabled={isApproving}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {translate("Approve Member")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit(submitHandler)}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {editing ? translate("Save") : translate("Add Member")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MobileManageQariahMember() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    currentUserStates,
  } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("death_charity");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [appliedFilters, setAppliedFilters] = useState({
    fullname: "",
    isApproved: "",
    isDeceased: "",
  });

  const [formSheet, setFormSheet] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [memberToApprove, setMemberToApprove] = useState(null);
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);
  const [notifyConfirmMode, setNotifyConfirmMode] = useState(null);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [notifyReminderMember, setNotifyReminderMember] = useState(null);
  const [unmarkConfirmOpen, setUnmarkConfirmOpen] = useState(false);

  const { data, isLoading, refetch } =
    trpc.deathCharityMember.getQariahPaginated.useQuery({
      page,
      pageSize: itemsPerPage,
      filterFullName: appliedFilters.fullname || null,
      filterIsApproved:
        appliedFilters.isApproved === ""
          ? null
          : appliedFilters.isApproved === "true",
      filterIsDeceased:
        appliedFilters.isDeceased === ""
          ? null
          : appliedFilters.isDeceased === "true",
    });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  const upsertDeadPersonMutation = trpc.deadperson.upsertForQariah.useMutation({
    onSuccess: () => showSuccess(translate("Dead person recorded"), "success"),
    onError: (err) => showApiError(err),
  });

  const deleteDeadPersonMutation = trpc.deadperson.delete.useMutation({
    onError: (err) => showApiError(err),
  });

  const createMutation = trpc.deathCharityMember.create.useMutation({
    onSuccess: () => showSuccess(translate("Created"), "success"),
    onError: (err) => showApiError(err),
  });

  const updateMutation = trpc.deathCharityMember.update.useMutation({
    onSuccess: () => showSuccess(translate("Saved"), "success"),
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.deathCharityMember.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate("Deleted"), "success");
      refetch();
      setDeleteDialog(null);
    },
    onError: (err) => showApiError(err),
  });

  const notifyDeathMutation = trpc.qariahNotification.notifyDeath.useMutation({
    onSuccess: () => showSuccess(translate("Notification sent"), "success"),
    onError: (err) => showApiError(err),
  });

  const approveMutation = trpc.deathCharityMember.approveMember.useMutation({
    onSuccess: () => showSuccess(translate("Member approved"), "success"),
    onError: (err) => showApiError(err),
  });

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    upsertDeadPersonMutation.isPending;

  const submitMember = async (formData, shouldNotify = false) => {
    let savedMember;

    if (formSheet?.mode === "edit") {
      if (!formData.selectedMosqueId) {
        showApiError(new Error(translate("Please select a mosque.")));
        return;
      }
      savedMember = await updateMutation.mutateAsync({
        id: formSheet.member.id,
        data: { ...formData, mosque: { id: formData.selectedMosqueId } },
      });
    } else {
      if (!formData.createOrgId) {
        showApiError(new Error(translate("Please select an organisation.")));
        return;
      }
      if (!formData.createMosqueId) {
        showApiError(new Error(translate("Please select a mosque.")));
        return;
      }
      savedMember = await createMutation.mutateAsync({
        ...formData,
        mosque: { id: formData.createMosqueId },
        organisation: { id: formData.createOrgId },
      });
    }

    if (Boolean(formData.isdeceased)) {
      if (!formData.grave) {
        showApiError(
          new Error(translate("Please select a grave for the deceased.")),
        );
        return;
      }
      const requiredFields = [
        formData.gravelot,
        formData.causeofdeath,
        formData.dateofdeath,
        formData.dateofbirth,
        formData.icnumber,
        formData.heirname,
        formData.heirphoneno,
      ];

      if (requiredFields.some((f) => !f || String(f).trim() === "")) {
        showApiError(
          new Error(translate("Please fill all required deceased details.")),
        );
        return;
      }

      await upsertDeadPersonMutation.mutateAsync({
        name: formData.fullname,
        icnumber: formData.icnumber,
        dateofbirth: formData.dateofbirth,
        dateofdeath: formData.dateofdeath,
        causeofdeath: formData.causeofdeath,
        biography: null,
        photourl: null,
        latitude: null,
        longitude: null,
        heirname: formData.heirname,
        heirphoneno: formData.heirphoneno,
        grave: { id: Number(formData.grave) },
        gravelot: formData.gravelot?.trim() || null,
        deathCharityMemberId: savedMember?.id ?? null,
      });
    } else if (formSheet?.member?.deadperson?.id) {
      // Unmarked as deceased — remove the now-orphaned public deadperson/grave record
      await deleteDeadPersonMutation.mutateAsync(formSheet.member.deadperson.id);
    }

    refetch();
    setFormSheet(null);

    if (shouldNotify && savedMember?.id) {
      await notifyDeathMutation.mutateAsync({
        deceasedMemberId: savedMember.id,
        customMessage: null,
      });
    }
  };

  const handleFormSubmit = async (formData) => {
    const isMarkingDeceased =
      Boolean(formData.isdeceased) && !formSheet?.member?.isdeceased;
    const isUnmarkingDeceased =
      !formData.isdeceased &&
      formSheet?.member?.isdeceased &&
      !!formSheet?.member?.deadperson?.id;

    if (isMarkingDeceased) {
      setPendingSubmitData({ formData });
      setNotifyConfirmMode("deceased");
      setNotifyConfirmOpen(true);
      return;
    }

    if (isUnmarkingDeceased) {
      setPendingSubmitData({ formData });
      setUnmarkConfirmOpen(true);
      return;
    }

    await submitMember(formData, false);
  };

  const handleUnmarkConfirm = async () => {
    setUnmarkConfirmOpen(false);
    if (!pendingSubmitData) return;
    await submitMember(pendingSubmitData.formData, false);
    setPendingSubmitData(null);
  };

  const handleApprove = async (memberId) => {
    await approveMutation.mutateAsync(memberId);
    refetch();
  };

  const handleNotifyConfirmation = async (shouldNotify) => {
    setNotifyConfirmOpen(false);

    if (notifyConfirmMode === "deceased") {
      if (!pendingSubmitData) {
        setNotifyConfirmMode(null);
        return;
      }
      await submitMember(pendingSubmitData.formData, shouldNotify);
      setPendingSubmitData(null);
    } else if (
      notifyConfirmMode === "reminder" &&
      shouldNotify &&
      notifyReminderMember?.id
    ) {
      await notifyDeathMutation.mutateAsync({
        deceasedMemberId: notifyReminderMember.id,
        customMessage: null,
      });
    }

    setNotifyConfirmMode(null);
    setNotifyReminderMember(null);
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    if (deleteDialog.deadperson?.id) {
      await deleteDeadPersonMutation.mutateAsync(deleteDialog.deadperson.id);
    }
    await deleteMutation.mutateAsync(deleteDialog.id);
  };

  const openReminderConfirm = (member) => {
    setNotifyReminderMember(member);
    setNotifyConfirmMode("reminder");
    setNotifyConfirmOpen(true);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return <AccessDeniedComponent />;

  return (
    <div className="min-h-screen pb-6">
      <BackNavigation title={translate("Manage Qariah Members")} />

      <div className="max-w-2xl mx-auto px-3 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <AdvancedFilters
            parameter={[
              {
                label: translate("Full Name"),
                type: "text",
                searchColumn: "fullname",
              },
              {
                label: translate("Status"),
                type: "select",
                searchColumn: "isApproved",
                options: [
                  { id: "false", name: translate("Pending") },
                  { id: "true", name: translate("Approved") },
                ],
              },
              {
                label: translate("Deceased"),
                type: "select",
                searchColumn: "isDeceased",
                options: [
                  { id: "false", name: translate("Living") },
                  { id: "true", name: translate("Arwah") },
                ],
              },
            ]}
            onApplyFilter={(f) => {
              setAppliedFilters({
                fullname: f.fullname || "",
                isApproved: f.isApproved || "",
                isDeceased: f.isDeceased || "",
              });
              setPage(1);
            }}
          />
          {canCreate && (
            <button
              onClick={() => setFormSheet({ mode: "add", member: null })}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold active:opacity-80 shadow-sm ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <InlineLoadingComponent isPage />
        ) : items.length === 0 ? (
          <MobileEmptyList icon={Users} title={translate("No records")} />
        ) : (
          <div className="space-y-3">
            {items.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(m) => setFormSheet({ mode: "edit", member: m })}
                onDelete={(m) => setDeleteDialog(m)}
                onApprove={(m) => {
                  setMemberToApprove(m);
                  setApproveConfirmOpen(true);
                }}
                onReminder={openReminderConfirm}
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
              totalItems={total}
            />
          </div>
        )}
      </div>

      {formSheet && (
        <MemberFormSheet
          editing={formSheet.member}
          onClose={() => setFormSheet(null)}
          onSubmit={handleFormSubmit}
          onApprove={handleApprove}
          isSubmitting={isSubmitting}
          isApproving={approveMutation.isPending}
          userOrgId={userOrgId}
          isSuperAdmin={isSuperAdmin}
          currentUserStates={currentUserStates}
        />
      )}

      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={(open) => {
          setApproveConfirmOpen(open);
          if (!open) setMemberToApprove(null);
        }}
        title={translate("Approve Qariah Member")}
        description={`${translate("Approve")} "${memberToApprove?.fullname}"?`}
        onConfirm={async () => {
          if (memberToApprove) await handleApprove(memberToApprove.id);
          setApproveConfirmOpen(false);
          setMemberToApprove(null);
        }}
        confirmText={translate("Approve")}
        isMobile
      />

      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title={translate("Delete Qariah Member")}
        isDelete
        itemToDelete={deleteDialog?.fullname}
        description={
          deleteDialog?.deadperson?.id
            ? `${translate("Are you sure to delete")} "${deleteDialog?.fullname}"? ${translate("This member has recorded arwah/grave information (shown publicly at the grave) that will also be permanently deleted.")}`
            : undefined
        }
        onConfirm={confirmDelete}
        isMobile
      />

      <ConfirmDialog
        open={unmarkConfirmOpen}
        onOpenChange={(open) => {
          setUnmarkConfirmOpen(open);
          if (!open) setPendingSubmitData(null);
        }}
        title={translate("Unmark as Deceased")}
        description={translate(
          "This member has recorded arwah/grave information (shown publicly at the grave). Continuing will permanently delete that record.",
        )}
        onConfirm={handleUnmarkConfirm}
        confirmText={translate("Yes, Delete")}
        cancelText={translate("Cancel")}
        isMobile
      />

      <ConfirmDialog
        open={notifyConfirmOpen}
        onOpenChange={(open) => {
          setNotifyConfirmOpen(open);
          if (!open) {
            if (notifyConfirmMode === "deceased" && pendingSubmitData) {
              const payload = pendingSubmitData;
              setPendingSubmitData(null);
              void submitMember(payload.formData, false);
            }
            setNotifyConfirmMode(null);
            setNotifyReminderMember(null);
          }
        }}
        title={
          notifyConfirmMode === "reminder"
            ? translate("Send Reminder Notification")
            : translate("Notify Death of Qariah Member")
        }
        description={
          notifyConfirmMode === "reminder"
            ? translate(
                "Ingin hantar notifikasi semula kepada ahli waris dan pihak berkuasa (JKR) bagi qariah ini?",
              )
            : translate(
                "Ingin hantar notifikasi kepada ahli waris dan pihak berkuasa (JKR) bagi qariah ini?",
              )
        }
        onConfirm={() => handleNotifyConfirmation(true)}
        confirmText={translate("Yes, Notify")}
        cancelText={translate("No")}
        isMobile
      />
    </div>
  );
}
