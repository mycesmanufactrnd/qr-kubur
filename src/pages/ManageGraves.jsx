import React, { useEffect, useState } from 'react';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, Filter, X, Save, Upload, Download, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { showSuccess, showError } from '../components/ToastrNotification';
import { useCrudPermissions } from '../components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetGravePaginated, useCreateGrave, useUpdateGrave, useDeleteGrave } from '@/hooks/useGraveMutations';
import { trpc } from '@/utils/trpc';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import QRCodeDialog from '@/components/QRCodeDialog';
import { Textarea } from '@/components/ui/textarea';
import { validateFields } from '@/utils/validations';
import { defaultGraveField } from '@/utils/defaultformfields';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';

export default function ManageGraves() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();
  
  const [filterName, setFilterName] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [formData, setFormData] = useState(defaultGraveField);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrGrave, setQRGrave] = useState({});

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('graves');
  
  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    { enabled: !!currentUser && !!currentUser?.organisation?.id && !isSuperAdmin }
  );
  
  useEffect(() => {
    if (parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery.data);
    }
  }, [parentAndChildQuery.data]);

  const {
    gravesList,
    totalPages,
    isLoading,
  } = useGetGravePaginated({
    page,
    pageSize: itemsPerPage,
    search: filterName,
    filterState: filterState === 'all' ? undefined : filterState,
    filterStatus: filterStatus === 'all' ? undefined : filterStatus,
    filterBlock: filterBlock || undefined, 
    filterLot: filterLot || undefined,     
    organisationIds: accessibleOrgIds
  }); 

  const { organisationsList } = useGetOrganisationPaginated({})

  const createMutation = useCreateGrave();
  const updateMutation = useUpdateGrave();
  const deleteMutation = useDeleteGrave();

  const openAddDialog = () => {
    setEditingGrave(null);
    setFormData(defaultGraveField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    setFormData({
      name: grave.name || '',
      state: grave.state || '',
      block: grave.block || '',
      lot: grave.lot || '',
      address: grave.address || '',
      latitude: grave.latitude || '',
      longitude: grave.longitude || '',
      organisation: grave.organisation?.id || null,
      status: grave.status || 'active',
      totalgraves: grave.totalgraves || 0
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = validateFields(formData, [
      { field: 'name', label: 'Grave', type: 'text' },
      { field: 'state', label: 'State', type: 'select' },
    ]);

    if (!isValid) return;

    const submitData = {
      name: formData.name,
      state: formData.state,
      block: formData.block || '',
      lot: formData.lot || '',
      address: formData.address || '',
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      organisation: formData.organisation ? { id: Number(formData.organisation) } : null,
      status: formData.status || 'active',
      totalgraves: Number(formData.totalgraves) || 0
    };

    try {
      if (editingGrave) {
        await updateMutation.mutateAsync({ id: editingGrave.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
    }
  };

const confirmDelete = async () => {
  if (!graveToDelete) return;

  try {
    await deleteMutation.mutateAsync(graveToDelete.id);
    
    setDeleteDialogOpen(false);
    setGraveToDelete(null);
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
        { label: translate('Manage Graves'), page: 'ManageGraves' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {translate('Manage Graves')}
          </h1>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button 
                onClick={() => setImportDialogOpen(true)} 
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <Upload className="w-4 h-4 mr-2" />
                {translate('Import CSV')}
              </Button>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800">
                <Plus className="w-4 h-4 mr-2" />
                {translate('Add Grave')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={translate('Cemetery name')}
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className={`grid gap-3 ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {isSuperAdmin && (
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue placeholder="Negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All states')}</SelectItem>
                  {STATES_MY.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All status')}</SelectItem>
                <SelectItem value="active">{translate('Active')}</SelectItem>
                <SelectItem value="full">{translate('Full')}</SelectItem>
                <SelectItem value="maintenance">{translate('Maintenance')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder={translate('Block') + '...'}
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
            />
            
            <Input
              placeholder={translate('Lot') + '...'}
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
            />
            
            <Button
              variant="outline"
              onClick={() => {
                setFilterName('');
                setFilterState('all');
                setFilterStatus('all');
                setFilterBlock('');
                setFilterLot('');
              }}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Cemetery name')}</TableHead>
                <TableHead className="text-center">{translate('Total Graves')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Block')}/{translate('Lot')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6}/>
              ) : gravesList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6}/>
              ) : (
                gravesList.items.map(grave => (
                  <TableRow key={grave.id}>
                    <TableCell className="font-medium">{grave.name}</TableCell>
                    <TableCell className="text-center">{grave.totalgraves}</TableCell>
                    <TableCell className="text-center">{grave.state}</TableCell>
                    <TableCell className="text-center">
                      {grave.block && `${translate('block')} ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `${translate('lot')} ${grave.lot}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        grave.status === 'active' ? 'default' : 
                        grave.status === 'full' ? 'destructive' : 'secondary'
                      }>
                        {grave.status === 'active' ? translate('Active') : 
                         grave.status === 'full' ? translate('Full') : translate('Maintenance')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setGraveToDelete(grave); 
                            setDeleteDialogOpen(true); 
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      {
                        <Button variant="ghost" size="sm" 
                          onClick={() => { setQRGrave({
                            type: "grave",
                            id: grave.id
                          }); setQRDialogOpen(true); }}
                        >
                          <QrCode className="w-4 h-4 text-green-500" />
                        </Button>
                      }                
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
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={gravesList.items.length}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingGrave ? translate('Edit Grave') : translate('Add Grave')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={
            handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('Cemetery name')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
              <div>
                <Label>{translate('State')} <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.state || ""} 
                  onValueChange={(v) => setFormData({ ...formData, state: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={translate('Select states')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(isSuperAdmin ? STATES_MY : (currentUserStates || [])).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('Block')}</Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('Lot')}</Label>
                <Input
                  value={formData.lot}
                  onChange={(e) => setFormData({...formData, lot: e.target.value})}
                />
              </div>
            </div>
            <Label>{translate('Address')}</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.address})}
              rows={3}
              className="dark:bg-gray-700 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('GPS Latitude')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('GPS Longitude')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                />
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
                    (error) => {
                      showError('Tidak dapat mendapatkan lokasi. Sila aktifkan GPS.');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                } else {
                  showError('GPS tidak disokong oleh pelayar ini');
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('Get Current Location')}
            </Button>
            <div>
              <Label>{translate('Managing Organisation')}</Label>
              <Select value={String(formData.organisation)} onValueChange={(value) => setFormData({...formData, organisation: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={translate('All managing organisations')} />
                </SelectTrigger>
                <SelectContent>
                  {organisationsList.items.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('Total Graves')}</Label>
                <Input
                  type="number"
                  value={formData.totalgraves}
                  onChange={(e) => setFormData({...formData, totalgraves: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('Status')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{translate('Active')}</SelectItem>
                    <SelectItem value="full">{translate('Full')}</SelectItem>
                    <SelectItem value="maintenance">{translate('Maintenance')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
        title={translate('Delete') + ' ' + translate('Manage Graves')}
        description={`${translate('Delete')} "${graveToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrGrave}
      />
    </div>
  );
}