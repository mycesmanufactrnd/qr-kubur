// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  ChevronRight,
  FileText,
  MapPin,
  X,
  Upload,
  Image,
} from "lucide-react";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { translate } from "@/utils/translations";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import { formatRM } from "@/utils/helpers";
import {
  useGetQuotationPaginated,
  useUpdateQuotation,
} from "@/hooks/useQuotationMutations";
import { ORG_SERVICE_FEE, ORG_SHARE, QuotationStatus } from "@/utils/enums";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { showError } from "@/components/ToastrNotification";
import DirectionButton from "@/components/DirectionButton";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";

function StatusBadge({ status }) {
  switch (status) {
    case QuotationStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {translate("Pending")}
        </Badge>
      );
    case QuotationStatus.COMPLETED:
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          {translate("Completed")}
        </Badge>
      );
    case QuotationStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          {translate("Rejected")}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}

function QuotationCard({ q, onClick }) {
  const orgAmount =
    q.serviceamount != null
      ? formatRM(Number(q.serviceamount) * ORG_SHARE)
      : formatRM(q.totalamount);

  return (
    <button
      onClick={() => onClick(q)}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-2 active:opacity-70 transition-opacity"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
            {q.payername || translate("No Name")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {q.referenceno || "-"}
          </p>
        </div>
        <StatusBadge status={q.status} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate max-w-[55%]">
          {q.organisation?.name || "-"}
        </span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
          {orgAmount}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>
          {(q.selectedservices || []).length} {translate("Services")}
        </span>
        <span>{new Date(q.createdat).toLocaleDateString("ms-MY")}</span>
      </div>

      <div className="flex items-center justify-end">
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>
    </button>
  );
}

function DetailSheet({ quotation, onClose, canVerify, canReject }) {
  const updateMutation = useUpdateQuotation();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState(quotation?.photourl || "");

  useEffect(() => {
    setLocalPhotoUrl(quotation?.photourl || "");
    setPreview("");
    setFile(null);
  }, [quotation]);

  if (!quotation) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch(
        `/api/upload/bucket-organisation-services-proof`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || translate("Failed to upload photo"));
        return;
      }
      const data = await res.json();
      await updateMutation.mutateAsync({
        id: quotation.id,
        data: { photourl: data.file_url },
      });
      setLocalPhotoUrl(data.file_url);
      setFile(null);
      setPreview("");
    } catch {
      showError(translate("Failed to upload photo"));
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    await updateMutation.mutateAsync({
      id: quotation.id,
      data: { status: QuotationStatus.COMPLETED },
    });
    onClose();
  };

  const handleReject = async () => {
    await updateMutation.mutateAsync({
      id: quotation.id,
      data: { status: QuotationStatus.REJECTED },
    });
    onClose();
  };

  const svc =
    quotation.serviceamount != null ? Number(quotation.serviceamount) : null;
  const photoReady = !!(preview || localPhotoUrl);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
            {quotation.payername || translate("No Name")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {quotation.referenceno || "-"}
          </p>
        </div>
        <StatusBadge status={quotation.status} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-32">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2 text-sm">
          <Row
            label={translate("Organisation")}
            value={quotation.organisation?.name || "-"}
          />
          {quotation.payeremail && (
            <Row label={translate("Email")} value={quotation.payeremail} />
          )}
          {quotation.payerphone && (
            <Row label={translate("Phone")} value={quotation.payerphone} />
          )}
          {quotation.deadperson?.name && (
            <Row
              label={translate("Deceased")}
              value={quotation.deadperson.name}
            />
          )}
        </div>

        {(quotation.organisation?.latitude ||
          quotation.organisation?.longitude) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {translate("Location")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {Number(quotation.organisation.latitude).toFixed(5)},{" "}
                {Number(quotation.organisation.longitude).toFixed(5)}
              </span>
            </div>
            <DirectionButton
              latitude={quotation.organisation.latitude}
              longitude={quotation.organisation.longitude}
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {translate("Selected Services")}
          </p>
          <div className="space-y-1">
            {(quotation.selectedservices || []).map((s, i) => (
              <div
                key={i}
                className="flex justify-between text-sm bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  {s.service}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatRM(s.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-2 space-y-1.5 text-sm">
            {svc != null ? (
              <>
                <AmountRow
                  label={translate("Service Amount")}
                  value={formatRM(svc)}
                />
                <AmountRow
                  label={`${translate("Platform Fee")} (5%)`}
                  value={formatRM(svc * ORG_SERVICE_FEE)}
                  valueClass="text-red-500"
                />
                <AmountRow
                  label={`${translate("Organisation Amount")} (95%)`}
                  value={formatRM(svc * ORG_SHARE)}
                  valueClass="text-emerald-700 font-bold"
                  bold
                />
              </>
            ) : (
              <AmountRow
                label={translate("Total Amount")}
                value={formatRM(quotation.totalamount)}
                valueClass="text-emerald-700 font-bold"
                bold
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {translate("Completion Photo")}
          </p>

          {preview || localPhotoUrl ? (
            <img
              src={
                preview ||
                resolveFileUrl(
                  localPhotoUrl,
                  "bucket-organisation-services-proof",
                )
              }
              alt={translate("Completion photo")}
              className="w-full h-48 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
            />
          ) : (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-300 dark:text-slate-600">
              <Image className="w-10 h-10" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 active:opacity-70 disabled:opacity-50 transition-opacity"
            >
              <Camera className="w-4 h-4" />
              {translate("Take / Choose Photo")}
            </button>
            {file && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white text-sm font-medium active:opacity-80 disabled:opacity-50 transition-opacity"
              >
                <Upload className="w-4 h-4" />
                {uploading ? translate("Uploading...") : translate("Upload")}
              </button>
            )}
          </div>
        </div>
      </div>

      {quotation.status === QuotationStatus.PENDING && (
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-2 safe-area-bottom">
          {canVerify && (
            <button
              onClick={handleComplete}
              disabled={updateMutation.isPending || !photoReady}
              className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              <CheckCircle className="w-5 h-5" />
              {translate("Mark as Completed")}
            </button>
          )}
          {!photoReady && canVerify && (
            <p className="text-xs text-center text-amber-600">
              {translate("Upload completion photo to enable")}
            </p>
          )}
          {canReject && (
            <button
              onClick={handleReject}
              disabled={updateMutation.isPending}
              className="w-full h-11 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              <XCircle className="w-4 h-4" />
              {translate("Reject")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">
        {label}
      </span>
      <span className="text-slate-800 dark:text-slate-200 text-right break-all">
        {value}
      </span>
    </div>
  );
}

function AmountRow({ label, value, valueClass = "", bold = false }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

export default function MobileManageQuotations() {
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canVerify,
    canReject,
  } = useCrudPermissions("quotations");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);

  const [appliedService, setAppliedService] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const { quotationList, totalPages, isLoading } = useGetQuotationPaginated({
    page,
    pageSize: itemsPerPage,
    filterStatus: appliedStatus || null,
    filterService: appliedService || null,
    dateFrom: appliedDateFrom || null,
    dateTo: appliedDateTo || null,
  });

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [selected]);

  if (loadingUser || permissionsLoading) return <PageLoadingComponent />;
  if (!hasAdminAccess || !canView) return <AccessDeniedComponent />;

  return (
    <>
      <div className="min-h-screen pb-6 ">
        <BackNavigation title={translate("Manage Quotations")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          <div className="flex items-center">
            <AdvancedFilters
              parameter={[
                {
                  label: translate("Status"),
                  type: "select",
                  searchColumn: "status",
                  options: [
                    { id: "pending", name: translate("Pending") },
                    { id: "completed", name: translate("Completed") },
                    { id: "rejected", name: translate("Rejected") },
                  ],
                },
                {
                  label: translate("Service"),
                  type: "text",
                  searchColumn: "service",
                },
                {
                  label: translate("Date From"),
                  type: "date",
                  searchColumn: "dateFrom",
                },
                {
                  label: translate("Date To"),
                  type: "date",
                  searchColumn: "dateTo",
                },
              ]}
              onApplyFilter={(f) => {
                setAppliedStatus(f.status || "");
                setAppliedService(f.service || "");
                setAppliedDateFrom(f.dateFrom || "");
                setAppliedDateTo(f.dateTo || "");
                setPage(1);
              }}
            />
          </div>

          {isLoading ? (
            <InlineLoadingComponent isPage />
          ) : quotationList.items.length === 0 ? (
            <NoDataCardComponent isPage />
          ) : (
            <div className="space-y-3">
              {quotationList.items.map((q) => (
                <QuotationCard key={q.id} q={q} onClick={setSelected} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={() => {}}
                totalItems={quotationList.total}
              />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DetailSheet
          quotation={selected}
          onClose={() => setSelected(null)}
          canVerify={canVerify}
          canReject={canReject}
        />
      )}
    </>
  );
}
