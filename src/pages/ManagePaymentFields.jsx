import React, { useState } from 'react';
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
import { 
  useCreatePaymentField,
  useDeletePaymentField,
  useGetPaymentField,
  useUpdatePaymentField,
} from '@/hooks/usePaymentFieldMutations';
import { useGetPaymentPlatform } from '@/hooks/usePaymentPlatformMutations';
import { validateFields } from '@/utils/validations';

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
    paymentplatform: null,
    key: '',
    label: '',
    fieldtype: 'text',
    required: false,
    placeholder: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const { data: fields, isLoading } = useGetPaymentField(isSuperAdmin);
  const { data: platforms } = useGetPaymentPlatform(isSuperAdmin);

  const createMutation = useCreatePaymentField();
  const updateMutation = useUpdatePaymentField();
  const deleteMutation = useDeletePaymentField();

  const filteredFields = fields.filter(f => {
    const matchesSearch = !searchQuery || 
      f.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all';
    return matchesSearch && matchesPlatform;
  });

  const openAddDialog = () => {
    setEditingField(null);
    setFormData({ paymentplatform: null, key: '', label: '', fieldtype: 'text', required: false, placeholder: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (field) => {
    setEditingField(field);
    setFormData({
      paymentplatform: field.paymentplatform?.id || '',
      key: field.key || '',
      label: field.label || '',
      fieldtype: field.fieldtype || 'text',
      required: field.required || false,
      placeholder: field.placeholder || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isValid = validateFields(formData, [
      { field: 'paymentplatform', label: 'Payment Platform', type: 'text' },
      { field: 'key', label: 'Field Key', type: 'text' },
      { field: 'label', label: 'Label', type: 'text' },
      { field: 'fieldtype', label: 'Field Type', type: 'text' },
    ]);

    if (!isValid) return;

    const payload = {
      ...formData,
      paymentplatform: formData.paymentplatform
        ? { id: formData.paymentplatform }
        : null,
    };

    if (editingField) {
      updateMutation.mutateAsync({ id: editingField.id, data: payload })
      .then((res) => {
        if (res) {
          setIsDialogOpen(false);
          setEditingField(null);
          setFormData({ paymentplatform: null, key: '', label: '', fieldtype: 'text', required: false, placeholder: '' });
        }
      });
    } else {
      createMutation.mutateAsync(payload)
      .then((res) => {
        if (res) {
          setIsDialogOpen(false);
          setFormData({ paymentplatform: null, key: '', label: '', fieldtype: 'text', required: false, placeholder: '' });
        }
      });
    }
  };

  const handleDelete = (field) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!fieldToDelete) return;
    deleteMutation.mutateAsync(fieldToDelete.id);
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
                      <Badge variant="secondary">{getPlatformName(field.paymentplatform?.code)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{field.key}</TableCell>
                    <TableCell>{field.label || '-'}</TableCell>
                    <TableCell className="capitalize">{field.fieldtype}</TableCell>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Field'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Payment Platform <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.paymentplatform} 
                onValueChange={(value) => setFormData({ ...formData, paymentplatform: Number(value) })}
                disabled={editingField}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.id} value={Number(p.id)}>{p.name}</SelectItem>
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
              <Label>Label <span className="text-red-500">*</span></Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Bank Name"
              />
            </div>
            <div>
              <Label>Field Type <span className="text-red-500">*</span></Label>
              <Select value={formData.fieldtype} onValueChange={(value) => setFormData({ ...formData, fieldtype: value })}>
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