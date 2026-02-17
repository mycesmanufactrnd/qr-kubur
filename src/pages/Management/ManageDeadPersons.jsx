import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, Search, X, Save, MapPin, QrCode } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCodeDialog from "@/components/QRCodeDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { translate } from '@/utils/translations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { useGetDeadPersonPaginated, useDeadPersonMutations } from '@/hooks/useDeadPersonMutations';
import { useGetGravePaginated } from '@/hooks/useGraveMutations';
import { trpc } from '@/utils/trpc';
import { defaultDeadPersonField } from '@/utils/defaultformfields';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import TextInputForm from '@/components/forms/TextInputForm';
import { useForm } from 'react-hook-form';
import SelectForm from '@/components/forms/SelectForm';
import FileUploadForm from '@/components/forms/FileUploadForm';

export default function ManageDeadPersons() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const urlIC = searchParams.get('ic') || '';
  const urlGrave = searchParams.get('grave') || 'all';
  const urlState = searchParams.get('state') || 'all';
  const urlDateFrom = searchParams.get('dateFrom') || '';
  const urlDateTo = searchParams.get('dateTo') || '';

  const [tempName, setTeampName] = useState(urlName);
  const [tempIC, setTempIC] = useState(urlIC);
  const [tempGrave, setTempGrave] = useState(urlGrave);
  const [tempState, setTempState] = useState(urlState);
  const [tempDateFrom, setTempDateFrom] = useState(urlDateFrom);
  const [tempDateTo, setTempDateTo] = useState(urlDateTo);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultDeadPersonField,
  });

  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrPerson, setQRPerson] = useState({});
  const [accessibleOrgIds, setAccessibleOrgIds] = useState([]);

  const { loading: permissionsLoading, canEdit, canDelete } = useCrudPermissions('dead_persons');

  useEffect(() => {
    setTeampName(urlName);
    setTempIC(urlIC);
    setTempGrave(urlGrave);
    setTempState(urlState);
    setTempDateFrom(urlDateFrom);
    setTempDateTo(urlDateTo);
  }, [urlName, urlIC, urlGrave, urlState, urlDateFrom, urlDateTo]);

  const parentAndChildQuery = trpc.organisation.getParentAndChildOrgs.useQuery(
    { 
      organisationId: currentUser?.organisation?.id ,
      isIdOnly: true,
    },
    { enabled: !!currentUser?.organisation?.id && !isSuperAdmin }
  );

  useEffect(() => {
    if (parentAndChildQuery && parentAndChildQuery.data) {
      setAccessibleOrgIds(parentAndChildQuery?.data ?? [])
    };
  }, [parentAndChildQuery && parentAndChildQuery]);

  const { deadPersonsList, totalPages, isLoading: isLoadingDeadPerson } = useGetDeadPersonPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterIC: urlIC,
    filterGrave: urlGrave === 'all' ? undefined : Number(urlGrave),
    filterState: urlState === 'all' ? undefined : urlState,
    dateFrom: urlDateFrom,
    dateTo: urlDateTo,
    organisationIds: accessibleOrgIds
  });

  const { gravesList } = useGetGravePaginated({
    organisationIds: accessibleOrgIds
  });

  const { createDeadPerson, updateDeadPerson, deleteDeadPerson } = useDeadPersonMutations();

  const handleSearch = () => {
    const params = { page: '1', name: '', ic: '', grave: '', state: '', dateFrom: '', dateTo: '' };
    if (tempName) params.name = tempName;
    if (tempIC) params.ic = tempIC;
    if (tempGrave !== 'all') params.grave = tempGrave;
    if (tempState !== 'all') params.state = tempState;
    if (tempDateFrom) params.dateFrom = tempDateFrom;
    if (tempDateTo) params.dateTo = tempDateTo;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingPerson(null);
    reset(defaultDeadPersonField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (person) => {
    setEditingPerson(person);
    reset({
      ...person,
      grave: person.grave?.id.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      graveId: Number(formData.grave)
    };

    try {
      if (editingPerson) {
        await updateDeadPerson.mutateAsync({ id: editingPerson.id, data: submitData });
      }
      else {
        await createDeadPerson.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {}
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      await deleteDeadPerson.mutateAsync(personToDelete.id);
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    } catch (error) {}
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

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' }, 
        { label: translate('Manage Deceased'), page: 'ManageDeadPersons' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" />
          {translate('Manage Deceased')}
        </h1>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />{translate('Add New')}
        </Button>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder={translate('Full Name')} 
                value={tempName} 
                onChange={(e) => setTeampName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10" 
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 px-6">{translate('Search')}</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Input placeholder={translate('IC Number')} value={tempIC} onChange={(e) => setTempIC(e.target.value)} />
            
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={(v) => { setTempState(v); setTempGrave('all'); }}>
                <SelectTrigger><SelectValue placeholder="Negeri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('All states')}</SelectItem>
                  {STATES_MY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={tempGrave} onValueChange={setTempGrave}>
              <SelectTrigger><SelectValue placeholder={translate('Cemetery')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All cemeteries')}</SelectItem>
                {gravesList.items.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input type="date" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)} />
            <Input type="date" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)} />

            <Button variant="outline" onClick={handleReset} className="w-full mt-auto"><X className="w-4 h-4 mr-2" />{translate('Reset')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Full Name')}</TableHead>
                <TableHead className="text-center">{translate('IC No.')}</TableHead>
                <TableHead className="text-center">{translate('Date of Death')}</TableHead>
                <TableHead className="text-center">{translate('Cemetery Name')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDeadPerson ? <InlineLoadingComponent isTable={true} colSpan={5}/> : deadPersonsList.items.length === 0 ? <NoDataTableComponent colSpan={5} /> : (
                deadPersonsList.items.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-center">{person.icnumber || '-'}</TableCell>
                    <TableCell className="text-center">{person.dateofdeath ? new Date(person.dateofdeath).toLocaleDateString('ms-MY') : '-'}</TableCell>
                    <TableCell className="text-center">{person.grave?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      {canEdit && <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => { setPersonToDelete(person); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                      <Button variant="ghost" size="sm" onClick={() => { setQRPerson({type: "deadperson", id: person.id}); setQRDialogOpen(true); }}><QrCode className="w-4 h-4 text-green-500" /></Button>
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
            onPageChange={(p) => setSearchParams({...Object.fromEntries(searchParams), page: p.toString()})}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setSearchParams({...Object.fromEntries(searchParams), page: '1'}); }}
            totalItems={deadPersonsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPerson ? translate('edit') : translate('Add New')}
            </DialogTitle>
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
              name="icnumber"
              control={control}
              label={translate("IC No.")}
              required
              errors={errors}
            /> 
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="dateofbirth"
                control={control}
                label={translate("Date of Birth")}
                isDate
              /> 
              <TextInputForm
                name="dateofdeath"
                control={control}
                label={translate("Date of Birth")}
                isDate
              /> 
            </div>
            <TextInputForm
              name="causeofdeath"
              control={control}
              label={translate("Cause of Death")}
              required
              errors={errors}
            />
            <SelectForm
              name="grave"
              control={control}
              label={translate("Grave")}
              placeholder={translate("Select Grave")}
              options={gravesList.items.map(grave => ({
                  value: grave.id,
                  label: grave.name,
              }))}
              required
              errors={errors}
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
              type="button" variant="outline" 
              className="w-full" 
              onClick={() => navigator.geolocation.getCurrentPosition((pos) => { 
                setValue('latitude', pos.coords.latitude.toFixed(16)); 
                setValue('longitude', pos.coords.longitude.toFixed(16)); 
              })}>
              <MapPin className="w-4 h-4 mr-2" /> {translate('Get Current Location')}
            </Button>
            <TextInputForm 
              name="biography" 
              control={control} 
              label={translate("Biography")} 
              required 
              errors={errors} 
            />
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              required
              errors={errors}
              bucketName="dead-person"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createDeadPerson.isPending || updateDeadPerson.isPending || isSubmitting} 
                className="bg-blue-600 text-white">
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
        title={translate('delete')} 
        description={`Padam rekod "${personToDelete?.name}"?`} 
        onConfirm={confirmDelete} 
        variant="destructive" 
      />
      <QRCodeDialog 
        open={qrDialogOpen} 
        onOpenChange={setQRDialogOpen} 
        data={qrPerson} 
      />
    </div>
  );
}