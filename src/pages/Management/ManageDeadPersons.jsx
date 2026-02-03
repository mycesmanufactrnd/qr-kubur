import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { Users, Plus, Edit, Trash2, Search, X, Save, Upload, MapPin, QrCode } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import QRCodeDialog from "@/components/QRCodeDialog";
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';
import { validateFields } from '@/utils/validations';
import { defaultDeadPersonField } from '@/utils/defaultformfields';
import { 
  useGetDeadPersonPaginated, 
  useCreateDeadPerson, 
  useUpdateDeadPerson, 
  useDeleteDeadPerson 
} from '@/hooks/useDeadPersonMutations';
import { useGetGravePaginated } from '@/hooks/useGraveMutations';

export default function ManageDeadPersons() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  // 🔹 1. URL Source of Truth
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlIC = searchParams.get('ic') || '';
  const urlGrave = searchParams.get('grave') || 'all';
  const urlState = searchParams.get('state') || 'all';
  const urlDateFrom = searchParams.get('dateFrom') || '';
  const urlDateTo = searchParams.get('dateTo') || '';

  // 🔹 2. Temporary Input States (Disconnected from API)
  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempIC, setTempIC] = useState(urlIC);
  const [tempGrave, setTempGrave] = useState(urlGrave);
  const [tempState, setTempState] = useState(urlState);
  const [tempDateFrom, setTempDateFrom] = useState(urlDateFrom);
  const [tempDateTo, setTempDateTo] = useState(urlDateTo);

  // 🔹 3. Modal & Action States
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState(defaultDeadPersonField);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrPerson, setQRPerson] = useState({});
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { loading: permissionsLoading, canEdit, canDelete } = useCrudPermissions('dead_persons');

  // Sync Temporary State when URL changes (e.g., on Reset or Back button)
  useEffect(() => {
    setTempSearch(urlSearch);
    setTempIC(urlIC);
    setTempGrave(urlGrave);
    setTempState(urlState);
    setTempDateFrom(urlDateFrom);
    setTempDateTo(urlDateTo);
  }, [urlSearch, urlIC, urlGrave, urlState, urlDateFrom, urlDateTo]);

  // Handle Org Logic
  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin }
  );

  useEffect(() => {
    if (parentAndChildQuery.data) setAccessibleOrgIds(parentAndChildQuery.data);
  }, [parentAndChildQuery.data]);

  // 🔹 4. Backend Query (Only listens to URL parameters)
  const { deadPersonsList, isLoading: isLoadingDeadPerson } = useGetDeadPersonPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    filterIC: urlIC,
    filterGrave: urlGrave === 'all' ? undefined : Number(urlGrave),
    filterState: urlState === 'all' ? undefined : urlState,
    dateFrom: urlDateFrom,
    dateTo: urlDateTo,
    organisationIds: accessibleOrgIds
  });

  // Gravelocator needs to be filtered by accessible Orgs
  const { gravesList, isLoading: isLoadingGrave } = useGetGravePaginated({
    pageSize: 1000, // Large number to get all graves for the dropdown
    organisationIds: accessibleOrgIds
  });

  // Safe calculation of total pages
  const totalPages = deadPersonsList?.total ? Math.ceil(deadPersonsList.total / itemsPerPage) : 0;

  const createMutation = useCreateDeadPerson();
  const updateMutation = useUpdateDeadPerson();
  const deleteMutation = useDeleteDeadPerson();

  // 🔹 5. Search Handlers
  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    if (tempIC) params.ic = tempIC;
    if (tempGrave !== 'all') params.grave = tempGrave;
    if (tempState !== 'all') params.state = tempState;
    if (tempDateFrom) params.dateFrom = tempDateFrom;
    if (tempDateTo) params.dateTo = tempDateTo;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({}); // Wipes the URL clean
  };

  // 🔹 6. Modal Handlers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields(formData, [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'grave', label: 'Grave', type: 'select' },
    ])) return;

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

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/bucket-grave', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormData({ ...formData, photourl: data.file_url });
      showSuccess('Photo uploaded');
    } catch (err) {
      showError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      await deleteMutation.mutateAsync(personToDelete.id);
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    } catch (error) {}
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Deceased'), page: 'ManageDeadPersons' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          {translate('Manage Deceased')}
        </h1>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {translate('Add New')}
        </Button>
      </div>

      {/* Standardized Search/Filter Card */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Full Name')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Input 
              placeholder={translate('IC Number')} 
              value={tempIC} 
              onChange={(e) => setTempIC(e.target.value)} 
            />
            
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={(v) => { setTempState(v); setTempGrave('all'); }}>
                <SelectTrigger><SelectValue placeholder="Negeri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All states')}</SelectItem>
                  {STATES_MY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={tempGrave} onValueChange={setTempGrave}>
              <SelectTrigger><SelectValue placeholder={translate('Cemetery')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All cemeteries')}</SelectItem>
                {gravesList.items.map(g => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-gray-500">{translate('From Date')}</Label>
              <Input type="date" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-gray-500">{translate('To Date')}</Label>
              <Input type="date" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)} />
            </div>

            <Button variant="outline" onClick={handleReset} className="w-full mt-auto">
              <X className="w-4 h-4 mr-2" />
              {translate('Reset')}
            </Button>
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
                <TableHead className="text-center">{translate('Actions')}</TableHead>
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
                    <TableCell className="font-medium dark:text-white">{person.name}</TableCell>
                    <TableCell className="text-center dark:text-gray-300">{person.icnumber || '-'}</TableCell>
                    <TableCell className="text-center dark:text-gray-300">
                      {person.dateofdeath ? new Date(person.dateofdeath).toLocaleDateString('ms-MY') : '-'}
                    </TableCell>
                    <TableCell className="text-center dark:text-gray-300">{person.grave?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setPersonToDelete(person); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" 
                        onClick={() => { setQRPerson({ type: "deadperson", id: person.id }); setQRDialogOpen(true); }}
                      >
                        <QrCode className="w-4 h-4 text-green-500" />
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
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({...Object.fromEntries(searchParams), page: '1'});
            }}
            totalItems={deadPersonsList.total}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader><DialogTitle className="dark:text-white">{editingPerson ? translate('edit') : translate('Add New')}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('Full Name')} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('IC Number')}</Label>
              <Input value={formData.icnumber} onChange={(e) => setFormData({...formData, icnumber: e.target.value})} placeholder="XXXXXX-XX-XXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">{translate('Date of Birth')}</Label>
                <Input type="date" value={formData.dateofbirth} onChange={(e) => setFormData({...formData, dateofbirth: e.target.value})} />
              </div>
              <div>
                <Label className="dark:text-white">{translate('Date of Death')}</Label>
                <Input type="date" value={formData.dateofdeath} onChange={(e) => setFormData({...formData, dateofdeath: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('Cause of Death')}</Label>
              <Input value={formData.causeofdeath} onChange={(e) => setFormData({...formData, causeofdeath: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('Cemetery Name')} *</Label>
              <Select value={String(formData.grave)} onValueChange={(v) => setFormData({...formData, grave: v})}>
                <SelectTrigger><SelectValue placeholder={translate('Select cemetery')} /></SelectTrigger>
                <SelectContent>
                  {gravesList.items.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-white">{translate('GPS Latitude')}</Label>
                <Input type="number" step="any" value={formData.gpslatitude} onChange={(e) => setFormData({...formData, gpslatitude: e.target.value})} />
              </div>
              <div>
                <Label className="dark:text-white">{translate('GPS Longitude')}</Label>
                <Input type="number" step="any" value={formData.gpslongitude} onChange={(e) => setFormData({...formData, gpslongitude: e.target.value})} />
              </div>
            </div>
            <Button type="button" variant="outline" 
              onClick={() => navigator.geolocation.getCurrentPosition((p) => {
                setFormData({
                  ...formData,
                  gpslatitude: p.coords.latitude.toFixed(16),
                  gpslongitude: p.coords.longitude.toFixed(16)
                });
                showSuccess('Lokasi berjaya diperolehi');
              })} className="w-full">
              <MapPin className="w-4 h-4 mr-2" /> {translate('Get Current Location')}
            </Button>
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('Biography')}</Label>
              <Textarea value={formData.biography} onChange={(e) => setFormData({...formData, biography: e.target.value})} rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">{translate('Photo')}</Label>
              <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0])} disabled={uploading} />
              {formData.photourl && (
                <img className="w-20 h-20 rounded object-cover mt-2" src={`/api/file/bucket-grave/${encodeURIComponent(formData.photourl)}`} alt="Preview" />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600">
                <Save className="w-4 h-4 mr-2" />{translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={translate('delete')} description={`Padam rekod "${personToDelete?.name}"?`} onConfirm={confirmDelete} variant="destructive" />
      <QRCodeDialog open={qrDialogOpen} onOpenChange={setQRDialogOpen} data={qrPerson} />
    </div>
  );
}