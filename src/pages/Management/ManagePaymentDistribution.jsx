// @ts-nocheck
import { useState } from "react";
import { DollarSign, Clock, CheckCircle, XCircle, Pencil, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import { showError } from "@/components/ToastrNotification";
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
import { formatRM } from "@/utils/helpers";
import { ORG_SERVICE_FEE, ORG_SHARE } from "@/utils/enums";

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
  const [referenceTransferNo, setReferenceTransferNo] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [pastedPhotoUrl, setPastedPhotoUrl] = useState("");
  const [photoFileKey, setPhotoFileKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const { paymentDistributionList, totalPages, isLoading } =
    useGetPaymentDistributionPaginated({
      page,
      pageSize: itemsPerPage,
    });

  const updateMutation = usePaymentDistributionMutation();

  const openStatusDialog = (account) => {
    setSelectedAccount(account);
    setStatusValue(account?.status || "Pending");
    setReferenceTransferNo(account?.referencetransferno || "");
    setPastedPhotoUrl("");
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoFileKey((k) => k + 1);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAccount?.id) return;

    if (statusValue === "Paid") {
      if (!referenceTransferNo.trim()) {
        showError(`${translate("Please complete the field")} ${translate("Reference Transfer No")}`);
        return;
      }
      const hasPhoto = photoFile || pastedPhotoUrl || selectedAccount?.photourl;
      if (!hasPhoto) {
        showError(`${translate("Please complete the field")} ${translate("Transaction proof")}`);
        return;
      }
    }

    let finalPhotoUrl = pastedPhotoUrl || selectedAccount?.photourl || null;

    if (photoFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", photoFile);
        appendCurrentUserToFormData(formData);
        const res = await fetch("/api/upload/bucket-online-transaction", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          showError(translate("Failed to upload photo"));
          setUploading(false);
          return;
        }
        const data = await res.json();
        finalPhotoUrl = data.file_url;
      } catch {
        showError(translate("Failed to upload photo"));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const res = await updateMutation.mutateAsync({
      id: selectedAccount.id,
      status: statusValue,
      referencetransferno: referenceTransferNo || null,
      photourl: finalPhotoUrl,
    });
    if (res) {
      setIsDialogOpen(false);
      setSelectedAccount(null);
    }
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
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            {
              label: translate("Super Admin Dashboard"),
              page: "SuperadminDashboard",
            },
            {
              label: translate("Payment Distribution"),
              page: "ManagePaymentDistribution",
            },
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
          {
            label: translate("Super Admin Dashboard"),
            page: "SuperadminDashboard",
          },
          {
            label: translate("Payment Distribution"),
            page: "ManagePaymentDistribution",
          },
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
                <TableHead className="text-center">
                  {translate("Order No.")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Original Amount")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Maintenance Fee")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Bank Name")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Account No.")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Date")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={9} />
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
                      {formatRM(account.transaction?.originalamount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatRM(account.transaction?.maintenancefee)}
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
                      {formatDate(
                        account.transaction?.createdat || account.createdat,
                      )}
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

              {(() => {
                const type = selectedAccount?.type?.toLowerCase();
                const orderNo = selectedAccount?.transaction?.orderno;

                const isQuotationOrg =
                  type?.includes("organisation") &&
                  typeof orderNo === "string" &&
                  orderNo.startsWith("QUO");

                if (isQuotationOrg) {
                  const svc = Number(
                    selectedAccount.transaction?.originalamount || 0,
                  );

                  const fee = svc * ORG_SERVICE_FEE;
                  const org = svc * ORG_SHARE;
                  
                  return (
                    <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {translate("Original Amount")}
                        </span>
                        <span className="font-semibold dark:text-white">
                          {formatRM(svc)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {translate("Platform Fee")} (5%)
                        </span>
                        <span className="font-semibold text-red-500">
                          {formatRM(fee)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t pt-2">
                        <span className="dark:text-white">
                          {translate("Organisation Amount")} (95%)
                        </span>
                        <span className="text-emerald-600">
                          {formatRM(org)}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {translate("Original Amount")}
                      </p>
                      <p className="font-semibold text-emerald-600">
                        {formatRM(selectedAccount.transaction?.originalamount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {translate("Maintenance Fee")}
                      </p>
                      <p className="font-semibold text-amber-600">
                        {formatRM(selectedAccount.transaction?.maintenancefee)}
                      </p>
                    </div>
                  </div>
                );
              })()}

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

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {translate("Reference Transfer No")}
                  {statusValue === "Paid" && <span className="text-red-500 ml-1">*</span>}
                </p>
                <Input
                  value={referenceTransferNo}
                  onChange={(e) => setReferenceTransferNo(e.target.value)}
                  placeholder={translate("Reference Transfer No")}
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {translate("Transaction proof")}
                  {statusValue === "Paid" && <span className="text-red-500 ml-1">*</span>}
                </p>
                {selectedAccount?.photourl && !photoPreview && (
                  <img
                    src={resolveFileUrl(selectedAccount.photourl, "bucket-online-transaction")}
                    referrerPolicy="no-referrer"
                    className="h-32 w-full rounded object-cover border mb-2"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <input
                  key={photoFileKey}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                    setPastedPhotoUrl("");
                  }}
                  disabled={uploading}
                  className="block w-full text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 dark:file:bg-gray-600 dark:file:text-white"
                />
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={translate("Preview")}
                    className="h-32 w-full rounded object-cover border mt-2"
                  />
                ) : (
                  !selectedAccount?.photourl && (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded text-gray-300 dark:border-gray-600 mt-1">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )
                )}
                <p className="text-xs text-gray-400 my-2">{translate("Or paste image URL")}</p>
                <Input
                  value={pastedPhotoUrl}
                  onChange={(e) => {
                    setPastedPhotoUrl(e.target.value);
                    if (e.target.value) {
                      setPhotoFile(null);
                      setPhotoPreview("");
                      setPhotoFileKey((k) => k + 1);
                    }
                  }}
                  placeholder="https://..."
                  className="dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate("Close")}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateMutation.isPending || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? translate("Uploading...") : translate("Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
