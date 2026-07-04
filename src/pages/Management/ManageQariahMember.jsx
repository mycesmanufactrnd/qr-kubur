// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import MobileManageQariahMember from "@/pages/Mobile/ManageQariahMember";
import { useState, useEffect } from "react";
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
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { STATES_MY } from "@/utils/enums";

const DEFAULT_FORM = {
  fullname: "",
  icnumber: "",
  phone: "",
  email: "",
  address: "",
  isdeceased: false,
  // Create dialog — org & mosque picker
  createOrgId: null,
  createMosqueId: null,
  // Dead person fields (populated when marking member deceased)
  grave: "",
  gravelot: "",
  causeofdeath: "",
  dateofdeath: "",
  dateofbirth: "",
  heirname: "",
  heirphoneno: "",
};

export default function ManageQariahMember() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageQariahMember /> : <ManageQariahMemberDesktop />;
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
  const urlOrgId = searchParams.get("organisationId")
    ? parseInt(searchParams.get("organisationId"))
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
  const [filterState, setFilterState] = useState("");
  const [filterOrgId, setFilterOrgId] = useState(urlOrgId ?? null);
  const [filterIsApproved, setFilterIsApproved] = useState(urlIsApproved);
  const [filterIsDeceased, setFilterIsDeceased] = useState(urlIsDeceased);
  const [filterOrgOpen, setFilterOrgOpen] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Dialog state — null = create mode, object = edit mode
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isApprovedLocal, setIsApprovedLocal] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [memberToApprove, setMemberToApprove] = useState(null);
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);
  const [notifyConfirmMode, setNotifyConfirmMode] = useState(null);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [notifyReminderMember, setNotifyReminderMember] = useState(null);

  // Edit dialog — state + mosque picker (org auto-derived from mosque on save)
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
  } = useForm({ defaultValues: DEFAULT_FORM });

  const isdeceased = watch("isdeceased");
  const createOrgIdValue = watch("createOrgId");

  useEffect(() => {
    setTempFullName(urlFullName);
  }, [urlFullName]);

  const { data, isLoading, refetch } =
    trpc.deathCharityMember.getQariahPaginated.useQuery({
      page: urlPage,
      pageSize: itemsPerPage,
      filterFullName: urlFullName || null,
      filterOrganisationId: urlOrgId || null,
      filterIsApproved: urlIsApproved,
      filterIsDeceased: urlIsDeceased,
    });

  // Organisations for top filter and create dialog — scoped by user's own org
  const { data: allOrganisations = [] } =
    trpc.deathCharityMember.getOrganisations.useQuery({
      state: filterState || null,
      organisationId: userOrgId,
    });

  // Mosques for create dialog — filtered by selected org
  const { data: createMosques = [], isLoading: createMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: createOrgIdValue },
      { enabled: isDialogOpen && !editingMember && !!createOrgIdValue },
    );

  // Reset the chosen mosque whenever the create-dialog organisation changes
  useEffect(() => {
    setValue("createMosqueId", null);
  }, [createOrgIdValue]);

  // Mosques for edit dialog — filtered by state
  const { data: dialogMosques = [], isLoading: dialogMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { state: dialogState || null },
      { enabled: isDialogOpen && !!editingMember },
    );

  // Graves for deceased assignment (filtered by organisation)
  const deceasedOrgId =
    createOrgIdValue ?? editingMember?.organisation?.id ?? userOrgId ?? null;
  const { gravesList: deceasedGraves = { items: [] } } = useGetGravePaginated({
    organisationIds: deceasedOrgId ? [deceasedOrgId] : undefined,
    pageSize: 1000,
  });

  // Load existing DeadPerson record when editing a deceased member
  const { data: existingDeadPerson } = trpc.deadperson.getByIcNumber.useQuery(
    { icnumber: editingMember?.icnumber ?? "" },
    {
      enabled:
        isDialogOpen &&
        !!editingMember?.isdeceased &&
        !!editingMember?.icnumber,
    },
  );

  useEffect(() => {
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
  }, [existingDeadPerson, isDialogOpen, editingMember?.isdeceased]);

  const upsertDeadPersonMutation = trpc.deadperson.upsertForQariah.useMutation({
    onSuccess: () => {
      showSuccess(translate("Dead person recorded"), "success");
    },
    onError: (err) => showApiError(err),
  });

  const [uploadingCert, setUploadingCert] = useState(false);

  const handleFileUpload = async (file, bucketName) => {
    setUploadingCert(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      // append current user info if helper available
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
    if (filterOrgId) params.organisationId = filterOrgId.toString();
    if (filterIsApproved !== null) params.isApproved = String(filterIsApproved);
    if (filterIsDeceased !== null) params.isDeceased = String(filterIsDeceased);
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempFullName("");
    setFilterState("");
    setFilterOrgId(null);
    setFilterIsApproved(null);
    setFilterIsDeceased(null);
    setSearchParams({});
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setIsApprovedLocal(true);
    reset(DEFAULT_FORM);
    setIsDialogOpen(true);
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

    // Upsert DeadPerson record whenever isdeceased is true
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
      });
    }

    // Close dialog and refresh table after all mutations complete
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

    if (isMarkingDeceased) {
      setPendingSubmitData({ formData });
      setNotifyConfirmMode("deceased");
      setNotifyConfirmOpen(true);
      return;
    }

    await submitMember(formData, false);
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
    await deleteMutation.mutateAsync(memberToDelete.id);
  };

  const openReminderConfirm = (member) => {
    setNotifyReminderMember(member);
    setNotifyConfirmMode("reminder");
    setNotifyConfirmOpen(true);
  };

  const selectedFilterOrgName = filterOrgId
    ? (allOrganisations.find((o) => o.id === filterOrgId)?.name ?? "")
    : "";

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    upsertDeadPersonMutation.isPending ||
    approveMutation.isPending;
  const formDisabled = !!(editingMember && !isApprovedLocal);
  const colSpan = canEdit || canDelete ? 10 : 9;

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
              onClick={openCreateDialog}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {translate("Add Member")}
            </Button>
          )}
        </div>
      </div>

      <SearchBar
        value={tempFullName}
        onChange={setTempFullName}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder={translate("Search by name...")}
        filtersClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        <Select
          value={filterState || "_all"}
          onValueChange={(v) => {
            setFilterState(v === "_all" ? "" : v);
            setFilterOrgId(null);
          }}
        >
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("All States")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{translate("All States")}</SelectItem>
            {STATES_MY.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={filterOrgOpen} onOpenChange={setFilterOrgOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 font-normal"
            >
              <span className="truncate">
                {filterOrgId
                  ? selectedFilterOrgName
                  : translate("All Organisations")}
              </span>
              <ChevronsUpDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder={translate("Search organisation...")} />
              <CommandEmpty>{translate("No organisation found.")}</CommandEmpty>
              <CommandGroup className="max-h-56 overflow-y-auto">
                <CommandItem
                  value="__all"
                  onSelect={() => {
                    setFilterOrgId(null);
                    setFilterOrgOpen(false);
                  }}
                >
                  <Check
                    className={`w-4 h-4 mr-2 ${!filterOrgId ? "opacity-100" : "opacity-0"}`}
                  />
                  {translate("All Organisations")}
                </CommandItem>
                {allOrganisations.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => {
                      setFilterOrgId(o.id);
                      setFilterOrgOpen(false);
                    }}
                  >
                    <Check
                      className={`w-4 h-4 mr-2 ${filterOrgId === o.id ? "opacity-100" : "opacity-0"}`}
                    />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Select
          value={filterIsApproved === null ? "_all" : String(filterIsApproved)}
          onValueChange={(v) =>
            setFilterIsApproved(v === "_all" ? null : v === "true")
          }
        >
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("All Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{translate("All Status")}</SelectItem>
            <SelectItem value="false">{translate("Pending")}</SelectItem>
            <SelectItem value="true">{translate("Approved")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterIsDeceased === null ? "_all" : String(filterIsDeceased)}
          onValueChange={(v) =>
            setFilterIsDeceased(v === "_all" ? null : v === "true")
          }
        >
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("All Members")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{translate("All Members")}</SelectItem>
            <SelectItem value="false">{translate("Living")}</SelectItem>
            <SelectItem value="true">{translate("Arwah")}</SelectItem>
          </SelectContent>
        </Select>
      </SearchBar>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Full Name")}</TableHead>
                <TableHead>{translate("IC No")}</TableHead>
                <TableHead>{translate("Phone")}</TableHead>
                <TableHead>{translate("Email")}</TableHead>
                <TableHead>{translate("Organisation")}</TableHead>
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
                <InlineLoadingComponent isTable colSpan={colSpan} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={colSpan} />
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
                    <TableCell>{member.email ?? "—"}</TableCell>
                    <TableCell>{member.organisation?.name ?? "—"}</TableCell>
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
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {translate("Pending")}
                        </span>
                      )}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {canEdit && (
                            <>
                              {!member.isapproved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMemberToApprove(member);
                                    setApproveConfirmOpen(true);
                                  }}
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
                                  title={translate(
                                    "Send reminder notification",
                                  )}
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
                    )}
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
                        onCheckedChange={(v) => setValue("isdeceased", v)}
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
                  <TextInputForm
                    name="fullname"
                    control={control}
                    label={translate("Full Name")}
                    required
                    errors={errors}
                    disabled={formDisabled}
                  />
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Mosque — Edit mode */}
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

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Cancel")}
              </Button>
              {formDisabled ? (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleApprove(editingMember.id)}
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
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Qariah Member")}
        description={`${translate("Delete")} "${memberToDelete?.fullname}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
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
