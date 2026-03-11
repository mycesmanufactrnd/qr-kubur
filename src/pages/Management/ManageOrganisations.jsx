import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { translate } from '@/utils/translations';
import { Building2, Plus, Edit, Trash2, Search, X, Save, CreditCard, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PaymentConfigDialog from '@/components/PaymentConfigDialog';
import { getLabelFromId } from '@/utils/helpers';
import { ActiveInactiveStatus, STATES_MY } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';
import { useGetOrganisationTypePaginated } from '@/hooks/useOrganisationTypeMutations';
import { useGetOrganisationPaginated, useOrganisationMutations } from '@/hooks/useOrganisationMutations';
import { defaultOrganisationField } from '@/utils/defaultformfields';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import FileUploadForm from '@/components/forms/FileUploadForm';
import { showError, showSuccess } from '@/components/ToastrNotification';
import { useGetConfigByEntity, useUpsertConfigByEntity } from '@/hooks/usePaymentConfigMutations';

export default function ManageOrganisations() {
  const { 
    currentUser,
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlName = searchParams.get('search') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlState = searchParams.get('state') || 'all';

  const [tempName, setTempName] = useState(urlName);
  const [tempType, setTempType] = useState(urlType);
  const [tempState, setTempState] = useState(urlState);

  useEffect(() => {
    setTempName(urlName);
    setTempType(urlType);
    setTempState(urlState);
  }, [urlName, urlType, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedOrgForPayment, setSelectedOrgForPayment] = useState(null);
  const [serviceEntries, setServiceEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPaymentPlatforms, setSelectedPaymentPlatforms] = useState([]);
  const [paymentConfigValues, setPaymentConfigValues] = useState({});
  const [paymentUploadingFiles, setPaymentUploadingFiles] = useState({});
  const [paymentPreviewUrls, setPaymentPreviewUrls] = useState({});

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting} } = useForm({
    defaultValues: defaultOrganisationField
  });

  const {
    loading: permissionsLoading,
    canView, canCreate, canEdit, canDelete
  } = useCrudPermissions('organisations');

  const isGraveServicesChecked = watch("isgraveservices");
  const isPaymentUploading = Object.values(paymentUploadingFiles).some(Boolean);

  const tableColSpan = (canEdit || canDelete) ? 5 : 4;

  const syncServiceDraftToForm = (entries) => {
    const normalized = [];
    const seen = new Set();

    for (const entry of entries) {
      const service = (entry.service || '').trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalized.push({
        service,
        price: entry.price === '' ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const serviceoffered = normalized.map((item) => item.service);
    const serviceprice = Object.fromEntries(
      normalized.map((item) => [item.service, Number(item.price) || 0])
    );

    setValue('serviceoffered', serviceoffered);
    setValue('serviceprice', serviceprice);
  };

  const addServiceEntry = () => {
    const nextEntries = [...serviceEntries, { id: `${Date.now()}-${Math.random()}`, service: '', price: '' }];
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const updateServiceEntry = (entryId, field, fieldValue) => {
    const nextEntries = serviceEntries.map((entry) =>
      entry.id === entryId ? { ...entry, [field]: fieldValue } : entry
    );
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const removeServiceEntry = (entryId) => {
    const nextEntries = serviceEntries.filter((entry) => entry.id !== entryId);
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const togglePaymentPlatform = (platformCode) => {
    setSelectedPaymentPlatforms((prev) => {
      if (prev.includes(platformCode)) {
        return prev.filter((p) => p !== platformCode);
      }
      return [...prev, platformCode];
    });
  };

  const handlePaymentFileUpload = async (platformCode, fieldKey, fieldType, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/bucket-organisation-config', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }

      const data = await res.json();

      setPaymentConfigValues((prev) => ({ ...prev, [uploadKey]: data.file_url }));
      setPaymentPreviewUrls((prev) => ({ ...prev, [uploadKey]: URL.createObjectURL(file) }));
      showSuccess('Photo uploaded');
    } catch (err) {
      console.error("Fetch error:", err);
      showError('Failed To Upload File');
    } finally {
      setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const validatePaymentConfig = () => {
    for (const platformCode of selectedPaymentPlatforms) {
      const fields = paymentFields.filter(
        (field) => field.platformCode === platformCode && field.required
      );
      for (const field of fields) {
        const value = paymentConfigValues[`${platformCode}_${field.key}`];
        if (!value || value.trim() === '') {
          const platformName =
            paymentPlatforms.find((p) => p?.code === platformCode)?.name || 'platform';
          showError(`${field.label || field.key} is required for ${platformName}`);
          return false;
        }
      }
    }
    return true;
  };

  const buildPaymentConfigPayload = (organisationId) => {
    const configs = selectedPaymentPlatforms.flatMap((platformCode) => {
      const fields = paymentFields.filter((field) => field.platformCode === platformCode);
      return fields
        .map((field) => {
          const value = paymentConfigValues[`${platformCode}_${field.key}`];
          if (value) {
            return {
              paymentPlatformId: field.platformId,
              paymentFieldId: field.id,
              value,
            };
          }
          return null;
        })
        .filter(Boolean);
    });
    return { organisationId, configs };
  };

  const renderPaymentField = (platform, field) => {
    const fieldId = `${platform.code}_${field.key}`;
    const value = paymentConfigValues[fieldId] || '';
    const isUploading = paymentUploadingFiles[fieldId];

    switch (field.fieldtype) {
      case 'image': {
        const previewSrc = paymentPreviewUrls[fieldId] || value;
        return (
          <div>
            <Label>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handlePaymentFileUpload(platform.code, field.key, field.fieldtype, file);
                }}
                disabled={isUploading}
              />
              {isUploading && <span className="text-sm text-gray-500">{translate('Uploading...')}</span>}
            </div>
            {previewSrc && (
              <img src={previewSrc} alt="Preview" className="mt-2 h-20 rounded border" />
            )}
          </div>
        );
      }
      case 'textarea':
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({ ...prev, [fieldId]: e.target.value }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
      case 'url':
      case 'text':
      case 'password':
      default:
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.fieldtype === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({ ...prev, [fieldId]: e.target.value }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };
  
  const {
    organisationsList,
    totalPages,
    isLoading,
  } = useGetOrganisationPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterType: urlType === 'all' ? undefined : Number(urlType),
    filterState: urlState === 'all' ? undefined : urlState
  });

  const { organisationTypeList = [] } = useGetOrganisationTypePaginated({});
  const { createOrganisation, updateOrganisation, deleteOrganisation } = useOrganisationMutations();
  const paymentConfigMutation = useUpsertConfigByEntity();

  const restrictedOrgTypeNames = new Set([
    'Syarikat Swasta',
    'Persatuan Sukarelawan',
    'Pertubuhan Kebajikan (NGO)',
  ]);

  const currentOrgType = currentUser?.organisation?.organisationtype ?? null;
  const isRestrictedOrgType = !!currentOrgType?.name && restrictedOrgTypeNames.has(currentOrgType.name);

  const baseOrganisationTypeOptions = organisationTypeList.items.length > 0
    ? organisationTypeList.items.map((type) => ({
        value: type.id,
        label: type.name,
      }))
    : currentOrgType?.id
      ? [{ value: currentOrgType.id, label: currentOrgType.name || String(currentOrgType.id) }]
      : [];

  const organisationTypeOptions = isSuperAdmin
    ? organisationTypeList.items.map((type) => ({
        value: type.id,
        label: type.name,
      }))
    : isRestrictedOrgType
      ? baseOrganisationTypeOptions.filter((opt) => opt.value === currentOrgType?.id)
      : baseOrganisationTypeOptions;

  const { data: paymentPlatforms = [] } = trpc.paymentPlatform.getActivePlatform.useQuery(
    undefined,
    { enabled: hasAdminAccess && isDialogOpen }
  );

  const paymentFields = paymentPlatforms.flatMap((platform) =>
    (platform.paymentfields ?? []).map((field) => ({
      ...field,
      platformCode: platform.code,
      platformName: platform.name,
      platformId: platform.id,
    }))
  );

  const { data: existingPaymentConfigs = [] } = useGetConfigByEntity({
    entityId: editingOrg?.id ?? 0,
    entityType: 'organisation',
    enabled: !!editingOrg?.id && isDialogOpen,
  });

  const resetPaymentConfig = () => {
    Object.values(paymentPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    setSelectedPaymentPlatforms([]);
    setPaymentConfigValues({});
    setPaymentUploadingFiles({});
    setPaymentPreviewUrls({});
  };

  useEffect(() => {
    if (!isDialogOpen) {
      resetPaymentConfig();
      return;
    }

    if (!editingOrg?.id) {
      resetPaymentConfig();
      return;
    }

    if (!existingPaymentConfigs.length) {
      setSelectedPaymentPlatforms([]);
      setPaymentConfigValues({});
      return;
    }

    const loadConfigs = async () => {
      const values = {};
      const previews = {};
      const platformSet = new Set();

      for (const config of existingPaymentConfigs) {
        const platformCode = config.paymentplatform?.code;
        const fieldKey = config.paymentfield?.key;
        const fieldType = config.paymentfield?.fieldtype;
        const configValue = config.value;

        if (platformCode && fieldKey && configValue) {
          platformSet.add(platformCode);
          values[`${platformCode}_${fieldKey}`] = configValue;

          if (fieldType === "image") {
            try {
              const res = await fetch(`/api/file/bucket-organisation-config/${encodeURIComponent(configValue)}`);
              if (!res.ok) {
                continue;
              }
              const blob = await res.blob();
              previews[`${platformCode}_${fieldKey}`] = URL.createObjectURL(blob);
            } catch (error) {
              console.error('Error fetching file preview:', error);
            }
          }
        }
      }

      setSelectedPaymentPlatforms(Array.from(platformSet));
      setPaymentConfigValues(values);
      setPaymentPreviewUrls(previews);
    };

    loadConfigs();
  }, [isDialogOpen, editingOrg?.id, existingPaymentConfigs]);

  useEffect(() => {
    return () => {
      Object.values(paymentPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [paymentPreviewUrls]);

  const handleSearch = () => {
    const params = { page: '1', search: '', type: '', state: '' };
    if (tempName) params.search = tempName;
    if (tempType !== 'all') params.type = tempType;
    if (tempState !== 'all') params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
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

  const openAddDialog = () => {
    setEditingOrg(null);
    const defaultState = isSuperAdmin ? '' : (currentUserStates[0] || '');
    const defaultOrgType = !isSuperAdmin && isRestrictedOrgType && currentOrgType?.id
      ? currentOrgType.id.toString()
      : '';
    reset({...defaultOrganisationField, states: defaultState, organisationtype: defaultOrgType});
    setServiceEntries([]);
    resetPaymentConfig();
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);
    resetPaymentConfig();

    const relationalServices = Array.isArray(org.services) ? org.services : [];
    const serviceoffered = relationalServices.length > 0
      ? relationalServices.map(service => service.service)
      : (org.serviceoffered || []);
    const serviceprice = relationalServices.length > 0
      ? Object.fromEntries(
          relationalServices.map(service => [
            service.service,
            service.price ? parseFloat(Number(service.price).toFixed(2)) : 0
          ])
        )
      : (org.serviceprice || {});

    reset({
      ...org,
      parentorganisation: org.parentorganisation?.id.toString() || '',
      organisationtype: org.organisationtype?.id.toString() || '',
      serviceoffered,
      serviceprice,
      states: Array.isArray(org.states) ? org.states[0] : org.states || '',
      status: org.status || ActiveInactiveStatus.ACTIVE
    });

    const nextEntries = serviceoffered.map((service, index) => ({
      id: `${Date.now()}-${index}`,
      service,
      price: (serviceprice[service] ?? 0).toString(),
    }));

    setServiceEntries(nextEntries);
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    if (!validatePaymentConfig()) return;

    const normalizedServices = [];
    const seen = new Set();

    for (const entry of serviceEntries) {
      const service = (entry.service || '').trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalizedServices.push({
        service,
        price: entry.price === '' ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const { serviceoffered: _serviceoffered, serviceprice: _serviceprice, ...restFormData } = formData;

    const submitData = {
      ...restFormData,
      parentorganisation: formData.parentorganisation ? { id: Number(formData.parentorganisation) } : null,
      organisationtype: formData.organisationtype ? { id: Number(formData.organisationtype) } : null,
      states: Array.isArray(formData.states) ? formData.states : [formData.states],
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      services: normalizedServices.map((serviceItem) => ({
        service: serviceItem.service,
        price: Number(serviceItem.price) || 0,
        organisation: editingOrg ? { id: Number(editingOrg.id) } : null,
        tahfizcenter: null,
      })),
    };

    try {
      const res = editingOrg
        ? await updateOrganisation.mutateAsync({ id: editingOrg.id, data: submitData })
        : await createOrganisation.mutateAsync(submitData);

      const organisationId = editingOrg?.id ?? res?.id;
      const shouldUpsertPaymentConfig =
        organisationId &&
        (isSuperAdmin || currentUser?.organisation?.id === organisationId) &&
        (selectedPaymentPlatforms.length > 0 || existingPaymentConfigs.length > 0);

      if (shouldUpsertPaymentConfig) {
        const payload = buildPaymentConfigPayload(Number(organisationId));
        await paymentConfigMutation.mutateAsync(payload);
      }

      if (res || editingOrg) {
        setIsDialogOpen(false);
        reset(defaultOrganisationField);
        resetPaymentConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = () => {
    if (!orgToDelete) return;
    deleteOrganisation.mutate(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent/>;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent/>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin 
            ? translate('Super Admin Dashboard') 
            : translate('Admin Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard' },
        { label: translate('Manage Organisations'), page: 'ManageOrganisations' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-violet-600" />
          {translate('Manage Organisations')}
        </h1>
        { canCreate && (
          <Button onClick={openAddDialog} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add New')}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('Search Organisation Name')}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={String(tempType)} onValueChange={setTempType}>
              <SelectTrigger><SelectValue placeholder={translate('Organisation Type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All Types')}</SelectItem>
                {organisationTypeList.items.map(type => (
                  <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tempState} onValueChange={setTempState}>
              <SelectTrigger><SelectValue placeholder={translate('State')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('All States')}</SelectItem>
                {(isSuperAdmin ? STATES_MY : STATES_MY.filter(s => currentUserStates.includes(s))).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <TableHead>{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Organisation Type')}</TableHead>
                <TableHead className="text-center">{translate('State')}</TableHead>
                <TableHead className="text-center">{translate('Services')}</TableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">{translate('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={tableColSpan}/>
              ) : organisationsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={tableColSpan}/>
              ) : (
                organisationsList.items.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {getLabelFromId(organisationTypeList.items, org.organisationtype?.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {Array.isArray(org.states) ? org.states.join(', ') : org.states}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center items-center gap-1">
                        {org.serviceoffered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-center">
                        { canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(org)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                setSelectedOrgForPayment(org);
                                setPaymentConfigOpen(true);
                              }}>
                              <CreditCard className="w-4 h-4 text-green-600" />
                            </Button>
                          </>
                        )}
                        { canDelete && (
                          <Button variant="ghost" size="sm"
                            onClick={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        ) }
                      </TableCell>
                    )}
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
            totalItems={organisationsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? translate('Edit') : translate('Add New')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> 
            <h3 className="text-sm font-medium text-gray-700 border-b py-2">
              {translate('Organsiation Details')}
            </h3>           
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            />   
            <div className="grid grid-cols-2 gap-4">
              <SelectForm
                name="organisationtype"
                control={control}
                placeholder={translate("Select organisation type")}
                label={translate("Organisation Type")}
                options={organisationTypeOptions}
                disabled={!isSuperAdmin && isRestrictedOrgType}
                required
                errors={errors}
              />
              <SelectForm
                name="parentorganisation"
                control={control}
                placeholder={translate("Select parent organisation")}
                label={translate("Parent Organisation")}
                options={Object.values(organisationsList.items).map((org) => ({
                  value: org.id,
                  label: org.name,
                }))}
              />
            </div>
            <SelectForm
              name="states"
              control={control}
              label={translate("State")}
              placeholder={translate("Select states")}
              options={isSuperAdmin ? STATES_MY : currentUserStates || []}
              required
              errors={errors}
            />
            <CheckboxForm
              name="isgraveservices"
              control={control}
              label={translate("Grave Services")}
              disabled={serviceEntries.length > 0}
            />
            {isGraveServicesChecked && (
              <div>
                <Label>{translate('Services')}</Label>
                <div className="space-y-3 mt-2">
                  {serviceEntries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-7"
                        placeholder={translate('Service Name')}
                        value={entry.service}
                        onChange={(e) => updateServiceEntry(entry.id, 'service', e.target.value)}
                      />
                      <Input
                        className="col-span-4"
                        type="number"
                        step="0.01"
                        placeholder="RM 0.00"
                        value={entry.price}
                        onChange={(e) => updateServiceEntry(entry.id, 'price', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white hover:text-white flex items-center justify-center rounded-md"
                        onClick={() => removeServiceEntry(entry.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addServiceEntry}>
                    <Plus className="w-4 h-4 mr-2" />
                    {translate('Add Service')}
                  </Button>
                </div>
              </div>
            )}
            <TextInputForm
              name="address"
              control={control}
              label={translate("Address")}
              isTextArea
            />   
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              bucketName="bucket-organisation"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInputForm
                name="phone"
                control={control}
                label={translate("Phone No.")}
                isPhone
              />   
              <TextInputForm
                name="email"
                control={control}
                label={translate("Email")}
                isEmail
              />   
            </div>
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
              type="button" variant="outline" className="w-full" 
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setValue('latitude', pos.coords.latitude.toFixed(16));
                  setValue('longitude', pos.coords.longitude.toFixed(16));
                });
              }}
            >
              <MapPin className="w-4 h-4 mr-2" /> 
              {translate('Get Current Location')}
            </Button>
            <CheckboxForm
              name="canmanagemosque"
              control={control}
              label={translate("Can Manage Mosque")}
            />
            <CheckboxForm
              name="canbedonated"
              control={control}
              label={translate("Can Be Donated")}
            />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b py-2">
                {translate('Payment Config')}
              </h3>
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  {translate('Select Payment Platforms')}
                </Label>
                <div className="grid gap-3">
                  {paymentPlatforms.filter(p => p?.code).map(platform => (
                    <Label
                      key={platform.code}
                      className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedPaymentPlatforms.includes(platform.code)}
                        onCheckedChange={() => togglePaymentPlatform(platform.code)}
                      />
                      <div>
                        <span className="font-medium">{platform.name}</span>
                        <Badge variant="secondary" className="ml-2 capitalize text-xs">
                          {platform.category}
                        </Badge>
                      </div>
                    </Label>
                  ))}
                </div>
              </div>

              {selectedPaymentPlatforms.map(platformCode => {
                const platform = paymentPlatforms.find(p => p?.code === platformCode);
                const fields = paymentFields.filter(f => f?.platformCode === platformCode);

                if (!platform || fields.length === 0) return null;

                return (
                  <div key={platformCode} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      {platform.name} {translate('config')}
                    </h3>
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.id}>
                          {renderPaymentField(platform, field)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <hr />
            <DialogFooter>
              <Button 
                type="button" variant="outline" 
                onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button 
                type="submit" className="bg-violet-600" 
                disabled={
                  createOrganisation.isPending ||
                  updateOrganisation.isPending ||
                  isSubmitting ||
                  uploading ||
                  isPaymentUploading ||
                  paymentConfigMutation.orgMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" /> {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onConfirm={confirmDelete} 
        title={translate('Delete')} 
        description={translate('Confirm delete')} 
        variant="destructive" 
      />
      <PaymentConfigDialog 
        open={paymentConfigOpen} 
        hasAdminAccess={hasAdminAccess} 
        onOpenChange={setPaymentConfigOpen} 
        entityId={selectedOrgForPayment?.id} 
        entityType="organisation" 
      />
    </div>
  );
}
