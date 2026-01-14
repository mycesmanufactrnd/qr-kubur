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
import { showSuccess, showError, showInfo, showWarning, showApiError, showApiSuccess, showUniqueError } from '../components/ToastrNotification';
import { useCrudPermissions, usePermissions } from '../components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetGravePaginated, useCreateGrave, useUpdateGrave, useDeleteGrave } from '@/hooks/useGraveMutations';
import { trpc } from '@/utils/trpc';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import QRCodeDialog from '@/components/QRCodeDialog';


const emptyGrave = {
  cemetery_name: '',
  state: '',
  block: '',
  lot: '',
  gps_lat: '',
  gps_lng: '',
  organisation_id: '',
  status: 'active',
  total_graves: 0,
};

export default function ManageGraves() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
    isEmployee, 
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
  const [formData, setFormData] = useState(emptyGrave);
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
    setFormData(emptyGrave);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    setFormData({
      cemetery_name: grave.name || '',
      state: grave.state || '',
      block: grave.block || '',
      lot: grave.lot || '',
      gps_lat: grave.latitude || '',
      gps_lng: grave.longitude || '',
      organisation_id: grave.organisationid || '',
      status: grave.status || 'active',
      total_graves: grave.totalgraves || 0
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.cemetery_name?.trim()) return showError('Sila masukkan nama tanah perkuburan');
    if (!formData.state) return showError('Sila pilih negeri');

    const submitData = {
      name: formData.cemetery_name,
      state: formData.state,
      block: formData.block || null,
      lot: formData.lot || null,
      latitude: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      longitude: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      organisationid: formData.organisation_id ? Number(formData.organisation_id) : null,
      status: formData.status || 'active',
      totalgraves: parseInt(formData.total_graves) || 0
    };

    try {
      if (editingGrave) {
        await updateMutation.mutateAsync({ id: editingGrave.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Errors handled by hooks
    }
  };

// ManageGraves.jsx

const confirmDelete = async () => {
  if (!graveToDelete) return;

  try {
    // This calls the tRPC delete procedure via your hook
    await deleteMutation.mutateAsync(graveToDelete.id);
    
    // Close the dialog and clear the state
    setDeleteDialogOpen(false);
    setGraveToDelete(null);
  } catch (error) {
    // Errors are already handled by showApiError inside useDeleteGrave
    console.error("Delete failed:", error);
  }
};

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('manageGravesTitle'), page: 'ManageGraves' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {translate('manageGravesTitle')}
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
                {translate('importCSV')}
              </Button>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800">
                <Plus className="w-4 h-4 mr-2" />
                {translate('addGrave')}
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
              placeholder={translate('cemetery')}
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
                  <SelectItem value="all">{translate('allStates')}</SelectItem>
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
                <SelectItem value="all">{translate('allStatus')}</SelectItem>
                <SelectItem value="active">{translate('active')}</SelectItem>
                <SelectItem value="full">{translate('full')}</SelectItem>
                <SelectItem value="maintenance">{translate('maintenance')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder={translate('block') + '...'}
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
            />
            
            <Input
              placeholder={translate('lot') + '...'}
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
              {translate('reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('cemeteryName')}</TableHead>
                <TableHead className="text-center">{translate('totalGravesCount')}</TableHead>
                <TableHead className="text-center">{translate('state')}</TableHead>
                <TableHead className="text-center">{translate('block')}/{translate('lot')}</TableHead>
                <TableHead className="text-center">{translate('status')}</TableHead>
                <TableHead className="text-center">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : gravesList.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
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
                        {grave.status === 'active' ? translate('active') : 
                         grave.status === 'full' ? translate('full') : translate('maintenance')}
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
              {editingGrave ? translate('editGrave') : translate('addGrave')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={
            handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('cemeteryName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.cemetery_name}
                onChange={(e) => setFormData({...formData, cemetery_name: e.target.value})}
              />
            </div>
              <div>
                <Label>{translate('state')} <span className="text-red-500">*</span></Label>
                <Select 
                  /* Ensure value is never undefined/null to keep the component controlled */
                  value={formData.state || ""} 
                  onValueChange={(v) => setFormData({ ...formData, state: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={translate('selectStates')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Logic: If SuperAdmin, show the full list from enums. 
                      Otherwise, show only the states assigned to this user's profile.
                    */}
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
                <Label>{translate('block')}</Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('lot')}</Label>
                <Input
                  value={formData.lot}
                  onChange={(e) => setFormData({...formData, lot: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('gpsLat')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lat}
                  onChange={(e) => setFormData({...formData, gps_lat: e.target.value})}
                  placeholder="3.1390"
                />
              </div>
              <div>
                <Label>{translate('gpsLng')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lng}
                  onChange={(e) => setFormData({...formData, gps_lng: e.target.value})}
                  placeholder="101.6869"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  showInfo('Mendapatkan lokasi...');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setFormData({
                        ...formData,
                        gps_lat: position.coords.latitude.toFixed(16),
                        gps_lng: position.coords.longitude.toFixed(16)
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
              {translate('getCurrentLocation')}
            </Button>
            <div>
              <Label>{translate('managingOrg')}</Label>
              <Select value={formData.organisation_id} onValueChange={(v) => setFormData({...formData, organisation_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={translate('allManagingOrg')} />
                </SelectTrigger>
                <SelectContent>
                  {organisationsList.items.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('totalGravesCount')}</Label>
                <Input
                  type="number"
                  value={formData.total_graves}
                  onChange={(e) => setFormData({...formData, total_graves: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('status')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{translate('active')}</SelectItem>
                    <SelectItem value="full">{translate('full')}</SelectItem>
                    <SelectItem value="maintenance">{translate('maintenance')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('delete') + ' ' + translate('manageGravesTitle')}
        description={`${translate('delete')} "${graveToDelete?.cemetery_name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('delete')}
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