import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { useForm } from "react-hook-form";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { translate } from "@/utils/translations";
import {
  useGetTahfizPaginated,
  useTahfizMutations,
} from "@/hooks/useTahfizMutations";
import { useUserMutations } from "@/hooks/useUserMutations";
import { useAdminAccess } from "@/utils/auth";
import { STATES_MY } from "@/utils/enums";
import { defaultTahfizField } from "@/utils/defaultformfields";
import { hashPassword } from "@/utils/helpers";
import { resolveFileUrl } from "@/utils";
import { trpc } from "@/utils/trpc";
import {
  useGetConfigByEntity,
  useUpsertConfigByEntity,
} from "@/hooks/usePaymentConfigMutations";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import { showError, showSuccess } from "@/components/ToastrNotification";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import FileUploadForm from "@/components/forms/FileUploadForm";

const DEFAULT_USER_PASSWORD = "password";

export default function ManageTahfizCenters() {
  const {
    currentUser,
    hasAdminAccess,
    isTahfizAdmin,
    isSuperAdmin,
    loadingUser,
    currentUserStates,
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlName = searchParams.get("name") || "";
  const urlState = searchParams.get("state") || "all";

  const [tempName, setTempName] = useState(urlName);
  const [tempState, setTempState] = useState(urlState);

  useEffect(() => {
    setTempName(urlName);
    setTempState(urlState);
  }, [urlName, urlState]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [serviceEntries, setServiceEntries] = useState([]);
  const [userEntries, setUserEntries] = useState([]);
  const [editingUserIndex, setEditingUserIndex] = useState(null);
  const [selectedPaymentPlatforms, setSelectedPaymentPlatforms] = useState([]);
  const [paymentConfigValues, setPaymentConfigValues] = useState({});
  const [paymentUploadingFiles, setPaymentUploadingFiles] = useState({});
  const [paymentPreviewUrls, setPaymentPreviewUrls] = useState({});

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("tahfiz");

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterName: urlName,
    filterState: urlState === "all" ? undefined : urlState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();
  const { createUser } = useUserMutations();
  const paymentConfigMutation = useUpsertConfigByEntity();

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultTahfizField,
  });

  const canAddTahfizUsers = isSuperAdmin || isTahfizAdmin;
  const isPaymentUploading = Object.values(paymentUploadingFiles).some(Boolean);

  const userRoleOptions = [
    { value: "admin", label: translate("Admin") },
    { value: "employee", label: translate("Employee") },
  ];

  const { data: paymentPlatforms = [] } =
    trpc.paymentPlatform.getActivePlatform.useQuery(undefined, {
      enabled: hasAdminAccess && isDialogOpen,
    });

  const paymentFields = paymentPlatforms.flatMap((platform) =>
    (platform.paymentfields ?? []).map((field) => ({
      ...field,
      platformCode: platform.code,
      platformName: platform.name,
      platformId: platform.id,
    })),
  );

  const { data: existingPaymentConfigs = [] } = useGetConfigByEntity({
    entityId: editingCenter?.id ?? 0,
    entityType: "tahfiz",
    enabled: !!editingCenter?.id && isDialogOpen,
  });

  const resetUserFields = () => {
    setValue("user_fullname", "");
    setValue("user_username", "");
    setValue("user_phoneno", "");
    setValue("user_role", "admin");
    setEditingUserIndex(null);
  };

  const getUserFormValues = () => ({
    fullname: (getValues("user_fullname") || "").trim(),
    username: (getValues("user_username") || "").trim(),
    phoneno: (getValues("user_phoneno") || "").trim(),
    role: getValues("user_role") || "admin",
  });

  const handleAddOrUpdateUser = () => {
    const { fullname, username, phoneno, role } = getUserFormValues();
    const hasInput = fullname || username || phoneno;

    if (!hasInput) {
      showError("Please fill in user details before adding.");
      return;
    }

    if (!fullname || !username) {
      showError("Full Name and Username are required to add a user.");
      return;
    }

    if (editingUserIndex !== null) {
      const nextEntries = userEntries.map((entry, index) =>
        index === editingUserIndex
          ? { ...entry, fullname, username, phoneno, role }
          : entry,
      );
      setUserEntries(nextEntries);
      resetUserFields();
      return;
    }

    const nextEntry = {
      id: `${Date.now()}-${Math.random()}`,
      fullname,
      username,
      phoneno,
      role,
    };

    setUserEntries((prev) => [...prev, nextEntry]);
    resetUserFields();
  };

  const handleEditUserEntry = (index) => {
    const entry = userEntries[index];
    if (!entry) return;
    setValue("user_fullname", entry.fullname || "");
    setValue("user_username", entry.username || "");
    setValue("user_phoneno", entry.phoneno || "");
    setValue("user_role", entry.role || "admin");
    setEditingUserIndex(index);
  };

  const handleRemoveUserEntry = (index) => {
    setUserEntries((prev) => prev.filter((_, idx) => idx !== index));
    if (editingUserIndex === index) {
      resetUserFields();
    } else if (editingUserIndex !== null && index < editingUserIndex) {
      setEditingUserIndex((prev) => (prev === null ? null : prev - 1));
    }
  };

  const buildUserPayload = async ({
    fullname,
    username,
    phoneno,
    role,
    state,
    tahfizCenterId,
  }) => {
    const trimmedFullname = (fullname || "").trim();
    const trimmedUsername = (username || "").trim();
    const trimmedPhone = (phoneno || "").trim();
    const hasUserInput = trimmedFullname || trimmedUsername || trimmedPhone;

    if (!hasUserInput) return null;

    if (!trimmedFullname || !trimmedUsername) {
      showError("Full Name and Username are required to add a user.");
      return null;
    }

    if (!tahfizCenterId) {
      showError("Tahfiz center is required to add a user.");
      return null;
    }

    return {
      fullname: trimmedFullname,
      email: trimmedUsername,
      phoneno: trimmedPhone,
      role: role || "admin",
      organisation: null,
      tahfizcenter: { id: Number(tahfizCenterId) },
      states: state ? [state] : [],
      password: await hashPassword(DEFAULT_USER_PASSWORD),
    };
  };

  const resetPaymentConfig = () => {
    Object.values(paymentPreviewUrls).forEach((url) =>
      URL.revokeObjectURL(url),
    );
    setSelectedPaymentPlatforms([]);
    setPaymentConfigValues({});
    setPaymentUploadingFiles({});
    setPaymentPreviewUrls({});
  };

  const togglePaymentPlatform = (platformCode) => {
    setSelectedPaymentPlatforms((prev) => {
      if (prev.includes(platformCode)) {
        return prev.filter((p) => p !== platformCode);
      }
      return [...prev, platformCode];
    });
  };

  const handlePaymentFileUpload = async (
    platformCode,
    fieldKey,
    fieldType,
    file,
  ) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/bucket-tahfiz-config", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return;
      }

      const data = await res.json();

      setPaymentConfigValues((prev) => ({
        ...prev,
        [uploadKey]: data.file_url,
      }));
      setPaymentPreviewUrls((prev) => ({
        ...prev,
        [uploadKey]: URL.createObjectURL(file),
      }));
      showSuccess("Photo uploaded");
    } catch (err) {
      console.error("Fetch error:", err);
      showError("Failed To Upload File");
    } finally {
      setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const validatePaymentConfig = () => {
    for (const platformCode of selectedPaymentPlatforms) {
      const fields = paymentFields.filter(
        (field) => field.platformCode === platformCode && field.required,
      );
      for (const field of fields) {
        const value = paymentConfigValues[`${platformCode}_${field.key}`];
        if (!value || value.trim() === "") {
          const platformName =
            paymentPlatforms.find((p) => p?.code === platformCode)?.name ||
            "platform";
          showError(
            `${field.label || field.key} is required for ${platformName}`,
          );
          return false;
        }
      }
    }
    return true;
  };

  const buildPaymentConfigPayload = (tahfizId) => {
    const configs = selectedPaymentPlatforms.flatMap((platformCode) => {
      const fields = paymentFields.filter(
        (field) => field.platformCode === platformCode,
      );
      return fields
        .map((field) => {
          const value = paymentConfigValues[`${platformCode}_${field.key}`];
          if (value) {
            return {
              paymentPlatformId: field.platformId,
              paymentFieldId: field.id,
              value,
            };
          }
          return null;
        })
        .filter(Boolean);
    });
    return { tahfizId, configs };
  };

  const renderPaymentField = (platform, field) => {
    const fieldId = `${platform.code}_${field.key}`;
    const value = paymentConfigValues[fieldId] || "";
    const isUploading = paymentUploadingFiles[fieldId];

    switch (field.fieldtype) {
      case "image": {
        const previewSrc = paymentPreviewUrls[fieldId] || value;
        return (
          <div>
            <Label>
              {field.label || field.key}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handlePaymentFileUpload(
                    platform.code,
                    field.key,
                    field.fieldtype,
                    file,
                  );
                }}
                disabled={isUploading}
              />
              {isUploading && (
                <span className="text-sm text-gray-500">
                  {translate("Uploading...")}
                </span>
              )}
            </div>
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Preview"
                className="mt-2 h-20 rounded border"
              />
            )}
          </div>
        );
      }
      case "textarea":
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({
                  ...prev,
                  [fieldId]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
      case "url":
      case "text":
      case "password":
      default:
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.fieldtype === "password" ? "password" : "text"}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({
                  ...prev,
                  [fieldId]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      resetPaymentConfig();
      return;
    }

    if (!editingCenter?.id) {
      resetPaymentConfig();
      return;
    }

    if (!existingPaymentConfigs.length) {
      setSelectedPaymentPlatforms([]);
      setPaymentConfigValues({});
      return;
    }

    const loadConfigs = async () => {
      const values = {};
      const previews = {};
      const platformSet = new Set();

      for (const config of existingPaymentConfigs) {
        const platformCode = config.paymentplatform?.code;
        const fieldKey = config.paymentfield?.key;
        const fieldType = config.paymentfield?.fieldtype;
        const configValue = config.value;

        if (platformCode && fieldKey && configValue) {
          platformSet.add(platformCode);
          values[`${platformCode}_${fieldKey}`] = configValue;

          if (fieldType === "image") {
            try {
              const fileUrl = resolveFileUrl(
                configValue,
                "bucket-tahfiz-config",
              );
              if (!fileUrl) continue;

              if (/^https?:\/\//i.test(fileUrl)) {
                previews[`${platformCode}_${fieldKey}`] = fileUrl;
                continue;
              }

              const res = await fetch(fileUrl);
              if (!res.ok) {
                continue;
              }
              const blob = await res.blob();
              previews[`${platformCode}_${fieldKey}`] =
                URL.createObjectURL(blob);
            } catch (error) {
              console.error("Error fetching file:", error);
            }
          }
        }
      }

      setSelectedPaymentPlatforms(Array.from(platformSet));
      setPaymentConfigValues(values);
      setPaymentPreviewUrls(previews);
    };

    loadConfigs();
  }, [existingPaymentConfigs, editingCenter?.id, isDialogOpen]);

  const syncServiceDraftToForm = (entries) => {
    const normalized = [];
    const seen = new Set();

    for (const entry of entries) {
      const service = (entry.service || "").trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalized.push({
        service,
        price:
          entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const serviceoffered = normalized.map((item) => item.service);
    const serviceprice = Object.fromEntries(
      normalized.map((item) => [item.service, Number(item.price) || 0]),
    );

    setValue("serviceoffered", serviceoffered);
    setValue("serviceprice", serviceprice);
  };

  const addServiceEntry = () => {
    const nextEntries = [
      ...serviceEntries,
      { id: `${Date.now()}-${Math.random()}`, service: "", price: "" },
    ];
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const updateServiceEntry = (entryId, field, fieldValue) => {
    const nextEntries = serviceEntries.map((entry) =>
      entry.id === entryId ? { ...entry, [field]: fieldValue } : entry,
    );
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const removeServiceEntry = (entryId) => {
    const nextEntries = serviceEntries.filter((entry) => entry.id !== entryId);
    setServiceEntries(nextEntries);
    syncServiceDraftToForm(nextEntries);
  };

  const handleSearch = () => {
    const params = { page: "1", name: "", state: "" };
    if (tempName) params.name = tempName;
    if (tempState !== "all") params.state = tempState;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingCenter(null);
    reset(defaultTahfizField);
    setServiceEntries([]);
    setUserEntries([]);
    resetUserFields();
    resetPaymentConfig();
    setIsDialogOpen(true);
  };

  const openEditDialog = (center) => {
    setEditingCenter(center);
    resetPaymentConfig();

    const relationalServices = Array.isArray(center.services)
      ? center.services
      : [];
    const serviceoffered =
      relationalServices.length > 0
        ? relationalServices.map((service) => service.service)
        : center.serviceoffered || [];
    const serviceprice =
      relationalServices.length > 0
        ? Object.fromEntries(
            relationalServices.map((service) => [
              service.service,
              service.price ? parseFloat(Number(service.price).toFixed(2)) : 0,
            ]),
          )
        : center.serviceprice || {};

    reset({
      ...center,
      serviceoffered,
      serviceprice,
      latitude: center.latitude?.toString() || "",
      longitude: center.longitude?.toString() || "",
    });

    const nextEntries = serviceoffered.map((service, index) => ({
      id: `${Date.now()}-${index}`,
      service,
      price: (serviceprice[service] ?? 0).toString(),
    }));

    setServiceEntries(nextEntries);
    setUserEntries([]);
    resetUserFields();
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    if (!validatePaymentConfig()) return;

    const normalizedServices = [];
    const seen = new Set();

    for (const entry of serviceEntries) {
      const service = (entry.service || "").trim();
      if (!service) continue;

      const serviceKey = service.toLowerCase();
      if (seen.has(serviceKey)) continue;
      seen.add(serviceKey);

      normalizedServices.push({
        service,
        price:
          entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }

    const {
      serviceoffered: _serviceoffered,
      serviceprice: _serviceprice,
      user_fullname,
      user_username,
      user_phoneno,
      user_role,
      ...restFormData
    } = formData;

    if (canAddTahfizUsers && editingUserIndex !== null) {
      showError("Please finish editing the user entry before saving.");
      return;
    }

    const payload = {
      ...restFormData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      services: normalizedServices.map((serviceItem) => ({
        service: serviceItem.service,
        price: Number(serviceItem.price) || 0,
        tahfizcenter: editingCenter ? { id: Number(editingCenter.id) } : null,
      })),
    };

    syncServiceDraftToForm(
      normalizedServices.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        service: item.service,
        price: item.price.toString(),
      })),
    );

    try {
      const res = editingCenter
        ? await updateTahfiz.mutateAsync({
            id: Number(editingCenter.id),
            data: payload,
          })
        : await createTahfiz.mutateAsync(payload);

      const tahfizCenterId = editingCenter?.id ?? res?.id;
      const shouldUpsertPaymentConfig =
        tahfizCenterId &&
        (isSuperAdmin || currentUser?.tahfizcenter?.id === tahfizCenterId) &&
        (selectedPaymentPlatforms.length > 0 ||
          existingPaymentConfigs.length > 0);

      if (shouldUpsertPaymentConfig) {
        const configPayload = buildPaymentConfigPayload(Number(tahfizCenterId));
        await paymentConfigMutation.mutateAsync(configPayload);
      }

      if (canAddTahfizUsers && tahfizCenterId) {
        const pendingEntry = {
          fullname: (user_fullname || "").trim(),
          username: (user_username || "").trim(),
          phoneno: (user_phoneno || "").trim(),
          role: user_role || "admin",
        };
        const hasPendingInput =
          pendingEntry.fullname ||
          pendingEntry.username ||
          pendingEntry.phoneno;

        if (
          hasPendingInput &&
          (!pendingEntry.fullname || !pendingEntry.username)
        ) {
          showError("Full Name and Username are required to add a user.");
          return;
        }

        const entriesToCreate = [
          ...userEntries,
          ...(hasPendingInput ? [pendingEntry] : []),
        ];

        for (const entry of entriesToCreate) {
          const userPayload = await buildUserPayload({
            fullname: entry.fullname,
            username: entry.username,
            phoneno: entry.phoneno,
            role: entry.role,
            state: formData.state,
            tahfizCenterId,
          });

          if (userPayload) {
            await createUser.mutateAsync(userPayload);
          }
        }
      }

      if (res || editingCenter) {
        setIsDialogOpen(false);
        reset(defaultTahfizField);
        setServiceEntries([]);
        setUserEntries([]);
        resetUserFields();
        resetPaymentConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!centerToDelete) return;

    try {
      await deleteTahfiz.mutateAsync(Number(centerToDelete.id));
      setDeleteDialogOpen(false);
      setCenterToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
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
              label: translate("Manage Tahfiz Centers"),
              page: "ManageTahfizCenters",
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
            label: translate("Manage Tahfiz Centers"),
            page: "ManageTahfizCenters",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-600" />
          {translate("Manage Tahfiz Centers")}
        </h1>
        {canCreate && (
          <Button
            onClick={openAddDialog}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {translate("Add New")}
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={translate("Name")}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-amber-600 px-6">
              {translate("Search")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isSuperAdmin && (
              <Select value={tempState} onValueChange={setTempState}>
                <SelectTrigger>
                  <SelectValue placeholder={translate("All States")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate("All States")}</SelectItem>
                  {STATES_MY.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" /> {translate("Reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Name")}</TableHead>
                <TableHead className="text-center">
                  {translate("Phone No")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("State")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Services")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Image")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable={true} colSpan={4} />
              ) : tahfizCenterList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4} />
              ) : (
                tahfizCenterList.items.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="text-center">
                      {center.phone}
                    </TableCell>
                    <TableCell className="text-center">
                      {center.state}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center items-center gap-1">
                        {center.serviceoffered?.slice(0, 2).map((service) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={resolveFileUrl(center.photourl, "tahfiz-center")}
                        alt="photo"
                        className="w-12 h-10 object-cover rounded mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(center)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCenterToDelete(center);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: p.toString(),
              })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
            }}
            totalItems={tahfizCenterList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? translate("Edit") : translate("Add")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <div
              className={
                canAddTahfizUsers
                  ? "grid grid-cols-1 xl:grid-cols-3 gap-6"
                  : "grid grid-cols-1 xl:grid-cols-2 gap-6"
              }
            >
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b py-2">
                  {translate("Tahfiz Details")}
                </h3>
                <TextInputForm
                  name="name"
                  control={control}
                  label={translate("Name")}
                  required
                  errors={errors}
                />
                <SelectForm
                  name="state"
                  control={control}
                  label={translate("State")}
                  placeholder={translate("Select states")}
                  options={isSuperAdmin ? STATES_MY : currentUserStates || []}
                  required
                  errors={errors}
                />
                <TextInputForm
                  name="description"
                  control={control}
                  label={translate("About")}
                  isTextArea
                />
                <div>
                  <Label>{translate("Services")}</Label>
                  <div className="space-y-3 mt-2">
                    {serviceEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <Input
                          className="col-span-7"
                          placeholder={translate("Service Name")}
                          value={entry.service}
                          onChange={(e) =>
                            updateServiceEntry(
                              entry.id,
                              "service",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          className="col-span-4"
                          type="number"
                          step="0.01"
                          placeholder="RM 0.00"
                          value={entry.price}
                          onChange={(e) =>
                            updateServiceEntry(
                              entry.id,
                              "price",
                              e.target.value,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="col-span-1"
                          onClick={() => removeServiceEntry(entry.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addServiceEntry}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {translate("Add Service")}
                    </Button>
                  </div>
                </div>
                <TextInputForm
                  name="address"
                  control={control}
                  label={translate("Address")}
                  isTextArea
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="phone"
                    control={control}
                    label={translate("Phone No.")}
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="email"
                    control={control}
                    label={translate("Email")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextInputForm
                    name="latitude"
                    control={control}
                    label={translate("Latitude")}
                    isNumber
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="longitude"
                    control={control}
                    label={translate("Longitude")}
                    isNumber
                    required
                    errors={errors}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    setIsLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setValue("latitude", pos.coords.latitude.toFixed(16));
                        setValue("longitude", pos.coords.longitude.toFixed(16));
                        setIsLocating(false);
                      },
                      () => {
                        setIsLocating(false);
                      },
                    );
                  }}
                  disabled={isLocating}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {isLocating
                    ? translate("Getting location...")
                    : translate("Get Current Location")}
                </Button>
                <FileUploadForm
                  name="photourl"
                  control={control}
                  label={translate("Photo")}
                  bucketName="tahfiz-center"
                  uploading={uploading}
                  handleFileUpload={handleFileUpload}
                  translate={translate}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b py-2">
                  {translate("Payment Config")}
                </h3>
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {translate("Select Payment Platforms")}
                  </Label>
                  <div className="grid gap-3">
                    {paymentPlatforms
                      .filter((p) => p?.code)
                      .map((platform) => (
                        <Label
                          key={platform.code}
                          className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedPaymentPlatforms.includes(
                              platform.code,
                            )}
                            onCheckedChange={() =>
                              togglePaymentPlatform(platform.code)
                            }
                          />
                          <div>
                            <span className="font-medium">{platform.name}</span>
                            <Badge
                              variant="secondary"
                              className="ml-2 capitalize text-xs"
                            >
                              {platform.category}
                            </Badge>
                          </div>
                        </Label>
                      ))}
                  </div>
                </div>

                {selectedPaymentPlatforms.map((platformCode) => {
                  const platform = paymentPlatforms.find(
                    (p) => p?.code === platformCode,
                  );
                  const fields = paymentFields.filter(
                    (f) => f?.platformCode === platformCode,
                  );

                  if (!platform || fields.length === 0) return null;

                  return (
                    <div
                      key={platformCode}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        {platform.name} {translate("config")}
                      </h3>
                      <div className="space-y-4">
                        {fields.map((field) => (
                          <div key={field.id}>
                            {renderPaymentField(platform, field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {canAddTahfizUsers && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b py-2">
                    {translate("Add User")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInputForm
                      name="user_fullname"
                      control={control}
                      label={translate("Full Name")}
                    />
                    <TextInputForm
                      name="user_username"
                      control={control}
                      label={translate("Username")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInputForm
                      name="user_phoneno"
                      control={control}
                      label={translate("Phone No.")}
                      isPhone
                    />
                    <SelectForm
                      name="user_role"
                      control={control}
                      label={translate("Role")}
                      options={userRoleOptions}
                      placeholder="Select role"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddOrUpdateUser}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {editingUserIndex !== null ? "Update User" : "Add User"}
                    </Button>
                    {editingUserIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetUserFields}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userEntries.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-xs text-gray-500"
                            >
                              No users added yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          userEntries.map((entry, index) => (
                            <TableRow
                              key={entry.id}
                              className={
                                editingUserIndex === index ? "bg-amber-50" : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {entry.fullname}
                              </TableCell>
                              <TableCell>{entry.username}</TableCell>
                              <TableCell>{entry.phoneno || "-"}</TableCell>
                              <TableCell className="capitalize">
                                {entry.role}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditUserEntry(index)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveUserEntry(index)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Default password: {DEFAULT_USER_PASSWORD}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    State follows current Tahfiz Center.
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={
                  createTahfiz.isPending ||
                  updateTahfiz.isPending ||
                  isSubmitting ||
                  uploading ||
                  isPaymentUploading ||
                  paymentConfigMutation.tahfizMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" /> {translate("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Tahfiz Center")}
        isDelete={true}
        itemToDelete={centerToDelete?.name}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
