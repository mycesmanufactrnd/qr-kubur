import { useEffect, useState } from 'react';
import { translate } from '@/utils/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit, Trash2, Search, Save, Filter, CreditCard } from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/Translations';
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
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '../components/AccessDeniedComponent';
import Breadcrumb from '../components/Breadcrumb';
import { useCrudPermissions, usePermissions } from '../components/PermissionsContext';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import PaymentConfigDialog from '../components/PaymentConfigDialog';
import { showApiError, showError, showSuccess } from '@/components/ToastrNotification';
import { getLabelFromId, useAdminAccess } from '@/utils/index';
import { STATES_MY } from '@/utils/enums';

const emptyOrg = {
  name: '',
  parent_organisation_id: '',
  organisation_type_id: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  url: '',
  status: 'active'
};

export default function ManageOrganisations() {
  const { 
    loadingUser, 
    currentUser, 
    hasAdminAccess, 
    isSuperAdmin, isAdmin, isEmployee, 
    currentUserStates 
  } = useAdminAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
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
  const queryClient = useQueryClient();
  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('organisations');

  const buildFilterQuery = () => {
    const query = {};

    if (!isSuperAdmin && currentUser?.organisation_id) {
      if (isAdmin) {
        // Admin (own + children)
        query.$or = [
          { id: currentUser.organisation_id },
          { parent_organisation_id: currentUser.organisation_id }
        ];
      } else if (isEmployee) {
        // Employee (own)
        query.id = currentUser.organisation_id;
      }
    }

    if (filterType !== 'all') query.organisation_type_id = filterType;
    if (filterState !== 'all') query.state = filterState;

    return query;
  };

  const { data: organisationsList = [], isLoading } = useQuery({
    queryKey: ['admin-organisations-paginated', page, itemsPerPage, filterType, currentUser],
    queryFn: () => base44.entities.Organisation.filter(buildFilterQuery(), '-created_date', itemsPerPage, (page - 1) * itemsPerPage),
    enabled: canView && !!currentUser
  });

  const { data: totalRows = 0 } = useQuery({
    queryKey: ['admin-organisations-count', filterType, filterState, currentUser],
    queryFn: async () => {
      const all = await base44.entities.Organisation.filter(buildFilterQuery());
      return all.length;
    },
    enabled: canView && !!currentUser
  });

  const totalPages = Math.ceil(totalRows / itemsPerPage);

  const { data: parentOrgOptions = [] } = useQuery({
    queryKey: ['parent-org-options', currentUser, isSuperAdmin, isAdmin],
    queryFn: () => {
      if (isSuperAdmin) {
        return base44.entities.Organisation.filter({}, 'name');
      }

      return base44.entities.Organisation.filter({ id: currentUser.organisation_id });
    },
    enabled: !!currentUser
  });

  // organisation type list
  const { data: organisationTypeList = [] } = useQuery({
    queryKey: ['organisation-types'],
    queryFn: () => base44.entities.OrganisationType.filter({ status: 'active' })
  });

  // CRUD Mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organisation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      reset(emptyOrg);
      showSuccess('Organisation Created Successfully');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organisation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      setEditingOrg(null);
      reset(emptyOrg);
      showSuccess('Organisation Updated Successfully');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Organisation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      showSuccess('Organisation Deleted Successfully');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const openAddDialog = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? '' : (currentUserStates[0] || '');
    reset({...emptyOrg, state: defaultState});
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);
    reset({
      name: org.name || '',
      parent_organisation_id: org.parent_organisation_id || '',
      organisation_type_id: org.organisation_type_id || '',
      state: Array.isArray(org.state) ? org.state[0] : org.state || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      url: org.url || '',
      status: org.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data) => {
    if (!data.name?.trim()) {
      showError('Sila masukkan nama organisasi', 'Medan diperlukan');
      return;
    }
    if (!data.organisation_type_id) {
      showError('Sila masukkan jenis organisasi', 'Medan diperlukan');
      return;
    }
    if (!data.state) {
      showError('Sila pilih negeri', 'Medan diperlukan');
      return;
    }

    if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError('Format email tidak sah', 'Format Tidak Sah');
      return;
    }
    if (data.phone && data.phone.trim() && !/^[0-9\-\+\(\)\s]+$/.test(data.phone)) {
      showError('Format telefon tidak sah', 'Format Tidak Sah');
      return;
    }
    
    const submitData = {
      name: data.name,
      parent_organisation_id: data.parent_organisation_id,
      organisation_type_id: data.organisation_type_id,
      state: Array.isArray(data.state) ? data.state : [data.state],
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      url: data.url || '',
      status: data.status || 'active'
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
            <h3 className="font-semibold text-gray-900 dark:text-white">Carian Lanjutan</h3>
          </div>
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">Nama Organisasi</Label>
            <Input
              placeholder="Cari nama organisasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Jenis Organisasi</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {organisationTypeList.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Negeri</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Negeri</SelectItem>
                  {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || filterType !== 'all' || filterState !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterState('all');
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
              ) : organisationsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                organisationsList.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{getLabelFromId(organisationTypeList, org.organisation_type_id)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{Array.isArray(org.state) ? org.state.join(', ') : org.state}</TableCell>
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
        </CardContent>
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
            totalItems={organisationsList.length}
          />
        )}
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
                name="organisation_type_id"
                control={control}
                rules={{ required: 'Jenis organisasi diperlukan' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis organisasi" />
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
              <Label>Parent Organisation</Label>
              <Controller
                name="parent_organisation_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose parent organisation" />
                    </SelectTrigger>
                    <SelectContent>
                        {parentOrgOptions.map(type => (
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
                name="state"
                control={control}
                rules={{ required: 'Negeri diperlukan' }}
                render={({ field }) => (
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih negeri" />
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