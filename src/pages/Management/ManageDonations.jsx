import React, { useState } from 'react';
import { Heart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '@/components/PageLoadingComponent';
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { translate } from '@/utils/translations';
import { useGetDonationPaginated, useUpdateDonation } from '@/hooks/useDonationMutations';
import { VerificationStatus } from '@/utils/enums';
import { useAdminAccess } from '@/utils/auth';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Pagination from '@/components/Pagination';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';

export default function ManageDonations() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    loading: permissionsLoading,
    canView, canVerify, canReject
  } = useCrudPermissions('donationList');

  const {
    donationList,
    totalPages,
    isLoading,
  } = useGetDonationPaginated({
    page,
    pageSize: itemsPerPage,
  });

  const updateMutation = useUpdateDonation();

  const totalVerified = donationList.items
    .filter(d => d.status === VerificationStatus.VERIFIED)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const openDetailDialog = (donation) => {
    setSelectedDonation(donation);
    setIsDialogOpen(true);
  };

  const handleSubmission = (type) => {
    if (!selectedDonation) return;

    updateMutation.mutateAsync({
      id: selectedDonation.id,
      data: {
        status: type === 'approve'
          ? VerificationStatus.VERIFIED
          : VerificationStatus.REJECTED,
      }
    })
    .then((res) => { 
      if (res) { 
        setIsDialogOpen(false); 
        setSelectedDonation(null); 
      } 
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{translate('Pending')}</Badge>;
      case VerificationStatus.VERIFIED:
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('Verified')}</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{translate('Rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingUser || permissionsLoading) {
    return <LoadingUser />;
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
          { label: translate('Manage Donations'), page: 'ManageDonations' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Donations'), page: 'ManageDonations' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            {translate('Manage Donations')} 
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white">
          <CardContent className="p-4">
            <p className="text-emerald-100 text-sm">{translate('Total Verified')}</p>
            <p className="text-2xl font-bold">RM {totalVerified.toLocaleString()}</p>
          </CardContent>
        </Card>
        {[
          { label: translate('Pending'), value: donationList.items.filter(d => d.status === VerificationStatus.PENDING).length, color: 'yellow' },
          { label: translate('Verified'), value: donationList.items.filter(d => d.status === VerificationStatus.VERIFIED).length, color: 'success' },
          { label: translate('Rejected'), value: donationList.items.filter(d => d.status === VerificationStatus.REJECTED).length, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Donor')}</TableHead>
                <TableHead className="text-center">{translate('Recipient')}</TableHead>
                <TableHead className="text-center">{translate('Amount')}</TableHead>
                <TableHead className="text-center">{translate('Status')}</TableHead>
                <TableHead className="text-center">{translate('Date')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6}/>
              ) : donationList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6}/>
              ) : (
                donationList.items.map(donation => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium">
                      {donation.donorname || 'Tanpa Nama'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-center">
                      {donation.organisation?.name ?? donation.tahfizcenter?.name}
                    </TableCell>
                    <TableCell className="font-semibold text-center">
                      RM {donation.amount}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(donation.status)}</TableCell>
                    <TableCell className="text-center">
                      {new Date(donation.createdat).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(donation)}>
                        <CheckCircle className="w-4 h-4" />
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
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setPage(1);
              }}
              totalItems={donationList.total}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{translate('Details')}</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{translate('Donor')}</p>
                  <p className="font-semibold">{selectedDonation.donorname || 'Tanpa Nama'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{translate('Amount')}</p>
                  <p className="font-semibold text-lg text-emerald-600">
                    RM {selectedDonation.amount}
                  </p>
                </div>
              </div>
              {selectedDonation.donoremail && (
                <div>
                  <p className="text-sm text-gray-500">{translate('Email')}</p>
                  <p>{selectedDonation.donoremail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('Recipient')}</p>
                <p>{selectedDonation.organisation?.name ?? selectedDonation.tahfizcenter?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translate('Payment Method')}</p>
                <p className="capitalize">{selectedDonation.paymentplatform?.name.replace('_', ' ')}</p>
              </div>
              {selectedDonation.notes && (
                <div>
                  <p className="text-sm text-gray-500">{translate('Notes')}</p>
                  <p>{selectedDonation.notes}</p>
                </div>
              )}
              {selectedDonation.reference_id && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{translate('Reference ID')}</p>
                  <p className="font-mono font-semibold text-sm break-all bg-gray-50 p-2 rounded">
                    {selectedDonation.reference_id}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{translate('Current Status')}</p>
                {getStatusBadge(selectedDonation.status)}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate('Close')}
            </Button>
            {selectedDonation?.status === 'pending' && (
              <>
                { canReject && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleSubmission('reject')}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {translate('Reject')}
                  </Button>
                )}

                { canVerify && (
                  <Button 
                    onClick={() => handleSubmission('approve')}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {translate('Verify')}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}