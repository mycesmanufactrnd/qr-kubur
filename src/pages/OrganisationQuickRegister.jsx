import { useMemo, useState } from "react";
import { Building2, MapPin, Plus, Save, X, CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { showApiError, showSuccess } from "@/components/ToastrNotification";

const defaultQuickRegisterForm = {
  name: "",
  organisationtypeid: "",
  agreeServiceTerms: false,
  states: "",
  address: "",
  phone: "",
  email: "",
  url: "",
  photourl: "",
  latitude: "",
  longitude: "",
  canbedonated: false,
  isgraveservices: false,
  contactname: "",
  contactemail: "",
  contactphoneno: "",
};

export default function OrganisationQuickRegister() {
  const [serviceEntries, setServiceEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
  const isAgreementChecked = watch("agreeServiceTerms");

  const allowedTypesQuery = trpc.tempOrganisation.getAllowedOrganisationTypes.useQuery();

  const registerMutation = trpc.tempOrganisation.register.useMutation({
    onSuccess: () => {
      showSuccess("Organisation registration", "create");
      setIsSubmitted(true);
      reset(defaultQuickRegisterForm);
      setServiceEntries([]);
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

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.file_url;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (formData) => {
    const { serviceoffered, serviceprice } = syncServiceDraftToPayload();

    const payload = {
      name: formData.name,
      organisationtypeid: Number(formData.organisationtypeid),
      agreeServiceTerms: !!formData.agreeServiceTerms,
      states: [formData.states],
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      url: formData.url || null,
      photourl: formData.photourl || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      canbedonated: !!formData.canbedonated,
      isgraveservices: !!formData.isgraveservices,
      serviceoffered: formData.isgraveservices ? serviceoffered : [],
      serviceprice: formData.isgraveservices ? serviceprice : {},
      contactname: formData.contactname,
      contactemail: formData.contactemail,
      contactphoneno: formData.contactphoneno || null,
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 pb-10">
      <BackNavigation title={translate("Organisation Register")} />

      <div className="px-2 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {translate("Quick Organisation Register")}
          </h1>
        </div>

        <Card className="border-0 shadow-md">
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

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  {translate("Service Agreement")}
                </p>
                <p className="text-xs text-slate-600">
                  {translate("Our platform hosts your organisation services so end users can request and pay for services such as cleaning, maintenance, and similar offerings.")}
                </p>
                <p className="text-xs text-slate-600">
                  {translate("For each successful service payment, 95% goes to your organisation and 5% is platform fee.")}
                </p>
                <CheckboxForm
                  name="agreeServiceTerms"
                  control={control}
                  label={translate("I agree to the 95:5 service payout agreement")}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <FileUploadForm
                name="photourl"
                control={control}
                label={translate("Photo")}
                bucketName="bucket-organisation"
                uploading={uploading}
                handleFileUpload={handleFileUpload}
                translate={translate}
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
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setValue("latitude", pos.coords.latitude.toFixed(16));
                    setValue("longitude", pos.coords.longitude.toFixed(16));
                  });
                }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {translate("Get Current Location")}
              </Button>

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
                  <Label>{translate("Services")}</Label>
                  {serviceEntries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-7"
                        placeholder={translate("Service Name")}
                        value={entry.service}
                        onChange={(e) => updateServiceEntry(entry.id, "service", e.target.value)}
                      />
                      <Input
                        className="col-span-4"
                        type="number"
                        step="0.01"
                        placeholder="RM 0.00"
                        value={entry.price}
                        onChange={(e) => updateServiceEntry(entry.id, "price", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white hover:text-white rounded-md"
                        onClick={() => removeServiceEntry(entry.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addServiceEntry}>
                    <Plus className="w-4 h-4 mr-2" />
                    {translate("Add Service")}
                  </Button>
                </div>
              )}

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
                  label={translate("Phone No.")}
                  isPhone
                />
              </div>

              <TextInputForm
                name="contactemail"
                control={control}
                label={translate("Contact Email")}
                isEmail
                required
                errors={errors}
              />

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={
                  registerMutation.isPending ||
                  isSubmitting ||
                  uploading ||
                  allowedTypesQuery.isLoading ||
                  !isAgreementChecked
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {translate("Submit Registration")}
              </Button>
            </form>
          </CardContent>
        </Card>
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
