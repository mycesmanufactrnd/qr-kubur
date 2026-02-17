import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useGetPaymentField, usePaymentFieldMutations } from '@/hooks/usePaymentFieldMutations';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetPaymentPlatform } from '@/hooks/usePaymentPlatformMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';
import { defaultPaymentField } from '@/utils/defaultformfields';
import SelectForm from '@/components/forms/SelectForm';
import TextInputForm from '@/components/forms/TextInputForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import { useForm } from 'react-hook-form';

export default function ManagePaymentFields() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlLabelKey = searchParams.get('labelkey') || '';
  const urlPlatform = searchParams.get('platform') || 'all';

  const [tempLabelKey, setTempLabelKey] = useState(urlLabelKey);
  const [tempPlatform, setTempPlatform] = useState(urlPlatform);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempLabelKey(urlLabelKey);
    setTempPlatform(urlPlatform);
  }, [urlLabelKey, urlPlatform]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }} = useForm({
    defaultValues: defaultPaymentField
  });

  const { paymentFieldList, totalPages, isLoading } = useGetPaymentField({
    page: urlPage,
    pageSize: itemsPerPage,
    filterLabelKey: urlLabelKey,
    platformId: urlPlatform === 'all' ? undefined : Number(urlPlatform),
  });

  const { paymentPlatformList } = useGetPaymentPlatform({});

  const { createPaymentField, updatePaymentField, deletePaymentField } = usePaymentFieldMutations();

  const handleSearch = () => {
    const params = { page: '1', labelkey: '', platform: '' };
    if (tempLabelKey) params.labelkey = tempLabelKey;
    if (tempPlatform !== 'all') params.platform = tempPlatform;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({})
  };

  const openAddDialog = () => {
    setEditingField(null); 
    reset(defaultPaymentField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (field) => {
    setEditingField(field); 
    reset({
      ...field,
      paymentplatform: field.paymentplatform?.id.toString()
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const payload = { 
      ...formData, 
      paymentplatform: { id: Number(formData.paymentplatform) } 
    };

    try {
      if (editingField) {
        await updatePaymentField.mutateAsync({ id: Number(editingField.id), data: formData });
      } else {
        await createPaymentField.mutateAsync(payload);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    )
  };

  if (!isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    )
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' }, 
        { label: translate('Payment Fields'), page: 'ManagePaymentFields' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-purple-600" />{translate('Payment Platform Fields')}</h1>
        <Button onClick={openAddDialog} className="bg-purple-600"><Plus className="w-4 h-4 mr-2" />{translate('Add Field')}</Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={translate('Search for Label or Key...')} value={tempLabelKey} onChange={(e) => setTempLabelKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-10" />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 px-6">{translate('Search')}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={String(tempPlatform)} onValueChange={setTempPlatform}>
              <SelectTrigger><SelectValue placeholder={translate('Filter by Platform')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All Platforms')}</SelectItem>
                {paymentPlatformList.items.map(p => 
                  <SelectItem 
                    key={p.id} 
                    value={String(p.id)}
                  >
                    {p.name}
                  </SelectItem>
                )}
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
                <TableHead>{translate('Platform')}</TableHead>
                <TableHead className="text-center">{translate('Field Key')}</TableHead>
                <TableHead className="text-center">{translate('Label')}</TableHead>
                <TableHead className="text-center">{translate('Type')}</TableHead>
                <TableHead className="text-center">{translate('Required')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading 
                ? <InlineLoadingComponent isTable={true} colSpan={6}/> 
                : paymentFieldList.items.length === 0 
                  ? <NoDataTableComponent colSpan={6}/> 
                  : paymentFieldList.items.map(field => (
                <TableRow key={field.id}>
                  <TableCell><Badge variant="secondary">{field.paymentplatform?.name}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{field.key}</TableCell>
                  <TableCell className="text-center">{field.label}</TableCell>
                  <TableCell className="capitalize text-center">{field.fieldtype}</TableCell>
                  <TableCell className="text-center">{field.required 
                    ? <Badge className="bg-red-100 text-red-700">{translate('Required')}</Badge> 
                    : <Badge variant="secondary">{translate('Optional')}</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" size="sm" 
                      onClick={() => openEditDialog(field)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" size="sm" 
                      onClick={() => { 
                        setFieldToDelete(field); 
                        setDeleteDialogOpen(true); 
                      }}
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
            totalItems={paymentFieldList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>
              {editingField ? translate('Edit Field') : translate('Add Field')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <SelectForm
              name="paymentplatform"
              control={control}
              label={translate("Platform")}
              placeholder={translate("Select Platform")}
              options={paymentPlatformList.items.map(platform => ({
                  value: platform.id,
                  label: platform.name,
              }))}
              required
              errors={errors}
              disabled={!!editingField}
            />
            <TextInputForm
              name="key"
              control={control}
              label={translate("Field Key")}
              required
              errors={errors}
            /> 
            <TextInputForm
              name="label"
              control={control}
              label={translate("Label")}
              required
              errors={errors}
            /> 
            <SelectForm
              name="fieldtype"
              control={control}
              label={translate("Type")}
              placeholder={translate("Select field type")}
              options={paymentPlatformList.items.map(platform => ({
                  value: platform.id,
                  label: platform.name,
              }))}
              required
              errors={errors}
              disabled={!!editingField}
            />
           <SelectForm
              name="fieldtype"
              control={control}
              label={translate("Type")}
              placeholder={translate("Select field type")}
              options={[
                { value: "text", label: "Text" },
                { value: "textarea", label: "Textarea" },
                { value: "password", label: "Password" },
              ]}
              required
              errors={errors}
            />
            <CheckboxForm
              name="required"
              control={control}
              label={translate("Is Required")}
            />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" className="bg-purple-600"
                disabled={createPaymentField.isPending || updatePaymentField.isPending || isSubmitting}
              >
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
        title={translate('Delete Field')} 
        description={`${translate('Are you sure you want to delete field')} "${fieldToDelete?.key}"?`} 
        onConfirm={() => deletePaymentField.mutate(fieldToDelete?.id, { onSuccess: () => setDeleteDialogOpen(false) })} 
        variant="destructive" 
      />
    </div>
  );
}