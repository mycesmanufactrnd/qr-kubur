import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Edit, Trash2, Search, Filter, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [formData, setFormData] = useState(emptyGrave);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
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
  const hasViewPermission = isSuperAdmin || currentUser?.permissions?.graves?.view;

  const { data: graves = [], isLoading } = useQuery({
    queryKey: ['admin-graves'],
    queryFn: () => base44.entities.Grave.list('-created_date'),
    enabled: hasViewPermission
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Grave.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setFormData(emptyGrave);
      toast.success('Kubur berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Grave.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setEditingGrave(null);
      setFormData(emptyGrave);
      toast.success('Kubur berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Grave.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      toast.success('Kubur berjaya dipadam');
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak mempunyai kebenaran untuk mengakses halaman ini.</p>
        </CardContent>
      </Card>
    );
  }

  const accessibleGraves = graves.filter(grave => {
    if (isSuperAdmin) return true;
    const adminStates = currentUser?.state || [];
    return adminStates.includes(grave.state);
  });

  const filteredGraves = accessibleGraves.filter(grave => {
    const matchesSearch = !searchQuery || 
      grave.cemetery_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'all' || grave.state === filterState;
    return matchesSearch && matchesState;
  });

  const paginatedGraves = filteredGraves.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredGraves.length / itemsPerPage);

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

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Tanah Perkuburan', page: 'ManageGraves' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Urus Tanah Perkuburan
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kubur
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nama kubur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Semua Negeri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Negeri</SelectItem>
                {STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        ) : paginatedGraves.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tiada rekod</p>
            </CardContent>
          </Card>
        ) : (
          paginatedGraves.map(grave => (
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
                      {grave.block && `Blok ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `Lot ${grave.lot}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)} className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)} className="h-8 w-8 p-0">
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
            totalItems={filteredGraves.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Negeri</TableHead>
                <TableHead>Blok/Lot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : paginatedGraves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                paginatedGraves.map(grave => (
                  <TableRow key={grave.id}>
                    <TableCell className="font-medium">{grave.cemetery_name}</TableCell>
                    <TableCell>{grave.state}</TableCell>
                    <TableCell>
                      {grave.block && `Blok ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `Lot ${grave.lot}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        grave.status === 'active' ? 'default' : 
                        grave.status === 'full' ? 'destructive' : 'secondary'
                      }>
                        {grave.status === 'active' ? 'Aktif' : 
                         grave.status === 'full' ? 'Penuh' : 'Penyelenggaraan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)}>
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
            totalItems={filteredGraves.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingGrave ? 'Edit Kubur' : 'Tambah Kubur Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Tanah Perkuburan <span className="text-red-500">*</span></Label>
              <Input
                value={formData.cemetery_name}
                onChange={(e) => setFormData({...formData, cemetery_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Negeri <span className="text-red-500">*</span></Label>
              <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Blok</Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                />
              </div>
              <div>
                <Label>Lot</Label>
                <Input
                  value={formData.lot}
                  onChange={(e) => setFormData({...formData, lot: e.target.value})}
                />
              </div>
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
              onClick={() => {
                if (navigator.geolocation) {
                  toast.info('Mendapatkan lokasi...');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setFormData({
                        ...formData,
                        gps_lat: position.coords.latitude.toFixed(8),
                        gps_lng: position.coords.longitude.toFixed(8)
                      });
                      toast.success('Lokasi berjaya diperolehi');
                    },
                    (error) => {
                      toast.error('Tidak dapat mendapatkan lokasi. Sila aktifkan GPS.');
                    },
                    { enableHighAccuracy: true }
                  );
                } else {
                  toast.error('GPS tidak disokong oleh pelayar ini');
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Dapatkan Lokasi Semasa
            </Button>
            <div>
              <Label>Organisasi Pengurusan</Label>
              <Select value={formData.organisation_id} onValueChange={(v) => setFormData({...formData, organisation_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih organisasi" />
                </SelectTrigger>
                <SelectContent>
                  {organisations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kod QR</Label>
                <Input
                  value={formData.qr_code}
                  onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                  placeholder="QRK-001"
                />
              </div>
              <div>
                <Label>Jumlah Kubur</Label>
                <Input
                  type="number"
                  value={formData.total_graves}
                  onChange={(e) => setFormData({...formData, total_graves: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="full">Penuh</SelectItem>
                  <SelectItem value="maintenance">Penyelenggaraan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Padam Kubur"
        description={`Adakah anda pasti ingin memadam "${graveToDelete?.cemetery_name}"? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
      />
    </div>
  );
}