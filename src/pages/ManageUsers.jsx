import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Breadcrumb from '../components/Breadcrumb';
import { toast } from 'sonner';


const STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"];

export default function ManageUsers() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [userLoading, setUserLoading] = React.useState(true);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem('appUserAuth');
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    loadUser();
  }, []);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: appUsers = [], isLoading: appUsersLoading } = useQuery({
    queryKey: ['appUsers'],
    queryFn: () => base44.entities.AppUser.list()
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz-centers'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const isLoading = usersLoading || appUsersLoading;
  const allUsers = [...users, ...appUsers];

  const createUserMutation = useMutation({
    mutationFn: async (data) => {
      // Hash password if provided
      if (data.password) {
        const hashResponse = await base44.functions.invoke('hashPassword', { password: data.password });
        data.password = hashResponse.data.hashed;
      }
      return base44.entities.AppUser.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);
    }
  });

  const updateAppUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Hash password if provided
      if (data.password) {
        const hashResponse = await base44.functions.invoke('hashPassword', { password: data.password });
        data.password = hashResponse.data.hashed;
      }
      return base44.entities.AppUser.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
    }
  });

  const deleteAppUserMutation = useMutation({
    mutationFn: (id) => base44.entities.AppUser.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
    }
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const hasViewPermission = isSuperAdmin || currentUser?.permissions?.users?.view;

  const accessibleUsers = allUsers.filter(u => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      // Admin can see users in their organisation or tahfiz center
      const sameOrg = u.organisation_id === currentUser.organisation_id;
      const sameTahfiz = u.tahfiz_center_id === currentUser.tahfiz_center_id;
      if (!sameOrg && !sameTahfiz) return false;
      // Admin can only see admin and employee
      if (u.role !== 'admin' && u.role !== 'employee') return false;
      // Must share at least one state
      const userStates = Array.isArray(u.state) ? u.state : [u.state].filter(Boolean);
      const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
      return userStates.some(s => adminStates.includes(s));
    }
    return false;
  });

  // Filter organisations based on admin state
  const accessibleOrganisations = organisations.filter(org => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
      const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
      return adminStates.some(s => orgStates.includes(s));
    }
    return false;
  });

  // Filter tahfiz centers based on admin state
  const accessibleTahfizCenters = tahfizCenters.filter(center => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
      return adminStates.includes(center.state);
    }
    return false;
  });

  // Get admin's accessible states
  const adminAccessibleStates = isAdmin && !isSuperAdmin
    ? (Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean))
    : STATES;

  const filteredUsers = accessibleUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleAddUser = () => {
    setIsAddMode(true);
    const defaultState = isAdmin && !isSuperAdmin ? adminAccessibleStates : [];
    const defaultOrgId = isAdmin && !isSuperAdmin ? currentUser.organisation_id : '';
    const defaultTahfizId = isAdmin && !isSuperAdmin ? currentUser.tahfiz_center_id : '';
    setEditUser({
      full_name: '',
      email: '',
      password: '',
      role: 'employee',
      organisation_id: defaultOrgId || '',
      tahfiz_center_id: defaultTahfizId || '',
      state: defaultState
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsAddMode(false);
    setEditUser({
      ...user,
      password: '', // Empty for edit mode
      isAppUser: appUsers.some(u => u.id === user.id),
      state: user.state || []
    });
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!editUser) return;
    
    // Validation - Required fields
    if (!editUser.full_name?.trim()) {
      toast.error('Sila masukkan nama penuh', { description: 'Medan Diperlukan' });
      return;
    }
    if (!editUser.email?.trim()) {
      toast.error('Sila masukkan email', { description: 'Medan Diperlukan' });
      return;
    }
    if (isAddMode && !editUser.password?.trim()) {
      toast.error('Sila masukkan password', { description: 'Medan Diperlukan' });
      return;
    }
    if (!editUser.organisation_id && !editUser.tahfiz_center_id) {
      toast.error('Sila pilih organisasi atau pusat tahfiz', { description: 'Medan Diperlukan' });
      return;
    }
    if (!editUser.state || editUser.state.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya satu negeri', { description: 'Medan Diperlukan' });
      return;
    }

    // Additional validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
      toast.error('Format email tidak sah', { description: 'Format Tidak Sah' });
      return;
    }
    if (isAddMode && editUser.password.length < 6) {
      toast.error('Password mesti sekurang-kurangnya 6 aksara', { description: 'Password Terlalu Pendek' });
      return;
    }
    if (!isAddMode && editUser.password && editUser.password.length < 6) {
      toast.error('Password mesti sekurang-kurangnya 6 aksara', { description: 'Password Terlalu Pendek' });
      return;
    }
    
    // Remove password field if empty in edit mode
    const dataToSave = { ...editUser };
    if (!isAddMode && !dataToSave.password) {
      delete dataToSave.password;
    }
    
    if (isAddMode) {
      createUserMutation.mutate(dataToSave);
    } else {
      if (editUser.isAppUser) {
        updateAppUserMutation.mutate({ id: editUser.id, data: dataToSave });
      } else {
        updateUserMutation.mutate({ id: editUser.id, data: dataToSave });
      }
    }
  };

  const handleStateToggle = (state) => {
    if (!editUser) return;
    // For state admin, don't allow deselecting their own states
    if (isAdmin && !isSuperAdmin) return;
    
    const currentStates = editUser.state || [];
    const newStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    setEditUser({ ...editUser, state: newStates });
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const isAppUser = appUsers.some(u => u.id === userToDelete.id);
    if (isAppUser) {
      deleteAppUserMutation.mutate(userToDelete.id);
    } else {
      deleteUserMutation.mutate(userToDelete.id);
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };



  const canEditUser = (user) => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      // Admin can only edit admin and employee
      if (user.role !== 'admin' && user.role !== 'employee') return false;
      // Must be in same organisation or tahfiz center
      const sameOrg = user.organisation_id === currentUser.organisation_id;
      const sameTahfiz = user.tahfiz_center_id === currentUser.tahfiz_center_id;
      if (!sameOrg && !sameTahfiz) return false;
      // Must share at least one state
      const userStates = user.state || [];
      const adminStates = currentUser.state || [];
      return userStates.some(s => adminStates.includes(s));
    }
    return false;
  };

  const canDeleteUser = (user) => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      // Admin can only delete admin and employee under their organisation or tahfiz center
      if (user.role !== 'admin' && user.role !== 'employee') return false;
      const sameOrg = user.organisation_id === currentUser.organisation_id;
      const sameTahfiz = user.tahfiz_center_id === currentUser.tahfiz_center_id;
      if (!sameOrg && !sameTahfiz) return false;
      return true;
    }
    return false;
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="space-y-4">
        <Breadcrumb items={[
          { label: 'Admin Dashboard', page: 'AdminDashboard' },
          { label: 'Urus Pengguna', page: 'ManageUsers' }
        ]} />
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="text-gray-600">Hanya admin boleh akses halaman ini</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-4">
        <Breadcrumb items={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin Dashboard', page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: 'Urus Pengguna', page: 'ManageUsers' }
        ]} />
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600">Anda tidak mempunyai kebenaran untuk mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[
        { label: isSuperAdmin ? 'Super Admin' : 'Admin Dashboard', page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: 'Urus Pengguna', page: 'ManageUsers' }
      ]} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Urus Pengguna</h1>
        <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari pengguna"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))
        ) : paginatedUsers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Tiada pengguna</p>
            </CardContent>
          </Card>
        ) : (
          paginatedUsers.map(user => (
            <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-700">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{user.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {canEditUser(user) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canDeleteUser(user) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
          totalItems={filteredUsers.length}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddMode ? 'Tambah Pengguna' : 'Edit Pengguna'}</DialogTitle>
          </DialogHeader>
          
          {editUser && (
            <div className="space-y-4">
              {isAddMode && (
                <>
                  <div>
                   <label className="text-sm font-medium mb-2 block">Nama Penuh <span className="text-red-500">*</span></label>
                   <Input
                     value={editUser.full_name}
                     onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                     placeholder="Masukkan nama penuh"
                   />
                  </div>

                  <div>
                   <label className="text-sm font-medium mb-2 block">Email <span className="text-red-500">*</span></label>
                  <Input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    placeholder="Masukkan email"
                  />
                  </div>

                  <div>
                   <label className="text-sm font-medium mb-2 block">Password <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                    placeholder="Masukkan kata laluan"
                  />
                  </div>
                  </>
                  )}

                  {!isAddMode && (
                  <div>
                  <label className="text-sm font-medium mb-2 block">Password (kosongkan jika tidak tukar)</label>
                  <Input
                   type="password"
                   value={editUser.password}
                   onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                   placeholder="Kosongkan jika tidak tukar"
                  />
                  </div>
                  )}

                  <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select 
                  value={editUser.role || 'employee'} 
                  onValueChange={(v) => setEditUser({...editUser, role: v})}
                  >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="superadmin">Superadmin</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                  </Select>
                  </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Organisasi</label>
                <Select 
                  value={editUser.organisation_id || ''} 
                  onValueChange={(v) => setEditUser({...editUser, organisation_id: v, tahfiz_center_id: ''})}
                  disabled={isAdmin && !isSuperAdmin && currentUser.organisation_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih organisasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Tiada</SelectItem>
                    {accessibleOrganisations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Pusat Tahfiz</label>
                <Select 
                  value={editUser.tahfiz_center_id || ''} 
                  onValueChange={(v) => setEditUser({...editUser, tahfiz_center_id: v, organisation_id: ''})}
                  disabled={isAdmin && !isSuperAdmin && currentUser.tahfiz_center_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pusat tahfiz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Tiada</SelectItem>
                    {accessibleTahfizCenters.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Negeri <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {adminAccessibleStates.map(state => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={state}
                        checked={editUser.state?.includes(state)}
                        onCheckedChange={() => handleStateToggle(state)}
                        disabled={isAdmin && !isSuperAdmin}
                      />
                      <label htmlFor={state} className="text-sm">{state}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-700">
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

        <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Padam Pengguna"
        description={`Adakah anda pasti ingin memadam pengguna ${userToDelete?.full_name || userToDelete?.email}? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
        />
        </div>
        );
        }