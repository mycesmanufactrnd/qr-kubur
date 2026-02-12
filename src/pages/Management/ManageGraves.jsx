import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save, QrCode } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { ActiveInactiveStatus, STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import { useGetGravePaginated, useGraveMutations } from '@/hooks/useGraveMutations';
import { trpc } from '@/utils/trpc';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import QRCodeDialog from '@/components/QRCodeDialog';
import { validateFields } from '@/utils/validations';
import { defaultGraveField } from '@/utils/defaultformfields';
import { defaultGraveFilter } from '@/utils/defaultfilter';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useForm } from 'react-hook-form';

export default function ManageGraves() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';
  const urlBlock = searchParams.get('block') || '';
  const urlLot = searchParams.get('lot') || '';
  const urlState = searchParams.get('state') || 'all';
  const urlStatus = searchParams.get('status') || 'all';

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempBlock, setTempBlock] = useState(urlBlock);
  const [tempLot, setTempLot] = useState(urlLot);
  const [tempState, setTempState] = useState(urlState);
  const [tempStatus, setTempStatus] = useState(urlStatus);
  
  useEffect(() => {
    setTempSearch(urlSearch);
    setTempBlock(urlBlock);
    setTempLot(urlLot);
    setTempState(urlState);
    setTempStatus(urlStatus);
  }, [urlSearch, urlBlock, urlLot, urlState, urlStatus]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }} = useForm({
    defaultValues: defaultGraveField
  });

  const photourl = watch('photourl') || '';

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrGrave, setQRGrave] = useState({});
  const [uploading, setUploading] = useState(false);

  const photourl = watch('photourl');

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('graves');

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { organisationId: currentUser?.organisation?.id },
    { enabled: !!currentUser && !!currentUser?.organisation?.id && !isSuperAdmin }
  );
  
  useEffect(() => {
    if (parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery.data);
    }
  }, [parentAndChildQuery.data]);

  const { gravesList, totalPages, isLoading } = useGetGravePaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    search: urlSearch, 
    filterState: urlState === 'all' ? undefined : urlState,
    filterStatus: urlStatus === 'all' ? undefined : urlStatus,
    filterBlock: urlBlock || undefined, 
    filterLot: urlLot || undefined,     
    organisationIds: accessibleOrgIds
  }); 

  const { organisationsList } = useGetOrganisationPaginated({});
  const { createGrave, updateGrave, deleteGrave } = useGraveMutations();

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload/bucket-grave', { method: 'POST', body: formDataUpload });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setValue('photourl', data.file_url);
      showSuccess(translate('Photo uploaded'));
    } catch (err) {
      showError(translate('Failed to upload photo'));
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    const params = { ...defaultGraveFilter };
    if (tempSearch) params.search = tempSearch;
    if (tempBlock) params.block = tempBlock;
    if (tempLot) params.lot = tempLot;
    if (tempState !== 'all') params.state = tempState;
    if (tempStatus !== 'all') params.status = tempStatus;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingGrave(null);
    reset(defaultGraveField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    reset({
      ...grave,
      organisation: grave.organisation?.id?.toString() ?? '',
      status: grave.status ?? 'active',
      totalgraves: grave.totalgraves ?? 0,
      photourl: grave.photourl ?? ''
    });
    setIsDialogOpen(true);
  };

    const handleFileUpload = async (file) => {
      setUploading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
  
        const res = await fetch('/api/upload/bucket-grave', { method: 'POST', body: formDataUpload });
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
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : '',
      longitude: formData.longitude ? parseFloat(formData.longitude) : '',
      organisation: formData.organisation ? { id: Number(formData.organisation) } : null,
      totalgraves: Number(formData.totalgraves) || 0
    };
    
    if (editingGrave) {
      await updateGrave.mutateAsync({ id: editingGrave.id, data: submitData }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      await createGrave.mutateAsync(submitData, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  const confirmDelete = async () => {
    if (!graveToDelete) return;
    await deleteGrave.mutateAsync(graveToDelete.id, {
      onSuccess: () => setDeleteDialogOpen(false)
    });
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Graves'), page: 'ManageGraves' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Graves')}
        </h1>
        {canCreate && (
          <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add Grave')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Cemetery name')}
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 px-6">
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
            <Select value={tempStatus} onValueChange={setTempStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All status')}</SelectItem>
                <SelectItem value="active">{translate('Active')}</SelectItem>
                <SelectItem value="full">{translate('Full')}</SelectItem>
                <SelectItem value="maintenance">{translate('Maintenance')}</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder={translate('Block')} value={tempBlock} onChange={(e) => setTempBlock(e.target.value)} />
            <Input placeholder={translate('Lot')} value={tempLot} onChange={(e) => setTempLot(e.target.value)} />
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
                <TableHead>{translate('Cemetery name')}</TableHead>
                <TableHead className="text-center">{translate('Total Graves')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Block')}/{translate('Lot')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6}/>
              ) : gravesList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6}/>
              ) : (
                gravesList.items.map(grave => (
                  <TableRow key={grave.id}>
                    <TableCell className="font-medium">{grave.name}</TableCell>
                    <TableCell className="text-center">{grave.totalgraves}</TableCell>
                    <TableCell className="text-center">{grave.state}</TableCell>
                    <TableCell className="text-center">
                      {grave.block && `${translate('block')} ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `${translate('lot')} ${grave.lot}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={grave.status === 'active' ? 'default' : 'secondary'}>
                        {translate(grave.status.charAt(0).toUpperCase() + grave.status.slice(1))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => {setGraveToDelete(grave); setDeleteDialogOpen(true);}}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                      <Button variant="ghost" size="sm" onClick={() => {setQRGrave({type: "grave", id: grave.id}); setQRDialogOpen(true);}}><QrCode className="w-4 h-4 text-green-500" /></Button>
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
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({ ...Object.fromEntries(searchParams), page: '1' }); }}
            totalItems={gravesList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGrave ? translate('Edit Grave') : translate('Add Grave')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputForm name="name" control={control} label={translate("Cemetery name")} required errors={errors} />
            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="block" control={control} label={translate("Block")} />
              <TextInputForm name="lot" control={control} label={translate("Lot")} />
            </div>
            <TextInputForm name="address" control={control} label={translate("Address")} isTextArea />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="latitude" control={control} label={translate("Latitude")} isNumber required errors={errors} />
              <TextInputForm name="longitude" control={control} label={translate("Longitude")} isNumber required errors={errors} />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigator.geolocation.getCurrentPosition((pos) => { setValue('latitude', pos.coords.latitude.toFixed(16)); setValue('longitude', pos.coords.longitude.toFixed(16)); })}>
              <MapPin className="w-4 h-4 mr-2" /> {translate('Get Current Location')}
            </Button>
            <SelectForm
              name="organisation"
              control={control}
              label={translate("Managing Organisation")}
              options={organisationsList.items.map(org => ({ value: org.id, label: org.name }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="picname" control={control} label={translate("PIC Name")} />
              <TextInputForm name="picphoneno" control={control} label={translate("PIC Phone No.")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm name="totalgraves" control={control} label={translate("Total Graves")} isNumber />
              <SelectForm
                name="status"
                control={control}
                label={translate("Status")}
                options={[
                  { value: "active", label: translate('Active') },
                  { value: "full", label: translate('Full') },
                  { value: "maintenance", label: translate('Maintenance') },
                ]}
                required
                errors={errors}
              />
            </div>

            {/* EXACT TAHFIZ STYLE PHOTO UPLOAD */}
            <div className="space-y-2">
              <Label>{translate('Photo')}</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e.target.files?.[0])} 
                disabled={uploading} 
              />
              {photourl && (
                <img 
                  className="w-20 h-20 rounded object-cover mt-2" 
                  src={`/api/file/bucket-grave/${encodeURIComponent(photourl)}`} 
                  alt="Preview" 
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('Cancel')}</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting || uploading}>
                <Save className="w-4 h-4 mr-2" /> {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} title={translate('Delete Grave')} description={`${translate('Delete')} "${graveToDelete?.name}"?`} variant="destructive" />
      <QRCodeDialog open={qrDialogOpen} onOpenChange={setQRDialogOpen} data={qrGrave} />
    </div>
  );
}