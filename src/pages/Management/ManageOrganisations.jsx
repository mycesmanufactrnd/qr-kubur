import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { Building2, Plus, Edit, Trash2, Search, X, Save, CreditCard, MapPin } from 'lucide-react';
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
import { ActiveInactiveStatus, STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { useGetOrganisationType } from '@/hooks/useOrganisationTypeMutations';
import { useGetOrganisationPaginated, useOrganisationMutations } from '@/hooks/useOrganisationMutations';
import { validateFields } from '@/utils/validations';
import { Checkbox } from '@/components/ui/checkbox';
import { defaultOrganisationField } from '@/utils/defaultformfields';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';

export default function ManageOrganisations() {
  const { 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();

  // 🔹 1. URL Source of Truth (Supervisor Instruction)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlState = searchParams.get('state') || 'all';

  // 🔹 2. Temporary States (Typing doesn't trigger API)
  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempType, setTempType] = useState(urlType);
  const [tempState, setTempState] = useState(urlState);

  // 🔹 3. Sync Inputs with URL (For Reset and Back button)
  useEffect(() => {
    setTempSearch(urlSearch);
    setTempType(urlType);
    setTempState(urlState);
  }, [urlSearch, urlType, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedOrgForPayment, setSelectedOrgForPayment] = useState(null);

  const { control, handleSubmit: handleFormSubmit, reset, setValue } = useForm({
    defaultValues: defaultOrganisationField
  });

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('organisations');
  
  // 🔹 4. Backend Query (Only reacts to URL changes)
  const {
    organisationsList,
    isLoading,
  } = useGetOrganisationPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    filterType: urlType === 'all' ? undefined : Number(urlType),
    filterState: urlState === 'all' ? undefined : urlState
  });

  const totalPages = Math.ceil((organisationsList?.total || 0) / itemsPerPage);
  
  const { data: organisationTypeList = [] } = useGetOrganisationType(hasAdminAccess);
  const { createOrganisation, updateOrganisation, deleteOrganisation } = useOrganisationMutations();

  // 🔹 5. Search Handlers (Updates the URL)
  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    if (tempType !== 'all') params.type = tempType;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({}); // Clears all filters in URL
  };

  const openAddDialog = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? '' : (currentUserStates[0] || '');
    reset({...defaultOrganisationField, states: defaultState});
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
      latitude: org.latitude || '',
      longitude: org.longitude || '',
      canbedonated: org.canbedonated || false,
      status: org.status || ActiveInactiveStatus.ACTIVE
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data) => {
    const isValid = validateFields(data, [
      { field: 'name', label: 'Organisation Name', type: 'text' },
      { field: 'organisationtype', label: 'Organisation Type', type: 'select' },
      { field: 'states', label: 'State', type: 'select' },
    ]);

    if (!isValid) return;

    const submitData = {
      ...data,
      parentorganisation: data.parentorganisation ? { id: Number(data.parentorganisation) } : null,
      organisationtype: data.organisationtype ? { id: Number(data.organisationtype) } : null,
      states: Array.isArray(data.states) ? data.states : [data.states],
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    };

    const mutation = editingOrg 
      ? updateOrganisation.mutateAsync({ id: editingOrg.id, data: submitData }) 
      : createOrganisation.mutateAsync(submitData);

    mutation.then((res) => {
      if(res) {
        setIsDialogOpen(false);
        reset(defaultOrganisationField);
      }
    });
  };

  const confirmDelete = () => {
    if (!orgToDelete) return;
    deleteOrganisation.mutate(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin ? translate('Super Admin Dashboard') : translate('Admin Dashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: translate('Manage Organisations'), page: 'ManageOrganisations' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-violet-600" />
          {translate('Manage Organisations')}
        </h1>
        { canCreate && (
          <Button onClick={openAddDialog} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add New')}
          </Button>
        )}
      </div>

      {/* 🔹 Unified Filter Card (Supervisor Style) */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search organisation name...')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={String(tempType)} onValueChange={setTempType}>
              <SelectTrigger><SelectValue placeholder={translate('Organisation Type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All types')}</SelectItem>
                {organisationTypeList.map(type => (
                  <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tempState} onValueChange={setTempState}>
              <SelectTrigger><SelectValue placeholder={translate('State')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All states')}</SelectItem>
                {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <TableHead>{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Organisation Type')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">{translate('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4}/>
              ) : organisationsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4}/>
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
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedOrgForPayment(org); setPaymentConfigOpen(true); }}>
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        </>
                      )}
                      { canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}>
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
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }}
            totalItems={organisationsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingOrg ? translate('Edit') : translate('Add New')}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{translate('Name')} *</Label>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
            </div>
            <div className="space-y-2">
              <Label>{translate('Organisation Type')} *</Label>
              <Controller name="organisationtype" control={control} render={({ field }) => (
                <Select value={String(field.value || '')} onValueChange={(val) => field.onChange(Number(val))}>
                  <SelectTrigger><SelectValue placeholder={translate('Select organisation type')} /></SelectTrigger>
                  <SelectContent>{organisationTypeList.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>{translate('Parent Organisation')}</Label>
              <Controller name="parentorganisation" control={control} render={({ field }) => (
                <Select value={String(field.value || '')} onValueChange={(val) => field.onChange(Number(val))}>
                  <SelectTrigger><SelectValue placeholder={translate('Select parent organisation')} /></SelectTrigger>
                  <SelectContent>{organisationsList.items.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>{translate('State')} *</Label>
              <Controller name="states" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder={translate('Select states')} /></SelectTrigger>
                  <SelectContent>{(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>{translate('Address')}</Label>
              <Controller name="address" control={control} render={({ field }) => <Textarea {...field} rows={3} />} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{translate('Phone No.')}</Label><Controller name="phone" control={control} render={({ field }) => <Input {...field} />} /></div>
              <div className="space-y-2"><Label>{translate('Email')}</Label><Controller name="email" control={control} render={({ field }) => <Input type="email" {...field} />} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{translate('GPS Latitude')}</Label><Controller name="latitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
              <div className="space-y-2"><Label>{translate('GPS Longitude')}</Label><Controller name="longitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                setValue('latitude', pos.coords.latitude.toFixed(8));
                setValue('longitude', pos.coords.longitude.toFixed(8));
              });
            }}><MapPin className="w-4 h-4 mr-2" /> {translate('Get Current Location')}</Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" className="bg-violet-600" disabled={createOrganisation.isPending || updateOrganisation.isPending}>
                <Save className="w-4 h-4 mr-2" /> {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} title={translate('Delete')} description={translate('Confirm delete')} variant="destructive" />
      <PaymentConfigDialog open={paymentConfigOpen} hasAdminAccess={hasAdminAccess} onOpenChange={setPaymentConfigOpen} entityId={selectedOrgForPayment?.id} entityType="organisation" />
    </div>
  );
}