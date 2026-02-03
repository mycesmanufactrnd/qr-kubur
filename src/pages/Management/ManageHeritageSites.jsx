import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save, Upload, QrCode } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { Textarea } from '@/components/ui/textarea';
import { validateFields } from '@/utils/validations';
import { defaultGraveField, defaultHeritageField } from '@/utils/defaultformfields';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetHeritageSitesPaginated, useHeritageMutations } from '@/hooks/useHeritageMutations';

export default function ManageHeritageSites() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();

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
  const [editingHeritage, setEditingHeritage] = useState(null);
  const [formData, setFormData] = useState(defaultHeritageField);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [heritageToDelete, setHeritageToDelete] = useState(null);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('heritages');

  const { heritageSiteList, totalPages, isLoading } = useGetHeritageSitesPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName, 
    filterState: urlState === 'all' ? undefined : urlState,
  }); 

  const { createHeritage, updateHeritage, deleteHeritage } = useHeritageMutations();

  const handleSearch = () => {
    const params = { page: '1' };
    if (tempName) params.name = tempName;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingHeritage(null);
    setFormData(defaultGraveField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (heritage) => {
    setEditingHeritage(heritage);
    setFormData({
      name: heritage.name || '',
      state: heritage.state || '',
      address: heritage.address || '',
      latitude: heritage.latitude || '',
      longitude: heritage.longitude || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateFields(formData, [
      { field: 'name', label: 'Heritage Site', type: 'text' },
      { field: 'state', label: 'State', type: 'select' },
    ]);

    if (!isValid) return;

    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    try {
      if (editingHeritage) {
        await updateHeritage.mutateAsync({ id: editingHeritage.id, data: submitData });
      } else {
        await createHeritage.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {}
  };

  const confirmDelete = async () => {
    if (!heritageToDelete) return;

    try {
      await deleteHeritage.mutateAsync(heritageToDelete.id);
      
      setDeleteDialogOpen(false);
      setHeritageToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Heritage Sites'), page: 'ManageHeritageSites' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Heritage Sites')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Heritage Sites')}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Heritage Site')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={setTempState}>
                <SelectTrigger><SelectValue placeholder="Negeri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All states')}</SelectItem>
                  {STATES_MY.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" />
              {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Heritage Site')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6}/>
              ) : heritageSiteList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6}/>
              ) : (
                heritageSiteList.items.map(site => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell className="text-center">{site.state}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(site)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => {setHeritageToDelete(site); setDeleteDialogOpen(true);}}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
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
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={heritageSiteList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHeritage ? translate('Edit Heritage Site') : translate('Add Heritage Site')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('Heritage Site')} <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <Label>{translate('State')} <span className="text-red-500">*</span></Label>
              <Select value={formData.state || ""} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                <SelectTrigger><SelectValue placeholder={translate('Select states')} /></SelectTrigger>
                <SelectContent>
                  {(isSuperAdmin ? STATES_MY : (currentUserStates || [])).map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{translate('Address')}</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('GPS Latitude')}</Label>
                <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} />
              </div>
              <div>
                <Label>{translate('GPS Longitude')}</Label>
                <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setFormData({
                        ...formData,
                        latitude: position.coords.latitude.toFixed(16),
                        longitude: position.coords.longitude.toFixed(16)
                      });
                      showSuccess('Lokasi berjaya diperolehi');
                    },
                    () => showError('Tidak dapat mendapatkan lokasi.'),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('Get Current Location')}
            </Button>                       
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button type="submit" disabled={createHeritage.isPending || updateHeritage.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={translate('Delete Heritage Site')} description={`${translate('Delete')} "${heritageToDelete?.name}"?`} onConfirm={confirmDelete} confirmText={translate('Delete')} variant="destructive" />
    </div>
  );
}