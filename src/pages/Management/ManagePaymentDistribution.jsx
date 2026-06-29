// @ts-nocheck
import { useState } from "react";
import {
  DollarSign, Clock, CheckCircle, XCircle, Pencil,
  Image as ImageIcon, Eye, Heart, BookOpen, Building2,
  Banknote, HelpCircle, User, Mail, Phone, MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

const paymentStatusStyles = {
  Pending: { className: "bg-yellow-100 text-yellow-700", Icon: Clock },
  Paid: { className: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
  Held: { className: "bg-amber-100 text-amber-700", Icon: Clock },
  "Transfer Pending": { className: "bg-blue-100 text-blue-700", Icon: Clock },
  Transferred: { className: "bg-green-100 text-green-700", Icon: CheckCircle },
  Failed: { className: "bg-red-100 text-red-700", Icon: XCircle },
  Refunded: { className: "bg-slate-100 text-slate-700", Icon: XCircle },
};

const sourceConfig = {
  Donation: { label: "Donation", className: "bg-rose-100 text-rose-700", Icon: Heart },
  Tahlil: { label: "Tahlil", className: "bg-purple-100 text-purple-700", Icon: BookOpen },
  Organisation: { label: "Organisation", className: "bg-blue-100 text-blue-700", Icon: Building2 },
  "Death Charity": { label: "Death Charity", className: "bg-orange-100 text-orange-700", Icon: Banknote },
  "QR Kubur": { label: "QR Kubur", className: "bg-gray-100 text-gray-600", Icon: DollarSign },
  "QR Kubur (Billplz)": { label: "Billplz", className: "bg-gray-100 text-gray-600", Icon: DollarSign },
};

const entityStatusStyles = {
  pending: { className: "bg-yellow-100 text-yellow-700", Icon: Clock, label: "Pending" },
  verified: { className: "bg-green-100 text-green-700", Icon: CheckCircle, label: "Verified" },
  completed: { className: "bg-green-100 text-green-700", Icon: CheckCircle, label: "Completed" },
  accepted: { className: "bg-blue-100 text-blue-700", Icon: CheckCircle, label: "Accepted" },
  rejected: { className: "bg-red-100 text-red-700", Icon: XCircle, label: "Rejected" },
};

const payerLabelByType = {
  Donation: "Donor",
  Tahlil: "Requester",
  Organisation: "Payer",
  "Death Charity": "Member",
};

const getPaymentStatusBadge = (status) => {
  const cfg = paymentStatusStyles[status] || { className: "bg-gray-100 text-gray-700", Icon: Clock };
  const Icon = cfg.Icon;
  return (
    <Badge className={cfg.className}>
      <Icon className="w-3 h-3 mr-1" />
      {translate(status)}
    </Badge>
  );
};

const getSourceBadge = (type) => {
  const cfg = sourceConfig[type] || { label: type || "Other", className: "bg-gray-100 text-gray-600", Icon: HelpCircle };
  const Icon = cfg.Icon;
  return (
    <Badge className={cfg.className}>
      <Icon className="w-3 h-3 mr-1" />
      {translate(cfg.label)}
    </Badge>
  );
};

const getEntityStatusBadge = (status) => {
  if (!status) return <span className="text-gray-400 text-xs">-</span>;
  const cfg = entityStatusStyles[status?.toLowerCase()] || {
    className: "bg-gray-100 text-gray-700", Icon: HelpCircle, label: status,
  };
  const Icon = cfg.Icon;
  return (
    <Badge className={cfg.className}>
      <Icon className="w-3 h-3 mr-1" />
      {translate(cfg.label)}
    </Badge>
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ms-MY");
};

// Small read-only info row for dialogs
function InfoRow({ label, value, mono = false, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-medium dark:text-white break-all ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value || "-"}
      </p>
    </div>
  );
}

export default function ManagePaymentDistribution() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit dialog state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [statusValue, setStatusValue] = useState("Pending");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [referenceTransferNo, setReferenceTransferNo] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [pastedPhotoUrl, setPastedPhotoUrl] = useState("");
  const [photoFileKey, setPhotoFileKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Detail (eye) dialog state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);

  const { paymentDistributionList, totalPages, isLoading } =
    useGetPaymentDistributionPaginated({ page, pageSize: itemsPerPage });

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

  const openDetailDialog = (account) => {
    setDetailAccount(account);
    setIsDetailOpen(true);
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

  if (loadingUser) return <PageLoadingComponent />;

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: translate("Super Admin Dashboard"), page: "SuperadminDashboard" },
            { label: translate("Payment Distribution"), page: "ManagePaymentDistribution" },
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
                <TableHead className="text-center">{translate("Source")}</TableHead>
                <TableHead className="text-center">{translate("Tied To")}</TableHead>
                <TableHead className="text-center">{translate("Entity Status")}</TableHead>
                <TableHead className="text-center">{translate("Payment Status")}</TableHead>
                <TableHead className="text-center">{translate("Date")}</TableHead>
                <TableHead className="text-center">{translate("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={7} />
              ) : paymentDistributionList.items.length === 0 ? (
                <NoDataTableComponent colSpan={7} />
              ) : (
                paymentDistributionList.items.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium font-mono text-xs">
                      {account.transaction?.referenceno || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getSourceBadge(account.type)}
                    </TableCell>
                    <TableCell className="text-center text-sm max-w-[140px] truncate">
                      {account.tiedToName || (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getEntityStatusBadge(account.entityStatus)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPaymentStatusBadge(account.status)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(account.transaction?.createdat || account.createdat)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(account)}
                          title={translate("View Details")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(account)}
                          title={translate("Update Status")}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* ── Detail Dialog ───────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl dark:bg-gray-800 dark:border-gray-700 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {translate("Payment Details")}
            </DialogTitle>
          </DialogHeader>

          {detailAccount && (() => {
            const payerLabel = payerLabelByType[detailAccount.type] || "Payer";
            const isQuotationOrg =
              detailAccount.type?.toLowerCase().includes("organisation") &&
              detailAccount.transaction?.orderno?.startsWith("QUO");
            const svc = Number(detailAccount.transaction?.originalamount || 0);

            return (
              <div className="space-y-4 text-sm">
                {/* Source only at top */}
                <div className="flex flex-wrap items-center gap-2">
                  {getSourceBadge(detailAccount.type)}
                </div>

                {/* Transaction info */}
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {translate("Transaction")}
                    </p>
                    {getPaymentStatusBadge(detailAccount.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoRow label={translate("Reference No.")} value={detailAccount.transaction?.referenceno} mono />
                    <InfoRow label={translate("Order No.")} value={detailAccount.transaction?.orderno} mono />
                    {isQuotationOrg ? (
                      <>
                        <InfoRow label={translate("Original Amount")} value={formatRM(svc)} />
                        <InfoRow label={`${translate("Platform Fee")} (5%)`} value={formatRM(svc * ORG_SERVICE_FEE)} />
                        <div className="col-span-2 border-t pt-2 flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">{translate("Organisation Amount")} (95%)</span>
                          <span className="font-bold text-emerald-600">{formatRM(svc * ORG_SHARE)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoRow label={translate("Original Amount")} value={formatRM(detailAccount.transaction?.originalamount)} />
                        <InfoRow label={translate("Maintenance Fee")} value={formatRM(detailAccount.transaction?.maintenancefee)} />
                      </>
                    )}
                    {detailAccount.entityAmount != null && (
                      <InfoRow label={translate("Entity Amount")} value={formatRM(detailAccount.entityAmount)} />
                    )}
                    <InfoRow label={translate("Date")} value={formatDate(detailAccount.transaction?.createdat || detailAccount.createdat)} />
                  </div>
                </div>

                {/* Entity / payer info */}
                {(detailAccount.tiedToName || detailAccount.payerName) && (
                  <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {translate(detailAccount.type || "Entity")}
                      </p>
                      {getEntityStatusBadge(detailAccount.entityStatus)}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {detailAccount.tiedToName && (
                        <InfoRow
                          label={translate("Tied To")}
                          value={detailAccount.tiedToName}
                          className="col-span-2"
                        />
                      )}
                      {detailAccount.payerName && (
                        <InfoRow label={translate(payerLabel)} value={detailAccount.payerName} />
                      )}
                      {detailAccount.payerEmail && (
                        <InfoRow label={translate("Email")} value={detailAccount.payerEmail} />
                      )}
                      {detailAccount.payerPhone && (
                        <InfoRow label={translate("Phone")} value={detailAccount.payerPhone} />
                      )}
                    </div>
                  </div>
                )}

                {/* Transfer info */}
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {translate("Transfer Info")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoRow label={translate("Bank Name")} value={detailAccount.bankname} />
                    <InfoRow label={translate("Account No.")} value={detailAccount.accountno} mono />
                    {detailAccount.referencetransferno && (
                      <InfoRow
                        label={translate("Reference Transfer No")}
                        value={detailAccount.referencetransferno}
                        mono
                        className="col-span-2"
                      />
                    )}
                  </div>
                </div>

                {/* Proof photo */}
                {detailAccount.photourl && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {translate("Transaction proof")}
                    </p>
                    <img
                      src={resolveFileUrl(detailAccount.photourl, "bucket-online-transaction")}
                      referrerPolicy="no-referrer"
                      className="h-52 w-full rounded-lg object-cover border"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              {translate("Close")}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setIsDetailOpen(false);
                openStatusDialog(detailAccount);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {translate("Edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Status Dialog ──────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {translate("Update Status")}
            </DialogTitle>
          </DialogHeader>

          {selectedAccount && (() => {
            const type = selectedAccount?.type?.toLowerCase();
            const orderNo = selectedAccount?.transaction?.orderno;
            const isQuotationOrg =
              type?.includes("organisation") &&
              typeof orderNo === "string" &&
              orderNo.startsWith("QUO");
            const svc = Number(selectedAccount.transaction?.originalamount || 0);

            return (
              <div className="grid grid-cols-2 gap-5 text-sm">

                {/* ── LEFT: read-only details ── */}
                <div className="space-y-3">
                  {/* Source + entity status */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getSourceBadge(selectedAccount.type)}
                    {getEntityStatusBadge(selectedAccount.entityStatus)}
                  </div>

                  {/* Identity info */}
                  <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    {selectedAccount.tiedToName && (
                      <InfoRow
                        label={translate("Tied To")}
                        value={selectedAccount.tiedToName}
                      />
                    )}
                    {selectedAccount.payerName && (
                      <InfoRow
                        label={translate(payerLabelByType[selectedAccount.type] || "Payer")}
                        value={selectedAccount.payerName}
                      />
                    )}
                    <InfoRow label={translate("Bank Name")} value={selectedAccount.bankname} />
                    <InfoRow label={translate("Account No.")} value={selectedAccount.accountno} mono />
                  </div>

                  {/* Ref numbers */}
                  <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    <InfoRow label={translate("Reference No.")} value={selectedAccount.transaction?.referenceno} mono />
                    <InfoRow label={translate("Order No.")} value={selectedAccount.transaction?.orderno} mono />
                  </div>

                  {/* Amounts */}
                  {isQuotationOrg ? (
                    <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                      <InfoRow label={translate("Original Amount")} value={formatRM(svc)} />
                      <InfoRow label={`${translate("Platform Fee")} (5%)`} value={formatRM(svc * ORG_SERVICE_FEE)} />
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{translate("Org Amount")} (95%)</span>
                        <span className="font-bold text-emerald-600 text-xs">{formatRM(svc * ORG_SHARE)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                      <InfoRow label={translate("Original Amount")} value={formatRM(selectedAccount.transaction?.originalamount)} />
                      <InfoRow label={translate("Maintenance Fee")} value={formatRM(selectedAccount.transaction?.maintenancefee)} />
                    </div>
                  )}
                </div>

                {/* ── RIGHT: editable fields ── */}
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {translate("Payment Status")}
                    </p>
                    <Select value={statusValue} onValueChange={setStatusValue}>
                      <SelectTrigger className="dark:bg-gray-700 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {translate(opt.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reference Transfer No */}
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

                  {/* Transaction proof */}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {translate("Transaction proof")}
                      {statusValue === "Paid" && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    {selectedAccount?.photourl && !photoPreview && (
                      <img
                        src={resolveFileUrl(selectedAccount.photourl, "bucket-online-transaction")}
                        referrerPolicy="no-referrer"
                        className="h-28 w-full rounded object-cover border mb-2"
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
                        className="h-28 w-full rounded object-cover border mt-2"
                      />
                    ) : (
                      !selectedAccount?.photourl && (
                        <div className="flex items-center justify-center h-28 border-2 border-dashed rounded text-gray-300 dark:border-gray-600 mt-1">
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

              </div>
            );
          })()}

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
