// src/pages/ManageTahlilRequests.jsx
import { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '../components/Breadcrumb';
import { useCrudPermissions } from '../components/PermissionsContext';
import { SERVICE_LABELS, TahlilStatus } from '@/utils/enums';
import { translate } from '@/utils/translations';
import { useAdminAccess } from '@/utils/auth';
import { useGetTahlilRequestPaginated, useUpdateTahlilRequest } from '@/hooks/useTahlilRequestMutations';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Pagination from '@/components/Pagination';

export default function ManageTahlilRequests() {
  const { loadingUser, isTahfizAdmin, isSuperAdmin, currentUser } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { loading: permissionsLoading, canView } = useCrudPermissions('tahlil');

  const {
    tahlilRequestList = { items: [], total: 0 },
    totalPages = 0,
    isLoading,
    refetch
  } = useGetTahlilRequestPaginated({ page, pageSize: itemsPerPage });

  const updateMutation = useUpdateTahlilRequest();

  const openDetailDialog = (request) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRequest) return;
    await updateMutation.mutateAsync({ id: selectedRequest.id, data: { status: newStatus } });
    setIsDialogOpen(false);
    setSelectedRequest(null);
    refetch(); // Refresh the list
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{translate('pending')}</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('accepted')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('completed')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{translate('rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!isTahfizAdmin && !isSuperAdmin) return <AccessDeniedComponent />;
  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('manageTahlilTitle'), page: 'ManageTahlilRequests' }
      ]} />
      <AccessDeniedComponent/>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('manageTahlilTitle'), page: 'ManageTahlilRequests' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {translate('manageTahlilTitle')}
          </h1>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        {['pending','accepted','completed','rejected'].map((status,i)=>(
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${status==='pending'?'yellow':status==='accepted'?'blue':status==='completed'?'green':'red'}-600`}>
                {tahlilRequestList.items.filter(r => r.status === status).length}
              </p>
              <p className="text-sm text-gray-500">{translate(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('requesterName')}</TableHead>
                <TableHead className="text-center">{translate('deceasedName')}</TableHead>
                <TableHead className="text-center">{translate('serviceType')}</TableHead>
                <TableHead className="text-center">{translate('tahfizCenter')}</TableHead>
                <TableHead className="text-center">{translate('referenceId')}</TableHead>
                <TableHead className="text-center">{translate('status')}</TableHead>
                <TableHead className="text-center">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : tahlilRequestList.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                tahlilRequestList.items.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.requestorname}</TableCell>
                    <TableCell className="text-center">{(request.deceasednames || []).join(', ')}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{(request.selectedservices || []).map(type => SERVICE_LABELS[type] || type).join(', ')}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-center">{request.tahfizcenter?.name}</TableCell>
                    <TableCell className="font-mono text-sm text-center">{request.referenceno || '-'}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(request)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => { setItemsPerPage(value); setPage(1); }}
              totalItems={tahlilRequestList.total}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{translate('details')}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{translate('requesterName')}</p>
                  <p className="font-semibold">{selectedRequest.requestorname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{translate('phoneNumber')}</p>
                  <p className="font-semibold">{selectedRequest.requestorphoneno}</p>
                </div>
              </div>
              {selectedRequest.requestoremail && (
                <div>
                  <p className="text-sm text-gray-500">{translate('email')}</p>
                  <p>{selectedRequest.requestoremail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('deceasedName')}</p>
                <p>{(selectedRequest.deceasednames || []).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('serviceType')}</p>
                <Badge variant="outline">{(selectedRequest.selectedservices || []).map(type => SERVICE_LABELS[type] || type).join(', ')}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('tahfizCenter')}</p>
                <p>{selectedRequest.tahfizcenter?.name}</p>
              </div>
              {selectedRequest.referenceno && (
                <div>
                  <p className="text-sm text-gray-500">{translate('referenceId')}</p>
                  <p className="font-mono font-semibold">{selectedRequest.referenceno}</p>
                </div>
              )}
              {selectedRequest.preferreddate && (
                <div>
                  <p className="text-sm text-gray-500">{translate('preferredDate')}</p>
                  <p>{new Date(selectedRequest.preferreddate).toLocaleDateString('ms-MY')}</p>
                </div>
              )}
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-gray-500">{translate('notes')}</p>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('status')}</p>
                {getStatusBadge(selectedRequest.status)}
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{translate('close')}</Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {translate('reject')}
                </Button>
                <Button 
                  onClick={() => handleStatusChange('accepted')}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {translate('approve')}
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
                {translate('markCompleted')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
