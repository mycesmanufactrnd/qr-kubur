import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { getLabelFromId } from '@/utils/helpers';
import { ActiveInactiveStatus, STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { useGetOrganisationType } from '@/hooks/useOrganisationTypeMutations';
import { useGetOrganisationPaginated, useOrganisationMutations } from '@/hooks/useOrganisationMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';
import { defaultOrganisationField } from '@/utils/defaultformfields';

export default function ManageOrganisations() {
  const { loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlState = searchParams.get('state') || 'all';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempType, setTempType] = useState(urlType);
  const [tempState, setTempState] = useState(urlState);

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

  const { control, handleSubmit: handleFormSubmit, reset, setValue } = useForm({ defaultValues: defaultOrganisationField });
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('organisations');
  
  const { organisationsList, isLoading } = useGetOrganisationPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    filterType: urlType === 'all' ? undefined : Number(urlType),
    filterState: urlState === 'all' ? undefined : urlState
  });

  const totalPages = Math.ceil((organisationsList?.total || 0) / itemsPerPage);
  const { data: organisationTypeList = [] } = useGetOrganisationType({ hasAccess: hasAdminAccess });
  const { createOrganisation, updateOrganisation, deleteOrganisation } = useOrganisationMutations();

  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    if (tempType !== 'all') params.type = tempType;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const onSubmit = (data) => {
    if (!validateFields(data, [{ field: 'name', label: 'Name', type: 'text' }, { field: 'organisationtype', label: 'Type', type: 'select' }, { field: 'states', label: 'State', type: 'select' }])) return;

    const submitData = {
      ...data,
      parentorganisation: data.parentorganisation ? { id: Number(data.parentorganisation) } : null,
      organisationtype: data.organisationtype ? { id: Number(data.organisationtype) } : null,
      states: Array.isArray(data.states) ? data.states : [data.states],
    };

    const mutation = editingOrg 
      ? updateOrganisation.mutateAsync({ id: editingOrg.id, data: submitData }) 
      : createOrganisation.mutateAsync(submitData);

    mutation.then((res) => { if(res) { setIsDialogOpen(false); reset(defaultOrganisationField); } });
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: translate('Admin Dashboard'), page: 'AdminDashboard' }, { label: translate('Manage Organisations'), page: 'ManageOrganisations' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-violet-600" /> {translate('Manage Organisations')}
        </h1>
        {canCreate && <Button onClick={() => { setEditingOrg(null); reset(defaultOrganisationField); setIsDialogOpen(true); }} className="bg-violet-600"><Plus className="w-4 h-4 mr-2" />{translate('Add New')}</Button>}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={translate('Search organisation name...')} value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-10" />
            </div>
            <Button onClick={handleSearch} className="bg-violet-600 px-6">{translate('Search')}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={String(tempType)} onValueChange={setTempType}>
              <SelectTrigger><SelectValue placeholder={translate('Type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All types')}</SelectItem>
                {(Array.isArray(organisationTypeList.items) ? organisationTypeList.items : []).map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tempState} onValueChange={setTempState}>
              <SelectTrigger><SelectValue placeholder={translate('State')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All states')}</SelectItem>
                {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleReset}><X className="w-4 h-4 mr-2" />{translate('Reset')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Type')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <InlineLoadingComponent isTable={true} colSpan={4}/> : organisationsList.items.length === 0 ? <NoDataTableComponent colSpan={4}/> : organisationsList.items.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{org.organisationtype?.name}</Badge></TableCell>
                  <TableCell className="text-center">{Array.isArray(org.states) ? org.states.join(', ') : org.states}</TableCell>
                  <TableCell className="text-center">
                    {canEdit && <><Button variant="ghost" size="sm" onClick={() => { setEditingOrg(org); reset({ ...org, organisationtype: org.organisationtype?.id, parentorganisation: org.parentorganisation?.id, states: Array.isArray(org.states) ? org.states[0] : org.states }); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedOrgForPayment(org); setPaymentConfigOpen(true); }}><CreditCard className="w-4 h-4 text-green-600" /></Button></>}
                    {canDelete && <Button variant="ghost" size="sm" onClick={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 0 && <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})} itemsPerPage={itemsPerPage} onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }} totalItems={organisationsList.total} />}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingOrg ? translate('Edit') : translate('Add New')}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div><Label>{translate('Name')} *</Label><Controller name="name" control={control} render={({ field }) => <Input {...field} />} /></div>
            <div>
              <Label>{translate('Type')} *</Label>
              <Controller name="organisationtype" control={control} render={({ field }) => (
                <Select value={String(field.value || '')} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Array.isArray(organisationTypeList.items) ? organisationTypeList.items : []).map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>{translate('State')} *</Label>
              <Controller name="states" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" className="bg-violet-600" disabled={createOrganisation.isPending || updateOrganisation.isPending}><Save className="w-4 h-4 mr-2" /> {translate('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => deleteOrganisation.mutate(orgToDelete.id)} title={translate('Delete')} description={translate('Confirm delete')} variant="destructive" />
      <PaymentConfigDialog open={paymentConfigOpen} onOpenChange={setPaymentConfigOpen} entityId={selectedOrgForPayment?.id} entityType="organisation" />
    </div>
  );
}