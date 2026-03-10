import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Search, X, Save, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCrudPermissions } from '@/components/PermissionsContext';
import PaymentConfigDialog from '@/components/PaymentConfigDialog';
import { translate } from '@/utils/translations';
import { useGetTahfizPaginated, useTahfizMutations } from '@/hooks/useTahfizMutations';
import { useAdminAccess } from '@/utils/auth';
import { STATES_MY } from '@/utils/enums';
import { defaultTahfizField } from '@/utils/defaultformfields';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { showError, showSuccess } from '@/components/ToastrNotification';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import FileUploadForm from '@/components/forms/FileUploadForm';

export default function ManageTahfizCenters() {
  const { isTahfizAdmin, isSuperAdmin, loadingUser, currentUserStates } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const urlState = searchParams.get('state') || 'all';

  const [tempName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
  }, [urlName, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedCenterForPayment, setSelectedCenterForPayment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serviceEntries, setServiceEntries] = useState([]);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('tahfiz');

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState === 'all' ? undefined : urlState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();

  const { control, handleSubmit: handleFormSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultTahfizField
  });

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

  const handleSearch = () => {
    const params = { page: '1', name: '', state: '' };
    if (tempName) params.name = tempName;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingCenter(null);
    reset(defaultTahfizField);
    setServiceEntries([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);

    const relationalServices = Array.isArray(center.services) ? center.services : [];
    const serviceoffered = relationalServices.length > 0
      ? relationalServices.map(service => service.service)
      : (center.serviceoffered || []);
    const serviceprice = relationalServices.length > 0
      ? Object.fromEntries(
          relationalServices.map(service => [
            service.service,
            service.price ? parseFloat(Number(service.price).toFixed(2)) : 0
          ])
        )
      : (center.serviceprice || {});

    reset({
      ...center,
      serviceoffered,
      serviceprice,
      latitude: center.latitude?.toString() || '',
      longitude: center.longitude?.toString() || ''
    });

    const nextEntries = serviceoffered.map((service, index) => ({
      id: `${Date.now()}-${index}`,
      service,
      price: (serviceprice[service] ?? 0).toString(),
    }));

    setServiceEntries(nextEntries);
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
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

    const { serviceoffered, serviceprice, ...restFormData } = formData;

    const payload = {
      ...restFormData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      services: normalizedServices.map((serviceItem) => ({
        service: serviceItem.service,
        price: Number(serviceItem.price) || 0,
        tahfizcenter: editingCenter ? { id: Number(editingCenter.id) } : null,
      })),
    };

    syncServiceDraftToForm(
      normalizedServices.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        service: item.service,
        price: item.price.toString(),
      }))
    );

    try {
      if (editingCenter) {
        await updateTahfiz.mutateAsync({ id: Number(editingCenter.id), data: payload });
      } else {
        await createTahfiz.mutateAsync(payload);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
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

  const confirmDelete = async () => {
    if (!centerToDelete) return;

    try {
      await deleteTahfiz.mutateAsync(Number(centerToDelete.id));
      setDeleteDialogOpen(false);
      setCenterToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent />
    )
  }

  if (!isTahfizAdmin && !isSuperAdmin) {
    return ( 
      <AccessDeniedComponent />
    )
  }

  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin 
          ? translate('Super Admin Dashboard') 
          : translate('Tahfiz Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'TahfizDashboard' 
        },
        { label: translate('Manage Tahfiz Centers'), page: 'ManageTahfizCenters' }
      ]} />
      <AccessDeniedComponent />
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin 
          ? translate('Super Admin Dashboard') 
          : translate('Tahfiz Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'TahfizDashboard' 
        },
        { label: translate('Manage Tahfiz Centers'), page: 'ManageTahfizCenters' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          {translate('Manage Tahfiz Centers')}
        </h1>
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700">
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
                placeholder={translate('Name')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-amber-600 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={setTempState}>
                <SelectTrigger>
                  <SelectValue placeholder={translate('All States')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All States')}</SelectItem>
                  {STATES_MY.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
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
                <TableHead className="text-center">{translate('Phone No')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Services')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4} />
              ) : tahfizCenterList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4} />
              ) : (
                tahfizCenterList.items.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="text-center">{center.phone}</TableCell>
                    <TableCell className="text-center">{center.state}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center items-center gap-1">
                        {center.serviceoffered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <>
                          <Button 
                            variant="ghost" size="sm" 
                            onClick={() => openEditDialog(center)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="sm" 
                            onClick={() => { 
                              setSelectedCenterForPayment(center); 
                              setPaymentConfigOpen(true); }}
                          >
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" size="sm" 
                          onClick={() => { 
                            setCenterToDelete(center); 
                            setDeleteDialogOpen(true); 
                          }}>
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
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }); }}
            totalItems={tahfizCenterList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? translate('Edit') : translate('Add')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            /> 
            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <TextInputForm 
              name="description" 
              control={control} 
              label={translate("About")}
              isTextArea 
            />
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
                      className="col-span-1"
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
            <TextInputForm 
              name="address" 
              control={control} 
              label={translate("Address")}
              isTextArea 
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="phone"
                control={control}
                label={translate("Phone No.")}
                required
                errors={errors}
              /> 
              <TextInputForm
                name="email"
                control={control}
                label={translate("Email")}
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
              type="button" variant="outline" 
              className="w-full" 
              onClick={() => navigator.geolocation.getCurrentPosition((pos) => { 
                setValue('latitude', pos.coords.latitude.toFixed(16)); 
                setValue('longitude', pos.coords.longitude.toFixed(16)); 
              })}>
              <MapPin className="w-4 h-4 mr-2" /> 
              {translate('Get Current Location')}
            </Button>
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              bucketName="tahfiz-center"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" className="bg-amber-600 hover:bg-amber-700" 
                disabled={createTahfiz.isPending || updateTahfiz.isPending || isSubmitting || uploading}>
                <Save className="w-4 h-4 mr-2" /> {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete Tahfiz Center')}
        isDelete={true}
        itemToDelete={centerToDelete?.name}
        onConfirm={confirmDelete}
      />
      <PaymentConfigDialog 
        open={paymentConfigOpen} 
        hasAdminAccess
        onOpenChange={setPaymentConfigOpen} 
        entityId={selectedCenterForPayment?.id} 
        entityType="tahfiz" 
      />
    </div>
  );
}
