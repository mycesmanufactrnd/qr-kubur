import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Plus, Save, X, CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { showApiError, showError, showSuccess } from "@/components/ToastrNotification";
import { defaultQuickRegisterForm } from "@/utils/defaultformfields";

export default function OrganisationQuickRegister() {
  const [serviceEntries, setServiceEntries] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedPaymentPlatforms, setSelectedPaymentPlatforms] = useState([]);
  const [paymentConfigValues, setPaymentConfigValues] = useState({});
  const [paymentUploadingFiles, setPaymentUploadingFiles] = useState({});
  const [paymentPreviewUrls, setPaymentPreviewUrls] = useState({});
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultQuickRegisterForm,
  });

  const isGraveServicesChecked = watch("isgraveservices");
  const isPaymentUploading = Object.values(paymentUploadingFiles).some(Boolean);

  const allowedTypesQuery = trpc.tempOrganisation.getAllowedOrganisationTypes.useQuery();
  const { data: paymentPlatforms = [] } = trpc.paymentPlatform.getActivePlatform.useQuery();

  const paymentFields = paymentPlatforms.flatMap((platform) =>
    (platform.paymentfields ?? []).map((field) => ({
      ...field,
      platformCode: platform.code,
      platformName: platform.name,
      platformId: platform.id,
    }))
  );

  const registerMutation = trpc.tempOrganisation.register.useMutation({
    onSuccess: () => {
      showSuccess("Organisation registration", "create");
      setIsSubmitted(true);
      reset(defaultQuickRegisterForm);
      setServiceEntries([]);
      Object.values(paymentPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
      setSelectedPaymentPlatforms([]);
      setPaymentConfigValues({});
      setPaymentUploadingFiles({});
      setPaymentPreviewUrls({});
    },
    onError: (error) => showApiError(error),
  });

  const allowedTypeOptions = useMemo(
    () =>
      (allowedTypesQuery.data ?? []).map((type) => ({
        value: String(type.id),
        label: type.name,
      })),
    [allowedTypesQuery.data],
  );

  useEffect(() => {
    return () => {
      Object.values(paymentPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [paymentPreviewUrls]);

  const syncServiceDraftToPayload = () => {
    const normalized = [];
    const seen = new Set();

    for (const entry of serviceEntries) {
      const service = (entry.service || "").trim();
      if (!service) continue;

      const key = service.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      normalized.push({
        service,
        price: entry.price === "" ? 0 : Number(Number(entry.price).toFixed(2)),
      });
    }

    const serviceoffered = normalized.map((item) => item.service);
    const serviceprice = Object.fromEntries(
      normalized.map((item) => [item.service, Number(item.price) || 0]),
    );

    return { serviceoffered, serviceprice };
  };

  const addServiceEntry = () => {
    setServiceEntries((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, service: "", price: "" },
    ]);
  };

  const updateServiceEntry = (entryId, field, value) => {
    setServiceEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, [field]: value } : entry)),
    );
  };

  const removeServiceEntry = (entryId) => {
    setServiceEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const togglePaymentPlatform = (platformCode) => {
    setSelectedPaymentPlatforms((prev) => {
      if (prev.includes(platformCode)) {
        return prev.filter((p) => p !== platformCode);
      }
      return [...prev, platformCode];
    });
  };

  const handlePaymentFileUpload = async (platformCode, fieldKey, fieldType, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/bucket-organisation-config', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || 'Failed to upload photo');
        return;
      }

      const data = await res.json();

      setPaymentConfigValues((prev) => ({ ...prev, [uploadKey]: data.file_url }));
      setPaymentPreviewUrls((prev) => ({ ...prev, [uploadKey]: URL.createObjectURL(file) }));
      showSuccess('Photo uploaded');
    } catch (err) {
      console.error("Fetch error:", err);
      showError('Failed To Upload File');
    } finally {
      setPaymentUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const validatePaymentConfig = () => {
    for (const platformCode of selectedPaymentPlatforms) {
      const fields = paymentFields.filter(
        (field) => field.platformCode === platformCode && field.required
      );
      for (const field of fields) {
        const value = paymentConfigValues[`${platformCode}_${field.key}`];
        if (!value || value.trim() === '') {
          const platformName =
            paymentPlatforms.find((p) => p?.code === platformCode)?.name || 'platform';
          showError(`${field.label || field.key} is required for ${platformName}`);
          return false;
        }
      }
    }
    return true;
  };

  const buildPaymentConfigDraft = () => {
    const configs = selectedPaymentPlatforms.flatMap((platformCode) => {
      const fields = paymentFields.filter((field) => field.platformCode === platformCode);
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

    return configs.length > 0 ? configs : undefined;
  };

  const renderPaymentField = (platform, field) => {
    const fieldId = `${platform.code}_${field.key}`;
    const value = paymentConfigValues[fieldId] || '';
    const isUploading = paymentUploadingFiles[fieldId];

    switch (field.fieldtype) {
      case 'image': {
        const previewSrc = paymentPreviewUrls[fieldId] || value;
        return (
          <div>
            <Label>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handlePaymentFileUpload(platform.code, field.key, field.fieldtype, file);
                }}
                disabled={isUploading}
              />
              {isUploading && <span className="text-sm text-gray-500">{translate('Uploading...')}</span>}
            </div>
            {previewSrc && (
              <img src={previewSrc} alt="Preview" className="mt-2 h-20 rounded border" />
            )}
          </div>
        );
      }
      case 'textarea':
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({ ...prev, [fieldId]: e.target.value }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
      case 'url':
      case 'text':
      case 'password':
      default:
        return (
          <div>
            <Label htmlFor={fieldId}>
              {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.fieldtype === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(e) =>
                setPaymentConfigValues((prev) => ({ ...prev, [fieldId]: e.target.value }))
              }
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  const onSubmit = (formData) => {
    if (!validatePaymentConfig()) return;

    const { serviceoffered, serviceprice } = syncServiceDraftToPayload();
    const paymentconfigdraft = buildPaymentConfigDraft();

    const payload = {
      name: formData.name,
      organisationtypeid: Number(formData.organisationtypeid),
      agreeServiceTerms: !!formData.agreeServiceTerms,
      states: [formData.states],
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      url: formData.url || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      canbedonated: !!formData.canbedonated,
      canmanagemosque: !!formData.canmanagemosque,
      isgraveservices: !!formData.isgraveservices,
      serviceoffered: formData.isgraveservices ? serviceoffered : [],
      serviceprice: formData.isgraveservices ? serviceprice : {},
      contactname: formData.contactname,
      contactemail: formData.contactemail,
      contactphoneno: formData.contactphoneno || null,
      paymentconfigdraft,
    };

    registerMutation.mutate(payload);
  };

  const handleFormSubmit = handleSubmit((formData) => {
    if (!formData.agreeServiceTerms) {
      setPendingSubmitData(formData);
      setAgreementOpen(true);
      return;
    }
    onSubmit(formData);
  });

  const handleAgreementAccept = () => {
    setValue("agreeServiceTerms", true, { shouldValidate: true });
    setAgreementOpen(false);
    if (pendingSubmitData) {
      onSubmit({ ...pendingSubmitData, agreeServiceTerms: true });
      setPendingSubmitData(null);
    }
  };

  const handleAgreementClose = () => {
    setAgreementOpen(false);
    setPendingSubmitData(null);
    setValue("agreeServiceTerms", false, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title={translate("Organisation Register")} />

      <div className="px-2 max-w-3xl mx-auto space-y-4">
        <Card className="border-0 shadow-md m-0">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-slate-600">
              {translate(
                "Submit your organisation details. Admin will review and approve or reject your request.",
              )}
            </p>
            <p className="text-xs text-slate-500">
              {translate(
                "If approved, a temporary admin account will be created using contact email with default password: password",
              )}
            </p>
          </CardContent>
        </Card>

        {isSubmitted && (
          <Card className="border border-emerald-100 shadow-sm bg-emerald-50">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  {translate("Registration submitted")}
                </p>
                <p className="text-xs text-emerald-700/80">
                  {translate("Your request is pending admin approval.")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <TextInputForm
                name="name"
                control={control}
                label={translate("Organisation Name")}
                required
                errors={errors}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectForm
                  name="organisationtypeid"
                  control={control}
                  placeholder={translate("Select organisation type")}
                  label={translate("Organisation Type")}
                  options={allowedTypeOptions}
                  required
                  errors={errors}
                />

                <SelectForm
                  name="states"
                  control={control}
                  placeholder={translate("Select state")}
                  label={translate("State")}
                  options={STATES_MY}
                  required
                  errors={errors}
                />
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
                  label={translate("Organisation Phone")}
                  isPhone
                />
                <TextInputForm
                  name="email"
                  control={control}
                  label={translate("Organisation Email")}
                  isEmail
                />
              </div>

              <TextInputForm
                name="url"
                control={control}
                label={translate("Website URL")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{translate("Latitude")}</Label>
                  <ControllerInput
                    name="latitude"
                    control={control}
                    placeholder={translate("Enter latitude")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{translate("Longitude")}</Label>
                  <ControllerInput
                    name="longitude"
                    control={control}
                    placeholder={translate("Enter longitude")}
                  />
                </div>
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
              
              <CheckboxForm
                name="canmanagemosque"
                control={control}
                label={translate("Can Manage Mosque")}
              />
              <CheckboxForm
                name="canbedonated"
                control={control}
                label={translate("Can Be Donated")}
              />           
              <CheckboxForm
                name="isgraveservices"
                control={control}
                label={translate("Grave Services")}
              />

              {isGraveServicesChecked && (
                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <Label>{translate("Services")}</Label>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addServiceEntry}
                        className="w-fit"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {translate("Add Service")}
                      </Button>
                    </div>
                  </div>
                  {serviceEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="space-y-1 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2"
                    >
                      <div className="flex gap-2 sm:contents">

                        <div className="flex-1 space-y-1 sm:col-span-7">
                          <Label className="text-xs text-slate-500">
                            {translate("Service Name")}
                          </Label>
                          <Input
                            placeholder={translate("Service Name")}
                            value={entry.service}
                            onChange={(e) =>
                              updateServiceEntry(entry.id, "service", e.target.value)
                            }
                          />
                        </div>

                        <div className="w-28 space-y-1 sm:w-auto sm:col-span-4">
                          <Label className="text-xs text-slate-500">
                            {translate("Price")}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="RM 0.00"
                            value={entry.price}
                            onChange={(e) =>
                              updateServiceEntry(entry.id, "price", e.target.value)
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="mt-7 bg-red-600 hover:bg-red-700 text-white hover:text-white sm:mt-0 sm:col-span-1"
                          onClick={() => removeServiceEntry(entry.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              <br />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  {translate('Payment Config')}
                </h3>
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {translate('Select Payment Platforms')}
                  </Label>
                  <div className="grid gap-3">
                    {paymentPlatforms.filter(p => p?.code).map(platform => (
                      <Label
                        key={platform.code}
                        className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedPaymentPlatforms.includes(platform.code)}
                          onCheckedChange={() => togglePaymentPlatform(platform.code)}
                        />
                        <div>
                          <span className="font-medium">{platform.name}</span>
                          <Badge variant="secondary" className="ml-2 capitalize text-xs">
                            {platform.category}
                          </Badge>
                        </div>
                      </Label>
                    ))}
                  </div>
                </div>

                {selectedPaymentPlatforms.map(platformCode => {
                  const platform = paymentPlatforms.find(p => p?.code === platformCode);
                  const fields = paymentFields.filter(f => f?.platformCode === platformCode);

                  if (!platform || fields.length === 0) return null;

                  return (
                    <div key={platformCode} className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        {platform.name} {translate('config')}
                      </h3>
                      <div className="space-y-4">
                        {fields.map(field => (
                          <div key={field.id}>
                            {renderPaymentField(platform, field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr />

              <p className="text-sm font-semibold text-slate-700">
                {translate("Contact Person (Temporary Admin)")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInputForm
                  name="contactname"
                  control={control}
                  label={translate("Full Name")}
                  required
                  errors={errors}
                />
                <TextInputForm
                  name="contactphoneno"
                  control={control}
                  label={translate("Phone No")}
                  isPhone
                  required
                  errors={errors}
                />
              </div>

              <TextInputForm
                name="contactemail"
                control={control}
                label={translate("Username")}
                required
                errors={errors}
              />

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={
                  registerMutation.isPending ||
                  isSubmitting ||
                  isPaymentUploading ||
                  allowedTypesQuery.isLoading
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {translate("Submit Registration")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={agreementOpen} onOpenChange={(open) => (!open ? handleAgreementClose() : null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">            
            <DialogHeader>
              <DialogTitle>{translate("Service Agreement")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700">
              <p>
                {translate("This Service Agreement outlines the terms for offering services through the platform. By accepting, you agree to the conditions below.")}
              </p>
              <p>
                {translate("Service Payout: For each successful service payment, 95% of the net amount is allocated to your organisation and 5% is retained by the platform as a service fee. Net amount excludes refunds, chargebacks, and payment processor fees when applicable.")}
              </p>
              <p>
                {translate("Service Delivery: You will provide the listed services to end users as described, maintain accurate pricing and service information, and handle requests promptly and professionally.")}
              </p>
              <p>
                {translate("Payout Schedule: Payouts are processed according to the selected payment platform’s schedule and may be delayed due to verification, compliance checks, or dispute resolution.")}
              </p>
              <p>
                {translate("Compliance: You are responsible for all applicable taxes, statutory obligations, and regulatory compliance for the services provided and payments received.")}
              </p>
              <p>
                {translate("Disputes & Enforcement: The platform may investigate disputes and may suspend, modify, or remove services that violate policies or result in repeated complaints.")}
              </p>
              <p>
                {translate("Updates: The platform may update these terms with reasonable notice. Continued use of the service constitutes acceptance of updated terms.")}
              </p>
            </div>
            <div className="pt-2">
              <CheckboxForm
                name="agreeServiceTerms"
                control={control}
                label={translate("I agree to the 95:5 service payout agreement")}
              />
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                onClick={handleAgreementAccept}
                disabled={!watch("agreeServiceTerms")}
              >
                {translate("Accept")}
              </Button>
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                onClick={handleAgreementClose}
              >
                {translate("Reject")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ControllerInput({ name, control, placeholder }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          type="text"
          value={field.value ?? ""}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    />
  );
}
