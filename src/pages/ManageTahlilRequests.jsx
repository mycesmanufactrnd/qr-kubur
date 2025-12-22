import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

const SERVICE_LABELS = {
  'tahlil_ringkas': 'Tahlil Ringkas',
  'tahlil_panjang': 'Tahlil Panjang',
  'yasin': 'Bacaan Yasin',
  'doa_arwah': 'Doa Arwah',
  'custom': 'Perkhidmatan Khas'
};

export default function ManageTahlilRequests() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const queryClient = useQueryClient();

  React.useEffect(() => {
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

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-tahlil-requests', user?.tahfiz_center_id],
    queryFn: async () => {
      if (isSuperAdmin) {
        return await base44.entities.TahlilRequest.list('-created_date');
      }
      
      // Tahfiz center admins can only see requests for their center
      if (user?.tahfiz_center_id) {
        const allRequests = await base44.entities.TahlilRequest.list('-created_date');
        return allRequests.filter(r => r.tahfiz_center_id === user.tahfiz_center_id);
      }
      
      return [];
    },
    enabled: !!user
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TahlilRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tahlil-requests']);
      setIsDialogOpen(false);
      setSelectedRequest(null);
      toast.success('Status permohonan telah dikemaskini');
    }
  });

  const filteredRequests = requests.filter(r => {
    return filterStatus === 'all' || r.status === filterStatus;
  });

  const getCenterName = (centerId) => {
    const center = tahfizCenters.find(c => c.id === centerId);
    return center?.name || '-';
  };

  const openDetailDialog = (request) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      data: { status: newStatus }
    });

    // Create notification if requester has email
    if (selectedRequest.requester_email) {
      const statusMessages = {
        accepted: 'Permohonan tahlil anda telah diterima.',
        rejected: 'Permohonan tahlil anda telah ditolak.',
        completed: 'Permohonan tahlil anda telah selesai.'
      };

      try {
        await base44.entities.Notification.create({
          user_email: selectedRequest.requester_email,
          type: 'tahlil_request',
          title: `Permohonan Tahlil ${newStatus === 'accepted' ? 'Diterima' : newStatus === 'rejected' ? 'Ditolak' : 'Selesai'}`,
          message: statusMessages[newStatus],
          related_id: selectedRequest.id,
          status: newStatus
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'tahlil_request_update',
        function_name: 'ManageTahlilRequests',
        user_email: user?.email,
        level: 'info',
        summary: `Permohonan tahlil: ${newStatus}`,
        details: { request_id: selectedRequest.id, status: newStatus, requester: selectedRequest.requester_name },
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
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="w-3 h-3 mr-1" />Diterima</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingUser || isLoading) {
    return <LoadingUser />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Permohonan Tahlil', page: 'ManageTahlilRequests' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Urus Permohonan Tahlil
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {requests.filter(r => r.status === 'pending').length} menunggu tindakan
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Menunggu', value: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Diterima', value: requests.filter(r => r.status === 'accepted').length, color: 'blue' },
          { label: 'Selesai', value: requests.filter(r => r.status === 'completed').length, color: 'green' },
          { label: 'Ditolak', value: requests.filter(r => r.status === 'rejected').length, color: 'red' }
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
              <SelectItem value="accepted">Diterima</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
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
        ) : filteredRequests.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tiada permohonan</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{request.requester_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Arwah: {request.deceased_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCenterName(request.tahfiz_center_id)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {SERVICE_LABELS[request.service_type] || request.service_type}
                      </Badge>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openDetailDialog(request)} className="h-8 w-8 p-0">
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
                <TableHead>Pemohon</TableHead>
                <TableHead>Arwah</TableHead>
                <TableHead>Perkhidmatan</TableHead>
                <TableHead>Pusat Tahfiz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Memuatkan...</TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">Tiada permohonan</TableCell>
                </TableRow>
              ) : (
                filteredRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.requester_name}</TableCell>
                    <TableCell>{request.deceased_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SERVICE_LABELS[request.service_type] || request.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getCenterName(request.tahfiz_center_id)}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(request)}>
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
            <DialogTitle className="dark:text-white">Butiran Permohonan Tahlil</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pemohon</p>
                  <p className="font-semibold">{selectedRequest.requester_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No. Telefon</p>
                  <p className="font-semibold">{selectedRequest.requester_phone}</p>
                </div>
              </div>
              {selectedRequest.requester_email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{selectedRequest.requester_email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Nama Arwah</p>
                <p className="font-semibold">{selectedRequest.deceased_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jenis Perkhidmatan</p>
                <Badge>{SERVICE_LABELS[selectedRequest.service_type] || selectedRequest.service_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pusat Tahfiz</p>
                <p>{getCenterName(selectedRequest.tahfiz_center_id)}</p>
              </div>
              {selectedRequest.preferred_date && (
                <div>
                  <p className="text-sm text-gray-500">Tarikh Pilihan</p>
                  <p>{new Date(selectedRequest.preferred_date).toLocaleDateString('ms-MY')}</p>
                </div>
              )}
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status Semasa</p>
                {getStatusBadge(selectedRequest.status)}
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Tutup
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  onClick={() => handleStatusChange('accepted')}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Terima
                </Button>
              </>
            )}
            {selectedRequest?.status === 'accepted' && (
              <Button 
                onClick={() => handleStatusChange('completed')}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tandakan Selesai
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}