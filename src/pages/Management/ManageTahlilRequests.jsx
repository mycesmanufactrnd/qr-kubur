import { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, Video } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { getServiceLabels, TahlilStatus } from '@/utils/enums';
import { translate } from '@/utils/translations';
import { useAdminAccess } from '@/utils/auth';
import { useGetTahlilRequestPaginated, useUpdateTahlilRequest } from '@/hooks/useTahlilRequestMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Pagination from '@/components/Pagination';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import JitsiController from '@/components/jitsi/JitsiController';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/components/ToastrNotification';

export default function ManageTahlilRequests() {
  const navigate = useNavigate();
  const { loadingUser, isTahfizAdmin, isSuperAdmin, currentUser } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLiveDialogOpen, setIsLiveDialogOpen] = useState(false);

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
    setSuggestedDate(
      request?.suggesteddate
        ? new Date(request.suggesteddate).toISOString().slice(0, 10)
        : ''
    );
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRequest) return;

    const payload = { status: newStatus, suggesteddate: '' };

    if (newStatus === TahlilStatus.ACCEPTED) {
      if (!suggestedDate) {
        showError('Suggested date is required when accepting request.');
        return;
      }

      payload.suggesteddate = suggestedDate;
    }

    await updateMutation.mutateAsync({ id: selectedRequest.id, data: payload });
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setSuggestedDate('');
    refetch();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tahlilRequestList.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tahlilRequestList.items.map(r => r.id));
    }
  };

  const joinRoom = (liveRoom) => {
    if (!liveRoom) return;

    navigate(createPageUrl('JitsiRoom') + `?room=${liveRoom}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case TahlilStatus.PENDING:
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />{translate('Pending')}
          </Badge>
        );
      case TahlilStatus.ACCEPTED:
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />{translate('Accepted')}
          </Badge>
        );
      case TahlilStatus.COMPLETED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />{translate('Completed')}
          </Badge>
        );
      case TahlilStatus.REJECTED:
        return (
          <Badge variant="default" className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />{translate('Rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="">{status}</Badge>
        );
    }
  };

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }
  
  if (!isTahfizAdmin && !isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin 
          ? translate('Super Admin Dashboard') 
          : translate('Tahfiz Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'TahfizDashboard' 
        },
        { label: translate('Manage Tahlil Requests'), page: 'ManageTahlilRequests' }
      ]} />
      <AccessDeniedComponent/>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: isSuperAdmin 
          ? translate('Super Admin Dashboard') 
          : translate('Tahfiz Dashboard'), 
          page: isSuperAdmin ? 'SuperadminDashboard' : 'TahfizDashboard' 
        },
        { label: translate('Manage Tahlil Requests'), page: 'ManageTahlilRequests' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {translate('Manage Tahlil Requests')}
          </h1>
        </div>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="p-2">
            <Button
              disabled={selectedIds.length === 0}
              onClick={() => setIsLiveDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Live Tahlil ({selectedIds.length})
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === tahlilRequestList.items.length &&
                      tahlilRequestList.items.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{translate('Requestor Name')}</TableHead>
                <TableHead className="text-center">{translate('Deceased Name')}</TableHead>
                <TableHead className="text-center">{translate('Service Type')}</TableHead>
                <TableHead className="text-center">{translate('Tahfiz Center')}</TableHead>
                <TableHead className="text-center">{translate('Reference No.')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={7}/>
              ) : tahlilRequestList.items.length === 0 ? (
                <NoDataTableComponent colSpan={7}/>
              ) : (
                tahlilRequestList.items.map(request => (
                  <TableRow key={request.id} className={selectedIds.includes(request.id) ? 'bg-blue-50 dark:bg-gray-700' : ''}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => toggleSelect(request.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{request.requestorname}</TableCell>
                    <TableCell className="text-center">{(request.deceasednames || []).join(', ')}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{getServiceLabels(request.selectedservices)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-center">{request.tahfizcenter?.name}</TableCell>
                    <TableCell className="font-mono text-sm text-center">{request.referenceno || '-'}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(request)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      { request.liveurl && (
                        <Button variant="ghost" size="sm" onClick={() => joinRoom(request.liveurl)}>
                          <Video className="w-4 h-4" />
                        </Button>
                      )}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{translate('Tahlil Details')}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{translate('Requestor Name')}</p>
                  <p className="font-semibold">{selectedRequest.requestorname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{translate('Phone No.')}</p>
                  <p className="font-semibold">{selectedRequest.requestorphoneno}</p>
                </div>
              </div>
              {selectedRequest.requestoremail && (
                <div>
                  <p className="text-sm text-gray-500">{translate('Email')}</p>
                  <p>{selectedRequest.requestoremail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('Deceased Name')}</p>
                <p>{(selectedRequest.deceasednames || []).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('Service Type')}</p>
                <Badge variant="outline">{getServiceLabels(selectedRequest.selectedservices)}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('Tahfiz Center')}</p>
                <p>{selectedRequest.tahfizcenter?.name}</p>
              </div>
              {selectedRequest.referenceno && (
                <div>
                  <p className="text-sm text-gray-500">{translate('Reference No.')}</p>
                  <p className="font-mono font-semibold">{selectedRequest.referenceno}</p>
                </div>
              )}                
              {selectedRequest.customservice && (
                <div>
                  <p className="text-sm text-gray-500">{translate('Custom Service')}</p>
                  <p>{selectedRequest.customservice}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('Status')}</p>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('Suggested Date')}</p>
                <Input
                  type="date"
                  value={suggestedDate}
                  onChange={(event) => setSuggestedDate(event.target.value)}
                  disabled={selectedRequest?.status !== TahlilStatus.PENDING}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate('Close')}
            </Button>
            {selectedRequest?.status === TahlilStatus.PENDING && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleStatusChange(TahlilStatus.REJECTED)}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {translate('Reject')}
                </Button>
                <Button 
                  onClick={() => handleStatusChange(TahlilStatus.ACCEPTED)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {translate('Approve')}
                </Button>
              </>
            )}
            {selectedRequest?.status === TahlilStatus.ACCEPTED && (
              <Button 
                onClick={() => handleStatusChange(TahlilStatus.COMPLETED)}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {translate('Mark Completed')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLiveDialogOpen} onOpenChange={setIsLiveDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Live Tahlil
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({selectedIds.length} selected)
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
            {tahlilRequestList.items
              .filter(r => selectedIds.includes(r.id))
              .map(request => (
                <div 
                  key={request.id} 
                  className="px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Requestor: {request.requestorname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Reference No.: {request.referenceno}
                  </p>
                </div>
              ))}
          </div>

          <DialogFooter>
            <JitsiController 
              ids={selectedIds} 
              onClose={() => setIsLiveDialogOpen(false)}
            />
            <Button
              variant="outline"
              onClick={() => setIsLiveDialogOpen(false)}
            >
              {translate('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
