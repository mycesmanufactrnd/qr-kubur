import React, { useEffect, useState } from 'react';
import { translate } from '@/utils/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Edit, Trash2, Search, Filter, X, Save, Upload, Download } from 'lucide-react';
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
import { getParentAndChildOrgs, useAdminAccess } from '@/utils/index';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';

const emptyGrave = {
  cemetery_name: '',
  state: '',
  block: '',
  lot: '',
  gps_lat: '',
  gps_lng: '',
  organisation_id: '',
  qr_code: '',
  status: 'active',
  total_graves: 0
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

  const queryClient = useQueryClient();
  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('graves');

  useEffect(() => {
    if (!isSuperAdmin && currentUser?.organisation_id) {
      getParentAndChildOrgs(currentUser.organisation_id)
        .then(ids => setAccessibleOrgIds(ids))
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  const buildFilterQuery = () => {
    const query = {};

    if (!isSuperAdmin && currentUser?.organisation_id) {
      query.organisation_id = { 
        $in: accessibleOrgIds,
      };
    }
    
    if (filterState !== 'all') query.state = filterState;
    if (filterStatus !== 'all') query.status = filterStatus;
    if (filterBlock) query.block = { $regex: filterBlock, $options: 'i' };
    if (filterLot) query.lot = { $regex: filterLot, $options: 'i' };
    if (filterName) query.cemetery_name = { $regex: filterName, $options: 'i' };

    return query;
  };

  const { data: gravesList = [], isLoading } = useQuery({
    queryKey: [
      'graves-list',
      page, itemsPerPage,
      filterState, filterStatus, filterBlock, filterLot,
      filterName,
      currentUser, accessibleOrgIds
    ],
    queryFn: async () => {
      if (!accessibleOrgIds || accessibleOrgIds.length === 0) return [];
      return await base44.entities.Grave.filter(buildFilterQuery(), '-created_date', itemsPerPage, (page - 1) * itemsPerPage);
    },
    enabled: canView && !!currentUser && accessibleOrgIds.length > 0
  });

  const gravesDataReady = accessibleOrgIds.length > 0;

  const { data: totalRows = 0 } = useQuery({
    queryKey: [
      'graves-count',
      filterState, filterStatus, filterBlock,
      filterLot, filterName, currentUser,
      accessibleOrgIds
    ],
    queryFn: async () => {
      if (!accessibleOrgIds || accessibleOrgIds.length === 0) return [];
      const all = await base44.entities.Grave.filter(buildFilterQuery());
      return all.length;
    },
    enabled: canView && !!currentUser && accessibleOrgIds.length > 0
  });

  const totalPages = Math.ceil(totalRows / itemsPerPage);

  const { data: organisationsList = [] } = useQuery({
    queryKey: ['organisations-list'],
    queryFn: async () => {
      if (isSuperAdmin) {
        return base44.entities.Organisation.list();
      }

      if (currentUser?.organisation_id) {
        return getParentAndChildOrgs(currentUser.organisation_id, false);
      }

      return [];
    },
    enabled: !!currentUser,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Grave.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setFormData(emptyGrave);
      showApiSuccess('create');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Grave.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setEditingGrave(null);
      setFormData(emptyGrave);
      showApiSuccess('update');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Grave.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      showApiSuccess('delete');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const openAddDialog = () => {
    setEditingGrave(null);
    setFormData(emptyGrave);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    setFormData({
      cemetery_name: grave.cemetery_name || '',
      state: grave.state || '',
      block: grave.block || '',
      lot: grave.lot || '',
      gps_lat: grave.gps_lat || '',
      gps_lng: grave.gps_lng || '',
      organisation_id: grave.organisation_id || '',
      qr_code: grave.qr_code || '',
      status: grave.status || 'active',
      total_graves: grave.total_graves || 0
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cemetery_name?.trim()) {
      showError('Sila masukkan nama tanah perkuburan', 'Medan Diperlukan');
      return;
    }
    
    if (!formData.state) {
      showError('Sila pilih negeri', 'Medan Diperlukan');
      return;
    }

    if (formData.gps_lat && (isNaN(formData.gps_lat) || formData.gps_lat < -90 || formData.gps_lat > 90)) {
      showError('GPS Latitude mesti antara -90 hingga 90', 'Nilai Tidak Sah');
      return;
    }
    if (formData.gps_lng && (isNaN(formData.gps_lng) || formData.gps_lng < -180 || formData.gps_lng > 180)) {
      showError('GPS Longitude mesti antara -180 hingga 180', 'Nilai Tidak Sah');
      return;
    }
    if (formData.total_graves && (isNaN(formData.total_graves) || formData.total_graves < 0)) {
      showError('Jumlah kubur mesti nombor positif', 'Nilai Tidak Sah');
      return;
    }
    
    try {
      const data = {
        ...formData,
        gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
        gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
        total_graves: parseInt(formData.total_graves) || 0
      };

      if (editingGrave) {
        updateMutation.mutate({ id: editingGrave.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      showApiError(error);
    }
  };

  const handleDelete = (grave) => {
    setGraveToDelete(grave);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!graveToDelete) return;
    deleteMutation.mutate(graveToDelete.id);
    setDeleteDialogOpen(false);
    setGraveToDelete(null);
  };

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('adminDashboard'), page: 'AdminDashboard' },
          { label: translate('manageGravesTitle'), page: 'ManageGraves' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

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
              placeholder={translate('Grave Name')}
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))
        ) : gravesList.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{translate('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          gravesList.map(grave => (
            <Card key={grave.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{grave.cemetery_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{grave.state}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {grave.block && `${translate('block')} ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `${translate('lot')} ${grave.lot}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)} className="h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={gravesList.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('cemeteryName')}</TableHead>
                <TableHead className="text-center">{translate('totalGravesCount')}</TableHead>
                <TableHead className="text-center">{translate('qrCode')}</TableHead>
                <TableHead className="text-center">{translate('state')}</TableHead>
                <TableHead className="text-center">{translate('block')}/{translate('lot')}</TableHead>
                <TableHead className="text-center">{translate('status')}</TableHead>
                <TableHead className="text-center">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !gravesDataReady ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : gravesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                gravesList.map(grave => (
                  <TableRow key={grave.id}>
                    <TableCell className="font-medium">{grave.cemetery_name}</TableCell>
                    <TableCell className="text-center">{grave.total_graves}</TableCell>
                    <TableCell className="text-center">{grave.qr_code}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)}>
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
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={gravesList.length}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('cemeteryName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.cemetery_name}
                onChange={(e) => setFormData({...formData, cemetery_name: e.target.value})}
              />
            </div>
            <div>
              <Label>{translate('state')} <span className="text-red-500">*</span></Label>
              <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={translate('state')} />
                </SelectTrigger>
                <SelectContent>
                  {currentUserStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
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
                  <SelectValue placeholder={translate('managingOrg')} />
                </SelectTrigger>
                <SelectContent>
                  {organisationsList.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('qrCode')}</Label>
                <Input
                  value={formData.qr_code}
                  onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                  placeholder="QRK-001"
                />
              </div>
              <div>
                <Label>{translate('totalGravesCount')}</Label>
                <Input
                  type="number"
                  value={formData.total_graves}
                  onChange={(e) => setFormData({...formData, total_graves: e.target.value})}
                />
              </div>
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
    </div>
  );
}