import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import { showError, showSuccess } from '@/components/ToastrNotification';
import { isSupabaseMode, useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '../components/PageLoadingComponent';
import { useCreateOrganisationType, useUpdateOrganisationType, useDeleteOrganisationType } from '@/hooks/useOrganisationTypeMutations';

export default function ManageOrganisationTypes() {
  const trpcUtils = trpc.useUtils();

  const {
    loadingUser, 
    isSuperAdmin, 
  } = useAdminAccess();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const createMutation = useCreateOrganisationType();
  const updateMutation = useUpdateOrganisationType();
  const deleteMutation = useDeleteOrganisationType();

  const trpcRes = trpc.organisationType.getTypes.useQuery(undefined,
    { enabled: isSupabaseMode && isSuperAdmin }
  );

  const base44Res = useQuery({
    queryKey: ['organisationTypes'],
    queryFn: () => base44.entities.OrganisationType.list('-created_date'),
    enabled: !isSupabaseMode && isSuperAdmin
  });

  const types = isSupabaseMode ? (trpcRes.data ?? []) : (base44Res.data ?? []);
  const typesLoading = isSupabaseMode ? trpcRes.isLoading : base44Res.isLoading;

  const openAddDialog = () => {
    setEditingType(null);
    setFormData({ name: '', description: '', status: 'active' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      description: type.description || '',
      status: type.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showError('Sila masukkan nama jenis organisasi');
      return;
    }

    if (editingType) {
      updateMutation.mutateAsync({ 
        id: editingType.id, 
        ...formData 
      }).then((res) => {
        if(res) {
          setIsDialogOpen(false);
          setEditingType(null);
          setFormData({ name: '', description: '', status: 'active' });          
        }
      });
    } else {
      createMutation.mutateAsync(formData)
      .then((res) => {
        if(res) {
          setIsDialogOpen(false);
          setFormData({ name: '', description: '', status: 'active' });
        }
      });
    }
  };

  const handleDelete = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!typeToDelete) return;
    deleteMutation.mutate({ id: typeToDelete.id });

    setDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Super Admin', page: 'SuperadminDashboard' },
        { label: 'Jenis Organisasi', page: 'ManageOrganisationTypes' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-600" />
            Urus Jenis Organisasi
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis
        </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typesLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                types.map(type => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={type.status === 'active' ? 'default' : 'secondary'}>
                        {type.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(type)}>
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
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingType ? 'Edit Jenis Organisasi' : 'Tambah Jenis Organisasi Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Padam Jenis Organisasi"
        description={`Adakah anda pasti ingin memadam "${typeToDelete?.name}"? Tindakan ini tidak boleh dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Padam"
        variant="destructive"
      />
    </div>
  );
}