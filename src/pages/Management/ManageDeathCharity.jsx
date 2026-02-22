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
import { useCrudPermissions } from '@/components/PermissionsContext';
import { STATES_MY } from '@/utils/enums';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetDeathCharityPaginated, useDeathCharityMutations } from '@/hooks/useDeathCharityMutations';
import { defaultDeathCharityField } from '@/utils/defaultformfields';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import { useGetOrganisationPaginated } from '@/hooks/useOrganisationMutations';
import { Switch } from '@/components/ui/switch';
import { useGetMosquesByOrganisationId } from '@/hooks/useMosqueMutations';

export default function ManageDeathCharity() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('name') || '';
  const urlState = searchParams.get('state') || 'all';

  const [tempName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeathCharity, setEditingDeathCharity] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deathCharityToDelete, setDeathCharityToDelete] = useState(null);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('death_charity');

  const { deathCharityList, totalPages, isLoading } = useGetDeathCharityPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName, 
    filterState: urlState === 'all' ? undefined : urlState,
  });
  
  const { createDeathCharity, updateDeathCharity, deleteDeathCharity } = useDeathCharityMutations();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultDeathCharityField,
  });

  const isactive = watch("isactive");
  const organisationId = watch('organisation');

  const { organisationsList } = useGetOrganisationPaginated({});

  const { data: mosqueList = [] } = useGetMosquesByOrganisationId(
    organisationId ? Number(organisationId) : null
  );

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
  }, [urlName, urlState]);

  const handleSearch = () => {
    const params = { page: '1', name: '', state: '' };
    if (tempName) params.name = tempName;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const openAddDialog = () => {
    setEditingDeathCharity(null);
    reset(defaultDeathCharityField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (deathCharity) => {
    setEditingDeathCharity({ ...deathCharity });
    reset({
        ...deathCharity,
        organisation: deathCharity.organisation?.id?.toString() ?? '',
        isselfregister: deathCharity.isselfregister ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const submitData = { 
        ...formData,
        mosqueid: Number(formData.mosqueid) || null,
        registrationfee: Number(formData.registrationfee) || 0,
        yearlyfee: Number(formData.yearlyfee) || 0,
        deathbenefitamount: Number(formData.deathbenefitamount) || 0,
        maxdependents: Number(formData.maxdependents) || 0,
        organisation: formData.organisation ? { id: Number(formData.organisation) } : null,
    };

    try {
      if (editingDeathCharity) {
        await updateDeathCharity.mutateAsync({ id: editingDeathCharity.id, data: submitData });
      } else {
        await createDeathCharity.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!deathCharityToDelete) return;

    try {
      await deleteDeathCharity.mutateAsync(deathCharityToDelete.id);
      setDeleteDialogOpen(false);
      setDeathCharityToDelete(null);
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
          { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
          { label: translate('Manage Death Charity'), page: 'ManageDeathCharity' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Death Charity'), page: 'ManageDeathCharity' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Death Charity')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Death Charity')}
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
                <TableHead>{translate('Death Charity')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Contact Person')}</TableHead>
                <TableHead className="text-center">{translate('Organisation')}</TableHead>
                <TableHead className="text-center">{translate('Active')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : deathCharityList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                deathCharityList.items.map(deathCharity => (
                  <TableRow key={deathCharity.id}>
                    <TableCell className="font-medium">{deathCharity.name}</TableCell>
                    <TableCell className="text-center">{deathCharity.state}</TableCell>
                    <TableCell className="text-center">{deathCharity.contactperson}</TableCell>
                    <TableCell className="text-center">{deathCharity.organisation?.name ?? ''}</TableCell>
                    <TableCell className="text-center">{deathCharity.isactive ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-center">
                        {canEdit && 
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(deathCharity)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        }
                        {canDelete && 
                            <Button variant="ghost" size="sm" onClick={() => { 
                                setDeathCharityToDelete(deathCharity); 
                                setDeleteDialogOpen(true); }}
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        }
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
            totalItems={deathCharityList.total}
          />
        )}
      </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingDeathCharity ? translate('Edit Death Charity') : translate('Add Death Charity')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Organization Details
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <SelectForm
                          name="organisation"
                          control={control}
                          label={translate("Managing Organisation")}
                          placeholder={translate("All managing organisations")}
                          options={organisationsList.items.map(org => ({
                            value: org.id,
                            label: org.name,
                          }))}
                          required
                          errors={errors}
                        />
                        <div className="grid grid-cols-1 gap-4">
                          <SelectForm
                            name="mosqueid"
                            control={control}
                            label={translate("Managing Mosque")}
                            placeholder={translate("Select managing mosque")}
                            options={mosqueList.map(mosque => ({
                              value: mosque.id,
                              label: mosque.name,
                            }))}
                            required
                            errors={errors}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Basic Information
                        </h3>
                        <TextInputForm
                          name="name"
                          control={control}
                          label={translate("Name")}
                          required
                          errors={errors}
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
                        <TextInputForm
                          name="description"
                          control={control}
                          label={translate("Description")}
                          isTextArea
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Contact Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                        <TextInputForm
                          name="contactperson"
                          control={control}
                          label={translate("Contact Person")}
                          required
                          errors={errors}
                        />    
                        <TextInputForm
                          name="contactphone"
                          control={control}
                          label={translate("Contact Phone No.")}
                          required
                          errors={errors}
                        />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Fee Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                        <TextInputForm
                          name="registrationfee"
                          control={control}
                          label={translate("Registration Fee")}
                          isMoney
                          required
                          errors={errors}
                        />    
                        <TextInputForm
                          name="yearlyfee"
                          control={control}
                          label={translate("Yearly Fee")}
                          isMoney
                          required
                          errors={errors}
                        />
                        </div>
                        <TextInputForm
                          name="deathbenefitamount"
                          control={control}
                          label={translate("Death Benefit Amount")}
                          isMoney
                          required
                          errors={errors}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Coverage Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                        <CheckboxForm
                          name="coversspouse"
                          control={control}
                          label={translate("Covers Spouse")}
                        />
                        <CheckboxForm
                          name="coverschildren"
                          control={control}
                          label={translate("Covers Children")}
                        />
                        </div>
                        <TextInputForm
                          name="maxdependents"
                          control={control}
                          label={translate("Max Dependents")}
                          isNumber
                          required
                          errors={errors}
                        />
                        <CheckboxForm
                          name="isselfregister"
                          control={control}
                          label={translate("Allow Self Register")}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                        Status
                        </h3>
                        <div className="flex items-center gap-2">
                        <Switch
                            checked={isactive}
                            onCheckedChange={(v) => setValue('isactive', v)}
                        />
                        <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          {translate('Cancel')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={
                            createDeathCharity.isPending || 
                            updateDeathCharity.isPending ||
                            isSubmitting
                          }
                        >
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
            title={translate('Delete Death Charity')}
            description={`${translate('Delete')} "${deathCharityToDelete?.name ?? ''}"?`}
            onConfirm={confirmDelete}
            confirmText={translate('Delete')}
            variant="destructive"
        />
    </div>
  );
}
