import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag, Plus, Edit, Trash2, Save, Search, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useAdminAccess } from '@/utils/auth';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { 
  useGetOrganisationType, 
  useCreateOrganisationType, 
  useUpdateOrganisationType, 
  useDeleteOrganisationType 
} from '@/hooks/useOrganisationTypeMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';

export default function ManageOrganisationTypes() {
  const { loadingUser, isSuperAdmin, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTempSearch(urlSearch);
  }, [urlSearch]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const { data: result, isLoading: typesLoading } = useGetOrganisationType({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    hasAccess: hasAdminAccess
  });

  const types = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const createMutation = useCreateOrganisationType();
  const updateMutation = useUpdateOrganisationType();
  const deleteMutation = useDeleteOrganisationType();

  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingType(null);
    setFormData({ name: '', description: '', status: 'active' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      description: type.description || '',
      status: type.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFields(formData, [{ field: 'name', label: 'Name', type: 'text' }])) return;

    const action = editingType 
      ? updateMutation.mutateAsync({ id: editingType.id, ...formData }) 
      : createMutation.mutateAsync(formData);

    action.then((res) => {
      if(res) setIsDialogOpen(false);
    });
  };

  const confirmDelete = () => {
    if (!typeToDelete) return;
    deleteMutation.mutate({ id: typeToDelete.id }, {
      onSuccess: () => setDeleteDialogOpen(false)
    });
  };

  if (loadingUser) return <PageLoadingComponent/>;
  if (!isSuperAdmin) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' },
        { label: translate('Organisation Type'), page: 'ManageOrganisationTypes' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" /> 
          {translate('Manage Organisation Types')}
        </h1>
        <Button onClick={openAddDialog} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          {translate('Add Type')}
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search organization type name...')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-purple-600 px-6">
              {translate('Search')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
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
                <TableHead>{translate('Description')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-right">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typesLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4}/>
              ) : types.length === 0 ? (
                <NoDataTableComponent colSpan={4}/>
              ) : (
                types.map(type => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={type.status === 'active' ? 'default' : 'secondary'}>
                        {type.status === 'active' ? translate('Active') : translate('Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setTypeToDelete(type); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalItems > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }}
            totalItems={totalItems}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader><DialogTitle>{editingType ? translate('Edit Organization Type') : translate('Add New Organization Type')}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>{translate('Name')} *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
            <div><Label>{translate('Description')}</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
            <div>
              <Label>{translate('Status')}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{translate('Active')}</SelectItem>
                  <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-purple-600"><Save className="w-4 h-4 mr-2" /> {translate('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={translate('Delete Organization Type')} description={`${translate('Are you sure you want to delete')} "${typeToDelete?.name}"?`} onConfirm={confirmDelete} variant="destructive" />
    </div>
  );
}