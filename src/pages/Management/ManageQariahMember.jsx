// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import MobileManageQariahMember from "@/pages/Mobile/ManageQariahMember";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Users,
  Trash2,
  Edit,
  Save,
  ChevronsUpDown,
  Check,
  UserPlus,
  Bell,
  CheckCircle,
  Search,
  Loader2,
  XCircle,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SearchBar from "@/components/forms/SearchBar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { useGetGravePaginated } from "@/mutations/useGraveMutations";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { STATES_MY } from "@/utils/enums";
import { parseDobFromIcNumber } from "@/utils/helpers";
import { defaultQariahMemberField } from "@/utils/defaultformfields";

export default function ManageQariahMember() {
  const isNarrow = useIsNarrow();
  return isNarrow ? (
    <MobileManageQariahMember />
  ) : (
    <ManageQariahMemberDesktop />
  );
}

function ManageQariahMemberDesktop() {
  const { loadingUser, hasAdminAccess, currentUser } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("death_charity");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlFullName = searchParams.get("fullname") || "";
  const urlMosqueId = searchParams.get("mosqueId")
    ? parseInt(searchParams.get("mosqueId"))
    : null;
  const urlIsApproved =
    searchParams.get("isApproved") === "true"
      ? true
      : searchParams.get("isApproved") === "false"
        ? false
        : null;
  const urlIsDeceased =
    searchParams.get("isDeceased") === "true"
      ? true
      : searchParams.get("isDeceased") === "false"
        ? false
        : null;

  const [tempFullName, setTempFullName] = useState(urlFullName);
  const [filterMosqueId, setFilterMosqueId] = useState(urlMosqueId ?? null);
  const [filterIsApproved, setFilterIsApproved] = useState(urlIsApproved);
  const [filterIsDeceased, setFilterIsDeceased] = useState(urlIsDeceased);
  const [filterMosqueOpen, setFilterMosqueOpen] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [icCheckOpen, setIcCheckOpen] = useState(false);
  const [icCheckSearchedIc, setIcCheckSearchedIc] = useState("");
  const [isApprovedLocal, setIsApprovedLocal] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberToApprove, setMemberToApprove] = useState(null);
  const [approveSearchedIc, setApproveSearchedIc] = useState("");
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);
  const [notifyConfirmMode, setNotifyConfirmMode] = useState(null);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [notifyReminderMember, setNotifyReminderMember] = useState(null);
  const [unmarkConfirmOpen, setUnmarkConfirmOpen] = useState(false);

  const [dialogState, setDialogState] = useState("");
  const [mosqueComboOpen, setMosqueComboOpen] = useState(false);
  const [selectedMosqueId, setSelectedMosqueId] = useState(null);
  const [selectedMosqueName, setSelectedMosqueName] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: defaultQariahMemberField });

  const isdeceased = watch("isdeceased");
  const createOrgIdValue = watch("createOrgId");
  const icnumberValue = watch("icnumber");

  useEffect(() => {
    if (!isdeceased || editingMember?.isdeceased) return;
    const dob = parseDobFromIcNumber(icnumberValue);
    if (dob) setValue("dateofbirth", dob);
  }, [icnumberValue, isdeceased, editingMember?.isdeceased]);

  const {
    control: icCheckControl,
    watch: watchIcCheck,
    reset: resetIcCheck,
  } = useForm({ defaultValues: { icSearch: "" } });

  const icCheckInputValue = watchIcCheck("icSearch");

  const didMountIcCheckInput = useRef(false);
  useEffect(() => {
    if (!didMountIcCheckInput.current) {
      didMountIcCheckInput.current = true;
      return;
    }
    setIcCheckSearchedIc("");
  }, [icCheckInputValue]);

  useEffect(() => {
    setTempFullName(urlFullName);
  }, [urlFullName]);

  const { data, isLoading, refetch } =
    trpc.deathCharityMember.getQariahPaginated.useQuery({
      page: urlPage,
      pageSize: itemsPerPage,
      filterFullName: urlFullName || null,
      filterOrganisationId: userOrgId || null,
      filterMosqueId: urlMosqueId || null,
      filterIsApproved: urlIsApproved,
      filterIsDeceased: urlIsDeceased,
    });

  const { data: allOrganisations = [] } =
    trpc.deathCharityMember.getOrganisations.useQuery({
      organisationId: userOrgId,
    });

  const { data: filterMosques = [] } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: userOrgId },
      { enabled: !!userOrgId },
    );

  const { data: createMosques = [], isLoading: createMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: createOrgIdValue },
      { enabled: isDialogOpen && !editingMember && !!createOrgIdValue },
    );

  useEffect(() => {
    setValue("createMosqueId", null);
  }, [createOrgIdValue]);

  const { data: dialogMosques = [], isLoading: dialogMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { state: dialogState || null },
      { enabled: isDialogOpen && !!editingMember },
    );

  const { data: icCheckResult, isFetching: icCheckSearching } =
    trpc.deathCharityMember.searchByIcNumber.useQuery(
      { icnumber: icCheckSearchedIc, mosqueId: null },
      { enabled: !!icCheckSearchedIc, staleTime: 0 },
    );

  const { data: approveResults = [], isFetching: approveSearching } =
    trpc.deathCharityMember.searchByIcNumber.useQuery(
      { icnumber: approveSearchedIc, mosqueId: null, searchMany: true },
      { enabled: !!approveSearchedIc, staleTime: 0 },
    );

  const deceasedOrgId =
    createOrgIdValue ?? editingMember?.organisation?.id ?? userOrgId ?? null;
  const { gravesList: deceasedGraves = { items: [] } } = useGetGravePaginated({
    organisationIds: deceasedOrgId ? [deceasedOrgId] : undefined,
    pageSize: 1000,
  });

  useEffect(() => {
    const existingDeadPerson = editingMember?.deadperson;
    if (!isDialogOpen || !editingMember?.isdeceased || !existingDeadPerson)
      return;
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
  }, [editingMember, isDialogOpen]);

  const upsertDeadPersonMutation = trpc.deadperson.upsertForQariah.useMutation({
    onSuccess: () => {
      showSuccess(translate("Dead person recorded"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const deleteDeadPersonMutation = trpc.deadperson.delete.useMutation({
    onError: (err) => showApiError(err),
  });

  const [uploadingCert, setUploadingCert] = useState(false);

  const handleFileUpload = async (file, bucketName) => {
    setUploadingCert(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      try {
        const { appendCurrentUserToFormData } = await import("@/utils");
        appendCurrentUserToFormData(formDataUpload);
      } catch (e) {}

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showApiError(new Error(errorData.error || "Failed to upload file"));
        return null;
      }

      const data = await res.json();
      showSuccess(translate("Photo uploaded"));
      return data.file_url;
    } catch (err) {
      console.error(err);
      showApiError(new Error("Failed to upload file"));
      return null;
    } finally {
      setUploadingCert(false);
    }
  };

  const createMutation = trpc.deathCharityMember.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Created"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const updateMutation = trpc.deathCharityMember.update.useMutation({
    onSuccess: () => {
      showSuccess(translate("Saved"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.deathCharityMember.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate("Deleted"), "success");
      refetch();
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: (err) => showApiError(err),
  });

  const notifyDeathMutation = trpc.qariahNotification.notifyDeath.useMutation({
    onSuccess: () => {
      showSuccess(translate("Notification sent"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const approveMutation = trpc.deathCharityMember.approveMember.useMutation({
    onSuccess: () => {
      showSuccess(translate("Member approved"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleSearch = () => {
    const params = { page: "1" };
    if (tempFullName) params.fullname = tempFullName;
    if (filterMosqueId) params.mosqueId = filterMosqueId.toString();
    if (filterIsApproved !== null) params.isApproved = String(filterIsApproved);
    if (filterIsDeceased !== null) params.isDeceased = String(filterIsDeceased);
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempFullName("");
    setFilterMosqueId(null);
    setFilterIsApproved(null);
    setFilterIsDeceased(null);
    setSearchParams({});
  };

  const openCreateDialog = (icnumber = "") => {
    setEditingMember(null);
    setIsApprovedLocal(true);
    reset({ ...defaultQariahMemberField, icnumber });
    setIsDialogOpen(true);
  };

  const openIcCheckDialog = () => {
    resetIcCheck({ icSearch: "" });
    setIcCheckSearchedIc("");
    setIcCheckOpen(true);
  };

  const handleIcCheckSearch = () => {
    const ic = (icCheckInputValue ?? "").replace(/-/g, "").trim();
    if (!ic) return;
    setIcCheckSearchedIc(ic);
  };

  const handleContinueRegistration = () => {
    setIcCheckOpen(false);
    openCreateDialog(icCheckSearchedIc);
  };

  const openEditDialog = (member) => {
    setEditingMember(member);
    setIsApprovedLocal(member.isapproved ?? false);
    reset({
      fullname: member.fullname ?? "",
      icnumber: member.icnumber ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      address: member.address ?? "",
      isdeceased: member.isdeceased ?? false,
      createOrgId: null,
      createMosqueId: null,
      grave: "",
    });
    setDialogState(member.mosque?.state ?? "");
    setSelectedMosqueId(member.mosque?.id ?? null);
    setSelectedMosqueName(member.mosque?.name ?? "");
    setIsDialogOpen(true);
  };

  const handleApprove = async (memberId) => {
    await approveMutation.mutateAsync(memberId);
    refetch();
    if (editingMember?.id === memberId) {
      setIsApprovedLocal(true);
    }
  };

  const openApproveCheck = (member) => {
    setMemberToApprove(member);
    setApproveSearchedIc((member.icnumber ?? "").replace(/-/g, "").trim());
  };

  const handleApproveConfirm = async () => {
    if (!memberToApprove) return;
    await handleApprove(memberToApprove.id);
    setMemberToApprove(null);
    setIsDialogOpen(false);
  };

  const submitMember = async (formData, shouldNotify = false) => {
    let savedMember;

    if (editingMember) {
      if (!selectedMosqueId) {
        showApiError(new Error(translate("Please select a mosque.")));
        return;
      }
      savedMember = await updateMutation.mutateAsync({
        id: editingMember.id,
        data: {
          ...formData,
          mosque: { id: selectedMosqueId },
        },
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
    } else if (editingMember?.deadperson?.id) {
      await deleteDeadPersonMutation.mutateAsync(editingMember.deadperson.id);
    }

    refetch();
    setIsDialogOpen(false);

    if (shouldNotify && savedMember?.id) {
      await notifyDeathMutation.mutateAsync({
        deceasedMemberId: savedMember.id,
        customMessage: null,
      });
    }
  };

  const onSubmit = async (formData) => {
    const isMarkingDeceased =
      Boolean(formData.isdeceased) && !editingMember?.isdeceased;
    const isUnmarkingDeceased =
      !formData.isdeceased &&
      editingMember?.isdeceased &&
      !!editingMember?.deadperson?.id;

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
    if (!memberToDelete) return;
    if (memberToDelete.deadperson?.id) {
      await deleteDeadPersonMutation.mutateAsync(memberToDelete.deadperson.id);
    }
    await deleteMutation.mutateAsync(memberToDelete.id);
  };

  const openReminderConfirm = (member) => {
    setNotifyReminderMember(member);
    setNotifyConfirmMode("reminder");
    setNotifyConfirmOpen(true);
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    upsertDeadPersonMutation.isPending ||
    approveMutation.isPending;
  const formDisabled = !!(editingMember && !isApprovedLocal);

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView)
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            {
              label: translate("Manage Qariah Members"),
              page: "ManageQariahMember",
            },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          {
            label: translate("Manage Qariah Members"),
            page: "ManageQariahMember",
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          {translate("Manage Qariah Members")}
        </h1>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              onClick={openIcCheckDialog}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {translate("Add Member")}
            </Button>
          )}
        </div>
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        filters={[
          {
            type: "text",
            key: "fullname",
            value: tempFullName,
            onChange: setTempFullName,
            label: translate("Full Name"),
          },
          {
            type: "select2",
            key: "mosque",
            value: String(filterMosqueId),
            onChange: (v) => setFilterMosqueId(v ? Number(v) : null),
            label: translate("Mosque"),
            searchPlaceholder: translate("Search mosque..."),
            emptyMessage: translate("No mosque found."),
            options: filterMosques.map((m) => ({
              value: String(m.id),
              label: m.name,
            })),
          },
          {
            type: "select",
            key: "isApproved",
            value: String(filterIsApproved),
            onChange: (v) => setFilterIsApproved(v === "true"),
            label: translate("Status"),
            options: [
              { value: "false", label: translate("Pending") },
              { value: "true", label: translate("Approved") },
            ],
          },
          {
            type: "select",
            key: "isDeceased",
            value: String(filterIsDeceased),
            onChange: (v) => setFilterIsDeceased(v === "true"),
            label: translate("Deceased"),
            options: [
              { value: "false", label: translate("Living") },
              { value: "true", label: translate("Arwah") },
            ],
          },
        ]}
      />

      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3.5 py-2.5">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-xs text-amber-800 dark:text-amber-300">
          {translate(
            "There is no reject action for pending registrations — to decline a registration, delete it instead.",
          )}
        </span>
      </div>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Full Name")}</TableHead>
                <TableHead>{translate("IC No")}</TableHead>
                <TableHead>{translate("Phone")}</TableHead>
                <TableHead>{translate("Mosque")}</TableHead>
                <TableHead className="text-center">
                  {translate("Deceased")}
                </TableHead>
                <TableHead>{translate("Registered")}</TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="text-center">
                    {translate("Action")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={9} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={9} />
              ) : (
                items.map((member) => (
                  <TableRow
                    key={member.id}
                    className={
                      !member.isapproved
                        ? "bg-amber-50 dark:bg-amber-900/10"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {member.fullname}
                    </TableCell>
                    <TableCell>{member.icnumber}</TableCell>
                    <TableCell>{member.phone ?? "—"}</TableCell>
                    <TableCell>{member.mosque?.name ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      {member.isdeceased ? translate("Yes") : translate("No")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {member.createdat
                        ? new Date(member.createdat).toLocaleDateString("ms-MY")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.isapproved ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {translate("Approved")}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          title={translate(
                            "There is no reject action — to decline this registration, delete it instead.",
                          )}
                        >
                          {translate("Pending")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {canEdit && (
                          <>
                            {!member.isapproved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openApproveCheck(member)}
                                title={translate("Approve Member")}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            {member.isdeceased && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReminderConfirm(member)}
                                title={translate("Send reminder notification")}
                              >
                                <Bell className="w-4 h-4 text-amber-500" />
                              </Button>
                            )}
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberToDelete(member);
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
            totalItems={total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className={`max-h-[90vh] overflow-y-auto dark:bg-slate-800 ${
            isdeceased ? "max-w-[80vw]" : "max-w-xl"
          }`}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 pr-8">
              <DialogTitle>
                {editingMember
                  ? translate("Edit Qariah Member")
                  : translate("Add Qariah Member")}
              </DialogTitle>
              {editingMember && (
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                    isApprovedLocal
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {isApprovedLocal
                    ? translate("Approved")
                    : translate("Pending")}
                </span>
              )}
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div
              className={`grid gap-6 ${isdeceased ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                    {translate("Status")}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isdeceased}
                        onCheckedChange={(v) => {
                          setValue("isdeceased", v);
                          if (v && !editingMember?.isdeceased) {
                            setValue(
                              "dateofdeath",
                              new Date().toISOString().split("T")[0],
                            );
                          }
                        }}
                        disabled={formDisabled}
                      />
                      <Label>{translate("Deceased")}</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                    {translate("Member Information")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInputForm
                      name="fullname"
                      control={control}
                      label={translate("Full Name")}
                      required
                      errors={errors}
                      disabled={formDisabled}
                    />
                    <TextInputForm
                      name="icnumber"
                      isICNumber
                      control={control}
                      label={translate("IC No.")}
                      required
                      errors={errors}
                      disabled={formDisabled}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInputForm
                      name="phone"
                      control={control}
                      required
                      isPhone
                      label={translate("Phone")}
                      errors={errors}
                      disabled={formDisabled}
                    />
                    <TextInputForm
                      name="email"
                      control={control}
                      label={translate("Email")}
                      isEmail
                      errors={errors}
                      disabled={formDisabled}
                    />
                  </div>
                  <TextInputForm
                    name="address"
                    control={control}
                    label={translate("Address")}
                    isTextArea
                    disabled={formDisabled}
                  />
                </div>

                {!editingMember && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                      {translate("Organisation & Mosque")}
                    </h3>
                    <div className="space-y-3">
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
                    </div>
                  </div>
                )}

                {editingMember && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                      {translate("Mosque")}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        ({translate("Organisation is auto-derived from mosque")}
                        )
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>{translate("State")}</Label>
                        <Select
                          value={dialogState || "_none"}
                          onValueChange={(v) => {
                            setDialogState(v === "_none" ? "" : v);
                            setSelectedMosqueId(null);
                            setSelectedMosqueName("");
                          }}
                          disabled={formDisabled}
                        >
                          <SelectTrigger
                            className="dark:bg-slate-700 dark:border-slate-600"
                            disabled={formDisabled}
                          >
                            <SelectValue
                              placeholder={translate("Select state")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">
                              {translate("— None —")}
                            </SelectItem>
                            {STATES_MY.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>
                          {translate("Mosque")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={mosqueComboOpen}
                          onOpenChange={setMosqueComboOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              disabled={
                                formDisabled ||
                                !dialogState ||
                                dialogMosquesLoading
                              }
                              className={`w-full justify-between dark:bg-slate-700 dark:border-slate-600 font-normal ${!selectedMosqueId && dialogState && !formDisabled ? "border-red-300" : ""}`}
                            >
                              <span className="truncate">
                                {selectedMosqueName ||
                                  (dialogState
                                    ? translate("Select mosque...")
                                    : translate("Select state first"))}
                              </span>
                              <ChevronsUpDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0">
                            <Command>
                              <CommandInput
                                placeholder={translate("Search mosque...")}
                              />
                              <CommandEmpty>
                                {translate("No mosque found.")}
                              </CommandEmpty>
                              <CommandGroup className="max-h-56 overflow-y-auto">
                                {dialogMosques.map((m) => (
                                  <CommandItem
                                    key={m.id}
                                    value={m.name}
                                    onSelect={() => {
                                      setSelectedMosqueId(m.id);
                                      setSelectedMosqueName(m.name);
                                      setMosqueComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`w-4 h-4 mr-2 ${selectedMosqueId === m.id ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {m.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {!dialogState && (
                          <p className="text-xs text-amber-500">
                            {translate("Select state to see mosques.")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isdeceased && (
                <div className="space-y-4 border-l pl-6 dark:border-slate-600">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                    {translate("Dead Person Details")}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

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

                  {/* Heir Name | Heir Phone */}
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                </div>
              )}
            </div>

            {formDisabled && (
              <p className="text-xs text-amber-600 dark:text-amber-400 -mt-2">
                {translate(
                  "There is no reject action — to decline this registration, delete it instead.",
                )}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Close")}
              </Button>
              {formDisabled ? (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => openApproveCheck(editingMember)}
                  disabled={isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {translate("Approve Member")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingMember ? translate("Save") : translate("Add Member")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={icCheckOpen} onOpenChange={setIcCheckOpen}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Check Qariah Membership")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextInputForm
                  name="icSearch"
                  control={icCheckControl}
                  label={translate("IC No.")}
                  isICNumber
                  placeholder={translate("Enter IC number")}
                />
              </div>
              <Button
                type="button"
                onClick={handleIcCheckSearch}
                disabled={icCheckSearching || !(icCheckInputValue ?? "").trim()}
                className="mb-0.5"
              >
                {icCheckSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {icCheckSearchedIc && !icCheckSearching && icCheckResult && (
              <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {translate("Registered Qariah Member")}
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {icCheckResult.fullname}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {icCheckResult.icnumber}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {translate("Mosque")}: {icCheckResult.mosque?.name ?? "—"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {translate("Organisation")}:{" "}
                  {icCheckResult.organisation?.name ?? "—"}
                </p>
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                    icCheckResult.isapproved
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {icCheckResult.isapproved
                    ? translate("Approved")
                    : translate("Pending")}
                </span>
              </div>
            )}

            {icCheckSearchedIc && !icCheckSearching && !icCheckResult && (
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {translate("No Records Found")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIcCheckOpen(false)}>
              {translate("Close")}
            </Button>
            {icCheckSearchedIc && !icCheckSearching && !icCheckResult && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleContinueRegistration}
              >
                {translate("Continue Registration")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!memberToApprove}
        onOpenChange={(open) => {
          if (!open) setMemberToApprove(null);
        }}
      >
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Approve Qariah Member")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{translate("IC No.")}</Label>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                {memberToApprove?.icnumber ?? "—"}
              </p>
            </div>

            {approveSearching && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {translate("Searching...")}
              </p>
            )}

            {approveSearchedIc &&
              !approveSearching &&
              approveResults.length > 0 && (
                <div className="space-y-2">
                  {approveResults.map((r) => (
                    <div
                      key={r.id}
                      className={`border rounded-lg p-3 space-y-1 ${
                        r.id === memberToApprove?.id
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {r.fullname}
                        {r.id === memberToApprove?.id && (
                          <span className="ml-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                            {translate("This Record")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {r.icnumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {translate("Mosque")}: {r.mosque?.name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {translate("Organisation")}:{" "}
                        {r.organisation?.name ?? "—"}
                      </p>
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.isapproved
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {r.isapproved
                          ? translate("Approved")
                          : translate("Pending")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {approveSearchedIc &&
              !approveSearching &&
              approveResults.length === 0 && (
                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {translate("No Records Found")}
                  </p>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={() => setMemberToApprove(null)}>
              {translate("Close")}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {translate("Approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Qariah Member")}
        description={
          memberToDelete?.deadperson?.id
            ? `${translate("Delete")} "${memberToDelete?.fullname}"? ${translate("This member has recorded arwah/grave information (shown publicly at the grave) that will also be permanently deleted.")}`
            : `${translate("Delete")} "${memberToDelete?.fullname}"?`
        }
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
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
        variant="destructive"
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
      />
    </div>
  );
}
