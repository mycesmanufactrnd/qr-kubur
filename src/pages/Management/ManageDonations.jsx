import React, { useEffect, useState } from "react";
import { Heart, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingUser from "@/components/PageLoadingComponent";
import Breadcrumb from "@/components/Breadcrumb";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { translate } from "@/utils/translations";
import { resolveFileUrl } from "@/utils";
import {
  useGetDonationPaginated,
  useUpdateDonation,
} from "@/hooks/useDonationMutations";
import { VerificationStatus } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { useGetOnlineTransaction } from "@/hooks/usePaymentDistributionMutation";
import { formatRM } from "@/utils/helpers";

export default function ManageDonations() {
  const { loadingUser, hasAdminAccess, isTahfizAdmin } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [transactionAccount, setTransactionAccount] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    loading: permissionsLoading,
    canView,
    canVerify,
    canReject,
  } = useCrudPermissions("donations");

  const { donationList, totalPages, isLoading } = useGetDonationPaginated({
    page,
    pageSize: itemsPerPage,
  });

  const updateMutation = useUpdateDonation();

  const {
    onlineTransaction,
    isLoading: onlineTransactionLoading,
    refetch: refetchOnlineTransaction,
  } = useGetOnlineTransaction({
    referenceno: selectedDonation?.referenceno,
    enabled: false,
  });

  const totalVerified = donationList.items
    .filter((d) => d.status === VerificationStatus.VERIFIED)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const openDetailDialog = (donation) => {
    setSelectedDonation(donation);
    setTransactionAccount(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    let isActive = true;

    if (!selectedDonation?.referenceno) {
      setTransactionAccount(null);
      return () => {
        isActive = false;
      };
    }

    refetchOnlineTransaction().then((res) => {
      if (!isActive) return;
      const transaction = res?.data ?? onlineTransaction;
      const accounts = Array.isArray(transaction?.accounts)
        ? [...transaction.accounts]
        : [];

      accounts.sort((a, b) => {
        const dateA = a?.createdat ? new Date(a.createdat).getTime() : 0;
        const dateB = b?.createdat ? new Date(b.createdat).getTime() : 0;
        return dateB - dateA;
      });

      setTransactionAccount(accounts[0] ?? null);
    });

    return () => {
      isActive = false;
    };
  }, [selectedDonation, refetchOnlineTransaction, onlineTransaction]);

  const handleSubmission = (type) => {
    if (!selectedDonation) return;

    updateMutation
      .mutateAsync({
        id: selectedDonation.id,
        data: {
          status:
            type === "approve"
              ? VerificationStatus.VERIFIED
              : VerificationStatus.REJECTED,
        },
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
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Pending")}
          </Badge>
        );
      case VerificationStatus.VERIFIED:
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Verified")}
          </Badge>
        );
      case VerificationStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Rejected")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransactionStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Pending")}
          </Badge>
        );
      case "Paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Paid")}
          </Badge>
        );
      case "Held":
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Held")}
          </Badge>
        );
      case "Transfer Pending":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Transfer Pending")}
          </Badge>
        );
      case "Transferred":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Transferred")}
          </Badge>
        );
      case "Failed":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Failed")}
          </Badge>
        );
      case "Refunded":
        return (
          <Badge className="bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Refunded")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "-"}</Badge>;
    }
  };

  if (loadingUser || permissionsLoading) {
    return <LoadingUser />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  const dashboardLabel = isTahfizAdmin
    ? translate("Tahfiz Dashboard")
    : translate("Admin Dashboard");
  const dashboardPage = isTahfizAdmin ? "TahfizDashboard" : "AdminDashboard";

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: dashboardLabel, page: dashboardPage },
            { label: translate("Manage Donations"), page: "ManageDonations" },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: dashboardLabel, page: dashboardPage },
          { label: translate("Manage Donations"), page: "ManageDonations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            {translate("Manage Donations")}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white">
          <CardContent className="p-4">
            <p className="text-emerald-100 text-sm">
              {translate("Total Verified")}
            </p>
            <p className="text-2xl font-bold">
              {formatRM(totalVerified)}
            </p>
          </CardContent>
        </Card>
        {[
          {
            label: translate("Pending"),
            value: donationList.items.filter(
              (d) => d.status === VerificationStatus.PENDING,
            ).length,
            color: "yellow",
          },
          {
            label: translate("Verified"),
            value: donationList.items.filter(
              (d) => d.status === VerificationStatus.VERIFIED,
            ).length,
            color: "success",
          },
          {
            label: translate("Rejected"),
            value: donationList.items.filter(
              (d) => d.status === VerificationStatus.REJECTED,
            ).length,
            color: "red",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700"
          >
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </p>
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
                <TableHead>{translate("Donor")}</TableHead>                
                <TableHead className="text-center">
                  {translate("Recipient")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Amount")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Date")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Reference No")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={6} />
              ) : donationList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                donationList.items.map((donation) => (
                  <TableRow key={donation.id}>                    
                    <TableCell className="font-medium">
                      {donation.donorname || translate("No Name")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-center">
                      {donation.organisation?.name ??
                        donation.tahfizcenter?.name}
                    </TableCell>
                    <TableCell className="font-semibold text-center">
                      RM {donation.amount}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(donation.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(donation.createdat).toLocaleDateString("ms-MY")}
                    </TableCell>
                    <TableCell className="font-medium text-center">
                      {donation.referenceno || ""}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(donation)}
                      >
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDonation(null);
            setTransactionAccount(null);
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {translate("Details")}
            </DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Donor")}
                    </p>
                    <p className="font-semibold">
                      {selectedDonation.donorname || "Tanpa Nama"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Amount")}
                    </p>
                    <p className="font-semibold text-lg text-emerald-600">
                      RM {selectedDonation.amount}
                    </p>
                  </div>
                </div>
                {selectedDonation.donoremail && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Email")}
                    </p>
                    <p>{selectedDonation.donoremail}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Recipient")}
                  </p>
                  <p>
                    {selectedDonation.organisation?.name ??
                      selectedDonation.tahfizcenter?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Payment Method")}
                  </p>
                  <p className="capitalize">
                    {selectedDonation.paymentplatform?.name.replace("_", " ")}
                  </p>
                </div>
                {selectedDonation.notes && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Notes")}
                    </p>
                    <p>{selectedDonation.notes}</p>
                  </div>
                )}
                {selectedDonation.referenceno && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {translate("Reference No.")}
                    </p>
                    <p className="font-mono font-semibold text-sm break-all bg-gray-50 p-2 rounded">
                      {selectedDonation.referenceno}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Current Status")}
                  </p>
                  {getStatusBadge(selectedDonation.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {`${translate("Platform Transfer Status")} - ${translate("Donation")}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {translate(
                        "This shows the status of fund transfer to the selected recipient.",
                      )}
                    </p>
                  </div>
                  {onlineTransactionLoading && (
                    <span className="text-xs text-gray-400">
                      {translate("Loading...")}
                    </span>
                  )}
                </div>

                {!onlineTransactionLoading && !transactionAccount && (
                  <div className="text-sm text-gray-400">
                    {translate("No online transaction account found")}
                  </div>
                )}

                {transactionAccount && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Status")}
                      </p>
                      {getTransactionStatusBadge(transactionAccount.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Bank Name")}
                      </p>
                      <p className="font-semibold">
                        {transactionAccount.bankname || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Account No")}
                      </p>
                      <p className="font-semibold">
                        {transactionAccount.accountno || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Reference Transfer No")}
                      </p>
                      <p className="font-semibold">
                        {transactionAccount.referencetransferno ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Photo")}
                      </p>
                      {transactionAccount.photourl ? (
                        <div className="space-y-2">
                          {resolveFileUrl(
                            transactionAccount.photourl,
                            "online-transaction",
                          ) && (
                            <img
                              src={resolveFileUrl(
                                transactionAccount.photourl,
                                "online-transaction",
                              )}
                              alt={translate("Transaction proof")}
                              className="h-36 w-full rounded object-cover border"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate("Close")}
            </Button>
            {selectedDonation?.status === "pending" && (
              <>
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={() => handleSubmission("reject")}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {translate("Reject")}
                  </Button>
                )}

                {canVerify && (
                  <Button
                    onClick={() => handleSubmission("approve")}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {translate("Verify")}
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
