import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Search, X, Save, MapPin, CreditCard } from 'lucide-react';
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
import { useCrudPermissions } from '@/components/PermissionsContext';
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

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('tahfiz');

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState === 'all' ? undefined : urlState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();

  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultTahfizField
  });

  const selectedServices = watch('serviceoffered') || [];
  const photourl = watch('photourl') || '';

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
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);
    reset({
      ...center,
      latitude: center.latitude?.toString() || '',
      longitude: center.longitude?.toString() || ''
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

  const onSubmit = async (formData) => {
    const payload = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      serviceprice: Object.fromEntries(
        Object.entries(formData.serviceprice || {}).map(([key, value]) => [
          key,
          value ? parseFloat(Number(value).toFixed(2)) : 0
        ])
      )
    };

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
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' }, 
        { label: translate('Manage Tahfiz Centers'), page: 'ManageTahfizCenters' }
      ]} />
      <AccessDeniedComponent />
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' }, 
        { label: translate('Manage Tahfiz Centers'), page: 'ManageTahfizCenters' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          {translate('manageTahfiz')}
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
            <div>
              <Label>{translate('Services')}</Label>
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
                          render={({ field }) => 
                            <Input 
                              type="number" step="0.01" 
                              placeholder="RM 0.00" 
                              value={field.value || ''} 
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          } 
                        />
                      </div>
                    )}
                  </div>
                ))}
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
                required
                errors={errors}
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
              required
              errors={errors}
              bucketName="tahfiz-center"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}>
                {translate('cancel')}
              </Button>
              <Button 
                type="submit" className="bg-amber-600 hover:bg-amber-700" 
                disabled={createTahfiz.isPending || updateTahfiz.isPending || isSubmitting || uploading}>
                <Save className="w-4 h-4 mr-2" /> {translate('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onConfirm={confirmDelete} 
        title={translate('delete')} 
        description={translate('confirmDelete')} 
        variant="destructive" 
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