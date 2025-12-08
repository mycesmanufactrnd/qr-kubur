import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;
const MODULES = ['graves', 'dead_persons', 'organisations', 'tahfiz', 'donations', 'users'];
const PERMISSIONS = ['view', 'create', 'edit', 'delete'];

export default function ManagePermissions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setCurrentUser(userData);
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      toast.success('Kebenaran dikemaskini');
    }
  });

  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'admin';

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

  // Filter users based on access level
  const accessibleUsers = users.filter(u => {
    if (isSuperAdmin) return true; // Superadmin sees all
    if (isAdmin) {
      // Admin can only manage employees
      return u.admin_type === 'employee';
    }
    return false;
  });

  const filteredUsers = accessibleUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const handleEditUser = (user) => {
    setEditUser({
      ...user,
      permissions: user.permissions || MODULES.reduce((acc, module) => {
        acc[module] = { view: false, create: false, edit: false, delete: false };
        return acc;
      }, {})
    });
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!editUser) return;
    updateUserMutation.mutate({ id: editUser.id, data: { permissions: editUser.permissions } });
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

  const handleModuleToggle = (module, checked) => {
    if (!editUser) return;
    setEditUser({
      ...editUser,
      permissions: {
        ...editUser.permissions,
        [module]: {
          view: checked,
          create: checked,
          edit: checked,
          delete: checked
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Urus Kebenaran</h1>
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
                        {user.admin_type && user.admin_type !== 'none' && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {user.admin_type}
                          </Badge>
                        )}
                        {user.permissions && Object.values(user.permissions).some(p => p.view || p.create || p.edit || p.delete) && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Kebenaran Ditetapkan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(user)}
                    className="flex-shrink-0"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Kebenaran
                  </Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Urus Kebenaran Pengguna</DialogTitle>
          </DialogHeader>
          
          {editUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold">{editUser.full_name || editUser.email}</p>
                <p className="text-sm text-gray-500">{editUser.email}</p>
              </div>

              <div className="space-y-4">
                {MODULES.map(module => {
                  const allChecked = PERMISSIONS.every(p => editUser.permissions[module]?.[p]);
                  return (
                    <Card key={module} className="border">
                      <CardHeader className="p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm capitalize">
                            {module.replace('_', ' ')}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModuleToggle(module, !allChecked)}
                          >
                            {allChecked ? <X className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                            {allChecked ? 'Nyahpilih Semua' : 'Pilih Semua'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {PERMISSIONS.map(action => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module}-${action}`}
                                checked={editUser.permissions[module]?.[action] || false}
                                onCheckedChange={() => handlePermissionToggle(module, action)}
                              />
                              <label htmlFor={`${module}-${action}`} className="text-sm capitalize cursor-pointer">
                                {action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-700">
                  Simpan Kebenaran
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}