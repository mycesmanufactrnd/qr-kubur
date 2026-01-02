import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import { PERMISSION_CATEGORIES } from '../components/Permissions';
import { usePermissions } from '@/components/PermissionsContext';
import { getAdminTranslation } from '@/components/Translations';

export default function ManagePermissions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPermissions, setUserPermissions] = useState({});
  const [lang, setLang] = useState('ms');

  const t = (key) => getAdminTranslation(key, lang);
  const queryClient = useQueryClient();

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
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { hasPermission } = usePermissions();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const hasViewPermission = isSuperAdmin || (isAdmin && hasPermission('permissions_view'));
  const hasEditPermission = isSuperAdmin || (isAdmin && hasPermission('permissions_edit'));

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    // queryKey: ['app-users'],
    // queryFn: () => base44.entities.AppUser.list('-created_date'),

    queryKey: ['app-users', currentUser?.organisation_id],
    queryFn: () => {
      const entities = base44.entities;

      if (!entities) return [];

      if (isSuperAdmin) return entities.AppUser.list('-created_date');

      if (isAdmin) return entities.AppUser.filter({ organisation_id: currentUser.organisation_id });

      return [];
    },
    enabled: !!currentUser && hasViewPermission
  });

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['user-permissions', selectedUser?.id],
    queryFn: () => base44.entities.Permission.filter({ user_id: selectedUser.id }),
    enabled: !!selectedUser && hasViewPermission,
  });

  React.useEffect(() => {
    if (permissions.length > 0) {
      const permMap = {};
      permissions.forEach(p => {
        permMap[p.slug] = p.enabled;
      });
      setUserPermissions(permMap);
    } else if (selectedUser) {
      setUserPermissions({});
    }
  }, [permissions, selectedUser]);

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ slug, enabled }) => {
      const existing = permissions.find(p => p.slug === slug);
      
      if (existing) {
        return base44.entities.Permission.update(existing.id, { enabled });
      } else {
        return base44.entities.Permission.create({
          user_id: selectedUser.id,
          slug,
          enabled
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-permissions', selectedUser?.id]);
    }
  });

  const saveAllPermissions = async () => {
    try {
      for (const [slug, enabled] of Object.entries(userPermissions)) {
        await updatePermissionMutation.mutateAsync({ slug, enabled });
      }
      

      
      toast.success('Kebenaran berjaya dikemaskini');
    } catch (error) {
      toast.error('Ralat mengemaskini kebenaran');
    }
  };

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: isSuperAdmin ? t('superadminDashboard') : t('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: 'Urus Kebenaran', page: 'ManagePermissions' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600">Hanya Super Admin boleh mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.role !== 'superadmin' && (
      !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const togglePermission = (slug) => {
    setUserPermissions(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin ? t('superadminDashboard') : t('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: 'Urus Kebenaran', page: 'ManagePermissions' }
      ]} />

      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Urus Kebenaran Pengguna</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection */}
        <Card className="lg:col-span-1 border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Cari Pengguna</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-white dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loadingUsers ? (
                <p className="text-sm text-gray-500 text-center py-4">Memuatkan...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Tiada pengguna dijumpai</p>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                      {user.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="lg:col-span-2 border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            {!selectedUser ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pilih pengguna untuk urus kebenaran</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.full_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                  { hasEditPermission && (
                    <Button onClick={saveAllPermissions} disabled={updatePermissionMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </Button>
                  )}
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                    <div key={key} className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{category.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {category.permissions.map(perm => (
                          <div
                            key={perm.slug}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <Label className="text-sm cursor-pointer flex-1" htmlFor={perm.slug}>
                              {perm.label}
                            </Label>
                            <Switch
                              id={perm.slug}
                              checked={!!userPermissions[perm.slug]}
                              onCheckedChange={() => togglePermission(perm.slug)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}