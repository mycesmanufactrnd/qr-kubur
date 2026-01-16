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

import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { usePermissions } from '../components/PermissionsContext';
import PaymentConfigDialog from '../components/PaymentConfigDialog';
import { translate } from '@/utils/translations';

import { useGetTahfizPaginated, useTahfizMutations } from '@/hooks/useTahfizMutations';
import { useAdminAccess } from '@/utils/auth';
import { STATES_MY } from '@/utils/enums';

const SERVICES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang' },
  { value: 'yasin', label: 'Bacaan Yasin' },
  { value: 'doa_arwah', label: 'Doa Arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas' }
];

const emptyCenter = {
  name: '',
  description: '',
  serviceoffered: [], // Matches Entity serviceoffered
  serviceprice: {},    // Matches Entity serviceprice
  state: '',
  address: '',
  phone: '',
  email: '',
  gps_lat: '',         // Local UI state
  gps_lng: ''          // Local UI state
};

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

  const { currentUser, isLoading: loadingUser } = useAdminAccess();
  const { hasPermission } = usePermissions();

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const hasViewPermission = hasPermission('tahfiz_view');
  const hasCreatePermission = hasPermission('tahfiz_create');
  const hasEditPermission = hasPermission('tahfiz_edit');
  const hasDeletePermission = hasPermission('tahfiz_delete');

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page,
    pageSize: itemsPerPage,
    search: searchQuery,
    filterState: filterState === 'all' ? undefined : filterState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();

  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch } = useForm({
    defaultValues: emptyCenter
  });

  const selectedServices = watch('serviceoffered') || [];

  const openAddDialog = () => {
    setEditingCenter(null);
    reset(emptyCenter);
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
      gps_lat: center.latitude?.toString() || '', // Map latitude -> gps_lat
      gps_lng: center.longitude?.toString() || '' // Map longitude -> gps_lng
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
    // Explicitly mapping data to match Backend Schema/Entity names
    const payload = {
      name: data.name,
      description: data.description,
      state: data.state,
      address: data.address,
      phone: data.phone,
      email: data.email,
      serviceoffered: data.serviceoffered,
      serviceprice: data.serviceprice,
      latitude: data.gps_lat ? parseFloat(data.gps_lat) : null,
      longitude: data.gps_lng ? parseFloat(data.gps_lng) : null,
    };

    if (editingCenter) {
      updateTahfiz.mutate({ id: editingCenter.id, data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset(emptyCenter);
        }
      });
    } else {
      createTahfiz.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset(emptyCenter);
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

  if (loadingUser) return <LoadingUser />;
  if (!hasViewPermission) return <div className="p-8 text-center">{translate('accessDenied')}</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: translate('adminDashboard'), page: 'AdminDashboard' }, { label: translate('manageTahfiz'), page: 'ManageTahfizCenters' }]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          {translate('manageTahfiz')}
        </h1>
        {hasCreatePermission && (
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
                <TableHead>{translate('state')}</TableHead>
                <TableHead>{translate('services')}</TableHead>
                <TableHead className="text-right">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">{translate('loading')}</TableCell></TableRow>
              ) : tahfizCenterList.items.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">{translate('noRecords')}</TableCell></TableRow>
              ) : (
                tahfizCenterList.items.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.state}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Corrected to use serviceoffered attribute */}
                        {center.serviceoffered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {SERVICES.find(s => s.value === service)?.label || service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasEditPermission && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCenterForPayment(center); setPaymentConfigOpen(true); }}><CreditCard className="w-4 h-4 text-green-600" /></Button>
                        </>
                      )}
                      {hasDeletePermission && (
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
                {SERVICES.map(service => (
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
              <div><Label>Latitude</Label><Controller name="gps_lat" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
              <div><Label>Longitude</Label><Controller name="gps_lng" control={control} render={({ field }) => <Input type="number" step="any" {...field} />} /></div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                setValue('gps_lat', pos.coords.latitude.toFixed(8));
                setValue('gps_lng', pos.coords.longitude.toFixed(8));
              });
            }}><MapPin className="w-4 h-4 mr-2" /> {translate('getCurrentLocation')}</Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('cancel')}</Button>
              <Button type="submit" disabled={createTahfiz.isLoading || updateTahfiz.isLoading}><Save className="w-4 h-4 mr-2" /> {translate('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} title={translate('delete')} description={translate('confirmDelete')} variant="destructive" />
      <PaymentConfigDialog open={paymentConfigOpen} hasAdminAccess={hasCreatePermission} onOpenChange={setPaymentConfigOpen} entityId={selectedCenterForPayment?.id} entityType="tahfiz" />
    </div>
  );
}