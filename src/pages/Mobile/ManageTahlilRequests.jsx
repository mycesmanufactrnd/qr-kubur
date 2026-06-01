// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Upload,
  Video,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { translate } from "@/utils/translations";
import { appendCurrentUserToFormData, createPageUrl, resolveFileUrl } from "@/utils";
import { showError } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { TahlilStatus, getServiceLabels } from "@/utils/enums";
import {
  useGetTahlilRequestPaginated,
  useUpdateTahlilRequest,
} from "@/hooks/useTahlilRequestMutations";
import { useGetOnlineTransaction } from "@/hooks/usePaymentDistributionMutation";
import JitsiController from "@/components/jitsi/JitsiController";
import { useNavigate } from "react-router-dom";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";

function StatusBadge({ status }) {
  const base = "inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-0.5";
  switch (status) {
    case TahlilStatus.PENDING:
      return <span className={`${base} bg-yellow-100 text-yellow-700`}><Clock className="w-3 h-3" />{translate("Pending")}</span>;
    case TahlilStatus.ACCEPTED:
      return <span className={`${base} bg-blue-100 text-blue-700`}><CheckCircle className="w-3 h-3" />{translate("Accepted")}</span>;
    case TahlilStatus.COMPLETED:
      return <span className={`${base} bg-green-100 text-green-700`}><CheckCircle className="w-3 h-3" />{translate("Completed")}</span>;
    case TahlilStatus.REJECTED:
      return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="w-3 h-3" />{translate("Rejected")}</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-700`}>{status || "-"}</span>;
  }
}

function TransactionStatusBadge({ status }) {
  const base = "inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-0.5";
  const cfg = {
    Pending: [`${base} bg-yellow-100 text-yellow-700`, <Clock className="w-3 h-3" />],
    Paid: [`${base} bg-emerald-100 text-emerald-700`, <CheckCircle className="w-3 h-3" />],
    Held: [`${base} bg-amber-100 text-amber-700`, <Clock className="w-3 h-3" />],
    "Transfer Pending": [`${base} bg-blue-100 text-blue-700`, <Clock className="w-3 h-3" />],
    Transferred: [`${base} bg-green-100 text-green-700`, <CheckCircle className="w-3 h-3" />],
    Failed: [`${base} bg-red-100 text-red-700`, <XCircle className="w-3 h-3" />],
    Refunded: [`${base} bg-slate-100 text-slate-700`, <XCircle className="w-3 h-3" />],
  };
  const [cls, icon] = cfg[status] || [`${base} bg-slate-100 text-slate-700`, null];
  return <span className={cls}>{icon}{status || "-"}</span>;
}

function FormSection({ title }) {
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">{title}</p>;
}

function RequestCard({ request, isSelected, onToggleSelect, onView, onUpload, onLive }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isSelected ? "border-blue-300" : "border-slate-100"}`}>
      <div className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(request.id)}
            className="mt-0.5 h-4 w-4 accent-blue-600 shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-800 text-sm leading-tight flex-1 min-w-0">
                {request.requestorname}
              </p>
              <StatusBadge status={request.status} />
            </div>
            {(request.deceasednames || []).length > 0 && (
              <p className="text-xs text-slate-500 truncate">
                {(request.deceasednames || []).join(", ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs bg-slate-100 text-slate-700 rounded-lg px-2 py-0.5">
                {getServiceLabels(request.selectedservices)}
              </span>
              {request.tahfizcenter?.name && (
                <span className="text-xs text-slate-500 truncate max-w-[140px]">
                  {request.tahfizcenter.name}
                </span>
              )}
            </div>
            {request.referenceno && (
              <p className="text-xs font-mono text-slate-400">{request.referenceno}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-50">
          <button
            onClick={() => onView(request)}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 active:opacity-70"
          >
            <Eye className="w-3.5 h-3.5" />
            {translate("View")}
          </button>
          {request.status === TahlilStatus.ACCEPTED && (
            <button
              onClick={() => onUpload([request.id])}
              className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 active:opacity-70"
            >
              <Upload className="w-3.5 h-3.5" />
              {translate("Upload")}
            </button>
          )}
          {request.liveurl && (
            <button
              onClick={() => onLive(request.liveurl)}
              className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 active:opacity-70"
            >
              <Video className="w-3.5 h-3.5" />
              {translate("Live")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSheet({
  request,
  suggestedDate,
  setSuggestedDate,
  suggestedDateError,
  setSuggestedDateError,
  tahlilPhotoUrls,
  transactionAccount,
  onlineTransactionLoading,
  tahlilPhotoUploading,
  onUploadPhoto,
  onRemovePhoto,
  onStatusChange,
  onSavePhotos,
  updateIsPending,
  onClose,
}) {
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState("");
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!pendingFile) { showError("Please select a photo first."); return; }
    const url = await onUploadPhoto(pendingFile);
    if (url) {
      setPendingFile(null);
      setPendingPreview("");
      setFileKey((k) => k + 1);
    }
  };

  const isPending = request?.status === TahlilStatus.PENDING;
  const isAccepted = request?.status === TahlilStatus.ACCEPTED;
  const isCompleted = request?.status === TahlilStatus.COMPLETED;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <p className="font-semibold text-slate-800">{translate("Tahlil Details")}</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
        <FormSection title={translate("Request Information")} />
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500">{translate("Requestor Name")}</p>
            <p className="font-semibold text-slate-800 text-sm">{request.requestorname}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{translate("Reference No.")}</p>
            <p className="font-mono text-sm text-slate-700 break-all">{request.referenceno || "-"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">{translate("Phone No.")}</p>
              <p className="text-sm text-slate-700">{request.requestorphoneno || "-"}</p>
            </div>
            {request.requestoremail && (
              <div>
                <p className="text-xs text-slate-500">{translate("Email")}</p>
                <p className="text-sm text-slate-700 break-all">{request.requestoremail}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">{translate("Deceased Name")}</p>
            <p className="text-sm text-slate-700">{(request.deceasednames || []).join(", ") || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{translate("Service Type")}</p>
            <span className="inline-block mt-0.5 text-xs bg-slate-200 text-slate-700 rounded-lg px-2 py-0.5">
              {getServiceLabels(request.selectedservices)}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">{translate("Tahfiz Center")}</p>
            <p className="text-sm text-slate-700">{request.tahfizcenter?.name || "-"}</p>
          </div>
          {request.customservice && (
            <div>
              <p className="text-xs text-slate-500">{translate("Custom Service")}</p>
              <p className="text-sm text-slate-700">{request.customservice}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">{translate("Status")}</p>
            <div className="mt-0.5"><StatusBadge status={request.status} /></div>
          </div>
        </div>

        <FormSection title={translate("Suggested Date")} />
        <div className="space-y-1">
          <input
            type="date"
            value={suggestedDate}
            onChange={(e) => {
              setSuggestedDate(e.target.value);
              if (e.target.value) setSuggestedDateError("");
            }}
            disabled={!isPending}
            className={`w-full h-11 rounded-xl border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50 disabled:text-slate-400 ${suggestedDateError ? "border-red-400" : "border-slate-200"}`}
          />
          {suggestedDateError && (
            <p className="text-xs text-red-500">{suggestedDateError}</p>
          )}
        </div>

        {(isAccepted || isCompleted) && (
          <>
            <FormSection title={`${translate("Tahlil Photos")} (${translate("for requestor")})`} />
            {isCompleted && (
              <p className="text-xs text-slate-400">{translate("Upload disabled after completion")}</p>
            )}
            {tahlilPhotoUrls.length > 0 && (
              <div className="space-y-2">
                {tahlilPhotoUrls.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative">
                    <img
                      src={resolveFileUrl(url, "bucket-tahfiz-tahlil")}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      alt={`Tahlil ${idx + 1}`}
                      className="w-full h-48 rounded-xl object-cover border border-slate-200"
                    />
                    {isAccepted && (
                      <button
                        onClick={() => onRemovePhoto(idx)}
                        className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-lg bg-white/80 active:opacity-70"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isAccepted && (
              <div className="space-y-2">
                <input
                  key={fileKey}
                  type="file"
                  accept="image/*"
                  disabled={tahlilPhotoUploading || tahlilPhotoUrls.length >= 1}
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 disabled:opacity-50"
                />
                {tahlilPhotoUploading && (
                  <p className="text-xs text-slate-500">{translate("Uploading...")}</p>
                )}
                {pendingPreview && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{translate("New Photo Preview")}</p>
                    <img src={pendingPreview} alt="preview" className="w-full h-40 rounded-xl object-cover border border-slate-200" />
                  </div>
                )}
                {pendingFile && tahlilPhotoUrls.length < 1 && (
                  <button
                    onClick={handleUpload}
                    disabled={tahlilPhotoUploading}
                    className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-medium active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {translate("Upload")}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <FormSection title={translate("Platform Transfer Status")} />
        <p className="text-xs text-slate-400">
          {translate("This shows the status of fund transfer to the selected recipient.")}
        </p>
        {onlineTransactionLoading && (
          <p className="text-xs text-slate-400">{translate("Loading...")}</p>
        )}
        {!onlineTransactionLoading && !transactionAccount && (
          <p className="text-sm text-slate-400">{translate("No online transaction account found")}</p>
        )}
        {transactionAccount && (
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500">{translate("Status")}</p>
              <div className="mt-0.5"><TransactionStatusBadge status={transactionAccount.status} /></div>
            </div>
            <div>
              <p className="text-xs text-slate-500">{translate("Bank Name")}</p>
              <p className="font-semibold text-sm text-slate-800">{transactionAccount.bankname || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{translate("Account No.")}</p>
              <p className="font-semibold text-sm text-slate-800">{transactionAccount.accountno || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{translate("Reference Transfer No")}</p>
              <p className="font-semibold text-sm text-slate-800">{transactionAccount.referencetransferno ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{translate("Photo")}</p>
              {transactionAccount.photourl ? (
                <img
                  src={resolveFileUrl(transactionAccount.photourl, "online-transaction")}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  alt="Transaction proof"
                  className="mt-1 w-full h-36 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-400">-</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 space-y-2">
        {isPending && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onStatusChange(TahlilStatus.REJECTED)}
              disabled={updateIsPending}
              className="h-12 rounded-xl border border-red-200 text-red-600 font-semibold text-sm active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {translate("Reject")}
            </button>
            <button
              onClick={() => onStatusChange(TahlilStatus.ACCEPTED)}
              disabled={updateIsPending}
              className="h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {translate("Approve")}
            </button>
          </div>
        )}
        {isAccepted && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSavePhotos}
              disabled={updateIsPending}
              className="h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm active:opacity-80 disabled:opacity-50"
            >
              {translate("Save Photos")}
            </button>
            <button
              onClick={() => onStatusChange(TahlilStatus.COMPLETED)}
              disabled={updateIsPending}
              className="h-12 rounded-xl bg-green-600 text-white font-semibold text-sm active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {translate("Mark Completed")}
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm active:opacity-80"
        >
          {translate("Close")}
        </button>
      </div>
    </div>
  );
}

function LiveSheet({ selectedIds, requests, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <p className="font-semibold text-slate-800">
          Live Tahlil ({selectedIds.length})
        </p>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-36">
        {requests
          .filter((r) => selectedIds.includes(r.id))
          .map((request) => (
            <div key={request.id} className="bg-slate-50 rounded-xl p-3">
              <p className="text-sm font-medium text-slate-800">{request.requestorname}</p>
              <p className="text-xs text-slate-500">{request.referenceno}</p>
            </div>
          ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 space-y-2">
        <JitsiController ids={selectedIds} onClose={onClose} />
        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm active:opacity-80"
        >
          {translate("Close")}
        </button>
      </div>
    </div>
  );
}

function UploadSheet({ uploadTargetIds, requests, tahlilPhotoUploading, onUpload, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFileChange = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) { showError("Please select a photo first."); return; }
    await onUpload(file, () => {
      setFile(null);
      setPreview("");
      setFileKey((k) => k + 1);
    });
  };

  const targetRequests = uploadTargetIds
    .map((id) => requests.find((r) => r.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <p className="font-semibold text-slate-800">{translate("Upload Tahlil Photo")}</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{translate("Select Photo")}</p>
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            disabled={tahlilPhotoUploading}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 disabled:opacity-50"
          />
          {preview && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{translate("New Photo Preview")}</p>
              <img src={preview} alt="preview" className="w-full h-36 rounded-xl object-cover border border-slate-200" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500">{translate("Current Photo")}</p>
          <div className="space-y-3">
            {targetRequests.map((request) => {
              const photoUrl =
                Array.isArray(request.photourls) && request.photourls.length > 0
                  ? request.photourls[0]
                  : null;
              return (
                <div key={request.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-800">{request.requestorname}</p>
                  <p className="text-xs text-slate-500">{request.referenceno || "-"}</p>
                  {photoUrl ? (
                    <img
                      src={resolveFileUrl(photoUrl, "bucket-tahfiz-tahlil")}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      alt="current"
                      className="w-full h-28 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <p className="text-xs text-slate-400">{translate("No photo uploaded yet")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
        <button
          onClick={handleUpload}
          disabled={tahlilPhotoUploading || !file}
          className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {tahlilPhotoUploading ? translate("Uploading...") : translate("Upload")}
        </button>
      </div>
    </div>
  );
}

export default function ManageTahlilRequests() {
  const navigate = useNavigate();
  const { loadingUser, isTahfizAdmin, isSuperAdmin, currentUser } = useAdminAccess();

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedReference, setAppliedReference] = useState("");
  const [appliedService, setAppliedService] = useState("");
  const [appliedTahfizId, setAppliedTahfizId] = useState(null);

  const [detailSheet, setDetailSheet] = useState(null);
  const [liveSheetOpen, setLiveSheetOpen] = useState(false);
  const [uploadSheet, setUploadSheet] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedDateError, setSuggestedDateError] = useState("");
  const [tahlilPhotoUrls, setTahlilPhotoUrls] = useState([]);
  const [transactionAccount, setTransactionAccount] = useState(null);
  const [tahlilPhotoUploading, setTahlilPhotoUploading] = useState(false);

  const { loading: permissionsLoading, canView } = useCrudPermissions("tahlil");

  const {
    tahlilRequestList = { items: [], total: 0 },
    totalPages = 0,
    isLoading,
    refetch,
  } = useGetTahlilRequestPaginated({
    page,
    pageSize: itemsPerPage,
    filterStatus: appliedStatus || undefined,
    filterReference: appliedReference || undefined,
    filterService: appliedService || undefined,
    filterTahfizId: appliedTahfizId ?? undefined,
  });

  const updateMutation = useUpdateTahlilRequest();

  const {
    onlineTransaction,
    isLoading: onlineTransactionLoading,
    refetch: refetchOnlineTransaction,
  } = useGetOnlineTransaction({
    referenceno: detailSheet?.referenceno,
    enabled: false,
  });

  useEffect(() => {
    let isActive = true;
    if (!detailSheet?.referenceno) {
      setTransactionAccount(null);
      return () => { isActive = false; };
    }
    refetchOnlineTransaction().then((res) => {
      if (!isActive) return;
      const transaction = res?.data ?? onlineTransaction;
      const accounts = Array.isArray(transaction?.accounts) ? [...transaction.accounts] : [];
      accounts.sort((a, b) => {
        const dateA = a?.createdat ? new Date(a.createdat).getTime() : 0;
        const dateB = b?.createdat ? new Date(b.createdat).getTime() : 0;
        return dateB - dateA;
      });
      setTransactionAccount(accounts[0] ?? null);
    });
    return () => { isActive = false; };
  }, [detailSheet, refetchOnlineTransaction, onlineTransaction]);

  const serviceOptions = useMemo(() => {
    const serviceSet = new Set();
    tahlilRequestList.items.forEach((request) => {
      (request.selectedservices || []).forEach((service) => {
        if (service) serviceSet.add(service);
      });
    });
    return Array.from(serviceSet).sort((a, b) => a.localeCompare(b));
  }, [tahlilRequestList.items]);

  const tahfizOptions = useMemo(() => {
    if (isSuperAdmin) {
      const map = new Map();
      tahlilRequestList.items.forEach((request) => {
        if (!request.tahfizcenter?.id) return;
        map.set(request.tahfizcenter.id, request.tahfizcenter.name || `#${request.tahfizcenter.id}`);
      });
      return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }));
    }
    if (currentUser?.tahfizcenter?.id) {
      return [{
        value: String(currentUser.tahfizcenter.id),
        label: currentUser.tahfizcenter.name || translate("Pusat Tahfiz"),
      }];
    }
    return [];
  }, [currentUser?.tahfizcenter, isSuperAdmin, tahlilRequestList.items]);

  const findRequestById = (id) =>
    tahlilRequestList.items.find((item) => item.id === id) ||
    (detailSheet?.id === id ? detailSheet : null);

  const openDetailSheet = (request) => {
    setDetailSheet(request);
    setSuggestedDate(
      request?.suggesteddate ? new Date(request.suggesteddate).toISOString().slice(0, 10) : ""
    );
    setTahlilPhotoUrls(Array.isArray(request?.photourls) ? request.photourls : []);
    setTransactionAccount(null);
    setSuggestedDateError("");
  };

  const closeDetailSheet = () => {
    setDetailSheet(null);
    setSuggestedDate("");
    setSuggestedDateError("");
    setTahlilPhotoUrls([]);
    setTransactionAccount(null);
  };

  const uploadTahlilPhoto = async (file) => {
    if (!file) return null;
    setTahlilPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch("/api/upload/bucket-tahfiz-tahlil", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }
      const data = await res.json();
      return data.file_url || null;
    } catch {
      showError("Failed To Upload File");
      return null;
    } finally {
      setTahlilPhotoUploading(false);
    }
  };

  const persistTahlilPhotos = async ({ requestId, status, suggesteddate, photourls }) => {
    await updateMutation.mutateAsync({
      id: requestId,
      data: { status, suggesteddate: suggesteddate ?? null, photourls },
    });
  };

  const handleDetailUpload = async (file) => {
    if (!detailSheet) return null;
    const fileUrl = await uploadTahlilPhoto(file);
    if (!fileUrl) return null;
    const nextUrls = [fileUrl];
    setTahlilPhotoUrls(nextUrls);
    await persistTahlilPhotos({
      requestId: detailSheet.id,
      status: detailSheet.status,
      suggesteddate: detailSheet.suggesteddate ?? null,
      photourls: nextUrls,
    });
    return fileUrl;
  };

  const handleRemovePhoto = (index) => {
    if (!detailSheet) return;
    const nextUrls = tahlilPhotoUrls.filter((_, i) => i !== index);
    setTahlilPhotoUrls(nextUrls);
    if (detailSheet.status === TahlilStatus.ACCEPTED) {
      persistTahlilPhotos({
        requestId: detailSheet.id,
        status: detailSheet.status,
        suggesteddate: detailSheet.suggesteddate ?? null,
        photourls: nextUrls,
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!detailSheet) return;
    const payload = {
      status: newStatus,
      suggesteddate: "",
      photourls: tahlilPhotoUrls,
      referenceno: detailSheet.referenceno ?? null,
    };
    if (newStatus === TahlilStatus.ACCEPTED) {
      if (!suggestedDate) {
        setSuggestedDateError(translate("Suggested date is required when accepting request."));
        return;
      }
      setSuggestedDateError("");
      payload.suggesteddate = suggestedDate;
    }
    if (newStatus === TahlilStatus.COMPLETED) {
      payload.suggesteddate = detailSheet?.suggesteddate ?? null;
    }
    await updateMutation.mutateAsync({ id: detailSheet.id, data: payload });
    closeDetailSheet();
    refetch();
  };

  const handleSavePhotos = async () => {
    if (!detailSheet) return;
    await persistTahlilPhotos({
      requestId: detailSheet.id,
      status: detailSheet.status,
      suggesteddate: detailSheet.suggesteddate ?? null,
      photourls: tahlilPhotoUrls,
    });
    closeDetailSheet();
    refetch();
  };

  const handleUploadSheetUpload = async (file, onSuccess) => {
    const acceptedRequests = (uploadSheet || [])
      .map((id) => findRequestById(id))
      .filter((req) => req && req.status === TahlilStatus.ACCEPTED);

    if (acceptedRequests.length === 0) {
      showError("Photos can only be uploaded after approval.");
      return;
    }

    const fileUrl = await uploadTahlilPhoto(file);
    if (!fileUrl) return;

    await Promise.all(
      acceptedRequests.map((req) =>
        persistTahlilPhotos({
          requestId: req.id,
          status: req.status,
          suggesteddate: req.suggesteddate ?? null,
          photourls: [fileUrl],
        })
      )
    );

    if (acceptedRequests.length !== (uploadSheet || []).length) {
      showError("Some requests were skipped because they are not approved.");
    }

    if (detailSheet && acceptedRequests.some((req) => req.id === detailSheet.id)) {
      setTahlilPhotoUrls([fileUrl]);
    }

    onSuccess?.();
    setUploadSheet(null);
    refetch();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tahlilRequestList.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tahlilRequestList.items.map((r) => r.id));
    }
  };

  const joinRoom = (liveRoom) => {
    if (!liveRoom) return;
    navigate(createPageUrl("JitsiRoom") + `?room=${liveRoom}`);
  };

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!isTahfizAdmin && !isSuperAdmin) return <AccessDeniedComponent />;
  if (!canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6">
        <BackNavigation title={translate("Manage Tahlil Requests")} />
        <div className="max-w-2xl mx-auto px-3 space-y-3">

          {/* Filter toggle */}
          <div className="flex items-center">
            <AdvancedFilters
              parameter={[
                { label: translate("Reference No."), type: "text", searchColumn: "reference" },
                { label: translate("Status"), type: "select", searchColumn: "status", options: [
                  { id: TahlilStatus.PENDING, name: translate("Pending") },
                  { id: TahlilStatus.ACCEPTED, name: translate("Accepted") },
                  { id: TahlilStatus.COMPLETED, name: translate("Completed") },
                  { id: TahlilStatus.REJECTED, name: translate("Rejected") },
                ]},
                { label: translate("Service Type"), type: "select", searchColumn: "service", options: serviceOptions.map(s => ({ id: s, name: s })) },
                ...(isSuperAdmin ? [{ label: translate("Tahfiz Center"), type: "select", searchColumn: "tahfiz", options: tahfizOptions.map(o => ({ id: o.value, name: o.label })) }] : []),
              ]}
              onApplyFilter={(f) => {
                setAppliedStatus(f.status || "");
                setAppliedReference(f.reference || "");
                setAppliedService(f.service || "");
                setAppliedTahfizId(f.tahfiz ? Number(f.tahfiz) : null);
                setPage(1);
              }}
            />
          </div>

          {/* Bulk action bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-4 py-2.5">
              <span className="text-xs text-blue-700 font-medium flex-1">
                {selectedIds.length} {translate("selected")}
              </span>
              <button
                onClick={() => setLiveSheetOpen(true)}
                className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-purple-600 bg-purple-100 active:opacity-70"
              >
                <Video className="w-3.5 h-3.5" />
                {translate("Live Tahlil")}
              </button>
              <button
                onClick={() => setUploadSheet(selectedIds)}
                className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-blue-600 bg-blue-100 active:opacity-70"
              >
                <Upload className="w-3.5 h-3.5" />
                {translate("Upload Photo")}
              </button>
            </div>
          )}

          {/* Select all row */}
          {tahlilRequestList.items.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === tahlilRequestList.items.length &&
                  tahlilRequestList.items.length > 0
                }
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="text-xs text-slate-500">{translate("Select all")}</span>
            </div>
          )}

          {isLoading ? (
            <InlineLoadingComponent isPage/>
          ) : tahlilRequestList.items.length === 0 ? (
            <MobileEmptyList icon={Receipt} title={translate("No records")} />
          ) : (
            tahlilRequestList.items.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isSelected={selectedIds.includes(request.id)}
                onToggleSelect={toggleSelect}
                onView={openDetailSheet}
                onUpload={setUploadSheet}
                onLive={joinRoom}
              />
            ))
          )}

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={() => setPage(1)}
                totalItems={tahlilRequestList.total}
              />
            </div>
          )}
        </div>
      </div>

      {detailSheet && (
        <DetailSheet
          request={detailSheet}
          suggestedDate={suggestedDate}
          setSuggestedDate={setSuggestedDate}
          suggestedDateError={suggestedDateError}
          setSuggestedDateError={setSuggestedDateError}
          tahlilPhotoUrls={tahlilPhotoUrls}
          transactionAccount={transactionAccount}
          onlineTransactionLoading={onlineTransactionLoading}
          tahlilPhotoUploading={tahlilPhotoUploading}
          onUploadPhoto={handleDetailUpload}
          onRemovePhoto={handleRemovePhoto}
          onStatusChange={handleStatusChange}
          onSavePhotos={handleSavePhotos}
          updateIsPending={updateMutation.isPending}
          onClose={closeDetailSheet}
        />
      )}

      {liveSheetOpen && (
        <LiveSheet
          selectedIds={selectedIds}
          requests={tahlilRequestList.items}
          onClose={() => setLiveSheetOpen(false)}
        />
      )}

      {uploadSheet && (
        <UploadSheet
          uploadTargetIds={uploadSheet}
          requests={tahlilRequestList.items}
          tahlilPhotoUploading={tahlilPhotoUploading}
          onUpload={handleUploadSheetUpload}
          onClose={() => setUploadSheet(null)}
        />
      )}
    </>
  );
}
