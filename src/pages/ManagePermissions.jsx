import { useEffect, useState } from 'react';
import { Shield, Save, Search } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Breadcrumb from '../components/Breadcrumb';
import { PERMISSION_CATEGORIES } from '../components/Permissions';
import { useCrudPermissions, usePermissions } from '@/components/PermissionsContext';
import { translate } from '@/utils/translations';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';
import { useGetPermission, useUpsertPermission } from '@/hooks/usePermissionMutations';
import { showApiError, showSuccess } from '@/components/ToastrNotification';
import { useGetUserPaginated } from '@/hooks/useUserMutations';
import Pagination from '@/components/Pagination';

export default function ManagePermissions() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
    checkRole
  } = useAdminAccess();

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('permissions');

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const { userList: users, totalPages, isLoading: loadingUsers } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    search: searchQuery,
  });

  const upsertPermission = useUpsertPermission();
  const { data: permissions = [], isLoading: loadingPermissions } = useGetPermission(selectedUser?.id, canView);
  
  useEffect(() => {
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

  const saveAllPermissions = async () => {
    try {
      for (const [slug, enabled] of Object.entries(userPermissions)) {
        await upsertPermission.mutateAsync({
          userId: selectedUser.id,
          slug,
          enabled
        })
      }

      showSuccess('Permission', 'update');
    } catch {
      showApiError();
    }
  };

  const togglePermission = (slug) => {
    setUserPermissions(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }));
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
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: translate('Manage Permissions'), page: 'ManagePermissions' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: translate('Manage Permissions'), page: 'ManagePermissions' }
      ]} />

      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{translate('manageUserPermissions')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">{translate('searchUser')}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={translate('nameOrICnumber')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-white dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loadingUsers ? (
                <p className="text-sm text-gray-500 text-center py-4">{translate('loading...')}</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{translate('noUserFound')}</p>
              ) : (
                users.items.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{user.fullname}</p>
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
        <Card className="lg:col-span-2 border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            {!selectedUser ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{translate('selectUserManageAccess')}</p> 
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.fullname}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                  { canEdit && (
                    <Button onClick={saveAllPermissions} disabled={upsertPermission.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {translate('save')}
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
        {users.total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={users.total}
          />
        )}
    </div>
  );
}