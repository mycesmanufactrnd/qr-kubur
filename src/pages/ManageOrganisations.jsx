import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit, Trash2, Search, Save, Filter } from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/translations';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const STATES = [
  "Federal", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

const emptyOrg = {
  name: '',
  organisation_type_id: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  status: 'active'
};

export default function ManageOrganisations() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [lang, setLang] = useState('ms');
  
  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch } = useForm({
    defaultValues: emptyOrg
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  const queryClient = useQueryClient();
  const t = (key) => getAdminTranslation(key, lang);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem('appUserAuth');
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        } else {
          const userData = await base44.auth.me();
          setCurrentUser(userData);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
    setLang(getCurrentLanguage());
  }, []);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const hasViewPermission = isSuperAdmin || currentUser?.permissions?.organisations?.view;

  const { data: organisations = [], isLoading } = useQuery({
    queryKey: ['admin-organisations'],
    queryFn: () => base44.entities.Organisation.list('-created_date'),
    enabled: hasViewPermission
  });

  const { data: organisationTypes = [] } = useQuery({
    queryKey: ['organisation-types'],
    queryFn: () => base44.entities.OrganisationType.filter({ status: 'active' })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organisation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      reset(emptyOrg);
      toast.success('Organisasi berjaya ditambah');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organisation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      setIsDialogOpen(false);
      setEditingOrg(null);
      reset(emptyOrg);
      toast.success('Organisasi berjaya dikemaskini');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Organisation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-organisations']);
      toast.success('Organisasi berjaya dipadam');
    }
  });

  if (loadingUser) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || (!isSuperAdmin && !isAdmin)) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins can access this page</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: isSuperAdmin ? t('superadminDashboard') : t('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
          { label: t('manageOrgs'), page: 'ManageOrganisations' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
            <p className="text-gray-600">{t('noPermission')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter by admin state access
  const adminStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);
  
  const accessibleOrgs = organisations.filter(org => {
    if (isSuperAdmin) return true;
    
    // Admin can only see orgs in their state(s)
    const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
    return adminStates.some(s => orgStates.includes(s));
  });

  const filteredOrgs = accessibleOrgs.filter(org => {
    const matchesSearch = !searchQuery || 
      org.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = filterState === 'all' || 
      (Array.isArray(org.state) ? org.state.includes(filterState) : org.state === filterState);
    
    const matchesType = filterType === 'all' || org.organisation_type_id === filterType;
    
    return matchesSearch && matchesState && matchesType;
  });

  const paginatedOrgs = filteredOrgs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);

  const canManageOrg = (org) => {
    if (isSuperAdmin) return true;
    
    // Admin can only manage orgs in their state(s)
    const orgStates = Array.isArray(org.state) ? org.state : [org.state].filter(Boolean);
    return adminStates.some(s => orgStates.includes(s));
  };

  const openAddDialog = () => {
    setEditingOrg(null);
    // For state admin, pre-set their state
    const defaultState = isSuperAdmin ? '' : (adminStates[0] || '');
    reset({...emptyOrg, state: defaultState});
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    if (!canManageOrg(org)) {
      toast.error('Anda tidak mempunyai kebenaran untuk edit organisasi ini');
      return;
    }
    setEditingOrg(org);
    reset({
      name: org.name || '',
      organisation_type_id: org.organisation_type_id || '',
      state: Array.isArray(org.state) ? org.state[0] : org.state || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      status: org.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data) => {
    if (!data.name?.trim()) {
      toast.error('Sila masukkan nama organisasi');
      return;
    }
    if (!data.organisation_type_id) {
      toast.error('Sila pilih jenis organisasi');
      return;
    }
    if (!data.state) {
      toast.error('Sila pilih negeri');
      return;
    }
    
    const submitData = {
      name: data.name,
      organisation_type_id: data.organisation_type_id,
      state: Array.isArray(data.state) ? data.state : [data.state],
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      status: data.status || 'active'
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (org) => {
    if (!canManageOrg(org)) {
      toast.error('Anda tidak mempunyai kebenaran untuk padam organisasi ini');
      return;
    }
    setOrgToDelete(org);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!orgToDelete) return;
    deleteMutation.mutate(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
  };

  const getTypeName = (typeId) => {
    const type = organisationTypes.find(t => t.id === typeId);
    return type?.name || '-';
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin ? t('superadminDashboard') : t('adminDashboard'), page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: t('manageOrgs'), page: 'ManageOrganisations' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-600" />
            {t('manageOrgs')}
          </h1>
        </div>
        <Button onClick={openAddDialog} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          {t('addNew')}
        </Button>
      </div>

      {/* Advanced Search & Filters */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Carian Lanjutan</h3>
          </div>

          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400">Nama Organisasi</Label>
            <Input
              placeholder="Cari nama organisasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300 dark:border-white dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Jenis Organisasi</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {organisationTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">Negeri</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="border-gray-300 dark:border-white dark:text-white">
                  <SelectValue placeholder="Pilih negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Negeri</SelectItem>
                  {(isSuperAdmin ? STATES : STATES.filter(s => adminStates.includes(s))).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchQuery || filterType !== 'all' || filterState !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterState('all');
                }}
              >
                Reset Semua Carian
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Menunjukkan {filteredOrgs.length} daripada {accessibleOrgs.length} organisasi
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('orgType')}</TableHead>
                <TableHead>{t('state')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{t('loading')}</TableCell>
                </TableRow>
              ) : paginatedOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">{t('noRecords')}</TableCell>
                </TableRow>
              ) : (
                paginatedOrgs.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTypeName(org.organisation_type_id)}</Badge>
                    </TableCell>
                    <TableCell>{Array.isArray(org.state) ? org.state.join(', ') : org.state}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(org)}
                        disabled={!canManageOrg(org)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(org)}
                        disabled={!canManageOrg(org)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={filteredOrgs.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingOrg ? t('edit') : t('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>{t('name')} <span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Nama organisasi diperlukan' }}
                render={({ field }) => <Input {...field} />}
              />
            </div>
            <div>
              <Label>{t('orgType')} <span className="text-red-500">*</span></Label>
              <Controller
                name="organisation_type_id"
                control={control}
                rules={{ required: 'Jenis organisasi diperlukan' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis organisasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {organisationTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{t('state')} <span className="text-red-500">*</span></Label>
              <Controller
                name="state"
                control={control}
                rules={{ required: 'Negeri diperlukan' }}
                render={({ field }) => (
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                    disabled={!isSuperAdmin && adminStates.length === 1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih negeri" />
                    </SelectTrigger>
                    <SelectContent>
                      {(isSuperAdmin ? STATES : STATES.filter(s => adminStates.includes(s))).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{t('address')}</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Textarea {...field} />}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div>
                <Label>{t('email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input type="email" {...field} />}
                />
              </div>
            </div>
            <div>
              <Label>{t('status')}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('active')}</SelectItem>
                      <SelectItem value="inactive">{t('inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('delete')}
        description={`${t('confirmDelete')} "${orgToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={t('delete')}
        variant="destructive"
      />
    </div>
  );
}