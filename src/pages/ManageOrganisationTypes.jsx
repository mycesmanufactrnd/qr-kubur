import { useState } from 'react';
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
import { useAdminAccess } from '@/utils/auth';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '../components/PageLoadingComponent';
import { 
  useGetOrganisationType, 
  useCreateOrganisationType, 
  useUpdateOrganisationType, 
  useDeleteOrganisationType 
} from '@/hooks/useOrganisationTypeMutations';
import { validateFields } from '@/utils/validations';
import { translate } from '@/utils/translations';


export default function ManageOrganisationTypes() {
  const {
    loadingUser, 
    isSuperAdmin,
    hasAdminAccess,
  } = useAdminAccess();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const { 
    data: types, 
    isLoading: typesLoading, 
  } = useGetOrganisationType(hasAdminAccess);
  const createMutation = useCreateOrganisationType();
  const updateMutation = useUpdateOrganisationType();
  const deleteMutation = useDeleteOrganisationType();

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

    const isValid = validateFields(formData, [
      { field: 'name', label: 'Name', type: 'text' },
    ]);

    if (!isValid) return;

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
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'Super Admin', page: 'SuperadminDashboard' },
          { label: 'Jenis Organisasi', page: 'ManageOrganisationTypes' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

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
              {typesLoading ? (
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