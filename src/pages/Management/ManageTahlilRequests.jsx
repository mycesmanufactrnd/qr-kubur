import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Video,
  Trash2,
  Upload,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { getServiceLabels, TahlilStatus } from "@/utils/enums";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import {
  useGetTahlilRequestPaginated,
  useUpdateTahlilRequest,
} from "@/hooks/useTahlilRequestMutations";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import JitsiController from "@/components/jitsi/JitsiController";
import { createPageUrl, resolveFileUrl } from "@/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showError } from "@/components/ToastrNotification";
import { useGetOnlineTransaction } from "@/hooks/usePaymentDistributionMutation";

export default function ManageTahlilRequests() {
  const navigate = useNavigate();
  const { loadingUser, isTahfizAdmin, isSuperAdmin, currentUser } =
    useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlStatus = searchParams.get("status") || "all";
  const urlReference = searchParams.get("reference") || "";
  const urlService = searchParams.get("service") || "all";
  const urlTahfiz = searchParams.get("tahfiz") || "all";

  const [tempStatus, setTempStatus] = useState(urlStatus);
  const [tempReference, setTempReference] = useState(urlReference);
  const [tempService, setTempService] = useState(urlService);
  const [tempTahfiz, setTempTahfiz] = useState(urlTahfiz);
  const lockedTahfizValue = currentUser?.tahfizcenter?.id
    ? String(currentUser.tahfizcenter.id)
    : "all";

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLiveDialogOpen, setIsLiveDialogOpen] = useState(false);
  const [tahlilPhotoUrls, setTahlilPhotoUrls] = useState([]);
  const [transactionAccount, setTransactionAccount] = useState(null);
  const [tahlilPhotoUploading, setTahlilPhotoUploading] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState("");
  const [dialogFileKey, setDialogFileKey] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTargets, setUploadTargets] = useState([]);
  const [uploadDialogFile, setUploadDialogFile] = useState(null);
  const [uploadDialogPreview, setUploadDialogPreview] = useState("");
  const [uploadDialogFileKey, setUploadDialogFileKey] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const { loading: permissionsLoading, canView } = useCrudPermissions("tahlil");

  useEffect(() => {
    setTempStatus(urlStatus);
    setTempReference(urlReference);
    setTempService(urlService);
    setTempTahfiz(isSuperAdmin ? urlTahfiz : lockedTahfizValue);
  }, [
    urlStatus,
    urlReference,
    urlService,
    urlTahfiz,
    isSuperAdmin,
    lockedTahfizValue,
  ]);

  const {
    tahlilRequestList = { items: [], total: 0 },
    totalPages = 0,
    isLoading,
    refetch,
  } = useGetTahlilRequestPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterStatus: urlStatus !== "all" ? urlStatus : undefined,
    filterReference: urlReference || undefined,
    filterService: urlService !== "all" ? urlService : undefined,
    filterTahfizId: (() => {
      if (!isSuperAdmin || urlTahfiz === "all") return undefined;
      const parsed = Number(urlTahfiz);
      return Number.isNaN(parsed) ? undefined : parsed;
    })(),
  });

  const updateMutation = useUpdateTahlilRequest();

  const {
    onlineTransaction,
    isLoading: onlineTransactionLoading,
    refetch: refetchOnlineTransaction,
  } = useGetOnlineTransaction({
    referenceno: selectedRequest?.referenceno,
    enabled: false,
  });

  const statusOptions = [
    { value: "all", label: translate("All Status") },
    { value: TahlilStatus.PENDING, label: translate("Pending") },
    { value: TahlilStatus.ACCEPTED, label: translate("Accepted") },
    { value: TahlilStatus.COMPLETED, label: translate("Completed") },
    { value: TahlilStatus.REJECTED, label: translate("Rejected") },
  ];

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
        map.set(
          request.tahfizcenter.id,
          request.tahfizcenter.name || `#${request.tahfizcenter.id}`,
        );
      });
      return Array.from(map.entries()).map(([id, name]) => ({
        value: String(id),
        label: name,
      }));
    }

    if (currentUser?.tahfizcenter?.id) {
      return [
        {
          value: String(currentUser.tahfizcenter.id),
          label: currentUser.tahfizcenter.name || translate("Pusat Tahfiz"),
        },
      ];
    }

    return [];
  }, [currentUser?.tahfizcenter, isSuperAdmin, tahlilRequestList.items]);

  const handleSearch = () => {
    const params = { page: "1" };
    const trimmedReference = tempReference.trim();

    if (trimmedReference) params.reference = trimmedReference;
    if (tempStatus !== "all") params.status = tempStatus;
    if (tempService !== "all") params.service = tempService;
    if (isSuperAdmin && tempTahfiz !== "all") params.tahfiz = tempTahfiz;

    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const findRequestById = (id) =>
    tahlilRequestList.items.find((item) => item.id === id) ||
    (selectedRequest?.id === id ? selectedRequest : null);

  const openDetailDialog = (request) => {
    setSelectedRequest(request);
    setSuggestedDate(
      request?.suggesteddate
        ? new Date(request.suggesteddate).toISOString().slice(0, 10)
        : "",
    );
    setTahlilPhotoUrls(
      Array.isArray(request?.photourls) ? request.photourls : [],
    );
    setTransactionAccount(null);
    setPendingPhotoFile(null);
    setPendingPhotoPreview("");
    setDialogFileKey((prev) => prev + 1);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    let isActive = true;

    if (!selectedRequest?.referenceno) {
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
  }, [selectedRequest, refetchOnlineTransaction, onlineTransaction]);

  const uploadTahlilPhoto = async (file) => {
    if (!file) return;

    setTahlilPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

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
    } catch (err) {
      console.error("Fetch error:", err);
      showError("Failed To Upload File");
      return null;
    } finally {
      setTahlilPhotoUploading(false);
    }
  };

  const persistTahlilPhotos = async ({
    requestId,
    status,
    suggesteddate,
    photourls,
  }) => {
    await updateMutation.mutateAsync({
      id: requestId,
      data: {
        status,
        suggesteddate: suggesteddate ?? null,
        photourls,
      },
    });
  };

  const handleDialogFileChange = (file) => {
    if (!file) return;
    setPendingPhotoFile(file);
    setPendingPhotoPreview(URL.createObjectURL(file));
  };

  const handleDialogUpload = async () => {
    if (!selectedRequest) return;
    if (selectedRequest.status !== TahlilStatus.ACCEPTED) {
      showError("Photos can only be uploaded after approval.");
      return;
    }
    if (!pendingPhotoFile) {
      showError("Please select a photo first.");
      return;
    }

    const fileUrl = await uploadTahlilPhoto(pendingPhotoFile);
    if (!fileUrl) return;

    const nextUrls = [fileUrl];
    setTahlilPhotoUrls(nextUrls);
    setPendingPhotoFile(null);
    setPendingPhotoPreview("");
    setDialogFileKey((prev) => prev + 1);
    await persistTahlilPhotos({
      requestId: selectedRequest.id,
      status: selectedRequest.status,
      suggesteddate: selectedRequest.suggesteddate ?? null,
      photourls: nextUrls,
    });
  };

  const handleRemovePhoto = (index) => {
    if (!selectedRequest) return;
    const nextUrls = tahlilPhotoUrls.filter((_, i) => i !== index);
    setTahlilPhotoUrls(nextUrls);
    if (selectedRequest.status === TahlilStatus.ACCEPTED) {
      persistTahlilPhotos({
        requestId: selectedRequest.id,
        status: selectedRequest.status,
        suggesteddate: selectedRequest.suggesteddate ?? null,
        photourls: nextUrls,
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRequest) return;

    const payload = {
      status: newStatus,
      suggesteddate: "",
      photourls: tahlilPhotoUrls,
    };

    if (newStatus === TahlilStatus.ACCEPTED) {
      if (!suggestedDate) {
        showError("Suggested date is required when accepting request.");
        return;
      }

      payload.suggesteddate = suggestedDate;
    }

    if (newStatus === TahlilStatus.COMPLETED) {
      payload.suggesteddate = selectedRequest?.suggesteddate ?? null;
    }

    await updateMutation.mutateAsync({ id: selectedRequest.id, data: payload });
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setSuggestedDate("");
    setTahlilPhotoUrls([]);
    refetch();
  };

  const handleSavePhotos = async () => {
    if (!selectedRequest) return;

    await persistTahlilPhotos({
      requestId: selectedRequest.id,
      status: selectedRequest.status,
      suggesteddate: selectedRequest.suggesteddate ?? null,
      photourls: tahlilPhotoUrls,
    });

    setIsDialogOpen(false);
    setSelectedRequest(null);
    setSuggestedDate("");
    setTahlilPhotoUrls([]);
    refetch();
  };

  const openUploadDialogForRequests = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setUploadTargets(ids);
    setUploadDialogFile(null);
    setUploadDialogPreview("");
    setUploadDialogFileKey((prev) => prev + 1);
    setUploadDialogOpen(true);
  };

  const handleUploadDialogFileChange = (file) => {
    if (!file) return;
    setUploadDialogFile(file);
    setUploadDialogPreview(URL.createObjectURL(file));
  };

  const handleUploadDialogUpload = async () => {
    if (!uploadDialogFile) {
      showError("Please select a photo first.");
      return;
    }

    const acceptedRequests = uploadTargets
      .map((id) => findRequestById(id))
      .filter((req) => req && req.status === TahlilStatus.ACCEPTED);

    if (acceptedRequests.length === 0) {
      showError("Photos can only be uploaded after approval.");
      return;
    }

    const fileUrl = await uploadTahlilPhoto(uploadDialogFile);
    if (!fileUrl) return;

    await Promise.all(
      acceptedRequests.map((req) =>
        persistTahlilPhotos({
          requestId: req.id,
          status: req.status,
          suggesteddate: req.suggesteddate ?? null,
          photourls: [fileUrl],
        }),
      ),
    );

    if (acceptedRequests.length !== uploadTargets.length) {
      showError("Some requests were skipped because they are not approved.");
    }

    if (
      selectedRequest &&
      acceptedRequests.some((req) => req.id === selectedRequest.id)
    ) {
      setTahlilPhotoUrls([fileUrl]);
    }

    setUploadDialogOpen(false);
    setUploadDialogFile(null);
    setUploadDialogPreview("");
    setUploadDialogFileKey((prev) => prev + 1);
    refetch();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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

  const getStatusBadge = (status) => {
    switch (status) {
      case TahlilStatus.PENDING:
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Pending")}
          </Badge>
        );
      case TahlilStatus.ACCEPTED:
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Accepted")}
          </Badge>
        );
      case TahlilStatus.COMPLETED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Completed")}
          </Badge>
        );
      case TahlilStatus.REJECTED:
        return (
          <Badge variant="default" className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Rejected")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="">
            {status}
          </Badge>
        );
    }
  };

  const getTransactionStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Pending")}
          </Badge>
        );
      case "Paid":
        return (
          <Badge variant="default" className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Paid")}
          </Badge>
        );
      case "Held":
        return (
          <Badge variant="default" className="bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Held")}
          </Badge>
        );
      case "Transfer Pending":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            {translate("Transfer Pending")}
          </Badge>
        );
      case "Transferred":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translate("Transferred")}
          </Badge>
        );
      case "Failed":
        return (
          <Badge variant="default" className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Failed")}
          </Badge>
        );
      case "Refunded":
        return (
          <Badge variant="default" className="bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3 mr-1" />
            {translate("Refunded")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="">
            {status || "-"}
          </Badge>
        );
    }
  };

  const ImageWithLoader = ({ src, alt }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
      <div className="relative mt-2 h-28 w-full">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded border">
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded border">
            <span className="text-xs text-red-400">Failed to load image</span>
          </div>
        )}

        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-28 w-full rounded object-cover border transition-opacity duration-300 ${
            loading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </div>
    );
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!isTahfizAdmin && !isSuperAdmin) {
    return <AccessDeniedComponent />;
  }

  if (!canView)
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            {
              label: isSuperAdmin
                ? translate("Super Admin Dashboard")
                : translate("Tahfiz Dashboard"),
              page: isSuperAdmin ? "SuperadminDashboard" : "TahfizDashboard",
            },
            {
              label: translate("Manage Tahlil Requests"),
              page: "ManageTahlilRequests",
            },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          {
            label: isSuperAdmin
              ? translate("Super Admin Dashboard")
              : translate("Tahfiz Dashboard"),
            page: isSuperAdmin ? "SuperadminDashboard" : "TahfizDashboard",
          },
          {
            label: translate("Manage Tahlil Requests"),
            page: "ManageTahlilRequests",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {translate("Manage Tahlil Requests")}
          </h1>
        </div>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate("Reference No.")}
                value={tempReference}
                onChange={(e) => setTempReference(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              {translate("Search")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={tempStatus} onValueChange={setTempStatus}>
              <SelectTrigger>
                <SelectValue placeholder={translate("All Status")} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tempService} onValueChange={setTempService}>
              <SelectTrigger>
                <SelectValue placeholder={translate("Service Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("All Services")}</SelectItem>
                {serviceOptions.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={tempTahfiz}
              onValueChange={setTempTahfiz}
              disabled={!isSuperAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder={translate("Pusat Tahfiz")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {translate("All Tahfiz Centers")}
                </SelectItem>
                {tahfizOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" /> {translate("Reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={selectedIds.length === 0}
                onClick={() => setIsLiveDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Live Tahlil ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                disabled={selectedIds.length === 0}
                onClick={() => openUploadDialogForRequests(selectedIds)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo ({selectedIds.length})
              </Button>
            </div>
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
                <TableHead>{translate("Requestor Name")}</TableHead>
                <TableHead className="text-center">
                  {translate("Deceased Name")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Service Type")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Tahfiz Center")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Reference No.")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Status")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={7} />
              ) : tahlilRequestList.items.length === 0 ? (
                <NoDataTableComponent colSpan={7} />
              ) : (
                tahlilRequestList.items.map((request) => (
                  <TableRow
                    key={request.id}
                    className={
                      selectedIds.includes(request.id)
                        ? "bg-blue-50 dark:bg-gray-700"
                        : ""
                    }
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => toggleSelect(request.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.requestorname}
                    </TableCell>
                    <TableCell className="text-center">
                      {(request.deceasednames || []).join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {getServiceLabels(request.selectedservices)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-center">
                      {request.tahfizcenter?.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-center">
                      {request.referenceno || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(request)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      {request.status === TahlilStatus.ACCEPTED && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openUploadDialogForRequests([request.id])
                            }
                            disabled={tahlilPhotoUploading}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {request.liveurl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => joinRoom(request.liveurl)}
                        >
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
              currentPage={urlPage}
              totalPages={totalPages}
              onPageChange={(value) => {
                setSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: value.toString(),
                });
              }}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: "1",
                });
              }}
              totalItems={tahlilRequestList.total}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setSuggestedDate("");
            setTahlilPhotoUrls([]);
            setTransactionAccount(null);
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-[65vw] max-h-[85vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {translate("Tahlil Details")}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Requestor Name")}
                    </p>
                    <p className="font-semibold">
                      {selectedRequest.requestorname}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Reference No.")}
                    </p>
                    <p className="font-mono text-sm break-all bg-gray-50 p-1.5 rounded">
                      {selectedRequest.referenceno || "-"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Phone No.")}
                    </p>
                    <p className="font-semibold">
                      {selectedRequest.requestorphoneno}
                    </p>
                  </div>
                  {selectedRequest.requestoremail && (
                    <div>
                      <p className="text-sm text-gray-500">
                        {translate("Email")}
                      </p>
                      <p>{selectedRequest.requestoremail}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Deceased Name")}
                  </p>
                  <p>{(selectedRequest.deceasednames || []).join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Service Type")}
                  </p>
                  <Badge variant="outline">
                    {getServiceLabels(selectedRequest.selectedservices)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Tahfiz Center")}
                  </p>
                  <p>{selectedRequest.tahfizcenter?.name}</p>
                </div>
                {selectedRequest.customservice && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {translate("Custom Service")}
                    </p>
                    <p>{selectedRequest.customservice}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">{translate("Status")}</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {translate("Suggested Date")}
                  </p>
                  <Input
                    type="date"
                    value={suggestedDate}
                    onChange={(event) => setSuggestedDate(event.target.value)}
                    disabled={selectedRequest?.status !== TahlilStatus.PENDING}
                    className="mt-1"
                  />
                </div>
                {(selectedRequest?.status === TahlilStatus.ACCEPTED ||
                  selectedRequest?.status === TahlilStatus.COMPLETED) && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      {`${translate("Tahlil Photos")} (${translate("for requestor")})`}
                    </p>
                    {selectedRequest?.status === TahlilStatus.COMPLETED && (
                      <p className="text-xs text-gray-400">
                        {translate("Upload disabled after completion")}
                      </p>
                    )}
                    {tahlilPhotoUrls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {tahlilPhotoUrls.map((url, idx) => (
                          <div key={`${url}-${idx}`} className="relative">
                            <img
                              src={resolveFileUrl(url, "bucket-tahfiz-tahlil")}
                              alt={`Tahlil ${idx + 1}`}
                              className="h-40 w-full rounded object-cover border"
                            />
                            {selectedRequest?.status ===
                              TahlilStatus.ACCEPTED && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                                onClick={() => handleRemovePhoto(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedRequest?.status === TahlilStatus.ACCEPTED && (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <Input
                            key={dialogFileKey}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleDialogFileChange(e.target.files?.[0])
                            }
                            disabled={
                              tahlilPhotoUploading ||
                              tahlilPhotoUrls.length >= 1
                            }
                          />
                          <Button
                            type="button"
                            onClick={handleDialogUpload}
                            disabled={
                              tahlilPhotoUploading ||
                              !pendingPhotoFile ||
                              tahlilPhotoUrls.length >= 1
                            }
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {translate("Upload")}
                          </Button>
                        </div>
                        {tahlilPhotoUploading && (
                          <span className="text-sm text-gray-500">
                            {translate("Uploading...")}
                          </span>
                        )}
                        {pendingPhotoPreview && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              {translate("New Photo Preview")}
                            </p>
                            <img
                              src={pendingPhotoPreview}
                              alt={translate("Pending upload")}
                              className="h-32 w-full rounded object-cover border"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {`${translate("Platform Transfer Status")} - ${translate("Tahlil Request")}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {translate(
                      "This shows the status of fund transfer to the selected recipient.",
                    )}
                  </p>
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
                        {translate("Account No.")}
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
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate("Close")}
            </Button>
            {selectedRequest?.status === TahlilStatus.PENDING && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange(TahlilStatus.REJECTED)}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {translate("Reject")}
                </Button>
                <Button
                  onClick={() => handleStatusChange(TahlilStatus.ACCEPTED)}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {translate("Approve")}
                </Button>
              </>
            )}
            {selectedRequest?.status === TahlilStatus.ACCEPTED && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSavePhotos}
                  disabled={updateMutation.isPending}
                >
                  {translate("Save Photos")}
                </Button>
                <Button
                  onClick={() => handleStatusChange(TahlilStatus.COMPLETED)}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {translate("Mark Completed")}
                </Button>
              </>
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
              .filter((r) => selectedIds.includes(r.id))
              .map((request) => (
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
              {translate("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUploadTargets([]);
            setUploadDialogFile(null);
            setUploadDialogPreview("");
          }
          setUploadDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <DialogTitle className="dark:text-white">
                  {translate("Upload Tahlil Photo")}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {uploadTargets.length} selected
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                {translate("Select Photo")}
              </p>
              <Input
                key={uploadDialogFileKey}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUploadDialogFileChange(e.target.files?.[0])
                }
                disabled={tahlilPhotoUploading}
              />
              {uploadDialogPreview && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {translate("New Photo Preview")}
                  </p>
                  <img
                    src={uploadDialogPreview}
                    alt={translate("Pending upload")}
                    className="h-36 w-full rounded object-cover border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                {translate("Current Photo")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {uploadTargets
                  .map((id) => findRequestById(id))
                  .filter(Boolean)
                  .map((request) => {
                    const photoUrl =
                      Array.isArray(request.photourls) &&
                      request.photourls.length > 0
                        ? request.photourls[0]
                        : null;

                    const imageSrc = resolveFileUrl(
                      photoUrl,
                      "bucket-tahfiz-tahlil",
                    );

                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {request.requestorname}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {translate("Reference No.")}:{" "}
                          {request.referenceno || "-"}
                        </p>

                        {photoUrl ? (
                          <ImageWithLoader
                            src={imageSrc}
                            alt={translate("Current photo")}
                          />
                        ) : (
                          <p className="mt-2 text-xs text-gray-400">
                            {translate("No photo uploaded yet")}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              {translate("Close")}
            </Button>
            <Button
              onClick={handleUploadDialogUpload}
              disabled={tahlilPhotoUploading || !uploadDialogFile}
            >
              <Upload className="w-4 h-4 mr-2" />
              {translate("Upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
