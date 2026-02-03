import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, Save, Filter, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm, Controller } from "react-hook-form";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCrudPermissions, usePermissions } from '@/components/PermissionsContext';
import PaymentConfigDialog from '@/components/PaymentConfigDialog';
import { translate } from '@/utils/translations';
import { useGetTahfizPaginated, useTahfizMutations } from '@/hooks/useTahfizMutations';
import { useAdminAccess } from '@/utils/auth';
import { SERVICE_TYPES, STATES_MY } from '@/utils/enums';
import { defaultTahfizField } from '@/utils/defaultformfields';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { showError, showSuccess } from '@/components/ToastrNotification';

export default function ManageTahfizCenters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedCenterForPayment, setSelectedCenterForPayment] = useState(null);
  const { isTahfizAdmin, isSuperAdmin, loadingUser } = useAdminAccess();
  const [uploading, setUploading] = useState(false);

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('tahfiz');

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page,
    pageSize: itemsPerPage,
    search: searchQuery,
    filterState: filterState === 'all' ? undefined : filterState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();

  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch } = useForm({
    defaultValues: defaultTahfizField
  });

  const selectedServices = watch('serviceoffered') || [];
  const photourl = watch('photourl') || '';

  const openAddDialog = () => {
    setEditingCenter(null);
    reset(defaultTahfizField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);
    reset({
      name: center.name || '',
      description: center.description || '',
      serviceoffered: center.serviceoffered || [],
      serviceprice: center.serviceprice || {},
      state: center.state || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      latitude: center.latitude?.toString() || '', 
      longitude: center.longitude?.toString() || '',
      photourl: center.photourl || '',
    });
    setIsDialogOpen(true);
  };

  const toggleService = (serviceValue) => {
    const current = selectedServices;
    if (current.includes(serviceValue)) {
      setValue('serviceoffered', current.filter(s => s !== serviceValue));
    } else {
      setValue('serviceoffered', [...current, serviceValue]);
    }
  };

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      state: data.state,
      address: data.address,
      phone: data.phone,
      email: data.email,
      serviceoffered: data.serviceoffered,
      serviceprice: data.serviceprice,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      photourl: data.photourl,
    };

    if (editingCenter) {
      updateTahfiz.mutate({ id: editingCenter.id, data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset(defaultTahfizField);
        }
      });
    } else {
      createTahfiz.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset(defaultTahfizField);
        }
      });
    }
  };

  const confirmDelete = () => {
    if (!centerToDelete) return;
    deleteTahfiz.mutate(centerToDelete.id, {
      onSuccess: () => setDeleteDialogOpen(false)
    });
  };

  const handleFileUpload = async (file) => {
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload/tahfiz-center', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }

      const data = await res.json();
      
      setValue('photourl', data.file_url);
      showSuccess('Photo uploaded');
    } catch (err) {
      console.error(err);
      showError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isTahfizAdmin && !isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('adminDashboard'), page: 'AdminDashboard' }, 
          { label: translate('manageTahfiz'), page: 'ManageTahfizCenters' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' }, 
        { label: translate('manageTahfiz'), page: 'ManageTahfizCenters' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          {translate('manageTahfiz')}
        </h1>
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('addNew')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('search...')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            {isSuperAdmin && (
              <Select value={filterState} onValueChange={(val) => { setFilterState(val); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder={translate('allStates')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('allStates')}</SelectItem>
                  {STATES_MY.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('name')}</TableHead>
                <TableHead className="text-center">{translate('state')}</TableHead>
                <TableHead className="text-center">{translate('services')}</TableHead>
                <TableHead className="text-center">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4}/>
              ) : tahfizCenterList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4}/>
              ) : (
                tahfizCenterList.items.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="text-center">{center.state}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center items-center gap-1">
                        {center.serviceoffered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {SERVICE_TYPES.find(s => s.value === service)?.label || service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCenterForPayment(center); setPaymentConfigOpen(true); }}><CreditCard className="w-4 h-4 text-green-600" /></Button>
                        </>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setCenterToDelete(center); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setPage(1); }}
            totalItems={tahfizCenterList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader><DialogTitle>{editingCenter ? translate('edit') : translate('addNew')}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>{translate('name')} *</Label>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} required />} />
            </div>
            <div>
              <Label>{translate('state')} *</Label>
              <Controller name="state" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder={translate('selectStates')} /></SelectTrigger>
                  <SelectContent>{STATES_MY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>{translate('services')}</Label>
              <div className="space-y-3 mt-2">
                {SERVICE_TYPES.map(service => (
                  <div key={service.value} className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded border">
                      <Checkbox 
                        checked={selectedServices.includes(service.value)} 
                        onCheckedChange={() => toggleService(service.value)} 
                      />
                      <span className="text-sm font-medium">{service.label}</span>
                    </div>
                    {selectedServices.includes(service.value) && (
                      <div className="ml-8">
                         <Controller
                          name={`serviceprice.${service.value}`}
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="RM 0.00" 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div><Label>{translate('address')}</Label><Controller name="address" control={control} render={({ field }) => <Textarea {...field} />} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{translate('phone')}</Label><Controller name="phone" control={control} render={({ field }) => <Input {...field} />} /></div>
              <div><Label>{translate('email')}</Label><Controller name="email" control={control} render={({ field }) => <Input type="email" {...field} />} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitude</Label><Controller name="latitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
              <div><Label>Longitude</Label><Controller name="longitude" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                setValue('latitude', pos.coords.latitude.toFixed(8));
                setValue('longitude', pos.coords.longitude.toFixed(8));
              });
            }}><MapPin className="w-4 h-4 mr-2" /> {translate('getCurrentLocation')}</Button>
            <div className="space-y-2">
              <Label>{translate('Photo')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleFileUpload(file);                    
                  }}
                  disabled={uploading}
                />

                {uploading && <span className="text-sm text-gray-500">{translate('uploading...')}</span>}
              </div>
              {photourl && (
                  <img 
                    src={`/api/file/tahfiz-center/${encodeURIComponent(photourl)}`} 
                    alt={translate('Preview')}
                  />
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('cancel')}</Button>
              <Button type="submit" disabled={createTahfiz.isPending || updateTahfiz.isPending}><Save className="w-4 h-4 mr-2" /> {translate('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} title={translate('delete')} description={translate('confirmDelete')} variant="destructive" />
      <PaymentConfigDialog open={paymentConfigOpen} onOpenChange={setPaymentConfigOpen} entityId={selectedCenterForPayment?.id} entityType="tahfiz" />
    </div>
  );
}