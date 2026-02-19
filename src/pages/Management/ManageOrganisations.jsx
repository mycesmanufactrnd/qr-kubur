import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { Building2, Plus, Edit, Trash2, Search, X, Save, CreditCard, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
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
import { useGetOrganisationTypePaginated } from '@/hooks/useOrganisationTypeMutations';
import { useGetOrganisationPaginated, useOrganisationMutations } from '@/hooks/useOrganisationMutations';
import { defaultOrganisationField } from '@/utils/defaultformfields';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import FileUploadForm from '@/components/forms/FileUploadForm';
import { showError, showSuccess } from '@/components/ToastrNotification';

export default function ManageOrganisations() {
  const { 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('search') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlState = searchParams.get('state') || 'all';

  const [tempName, setTempName] = useState(urlName);
  const [tempType, setTempType] = useState(urlType);
  const [tempState, setTempState] = useState(urlState);

  useEffect(() => {
    setTempName(urlName);
    setTempType(urlType);
    setTempState(urlState);
  }, [urlName, urlType, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedOrgForPayment, setSelectedOrgForPayment] = useState(null);
  const [serviceEntries, setServiceEntries] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting} } = useForm({
    defaultValues: defaultOrganisationField
  });

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('organisations');

  const isGraveServicesChecked = watch("isgraveservices");

  const tableColSpan = (canEdit || canDelete) ? 5 : 4;

  const syncServiceDraftToForm = (entries) => {
    const normalized = [];
    const seen = new Set();

    for (const entry of entries) {
      const service = (entry.service || '').trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalized.push({
        service,
        price: entry.price === '' ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const serviceoffered = normalized.map((item) => item.service);
    const serviceprice = Object.fromEntries(
      normalized.map((item) => [item.service, Number(item.price) || 0])
    );

    setValue('serviceoffered', serviceoffered);
    setValue('serviceprice', serviceprice);
  };

  const addServiceEntry = () => {
    const nextEntries = [...serviceEntries, { id: `${Date.now()}-${Math.random()}`, service: '', price: '' }];
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const updateServiceEntry = (entryId, field, fieldValue) => {
    const nextEntries = serviceEntries.map((entry) =>
      entry.id === entryId ? { ...entry, [field]: fieldValue } : entry
    );
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const removeServiceEntry = (entryId) => {
    const nextEntries = serviceEntries.filter((entry) => entry.id !== entryId);
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };
  
  const {
    organisationsList,
    totalPages,
    isLoading,
  } = useGetOrganisationPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterType: urlType === 'all' ? undefined : Number(urlType),
    filterState: urlState === 'all' ? undefined : urlState
  });

  const { organisationTypeList = [] } = useGetOrganisationTypePaginated({});
  const { createOrganisation, updateOrganisation, deleteOrganisation } = useOrganisationMutations();

  const handleSearch = () => {
    const params = { page: '1', search: '', type: '', state: '' };
    if (tempName) params.search = tempName;
    if (tempType !== 'all') params.type = tempType;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const openAddDialog = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? '' : (currentUserStates[0] || '');
    reset({...defaultOrganisationField, states: defaultState});
    setServiceEntries([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);

    const relationalServices = Array.isArray(org.services) ? org.services : [];
    const serviceoffered = relationalServices.length > 0
      ? relationalServices.map(service => service.service)
      : (org.serviceoffered || []);
    const serviceprice = relationalServices.length > 0
      ? Object.fromEntries(
          relationalServices.map(service => [
            service.service,
            service.price ? parseFloat(Number(service.price).toFixed(2)) : 0
          ])
        )
      : (org.serviceprice || {});

    reset({
      ...org,
      parentorganisation: org.parentorganisation?.id.toString() || '',
      organisationtype: org.organisationtype?.id.toString() || '',
      serviceoffered,
      serviceprice,
      states: Array.isArray(org.states) ? org.states[0] : org.states || '',
      status: org.status || ActiveInactiveStatus.ACTIVE
    });

    const nextEntries = serviceoffered.map((service, index) => ({
      id: `${Date.now()}-${index}`,
      service,
      price: (serviceprice[service] ?? 0).toString(),
    }));

    setServiceEntries(nextEntries);
    setIsDialogOpen(true);
  };

  const onSubmit = (formData) => {
    const normalizedServices = [];
    const seen = new Set();

    for (const entry of serviceEntries) {
      const service = (entry.service || '').trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalizedServices.push({
        service,
        price: entry.price === '' ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const { serviceoffered: _serviceoffered, serviceprice: _serviceprice, ...restFormData } = formData;

    const submitData = {
      ...restFormData,
      parentorganisation: formData.parentorganisation ? { id: Number(formData.parentorganisation) } : null,
      organisationtype: formData.organisationtype ? { id: Number(formData.organisationtype) } : null,
      states: Array.isArray(formData.states) ? formData.states : [formData.states],
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      services: normalizedServices.map((serviceItem) => ({
        service: serviceItem.service,
        price: Number(serviceItem.price) || 0,
        organisation: editingOrg ? { id: Number(editingOrg.id) } : null,
        tahfizcenter: null,
      })),
    };

    const mutation = editingOrg
      ? updateOrganisation.mutateAsync({ id: editingOrg.id, data: submitData })
      : createOrganisation.mutateAsync(submitData);

    mutation.then((res) => {
      if (res) {
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
        { label: isSuperAdmin 
            ? translate('Super Admin Dashboard') 
            : translate('Admin Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
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

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search organisation name...')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
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
                {organisationTypeList.items.map(type => (
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
                <TableHead className="text-center">{translate('Services')}</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">{translate('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={tableColSpan}/>
              ) : organisationsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={tableColSpan}/>
              ) : (
                organisationsList.items.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {getLabelFromId(organisationTypeList.items, org.organisationtype?.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {Array.isArray(org.states) ? org.states.join(', ') : org.states}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center items-center gap-1">
                        {org.serviceoffered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-center">
                        { canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(org)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                setSelectedOrgForPayment(org);
                                setPaymentConfigOpen(true);
                              }}>
                              <CreditCard className="w-4 h-4 text-green-600" />
                            </Button>
                          </>
                        )}
                        { canDelete && (
                          <Button variant="ghost" size="sm"
                            onClick={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        ) }
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
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }}
            totalItems={organisationsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? translate('Edit') : translate('Add New')}
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
            <div className="grid grid-cols-2 gap-4">
              <SelectForm
                name="organisationtype"
                control={control}
                placeholder={translate("Select organisation type")}
                label={translate("Organisation Type")}
                options={Object.values(organisationTypeList.items).map((type) => ({
                  value: type.id,
                  label: type.name,
                }))}
                required
                errors={errors}
              />
              <SelectForm
                name="parentorganisation"
                control={control}
                placeholder={translate("Select parent organisation")}
                label={translate("Parent Organsiation")}
                options={Object.values(organisationsList.items).map((org) => ({
                  value: org.id,
                  label: org.name,
                }))}
              />
            </div>
            <SelectForm
              name="states"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <CheckboxForm
              name="isgraveservices"
              control={control}
              label={translate("Grave Services")}
              disabled={serviceEntries.length > 0}
            />
            {isGraveServicesChecked && (
              <div>
                <Label>{translate('Services')}</Label>
                <div className="space-y-3 mt-2">
                  {serviceEntries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-7"
                        placeholder={translate('Service Name')}
                        value={entry.service}
                        onChange={(e) => updateServiceEntry(entry.id, 'service', e.target.value)}
                      />
                      <Input
                        className="col-span-4"
                        type="number"
                        step="0.01"
                        placeholder="RM 0.00"
                        value={entry.price}
                        onChange={(e) => updateServiceEntry(entry.id, 'price', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white hover:text-white flex items-center justify-center rounded-md"
                        onClick={() => removeServiceEntry(entry.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addServiceEntry}>
                    <Plus className="w-4 h-4 mr-2" />
                    {translate('Add Service')}
                  </Button>
                </div>
              </div>
            )}
            <TextInputForm
              name="address"
              control={control}
              label={translate("Address")}
              isTextArea
            />   
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              bucketName="bucket-organisation"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="phone"
                control={control}
                label={translate("Phone No.")}
                isPhone
              />   
              <TextInputForm
                name="email"
                control={control}
                label={translate("Email")}
                isEmail
              />   
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="latitude"
                control={control}
                label={translate("Latitude")}
                isNumber
                required
                errors={errors}
              />   
              <TextInputForm
                name="longitude"
                control={control}
                label={translate("Longitude")}
                isNumber
                required
                errors={errors}
              />   
            </div>            
            <Button 
              type="button" variant="outline" className="w-full" 
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setValue('latitude', pos.coords.latitude.toFixed(16));
                  setValue('longitude', pos.coords.longitude.toFixed(16));
                });
              }}
            >
              <MapPin className="w-4 h-4 mr-2" /> 
              {translate('Get Current Location')}
            </Button>
            <CheckboxForm
              name="canbedonated"
              control={control}
              label={translate("Can Be Donated")}
            />
            <hr />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" className="bg-violet-600" 
                disabled={createOrganisation.isPending || updateOrganisation.isPending || isSubmitting || uploading}
              >
                <Save className="w-4 h-4 mr-2" /> {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onConfirm={confirmDelete} 
        title={translate('Delete')} 
        description={translate('Confirm delete')} 
        variant="destructive" 
      />
      <PaymentConfigDialog 
        open={paymentConfigOpen} 
        hasAdminAccess={hasAdminAccess} 
        onOpenChange={setPaymentConfigOpen} 
        entityId={selectedOrgForPayment?.id} 
        entityType="organisation" 
      />
    </div>
  );
}
