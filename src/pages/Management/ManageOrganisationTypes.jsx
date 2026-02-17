import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag, Plus, Edit, Trash2, Save, Search, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useAdminAccess } from '@/utils/auth';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetOrganisationTypePaginated, useOrganisationTypeMutations } from '@/hooks/useOrganisationTypeMutations';
import { translate } from '@/utils/translations';
import { ActiveInactiveStatus } from '@/utils/enums';
import { defaultOrganisationTypeField } from '@/utils/defaultformfields';
import { useForm } from 'react-hook-form';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';

export default function ManageOrganisationTypes() {
  const { loadingUser, isSuperAdmin, hasAdminAccess } = useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const [tempName, setTempName] = useState(urlName);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState({ id: null });

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }} = useForm({
    defaultValues: defaultOrganisationTypeField
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  useEffect(() => {
    setTempName(urlName);
  }, [urlName]);
  
  const { organisationTypeList, totalPages, isLoading } = useGetOrganisationTypePaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
  });

  const { createOrganisationType, updateOrganisationType, deleteOrganisationType } = useOrganisationTypeMutations();

  const handleSearch = () => {
    const params = { page: '1', name: '' };
    if (tempName) params.name = tempName;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingType({ id: null });
    reset(defaultOrganisationTypeField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (type) => {
    setEditingType({ id: type.id });
    reset({
      ...type,
      status: type.status || ActiveInactiveStatus.ACTIVE
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    try {
      if (editingType && editingType.id) {
        await updateOrganisationType.mutateAsync({ id: Number(editingType.id), ...formData });
      } else {
        await createOrganisationType.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = () => {
    if (!typeToDelete) return;
    deleteOrganisationType.mutate({ id: typeToDelete.id }, {
      onSuccess: () => setDeleteDialogOpen(false)
    });
  };

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    )
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' },
        { label: translate('Organisation Type'), page: 'ManageOrganisationTypes' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" /> 
          {translate('Manage Organisation Types')}
        </h1>
        <Button onClick={openAddDialog} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          {translate('Add Type')}
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search organization type name...')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 px-6">
              {translate('Search')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
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
                <TableHead>{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Description')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4}/>
              ) : organisationTypeList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4}/>
              ) : (
                organisationTypeList.items.map(type => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-center">{type.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={type.status === 'active' ? 'default' : 'secondary'}>
                        {type.status === 'active' ? translate('Active') : translate('Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setTypeToDelete(type); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
            totalItems={organisationTypeList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>
              {editingType ? translate('Edit Organization Type') : translate('Add New Organization Type')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            /> 
            <TextInputForm
              name="description"
              control={control}
              label={translate("Description")}
              isTextArea
            /> 
            <SelectForm
              name="status"
              control={control}
              placeholder={translate("Select status")}
              label={translate("Status")}
              options={Object.values(ActiveInactiveStatus).map((status) => ({
                value: status,
                label: status.toUpperCase(),
              }))}
              required
              errors={errors}
            />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createOrganisationType.isPending || updateOrganisationType.isPending || isSubmitting} 
                className="bg-purple-600">
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
        title={translate('Delete Organization Type')} 
        description={`${translate('Are you sure you want to delete')} "${typeToDelete?.name}"?`} 
        onConfirm={confirmDelete} 
        variant="destructive" 
      />
    </div>
  );
}