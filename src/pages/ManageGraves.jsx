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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [formData, setFormData] = useState(emptyGrave);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        const appUser = JSON.parse(appUserAuth);
        setCurrentUser({
          ...appUser,
          role: 'admin',
          admin_type: appUser.admin_type || 'admin',
          state: appUser.state || []
        });
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const { data: graves = [], isLoading } = useQuery({
    queryKey: ['admin-graves'],
    queryFn: () => base44.entities.Grave.list('-created_date')
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'superadmin';

  if (loadingUser) {
    return <LoadingUser />;
  }

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
    if (confirm(`Padam "${grave.cemetery_name}"?`)) {
      deleteMutation.mutate(grave.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Urus Tanah Perkuburan
          </h1>
          <p className="text-gray-500">{graves.length} rekod</p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kubur
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
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

      {/* Table */}
      <Card className="border-0 shadow-md">
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
              ) : filteredGraves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                filteredGraves.map(grave => (
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
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrave ? 'Edit Kubur' : 'Tambah Kubur Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Tanah Perkuburan *</Label>
              <Input
                value={formData.cemetery_name}
                onChange={(e) => setFormData({...formData, cemetery_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Negeri *</Label>
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
                />
              </div>
              <div>
                <Label>GPS Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lng}
                  onChange={(e) => setFormData({...formData, gps_lng: e.target.value})}
                />
              </div>
            </div>
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
    </div>
  );
}