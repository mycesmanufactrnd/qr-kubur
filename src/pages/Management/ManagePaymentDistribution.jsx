import { useState } from "react";
import { DollarSign, Clock, CheckCircle, XCircle, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Breadcrumb from "@/components/Breadcrumb";
import { translate } from "@/utils/translations";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import Pagination from "@/components/Pagination";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetPaymentDistributionPaginated,
  usePaymentDistributionMutation,
} from "@/hooks/usePaymentDistributionMutation";

const statusOptions = [
  { label: "Pending", value: "Pending" },
  { label: "Paid", value: "Paid" },
  { label: "Held", value: "Held" },
  { label: "Transfer Pending", value: "Transfer Pending" },
  { label: "Transferred", value: "Transferred" },
  { label: "Failed", value: "Failed" },
  { label: "Refunded", value: "Refunded" },
];

const statusStyles = {
  Pending: { className: "bg-yellow-100 text-yellow-700", Icon: Clock },
  Paid: { className: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
  Held: { className: "bg-amber-100 text-amber-700", Icon: Clock },
  "Transfer Pending": { className: "bg-blue-100 text-blue-700", Icon: Clock },
  Transferred: { className: "bg-green-100 text-green-700", Icon: CheckCircle },
  Failed: { className: "bg-red-100 text-red-700", Icon: XCircle },
  Refunded: { className: "bg-slate-100 text-slate-700", Icon: XCircle },
};

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ms-MY");
};

export default function ManagePaymentDistribution() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [statusValue, setStatusValue] = useState("Pending");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    paymentDistributionList,
    totalPages,
    isLoading,
  } = useGetPaymentDistributionPaginated({
    page,
    pageSize: itemsPerPage,
  });

  const updateMutation = usePaymentDistributionMutation();

  const openStatusDialog = (account) => {
    setSelectedAccount(account);
    setStatusValue(account?.status || "Pending");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedAccount?.id) return;

    updateMutation
      .mutateAsync({
        id: selectedAccount.id,
        status: statusValue,
      })
      .then((res) => {
        if (res) {
          setIsDialogOpen(false);
          setSelectedAccount(null);
        }
      });
  };

  const getStatusBadge = (status) => {
    const config = statusStyles[status] || {
      className: "bg-gray-100 text-gray-700",
      Icon: Clock,
    };
    const Icon = config.Icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {translate(status)}
      </Badge>
    );
  };

  if (loadingUser) {
    return <PageLoadingComponent />;
  }

  if (!isSuperAdmin) {
    return <AccessDeniedComponent />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Super Admin Dashboard"), page: "SuperadminDashboard" },
          { label: translate("Payment Distribution"), page: "ManagePaymentDistribution" },
        ]}
      />

      <div className="flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translate("Payment Distribution")}
        </h1>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Reference No.")}</TableHead>
                <TableHead className="text-center">{translate("Order No.")}</TableHead>
                <TableHead className="text-center">{translate("Original Amount")}</TableHead>
                <TableHead className="text-center">{translate("Maintenance Fee")}</TableHead>
                <TableHead className="text-center">{translate("Bank Name")}</TableHead>
                <TableHead className="text-center">{translate("Account No.")}</TableHead>
                <TableHead className="text-center">{translate("Status")}</TableHead>
                <TableHead className="text-center">{translate("Date")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={9} />
              ) : paymentDistributionList.items.length === 0 ? (
                <NoDataTableComponent colSpan={9} />
              ) : (
                paymentDistributionList.items.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.transaction?.referenceno || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {account.transaction?.orderno || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      RM {formatAmount(account.transaction?.originalamount)}
                    </TableCell>
                    <TableCell className="text-center">
                      RM {formatAmount(account.transaction?.maintenancefee)}
                    </TableCell>
                    <TableCell className="text-center">
                      {account.bankname || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {account.accountno || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(account.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(account.transaction?.createdat || account.createdat)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStatusDialog(account)}
                      >
                        <Pencil className="w-4 h-4" />
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
              totalItems={paymentDistributionList.total}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {translate("Update Status")}
            </DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {translate("Reference No.")}
                  </p>
                  <p className="font-semibold dark:text-white">
                    {selectedAccount.transaction?.referenceno || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {translate("Order No.")}
                  </p>
                  <p className="font-semibold dark:text-white">
                    {selectedAccount.transaction?.orderno || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {translate("Original Amount")}
                  </p>
                  <p className="font-semibold text-emerald-600">
                    RM {formatAmount(selectedAccount.transaction?.originalamount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {translate("Maintenance Fee")}
                  </p>
                  <p className="font-semibold text-amber-600">
                    RM {formatAmount(selectedAccount.transaction?.maintenancefee)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {translate("Status")}
                </p>
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {translate(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate("Close")}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {translate("Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
