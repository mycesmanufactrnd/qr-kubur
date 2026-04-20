import { useEffect, useState } from "react";
import { FileText, CheckCircle, XCircle, Clock, Upload, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  useGetQuotationPaginated,
  useUpdateQuotation,
} from "@/hooks/useQuotationMutations";
import { ORG_SERVICE_FEE, ORG_SHARE, QuotationStatus } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { formatRM } from "@/utils/helpers";
import { useGetOnlineTransaction } from "@/hooks/usePaymentDistributionMutation";
import { showError } from "@/components/ToastrNotification";

export default function ManageQuotations() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionAccount, setTransactionAccount] = useState(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogQuotation, setUploadDialogQuotation] = useState(null);
  const [uploadDialogFile, setUploadDialogFile] = useState(null);
  const [uploadDialogPreview, setUploadDialogPreview] = useState("");
  const [uploadDialogFileKey, setUploadDialogFileKey] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    loading: permissionsLoading,
    canView,
    canVerify,
    canReject,
  } = useCrudPermissions("quotations");

  const { quotationList, totalPages, isLoading } = useGetQuotationPaginated({
    page,
    pageSize: itemsPerPage,
  });

  const updateMutation = useUpdateQuotation();

  const {
    onlineTransaction,
    isLoading: onlineTransactionLoading,
    refetch: refetchOnlineTransaction,
  } = useGetOnlineTransaction({
    referenceno: selectedQuotation?.referenceno,
    enabled: false,
  });

  useEffect(() => {
    let isActive = true;

    if (!selectedQuotation?.referenceno) {
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
  }, [selectedQuotation, refetchOnlineTransaction, onlineTransaction]);

  const openDialog = (quotation) => {
    setSelectedQuotation(quotation);
    setTransactionAccount(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedQuotation(null);
    setTransactionAccount(null);
    setIsDialogOpen(false);
  };

  const openUploadDialog = (quotation) => {
    setUploadDialogQuotation(quotation);
    setUploadDialogFile(null);
    setUploadDialogPreview("");
    setUploadDialogFileKey((k) => k + 1);
    setUploadDialogOpen(true);
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadDialogQuotation(null);
    setUploadDialogFile(null);
    setUploadDialogPreview("");
  };

  const handleUploadFileChange = (file) => {
    if (!file) return;
    setUploadDialogFile(file);
    setUploadDialogPreview(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async () => {
    if (!uploadDialogQuotation || !uploadDialogFile) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadDialogFile);
      const res = await fetch(`/api/upload/organisation-services`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || translate("Failed to upload photo"));
        return;
      }
      const data = await res.json();
      await updateMutation.mutateAsync({
        id: uploadDialogQuotation.id,
        data: { photourl: data.file_url },
      });
      closeUploadDialog();
    } catch {
      showError(translate("Failed to upload photo"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleComplete = () => {
    if (!selectedQuotation) return;
    updateMutation
      .mutateAsync({
        id: selectedQuotation.id,
        data: { status: QuotationStatus.COMPLETED },
      })
      .then((res) => {
        if (res) closeDialog();
      });
  };

  const handleReject = () => {
    if (!selectedQuotation) return;
    updateMutation
      .mutateAsync({
        id: selectedQuotation.id,
        data: { status: QuotationStatus.REJECTED },
      })
      .then((res) => {
        if (res) closeDialog();
      });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case QuotationStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Pending")}
          </Badge>
        );
      case QuotationStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Completed")}
          </Badge>
        );
      case QuotationStatus.REJECTED:
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

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Admin Dashboard"), page: "AdminDashboard" },
            { label: translate("Manage Quotations"), page: "ManageQuotations" },
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
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Manage Quotations"), page: "ManageQuotations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-sky-600" />
          {translate("Manage Quotations")}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: translate("Pending"),
            value: quotationList.items.filter(
              (q) => q.status === QuotationStatus.PENDING,
            ).length,
            color: "yellow",
          },
          {
            label: translate("Completed"),
            value: quotationList.items.filter(
              (q) => q.status === QuotationStatus.COMPLETED,
            ).length,
            color: "green",
          },
          {
            label: translate("Rejected"),
            value: quotationList.items.filter(
              (q) => q.status === QuotationStatus.REJECTED,
            ).length,
            color: "red",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Payer")}</TableHead>
                <TableHead>{translate("Reference No")}</TableHead>
                <TableHead>{translate("Organisation")}</TableHead>
                <TableHead className="text-center">
                  {translate("Services")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Total Amount")}
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
                <InlineLoadingComponent isTable colSpan={8} />
              ) : quotationList.items.length === 0 ? (
                <NoDataTableComponent colSpan={8} />
              ) : (
                quotationList.items.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.payername || translate("No Name")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {q.referenceno || "-"}
                    </TableCell>
                    <TableCell>{q.organisation?.name || "-"}</TableCell>
                    <TableCell className="text-center">
                      {(q.selectedservices || []).length}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {formatRM(q.totalamount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(q.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(q.createdat).toLocaleDateString("ms-MY")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(q)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUploadDialog(q)}
                      >
                        <Upload className="w-4 h-4" />
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
              onItemsPerPageChange={(v) => {
                setItemsPerPage(v);
                setPage(1);
              }}
              totalItems={quotationList.total}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-[65vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translate("Quotation Details")}</DialogTitle>
          </DialogHeader>

          {selectedQuotation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Payer")}
                    </p>
                    <p className="font-semibold">
                      {selectedQuotation.payername || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Reference No")}
                    </p>
                    <p className="font-mono text-sm break-all bg-gray-50 p-1.5 rounded">
                      {selectedQuotation.referenceno || "-"}
                    </p>
                  </div>
                  {selectedQuotation.payeremail && (
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Email")}
                      </p>
                      <p>{selectedQuotation.payeremail}</p>
                    </div>
                  )}
                  {selectedQuotation.payerphone && (
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Phone")}
                      </p>
                      <p>{selectedQuotation.payerphone}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Organisation")}
                  </p>
                  <p>{selectedQuotation.organisation?.name || "-"}</p>
                </div>

                {selectedQuotation.deadperson && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Deceased")}
                    </p>
                    <p>{selectedQuotation.deadperson?.name || "-"}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {translate("Selected Services")}
                  </p>
                  <div className="space-y-1">
                    {(selectedQuotation.selectedservices || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm bg-gray-50 rounded px-3 py-1.5"
                      >
                        <span>{s.service}</span>
                        <span className="font-semibold">
                          {formatRM(s.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1.5">
                  {selectedQuotation.serviceamount != null &&
                    (() => {
                      const svc = Number(selectedQuotation.serviceamount);
                      const fee = svc * ORG_SERVICE_FEE;
                      const org = svc * ORG_SHARE;

                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {translate("Service Amount")}
                            </span>
                            <span>{formatRM(svc)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {translate("Platform Fee")} (5%)
                            </span>
                            <span className="text-red-500">
                              {formatRM(fee)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>
                              {translate("Organisation Amount")} (95%)
                            </span>
                            <span className="text-emerald-700">
                              {formatRM(org)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  {selectedQuotation.serviceamount == null && (
                    <div className="flex justify-between font-bold">
                      <span>{translate("Total Amount")}</span>
                      <span className="text-emerald-700">
                        {formatRM(selectedQuotation.totalamount)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {translate("Status")}
                  </p>
                  {getStatusBadge(selectedQuotation.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {`${translate("Platform Transfer Status")} - ${translate("Quotation")}`}
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
                        <img
                          src={resolveFileUrl(
                            transactionAccount.photourl,
                            "online-transaction",
                          )}
                          alt={translate("Transaction proof")}
                          className="h-36 w-full rounded object-cover border"
                        />
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
            <Button variant="outline" onClick={closeDialog}>
              {translate("Close")}
            </Button>
            {selectedQuotation?.status === QuotationStatus.PENDING && (
              <>
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {translate("Reject")}
                  </Button>
                )}
                {canVerify && (
                  <Button
                    onClick={handleComplete}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {translate("Mark as Completed")}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeUploadDialog();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translate("Upload Completion Photo")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {uploadDialogQuotation?.photourl && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{translate("Current Photo")}</p>
                <img
                  src={resolveFileUrl(uploadDialogQuotation.photourl, "organisation-services")}
                  alt={translate("Current photo")}
                  className="h-40 w-full rounded object-cover border"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-500">{translate("Select New Photo")}</p>
              <Input
                key={uploadDialogFileKey}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(e) => handleUploadFileChange(e.target.files?.[0])}
                disabled={uploadingPhoto}
              />
              {uploadDialogPreview ? (
                <img
                  src={uploadDialogPreview}
                  alt={translate("Preview")}
                  className="h-40 w-full rounded object-cover border"
                />
              ) : !uploadDialogQuotation?.photourl && (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded text-gray-300">
                  <Image className="w-10 h-10" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeUploadDialog}>
              {translate("Close")}
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploadingPhoto || !uploadDialogFile}
              className="bg-sky-600 hover:bg-sky-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingPhoto ? translate("Uploading...") : translate("Upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
