import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Search, Save, Upload, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { showSuccess, showError, showInfo, showApiError, showApiSuccess, showUniqueError } from '../components/ToastrNotification';
import { useCrudPermissions, usePermissions } from '../components/PermissionsContext';
import { translate } from '@/utils/translations';
import { getLabelFromId, getParentAndChildOrgs } from '@/utils/helpers';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';

const emptyPerson = {
  name: '',
  ic_number: '',
  date_of_birth: '',
  date_of_death: '',
  cause_of_death: '',
  grave_id: '',
  biography: '',
  photo_url: '',
  gps_lat: '',
  gps_lng: '',
  qr_code: ''
};

export default function ManageDeadPersons() {
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
  const [filterIC, setFilterIC] = useState('');
  const [filterGrave, setFilterGrave] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState(emptyPerson);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);
  const [accessibleGravesIds, setAccessibleGravesIds] = useState([]);
  const queryClient = useQueryClient();
  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('dead_persons');

  useEffect(() => {
    if (!isSuperAdmin && currentUser?.organisation_id) {
      getParentAndChildOrgs(currentUser.organisation_id)
        .then((orgIds) => {
          setAccessibleOrgIds(orgIds);
          return getAccessibleGravesIds(orgIds);
        })
        .then(gravesIds => setAccessibleGravesIds(gravesIds))
        .catch(err => console.error(err));

    }
  }, [currentUser]);

  const getAccessibleGravesIds = async (orgIds) => {
    const graves = await base44.entities.Grave.filter({ organisation_id: { $in: orgIds } });
    return graves.map(g => g.id);
  };

  const buildDeadPersonFilterQuery = () => {
    const query = {};
    if (!isSuperAdmin && currentUser?.organisation_id) {
      query.grave_id = { $in: accessibleGravesIds };
    }

    if (filterState !== 'all') query.state = filterState;
    if (filterGrave !== 'all') query.grave_id = filterGrave;
    if (filterName) query.name = { $regex: filterName, $options: 'i' };
    if (filterIC) query.ic_number = { $regex: filterIC, $options: 'i' };

    if (dateFrom || dateTo) {
      query.date_of_death = {};
      if (dateFrom) query.date_of_death.$gte = dateFrom;
      if (dateTo) query.date_of_death.$lte = dateTo;
    }

    return query;
  };

  const { data: deadPersonsList = [], isLoading } = useQuery({
    queryKey: [
      'dead-persons-list', 
      page, itemsPerPage, currentUser, 
      filterState, filterGrave, filterName, filterIC, dateFrom, dateTo,
      accessibleGravesIds
    ],
    queryFn: async () => {
      const filterQuery = buildDeadPersonFilterQuery();
      return base44.entities.DeadPerson.filter(filterQuery, '-created_date', itemsPerPage, (page - 1) * itemsPerPage);
    },
    enabled: canView && !!currentUser && accessibleGravesIds.length > 0
  });

  const { data: totalRows = 0 } = useQuery({
    queryKey: [
      'dead-persons-count', 
      currentUser, accessibleGravesIds,
      filterState, filterGrave, filterName, filterIC, dateFrom, dateTo
    ],
    queryFn: async () => {
      const filterQuery = buildDeadPersonFilterQuery();
      const all = await base44.entities.DeadPerson.filter(filterQuery);
      return all.length;
    },
    enabled: canView && !!currentUser && accessibleGravesIds.length > 0
  });

  const totalPages = Math.ceil(totalRows / itemsPerPage);

  const { data: gravesList = [], isLoading: gravesLoading } = useQuery({
    queryKey: ['graves-list', accessibleOrgIds],
    queryFn: async () => {
      if (!accessibleOrgIds || accessibleOrgIds.length === 0) return [];
      return await base44.entities.Grave.filter({ organisation_id: { $in: accessibleOrgIds } });
    },
    enabled: canView && accessibleOrgIds.length > 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeadPerson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      setIsDialogOpen(false);
      setFormData(emptyPerson);
      showApiSuccess('create');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeadPerson.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      setIsDialogOpen(false);
      setEditingPerson(null);
      setFormData(emptyPerson);
      showApiSuccess('update');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeadPerson.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      showApiSuccess('delete');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const openAddDialog = () => {
    setEditingPerson(null);
    setFormData(emptyPerson);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      ic_number: person.ic_number || '',
      date_of_birth: person.date_of_birth || '',
      date_of_death: person.date_of_death || '',
      cause_of_death: person.cause_of_death || '',
      grave_id: person.grave_id || '',
      biography: person.biography || '',
      photo_url: person.photo_url || '',
      gps_lat: person.gps_lat || '',
      gps_lng: person.gps_lng || '',
      qr_code: person.qr_code || ''
    });
    setIsDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, photo_url: file_url});
      showApiSuccess('upload');
    } catch (error) {
      showApiError(error);
    } finally {
      setUploading(false);
    }
  };

  const getCurrentLocation = () => {
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation - Required fields
    if (!formData.name?.trim()) {
      showError('Sila masukkan nama penuh', 'Medan Diperlukan');
      return;
    }
    if (!formData.grave_id) {
      showError('Sila pilih tanah perkuburan', 'Medan Diperlukan');
      return;
    }

    // Additional validation
    if (formData.ic_number && formData.ic_number.trim() && !/^\d{6}-\d{2}-\d{4}$/.test(formData.ic_number)) {
      showError('Format No. IC tidak sah (contoh: 900101-01-1234)', 'Format Tidak Sah');
      return;
    }
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Format email tidak sah', 'Format Tidak Sah');
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

    try {
      const data = {
        ...formData,
        gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
        gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null
      };

      if (editingPerson) {
        updateMutation.mutate({ id: editingPerson.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      showApiError(error);
    }
  };

  const handleDelete = (person) => {
    setPersonToDelete(person);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!personToDelete) return;
    deleteMutation.mutate(personToDelete.id);
    setDeleteDialogOpen(false);
    setPersonToDelete(null);
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
          { label: translate('managePersons'), page: 'ManageDeadPersons' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('managePersons'), page: 'ManageDeadPersons' }
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {translate('managePersons')}
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          {translate('addNew')}
        </Button>
      </div>
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Carian Lanjutan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Nama Penuh</Label>
              <Input
                placeholder="Cari nama si mati..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">No. IC</Label>
              <Input
                placeholder="XXXXXX-XX-XXXX"
                value={filterIC}
                onChange={(e) => setFilterIC(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Tarikh Meninggal Dari</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Tarikh Meninggal Hingga</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <div>
                <Label className="text-sm text-gray-600 dark:text-gray-400">Negeri</Label>
                <Select value={filterState} onValueChange={(v) => {
                  setFilterState(v);
                  setFilterGrave('all');
                }}>
                  <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {STATES_MY.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Tanah Perkuburan</Label>
              <Select value={filterGrave} onValueChange={setFilterGrave}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="Pilih tanah perkuburan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tanah Perkuburan</SelectItem>
                  {gravesList.map(grave => (
                    <SelectItem key={grave.id} value={grave.id}>
                      {grave.cemetery_name} - {grave.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filterName || filterIC || dateFrom || dateTo || filterGrave !== 'all' || filterState !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterName('');
                  setFilterIC('');
                  setDateFrom('');
                  setDateTo('');
                  setFilterGrave('all');
                  setFilterState('all');
                }}
              >
                Reset Semua Carian
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))
        ) : deadPersonsList.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{translate('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          deadPersonsList.map(person => (
            <Card key={person.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{person.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{person.ic_number || '-'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {person.date_of_death ? new Date(person.date_of_death).toLocaleDateString('ms-MY') : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getLabelFromId(gravesList, person.grave_id, 'cemetery_name')}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)} className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(person)} className="h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
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
            totalItems={deadPersonsList.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('fullName')}</TableHead>
                <TableHead>{translate('icNumber')}</TableHead>
                <TableHead>{translate('dateOfDeath')}</TableHead>
                <TableHead>{translate('cemeteryName')}</TableHead>
                <TableHead className="text-right">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : deadPersonsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                deadPersonsList.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.ic_number || '-'}</TableCell>
                    <TableCell>
                      {person.date_of_death 
                        ? new Date(person.date_of_death).toLocaleDateString('ms-MY')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getLabelFromId(gravesList, person.grave_id, 'cemetery_name')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(person)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
            totalItems={deadPersonsList.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? translate('edit') : translate('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('fullName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>{translate('icNumber')}</Label>
              <Input
                value={formData.ic_number}
                onChange={(e) => setFormData({...formData, ic_number: e.target.value})}
                placeholder="XXXXXX-XX-XXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('dateOfBirth')}</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
              <div>
                <Label>{translate('dateOfDeath')}</Label>
                <Input
                  type="date"
                  value={formData.date_of_death}
                  onChange={(e) => setFormData({...formData, date_of_death: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>{translate('causeOfDeath')}</Label>
              <Input
                value={formData.cause_of_death}
                onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})}
              />
            </div>
            <div>
              <Label>{translate('cemeteryName')} <span className="text-red-500">*</span></Label>
              <Select value={formData.grave_id} onValueChange={(v) => setFormData({...formData, grave_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={translate('selectGrave')} />
                </SelectTrigger>
                <SelectContent>
                  {gravesList.map(grave => (
                    <SelectItem key={grave.id} value={grave.id}>
                      {grave.cemetery_name} - {grave.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GPS Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lat}
                  onChange={(e) => setFormData({...formData, gps_lat: e.target.value})}
                  placeholder="3.1390"
                />
              </div>
              <div>
                <Label>GPS Longitude</Label>
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
              onClick={getCurrentLocation}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('getCurrentLocation')}
            </Button>
            <div>
              <Label>{translate('qrCode')}</Label>
              <Input
                value={formData.qr_code}
                onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                placeholder="QRP-001"
              />
            </div>
            <div>
              <Label>{translate('biography')}</Label>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({...formData, biography: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label>{translate('photo')}</Label>
              <div className="flex items-center gap-3">
                {formData.photo_url && (
                  <img src={formData.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button type="button" variant="outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? translate('loading') : translate('upload')}
                      </span>
                    </Button>
                  </label>
                </div>
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
        title={translate('delete')}
        description={`${translate('confirmDelete')} "${personToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('delete')}
        variant="destructive"
      />
    </div>
  );
}