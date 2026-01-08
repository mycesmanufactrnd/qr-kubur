import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit, Trash2, Search, Save, Filter, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm, Controller } from "react-hook-form";
import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { usePermissions } from '../components/PermissionsContext';
import PaymentConfigDialog from '../components/PaymentConfigDialog';
import { translate } from '@/utils/translations';
import { showError, showSuccess } from '@/components/ToastrNotification';

const STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

const SERVICES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang' },
  { value: 'yasin', label: 'Bacaan Yasin' },
  { value: 'doa_arwah', label: 'Doa Arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas' }
];

const emptyCenter = {
  name: '',
  description: '',
  services_offered: [],
  service_prices: {},
  state: '',
  address: '',
  phone: '',
  email: '',
  gps_lat: '',
  gps_lng: ''
};

export default function ManageTahfizCenters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [lang, setLang] = useState('ms');
  
  const { control, handleSubmit: handleFormSubmit, reset, setValue, watch } = useForm({
    defaultValues: emptyCenter
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [selectedCenterForPayment, setSelectedCenterForPayment] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

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

  const { hasPermission } = usePermissions();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const hasViewPermission = hasPermission('tahfiz_view');
  const hasCreatePermission = hasPermission('tahfiz_create');
  const hasEditPermission = hasPermission('tahfiz_edit');
  const hasDeletePermission = hasPermission('tahfiz_delete');

  const skip = (page - 1) * itemsPerPage;

  const buildFilterQuery = () => {
    const query = {};
    if (!isSuperAdmin && currentUser?.state) {
      const userStates = Array.isArray(currentUser.state) ? currentUser.state : [];
      if (userStates.length > 0) {
        query.state = { $in: userStates };
      }
    }
    if (filterState !== 'all') {
      query.state = filterState;
    }
    return query;
  };

  const { data: allCenters = [] } = useQuery({
    queryKey: ['admin-tahfiz-all', filterState, currentUser?.state],
    queryFn: () => base44.entities.TahfizCenter.filter(buildFilterQuery()),
    enabled: hasViewPermission && !!currentUser
  });

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['admin-tahfiz-paginated', page, itemsPerPage, filterState, currentUser?.state],
    queryFn: () => base44.entities.TahfizCenter.filter(buildFilterQuery(), '-created_date', itemsPerPage, skip),
    enabled: hasViewPermission && !!currentUser
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TahfizCenter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      setIsDialogOpen(false);
      setFormData(emptyCenter);
      showSuccess('Tahfiz Center Successfully Created');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TahfizCenter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      setIsDialogOpen(false);
      setEditingCenter(null);
      setFormData(emptyCenter);
      showSuccess('Tahfiz Center Successfully Edited');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TahfizCenter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahfiz']);
      showSuccess('Tahfiz Center Successfully Deleted');
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('adminDashboard'), page: 'AdminDashboard' },
          { label: translate('manageTahfiz'), page: 'ManageTahfizCenters' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{translate('accessDenied')}</h2>
            <p className="text-gray-600">{translate('noPermission')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allFilteredCenters = allCenters.filter(center => {
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredCenters = centers.filter(center => {
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'all' || center.state === filterState;
    return matchesSearch && matchesState;
  });

  const paginatedCenters = filteredCenters;
  const totalPages = Math.ceil(allFilteredCenters.length / itemsPerPage);

  const openAddDialog = () => {
    setEditingCenter(null);
    reset(emptyCenter);
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);
    reset({
      name: center.name || '',
      description: center.description || '',
      services_offered: center.services_offered || [],
      service_prices: center.service_prices || {},
      state: center.state || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      gps_lat: center.gps_lat || '',
      gps_lng: center.gps_lng || ''
    });
    setIsDialogOpen(true);
  };

  const selectedServices = watch('services_offered') || [];

  const toggleService = (serviceValue) => {
    const current = selectedServices;
    if (current.includes(serviceValue)) {
      setValue('services_offered', current.filter(s => s !== serviceValue));
    } else {
      setValue('services_offered', [...current, serviceValue]);
    }
  };

  const onSubmit = (data) => {
    // Validation - Required fields
    if (!data.name?.trim()) {
      showError('Sila masukkan nama pusat tahfiz', 'Medan Diperlukan');
      return;
    }
    if (!data.state) {
      showError('Sila pilih negeri', 'Medan Diperlukan');
      return;
    }
    
    // Additional validation
    if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError('Format email tidak sah', 'Format Tidak Sah');
      return;
    }
    if (data.phone && data.phone.trim() && !/^[0-9\-\+\(\)\s]+$/.test(data.phone)) {
      showError('Format telefon tidak sah', 'Format Tidak Sah');
      return;
    }
    if (data.gps_lat && (isNaN(data.gps_lat) || data.gps_lat < -90 || data.gps_lat > 90)) {
      showError('GPS Latitude mesti antara -90 hingga 90', 'Nilai Tidak Sah');
      return;
    }
    if (data.gps_lng && (isNaN(data.gps_lng) || data.gps_lng < -180 || data.gps_lng > 180)) {
      showError('GPS Longitude mesti antara -180 hingga 180', 'Nilai Tidak Sah');
      return;
    }

    const submitData = {
      ...data,
      gps_lat: data.gps_lat ? parseFloat(data.gps_lat) : null,
      gps_lng: data.gps_lng ? parseFloat(data.gps_lng) : null
    };

    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (center) => {
    setCenterToDelete(center);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!centerToDelete) return;
    deleteMutation.mutate(centerToDelete.id);
    setDeleteDialogOpen(false);
    setCenterToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('manageTahfiz'), page: 'ManageTahfizCenters' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {translate('manageTahfiz')}
          </h1>
        </div>
        {hasCreatePermission && (
          <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800">
            <Plus className="w-4 h-4 mr-2" />
            {translate('addNew')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate('search...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isSuperAdmin && (
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder={translate('allStates')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('allStates')}</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))
        ) : paginatedCenters.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{translate('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          paginatedCenters.map(center => (
            <Card key={center.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{center.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{center.state}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {center.services_offered?.slice(0, 2).map(service => (
                        <Badge key={service} variant="secondary" className="text-xs">
                          {SERVICES.find(s => s.value === service)?.label || service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {hasEditPermission && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)} className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedCenterForPayment(center);
                            setPaymentConfigOpen(true);
                          }} 
                          className="h-8 w-8 p-0"
                          title="Payment Config"
                        >
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </Button>
                      </>
                    )}
                    {hasDeletePermission && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(center)} className="h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            totalItems={allFilteredCenters.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('name')}</TableHead>
                <TableHead>{translate('state')}</TableHead>
                <TableHead>{translate('services')}</TableHead>
                <TableHead className="text-right">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : paginatedCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                paginatedCenters.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.state}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {center.services_offered?.slice(0, 2).map(service => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {SERVICES.find(s => s.value === service)?.label || service}
                          </Badge>
                        ))}
                        {center.services_offered?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{center.services_offered.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasEditPermission && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(center)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedCenterForPayment(center);
                              setPaymentConfigOpen(true);
                            }}
                            title="Payment Config"
                          >
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        </>
                      )}
                      {hasDeletePermission && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(center)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
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
            totalItems={allFilteredCenters.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingCenter ? translate('edit') : translate('addNew')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>{translate('name')} <span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Nama pusat diperlukan' }}
                render={({ field }) => <Input {...field} />}
              />
            </div>
            <div>
              <Label>{translate('state')} <span className="text-red-500">*</span></Label>
              <Controller
                name="state"
                control={control}
                rules={{ required: 'Negeri diperlukan' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={translate('selectStates')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(isSuperAdmin ? STATES : userStates).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>{translate('services')}</Label>
              <div className="space-y-3 mt-2">
                {SERVICES.map(service => (
                  <div key={service.value} className="space-y-2">
                    <Label className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                      <Checkbox
                        checked={selectedServices.includes(service.value)}
                        onCheckedChange={() => toggleService(service.value)}
                      />
                      <span className="flex-1">{service.label}</span>
                    </Label>
                    {selectedServices.includes(service.value) && (
                      <div className="ml-8">
                        <Label className="text-xs text-gray-600"> {translate('price')} (RM) - {translate('option')}</Label>
                        <Controller
                          name={`service_prices.${service.value}`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder= {`${translate('example')}: 50.00`}
                              {...field}
                              onChange={(e) => {
                                const prices = watch('service_prices') || {};
                                setValue('service_prices', {
                                  ...prices,
                                  [service.value]: e.target.value ? parseFloat(e.target.value) : null
                                });
                              }}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>{translate('address')}</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Textarea {...field} />}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('phone')}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div>
                <Label>{translate('email')}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input type="email" {...field} />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{translate('gpsLat')}</Label> 
                <Controller
                  name="gps_lat"
                  control={control}
                  render={({ field }) => <Input type="number" step="any" {...field} />}
                />
              </div>
              <div>
                <Label>{translate('gpsLng')}</Label>
                <Controller
                  name="gps_lng"
                  control={control}
                  render={({ field }) => <Input type="number" step="any" {...field} />}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setValue('gps_lat', position.coords.latitude.toFixed(16));
                      setValue('gps_lng', position.coords.longitude.toFixed(16));
                    },
                    (error) => {
                      showError('Error getting coordinated');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                } else {
                  showError('GPS Not Supported');
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {translate('getCurrentLocation')}
            </Button>
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
        title={translate('delete')}
        description={`${translate('confirmDelete')} "${centerToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('delete')}
        variant="destructive"
      />

      <PaymentConfigDialog
        open={paymentConfigOpen}
        onOpenChange={setPaymentConfigOpen}
        entityId={selectedCenterForPayment?.id}
        entityType="tahfiz"
      />
    </div>
  );
}