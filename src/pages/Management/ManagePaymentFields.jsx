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

export default function ManagePaymentFields() {
  const { loadingUser, isSuperAdmin, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlPlatform = searchParams.get('platform') || 'all';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempPlatform, setTempPlatform] = useState(urlPlatform);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempSearch(urlSearch);
    setTempPlatform(urlPlatform);
  }, [urlSearch, urlPlatform]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState(defaultPaymentField);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const { data: result, isLoading } = useGetPaymentField({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    platformId: urlPlatform === 'all' ? undefined : Number(urlPlatform),
    hasAccess: isSuperAdmin
  });

  const { data: platformsResult } = useGetPaymentPlatform({ hasAccess: isSuperAdmin });
  const platforms = platformsResult?.items || [];
  const fields = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const { createPaymentField, updatePaymentField, deletePaymentField } = usePaymentFieldMutations();

  // 🔹 5. Search Handlers
  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    if (tempPlatform !== 'all') params.platform = tempPlatform;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFields(formData, [
      { field: 'paymentplatform', label: 'Platform', type: 'text' },
      { field: 'key', label: 'Field Key', type: 'text' },
      { field: 'label', label: 'Label', type: 'text' },
      { field: 'fieldtype', label: 'Type', type: 'text' }
    ])) return;

    const payload = { ...formData, paymentplatform: { id: Number(formData.paymentplatform) } };
    const action = editingField 
      ? updateMutation.mutateAsync({ id: editingField.id, data: payload })
      : createMutation.mutateAsync(payload);

    action.then((res) => { if (res) setIsDialogOpen(false); });
  };

  if (loadingUser) return <PageLoadingComponent/>;
  if (!isSuperAdmin) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' }, { label: translate('Payment Fields'), page: 'ManagePaymentFields' }]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-purple-600" />{translate('Payment Platform Fields')}</h1>
        <Button onClick={() => { setEditingField(null); setFormData(defaultPaymentField); setIsDialogOpen(true); }} className="bg-purple-600"><Plus className="w-4 h-4 mr-2" />{translate('Add Field')}</Button>
      </div>

      {/* 🔹 Standardized Filter Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={translate('Search for Label or Key...')} value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-10" />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 px-6">{translate('Search')}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={String(tempPlatform)} onValueChange={setTempPlatform}>
              <SelectTrigger><SelectValue placeholder={translate('Filter by Platform')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All Platforms')}</SelectItem>
                {platforms.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
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
                <TableHead>{translate('Field Key')}</TableHead>
                <TableHead>{translate('Label')}</TableHead>
                <TableHead>{translate('Type')}</TableHead>
                <TableHead>{translate('Required')}</TableHead>
                <TableHead className="text-right">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <InlineLoadingComponent isTable={true} colSpan={6}/> : fields.length === 0 ? <NoDataTableComponent colSpan={6}/> : fields.map(field => (
                <TableRow key={field.id}>
                  <TableCell><Badge variant="secondary">{field.paymentplatform?.name}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{field.key}</TableCell>
                  <TableCell>{field.label}</TableCell>
                  <TableCell className="capitalize">{field.fieldtype}</TableCell>
                  <TableCell>{field.required ? <Badge className="bg-red-100 text-red-700">{translate('Required')}</Badge> : <Badge variant="secondary">{translate('Optional')}</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingField(field); setFormData({ ...field, paymentplatform: field.paymentplatform?.id }); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setFieldToDelete(field); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {totalItems > 0 && <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})} itemsPerPage={itemsPerPage} onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }} totalItems={totalItems} />}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader><DialogTitle>{editingField ? translate('Edit Field') : translate('Add Field')}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('Platform')} *</Label>
              <Select value={String(formData.paymentplatform || '')} onValueChange={(v) => setFormData({ ...formData, paymentplatform: Number(v) })} disabled={!!editingField}>
                <SelectTrigger><SelectValue placeholder={translate('Select platform')} /></SelectTrigger>
                <SelectContent>{platforms.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{translate('Field Key')} *</Label><Input value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. secret_key" /></div>
            <div><Label>{translate('Label')} *</Label><Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="e.g. Secret Key" /></div>
            <div>
              <Label>{translate('Type')} *</Label>
              <Select value={formData.fieldtype} onValueChange={(v) => setFormData({ ...formData, fieldtype: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="textarea">Textarea</SelectItem><SelectItem value="password">Password</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Checkbox checked={formData.required} onCheckedChange={(c) => setFormData({ ...formData, required: c })} /><Label>{translate('Required Field')}</Label></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-purple-600"><Save className="w-4 h-4 mr-2" />{translate('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={translate('Delete Field')} description={`${translate('Are you sure you want to delete field')} "${fieldToDelete?.key}"?`} onConfirm={() => deleteMutation.mutate(fieldToDelete.id, { onSuccess: () => setDeleteDialogOpen(false) })} variant="destructive" />
    </div>
  );
}