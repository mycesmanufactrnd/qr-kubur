import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit, Trash2, Search, Save, Filter } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const SERVICES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang' },
  { value: 'yasin', label: 'Bacaan Yasin' },
  { value: 'doa_arwah', label: 'Doa Arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas' }
];

const emptyCenter = {
  name: '',
  description: '',
  services_offered: [],
  state: '',
  address: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  gps_lat: '',
  gps_lng: ''
};

export default function ManageTahfizCenters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formData, setFormData] = useState(emptyCenter);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);

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

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['admin-tahfiz'],
    queryFn: () => base44.entities.TahfizCenter.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TahfizCenter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      setIsDialogOpen(false);
      setFormData(emptyCenter);
      toast.success('Pusat tahfiz berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TahfizCenter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      setIsDialogOpen(false);
      setEditingCenter(null);
      setFormData(emptyCenter);
      toast.success('Pusat tahfiz berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TahfizCenter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      toast.success('Pusat tahfiz berjaya dipadam');
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const userStates = Array.isArray(currentUser?.state) ? currentUser.state : [];

  const accessibleCenters = centers.filter(center => {
    if (isSuperAdmin) return true;
    return userStates.includes(center.state);
  });

  const filteredCenters = accessibleCenters.filter(center => {
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'all' || center.state === filterState;
    return matchesSearch && matchesState;
  });

  const paginatedCenters = filteredCenters.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);

  const openAddDialog = () => {
    setEditingCenter(null);
    setFormData(emptyCenter);
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || '',
      description: center.description || '',
      services_offered: center.services_offered || [],
      state: center.state || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      bank_name: center.bank_name || '',
      bank_account: center.bank_account || '',
      gps_lat: center.gps_lat || '',
      gps_lng: center.gps_lng || ''
    });
    setIsDialogOpen(true);
  };

  const toggleService = (serviceValue) => {
    const current = formData.services_offered || [];
    if (current.includes(serviceValue)) {
      setFormData({...formData, services_offered: current.filter(s => s !== serviceValue)});
    } else {
      setFormData({...formData, services_offered: [...current, serviceValue]});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null
    };

    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (center) => {
    setCenterToDelete(center);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!centerToDelete) return;
    deleteMutation.mutate(centerToDelete.id);
    setDeleteDialogOpen(false);
    setCenterToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Pusat Tahfiz', page: 'ManageTahfizCenters' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            Urus Pusat Tahfiz
          </h1>
          <p className="text-gray-500">{filteredCenters.length} rekod</p>
        </div>
        <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pusat Tahfiz
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari pusat tahfiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isSuperAdmin && (
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
            )}
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
                <TableHead>Perkhidmatan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : paginatedCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                paginatedCenters.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.state}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {center.services_offered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {SERVICES.find(s => s.value === service)?.label || service}
                          </Badge>
                        ))}
                        {center.services_offered?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{center.services_offered.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(center)}>
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
            totalItems={filteredCenters.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? 'Edit Pusat Tahfiz' : 'Tambah Pusat Tahfiz Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Negeri <span className="text-red-500">*</span></Label>
              <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  {(isSuperAdmin ? STATES : userStates).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Perkhidmatan</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SERVICES.map(service => (
                  <Label 
                    key={service.value}
                    className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={formData.services_offered?.includes(service.value)}
                      onCheckedChange={() => toggleService(service.value)}
                    />
                    {service.label}
                  </Label>
                ))}
              </div>
            </div>
            <div>
              <Label>Alamat</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Bank</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                />
              </div>
              <div>
                <Label>No. Akaun</Label>
                <Input
                  value={formData.bank_account}
                  onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
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
        title="Padam Pusat Tahfiz"
        description={`Adakah anda pasti ingin memadam "${centerToDelete?.name}"? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
      />
    </div>
  );
}