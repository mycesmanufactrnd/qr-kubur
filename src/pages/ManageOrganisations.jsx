import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit, Trash2, Search, Save, Filter } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  "Federal", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

const emptyOrg = {
  name: '',
  description: '',
  type: 'government',
  state: '',
  address: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  gps_lat: '',
  gps_lng: ''
};

export default function ManageOrganisations() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState(emptyOrg);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem('appUserAuth');
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        } else {
          const userData = await base44.auth.me();
          setCurrentUser(userData);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';

  const { data: organisations = [], isLoading } = useQuery({
    queryKey: ['admin-organisations'],
    queryFn: () => base44.entities.Organisation.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organisation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      setFormData(emptyOrg);
      toast.success('Organisasi berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organisation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      setEditingOrg(null);
      setFormData(emptyOrg);
      toast.success('Organisasi berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Organisation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      toast.success('Organisasi berjaya dipadam');
    }
  });

  if (loadingUser) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || (!isSuperAdmin && !isAdmin)) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins can access this page</p>
        </CardContent>
      </Card>
    );
  }

  // Filter by admin state access
  const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
  
  const accessibleOrgs = organisations.filter(org => {
    if (isSuperAdmin) return true;
    
    // Admin can only see orgs in their state(s)
    const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
    return adminStates.some(s => orgStates.includes(s));
  });

  const filteredOrgs = accessibleOrgs.filter(org => {
    const matchesSearch = !searchQuery || 
      org.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'all' || org.state === filterState;
    return matchesSearch && matchesState;
  });

  const canManageOrg = (org) => {
    if (isSuperAdmin) return true;
    
    // Admin can only manage orgs in their state(s)
    const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
    return adminStates.some(s => orgStates.includes(s));
  };

  const openAddDialog = () => {
    setEditingOrg(null);
    // For state admin, pre-set their state
    const defaultState = isSuperAdmin ? '' : (adminStates[0] || '');
    setFormData({...emptyOrg, state: defaultState});
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    if (!canManageOrg(org)) {
      toast.error('Anda tidak mempunyai kebenaran untuk edit organisasi ini');
      return;
    }
    setEditingOrg(org);
    setFormData({
      name: org.name || '',
      description: org.description || '',
      type: org.type || 'government',
      state: org.state || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      bank_name: org.bank_name || '',
      bank_account: org.bank_account || '',
      gps_lat: org.gps_lat || '',
      gps_lng: org.gps_lng || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (org) => {
    if (!canManageOrg(org)) {
      toast.error('Anda tidak mempunyai kebenaran untuk padam organisasi ini');
      return;
    }
    setOrgToDelete(org);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!orgToDelete) return;
    deleteMutation.mutate(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
  };

  const typeLabels = {
    government: 'Kerajaan',
    grave_manager: 'Pengurus Kubur',
    tahfiz: 'Tahfiz',
    NGO: 'NGO'
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Organisasi', page: 'ManageOrganisations' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-600" />
            Urus Organisasi
          </h1>
          <p className="text-gray-500">{organisations.length} rekod</p>
        </div>
        <Button onClick={openAddDialog} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Organisasi
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari organisasi..."
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
                <TableHead>Jenis</TableHead>
                <TableHead>Negeri</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : paginatedOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                paginatedOrgs.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabels[org.type] || org.type}</Badge>
                    </TableCell>
                    <TableCell>{org.state}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(org)}
                        disabled={!canManageOrg(org)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(org)}
                        disabled={!canManageOrg(org)}
                      >
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
            totalItems={filteredOrgs.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? 'Edit Organisasi' : 'Tambah Organisasi Baru'}
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
              <Label>Jenis</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Kerajaan</SelectItem>
                  <SelectItem value="grave_manager">Pengurus Kubur</SelectItem>
                  <SelectItem value="tahfiz">Tahfiz</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Negeri *</Label>
              <Select 
                value={formData.state} 
                onValueChange={(v) => setFormData({...formData, state: v})}
                disabled={!isSuperAdmin && adminStates.length === 1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  {(isSuperAdmin ? STATES : STATES.filter(s => adminStates.includes(s))).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        title="Padam Organisasi"
        description={`Adakah anda pasti ingin memadam "${orgToDelete?.name}"? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
      />
    </div>
  );
}