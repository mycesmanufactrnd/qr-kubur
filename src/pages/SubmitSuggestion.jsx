// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/index";
import { CheckCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageTextCaptcha from "../components/ImageTextCaptcha";
import { showError, showWarning } from "../components/ToastrNotification";
import BackNavigation from "@/components/BackNavigation";
import { Controller, useForm } from "react-hook-form";
import { validateFields } from "@/utils/validations";
import { trpc } from "@/utils/trpc";
import {
  useCreateSuggestion,
  useRecentCountSuggestion,
} from "@/hooks/useSuggestionMutations";
import { useGetGravesCoordinates } from "@/hooks/useGraveMutations";
import { showEarthDistance } from "@/utils/helpers";
import { defaultSuggestionField } from "@/utils/defaultformfields";
import { useLocationContext } from "@/providers/LocationProvider";
import { ipAddressQueryOptions } from "@/utils/queryOptions";
import { useAdminAccess, getStoredGoogleUser } from "@/utils/auth";
import { translate } from "@/utils/translations";
import TextInputForm from "@/components/forms/TextInputForm";

const PHONE_STORAGE_KEY = "suggestion_phoneno";

export default function SubmitSuggestion() {
  const { userLocation, userState } = useLocationContext();
  const { currentUser } = useAdminAccess();
  const oneHourAgo = useMemo(
    () => new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    [],
  );
  const { data: visitorIp } = trpc.auth.getClientIp.useQuery(undefined, {
    ...ipAddressQueryOptions,
  });

  const recentCount = useRecentCountSuggestion(visitorIp, oneHourAgo);

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset: handleResetForm,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: defaultSuggestionField,
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullname) setValue("name", currentUser.fullname);
      if (currentUser.email) setValue("email", currentUser.email);
      if (currentUser.phoneno) setValue("phoneno", currentUser.phoneno);
      return;
    }

    let googleUser = null;
    try {
      const raw = localStorage.getItem("googleAuth");
      googleUser = raw ? JSON.parse(raw) : getStoredGoogleUser();
    } catch {
      googleUser = getStoredGoogleUser();
    }

    if (googleUser) {
      if (googleUser.name) setValue("name", googleUser.name);
      if (googleUser.email) setValue("email", googleUser.email);
      return;
    }

    const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
    if (savedPhone) setValue("phoneno", savedPhone);
  }, [currentUser]);

  const [submitted, setSubmitted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const watchType = watch("type");
  const watchSelectedGrave = watch("watchSelectedGrave");

  const createMutation = useCreateSuggestion();

  const { data: nearbyGraves = [] } = useGetGravesCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    userState,
  );

  const { data: persons, isLoading: isPersonLoading } =
    trpc.deadperson.getDeadPersonByGraveId.useQuery(
      { graveId: Number(watchSelectedGrave) ?? 0 },
      { enabled: !!watchSelectedGrave },
    );

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: "name", label: "Name", type: "text" },
      { field: "phoneno", label: "Phone No.", type: "phone" },
      { field: "type", label: "Record Type", type: "select" },
      { field: "entityId", label: "Record", type: "select" },
      { field: "suggestedchanges", label: "Suggested Changes", type: "text" },
      { field: "reason", label: "Reason", type: "text" },
    ]);

    if (!isValid) return;

    if (recentCount >= 3) {
      showWarning(translate("You have reached the limit of 3 suggestions per hour"));
      return;
    }

    const {
      name,
      phoneno,
      email,
      type,
      entityId,
      watchSelectedGrave: selectedGraveId,
      suggestedchanges,
      reason,
    } = formData;

    const suggestionData = {
      name,
      phoneno,
      email: email || null,
      type,
      suggestedchanges,
      reason,
      status: "pending",
      visitorip: visitorIp ?? null,
    };

    const graveId =
      type === "person"
        ? selectedGraveId
        : type === "grave"
          ? entityId
          : null;
    const selectedGrave = graveId
      ? nearbyGraves.find((g) => String(g.id) === String(graveId))
      : null;
    if (selectedGrave?.organisation?.id) {
      suggestionData.organisation = { id: selectedGrave.organisation.id };
    }

    if (type === "person") {
      suggestionData.grave = { id: Number(selectedGraveId) };
      suggestionData.deadperson = { id: Number(entityId) };
    }

    if (type === "grave") {
      suggestionData.grave = { id: Number(entityId) };
    }

    setPendingSubmission(suggestionData);
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = async () => {
    if (!pendingSubmission) return;

    createMutation.mutateAsync(pendingSubmission).then((res) => {
      if (res) {
        if (pendingSubmission.phoneno) {
          localStorage.setItem(PHONE_STORAGE_KEY, pendingSubmission.phoneno);
        }
        setSubmitted(true);
      }
    });
    setPendingSubmission(null);
  };

  const handleCaptchaFailed = () => {
    showError(translate("Captcha failed. Please refill the form."));
    handleResetForm();
    setPendingSubmission(null);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {translate("Suggestion Submitted!")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {translate("Your suggestion has been submitted to the admin for review. We will notify you after the review is complete.")}
            </p>
            <Link to={createPageUrl("UserDashboard")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {translate("Back to Main")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title={translate("Suggestion")} />

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4 space-y-4">

            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              placeholder={translate("Enter name")}
              required
              errors={errors}
            />

            <TextInputForm
              name="phoneno"
              control={control}
              label={translate("Phone No")}
              placeholder={translate("Enter Phone No")}
              isPhone
              required
              errors={errors}
            />

            <TextInputForm
              name="email"
              control={control}
              label={translate("Email")}
              placeholder={translate("Enter email")}
              isEmail
              errors={errors}
            />

            <div className="space-y-2">
              <Label className="dark:text-gray-300">
                {translate("Record Type")} <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue("watchSelectedGrave", "");
                      setValue("entityId", "");
                    }}
                  >
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                      <SelectValue placeholder={translate("Select Record Type")} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                      <SelectItem value="person">{translate("Record Person")}</SelectItem>
                      <SelectItem value="grave">{translate("Record Grave")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {watchType === "person" && (
              <div className="space-y-2">
                <Label className="dark:text-gray-300">
                  {translate("Select Grave")} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="watchSelectedGrave"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue placeholder={translate("Select nearby grave")} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {nearbyGraves.map((grave) => (
                          <SelectItem key={grave.id} value={String(grave.id)}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {grave.name}
                              {showEarthDistance(grave.distance)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {watchType === "person" && watchSelectedGrave && (
              <div className="space-y-2">
                <Label className="dark:text-gray-300">
                  {translate("Select Deceased")} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="entityId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue placeholder={translate("Select Deceased")} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {!isPersonLoading &&
                          persons?.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {watchType === "grave" && (
              <div className="space-y-2">
                <Label className="dark:text-gray-300">
                  {translate("Select Grave")} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="entityId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue placeholder={translate("Select nearby grave")} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {nearbyGraves.slice(0, 20).map((grave) => (
                          <SelectItem key={grave.id} value={String(grave.id)}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {grave.name}
                              {showEarthDistance(grave.distance)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div>
              <TextInputForm
                name="suggestedchanges"
                control={control}
                label={translate("Suggested Changes")}
                placeholder={translate("Specify Correction...")}
                isTextArea
                rows={5}
                required
                errors={errors}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {translate("Example: 'The name should be Ahmad bin Abu, not Ahmad bin Bakar'")}
              </p>
            </div>

            <TextInputForm
              name="reason"
              control={control}
              label={translate("Reason / Justification")}
              placeholder={translate("Reason...")}
              isTextArea
              rows={3}
              required
              errors={errors}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !watch("type") ||
                  !watch("entityId") ||
                  !watch("suggestedchanges")
                }
              >
                {translate("Submit Suggestion")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <ImageTextCaptcha
        open={showCaptcha}
        onOpenChange={setShowCaptcha}
        onVerified={handleCaptchaVerified}
        onFailed={handleCaptchaFailed}
      />
    </div>
  );
}
