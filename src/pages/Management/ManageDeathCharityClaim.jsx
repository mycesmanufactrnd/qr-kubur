// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { translate } from "@/utils/translations";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SearchBar from "@/components/forms/SearchBar";
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
import { useCrudPermissions } from "@/components/PermissionsContext";
import { ClaimStatus, STATES_MY } from "@/utils/enums";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import {
  useDeathCharityClaimMutations,
  useGetDeathCharityClaimPaginated,
} from "@/mutations/useDeathCharityClaimMutations";
import { defaultDeathCharityClaimField } from "@/utils/defaultformfields";
import { validateFields } from "@/utils/validations";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import {
  useGetDependentsByMember,
  useGetMemberByDeathCharity,
} from "@/mutations/useDeathCharityMemberMutations";
import { useGetDeathCharityByOrganisation } from "@/mutations/useDeathCharityMutations";

export default function ManageDeathCharityClaim() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    currentUserStates,
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlDeceasedName = searchParams.get("deceasedname") || "";
  const urlSortField = searchParams.get("sortField") || "";
  const urlSortOrder = searchParams.get("sortOrder") || "";

  const [tempDeceasedName, setTempDeceasedName] = useState(urlDeceasedName);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeathCharityClaim, setEditingDeathCharityClaim] =
    useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deathCharityClaimToDelete, setDeathCharityClaimToDelete] =
    useState(null);

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("death_charity");

  const { deathCharityClaimList, totalPages, isLoading } =
    useGetDeathCharityClaimPaginated({
      page: urlPage,
      pageSize: itemsPerPage,
      filterDeceasedName: urlDeceasedName,
      sortField: urlSortField || undefined,
      sortOrder:
        urlSortOrder === "ASC" || urlSortOrder === "DESC"
          ? urlSortOrder
          : undefined,
    });
  const {
    createDeathCharityClaim,
    updateDeathCharityClaim,
    deleteDeathCharityClaim,
  } = useDeathCharityClaimMutations();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultDeathCharityClaimField,
  });

  const selectedDeathCharity = watch("deathcharity");
  const selectedMember = watch("member");
  const selectedDependent = watch("dependent");

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();

  const { data: deathCharityMemberList = [], isLoading: isMemberLoading } =
    useGetMemberByDeathCharity(selectedDeathCharity);

  const { data: memberDependentsList = [], isLoading: isDependentsLoading } =
    useGetDependentsByMember(selectedMember);

  useEffect(() => {
    setTempDeceasedName(urlDeceasedName);
  }, [urlDeceasedName]);

  const handleSearch = () => {
    const params = { page: "1", deceasedname: "" };
    if (tempDeceasedName) params.deceasedname = tempDeceasedName;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const handleSort = (field) => {
    const newOrder =
      urlSortField === field && urlSortOrder === "ASC" ? "DESC" : "ASC";
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: "1",
      sortField: field,
      sortOrder: newOrder,
    });
  };

  const SortIcon = ({ field }) => {
    if (urlSortField !== field)
      return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return urlSortOrder === "ASC" ? (
      <ChevronUp className="w-3 h-3 ml-1 text-emerald-500" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 text-emerald-500" />
    );
  };

  const openAddDialog = () => {
    setEditingDeathCharityClaim(null);
    reset(defaultDeathCharityClaimField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (claim) => {
    setEditingDeathCharityClaim({ ...claim });
    reset({
      ...claim,
      member: claim.member?.id?.toString() ?? "",
      deathcharity: claim.deathcharity?.id?.toString() ?? "",
      dependent: claim.dependent?.id?.toString() ?? "",
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    setValue("member", "");
  }, [selectedDeathCharity, setValue]);

  useEffect(() => {
    setValue("dependent", "");
  }, [selectedMember, setValue]);

  useEffect(() => {
    if (!editingDeathCharityClaim) return;

    setValue("member", editingDeathCharityClaim.member?.id?.toString() ?? "");
    setValue(
      "dependent",
      editingDeathCharityClaim.dependent?.id?.toString() ?? "",
    );
  }, [editingDeathCharityClaim, setValue]);

  useEffect(() => {
    if (selectedDependent) {
      const dep = memberDependentsList.find(
        (d) => d.id.toString() === selectedDependent.toString(),
      );
      if (dep) {
        setValue("deceasedname", dep.fullname || "");
        setValue("relationship", dep.relationship || "dependent");
      }
      return;
    }

    if (selectedMember) {
      const member = deathCharityMemberList.find(
        (m) => m.id.toString() === selectedMember.toString(),
      );
      if (member) {
        setValue("deceasedname", member.fullname || "");
        setValue("relationship", "member");
      }
    }
  }, [
    selectedMember,
    selectedDependent,
    deathCharityMemberList,
    memberDependentsList,
    setValue,
  ]);

  const onSubmit = async (formData) => {
    const submitData = {
      ...formData,
      payoutamount: Number(formData.payoutamount) || 0,
      deathcharity: formData.deathcharity
        ? { id: Number(formData.deathcharity) }
        : null,
      member: formData.member ? { id: Number(formData.member) } : null,
      dependent: formData.dependent ? { id: Number(formData.dependent) } : null,
    };

    try {
      if (editingDeathCharityClaim) {
        await updateDeathCharityClaim.mutateAsync({
          id: editingDeathCharityClaim.id,
          data: submitData,
        });
      } else {
        await createDeathCharityClaim.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!deathCharityClaimToDelete) return;

    try {
      await deleteDeathCharityClaim.mutateAsync(deathCharityClaimToDelete.id);
      setDeleteDialogOpen(false);
      setDeathCharityClaimToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            {
              label: translate("Manage Death Charity Claim"),
              page: "ManageDeathCharityClaim",
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
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          {
            label: translate("Manage Death Charity Claim"),
            page: "ManageDeathCharityClaim",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate("Manage Death Charity Claim")}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              onClick={openAddDialog}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translate("Add Death Charity Claim")}
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
            key: "deceasedName",
            value: tempDeceasedName,
            onChange: setTempDeceasedName,
            label: translate("Deceased Name"),
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("deceasedname")}
                >
                  <span className="flex items-center">
                    {translate("Deceased Name")}
                    <SortIcon field="deceasedname" />
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  {translate("Relationship")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none"
                  onClick={() => handleSort("payoutamount")}
                >
                  <span className="flex items-center justify-center">
                    {translate("Payout Amount")}
                    <SortIcon field="payoutamount" />
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  {translate("Death Charity")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : deathCharityClaimList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                deathCharityClaimList.items.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">
                      {claim.deceasedname}
                    </TableCell>
                    <TableCell className="text-center">
                      {claim.relationship}
                    </TableCell>
                    <TableCell className="text-center">
                      {claim.payoutamount}
                    </TableCell>
                    <TableCell className="text-center">
                      {claim.deathcharity?.name ?? ""}
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(claim)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeathCharityClaimToDelete(claim);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
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
            totalItems={deathCharityClaimList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingDeathCharityClaim
                ? translate("Edit Death Charity")
                : translate("Add Death Charity")}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                  {translate("Death Charity Details")}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <SelectForm
                    name="deathcharity"
                    control={control}
                    label={translate("Death Charity")}
                    placeholder={translate("All Managing Death Charity")}
                    options={deathCharityList.map((deathCharity) => ({
                      value: deathCharity.id,
                      label: deathCharity.name,
                    }))}
                    required
                    errors={errors}
                  />
                </div>
                {selectedDeathCharity && (
                  <div className="grid grid-cols-1 gap-4">
                    <SelectForm
                      name="member"
                      control={control}
                      label={translate("Death Charity Member")}
                      placeholder={translate("All Death Charity Member")}
                      options={deathCharityMemberList.map((member) => ({
                        value: member.id,
                        label: member.fullname,
                      }))}
                    />
                  </div>
                )}

                {selectedMember && memberDependentsList.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    <SelectForm
                      name="dependent"
                      control={control}
                      label={translate("Dependent")}
                      placeholder={translate("Select Dependent")}
                      options={memberDependentsList.map((dep) => ({
                        value: dep.id,
                        label: dep.fullname,
                      }))}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                  {translate("Basic Information")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="deceasedname"
                    control={control}
                    label={translate("Deceased Name")}
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="relationship"
                    control={control}
                    label={translate("Relationship")}
                    required
                    errors={errors}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="payoutamount"
                    control={control}
                    label={translate("Payout Amount")}
                    isMoney
                    required
                    errors={errors}
                  />
                  <SelectForm
                    name="status"
                    control={control}
                    label={translate("Status")}
                    placeholder={translate("Select status")}
                    options={Object.values(ClaimStatus).map((status) => ({
                      value: status,
                      label: status,
                    }))}
                    required
                    errors={errors}
                  />
                </div>
              </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Close")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createDeathCharityClaim.isPending ||
                  updateDeathCharityClaim.isPending
                }
              >
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
        title={translate("Delete Death Charity")}
        description={`${translate("Delete")} "${deathCharityClaimToDelete?.deceasedname}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
