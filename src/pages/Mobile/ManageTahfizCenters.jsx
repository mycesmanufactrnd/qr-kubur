// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/Forms/TextInputForm.jsx";
import SelectForm from "@/components/Forms/SelectForm";
import FileUploadForm from "@/components/Forms/FileUploadForm";
import { translate } from "@/utils/translations";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import { hashPassword } from "@/utils/helpers";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { STATES_MY } from "@/utils/enums";
import { trpc } from "@/utils/trpc";
import {
  useGetTahfizPaginated,
  useTahfizMutations,
} from "@/hooks/useTahfizMutations";
import { useGetOrganisationPaginated } from "@/hooks/useOrganisationMutations";
import { useUserMutations } from "@/hooks/useUserMutations";
import {
  useGetConfigByEntity,
  useUpsertConfigByEntity,
} from "@/hooks/usePaymentConfigMutations";
import { defaultTahfizField } from "@/utils/defaultformfields";

const DEFAULT_USER_PASSWORD = "password";

const DEFAULT_TAHLIL_ENTRY = {
  id: "default-tahlil",
  service: "Tahlil Arwah",
  price: "0",
  isactive: true,
  isDefault: true,
};

function TahfizCard({ item, canEdit, canDelete, onEdit, onDelete }) {
  const photoSrc = resolveFileUrl(item.photourl, "tahfiz-center");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {photoSrc && (
        <img
          src={photoSrc}
          alt={item.name}
          className="w-full h-28 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {item.name}
          </p>
          {item.state && (
            <span className="shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-lg px-2 py-0.5">
              {item.state}
            </span>
          )}
        </div>

        {item.phone && (
          <p className="text-xs text-slate-500">{item.phone}</p>
        )}

        {item.serviceoffered?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.serviceoffered.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
            {item.serviceoffered.length > 3 && (
              <span className="text-xs text-slate-400">
                +{item.serviceoffered.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {translate("Delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TahfizFormSheet({
  editing,
  onClose,
  onSubmit,
  isSubmitting,
  isSuperAdmin,
  currentUserStates,
  orgOptions,
  canAddTahfizUsers,
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          latitude: editing.latitude?.toString() || "",
          longitude: editing.longitude?.toString() || "",
          parentorganisation:
            editing.parentorganisation?.id?.toString() || "",
          user_fullname: "",
          user_username: "",
          user_phoneno: "",
          user_role: "admin",
        }
      : defaultTahfizField,
  });

  // Services state
  const [serviceEntries, setServiceEntries] = useState(() => {
    if (!editing) return [{ ...DEFAULT_TAHLIL_ENTRY }];
    const relationalServices = Array.isArray(editing.services)
      ? editing.services
      : [];
    const serviceoffered =
      relationalServices.length > 0
        ? relationalServices.map((s) => s.service)
        : editing.serviceoffered || [];
    const serviceprice =
      relationalServices.length > 0
        ? Object.fromEntries(
            relationalServices.map((s) => [
              s.service,
              s.price ? parseFloat(Number(s.price).toFixed(2)) : 0,
            ]),
          )
        : editing.serviceprice || {};

    const entries = serviceoffered.map((service, i) => {
      const existing = relationalServices.find((s) => s.service === service);
      return {
        id: `${Date.now()}-${i}`,
        service,
        price: (serviceprice[service] ?? 0).toString(),
        isactive: existing?.isactive !== false,
        isDefault: service.toLowerCase() === "tahlil arwah",
      };
    });
    if (!entries.some((e) => e.service.toLowerCase() === "tahlil arwah")) {
      entries.unshift({ ...DEFAULT_TAHLIL_ENTRY });
    }
    return entries;
  });

  // Users state
  const [userEntries, setUserEntries] = useState([]);
  const [editingUserIndex, setEditingUserIndex] = useState(null);

  // Payment config state
  const { data: paymentPlatforms = [] } =
    trpc.paymentPlatform.getActivePlatform.useQuery(undefined, {
      enabled: true,
    });
  const [selectedPaymentPlatforms, setSelectedPaymentPlatforms] = useState([]);
  const [paymentConfigValues, setPaymentConfigValues] = useState({});
  const [paymentPreviewUrls, setPaymentPreviewUrls] = useState({});
  const [paymentUploadingFiles, setPaymentUploadingFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const paymentFields = paymentPlatforms.flatMap((platform) =>
    (platform.paymentfields ?? []).map((field) => ({
      ...field,
      platformCode: platform.code,
      platformName: platform.name,
      platformId: platform.id,
    })),
  );

  const { data: existingPaymentConfigs = [] } = useGetConfigByEntity({
    entityId: editing?.id ?? 0,
    entityType: "tahfiz",
    enabled: !!editing?.id,
  });

  useEffect(() => {
    if (!existingPaymentConfigs.length) return;

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
              const fileUrl = resolveFileUrl(configValue, "bucket-tahfiz-config");
              if (fileUrl) previews[`${platformCode}_${fieldKey}`] = fileUrl;
            } catch {}
          }
        }
      }

      setSelectedPaymentPlatforms(Array.from(platformSet));
      setPaymentConfigValues(values);
      setPaymentPreviewUrls(previews);
    };

    loadConfigs();
  }, [existingPaymentConfigs.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const syncServiceDraftToForm = (entries) => {
    const normalized = [];
    const seen = new Set();
    for (const entry of entries) {
      const service = (entry.service || "").trim();
      if (!service || seen.has(service.toLowerCase())) continue;
      seen.add(service.toLowerCase());
      normalized.push({
        service,
        price: entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
      });
    }
    setValue("serviceoffered", normalized.map((i) => i.service));
    setValue(
      "serviceprice",
      Object.fromEntries(normalized.map((i) => [i.service, Number(i.price) || 0])),
    );
  };

  const addServiceEntry = () => {
    const next = [
      ...serviceEntries,
      { id: `${Date.now()}-${Math.random()}`, service: "", price: "", isactive: true, isDefault: false },
    ];
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  const updateServiceEntry = (id, field, value) => {
    const next = serviceEntries.map((e) =>
      e.id === id ? { ...e, [field]: value } : e,
    );
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  const removeServiceEntry = (id) => {
    const next = serviceEntries.filter((e) => e.id !== id);
    setServiceEntries(next);
    syncServiceDraftToForm(next);
  };

  const resetUserFields = () => {
    setValue("user_fullname", "");
    setValue("user_username", "");
    setValue("user_phoneno", "");
    setValue("user_role", "admin");
    setEditingUserIndex(null);
  };

  const handleAddOrUpdateUser = () => {
    const fullname = (getValues("user_fullname") || "").trim();
    const username = (getValues("user_username") || "").trim();
    const phoneno = (getValues("user_phoneno") || "").trim();
    const role = getValues("user_role") || "admin";

    if (!fullname && !username && !phoneno) {
      showError("Please fill in user details before adding.");
      return;
    }
    if (!fullname || !username) {
      showError("Full Name and Username are required.");
      return;
    }

    if (editingUserIndex !== null) {
      setUserEntries((prev) =>
        prev.map((e, i) =>
          i === editingUserIndex ? { ...e, fullname, username, phoneno, role } : e,
        ),
      );
      resetUserFields();
      return;
    }

    setUserEntries((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, fullname, username, phoneno, role },
    ]);
    resetUserFields();
  };

  const togglePaymentPlatform = (code) => {
    setSelectedPaymentPlatforms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handlePaymentFileUpload = async (platformCode, fieldKey, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch("/api/upload/bucket-tahfiz-config", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || "Failed to upload photo");
        return;
      }
      const data = await res.json();
      setPaymentConfigValues((prev) => ({ ...prev, [uploadKey]: data.file_url }));
      setPaymentPreviewUrls((prev) => ({
        ...prev,
        [uploadKey]: URL.createObjectURL(file),
      }));
      showSuccess("Photo uploaded");
    } catch (err) {
      showError("Failed To Upload File");
    } finally {
      setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);
      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || "Failed to upload photo");
        return null;
      }
      const data = await res.json();
      showSuccess("Photo uploaded");
      return data.file_url;
    } catch {
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validatePaymentConfig = () => {
    for (const platformCode of selectedPaymentPlatforms) {
      const fields = paymentFields.filter(
        (f) => f.platformCode === platformCode && f.required,
      );
      for (const field of fields) {
        const value = paymentConfigValues[`${platformCode}_${field.key}`];
        if (!value || value.trim() === "") {
          const platformName =
            paymentPlatforms.find((p) => p?.code === platformCode)?.name || "platform";
          showError(`${field.label || field.key} is required for ${platformName}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = handleSubmit(async (formData) => {
    if (!validatePaymentConfig()) return;
    if (canAddTahfizUsers && editingUserIndex !== null) {
      showError("Please finish editing the user entry before saving.");
      return;
    }
    await onSubmit(formData, {
      serviceEntries,
      userEntries,
      selectedPaymentPlatforms,
      paymentConfigValues,
      paymentFields,
    });
  });

  const userRoleOptions = [
    { value: "admin", label: translate("Admin") },
    { value: "employee", label: translate("Employee") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {editing
            ? translate("Edit Tahfiz Center")
            : translate("Add Tahfiz Center")}
        </h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        {/* ── Tahfiz Details ── */}
        <FormSection title={translate("Tahfiz Details")}>
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
            options={(isSuperAdmin ? STATES_MY : currentUserStates || []).map(
              (s) => ({ value: s, label: s }),
            )}
            required
            errors={errors}
          />
          <SelectForm
            name="parentorganisation"
            control={control}
            label={translate("Parent Organisation")}
            placeholder={translate("Select parent organisation")}
            options={orgOptions}
            disabled={!isSuperAdmin}
          />
          <TextInputForm
            name="description"
            control={control}
            label={translate("About")}
            isTextArea
          />
        </FormSection>

        {/* ── Services ── */}
        <FormSection title={translate("Services")}>
          <div className="space-y-2">
            {serviceEntries.map((entry) => {
              const isLocked = entry.isDefault && !isSuperAdmin;
              return (
                <div key={entry.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500"
                    placeholder={translate("Service Name")}
                    value={entry.service}
                    disabled={isLocked}
                    onChange={(e) =>
                      updateServiceEntry(entry.id, "service", e.target.value)
                    }
                  />
                  <input
                    className="w-20 h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-200"
                    type="number"
                    step="0.01"
                    placeholder="RM"
                    value={entry.price}
                    onChange={(e) =>
                      updateServiceEntry(entry.id, "price", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateServiceEntry(
                        entry.id,
                        "isactive",
                        entry.isactive === false,
                      )
                    }
                    className={`h-10 px-2.5 rounded-xl border text-xs font-medium transition-colors shrink-0 ${
                      entry.isactive !== false
                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {entry.isactive !== false ? "On" : "Off"}
                  </button>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeServiceEntry(entry.id)}
                      className="w-10 h-10 flex items-center justify-center text-red-500 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800/50 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addServiceEntry}
            className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 active:opacity-70"
          >
            <Plus className="w-3.5 h-3.5" />
            {translate("Add Service")}
          </button>
        </FormSection>

        {/* ── Contact & Location ── */}
        <FormSection title={translate("Contact & Location")}>
          <TextInputForm
            name="address"
            control={control}
            label={translate("Address")}
            isTextArea
          />
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setValue("latitude", pos.coords.latitude.toFixed(16));
                  setValue("longitude", pos.coords.longitude.toFixed(16));
                  setIsLocating(false);
                },
                () => setIsLocating(false),
              );
            }}
            disabled={isLocating}
            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm flex items-center justify-center gap-2 active:opacity-70 disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            {isLocating
              ? translate("Getting location...")
              : translate("Get Current Location")}
          </button>
        </FormSection>

        {/* ── Photo ── */}
        <FormSection title={translate("Photo")}>
          <FileUploadForm
            name="photourl"
            control={control}
            label={translate("Photo")}
            bucketName="tahfiz-center"
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            translate={translate}
          />
        </FormSection>

        {/* ── Payment Config ── */}
        {paymentPlatforms.filter((p) => p?.code).length > 0 && (
          <FormSection title={translate("Payment Config")}>
            <div className="space-y-2">
              {paymentPlatforms
                .filter((p) => p?.code)
                .map((platform) => (
                  <label
                    key={platform.code}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer dark:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-amber-600"
                      checked={selectedPaymentPlatforms.includes(platform.code)}
                      onChange={() => togglePaymentPlatform(platform.code)}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {platform.name}
                    </span>
                    {platform.category && (
                      <Badge variant="secondary" className="text-xs capitalize ml-auto">
                        {platform.category}
                      </Badge>
                    )}
                  </label>
                ))}
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
                  className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 p-3 space-y-3"
                >
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    {platform.name} Config
                  </p>
                  {fields.map((field) => {
                    const fieldId = `${platformCode}_${field.key}`;
                    const value = paymentConfigValues[fieldId] || "";
                    const isUploading = paymentUploadingFiles[fieldId];

                    if (field.fieldtype === "image") {
                      const previewSrc = paymentPreviewUrls[fieldId] || value;
                      return (
                        <div key={field.id}>
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            {field.label || field.key}
                            {field.required && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            className="w-full text-xs text-slate-600"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f)
                                handlePaymentFileUpload(
                                  platformCode,
                                  field.key,
                                  f,
                                );
                            }}
                          />
                          {isUploading && (
                            <p className="text-xs text-slate-400 mt-1">
                              {translate("Uploading...")}
                            </p>
                          )}
                          {previewSrc && (
                            <img
                              src={previewSrc}
                              alt="Preview"
                              className="mt-2 h-16 rounded-lg border"
                            />
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={field.id}>
                        <label className="text-xs text-slate-500 mb-1 block">
                          {field.label || field.key}
                          {field.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </label>
                        <input
                          type={field.fieldtype === "password" ? "password" : "text"}
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-200"
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) =>
                            setPaymentConfigValues((prev) => ({
                              ...prev,
                              [fieldId]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </FormSection>
        )}

        {/* ── Users ── */}
        {canAddTahfizUsers && (
          <FormSection title={translate("Add User")}>
            <div className="grid grid-cols-2 gap-2">
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
            <div className="grid grid-cols-2 gap-2">
              <TextInputForm
                name="user_phoneno"
                control={control}
                label={translate("Phone No.")}
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
              <button
                type="button"
                onClick={handleAddOrUpdateUser}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-amber-600 text-white text-xs font-medium active:opacity-80"
              >
                <Plus className="w-3.5 h-3.5" />
                {editingUserIndex !== null
                  ? translate("Update User")
                  : translate("Add User")}
              </button>
              {editingUserIndex !== null && (
                <button
                  type="button"
                  onClick={resetUserFields}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium active:opacity-80"
                >
                  {translate("Cancel")}
                </button>
              )}
            </div>

            {userEntries.length > 0 && (
              <div className="space-y-2">
                {userEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl border p-3 flex items-center gap-2 ${
                      editingUserIndex === index
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                        : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {entry.fullname}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {entry.username} · {entry.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("user_fullname", entry.fullname || "");
                        setValue("user_username", entry.username || "");
                        setValue("user_phoneno", entry.phoneno || "");
                        setValue("user_role", entry.role || "admin");
                        setEditingUserIndex(index);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-700 active:opacity-70"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEntries((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                        if (editingUserIndex === index) resetUserFields();
                      }}
                      className="w-8 h-8 flex items-center justify-center text-red-500 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800/50 active:opacity-70"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">
              {translate("Default password")}: {DEFAULT_USER_PASSWORD}
            </p>
          </FormSection>
        )}
      </div>

      {/* Save button */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || uploading}
          className="w-full h-12 rounded-2xl bg-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {translate("Save")}
        </button>
      </div>
    </div>
  );
}

export default function ManageTahfizCenters() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isSuperAdmin,
    isTahfizAdmin,
    currentUserStates,
  } = useAdminAccess();

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("tahfiz");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedState, setAppliedState] = useState("all");

  const [formSheet, setFormSheet] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { tahfizCenterList, totalPages, isLoading } = useGetTahfizPaginated({
    page,
    pageSize: itemsPerPage,
    filterName: appliedSearch,
    filterState: appliedState === "all" ? undefined : appliedState,
  });

  const { createTahfiz, updateTahfiz, deleteTahfiz } = useTahfizMutations();
  const { createUser } = useUserMutations();
  const paymentConfigMutation = useUpsertConfigByEntity();
  const { organisationsList } = useGetOrganisationPaginated({});

  const canAddTahfizUsers = isSuperAdmin || isTahfizAdmin;

  const orgOptions = (organisationsList?.items || []).map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const handleFormSubmit = async (
    formData,
    { serviceEntries, userEntries, selectedPaymentPlatforms, paymentConfigValues, paymentFields },
  ) => {
    const normalizedServices = [];
    const seen = new Set();
    for (const entry of serviceEntries) {
      const service = (entry.service || "").trim();
      if (!service || seen.has(service.toLowerCase())) continue;
      seen.add(service.toLowerCase());
      normalizedServices.push({
        service,
        price: entry.price === "" ? 0 : parseFloat(Number(entry.price).toFixed(2)),
        isactive: entry.isactive !== false,
      });
    }

    const {
      serviceoffered: _so,
      serviceprice: _sp,
      user_fullname,
      user_username,
      user_phoneno,
      user_role,
      ...restFormData
    } = formData;

    const payload = {
      ...restFormData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      parentorganisation: formData.parentorganisation
        ? { id: Number(formData.parentorganisation) }
        : null,
      services: normalizedServices.map((item) => ({
        service: item.service,
        price: Number(item.price) || 0,
        isactive: item.isactive !== false,
        tahfizcenter: formSheet?.editing
          ? { id: Number(formSheet.editing.id) }
          : null,
      })),
    };

    try {
      const res = formSheet?.editing
        ? await updateTahfiz.mutateAsync({
            id: Number(formSheet.editing.id),
            data: payload,
          })
        : await createTahfiz.mutateAsync(payload);

      const tahfizCenterId = formSheet?.editing?.id ?? res?.id;

      const shouldUpsertPaymentConfig =
        tahfizCenterId &&
        (isSuperAdmin ||
          currentUser?.tahfizcenter?.id === tahfizCenterId) &&
        selectedPaymentPlatforms.length > 0;

      if (shouldUpsertPaymentConfig) {
        const configs = selectedPaymentPlatforms.flatMap((platformCode) => {
          const fields = paymentFields.filter(
            (f) => f.platformCode === platformCode,
          );
          return fields
            .map((field) => {
              const value =
                paymentConfigValues[`${platformCode}_${field.key}`];
              if (value)
                return {
                  paymentPlatformId: field.platformId,
                  paymentFieldId: field.id,
                  value,
                };
              return null;
            })
            .filter(Boolean);
        });
        await paymentConfigMutation.mutateAsync({
          tahfizId: Number(tahfizCenterId),
          configs,
        });
      }

      if (canAddTahfizUsers && tahfizCenterId) {
        const pendingFullname = (user_fullname || "").trim();
        const pendingUsername = (user_username || "").trim();
        const pendingPhone = (user_phoneno || "").trim();
        const hasPending = pendingFullname || pendingUsername || pendingPhone;

        if (hasPending && (!pendingFullname || !pendingUsername)) {
          showError("Full Name and Username are required to add a user.");
          return;
        }

        const entriesToCreate = [
          ...userEntries,
          ...(hasPending
            ? [
                {
                  fullname: pendingFullname,
                  username: pendingUsername,
                  phoneno: pendingPhone,
                  role: user_role || "admin",
                },
              ]
            : []),
        ];

        for (const entry of entriesToCreate) {
          if (!entry.fullname || !entry.username) continue;
          const userPayload = {
            fullname: entry.fullname,
            email: entry.username,
            phoneno: entry.phoneno,
            role: entry.role || "admin",
            organisation: null,
            tahfizcenter: { id: Number(tahfizCenterId) },
            states: formData.state ? [formData.state] : [],
            password: await hashPassword(DEFAULT_USER_PASSWORD),
          };
          await createUser.mutateAsync(userPayload);
        }
      }

      setFormSheet(null);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteTahfiz.mutateAsync(Number(deleteDialog.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteDialog(null);
    }
  };

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!isTahfizAdmin && !isSuperAdmin) return <AccessDeniedComponent />;
  if (!canView) return <AccessDeniedComponent />;

  const items = tahfizCenterList?.items ?? [];

  return (
    <>
      <div className="min-h-screen pb-6 dark:bg-slate-900">
        <BackNavigation title={translate("Manage Tahfiz Centers")} />

        <div className="max-w-2xl mx-auto px-3 space-y-3">
          {/* Filter + Add */}
          <div className="flex items-center justify-between">
            <AdvancedFilters
              parameter={[
                { label: translate("Name"), type: "text", searchColumn: "name" },
                ...(isSuperAdmin ? [{ label: translate("State"), type: "select", searchColumn: "state", options: STATES_MY.map(s => ({ id: s, name: s })) }] : []),
              ]}
              onApplyFilter={(f) => {
                setAppliedSearch(f.name || "");
                setAppliedState(f.state || "all");
                setPage(1);
              }}
            />
            {canCreate && (
              <button
                onClick={() => setFormSheet({ editing: null })}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-600 text-white active:opacity-80 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Card list */}
          {isLoading ? (
            <InlineLoadingComponent />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
              <BookOpen className="w-12 h-12 mb-2" />
              <p className="text-sm">{translate("No records")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((center) => (
                <TahfizCard
                  key={center.id}
                  item={center}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={(c) => setFormSheet({ editing: c })}
                  onDelete={(c) => setDeleteDialog(c)}
                />
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
                totalItems={tahfizCenterList?.total ?? 0}
              />
            </div>
          )}
        </div>
      </div>

      {formSheet && (
        <TahfizFormSheet
          editing={formSheet.editing}
          onClose={() => setFormSheet(null)}
          onSubmit={handleFormSubmit}
          isSubmitting={createTahfiz.isPending || updateTahfiz.isPending}
          isSuperAdmin={isSuperAdmin}
          currentUserStates={currentUserStates}
          orgOptions={orgOptions}
          canAddTahfizUsers={canAddTahfizUsers}
        />
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title={translate("Delete Tahfiz Center")}
        isDelete
        itemToDelete={deleteDialog?.name}
        onConfirm={confirmDelete}
      />
    </>
  );
}
