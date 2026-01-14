import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Save, Upload, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { showSuccess, showError, showInfo, showApiError } from '../components/ToastrNotification';
import { useCrudPermissions } from '../components/PermissionsContext';
import { translate } from '@/utils/translations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { 
  useGetDeadPersonPaginated, 
  useCreateDeadPerson, 
  useUpdateDeadPerson, 
  useDeleteDeadPerson 
} from '@/hooks/useDeadPersonMutations';
import { useGetGravePaginated } from '@/hooks/useGraveMutations';
import { trpc } from '@/utils/trpc';
import { Textarea } from '@/components/ui/textarea';

const emptyPerson = {
  name: '',
  ic_number: '',
  date_of_birth: '',
  date_of_death: '',
  cause_of_death: '',
  grave_id: '',
  biography: '',
  photourl: '',
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

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('dead_persons');

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin }
  );

  useEffect(() => {
    if (parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery.data);
    }
  }, [parentAndChildQuery.data]);

  const { deadPersonsList, isLoading, refetch } = useGetDeadPersonPaginated({
    page,
    pageSize: itemsPerPage,
    search: filterName,
    filterIC,
    filterGrave: filterGrave === 'all' ? undefined : Number(filterGrave),
    filterState: filterState === 'all' ? undefined : filterState,
    dateFrom,
    dateTo,
    accessibleOrgIds
  });

  const { gravesList } = useGetGravePaginated({
    pageSize: 1000,
    organisationIds: accessibleOrgIds
  });

  const createMutation = useCreateDeadPerson();
  const updateMutation = useUpdateDeadPerson();
  const deleteMutation = useDeleteDeadPerson();

  const openAddDialog = () => {
    setEditingPerson(null);
    setFormData(emptyPerson);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      ic_number: person.icnumber || '',
      date_of_birth: person.dateofbirth || '',
      date_of_death: person.dateofdeath || '',
      cause_of_death: person.causeofdeath || '',
      grave_id: person.grave?.id || '',
      biography: person.biography || '',
      photourl: person.photourl || '',
      gps_lat: person.latitude || '',
      gps_lng: person.longitude || '',
      qr_code: person.url || ''
    });
    setIsDialogOpen(true);
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
        () => showError('Tidak dapat mendapatkan lokasi. Sila aktifkan GPS.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError('GPS tidak disokong oleh pelayar ini');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return showError('Sila masukkan nama penuh');
    if (!formData.grave_id) return showError('Sila pilih tanah perkuburan');

    const submitData = {
      name: formData.name,
      icnumber: formData.ic_number || null,
      dateofbirth: formData.date_of_birth || null,
      dateofdeath: formData.date_of_death || null,
      causeofdeath: formData.cause_of_death || null,
      biography: formData.biography || null,
      photourl: formData.photourl || null,
      latitude: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      longitude: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      url: formData.qr_code || null,
      graveId: Number(formData.grave_id)
    };

    try {
      if (editingPerson) {
        await updateMutation.mutateAsync({ id: editingPerson.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {}
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    await deleteMutation.mutateAsync(personToDelete.id);
    setDeleteDialogOpen(false);
    setPersonToDelete(null);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }

      const data = await res.json();

      setFormData({ ...formData, photourl: data.file_url });
      showSuccess('Photo uploaded');
    } catch (err) {
      console.error(err);
      showError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  const totalPages = Math.ceil(deadPersonsList.total / itemsPerPage);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('managePersons'), page: 'ManageDeadPersons' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          {translate('managePersons')}
        </h1>
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('addNew')}
          </Button>
        )}
      </div>

      {/* Advanced Filter Card */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              placeholder={translate('searchDeceasedName')} 
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
            />
            <Input 
              placeholder="No. IC (Filter)" 
              value={filterIC} 
              onChange={(e) => setFilterIC(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger><SelectValue placeholder="Negeri" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('allStates')}</SelectItem>
                {STATES_MY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGrave} onValueChange={setFilterGrave}>
              <SelectTrigger><SelectValue placeholder="Kubur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Perkuburan</SelectItem>
                {gravesList.items.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setFilterName(''); setFilterIC(''); setFilterGrave('all'); }}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('fullName')}</TableHead>
                <TableHead>{translate('icNumber')}</TableHead>
                <TableHead>{translate('dateOfDeath')}</TableHead>
                <TableHead>{translate('cemeteryName')}</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-right">{translate('actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{translate('loading')}</TableCell></TableRow>
              ) : deadPersonsList.items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell></TableRow>
              ) : (
                deadPersonsList.items.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.icnumber || '-'}</TableCell>
                    <TableCell>{person.dateofdeath ? new Date(person.dateofdeath).toLocaleDateString('ms-MY') : '-'}</TableCell>
                    <TableCell>{person.grave?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => { setPersonToDelete(person); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
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
            onItemsPerPageChange={setItemsPerPage}
            totalItems={deadPersonsList.total}
          />
        )}
      </Card>

      {/* Full Add/Edit Dialog with Missing Fields Re-added */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? translate('edit') : translate('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{translate('fullName')} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{translate('icNumber')}</Label>
              <Input value={formData.ic_number} onChange={(e) => setFormData({...formData, ic_number: e.target.value})} placeholder="XXXXXX-XX-XXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('dateOfBirth')}</Label>
                <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
              </div>
              <div>
                <Label>{translate('dateOfDeath')}</Label>
                <Input type="date" value={formData.date_of_death} onChange={(e) => setFormData({...formData, date_of_death: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{translate('causeOfDeath')}</Label>
              <Input value={formData.cause_of_death} onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{translate('cemeteryName')} *</Label>
              <Select value={String(formData.grave_id)} onValueChange={(v) => setFormData({...formData, grave_id: v})}>
                <SelectTrigger><SelectValue placeholder={translate('selectCemetery')} /></SelectTrigger>
                <SelectContent>
                  {gravesList.items.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name} - {g.state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Re-added GPS Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('gpsLat')}</Label>
                <Input type="number" step="any" value={formData.gps_lat} onChange={(e) => setFormData({...formData, gps_lat: e.target.value})} placeholder="3.1390" />
              </div>
              <div>
                <Label>{translate('gpsLng')}</Label>
                <Input type="number" step="any" value={formData.gps_lng} onChange={(e) => setFormData({...formData, gps_lng: e.target.value})} placeholder="101.6869" />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
              <MapPin className="w-4 h-4 mr-2" /> {translate('getCurrentLocation')}
            </Button>

            <div className="space-y-2">
              <Label>{translate('qrCode')}</Label>
              <Input value={formData.qr_code} onChange={(e) => setFormData({...formData, qr_code: e.target.value})} placeholder="QRP-001" />
            </div>
            <div className="space-y-2">
              <Label>{translate('biography')}</Label>
              <Textarea value={formData.biography} onChange={(e) => setFormData({...formData, biography: e.target.value})} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>{translate('photo')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleFileUpload(file);                    
                  }}
                  disabled={uploading}
                />

                {uploading && <span className="text-sm text-gray-500">{translate('uploading...')}</span>}
              </div>
              {formData.photourl && (
                  <img 
                    src={`/api/file/${encodeURIComponent(formData.photourl)}`} 
                    alt="Preview" 
                  />
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />{translate('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('delete')}
        description={`Padam rekod "${personToDelete?.name}"?`}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}