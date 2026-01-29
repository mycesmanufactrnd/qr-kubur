import { useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { translate } from '@/utils/translations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useDeleteSuggestion, useGetSuggestionPaginated, useUpdateSuggestion } from '@/hooks/useSuggestionMutations';
import Pagination from '@/components/Pagination';
import { ApprovalStatus } from '@/utils/enums';
import ConfirmDialog from '@/components/ConfirmDialog';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';

export default function ManageSuggestions() {
  const { 
    loadingUser,
    hasAdminAccess, 
  } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState(null);

  const {
    loading: permissionsLoading,
    canView, canApprove, canReject, canDelete
  } = useCrudPermissions('suggestions');

  const {
    suggestionList: suggestions,
    totalPages,
    isLoading,
  } = useGetSuggestionPaginated({
    page,
    pageSize: itemsPerPage,
  });

  const updateMutation = useUpdateSuggestion();
  const deleteMutation = useDeleteSuggestion();

  const openDetailDialog = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.adminnotes || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (suggestion) => {
    setSuggestionToDelete(suggestion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!suggestionToDelete) return;
    deleteMutation.mutate(suggestionToDelete.id);
    setDeleteDialogOpen(false);
    setSuggestionToDelete(null);
  };

  const handleSubmission = (type) => {
    if (!selectedSuggestion) return;

    updateMutation.mutateAsync({
      id: selectedSuggestion.id,
      data: {
        status: type === 'approve'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED,
        adminnotes: adminNotes,
      }
    })
    .then((res) => { 
      if (res) { 
        setIsDialogOpen(false); 
        setSelectedSuggestion(null); 
      } 
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{translate('Pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('Approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{translate('Rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      person: translate('Record Person'),
      grave: translate('Record Grave'),
      organisation: translate('Record Organisation'),
      tahfiz: translate('Record Tahfiz')
    };
    return labels[type] || type;
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
          { label: translate('Manage Suggestions'), page: 'ManageSuggestions' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Suggestions'), page: 'ManageSuggestions' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            {translate('Manage Suggestions')}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: translate('Pending'), value: suggestions.items.filter(s => s.status === 'pending').length, color: 'yellow' },
          { label: translate('Approved'), value: suggestions.items.filter(s => s.status === 'approved').length, color: 'green' },
          { label: translate('Rejected'), value: suggestions.items.filter(s => s.status === 'rejected').length, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Name')}</TableHead>
                <TableHead className="text-center">{translate('Phone No.')}</TableHead>
                <TableHead className="text-center">{translate('Suggestion Type')}</TableHead>
                <TableHead className="text-center">{translate('Suggestion')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Date')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={7}/>
              ) : suggestions.items.length === 0 ? (
                <NoDataTableComponent colSpan={7}/>
              ) : (
                suggestions.items.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell>{suggestion.name}</TableCell>
                    <TableCell className="text-center">{suggestion.phoneno}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {getEntityTypeLabel(suggestion.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-center">
                      {suggestion.suggestedchanges?.substring(0, 50)}...
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(suggestion.status)}</TableCell>
                    <TableCell className="text-center">
                      {new Date(suggestion.createdat).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      { canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(suggestion)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      ) }
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
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setPage(1);
              }}
              totalItems={suggestions.total}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{translate('Details')}</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Suggestion Type')}</p>
                <p className="font-semibold dark:text-white">{getEntityTypeLabel(selectedSuggestion.type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Suggested Changes')}</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap dark:text-gray-200">{selectedSuggestion.suggestedchanges}</p>
                </div>
              </div>
              {selectedSuggestion.reason && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Reason / Justification')}</p>
                  <p className="dark:text-gray-200">{selectedSuggestion.reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Status')}</p>
                {getStatusBadge(selectedSuggestion.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{translate('Admin Notes')}</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={translate('Notes')}
                  rows={3}
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate('Close')}
            </Button>
            {selectedSuggestion?.status === 'pending' && (
              <>
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={() => handleSubmission('reject')}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {translate('Reject')}
                  </Button>
                )}

                {canApprove && (
                  <Button
                    onClick={() => handleSubmission('approve')}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {translate('Approve')}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete')}
        description={`${translate('Confirm delete')} "${suggestionToDelete?.id}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />
    </div>
  );
}