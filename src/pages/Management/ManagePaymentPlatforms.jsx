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
import { 
  useCreatePaymentPlatform,
  useDeletePaymentPlatform,
  useGetPaymentPlatform,
  useUpdatePaymentPlatform, 
} from '@/hooks/usePaymentPlatformMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';
import { defaultPaymentConfigField } from '@/utils/defaultformfields';

export default function ManagePaymentPlatforms() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { setTempSearch(urlSearch); }, [urlSearch]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState(defaultPaymentConfigField);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState(null);

  const { data: result, isLoading } = useGetPaymentPlatform({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    hasAccess: isSuperAdmin
  });

  const platforms = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const createMutation = useCreatePaymentPlatform();
  const updateMutation = useUpdatePaymentPlatform();
  const deleteMutation = useDeletePaymentPlatform();

  const handleSearch = () => {
    setSearchParams({ page: '1', search: tempSearch });
  };

  const handleReset = () => { setSearchParams({}); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFields(formData, [{ field: 'code', label: 'Code', type: 'text' }, { field: 'name', label: 'Name', type: 'text' }])) return;
    
    const action = editingPlatform 
      ? updateMutation.mutateAsync({ id: editingPlatform.id, data: formData })
      : createMutation.mutateAsync(formData);

    action.then((res) => { if (res) setIsDialogOpen(false); });
  };

  const getStatusBadge = (status) => (
    status === 'active' 
      ? <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('Active')}</Badge> 
      : <Badge className="bg-gray-100 text-gray-700"><XCircle className="w-3 h-3 mr-1" />{translate('Inactive')}</Badge>
  );

  if (loadingUser) return <PageLoadingComponent/>;
  if (!isSuperAdmin) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' }, { label: translate('Payment Platforms'), page: 'ManagePaymentPlatforms' }]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" />{translate('Payment Platforms')}</h1>
        <Button onClick={() => { setEditingPlatform(null); setFormData(defaultPaymentConfigField); setIsDialogOpen(true); }} className="bg-blue-600"><Plus className="w-4 h-4 mr-2" />{translate('Add Platform')}</Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={translate('Search for Name or Code...')} value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-10" />
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
                <TableHead>{translate('Name')}</TableHead>
                <TableHead>{translate('Category')}</TableHead>
                <TableHead>{translate('Status')}</TableHead>
                <TableHead className="text-right">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <InlineLoadingComponent isTable={true} colSpan={5}/> : platforms.length === 0 ? <NoDataTableComponent colSpan={5}/> : platforms.map(platform => (
                <TableRow key={platform.id}>
                  <TableCell className="font-mono">{platform.code}</TableCell>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{platform.category}</Badge></TableCell>
                  <TableCell>{getStatusBadge(platform.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingPlatform(platform); setFormData(platform); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setPlatformToDelete(platform); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingPlatform ? translate('Edit Platform') : translate('Add Platform')}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>{translate('Platform Code')} *</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={!!editingPlatform} /></div>
            <div><Label>{translate('Platform Name')} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{translate('Category')} *</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="gateway">Gateway</SelectItem></SelectContent></Select></div>
              <div><Label>{translate('Status')} *</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600"><Save className="w-4 h-4 mr-2" />{translate('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🔹 FIXED: Passes the ID directly to the mutation */}
      <ConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        title={translate('Delete Platform')} 
        description={`${translate('Are you sure you want to delete')} "${platformToDelete?.name}"?`} 
        onConfirm={() => deleteMutation.mutate(platformToDelete.id, { onSuccess: () => setDeleteDialogOpen(false) })} 
        variant="destructive" 
      />
    </div>
  );
}