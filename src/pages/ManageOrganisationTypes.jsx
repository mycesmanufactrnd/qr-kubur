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
import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import { showError, showSuccess } from '@/components/ToastrNotification';
import { translate } from '@/utils/translations';


export default function ManageOrganisationTypes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

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

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['organisation-types'],
    queryFn: () => base44.entities.OrganisationType.list('-created_date'),
    enabled: isSuperAdmin
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrganisationType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organisation-types']);
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', status: 'active' });
      showSuccess('Jenis organisasi berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrganisationType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organisation-types']);
      setIsDialogOpen(false);
      setEditingType(null);
      setFormData({ name: '', description: '', status: 'active' });
      showSuccess('Jenis organisasi berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OrganisationType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['organisation-types']);
      showSuccess('Jenis organisasi berjaya dipadam');
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya superadmin boleh mengurus jenis organisasi.</p>
        </CardContent>
      </Card>
    );
  }

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
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!typeToDelete) return;
    deleteMutation.mutate(typeToDelete.id);
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('superadminDashboard'), page: 'SuperadminDashboard' },
        { label: translate('orgType'), page: 'ManageOrganisationTypes' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-600" /> 
            {translate('manageOrganizationTypes')}
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          {translate('addType')}
        </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('name')}</TableHead>
                <TableHead>{translate('description')}</TableHead>
                <TableHead>{translate('status')}</TableHead>
                <TableHead className="text-right">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{translate('loading...')}</TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                types.map(type => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={type.status === 'active' ? 'default' : 'secondary'}>
                        {type.status === 'active' ? translate('active') : translate('inactive')}
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
              {editingType ? translate('editOrganizationType') : translate('addNewOrganizationType')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{translate('name')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>{translate('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <Label>{translate('status')}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{translate('active')}</SelectItem>
                  <SelectItem value="inactive">{translate('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen} 
        title={translate('deleteOrganizationType')} 
        description={`${translate('areYouSureYouWantToDelete')} "${typeToDelete?.name}"? ${translate('thisActionCannotBeUndone')}.`}
        onConfirm={confirmDelete}
        confirmText={translate('delete')}
        variant="destructive"
      />
    </div>
  );
}