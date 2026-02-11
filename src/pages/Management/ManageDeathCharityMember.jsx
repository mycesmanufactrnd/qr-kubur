import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save, UserPlus } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCrudPermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetDeathCharityMemberPaginated, useDeathCharityMemberMutations, useGetDeathCharityByOrganisation } from '@/hooks/useDeathCharityMemberMutations';
import { defaultDeathCharityMemberField } from '@/utils/defaultformfields';
import { validateFields } from '@/utils/validations';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import { Switch } from '@/components/ui/switch';

export default function ManageDeathCharityMember() {
  const { loadingUser, currentUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlFullName = searchParams.get('fullname') || '';

  const [tempFullName, setTempFullName] = useState(urlFullName);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeathCharityMember, setEditingDeathCharityMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deathCharityMemberToDelete, setDeathCharityMemberToDelete] = useState(null);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('death_charity');

  const { deathCharityMemberList, totalPages, isLoading } = useGetDeathCharityMemberPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterFullName: urlFullName, 
  });

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();
  
  const { createDeathCharityMember, updateDeathCharityMember, deleteDeathCharityMember } = useDeathCharityMemberMutations();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultDeathCharityMemberField,
  });

    const isactive = watch("isactive");

  useEffect(() => {
    setTempFullName(urlFullName);
  }, [urlFullName]);

  const handleSearch = () => {
    const params = { page: '1', fullname: '' };
    if (tempFullName) params.fullname = tempFullName;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const openAddDialog = () => {
    setEditingDeathCharityMember(null);
    reset(defaultDeathCharityMemberField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (deathCharityMember) => {
    setEditingDeathCharityMember({ ...deathCharityMember });
    reset({
        ...deathCharityMember,
        deathcharity: deathCharityMember.deathcharity?.id?.toString() ?? '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'fullname', label: 'Full Name', type: 'text' },
    ]);

    if (!isValid) return;

    const submitData = { 
        ...formData,
        deathcharity: formData.deathcharity ? { id: Number(formData.deathcharity) } : null,
    };

    try {
      if (editingDeathCharityMember) {
        await updateDeathCharityMember.mutateAsync({ id: editingDeathCharityMember.id, data: submitData });
      } else {
        await createDeathCharityMember.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!deathCharityMemberToDelete) return;

    try {
      await deleteDeathCharityMember.mutateAsync(deathCharityMemberToDelete.id);
      setDeleteDialogOpen(false);
      setDeathCharityMemberToDelete(null);
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
          { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Death Charity Member')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Death Charity Member')}
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
                value={tempFullName}
                onChange={(e) => setTempFullName(e.target.value)}
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
                <TableHead>{translate('Full Name')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('IC Number')}</TableHead>
                <TableHead className="text-center">{translate('Phone No.')}</TableHead>
                <TableHead className="text-center">{translate('Active')}</TableHead>
                <TableHead className="text-center">{translate('Death Charity')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : deathCharityMemberList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                deathCharityMemberList.items.map(member => {
                  
                  const hasCoverage =
                    !!member.deathcharity &&
                    (member.deathcharity.coverschildren || member.deathcharity.coversspouse);

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.fullname}</TableCell>
                      <TableCell className="text-center">{member.icnumber}</TableCell>
                      <TableCell className="text-center">{member.phone}</TableCell>
                      <TableCell className="text-center">{member.organisation?.name ?? ''}</TableCell>
                      <TableCell className="text-center">{member.isactive ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-center">
                        {member.deathcharity?.name ?? ''}
                      </TableCell>

                      <TableCell className="text-center">
                        {(canEdit || canDelete) && (
                          <div className="flex justify-center gap-1">
                            {canEdit && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm"
                                  onClick={() => openEditDialog(member)}
                                >
                                  <UserPlus className="w-4 h-4 text-green-500" />
                                </Button>
                              </>
                            )}

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeathCharityMemberToDelete(member);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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
            totalItems={deathCharityMemberList.total}
          />
        )}
      </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingDeathCharityMember ? translate('Edit Death Charity Member') : translate('Add Death Charity Member')}
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
                    />
                    </div>
                </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Member Information
                        </h3>
                        <TextInputForm
                            name="fullname"
                            control={control}
                            label={translate("Full Name")}
                            required
                            errors={errors}
                        />
                        <div className="grid grid-cols-2 gap-4">
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
                                required
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
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                            Status
                        </h3>
                        <div className="flex items-center gap-2">
                        <Switch
                            checked={isactive}
                            onCheckedChange={(v) => setValue('isactive', v)}
                        />
                        <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={createDeathCharityMember.isPending || updateDeathCharityMember.isPending}>
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
            title={translate('Delete Death Charity Member')}
            description={`${translate('Delete')} "${deathCharityMemberToDelete?.name}"?`}
            onConfirm={confirmDelete}
            confirmText={translate('Delete')}
            variant="destructive"
        />
    </div>
  );
}
