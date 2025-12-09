import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Shield, ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react';
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
import { toast } from "sonner";
import { useUserWithRoleOverride } from '../components/useUserWithRoleOverride';

const ITEMS_PER_PAGE = 10;

export default function ManageEmployees() {
  const { user: currentUser, loading: userLoading } = useUserWithRoleOverride();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => {
      toast.info('Note: Employee accounts must be created via invite system');
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsCreating(false);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      setIsCreating(false);
      toast.success('Employee updated');
    }
  });

  const isOrganization = currentUser?.type === 'organization';

  if (!isOrganization) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only organizations can access this page</p>
        </CardContent>
      </Card>
    );
  }

  // Filter to show only employees of this organization
  const myEmployees = users.filter(u => 
    u.type === 'employee' && u.organisation_id === currentUser.id
  );

  const filteredUsers = myEmployees.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const handleAddEmployee = () => {
    setEditUser({
      full_name: '',
      email: '',
      type: 'employee',
      organisation_id: currentUser.id,
      role: 'admin',
      admin_type: 'employee'
    });
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setIsCreating(false);
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!editUser) return;
    
    if (isCreating) {
      createUserMutation.mutate(editUser);
    } else {
      updateUserMutation.mutate({ id: editUser.id, data: editUser });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Manage Employees</h1>
        <Button onClick={handleAddEmployee} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees"
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
              <p className="text-gray-500">No employees yet</p>
              <Button onClick={handleAddEmployee} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                Add Your First Employee
              </Button>
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
                      <Badge variant="secondary" className="text-xs mt-1">Employee</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(user)}
                    className="flex-shrink-0"
                  >
                    <Edit className="w-4 h-4" />
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
            Page {page} / {totalPages}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add New Employee' : 'Edit Employee'}</DialogTitle>
          </DialogHeader>
          
          {editUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  value={editUser.full_name || ''}
                  onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                  placeholder="Employee name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  placeholder="employee@example.com"
                  disabled={!isCreating}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select 
                  value={editUser.admin_type || 'employee'} 
                  onValueChange={(v) => setEditUser({...editUser, admin_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-700">
                  {isCreating ? 'Create Employee' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}