import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Edit, Trash2, Search, Save, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import { showError, showSuccess } from '@/components/ToastrNotification';
import { translate } from '@/utils/translations';


export default function ManagePaymentPlatforms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'manual',
    status: 'active',
    icon: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

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

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['payment-platforms'],
    queryFn: () => base44.entities.PaymentPlatform.list(),
    enabled: isSuperAdmin
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentPlatform.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-platforms']);
      setIsDialogOpen(false);
      setFormData({ code: '', name: '', category: 'manual', status: 'active', icon: '' });
      showSuccess('Payment Platform Successfully Created');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentPlatform.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-platforms']);
      setIsDialogOpen(false);
      setEditingPlatform(null);
      setFormData({ code: '', name: '', category: 'manual', status: 'active', icon: '' });
      showSuccess('Payment Platform Successfully Updated');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-platforms']);
      showSuccess('Payment Platform Successfully Deleted');
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('superadminDashboard'), page: 'SuperadminDashboard' },
          { label: 'Payment Platforms', page: 'ManagePaymentPlatforms' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{translate('accessDenied')}</h2>
            <p className="text-gray-600">{translate('doNotHavePermissionAccessPage')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredPlatforms = platforms.filter(p => 
    !searchQuery || 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingPlatform(null);
    setFormData({ code: '', name: '', category: 'manual', status: 'active', icon: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (platform) => {
    setEditingPlatform(platform);
    setFormData({
      code: platform.code || '',
      name: platform.name || '',
      category: platform.category || 'manual',
      status: platform.status || 'active',
      icon: platform.icon || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.code?.trim()) {
      showError('Sila masukkan kod platform');
      return;
    }
    if (!formData.name?.trim()) {
      showError('Sila masukkan nama platform');
      return;
    }

    if (editingPlatform) {
      updateMutation.mutate({ id: editingPlatform.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (platform) => {
    setPlatformToDelete(platform);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!platformToDelete) return;
    deleteMutation.mutate(platformToDelete.id);
    setDeleteDialogOpen(false);
    setPlatformToDelete(null);
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-700">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('superadminDashboard'), page: 'SuperadminDashboard' },
        { label: translate('paymentPlatforms'), page: 'ManagePaymentPlatforms' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {translate('paymentPlatforms')}
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder= {translate('searchPlatform')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredPlatforms.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500">{translate('noPlatformFound')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredPlatforms.map(platform => (
            <Card key={platform.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{platform.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{platform.code}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">{platform.category}</Badge>
                      {getStatusBadge(platform.status)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(platform)} className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(platform)} className="h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredPlatforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noPlatformFound')}</TableCell>
                </TableRow>
              ) : (
                filteredPlatforms.map(platform => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-mono">{platform.code}</TableCell>
                    <TableCell className="font-medium">{platform.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{platform.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(platform.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(platform)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(platform)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>{editingPlatform ? 'Edit Platform' : 'Add Platform'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Platform Code <span className="text-red-500">*</span></Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BANK_TRANSFER"
                disabled={!!editingPlatform}
              />
            </div>
            <div>
              <Label>Platform Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bank Transfer"
              />
            </div>
            <div>
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="gateway">Gateway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icon Name (Optional)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g. CreditCard"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Platform"
        description={`Are you sure you want to delete "${platformToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}