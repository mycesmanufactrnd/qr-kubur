import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Save, Upload, MapPin, QrCode } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCodeDialog from "@/components/QRCodeDialog";
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
import { validateFields } from '@/utils/validations';
import { defaultDeadPersonField } from '@/utils/defaultformfields';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';

export default function ManageDeadPersons() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
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
  const [formData, setFormData] = useState(defaultDeadPersonField);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrPerson, setQRPerson] = useState({});
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);

  const {
    loading: permissionsLoading,
    canEdit, canDelete
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

  const { deadPersonsList, isLoading: isLoadingDeadPerson, refetch } = useGetDeadPersonPaginated({
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

  const { gravesList, isLoading: isLoadingGrave } = useGetGravePaginated({
    pageSize: 1000,
    organisationIds: accessibleOrgIds
  });

  const createMutation = useCreateDeadPerson();
  const updateMutation = useUpdateDeadPerson();
  const deleteMutation = useDeleteDeadPerson();

  const openAddDialog = () => {
    setEditingPerson(null);
    setFormData(defaultDeadPersonField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      icnumber: person.icnumber || '',
      dateofbirth: person.dateofbirth || '',
      dateofdeath: person.dateofdeath || '',
      causeofdeath: person.causeofdeath || '',
      grave: person.grave?.id || '',
      biography: person.biography || '',
      photourl: person.photourl || '',
      gpslatitude: person.latitude || '',
      gpslongitude: person.longitude || '',
    });
    setIsDialogOpen(true);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            gpslatitude: position.coords.latitude.toFixed(16),
            gpslongitude: position.coords.longitude.toFixed(16)
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

    const isValid = validateFields(formData, [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'grave', label: 'Grave', type: 'select' },
    ]);

    if (!isValid) return;

    const submitData = {
      name: formData.name,
      icnumber: formData.icnumber || null,
      dateofbirth: formData.dateofbirth || null,
      dateofdeath: formData.dateofdeath || null,
      causeofdeath: formData.causeofdeath || null,
      biography: formData.biography || null,
      photourl: formData.photourl || null,
      latitude: formData.gpslatitude ? parseFloat(formData.gpslatitude) : null,
      longitude: formData.gpslongitude ? parseFloat(formData.gpslongitude) : null,
      graveId: Number(formData.grave)
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

      const res = await fetch('/api/upload/bucket-grave', {
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
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Deceased'), page: 'ManageDeadPersons' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {translate('Manage Deceased')}
          </h1>
        </div>
          <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add New')}
          </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{translate('Advanced Search')}</h3>
          </div>

          {/* Row 1: Name + IC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('Full Name')}</Label>
              <Input
                placeholder={translate('Search for the deceased\'s name...')} 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('IC Number')}</Label>
              <Input
                placeholder="XXXXXX-XX-XXXX"
                value={filterIC}
                onChange={(e) => setFilterIC(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Row 2: Date of Birth + Date of Death */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('Date of Birth')}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('Date of Death')}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-gray-300 dark:border-white dark:text-white"
              />
            </div>
          </div>

          {/* Row 3: State (Super Admin) + Grave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <div>
                <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('State')}</Label>
                <Select
                  value={filterState}
                  onValueChange={(v) => {
                    setFilterState(v);
                    setFilterGrave('all'); // Reset grave when state changes
                  }}
                >
                  <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translate('All states')}</SelectItem>
                    {STATES_MY.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('Cemetery Name')}</Label>
              <Select
                value={filterGrave}
                onValueChange={(v) => setFilterGrave(v)}
              >
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder={translate('Select cemetery')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All cemeteries')}</SelectItem>
                  {gravesList.items.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name} - {g.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Full Name')}</TableHead>
                <TableHead className="text-center">{translate('IC Number')}</TableHead>
                <TableHead className="text-center">{translate('Date of Death')}</TableHead>
                <TableHead className="text-center">{translate('Cemetery Name')}</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">{translate('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDeadPerson || isLoadingGrave ? (
                <InlineLoadingComponent isTable={true} colSpan={5}/>
              ) : deadPersonsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={5} />
              ) : (
                deadPersonsList.items.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-center">{person.icnumber || '-'}</TableCell>
                    <TableCell className="text-center">{person.dateofdeath ? new Date(person.dateofdeath).toLocaleDateString('ms-MY') : '-'}</TableCell>
                    <TableCell className="text-center">{person.grave?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      {
                        canEdit && 
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                      }
                      {
                        canDelete && 
                          <Button variant="ghost" size="sm" onClick={() => { setPersonToDelete(person); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                      }
                      {
                        <Button variant="ghost" size="sm" 
                          onClick={() => { setQRPerson({
                            type: "deadperson",
                            id: person.id
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
            onItemsPerPageChange={setItemsPerPage}
            totalItems={deadPersonsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? translate('edit') : translate('Add New')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{translate('Full Name')} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{translate('IC Number')}</Label>
              <Input value={formData.icnumber} onChange={(e) => setFormData({...formData, icnumber: e.target.value})} placeholder="XXXXXX-XX-XXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('Date of Birth')}</Label>
                <Input type="date" value={formData.dateofbirth} onChange={(e) => setFormData({...formData, dateofbirth: e.target.value})} />
              </div>
              <div>
                <Label>{translate('Date of Death')}</Label>
                <Input type="date" value={formData.dateofdeath} onChange={(e) => setFormData({...formData, dateofdeath: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{translate('Cause of Death')}</Label>
              <Input value={formData.causeofdeath} onChange={(e) => setFormData({...formData, causeofdeath: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{translate('Cemetery Name')} *</Label>
              <Select value={String(formData.grave)} onValueChange={(v) => setFormData({...formData, grave: v})}>
                <SelectTrigger><SelectValue placeholder={translate('Select cemetery')} /></SelectTrigger>
                <SelectContent>
                  {gravesList.items.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name} - {g.state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Re-added GPS Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('GPS Latitude')}</Label>
                <Input type="number" step="any" value={formData.gpslatitude} onChange={(e) => setFormData({...formData, gpslatitude: e.target.value})} placeholder="3.1390" />
              </div>
              <div>
                <Label>{translate('GPS Longitude')}</Label>
                <Input type="number" step="any" value={formData.gpslongitude} onChange={(e) => setFormData({...formData, gpslongitude: e.target.value})} placeholder="101.6869" />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
              <MapPin className="w-4 h-4 mr-2" /> {translate('Get Current Location')}
            </Button>
            <div className="space-y-2">
              <Label>{translate('Biography')}</Label>
              <Textarea value={formData.biography} onChange={(e) => setFormData({...formData, biography: e.target.value})} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>{translate('Photo')}</Label>
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
                    src={`/api/file/bucket-grave/${encodeURIComponent(formData.photourl)}`} 
                    alt={translate('Preview')}
                  />
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />{translate('Save')}
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

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        data={qrPerson}
      />
    </div>
  );
}