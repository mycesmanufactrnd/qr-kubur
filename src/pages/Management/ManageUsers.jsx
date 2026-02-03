import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { validateFields } from '@/utils/validations';
import { useGetUserPaginated, useUserMutations } from '@/hooks/useUserMutations';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import { useGetTahfizPaginated } from '@/hooks/useTahfizMutations';
import { hashPassword } from '@/utils/helpers';
import { translate } from '@/utils/translations';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';

export default function ManageUsers() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, isAdmin, currentUserStates } = useAdminAccess();

  // 🔹 1. URL Source of Truth
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  // 🔹 2. Temporary Input State
  const [tempSearch, setTempSearch] = useState(urlSearch);

  // 🔹 3. Sync UI with URL
  useEffect(() => {
    setTempSearch(urlSearch);
  }, [urlSearch]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('users');

  // 🔹 4. Backend Query (Only listens to URL)
  const { userList: appUsers, totalPages, isLoading: appUsersLoading } = useGetUserPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch,
    // Note: organisationIds logic is handled inside useGetUserPaginated based on session
  });

  const { organisationsList: organisations } = useGetOrganisationPaginated({ pageSize: 1000 });
  const { tahfizCenterList: tahfizCenters } = useGetTahfizPaginated({ pageSize: 1000 });
  const { createUser, updateUser, deleteUser } = useUserMutations();

  // 🔹 5. Search Handlers
  const handleSearch = () => {
    const params = { page: '1' };
    if (tempSearch) params.search = tempSearch;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const handleAddUser = () => {
    setIsAddMode(true);
    const defaultState = isAdmin && !isSuperAdmin ? currentUserStates : [];
    setEditUser({
      fullname: '', email: '', phoneno: '', password: '', role: 'employee',
      organisation: currentUser.organisation?.id || null,
      tahfizcenter: currentUser.tahfizcenter?.id || null,
      states: defaultState
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsAddMode(false);
    setEditUser({
      ...user,
      phoneno: user.phoneno || '',
      password: '',
      organisation: user.organisation?.id ?? null,
      tahfizcenter: user.tahfizcenter?.id ?? null,
      isAppUser: true,
      states: user.states || []
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    const isValid = validateFields(editUser, [
      { field: 'fullname', label: 'Full Name', type: 'text' },
      { field: 'email', label: 'Email', type: 'email' },
      { field: 'states', label: 'State', type: 'array' },
    ]);
    if (!isValid) return;

    const submitData = {
      ...editUser,
      organisation: editUser.organisation ? { id: Number(editUser.organisation) } : null,
      tahfizcenter: editUser.tahfizcenter ? { id: Number(editUser.tahfizcenter) } : null,
      ...(editUser.password ? { password: await hashPassword(editUser.password) } : {}),
    };

    if (isAddMode) {
      createUser.mutateAsync(submitData).then((res) => { if (res) setDialogOpen(false); });
    } else {
      updateUser.mutateAsync({ id: editUser.id, data: submitData }).then((res) => { if (res) setDialogOpen(false); });
    }
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' }, { label: translate('manageUsers'), page: 'ManageUsers' }]} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">{translate('manageUsers')}</h1>
        {canCreate && <Button onClick={handleAddUser} className="bg-emerald-600"><Plus className="w-4 h-4 mr-2" />{translate('addUser')}</Button>}
      </div>

      {/* 🔹 Standardized Filter Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('searchUser')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 px-6">{translate('Search')}</Button>
            <Button variant="outline" onClick={handleReset}><X className="w-4 h-4 mr-2" />{translate('Reset')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {appUsersLoading ? <ListCardSkeletonComponent /> : appUsers.items.length === 0 ? <NoDataCardComponent /> : (
          appUsers.items.map(user => (
            <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 lg:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-emerald-700">{user.fullname?.[0] || 'U'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.fullname || user.email}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase mt-1">{user.role}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEdit && <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}><Edit className="w-4 h-4" /></Button>}
                  {canDelete && <Button size="sm" variant="outline" onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {appUsers.total > 0 && (
        <Pagination
          currentPage={urlPage}
          totalPages={totalPages}
          onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }); }}
          totalItems={appUsers.total}
        />
      )}

      {/* Dialog Content */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isAddMode ? translate('addUser') : translate('editUser')}</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{translate('fullName')} *</Label><Input value={editUser.fullname} onChange={(e) => setEditUser({...editUser, fullname: e.target.value})} /></div>
                <div><Label>{translate('email')} *</Label><Input type="email" value={editUser.email} onChange={(e) => setEditUser({...editUser, email: e.target.value})} /></div>
              </div>
              <div><Label>{translate('phone')}</Label><Input value={editUser.phoneno} onChange={(e) => setEditUser({...editUser, phoneno: e.target.value})} /></div>
              <div>
                <Label>{isAddMode ? translate('password') : translate('passwordLeaveBlank')}</Label>
                <Input type="password" value={editUser.password} onChange={(e) => setEditUser({...editUser, password: e.target.value})} placeholder={isAddMode ? "" : translate('leaveEmptyIfNotChanging')} />
              </div>
              <div>
                <Label>{translate('role')}</Label>
                <Select value={editUser.role} onValueChange={(v) => setEditUser({...editUser, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="superadmin">{translate('superAdmin')}</SelectItem>}
                    <SelectItem value="admin">{translate('admin')}</SelectItem>
                    <SelectItem value="employee">{translate('employee')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{translate('org')}</Label>
                  <Select value={String(editUser.organisation || '')} onValueChange={(v) => setEditUser({...editUser, organisation: v})} disabled={isAdmin && !isSuperAdmin}>
                    <SelectTrigger><SelectValue placeholder={translate('selectOrg')}/></SelectTrigger>
                    <SelectContent>{organisations.items.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{translate('TahfizCenter')}</Label>
                  <Select value={String(editUser.tahfizcenter || '')} onValueChange={(v) => setEditUser({...editUser, tahfizcenter: v})} disabled={isAdmin && !isSuperAdmin}>
                    <SelectTrigger><SelectValue placeholder={translate('selectTahfizCenter')}/></SelectTrigger>
                    <SelectContent>{tahfizCenters.items.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{translate('state')} *</Label>
                <div className="grid grid-cols-3 gap-2 p-2 border rounded max-h-32 overflow-y-auto">
                  {currentUserStates.map(s => (
                    <div key={s} className="flex items-center space-x-2">
                      <Checkbox id={s} checked={editUser.states?.includes(s)} onCheckedChange={(checked) => {
                        const next = checked ? [...(editUser.states || []), s] : (editUser.states || []).filter(item => item !== s);
                        setEditUser({...editUser, states: next});
                      }} disabled={isAdmin && !isSuperAdmin} />
                      <label htmlFor={s} className="text-xs">{s}</label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{translate('cancel')}</Button>
                <Button onClick={handleSaveUser} className="bg-emerald-600">{translate('save')}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => deleteUser.mutate(userToDelete.id)} title={translate('delete')} description={translate('confirmDelete')} variant="destructive" />
    </div>
  );
}