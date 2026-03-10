import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Plus, Edit, Trash2, Search, Save, CheckCircle, XCircle, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetPaymentPlatform, usePaymentPlatformMutations } from '@/hooks/usePaymentPlatformMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';
import { defaultPaymentConfigField } from '@/utils/defaultformfields';
import { useForm } from 'react-hook-form';
import TextInputForm from '@/components/forms/TextInputForm';
import { ActiveInactiveStatus } from '@/utils/enums';
import SelectForm from '@/components/forms/SelectForm';

export default function ManagePaymentPlatforms() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlCodeName = searchParams.get('codename') || '';

  const [tempCodeName, setTempCodeName] = useState(urlCodeName);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { 
    setTempCodeName(urlCodeName); 
  }, [urlCodeName]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }} = useForm({
    defaultValues: defaultPaymentConfigField
  });
  
  const { paymentPlatformList, totalPages, isLoading } = useGetPaymentPlatform({
    page: urlPage,
    pageSize: itemsPerPage,
    filterCodeName: urlCodeName,
  });

  const { createPaymentPlatform, updatePaymentPlatform, deletePaymentPlatform } = usePaymentPlatformMutations();

  const handleSearch = () => {
    const params = { page: '1', codename: '' };
    if (tempCodeName) params.codename = tempCodeName;
    setSearchParams(params);
  };

  const handleReset = () => { 
    setSearchParams({}); 
  };

  const openAddDialog = () => {
    setEditingPlatform(null); 
    reset(defaultPaymentConfigField); 
    setIsDialogOpen(true);
  };

  const openEditDialog = (platform) => {
    setEditingPlatform(platform); 
    reset({...platform}); 
    setIsDialogOpen(true); 
  };

  const onSubmit = async (formData) => {
    console.log('formData', formData)
    try {
      if (editingPlatform) {
        await updatePaymentPlatform.mutateAsync({ 
          id: Number(editingPlatform.id), 
          data: formData 
        });
      } else {
        await createPaymentPlatform.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status) => (
    status === 'active' 
      ? <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          {translate('Active')}
        </Badge> 
      : <Badge className="bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3 mr-1" />
          {translate('Inactive')}
        </Badge>
  );

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    )
  }

  if (!isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' }, 
        { label: translate('Payment Platforms'), page: 'ManagePaymentPlatforms' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          {translate('Payment Platforms')}
        </h1>
        <Button onClick={openAddDialog} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          {translate('Add Platform')}
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={translate('Search for Code or Name')} value={tempCodeName} onChange={(e) => setTempCodeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-10" />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 px-6">{translate('Search')}</Button>
            <Button variant="outline" onClick={handleReset}><X className="w-4 h-4 mr-2" />{translate('Reset')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Code')}</TableHead>
                <TableHead className="text-center">{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Category')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading 
                ? <InlineLoadingComponent isTable={true} colSpan={5}/> 
                : paymentPlatformList.items.length === 0 
                  ? <NoDataTableComponent colSpan={5}/> 
                  : paymentPlatformList.items.map(platform => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.code}</TableCell>
                  <TableCell className="font-medium text-center">{platform.name}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary" className="capitalize">{platform.category}</Badge></TableCell>
                  <TableCell className="text-center">{getStatusBadge(platform.status)}</TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" size="sm" 
                      onClick={() => openEditDialog(platform)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" size="sm" 
                      onClick={() => { 
                        setPlatformToDelete(platform); 
                        setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
            totalItems={paymentPlatformList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>
              {editingPlatform ? translate('Edit Platform') : translate('Add Platform')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm
              name="code"
              control={control}
              label={translate("Platform Code")}
              required
              errors={errors}
            /> 
            <TextInputForm
              name="name"
              control={control}
              label={translate("Platform Name")}
              required
              errors={errors}
            /> 
            <div className="grid grid-cols-2 gap-4">
              <SelectForm
                name="category"
                control={control}
                label={translate("Category")}
                placeholder={translate("Select category")}
                options={[
                  { value: "manual", label: "Manual" },
                  { value: "gateway", label: "Gateway" },
                ]}
                required
                errors={errors}
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
            </div>
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" className="bg-blue-600"
                disabled={createPaymentPlatform.isPending || updatePaymentPlatform.isPending || isSubmitting}>
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
        title={translate('Delete Platform')} 
        description={`${translate('Are you sure you want to delete')} "${platformToDelete?.name}"?`} 
        onConfirm={() =>
          platformToDelete &&
          deletePaymentPlatform.mutate(platformToDelete.id, {
            onSuccess: () => setDeleteDialogOpen(false)
          })
        }
        variant="destructive" 
      />
    </div>
  );
}