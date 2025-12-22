import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

export default function ManageSuggestions() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        setUser(JSON.parse(appUserAuth));
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  const { data: allSuggestions = [], isLoading } = useQuery({
    queryKey: ['admin-suggestions'],
    queryFn: () => base44.entities.Suggestion.list('-created_date'),
    enabled: !!user
  });

  // Filter suggestions based on user role
  const suggestions = useMemo(() => {
    if (!user) return [];
    
    if (isSuperAdmin) {
      return allSuggestions;
    }

    // Admin filters by their context
    return allSuggestions.filter(s => {
      // Organisation admin - can only see their organisation's suggestions
      if (s.entity_type === 'organisation' && s.organisation_id) {
        return s.organisation_id === user.organisation_id;
      }
      
      // Tahfiz admin - can only see their tahfiz center's suggestions
      if (s.entity_type === 'tahfiz' && s.tahfiz_center_id) {
        // Check if admin manages this tahfiz center (via organisation or direct permission)
        return s.tahfiz_center_id === user.tahfiz_center_id;
      }
      
      // State admin - can only see suggestions for their assigned states
      if ((s.entity_type === 'grave' || s.entity_type === 'person') && s.state_id) {
        const adminStates = user.state || [];
        return adminStates.includes(s.state_id);
      }
      
      return false;
    });
  }, [allSuggestions, user, isSuperAdmin]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Suggestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-suggestions']);
      setIsDialogOpen(false);
      setSelectedSuggestion(null);
      toast.success('Cadangan telah dikemaskini');
    }
  });

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      return filterStatus === 'all' || s.status === filterStatus;
    });
  }, [suggestions, filterStatus]);

  if (loadingUser) {
    return <LoadingUser />;
  }

  const openDetailDialog = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'approved', admin_notes: adminNotes }
    });

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'suggestion_approve',
        function_name: 'ManageSuggestions',
        user_email: user?.email,
        level: 'info',
        summary: `Cadangan diluluskan: ${selectedSuggestion.entity_type}`,
        details: { suggestion_id: selectedSuggestion.id, entity_type: selectedSuggestion.entity_type },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'rejected', admin_notes: adminNotes }
    });

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'suggestion_reject',
        function_name: 'ManageSuggestions',
        user_email: user?.email,
        level: 'warn',
        summary: `Cadangan ditolak: ${selectedSuggestion.entity_type}`,
        details: { suggestion_id: selectedSuggestion.id, entity_type: selectedSuggestion.entity_type },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Diluluskan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      person: 'Rekod Si Mati',
      grave: 'Tanah Perkuburan',
      organisation: 'Organisasi',
      tahfiz: 'Pusat Tahfiz'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Cadangan', page: 'ManageSuggestions' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            Urus Cadangan
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {suggestions.filter(s => s.status === 'pending').length} menunggu semakan
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Menunggu', value: suggestions.filter(s => s.status === 'pending').length, color: 'yellow' },
          { label: 'Diluluskan', value: suggestions.filter(s => s.status === 'approved').length, color: 'green' },
          { label: 'Ditolak', value: suggestions.filter(s => s.status === 'rejected').length, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Diluluskan</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
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
        ) : filteredSuggestions.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tiada cadangan</p>
            </CardContent>
          </Card>
        ) : (
          filteredSuggestions.map(suggestion => (
            <Card key={suggestion.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getEntityTypeLabel(suggestion.entity_type)}
                      </Badge>
                      {getStatusBadge(suggestion.status)}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {suggestion.suggested_changes?.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(suggestion.created_date).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)} className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis</TableHead>
                <TableHead>Cadangan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : filteredSuggestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada cadangan</TableCell>
                </TableRow>
              ) : (
                filteredSuggestions.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getEntityTypeLabel(suggestion.entity_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {suggestion.suggested_changes?.substring(0, 50)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                    <TableCell>
                      {new Date(suggestion.created_date).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Butiran Cadangan</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Jenis Rekod</p>
                <p className="font-semibold">{getEntityTypeLabel(selectedSuggestion.entity_type)}</p>
              </div>
              {selectedSuggestion.entity_id && (
                <div>
                  <p className="text-sm text-gray-500">ID Rekod</p>
                  <p className="font-mono text-sm">{selectedSuggestion.entity_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Cadangan Perubahan</p>
                <div className="p-3 bg-gray-50 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">{selectedSuggestion.suggested_changes}</p>
                </div>
              </div>
              {selectedSuggestion.reason && (
                <div>
                  <p className="text-sm text-gray-500">Sebab / Justifikasi</p>
                  <p>{selectedSuggestion.reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status Semasa</p>
                {getStatusBadge(selectedSuggestion.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Catatan Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambah catatan..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Tutup
            </Button>
            {selectedSuggestion?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Luluskan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}