import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Save, Search, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from '@/components/Breadcrumb';
import { PERMISSION_CATEGORIES } from '@/components/Permissions';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { translate } from '@/utils/translations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetPermission, useUpsertPermission } from '@/hooks/usePermissionMutations';
import { useGetUserPaginated } from '@/hooks/useUserMutations';
import Pagination from '@/components/Pagination';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';

export default function ManagePermissions() {
  const { loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => { setTempSearch(urlSearch); }, [urlSearch]);

  const { loading: permissionsLoading, canView, canEdit } = useCrudPermissions('permissions');
  
  // 🔹 Logic Fix: Super Admins bypass the database-level edit restriction
  const effectiveCanEdit = canEdit || isSuperAdmin;

  const { userList: users, totalPages, isLoading: loadingUsers } = useGetUserPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
  });

  const upsertPermission = useUpsertPermission();
  const { data: permissions = [], isLoading: loadingPermissions } = useGetPermission(selectedUser?.id, canView);
  
  useEffect(() => {
    if (permissions.length > 0) {
      const permMap = {};
      permissions.forEach(p => { permMap[p.slug] = p.enabled; });
      setUserPermissions(permMap);
    } else if (selectedUser) {
      setUserPermissions({});
    }
  }, [permissions, selectedUser]);

  const handleSearch = () => { setSearchParams({ page: '1', search: tempSearch }); };
  const handleReset = () => { setSearchParams({}); setSelectedUser(null); };

  const saveAllPermissions = async () => {
    if (!selectedUser) return;
    await upsertPermission.mutateAsync({
      userId: selectedUser.id,
      permissions: Object.entries(userPermissions).map(([slug, enabled]) => ({ slug, enabled }))
    });
  };

  const togglePermission = (slug) => {
    setUserPermissions(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: translate('adminDashboard'), page: 'AdminDashboard' }, { label: translate('Manage Permissions'), page: 'ManagePermissions' }]} />

      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold">{translate('Manage User Permissions')}</h1>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder={translate('Search user...')} 
              value={tempSearch} 
              onChange={(e) => setTempSearch(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
              className="pl-10" 
            />
          </div>
          <Button onClick={handleSearch} className="bg-purple-600">{translate('Search')}</Button>
          <Button variant="outline" onClick={handleReset}><X className="w-4 h-4 mr-2" />{translate('Reset')}</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <Label className="font-semibold">{translate('Select User')}</Label>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingUsers ? <InlineLoadingComponent/> : users.items.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => setSelectedUser(user)} 
                  className={`w-full text-left p-3 rounded-lg border ${selectedUser?.id === user.id ? 'bg-purple-50 border-purple-500' : 'bg-white'}`}
                >
                  <p className="font-medium text-sm">{user.fullname}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{user.role}</Badge>
                </button>
              ))}
            </div>
            {users.total > 0 && (
              <Pagination currentPage={urlPage} totalPages={totalPages} onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })} itemsPerPage={itemsPerPage} onItemsPerPageChange={() => {}} totalItems={users.total} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardContent className="p-4">
            {!selectedUser ? (
              <div className="text-center py-12"><Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p>{translate('Select a user to manage access')}</p></div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div><h3 className="font-semibold">{selectedUser.fullname}</h3><p className="text-sm text-gray-500">{selectedUser.email}</p></div>
                  {effectiveCanEdit && (
                    <Button onClick={saveAllPermissions} disabled={upsertPermission.isPending} className="bg-purple-600">
                      <Save className="w-4 h-4 mr-2" />{translate('Save')}
                    </Button>
                  )}
                </div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                    <div key={key} className="space-y-3">
                      <h4 className="font-semibold text-sm text-purple-600 uppercase">{category.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {category.permissions.map(perm => (
                          <div key={perm.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <Label className="text-sm flex-1">{perm.label}</Label>
                            <Switch 
                                checked={!!userPermissions[perm.slug]} 
                                onCheckedChange={() => togglePermission(perm.slug)} 
                                disabled={!effectiveCanEdit} // 🔹 Enabled for Super Admins
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