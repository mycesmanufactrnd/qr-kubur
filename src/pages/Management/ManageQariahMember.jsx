// @ts-nocheck
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Users, Trash2, Edit, Save, ChevronsUpDown, Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchBar from "@/components/forms/SearchBar";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandInput, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import TextInputForm from "@/components/forms/TextInputForm";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { STATES_MY } from "@/utils/enums";

const DEFAULT_FORM = {
  fullname: "",
  icnumber: "",
  phone: "",
  email: "",
  address: "",
  isactive: true,
};

export default function ManageQariahMember() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const { loading: permissionsLoading, canView, canEdit, canDelete } =
    useCrudPermissions("death_charity");

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlFullName = searchParams.get("fullname") || "";
  const urlMosqueId = searchParams.get("mosqueId")
    ? parseInt(searchParams.get("mosqueId"))
    : null;

  const [tempFullName, setTempFullName] = useState(urlFullName);
  const [filterState, setFilterState] = useState("");
  const [filterMosqueId, setFilterMosqueId] = useState(urlMosqueId ?? null);
  const [filterMosqueOpen, setFilterMosqueOpen] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Edit dialog mosque state
  const [dialogState, setDialogState] = useState("");
  const [mosqueComboOpen, setMosqueComboOpen] = useState(false);
  const [selectedMosqueId, setSelectedMosqueId] = useState(null);
  const [selectedMosqueName, setSelectedMosqueName] = useState("");

  useEffect(() => { setTempFullName(urlFullName); }, [urlFullName]);

  const { data, isLoading, refetch } = trpc.deathCharityMember.getQariahPaginated.useQuery({
    page: urlPage,
    pageSize: itemsPerPage,
    filterFullName: urlFullName || null,
    filterMosqueId: urlMosqueId || null,
  });

  // Mosques for the top filter (filtered by filterState, or all if empty)
  const { data: filterMosques = [] } = trpc.deathCharityMember.getMosquesByState.useQuery({
    state: filterState || null,
  });

  // Mosques for the edit dialog (filtered by dialogState)
  const { data: dialogMosques = [], isLoading: dialogMosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { state: dialogState || null },
      { enabled: isDialogOpen },
    );

  const updateMutation = trpc.deathCharityMember.update.useMutation({
    onSuccess: () => {
      showSuccess(translate("Saved"), "success");
      refetch();
      setIsDialogOpen(false);
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

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_FORM });

  const isactive = watch("isactive");

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleSearch = () => {
    const params = { page: "1" };
    if (tempFullName) params.fullname = tempFullName;
    if (filterMosqueId) params.mosqueId = filterMosqueId.toString();
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempFullName("");
    setFilterState("");
    setFilterMosqueId(null);
    setSearchParams({});
  };

  const openEditDialog = (member) => {
    setEditingMember(member);
    reset({
      fullname: member.fullname ?? "",
      icnumber: member.icnumber ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      address: member.address ?? "",
      isactive: member.isactive ?? true,
    });
    setDialogState(member.mosque?.state ?? "");
    setSelectedMosqueId(member.mosque?.id ?? null);
    setSelectedMosqueName(member.mosque?.name ?? "");
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    if (!editingMember) return;
    await updateMutation.mutateAsync({
      id: editingMember.id,
      data: {
        ...formData,
        mosque: selectedMosqueId ? { id: selectedMosqueId } : null,
      },
    });
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    await deleteMutation.mutateAsync(memberToDelete.id);
  };

  const selectedFilterMosqueName = filterMosqueId
    ? (filterMosques.find((m) => m.id === filterMosqueId)?.name ?? "")
    : "";

  const colSpan = canEdit || canDelete ? 8 : 7;

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Manage Qariah Members"), page: "ManageQariahMember" },
      ]} />
      <AccessDeniedComponent />
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate("Admin Dashboard"), page: "AdminDashboard" },
        { label: translate("Manage Qariah Members"), page: "ManageQariahMember" },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          {translate("Manage Qariah Members")}
        </h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {translate("Total")}: {total}
        </span>
      </div>

      <SearchBar
        value={tempFullName}
        onChange={setTempFullName}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder={translate("Search by name...")}
        filtersClassName="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <Select
          value={filterState || "_all"}
          onValueChange={(v) => {
            setFilterState(v === "_all" ? "" : v);
            setFilterMosqueId(null);
          }}
        >
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder={translate("All States")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{translate("All States")}</SelectItem>
            {STATES_MY.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={filterMosqueOpen} onOpenChange={setFilterMosqueOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 font-normal"
            >
              <span className="truncate">
                {filterMosqueId ? selectedFilterMosqueName : translate("All Mosques")}
              </span>
              <ChevronsUpDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder={translate("Search mosque...")} />
              <CommandEmpty>{translate("No mosque found.")}</CommandEmpty>
              <CommandGroup className="max-h-56 overflow-y-auto">
                <CommandItem
                  value="__all"
                  onSelect={() => { setFilterMosqueId(null); setFilterMosqueOpen(false); }}
                >
                  <Check className={`w-4 h-4 mr-2 ${!filterMosqueId ? "opacity-100" : "opacity-0"}`} />
                  {translate("All Mosques")}
                </CommandItem>
                {filterMosques.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={m.name}
                    onSelect={() => { setFilterMosqueId(m.id); setFilterMosqueOpen(false); }}
                  >
                    <Check className={`w-4 h-4 mr-2 ${filterMosqueId === m.id ? "opacity-100" : "opacity-0"}`} />
                    {m.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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
                <TableHead>{translate("Mosque")}</TableHead>
                <TableHead className="text-center">{translate("Active")}</TableHead>
                <TableHead>{translate("Registered")}</TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="text-center">{translate("Action")}</TableHead>
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
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.fullname}</TableCell>
                    <TableCell>{member.icnumber}</TableCell>
                    <TableCell>{member.phone ?? "—"}</TableCell>
                    <TableCell>{member.email ?? "—"}</TableCell>
                    <TableCell>{member.mosque?.name ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      {member.isactive ? translate("Yes") : translate("No")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {member.createdat
                        ? new Date(member.createdat).toLocaleDateString("ms-MY")
                        : "—"}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
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
              setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: "1" });
            }}
            totalItems={total}
          />
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Edit Qariah Member")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              />
              <div className="grid grid-cols-3 gap-4">
                <TextInputForm
                  name="icnumber"
                  control={control}
                  label={translate("IC No.")}
                  required
                  errors={errors}
                />
                <TextInputForm
                  name="phone"
                  control={control}
                  label={translate("Phone")}
                  errors={errors}
                />
                <TextInputForm
                  name="email"
                  control={control}
                  label={translate("Email")}
                  isEmail
                  errors={errors}
                />
              </div>
              <TextInputForm
                name="address"
                control={control}
                label={translate("Address")}
                isTextArea
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                {translate("Mosque")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{translate("State")}</Label>
                  <Select
                    value={dialogState || "_none"}
                    onValueChange={(v) => {
                      setDialogState(v === "_none" ? "" : v);
                      setSelectedMosqueId(null);
                      setSelectedMosqueName("");
                    }}
                  >
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                      <SelectValue placeholder={translate("Select state")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{translate("— None —")}</SelectItem>
                      {STATES_MY.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{translate("Mosque")}</Label>
                  <Popover open={mosqueComboOpen} onOpenChange={setMosqueComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={!dialogState || dialogMosquesLoading}
                        className="w-full justify-between dark:bg-slate-700 dark:border-slate-600 font-normal"
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
                        <CommandInput placeholder={translate("Search mosque...")} />
                        <CommandEmpty>{translate("No mosque found.")}</CommandEmpty>
                        <CommandGroup className="max-h-56 overflow-y-auto">
                          <CommandItem
                            value="__none"
                            onSelect={() => {
                              setSelectedMosqueId(null);
                              setSelectedMosqueName("");
                              setMosqueComboOpen(false);
                            }}
                          >
                            <Check
                              className={`w-4 h-4 mr-2 ${!selectedMosqueId ? "opacity-100" : "opacity-0"}`}
                            />
                            {translate("— None —")}
                          </CommandItem>
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                {translate("Status")}
              </h3>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isactive}
                  onCheckedChange={(v) => setValue("isactive", v)}
                />
                <Label>{translate("Active")}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Qariah Member")}
        description={`${translate("Delete")} "${memberToDelete?.fullname}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
