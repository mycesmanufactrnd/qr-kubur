import { useState } from 'react';
import { translate } from '@/utils/translations';
import { Building2, Plus, Edit, Trash2, Search, Save, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm, Controller } from "react-hook-form";
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PaymentConfigDialog from '@/components/PaymentConfigDialog';
import { getLabelFromId } from '@/utils/helpers';
import { STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { useGetOrganisationType } from '@/hooks/useOrganisationTypeMutations';
import { useCreateOrganisation, useDeleteOrganisation, useGetOrganisationPaginated, useUpdateOrganisation } from '@/hooks/useOrganisationMutations';

import { validateFields } from '@/utils/validations';

const emptyOrg = {
  name: '',
  parentorganisation: null,
  organisationtype: null,
  states: '',
  address: '',
  phone: '',
  email: '',
  url: '',
  status: 'active'
};

export default function ManageOrganisations() {
  const { 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState(undefined);
  const [filterType, setFilterType] = useState(undefined);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch } = useForm({
    defaultValues: emptyOrg
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedOrgForPayment, setSelectedOrgForPayment] = useState(null);
  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('organisations');
  
  const {
    organisationsList,
    totalPages,
    isLoading,
  } = useGetOrganisationPaginated({
    page,
    pageSize: itemsPerPage,
    search: searchQuery,
    filterType,
    filterState
  });
  
  const { 
    data: organisationTypeList, 
    isLoading: typesLoading, 
  } = useGetOrganisationType(hasAdminAccess);

  const createMutation = useCreateOrganisation();
  const updateMutation = useUpdateOrganisation();
  const deleteMutation = useDeleteOrganisation();

  const openAddDialog = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? '' : (currentUserStates[0] || '');
    reset({...emptyOrg, states: defaultState});
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);
    reset({
      name: org.name || '',
      parentorganisation: org.parentorganisation?.id || '',
      organisationtype: org.organisationtype?.id || '',
      states: Array.isArray(org.states) ? org.states[0] : org.states || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      url: org.url || '',
      status: org.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data) => {
    const isValid = validateFields(data, [
      { field: 'name', label: 'Organisation Name', type: 'text' },
      { field: 'organisationtype', label: 'Organisation Type', type: 'select' },
      { field: 'states', label: 'State', type: 'select' },
      { field: 'email', label: 'Email', type: 'email', required: false },
      { field: 'phone', label: 'Phone No.', type: 'phone', required: false },
    ]);

    if (!isValid) return;

    const submitData = {
      name: data.name,
      parentorganisation: data.parentorganisation
        ? { id: Number(data.parentorganisation) }
        : null,
      organisationtype: data.organisationtype
        ? { id: Number(data.organisationtype) }
        : null,
      states: Array.isArray(data.states) ? data.states : [data.states],
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      url: data.url || '',
      status: data.status || 'active'
    };

    if (editingOrg) {
      updateMutation.mutateAsync({ id: editingOrg.id, data: submitData })
      .then((res) => {
        if(res) {
          setIsDialogOpen(false);
          setEditingOrg(null);
          reset(emptyOrg);
        }
      })
    } else {
      createMutation.mutateAsync(submitData)
      .then((res) => {
        if(res) {
          setIsDialogOpen(false);
          reset(emptyOrg);
        }
      });
    }
  };

  const handleDelete = (org) => {
    setOrgToDelete(org);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!orgToDelete) return;
    deleteMutation.mutate(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
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
          { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: translate('manageOrgs'), page: 'ManageOrganisations' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: translate('manageOrgs'), page: 'ManageOrganisations' }
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-600" />
            {translate('manageOrgs')}
          </h1>
        </div>
        { canCreate && (
          <Button onClick={openAddDialog} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('addNew')}
          </Button>
        )}
      </div>
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{translate('advancedSearch')}</h3>
          </div>
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('orgName')}</Label>
            <Input
              placeholder={translate('searchOrgName')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('orgType')}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>{translate('allTypes')}</SelectItem>
                  {organisationTypeList.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('state')}</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>{translate('allStates')}</SelectItem>
                  {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || filterType !== undefined || filterState !== undefined) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType(undefined);
                  setFilterState(undefined);
                }}
              >
                Reset Semua Carian
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('name')}</TableHead>
                <TableHead className="text-center">{translate('orgType')}</TableHead>
                <TableHead className="text-center">{translate('state')}</TableHead>
                 { (canEdit || canDelete) && (
                   <TableHead  className="text-center">{translate('actions')}</TableHead>
                 ) }
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : organisationsList.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                organisationsList.items.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{getLabelFromId(organisationTypeList, org.organisationtype?.id)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{Array.isArray(org.states) ? org.states.join(', ') : org.states}</TableCell>
                    <TableCell className="text-center">
                      { canEdit && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(org)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedOrgForPayment(org);
                              setPaymentConfigOpen(true);
                            }}
                            title="Payment Config"
                          >
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        </>
                      )}
                      { canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(org)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      ) }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setPage(1);
              }}
              totalItems={organisationsList.total}
            />
          )}
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingOrg ? translate('edit') : translate('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>{translate('name')} <span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Nama organisasi diperlukan' }}
                render={({ field }) => <Input {...field} />}
              />
            </div>
            <div>
              <Label>{translate('orgType')} <span className="text-red-500">*</span></Label>
              <Controller
                name="organisationtype"
                control={control}
                rules={{ required: 'Jenis organisasi diperlukan' }}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(val) => field.onChange(Number(val))}>
                    <SelectTrigger>
                      <SelectValue>
                        {organisationTypeList.find(t => t.id === field.value)?.name || translate('selectOrgType')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {organisationTypeList.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{translate('parentOrg')}</Label>
              <Controller
                name="parentorganisation"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(val) => field.onChange(Number(val))}>
                    <SelectTrigger>
                      <SelectValue>
                        {organisationsList.items.find(o => o.id === field.value)?.name || translate('selectParentOrg')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {organisationsList.items.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{translate('state')} <span className="text-red-500">*</span></Label>
              <Controller
                name="states"
                control={control}
                rules={{ required: 'Negeri diperlukan' }}
                render={({ field }) => (
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={translate('selectStates')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{translate('address')}</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Textarea {...field} />}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div>
                <Label>{translate('email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input type="email" {...field} />}
                />
              </div>
            </div>
            <div>
                <Label>URL</Label>
                <Controller
                  name="url"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
            <div>
              <Label>{translate('status')}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{translate('active')}</SelectItem>
                      <SelectItem value="inactive">{translate('inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('delete')}
        description={`${translate('confirmDelete')} "${orgToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('delete')}
        variant="destructive"
      />

      <PaymentConfigDialog
        open={paymentConfigOpen}
        onOpenChange={setPaymentConfigOpen}
        entityId={selectedOrgForPayment?.id}
        entityType="organisation"
      />
    </div>
  );
}