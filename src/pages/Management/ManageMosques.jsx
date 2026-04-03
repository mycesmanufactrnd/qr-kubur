import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { Landmark, Plus, Edit, Trash2, Search, X, Save, ImageIcon, MapPin } from 'lucide-react';

import Breadcrumb from '@/components/Breadcrumb';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showError, showSuccess } from '@/components/ToastrNotification';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';

import { useAdminAccess } from '@/utils/auth';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import { validateFields } from '@/utils/validations';
import { resolveFileUrl } from '@/utils';

import { useGetMosquePaginated, useMosqueMutations } from '@/hooks/useMosqueMutations';

import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import { defaultMosqueField } from '@/utils/defaultformfields';
import { useForm } from 'react-hook-form';
import CheckboxForm from '@/components/forms/CheckboxForm';

export default function ManageMosques() {
  const { loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('mosques');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const urlState = searchParams.get('state') || 'all';

  const [setName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
  }, [urlName, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMosque, setEditingMosque] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mosqueToDelete, setMosqueToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: defaultMosqueField });

  const photourl = watch('photourl') || '';

  const { mosquesList, totalPages, isLoading } = useGetMosquePaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState === 'all' ? undefined : urlState,
  });

  const { organisationsList, isLoading: orgLoading } = useGetOrganisationPaginated({
    page: 1,
    pageSize: 100
  });

  const { createMosque, updateMosque, deleteMosque } = useMosqueMutations();

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload/bucket-mosque', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }

      const data = await res.json();
      setValue('photourl', data.file_url);
      showSuccess(translate('Photo uploaded'));
    } catch (err) {
      console.error(err);
      showError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    const params = { page: '1' };
    if (setName) params.search = setName;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempName('');
    setTempState('all');
    setSearchParams({ page: '1' });
  };

  const openEditDialog = (mosque) => {
    setEditingMosque(mosque);
    reset({
      ...mosque,
      organisation: mosque.organisation?.id?.toString() ?? '',
      latitude: mosque.latitude?.toString() || '',
      longitude: mosque.longitude?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'name', label: 'Mosque', type: 'text' },
      { field: 'state', label: 'State', type: 'select' },
    ]);

    if (!isValid) return;

    const payload = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      organisation: formData.organisation ? { id: Number(formData.organisation) } : null,
    };

    try {
      if (editingMosque) {
        await updateMosque.mutateAsync({ id: editingMosque.id, data: payload });
      } else {
        await createMosque.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      reset(defaultMosqueField);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!mosqueToDelete) return;
    await deleteMosque.mutateAsync(mosqueToDelete.id);
    setDeleteDialogOpen(false);
    setMosqueToDelete(null);
  };

  if (loadingUser || permissionsLoading || orgLoading) return <PageLoadingComponent />;

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent />
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
          { label: translate('Manage Mosques'), page: 'ManageMosques' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Mosques'), page: 'ManageMosques' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Landmark className="w-6 h-6 text-stone-600" />
          {translate('Manage Mosques')}
        </h1>
        {canCreate && (
          <Button onClick={() => { setEditingMosque(null); reset(defaultMosqueField); setIsDialogOpen(true); }} className="bg-stone-600 hover:bg-stone-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add Mosque')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Name')}
                value={setName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-stone-600 hover:bg-stone-700 px-6">{translate('Search')}</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={tempState} onValueChange={setTempState}>
              <SelectTrigger><SelectValue placeholder={translate("State")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All States')}</SelectItem>
                {STATES_MY.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleReset}>
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
                <TableHead>{translate('Mosque name')}</TableHead>
                <TableHead className="text-center">{translate('PIC Name')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={3} />
              ) : mosquesList.items.length === 0 ? (
                <NoDataTableComponent colSpan={3} />
              ) : (
                mosquesList.items.map(mosque => (
                  <TableRow key={mosque.id}>
                    <TableCell className="font-medium">{mosque.name}</TableCell>
                    <TableCell className="text-center">{mosque.picname}</TableCell>
                    <TableCell className="text-center">{mosque.state}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(mosque)}><Edit className="w-4 h-4" /></Button>}
                        {canDelete && <Button variant="ghost" size="sm" onClick={() => { setMosqueToDelete(mosque); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                      </div>
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
            totalItems={mosquesList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMosque ? translate('Edit Mosque') : translate('Add Mosque')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm name="name" control={control} label={translate('Mosque name')} required />
            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <TextInputForm name="address" control={control} label={translate('Address')} isTextArea />

            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="email" control={control} label={translate('Email')} />
              <TextInputForm name="url" control={control} label={translate('Website / URL')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="latitude" control={control} label={translate('Latitude')} isNumber />
              <TextInputForm name="longitude" control={control} label={translate('Longitude')} isNumber />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                navigator.geolocation.getCurrentPosition((pos) => {
                  setValue('latitude', pos.coords.latitude.toFixed(16));
                  setValue('longitude', pos.coords.longitude.toFixed(16));
                })
              }
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('Get Current Location')}
            </Button>

            <SelectForm
              name="organisation"
              control={control}
              placeholder={translate('Select Organisation')}
              label={translate('Organisation')}
              options={(organisationsList?.items || []).map(org => ({ label: org.name, value: org.id }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="picname" control={control} label={translate('PIC Name')} required errors={errors}/>
              <TextInputForm name="picphoneno" control={control} label={translate('PIC Phone No.')} required errors={errors}/>
            </div>

            <CheckboxForm
              name="canarrangefuneral"
              control={control}
              label={translate("Can Arrange Funeral")}
            />

            <CheckboxForm
              name="hasdeathcharity"
              control={control}
              label={translate("Has Death Charity")}
            />

            <div className="space-y-2">
              <Label>{translate('Photo')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span>{translate('Uploading...')}</span>
                  </div>
                )}
              </div>
              
              {photourl && (
                <div className="mt-3 relative w-40 h-40 group">
                  <img 
                    src={resolveFileUrl(photourl, 'bucket-mosque')} 
                    alt="Mosque preview"
                    className="w-full h-full object-cover rounded-lg border-2 border-stone-100 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <ImageIcon className="text-white w-8 h-8" />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || uploading} className="bg-stone-600 hover:bg-stone-700 min-w-[100px]">
                {isSubmitting ? <InlineLoadingComponent /> : <><Save className="w-4 h-4 mr-2" /> {translate('Save')}</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete Mosque')}
        description={`${translate('Delete')} "${mosqueToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />
    </div>
  );
}
