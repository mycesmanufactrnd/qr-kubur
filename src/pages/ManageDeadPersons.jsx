import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Search, Save, Upload, MapPin } from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/translations';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { showSuccess, showError, showInfo, showApiError, showApiSuccess, showUniqueError } from '../components/ToastrNotification';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIC, setSearchIC] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterGrave, setFilterGrave] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState(emptyPerson);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [lang, setLang] = useState('ms');

  const queryClient = useQueryClient();
  const t = (key) => getAdminTranslation(key, lang);

  React.useEffect(() => {
    loadUser();
    setLang(getCurrentLanguage());
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        setCurrentUser(JSON.parse(appUserAuth));
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const hasViewPermission = isSuperAdmin || currentUser?.permissions?.dead_persons?.view;

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['admin-persons'],
    queryFn: () => base44.entities.DeadPerson.list('-created_date'),
    enabled: hasViewPermission
  });

  const { data: graves = [] } = useQuery({
    queryKey: ['graves'],
    queryFn: () => base44.entities.Grave.list()
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

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: t('adminDashboard'), page: 'AdminDashboard' },
          { label: t('managePersons'), page: 'ManageDeadPersons' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
            <p className="text-gray-600">{t('noPermission')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminStates = currentUser?.state || [];
  const accessibleGraves = isSuperAdmin ? graves : graves.filter(g => adminStates.includes(g.state));

  const accessiblePersons = persons.filter(person => {
    if (isSuperAdmin) return true;
    const grave = graves.find(g => g.id === person.grave_id);
    return grave && adminStates.includes(grave.state);
  });

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
    'Sarawak', 'Selangor', 'Terengganu', 'Wilayah Persekutuan'
  ];

  const stateFilteredGraves = filterState === 'all' 
    ? accessibleGraves 
    : accessibleGraves.filter(g => g.state === filterState);

  const filteredPersons = accessiblePersons.filter(person => {
    // Name search
    const matchesName = !searchQuery || 
      person.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // IC search
    const matchesIC = !searchIC || 
      person.ic_number?.includes(searchIC);
    
    // Date of death range
    let matchesDate = true;
    if (dateFrom || dateTo) {
      if (person.date_of_death) {
        const deathDate = new Date(person.date_of_death);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && deathDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && deathDate <= toDate;
        }
      } else {
        matchesDate = false;
      }
    }
    
    // Grave filter
    const matchesGrave = filterGrave === 'all' || person.grave_id === filterGrave;
    
    // State filter (through grave)
    let matchesState = true;
    if (filterState !== 'all') {
      const grave = graves.find(g => g.id === person.grave_id);
      matchesState = grave && grave.state === filterState;
    }
    
    return matchesName && matchesIC && matchesDate && matchesGrave && matchesState;
  });

  const paginatedPersons = filteredPersons.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);

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
            gps_lat: position.coords.latitude.toFixed(8),
            gps_lng: position.coords.longitude.toFixed(8)
          });
          showSuccess('Lokasi berjaya diperolehi');
        },
        (error) => {
          showError('Tidak dapat mendapatkan lokasi. Sila aktifkan GPS.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      showError('GPS tidak disokong oleh pelayar ini');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name?.trim()) {
      showError('Sila masukkan nama penuh', 'Medan Diperlukan');
      return;
    }
    if (!formData.grave_id) {
      showError('Sila pilih tanah perkuburan', 'Medan Diperlukan');
      return;
    }

    // Check QR code uniqueness
    if (formData.qr_code) {
      const qrExists = persons.some(p => 
        p.qr_code === formData.qr_code && p.id !== editingPerson?.id
      );
      if (qrExists) {
        showUniqueError('Kod QR', formData.qr_code);
        return;
      }
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

  const getGraveName = (graveId) => {
    const grave = graves.find(g => g.id === graveId);
    return grave?.cemetery_name || '-';
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: t('adminDashboard'), page: 'AdminDashboard' },
        { label: t('managePersons'), page: 'ManageDeadPersons' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('managePersons')}
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          {t('addNew')}
        </Button>
      </div>

      {/* Advanced Search */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Carian Lanjutan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Nama Penuh</Label>
              <Input
                placeholder="Cari nama si mati..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">No. IC</Label>
              <Input
                placeholder="XXXXXX-XX-XXXX"
                value={searchIC}
                onChange={(e) => setSearchIC(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Tarikh Meninggal Dari</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">Tarikh Meninggal Hingga</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <div>
                <Label className="text-sm">Negeri</Label>
                <Select value={filterState} onValueChange={(v) => {
                  setFilterState(v);
                  setFilterGrave('all');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {malaysianStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm">Tanah Perkuburan</Label>
              <Select value={filterGrave} onValueChange={setFilterGrave}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tanah perkuburan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tanah Perkuburan</SelectItem>
                  {stateFilteredGraves.map(grave => (
                    <SelectItem key={grave.id} value={grave.id}>
                      {grave.cemetery_name} - {grave.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchQuery || searchIC || dateFrom || dateTo || filterGrave !== 'all' || filterState !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSearchIC('');
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

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Menunjukkan {filteredPersons.length} daripada {accessiblePersons.length} rekod
      </div>

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
        ) : paginatedPersons.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          paginatedPersons.map(person => (
            <Card key={person.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{person.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{person.ic_number || '-'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {person.date_of_death ? new Date(person.date_of_death).toLocaleDateString('ms-MY') : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getGraveName(person.grave_id)}</p>
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
            totalItems={filteredPersons.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fullName')}</TableHead>
                <TableHead>{t('icNumber')}</TableHead>
                <TableHead>{t('dateOfDeath')}</TableHead>
                <TableHead>{t('cemeteryName')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{t('loading')}</TableCell>
                </TableRow>
              ) : paginatedPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{t('noRecords')}</TableCell>
                </TableRow>
              ) : (
                paginatedPersons.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.ic_number || '-'}</TableCell>
                    <TableCell>
                      {person.date_of_death 
                        ? new Date(person.date_of_death).toLocaleDateString('ms-MY')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getGraveName(person.grave_id)}</TableCell>
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
            totalItems={filteredPersons.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? t('edit') : t('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('fullName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('icNumber')}</Label>
              <Input
                value={formData.ic_number}
                onChange={(e) => setFormData({...formData, ic_number: e.target.value})}
                placeholder="XXXXXX-XX-XXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('dateOfBirth')}</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
              <div>
                <Label>{t('dateOfDeath')}</Label>
                <Input
                  type="date"
                  value={formData.date_of_death}
                  onChange={(e) => setFormData({...formData, date_of_death: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>{t('causeOfDeath')}</Label>
              <Input
                value={formData.cause_of_death}
                onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('cemeteryName')} <span className="text-red-500">*</span></Label>
              <Select value={formData.grave_id} onValueChange={(v) => setFormData({...formData, grave_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectGrave')} />
                </SelectTrigger>
                <SelectContent>
                  {accessibleGraves.map(grave => (
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
              {t('getCurrentLocation')}
            </Button>
            <div>
              <Label>{t('qrCode')}</Label>
              <Input
                value={formData.qr_code}
                onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                placeholder="QRP-001"
              />
            </div>
            <div>
              <Label>{t('biography')}</Label>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({...formData, biography: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label>{t('photo')}</Label>
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
                        {uploading ? t('loading') : t('upload')}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('delete')}
        description={`${t('confirmDelete')} "${personToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={t('delete')}
        variant="destructive"
      />
    </div>
  );
}