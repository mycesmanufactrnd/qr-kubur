import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { ClaimStatus, STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useDeathCharityClaimMutations, useGetDeathCharityClaimPaginated } from '@/hooks/useDeathCharityClaimMutations';
import { defaultDeathCharityClaimField } from '@/utils/defaultformfields';
import { validateFields } from '@/utils/validations';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import { Switch } from '@/components/ui/switch';
import { useGetDependentsByMember, useGetMemberByDeathCharity } from '@/hooks/useDeathCharityMemberMutations';
import { useGetDeathCharityByOrganisation } from '@/hooks/useDeathCharityMutations';

export default function ManageDeathCharityClaim() {
    const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();

    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlDeceasedName = searchParams.get('deceasedname') || '';

    const [tempDeceasedName, setTempDeceasedName] = useState(urlDeceasedName);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDeathCharityClaim, setEditingDeathCharityClaim] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deathCharityClaimToDelete, setDeathCharityClaimToDelete] = useState(null);

    const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('death_charity');

    const { deathCharityClaimList, totalPages, isLoading } = useGetDeathCharityClaimPaginated({
        page: urlPage,
        pageSize: itemsPerPage,
        filterDeceasedName: urlDeceasedName, 
    });
    const { createDeathCharityClaim, updateDeathCharityClaim, deleteDeathCharityClaim } = useDeathCharityClaimMutations();

    const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: defaultDeathCharityClaimField,
    });

    const selectedDeathCharity = watch('deathcharity');
    const selectedMember = watch('member');
    const selectedDependent = watch('dependent');

    const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();

    const { data: deathCharityMemberList = [], isLoading: isMemberLoading } = 
        useGetMemberByDeathCharity(selectedDeathCharity);
        
    const { data: memberDependentsList = [], isLoading: isDependentsLoading } = 
        useGetDependentsByMember(selectedMember);


    useEffect(() => {
        setTempDeceasedName(urlDeceasedName);
    }, [urlDeceasedName]);

    const handleSearch = () => {
        const params = { page: '1', deceasedname: '' };
        if (tempDeceasedName) params.deceasedname = tempDeceasedName;
        setSearchParams(params);
    };

    const handleReset = () => setSearchParams({});

    const openAddDialog = () => {
        setEditingDeathCharityClaim(null);
        reset(defaultDeathCharityClaimField);
        setIsDialogOpen(true);
    };

    const openEditDialog = (claim) => {
        setEditingDeathCharityClaim({ ...claim });
        reset({
            ...claim,
            member: claim.member?.id?.toString() ?? '',
            deathcharity: claim.deathcharity?.id?.toString() ?? '',
            dependent: claim.dependent?.id?.toString() ?? '',
        });
        setIsDialogOpen(true);
    };

    useEffect(() => {
        setValue('member', '');
    }, [selectedDeathCharity, setValue]);

    useEffect(() => {
        setValue('dependent', '');
    }, [selectedMember, setValue]);

    useEffect(() => {
        if (!editingDeathCharityClaim) return;

        setValue('member', editingDeathCharityClaim.member?.id?.toString() ?? '');
        setValue('dependent', editingDeathCharityClaim.dependent?.id?.toString() ?? '');
    }, [editingDeathCharityClaim, setValue]);

    useEffect(() => {
        if (selectedDependent) {
            const dep = memberDependentsList.find(d => d.id.toString() === selectedDependent.toString());
            if (dep) {
                setValue('deceasedname', dep.fullname || '');
                setValue('relationship', dep.relationship || 'dependent');
            }
            return;
        }

        if (selectedMember) {
            const member = deathCharityMemberList.find(m => m.id.toString() === selectedMember.toString());
            if (member) {
                setValue('deceasedname', member.fullname || '');
                setValue('relationship', 'member');
            }
        }
    }, [selectedMember, selectedDependent, deathCharityMemberList, memberDependentsList, setValue]);

    const onSubmit = async (formData) => {
        const isValid = validateFields(formData, [
            { field: 'deceasedname', label: 'Deceased Name', type: 'text' },
        ]);

        if (!isValid) return;

        const submitData = { 
            ...formData,
            payoutamount: Number(formData.payoutamount) || 0,
            deathcharity: formData.deathcharity ? { id: Number(formData.deathcharity) } : null,
            member: formData.member ? { id: Number(formData.member) } : null,
            dependent: formData.dependent ? { id: Number(formData.dependent) } : null,
        };

        try {
            if (editingDeathCharityClaim) {
                await updateDeathCharityClaim.mutateAsync({ id: editingDeathCharityClaim.id, data: submitData });
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
            console.error('Delete failed:', error);
        }
    };
  
    if (loadingUser || permissionsLoading) {
        return (
            <PageLoadingComponent/>
        );
    }

    if (!hasAdminAccess) {
        return (
            <AccessDeniedComponent/>
        );
    }

    if (!canView) {
        return (
            <div className="space-y-6">
                <Breadcrumb items={[
                { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
                { label: translate('Manage Death Charity Claim'), page: 'ManageDeathCharityClaim' }
                ]} />
                <AccessDeniedComponent/>
            </div>
        );
    }


  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Death Charity Claim'), page: 'ManageDeathCharityClaim' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Death Charity Claim')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Death Charity Claim')}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={tempDeceasedName}
                onChange={(e) => setTempDeceasedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" /> {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Deceased Name')}</TableHead>
                <TableHead className="text-center">{translate('Relationship')}</TableHead>
                <TableHead className="text-center">{translate('Payout Amount')}</TableHead>
                <TableHead className="text-center">{translate('Death Charity')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : deathCharityClaimList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                deathCharityClaimList.items.map(claim => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.deceasedname}</TableCell>
                    <TableCell className="text-center">{claim.relationship}</TableCell>
                    <TableCell className="text-center">{claim.payoutamount}</TableCell>
                    <TableCell className="text-center">{claim.deathcharity?.name ?? ''}</TableCell>
                    <TableCell className="text-center">
                        {canEdit && 
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(claim)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        }
                        {canDelete && 
                            <Button variant="ghost" size="sm" onClick={() => { 
                                setDeathCharityClaimToDelete(claim); 
                                setDeleteDialogOpen(true); }}
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        }
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
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={deathCharityClaimList.total}
          />
        )}
      </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingDeathCharityClaim ? translate('Edit Death Charity') : translate('Add Death Charity')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Death Charity Details
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <SelectForm
                                name="deathcharity"
                                control={control}
                                label={translate("Death Charity")}
                                placeholder={translate("All Managing Death Charity")}
                                options={deathCharityList.map(deathCharity => ({
                                    value: deathCharity.id,
                                    label: deathCharity.name,
                                }))}
                                required
                                errors={errors}
                            />
                        </div>
                        { selectedDeathCharity && (
                            <div className="grid grid-cols-1 gap-4">
                                <SelectForm
                                    name="member"
                                    control={control}
                                    label={translate("Death Charity Member")}
                                    placeholder={translate("All Death Charity Member")}
                                    options={deathCharityMemberList.map(member => ({
                                        value: member.id,
                                        label: member.fullname,
                                    }))}
                                />
                            </div>
                        )}

                        { selectedMember && memberDependentsList.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                                <SelectForm
                                    name="dependent"
                                    control={control}
                                    label={translate("Dependent")}
                                    placeholder={translate("Select Dependent")}
                                    options={memberDependentsList.map(dep => ({
                                        value: dep.id,
                                        label: dep.fullname,
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Basic Information
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
                                options={Object.values(ClaimStatus).map(status => ({
                                    value: status,
                                    label: status
                                }))}
                                required
                                errors={errors}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={createDeathCharityClaim.isPending || updateDeathCharityClaim.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                            {translate('Save')}
                        </Button>
                    </DialogFooter>
                    </form>
            </DialogContent>
        </Dialog>

        <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={translate('Delete Death Charity')}
            description={`${translate('Delete')} "${deathCharityClaimToDelete?.deceasedname}"?`}
            onConfirm={confirmDelete}
            confirmText={translate('Delete')}
            variant="destructive"
        />
    </div>
  );
}
