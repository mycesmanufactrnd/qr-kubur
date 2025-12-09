import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Shield, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
import { useUserWithRoleOverride } from '../components/useUserWithRoleOverride';

const ITEMS_PER_PAGE = 10;
const STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"];

export default function ManageUsers() {
  const { user: currentUser, loading: userLoading } = useUserWithRoleOverride();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => base44.entities.User.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsAddMode(false);
    }
  });

  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'admin';

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const handleAddUser = () => {
    setIsAddMode(true);
    setEditUser({
      full_name: '',
      email: '',
      role: 'user',
      admin_type: 'none',
      type: 'employee',
      organisation_id: '',
      state: [],
      permissions: {
        graves: { view: false, create: false, edit: false, delete: false },
        dead_persons: { view: false, create: false, edit: false, delete: false },
        organisations: { view: false, create: false, edit: false, delete: false },
        tahfiz: { view: false, create: false, edit: false, delete: false },
        donations: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false }
      }
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsAddMode(false);
    setEditUser({
      ...user,
      state: user.state || [],
      permissions: user.permissions || {
        graves: { view: false, create: false, edit: false, delete: false },
        dead_persons: { view: false, create: false, edit: false, delete: false },
        organisations: { view: false, create: false, edit: false, delete: false },
        tahfiz: { view: false, create: false, edit: false, delete: false },
        donations: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false }
      }
    });
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!editUser) return;
    if (isAddMode) {
      createUserMutation.mutate(editUser);
    } else {
      updateUserMutation.mutate({ id: editUser.id, data: editUser });
    }
  };

  const handleStateToggle = (state) => {
    if (!editUser) return;
    const currentStates = editUser.state || [];
    const newStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    setEditUser({ ...editUser, state: newStates });
  };

  const handlePermissionToggle = (module, action) => {
    if (!editUser) return;
    setEditUser({
      ...editUser,
      permissions: {
        ...editUser.permissions,
        [module]: {
          ...editUser.permissions[module],
          [action]: !editUser.permissions[module][action]
        }
      }
    });
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya admin boleh akses halaman ini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        {user.admin_type && user.admin_type !== 'none' && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {user.admin_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {(isSuperAdmin || (isAdmin && user.admin_type === 'employee')) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link to={createPageUrl('ManagePermissions') + `?userId=${user.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Halaman {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
                    <label className="text-sm font-medium mb-2 block">Nama Penuh</label>
                    <Input
                      value={editUser.full_name}
                      onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                      placeholder="Masukkan nama penuh"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                      placeholder="Masukkan email"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Type</label>
                <Select 
                  value={editUser.admin_type || 'none'} 
                  onValueChange={(v) => setEditUser({...editUser, admin_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {isSuperAdmin && <SelectItem value="superadmin">Superadmin</SelectItem>}
                    {(isSuperAdmin || isAdmin) && <SelectItem value="admin">Admin</SelectItem>}
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Organisasi</label>
                <Select 
                  value={editUser.organisation_id || ''} 
                  onValueChange={(v) => setEditUser({...editUser, organisation_id: v})}
                >
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

              <div>
                <label className="text-sm font-medium mb-2 block">Negeri</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {STATES.map(state => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={state}
                        checked={editUser.state?.includes(state)}
                        onCheckedChange={() => handleStateToggle(state)}
                      />
                      <label htmlFor={state} className="text-sm">{state}</label>
                    </div>
                  ))}
                </div>
              </div>

              {editUser.admin_type === 'employee' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Permissions</label>
                  <div className="space-y-3 border rounded p-3 max-h-60 overflow-y-auto">
                    {Object.keys(editUser.permissions || {}).map(module => (
                      <div key={module} className="space-y-2">
                        <p className="text-sm font-medium capitalize">{module.replace('_', ' ')}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {['view', 'create', 'edit', 'delete'].map(action => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module}-${action}`}
                                checked={editUser.permissions[module]?.[action]}
                                onCheckedChange={() => handlePermissionToggle(module, action)}
                              />
                              <label htmlFor={`${module}-${action}`} className="text-xs capitalize">
                                {action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
    </div>
  );
}