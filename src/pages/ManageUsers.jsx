import React, { useState } from 'react';
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
import { useCrudPermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { STATES_MY } from '@/utils/enums';
import { validateFields } from '@/utils/validations';
import { 
  useCreateUser,
  useDeleteUser,
  useGetUserPaginated,
  useUpdateUser, 
} from '@/hooks/useUserMutations';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import { useGetTahfizPaginated } from '@/hooks/useTahfizMutations';
import { hashPassword } from '@/utils/helpers';
import { translate } from '@/utils/translations';

export default function ManageUsers() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
    isEmployee,
    currentUserStates,
  } = useAdminAccess();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('users');

  const { userList: appUsers, totalPages, isLoading: appUsersLoading } = useGetUserPaginated({
    page,
    pageSize: itemsPerPage,
    search: search,
  });
  const { organisationsList: organisations } = useGetOrganisationPaginated({});
  const { tahfizCenterList: tahfizCenters } = useGetTahfizPaginated({});

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const adminAccessibleStates = (() => {
    if (isSuperAdmin) {
      return STATES_MY;
    }

    if (isAdmin || isEmployee) {
      return currentUserStates;
    }

    return [];
  })();

  const handleAddUser = () => {
    setIsAddMode(true);
    const defaultState = isAdmin && !isSuperAdmin ? adminAccessibleStates : [];
    const defaultOrgId = isAdmin && !isSuperAdmin ? currentUser.organisation.id : null;
    const defaultTahfizId = isAdmin && !isSuperAdmin ? currentUser.tahfizcenter.id : null;

    setEditUser({
      fullname: '',
      email: '',
      phoneno: '',
      password: '',
      role: 'employee',
      organisation: defaultOrgId || null,
      tahfizcenter: defaultTahfizId || null,
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
      isAppUser: appUsers.items.some(u => u.id === user.id),
      states: user.states || []
    });

    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;

    const isValid = validateFields(editUser, [
      { field: 'fullname', label: 'Full Name', type: 'text' },
      { field: 'email', label: 'Email', type: 'email' },
      { field: 'phoneno', label: 'Phone No.', type: 'phone', required: false },
      { field: 'states', label: 'State', type: 'array' },
      { field: 'password', label: 'Password', type: 'password', minLength: 6, onlyIfExists: true },
    ]);

    if (!isValid) return;
    
    const submitData = { 
      ...editUser,
      organisation: editUser.organisation
        ? { id: Number(editUser.organisation) }
        : null,
      tahfizcenter: editUser.tahfizcenter
        ? { id: Number(editUser.tahfizcenter) }
        : null,
      ...(editUser.password
        ? { password: await hashPassword(editUser.password) }
        : {}),
    };

    if (!isAddMode && !submitData.password) {
      delete submitData.password;
    }

    if (isAddMode) {
      createMutation.mutateAsync(submitData)
      .then((res) => {
        console.log('res', res)
        if (res) {
          setDialogOpen(false);
          setEditUser(null);
          setIsAddMode(false);
        }
      });
    } else {
      if (editUser.isAppUser) {
        updateMutation.mutateAsync({ id: editUser.id, data: submitData })
        .then((res) => {
          if (res) {
            setDialogOpen(false);
            setEditUser(null);
            setIsAddMode(false);
          }
        })
      }
    }
  };

  const handleStateToggle = (states) => {
    if (!editUser) return;
    // For state admin, don't allow deselecting their own states
    if (isAdmin && !isSuperAdmin) return;
    
    const currentStates = editUser.states || [];
    const newStates = currentStates.includes(states)
      ? currentStates.filter(s => s !== states)
      : [...currentStates, states];
    setEditUser({ ...editUser, states: newStates });
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const isAppUser = appUsers.items.some(u => u.id === userToDelete.id);
    if (isAppUser) {
      deleteMutation.mutate(userToDelete.id);
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
          { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: translate('manageUsers'), page: 'ManageUsers' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[
        { label: isSuperAdmin ? translate('superadminDashboard') : translate('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: translate('manageUsers'), page: 'ManageUsers' }
      ]} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">{translate('manageUsers')}</h1>
        { canCreate && (
          <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('addUser')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('seacrhUser')}
                value={search}
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {appUsersLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))
        ) : appUsers.items.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">{translate('noUserFound')}</p> 
            </CardContent>
          </Card>
        ) : (
          appUsers.items.map(user => (
            <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-700">
                        {user.fullname?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{user.fullname || user.email}</p>
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

      {appUsers.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setPage(1);
          }}
          totalItems={appUsers.total}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{isAddMode ? translate('addUser') : translate('editUser')}</DialogTitle>
          </DialogHeader>
          
          {editUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{translate('fullName')} <span className="text-red-500">*</span></label>
                <Input
                  value={editUser.fullname}
                  onChange={(e) => setEditUser({...editUser, fullname: e.target.value})}
                  placeholder="Masukkan nama penuh"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{translate('email')} <span className="text-red-500">*</span></label>
              <Input
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                placeholder="Masukkan email"
              />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{translate('phone')} </label>
              <Input
                value={editUser.phoneno}
                onChange={(e) => setEditUser({...editUser, phoneno: e.target.value})}
                placeholder="Enter Phone No."
              />
              </div>

              {!isAddMode ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">{translate('passwordLeaveBlank')}</label>
                  <Input
                   type="password"  
                   value={editUser.password}
                   onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                   placeholder={translate('leaveEmptyIfNotChanging')} 
                  />
                </div>
              ) 
              : (
                <div>
                  <label className="text-sm font-medium mb-2 block">{translate('password')} <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                    placeholder="Masukkan kata laluan"
                  />
                </div>
              )}

                <div>
                  <label className="text-sm font-medium mb-2 block">{translate('role')}</label>
                  <Select 
                  value={editUser.role || 'employee'} 
                  onValueChange={(v) => setEditUser({...editUser, role: v})}
                  >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="superadmin">{translate('superAdmin')}</SelectItem>}
                    <SelectItem value="admin">{translate('admin')}</SelectItem>
                    <SelectItem value="employee">{translate('employee')}</SelectItem>
                  </SelectContent>
                  </Select>
                  </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{translate('org')}</label>
                <Select 
                  value={editUser.organisation || ''} 
                  onValueChange={(v) => setEditUser({...editUser, organisation: v, tahfizcenter: null})}
                  disabled={isAdmin && !isSuperAdmin && currentUser.organisation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translate('selectOrg')}/>
                  </SelectTrigger>
                  <SelectContent>
                    {organisations.items.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{translate('TahfizCenter')}</label>
                <Select 
                  value={editUser.tahfiz_center_id || ''} 
                  onValueChange={(v) => setEditUser({...editUser, tahfiz_center_id: v, organisation_id: ''})}
                  disabled={(isAdmin && !isSuperAdmin && currentUser.tahfiz_center_id) || currentUser.organisation_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translate('selectTahfizCenter')} /> 
                  </SelectTrigger>
                  <SelectContent>
                    {tahfizCenters.items.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{translate('state')} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {adminAccessibleStates.map(states => (
                    <div key={states} className="flex items-center space-x-2">
                      <Checkbox
                        id={states}
                        checked={editUser.states?.includes(states)}
                        onCheckedChange={() => handleStateToggle(states)}
                        disabled={isAdmin && !isSuperAdmin}
                      />
                      <label htmlFor={states} className="text-sm">{states}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {translate('cancel')}
                </Button>
                <Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-700">
                  {translate('save')}
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
        description={`Adakah anda pasti ingin memadam pengguna ${userToDelete?.fullname || userToDelete?.email}? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
        />
    </div>
  );
}