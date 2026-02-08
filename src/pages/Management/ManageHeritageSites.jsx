import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetHeritageSitesPaginated, useHeritageMutations } from '@/hooks/useHeritageMutations';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { defaultHeritageField } from '@/utils/defaultformfields';
import { validateFields } from '@/utils/validations';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import CheckboxForm from '@/components/forms/CheckboxForm';

export default function ManageHeritageSites() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const urlState = searchParams.get('state') || 'all';

  const [tempName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHeritage, setEditingHeritage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [heritageToDelete, setHeritageToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('heritages');
  const { heritageSiteList, totalPages, isLoading } = useGetHeritageSitesPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName, 
    filterState: urlState === 'all' ? undefined : urlState,
  });
  
  const { createHeritage, updateHeritage, deleteHeritage } = useHeritageMutations();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultHeritageField,
  });

  const photourl = watch('photourl');

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
  }, [urlName, urlState]);

  const handleSearch = () => {
    const params = { page: '1' };
    if (tempName) params.name = tempName;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const openAddDialog = () => {
    setEditingHeritage(null);
    reset(defaultHeritageField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (heritage) => {
    setEditingHeritage(heritage);
    reset(heritage);
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload/heritage-site', { method: 'POST', body: formDataUpload });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }
      const data = await res.json();
      setValue('photourl', data.file_url);
      showSuccess('Photo uploaded');
    } catch (err) {
      console.error(err);
      showError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'name', label: 'Name', type: 'text' },
      { field: 'state', label: 'State', type: 'select' },
      { field: 'photourl', label: 'Photo', type: 'text' },
    ]);

    if (!isValid) return;

    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    try {
      if (editingHeritage) {
        await updateHeritage.mutateAsync({ id: editingHeritage.id, data: submitData });
      } else {
        await createHeritage.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!heritageToDelete) return;
    try {
      await deleteHeritage.mutateAsync(heritageToDelete.id);
      setDeleteDialogOpen(false);
      setHeritageToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
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
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('Superadmin Dashboard'), page: 'SuperadminDashboard' },
          { label: translate('Manage Heritage Sites'), page: 'ManageHeritageSites' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Superadmin Dashboard'), page: 'SuperadminDashboard' },
        { label: translate('Manage Heritage Sites'), page: 'ManageHeritageSites' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Heritage Sites')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Heritage Sites')}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Heritage Site')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={setTempState}>
                <SelectTrigger><SelectValue placeholder="Negeri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All states')}</SelectItem>
                  {STATES_MY.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" /> {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Heritage Site')}</TableHead>
                <TableHead className="text-center">{translate('Era')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Featured')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : heritageSiteList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                heritageSiteList.items.map(site => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell className="text-center">{site.era}</TableCell>
                    <TableCell className="text-center">{site.state}</TableCell>
                    <TableCell className="text-center">{site.isfeatured ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(site)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => { setHeritageToDelete(site); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={heritageSiteList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHeritage ? translate('Edit Heritage Site') : translate('Add Heritage Site')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">    
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            />        
            <TextInputForm
              name="era"
              control={control}
              label={translate("Era")}
            />
            <TextInputForm
              name="eradescription"
              control={control}
              label={translate("Era Description")}
              isTextArea
            />
            <TextInputForm
              name="description"
              control={control}
              label={translate("Description")}
              isTextArea
            />
            <Controller
              name="historicalsources"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>{translate('Historical Sources')}</Label>
                  <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className="bg-white" />
                </div>
              )}
            />
            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <CheckboxForm
              name="isfeatured"
              control={control}
              label={translate("Featured")}
            />
            <TextInputForm
              name="url"
              control={control}
              label={translate("URL")}
            />
            <TextInputForm
              name="address"
              control={control}
              label={translate("Address")}
              isTextArea
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="latitude"
                control={control}
                label={translate("Latitude")}
                isNumber
                required
                errors={errors}
              />
              <TextInputForm
                name="longitude"
                control={control}
                label={translate("Longitude")}
                isNumber
                required
                errors={errors}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setValue('latitude', pos.coords.latitude.toFixed(16));
                      setValue('longitude', pos.coords.longitude.toFixed(16));
                      showSuccess('Lokasi berjaya diperolehi');
                    },
                    () => showError('Tidak dapat mendapatkan lokasi.'),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('Get Current Location')}
            </Button>
            <div className="space-y-2">
              <Label>{translate('Photo')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleFileUpload(file);
                  }}
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-gray-500">{translate('uploading...')}</span>}
              </div>
              {photourl && <img src={`/api/file/heritage-site/${encodeURIComponent(photourl)}`} alt={translate('Preview')} />}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button type="submit" disabled={createHeritage.isPending || updateHeritage.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete Heritage Site')}
        description={`${translate('Delete')} "${heritageToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />
    </div>
  );
}
