import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Edit, Trash2, Search, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import { showError, showSuccess } from '@/components/ToastrNotification';
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';

export default function ManagePaymentFields() {
  const { 
    loadingUser, 
    isSuperAdmin, 
  } = useAdminAccess();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    payment_platform_code: '',
    key: '',
    label: '',
    field_type: 'text',
    required: false,
    placeholder: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['payment-fields'],
    queryFn: () => base44.entities.PaymentPlatformField.list(),
    enabled: isSuperAdmin
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['payment-platforms'],
    queryFn: () => base44.entities.PaymentPlatform.list(),
    enabled: isSuperAdmin
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentPlatformField.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-fields']);
      setIsDialogOpen(false);
      setFormData({ payment_platform_code: '', key: '', label: '', field_type: 'text', required: false, placeholder: '' });
      showSuccess('Payment Field Successfully Created');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentPlatformField.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-fields']);
      setIsDialogOpen(false);
      setEditingField(null);
      setFormData({ payment_platform_code: '', key: '', label: '', field_type: 'text', required: false, placeholder: '' });
      showSuccess('Payment Field Successfully Edited');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentPlatformField.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-fields']);
      showSuccess('Payment Field Successfully Deleted');
    }
  });

  const filteredFields = fields.filter(f => {
    const matchesSearch = !searchQuery || 
      f.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || f.payment_platform_code === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const openAddDialog = () => {
    setEditingField(null);
    setFormData({ payment_platform_code: '', key: '', label: '', field_type: 'text', required: false, placeholder: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (field) => {
    setEditingField(field);
    setFormData({
      payment_platform_code: field.payment_platform_code || '',
      key: field.key || '',
      label: field.label || '',
      field_type: field.field_type || 'text',
      required: field.required || false,
      placeholder: field.placeholder || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.payment_platform_code) {
      showError('Sila pilih platform');
      return;
    }
    if (!formData.key?.trim()) {
      showError('Sila masukkan field key');
      return;
    }

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (field) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!fieldToDelete) return;
    deleteMutation.mutate(fieldToDelete.id);
    setDeleteDialogOpen(false);
    setFieldToDelete(null);
  };

  const getPlatformName = (code) => {
    return platforms.find(p => p.code === code)?.name || code;
  };

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'Super Admin', page: 'SuperadminDashboard' },
          { label: 'Payment Fields', page: 'ManagePaymentFields' }
        ]} />
        <AccessDeniedComponent/> 
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Super Admin', page: 'SuperadminDashboard' },
        { label: 'Payment Fields', page: 'ManagePaymentFields' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Payment Platform Fields
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(p => (
                  <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Field Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredFields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">No fields found</TableCell>
                </TableRow>
              ) : (
                filteredFields.map(field => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Badge variant="secondary">{getPlatformName(field.payment_platform_code)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{field.key}</TableCell>
                    <TableCell>{field.label || '-'}</TableCell>
                    <TableCell className="capitalize">{field.field_type}</TableCell>
                    <TableCell>
                      {field.required ? (
                        <Badge className="bg-red-100 text-red-700">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(field)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(field)}>
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
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Field'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Payment Platform <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.payment_platform_code} 
                onValueChange={(value) => setFormData({ ...formData, payment_platform_code: value })}
                disabled={!!editingField}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Field Key <span className="text-red-500">*</span></Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g. bank_name"
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Bank Name"
              />
            </div>
            <div>
              <Label>Field Type <span className="text-red-500">*</span></Label>
              <Select value={formData.field_type} onValueChange={(value) => setFormData({ ...formData, field_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Optional placeholder text"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
              <Label>Required Field</Label>
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
        title="Delete Field"
        description={`Are you sure you want to delete field "${fieldToDelete?.key}"?`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}