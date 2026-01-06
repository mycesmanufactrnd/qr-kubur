import React, { useState } from 'react';
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Breadcrumb from '../components/Breadcrumb';
import { showSuccess, showError, showInfo, showWarning, showApiError, showApiSuccess, showUniqueError } from '../components/ToastrNotification';
import { useCrudPermissions, usePermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { isSupabaseMode, useAdminAccess } from '@/utils/auth';
import { STATES_MY } from '@/utils/enums';
import { trpc } from '@/utils/trpc';

export default function ManageUsers() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
    isEmployee, 
  } = useAdminAccess();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const queryClient = useQueryClient();

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('users');

  const buildUserFilter = () => {
    if (!currentUser) return { id: null };

    if (isSuperAdmin) return {};

    if (isAdmin) {
      const filter = {
        role: { $in: ['admin', 'employee'] }
      };

      if (currentUser.organisation_id) {
        filter.organisation_id = currentUser.organisation_id;
      }

      if (currentUser.tahfiz_center_id) {
        filter.tahfiz_center_id = currentUser.tahfiz_center_id;
      }

      return filter;
    }

    if (isEmployee) {
      return { id: currentUser.id }; 
    }

    return { id: null };
  };
  
  const { data: appUsers = [], isLoading: appUsersLoading } = isSupabaseMode
  ? trpc.users.getUsers.useQuery({
    currentUserId: currentUser?.id,
    isSuperAdmin,
    isAdmin,
    isEmployee,
  })
  : useQuery({
    queryKey: ['appUsers'],
    queryFn: () => base44.entities.AppUser.filter(buildUserFilter()),
    enabled: !!currentUser
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz-centers'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const createUserMutation = useMutation({
    mutationFn: async (data) => {
      try {
        if (data.password) {
          const hashResponse = await base44.functions.invoke(
            'hashPassword',
            { password: data.password }
          );

          data.password = hashResponse.data.hashed;
        }

        return await base44.entities.AppUser.create(data);
      } catch (err) {
        console.error('Create user failed:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);

      showSuccess('User Successfully Created');
    }
  });

  const updateAppUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
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
      showSuccess('User Successfully Updated', 'Success');
    }
  });

  const deleteAppUserMutation = useMutation({
    mutationFn: (id) => base44.entities.AppUser.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      showSuccess('User Successfully Deleted');
    }
  });

  const accessibleOrganisations = organisations.filter(org => {
    if (isSuperAdmin) return true;

    if (isAdmin) {
      const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
      const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
      return adminStates.some(s => orgStates.includes(s));
    }

    if (isEmployee) {
      return currentUser.organisation_id == org.id;
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

    if (isEmployee) {
      return currentUser.tahfiz_center_id == center.id;
    }

    return false;
  });
  
  const isLoading = appUsersLoading;

  const adminAccessibleStates = (() => {
    if (isSuperAdmin) {
      return STATES_MY;
    }

    if (isAdmin || isEmployee) {
      return Array.isArray(currentUser?.state)
        ? currentUser.state
        : currentUser?.state
          ? [currentUser.state]
          : [];
    }

    return [];
  })();


  const filteredUsers = appUsers.filter(u => 
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
      showError("Sila masukkan nama penuh", "Medan Diperlukan");
      return;
    }
    if (!editUser.email?.trim()) {
      showError("Sila masukkan email", "Medan Diperlukan");
      return;
    }
    
    if (isAddMode && !editUser.password?.trim()) {
      showError("Sila masukkan password", "Medan Diperlukan");
      return;
    }

    if (!editUser.state || editUser.state.length === 0) {
      showError("Sila pilih sekurang-kurangnya satu negeri", "Medan Diperlukan");
      return;
    }

    // Additional validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
      showError("Format Tidak Sah", "Medan Diperlukan");
      return;
    }
    if (isAddMode && editUser.password.length < 6) {
      showError("Password mesti sekurang-kurangnya 6 aksara", "Password Terlalu Pendek");
      return;
    }
    if (!isAddMode && editUser.password && editUser.password.length < 6) {
      showError("Password mesti sekurang-kurangnya 6 aksara", "Password Terlalu Pendek");
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
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
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
      <div className="space-y-4">
        <Breadcrumb items={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin Dashboard', page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: 'Urus Pengguna', page: 'ManageUsers' }
        ]} />
        <AccessDeniedComponent/>
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
        { canCreate && (
          <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengguna
          </Button>
        )}
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
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canDelete && (
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
        <DialogContent 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
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
                  disabled={(isAdmin && !isSuperAdmin && currentUser.tahfiz_center_id) || currentUser.organisation_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pusat tahfiz" />
                  </SelectTrigger>
                  <SelectContent>
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