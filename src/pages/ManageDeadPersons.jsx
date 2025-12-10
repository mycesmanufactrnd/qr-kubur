import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash2, Search, Save, Upload } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const emptyPerson = {
  name: '',
  ic_number: '',
  date_of_birth: '',
  date_of_death: '',
  cause_of_death: '',
  grave_id: '',
  biography: '',
  photo_url: ''
};

export default function ManageDeadPersons() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState(emptyPerson);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        const appUser = JSON.parse(appUserAuth);
        setCurrentUser({
          ...appUser,
          role: 'admin',
          admin_type: appUser.admin_type || 'admin',
          state: appUser.state || []
        });
      }
    } catch (e) {
      setCurrentUser(null);
    }
  };

  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.admin_type === 'superadmin';

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['admin-persons'],
    queryFn: () => base44.entities.DeadPerson.list('-created_date')
  });

  const { data: graves = [] } = useQuery({
    queryKey: ['graves'],
    queryFn: () => base44.entities.Grave.list()
  });

  const adminStates = currentUser?.state || [];
  const accessibleGraves = isSuperAdmin ? graves : graves.filter(g => adminStates.includes(g.state));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeadPerson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      setIsDialogOpen(false);
      setFormData(emptyPerson);
      toast.success('Rekod berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeadPerson.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      setIsDialogOpen(false);
      setEditingPerson(null);
      setFormData(emptyPerson);
      toast.success('Rekod berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeadPerson.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-persons']);
      toast.success('Rekod berjaya dipadam');
    }
  });

  const accessiblePersons = persons.filter(person => {
    if (isSuperAdmin) return true;
    const grave = graves.find(g => g.id === person.grave_id);
    return grave && adminStates.includes(grave.state);
  });

  const filteredPersons = accessiblePersons.filter(person => {
    const matchesSearch = !searchQuery || 
      person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.ic_number?.includes(searchQuery);
    return matchesSearch;
  });

  const openAddDialog = () => {
    setEditingPerson(null);
    setFormData(emptyPerson);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      ic_number: person.ic_number || '',
      date_of_birth: person.date_of_birth || '',
      date_of_death: person.date_of_death || '',
      cause_of_death: person.cause_of_death || '',
      grave_id: person.grave_id || '',
      biography: person.biography || '',
      photo_url: person.photo_url || ''
    });
    setIsDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({...formData, photo_url: file_url});
    setUploading(false);
    toast.success('Gambar berjaya dimuat naik');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (person) => {
    if (confirm(`Padam rekod "${person.name}"?`)) {
      deleteMutation.mutate(person.id);
    }
  };

  const getGraveName = (graveId) => {
    const grave = graves.find(g => g.id === graveId);
    return grave?.cemetery_name || '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Urus Rekod Si Mati
          </h1>
          <p className="text-gray-500">{persons.length} rekod</p>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Rekod
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau No. IC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. IC</TableHead>
                <TableHead>Tarikh Meninggal</TableHead>
                <TableHead>Kubur</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : filteredPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada rekod</TableCell>
                </TableRow>
              ) : (
                filteredPersons.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.ic_number || '-'}</TableCell>
                    <TableCell>
                      {person.date_of_death 
                        ? new Date(person.date_of_death).toLocaleDateString('ms-MY')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getGraveName(person.grave_id)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(person)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? 'Edit Rekod' : 'Tambah Rekod Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Penuh *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>No. IC</Label>
              <Input
                value={formData.ic_number}
                onChange={(e) => setFormData({...formData, ic_number: e.target.value})}
                placeholder="XXXXXX-XX-XXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarikh Lahir</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
              <div>
                <Label>Tarikh Meninggal</Label>
                <Input
                  type="date"
                  value={formData.date_of_death}
                  onChange={(e) => setFormData({...formData, date_of_death: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Sebab Kematian</Label>
              <Input
                value={formData.cause_of_death}
                onChange={(e) => setFormData({...formData, cause_of_death: e.target.value})}
              />
            </div>
            <div>
              <Label>Tanah Perkuburan *</Label>
              <Select value={formData.grave_id} onValueChange={(v) => setFormData({...formData, grave_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kubur" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleGraves.map(grave => (
                    <SelectItem key={grave.id} value={grave.id}>
                      {grave.cemetery_name} - {grave.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Biografi</Label>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({...formData, biography: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label>Gambar</Label>
              <div className="flex items-center gap-3">
                {formData.photo_url && (
                  <img src={formData.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button type="button" variant="outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Memuat naik...' : 'Muat Naik'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
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
    </div>
  );
}