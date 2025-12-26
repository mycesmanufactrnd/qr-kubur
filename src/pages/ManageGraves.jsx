import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Edit, Trash2, Search, Filter, X, Save, Upload, Download } from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { showSuccess, showError, showInfo, showWarning, showApiError, showApiSuccess, showUniqueError } from '../components/ToastrNotification';
import { usePermissions } from '../components/PermissionsContext';

const STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

const emptyGrave = {
  cemetery_name: '',
  state: '',
  block: '',
  lot: '',
  gps_lat: '',
  gps_lng: '',
  organisation_id: '',
  qr_code: '',
  status: 'active',
  total_graves: 0
};

export default function ManageGraves() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [formData, setFormData] = useState(emptyGrave);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graveToDelete, setGraveToDelete] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState('ms');

  const queryClient = useQueryClient();
  const t = (key) => getAdminTranslation(key, lang);

  React.useEffect(() => {
    loadUser();
    setLang(getCurrentLanguage());
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
  const hasViewPermission = hasPermission('graves_view');
  const hasCreatePermission = hasPermission('graves_create');
  const hasEditPermission = hasPermission('graves_edit');
  const hasDeletePermission = hasPermission('graves_delete');

  // Calculate skip for pagination
  const skip = (page - 1) * itemsPerPage;

  // Build filter query
  const buildFilterQuery = () => {
    const query = {};
    
    // State filter (for non-superadmin)
    if (!isSuperAdmin && currentUser?.state?.length > 0) {
      query.state = { $in: currentUser.state };
    } else if (isSuperAdmin && filterState !== 'all') {
      query.state = filterState;
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      query.status = filterStatus;
    }

    return query;
  };

  // Fetch total count for pagination
  const { data: allGraves = [] } = useQuery({
    queryKey: ['admin-graves-all', filterState, filterStatus, currentUser?.state],
    queryFn: () => base44.entities.Grave.filter(buildFilterQuery()),
    enabled: hasViewPermission && !!currentUser
  });

  // Fetch paginated data
  const { data: graves = [], isLoading } = useQuery({
    queryKey: ['admin-graves-paginated', page, itemsPerPage, filterState, filterStatus, currentUser?.state],
    queryFn: () => base44.entities.Grave.filter(buildFilterQuery(), '-created_date', itemsPerPage, skip),
    enabled: hasViewPermission && !!currentUser
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Grave.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setFormData(emptyGrave);
      showApiSuccess('create');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Grave.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      setIsDialogOpen(false);
      setEditingGrave(null);
      setFormData(emptyGrave);
      showApiSuccess('update');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Grave.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-graves']);
      showApiSuccess('delete');
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
          <p className="text-gray-600">{t('noPermission')}</p>
        </CardContent>
      </Card>
    );
  }

  // Client-side filtering for search, block, lot (applied to server-paginated results)
  const clientFilteredGraves = graves.filter(grave => {
    const matchesSearch = !searchQuery || 
      grave.cemetery_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.block?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.lot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${grave.block} ${grave.lot}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.qr_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBlock = !filterBlock || grave.block?.toLowerCase().includes(filterBlock.toLowerCase());
    const matchesLot = !filterLot || grave.lot?.toLowerCase().includes(filterLot.toLowerCase());
    
    return matchesSearch && matchesBlock && matchesLot;
  });

  // For total count, also apply client-side filters to allGraves
  const totalFilteredGraves = allGraves.filter(grave => {
    const matchesSearch = !searchQuery || 
      grave.cemetery_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.block?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.lot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${grave.block} ${grave.lot}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grave.qr_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBlock = !filterBlock || grave.block?.toLowerCase().includes(filterBlock.toLowerCase());
    const matchesLot = !filterLot || grave.lot?.toLowerCase().includes(filterLot.toLowerCase());
    
    return matchesSearch && matchesBlock && matchesLot;
  });

  const paginatedGraves = clientFilteredGraves;
  const totalPages = Math.ceil(totalFilteredGraves.length / itemsPerPage);

  const openAddDialog = () => {
    setEditingGrave(null);
    setFormData(emptyGrave);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grave) => {
    setEditingGrave(grave);
    setFormData({
      cemetery_name: grave.cemetery_name || '',
      state: grave.state || '',
      block: grave.block || '',
      lot: grave.lot || '',
      gps_lat: grave.gps_lat || '',
      gps_lng: grave.gps_lng || '',
      organisation_id: grave.organisation_id || '',
      qr_code: grave.qr_code || '',
      status: grave.status || 'active',
      total_graves: grave.total_graves || 0
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation - Required fields
    if (!formData.cemetery_name?.trim()) {
      showError('Sila masukkan nama tanah perkuburan', 'Medan Diperlukan');
      return;
    }
    
    if (!formData.state) {
      showError('Sila pilih negeri', 'Medan Diperlukan');
      return;
    }

    // Additional validation
    if (formData.gps_lat && (isNaN(formData.gps_lat) || formData.gps_lat < -90 || formData.gps_lat > 90)) {
      showError('GPS Latitude mesti antara -90 hingga 90', 'Nilai Tidak Sah');
      return;
    }
    if (formData.gps_lng && (isNaN(formData.gps_lng) || formData.gps_lng < -180 || formData.gps_lng > 180)) {
      showError('GPS Longitude mesti antara -180 hingga 180', 'Nilai Tidak Sah');
      return;
    }
    if (formData.total_graves && (isNaN(formData.total_graves) || formData.total_graves < 0)) {
      showError('Jumlah kubur mesti nombor positif', 'Nilai Tidak Sah');
      return;
    }
    
    // Check QR code uniqueness (check against all graves, not just current page)
    if (formData.qr_code) {
      const qrExists = allGraves.some(g => 
        g.qr_code === formData.qr_code && g.id !== editingGrave?.id
      );
      if (qrExists) {
        showUniqueError('Kod QR', formData.qr_code);
        return;
      }
    }
    
    try {
      const data = {
        ...formData,
        gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
        gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
        total_graves: parseInt(formData.total_graves) || 0
      };

      if (editingGrave) {
        updateMutation.mutate({ id: editingGrave.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      showApiError(error);
    }
  };

  const handleDelete = (grave) => {
    setGraveToDelete(grave);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!graveToDelete) return;
    deleteMutation.mutate(graveToDelete.id);
    setDeleteDialogOpen(false);
    setGraveToDelete(null);
  };

  const downloadTemplate = () => {
    try {
      // Get fields from the first grave as reference, or use default fields
      const sampleGrave = allGraves[0] || graves[0];
      const fields = sampleGrave 
        ? Object.keys(sampleGrave).filter(key => !['id', 'created_date', 'updated_date', 'created_by'].includes(key))
        : ['cemetery_name', 'state', 'block', 'lot', 'gps_lat', 'gps_lng', 'organisation_id', 'qr_code', 'status', 'total_graves'];
      
      const headers = fields.join(',');
      const exampleRow = '\nMasjid Al-Falah,Selangor,A,101,3.1390,101.6869,,QRK-001,active,100';
      const csvContent = headers + exampleRow;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grave_template.csv';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      showSuccess('Template CSV berjaya dimuat turun');
    } catch (error) {
      console.error('Download error:', error);
      showError('Gagal memuat turun template: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      showInfo('Fail CSV dipilih: ' + file.name);
    } else {
      showError('Sila pilih fail CSV yang sah');
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      showError('Sila pilih fail CSV');
      return;
    }

    setUploading(true);
    showInfo('Sedang memuat naik dan memproses fail...');
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: csvFile });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            graves: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cemetery_name: { type: 'string' },
                  state: { type: 'string' },
                  block: { type: 'string' },
                  lot: { type: 'string' },
                  gps_lat: { type: 'number' },
                  gps_lng: { type: 'number' },
                  organisation_id: { type: 'string' },
                  qr_code: { type: 'string' },
                  status: { type: 'string' },
                  total_graves: { type: 'number' }
                },
                required: ['cemetery_name', 'state']
              }
            }
          }
        }
      });

      if (result.status === 'success' && result.output?.graves) {
        const gravesData = result.output.graves.map(item => ({
          cemetery_name: item.cemetery_name,
          state: item.state,
          block: item.block || '',
          lot: item.lot || '',
          gps_lat: item.gps_lat || null,
          gps_lng: item.gps_lng || null,
          organisation_id: item.organisation_id || '',
          qr_code: item.qr_code || '',
          status: item.status || 'active',
          total_graves: item.total_graves || 0
        }));

        await base44.entities.Grave.bulkCreate(gravesData);
        queryClient.invalidateQueries(['admin-graves']);
        showSuccess(`${gravesData.length} kubur berjaya diimport`, 'Import Berjaya');
        setImportDialogOpen(false);
        setCsvFile(null);
      } else {
        showError(result.details || 'Gagal memproses fail CSV');
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: t('adminDashboard'), page: 'AdminDashboard' },
        { label: t('manageGravesTitle'), page: 'ManageGraves' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t('manageGravesTitle')}
          </h1>
        </div>
        <div className="flex gap-2">
          {hasCreatePermission && (
            <>
              <Button 
                onClick={() => setImportDialogOpen(true)} 
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('importCSV')}
              </Button>
              <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800">
                <Plus className="w-4 h-4 mr-2" />
                {t('addGrave')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('searchGravesPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters Row */}
          <div className={`grid gap-3 ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {isSuperAdmin && (
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue placeholder="Negeri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStates')}</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="full">{t('full')}</SelectItem>
                <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder={t('block') + '...'}
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
            />
            
            <Input
              placeholder={t('lot') + '...'}
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
            />
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterState('all');
                setFilterStatus('all');
                setFilterBlock('');
                setFilterLot('');
              }}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              {t('reset')}
            </Button>
          </div>
          
          {/* Active Filters Display */}
          {(searchQuery || (isSuperAdmin && filterState !== 'all') || filterStatus !== 'all' || filterBlock || filterLot) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-500">{t('activeFilters')}:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  {t('search')}: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {isSuperAdmin && filterState !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('state')}: {filterState}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterState('all')} />
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('status')}: {filterStatus === 'active' ? t('active') : filterStatus === 'full' ? t('full') : t('maintenance')}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                </Badge>
              )}
              {filterBlock && (
                <Badge variant="secondary" className="gap-1">
                  {t('block')}: {filterBlock}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterBlock('')} />
                </Badge>
              )}
              {filterLot && (
                <Badge variant="secondary" className="gap-1">
                  {t('lot')}: {filterLot}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterLot('')} />
                </Badge>
              )}
            </div>
          )}
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
        ) : paginatedGraves.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          paginatedGraves.map(grave => (
            <Card key={grave.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{grave.cemetery_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{grave.state}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {grave.block && `${t('block')} ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `${t('lot')} ${grave.lot}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {hasEditPermission && (
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasDeletePermission && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)} className="h-8 w-8 p-0">
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
            totalItems={totalFilteredGraves.length}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cemeteryName')}</TableHead>
                <TableHead>{t('state')}</TableHead>
                <TableHead>{t('block')}/{t('lot')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{t('loading')}</TableCell>
                </TableRow>
              ) : paginatedGraves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{t('noRecords')}</TableCell>
                </TableRow>
              ) : (
                paginatedGraves.map(grave => (
                  <TableRow key={grave.id}>
                    <TableCell className="font-medium">{grave.cemetery_name}</TableCell>
                    <TableCell>{grave.state}</TableCell>
                    <TableCell>
                      {grave.block && `${t('block')} ${grave.block}`}
                      {grave.block && grave.lot && ', '}
                      {grave.lot && `${t('lot')} ${grave.lot}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        grave.status === 'active' ? 'default' : 
                        grave.status === 'full' ? 'destructive' : 'secondary'
                      }>
                        {grave.status === 'active' ? t('active') : 
                         grave.status === 'full' ? t('full') : t('maintenance')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasEditPermission && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(grave)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasDeletePermission && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(grave)}>
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
            totalItems={totalFilteredGraves.length}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingGrave ? t('editGrave') : t('addGrave')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('cemeteryName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.cemetery_name}
                onChange={(e) => setFormData({...formData, cemetery_name: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('state')} <span className="text-red-500">*</span></Label>
              <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('state')} />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('block')}</Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                />
              </div>
              <div>
                <Label>{t('lot')}</Label>
                <Input
                  value={formData.lot}
                  onChange={(e) => setFormData({...formData, lot: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('gpsLat')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lat}
                  onChange={(e) => setFormData({...formData, gps_lat: e.target.value})}
                  placeholder="3.1390"
                />
              </div>
              <div>
                <Label>{t('gpsLng')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.gps_lng}
                  onChange={(e) => setFormData({...formData, gps_lng: e.target.value})}
                  placeholder="101.6869"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  showInfo('Mendapatkan lokasi...');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setFormData({
                        ...formData,
                        gps_lat: position.coords.latitude.toFixed(8),
                        gps_lng: position.coords.longitude.toFixed(8)
                      });
                      showSuccess('Lokasi berjaya diperolehi');
                    },
                    (error) => {
                      showError('Tidak dapat mendapatkan lokasi. Sila aktifkan GPS.');
                    },
                    { enableHighAccuracy: true }
                  );
                } else {
                  showError('GPS tidak disokong oleh pelayar ini');
                }
              }}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {t('getCurrentLocation')}
            </Button>
            <div>
              <Label>{t('managingOrg')}</Label>
              <Select value={formData.organisation_id} onValueChange={(v) => setFormData({...formData, organisation_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('managingOrg')} />
                </SelectTrigger>
                <SelectContent>
                  {organisations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('qrCode')}</Label>
                <Input
                  value={formData.qr_code}
                  onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                  placeholder="QRK-001"
                />
              </div>
              <div>
                <Label>{t('totalGravesCount')}</Label>
                <Input
                  type="number"
                  value={formData.total_graves}
                  onChange={(e) => setFormData({...formData, total_graves: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>{t('status')}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="full">{t('full')}</SelectItem>
                  <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                </SelectContent>
              </Select>
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
        title={t('delete') + ' ' + t('manageGravesTitle')}
        description={`${t('delete')} "${graveToDelete?.cemetery_name}"?`}
        onConfirm={confirmDelete}
        confirmText={t('delete')}
        variant="destructive"
      />

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('importCSV')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Download Template Button */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {t('downloadTemplate')}
              </p>
              <Button 
                onClick={downloadTemplate} 
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('downloadTemplate')}
              </Button>
            </div>

            {/* File Upload */}
            <div>
              <Label className="dark:text-gray-200">{t('importCSV')}</Label>
              <div className="mt-2">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('csv-upload').click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-emerald-500');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-emerald-500');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-emerald-500');
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'text/csv') {
                      setCsvFile(file);
                      showInfo('Fail CSV dipilih: ' + file.name);
                    } else {
                      showError('Sila pilih fail CSV yang sah');
                    }
                  }}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {csvFile ? csvFile.name : 'Klik untuk pilih atau seret fail ke sini'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Format: CSV sahaja
                  </p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setImportDialogOpen(false);
                setCsvFile(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleCSVUpload}
              disabled={!csvFile || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? t('loading') : t('importCSV')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}