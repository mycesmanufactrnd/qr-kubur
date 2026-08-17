// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/index";
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageTextCaptcha from "@/components/ImageTextCaptcha";
import { showError, showWarning } from "@/components/ToastrNotification";
import BackNavigation from "@/components/BackNavigation";
import { useForm } from "react-hook-form";
import { validateFields } from "@/utils/validations";
import { trpc } from "@/utils/trpc";
import {
  useCreateSuggestion,
  useRecentCountSuggestion,
} from "@/mutations/useSuggestionMutations";
import { useGetGravesCoordinates } from "@/mutations/useGraveMutations";
import { showEarthDistance } from "@/utils/helpers";
import { defaultSuggestionField } from "@/utils/defaultformfields";
import { useLocationContext } from "@/providers/LocationProvider";
import { ipAddressQueryOptions } from "@/utils/queryOptions";
import { useAdminAccess, getStoredGoogleUser } from "@/utils/auth";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";

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
  const watchState = watch("state");
  const watchSelectedGrave = watch("watchSelectedGrave");

  const createMutation = useCreateSuggestion();

  useEffect(() => {
    if (userState && STATES_MY.includes(userState) && !watchState) {
      setValue("state", userState);
    }
  }, [userState, setValue]);

  const coordinates = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : null;

  const { data: graves = [], isLoading: isGravesLoading } =
    useGetGravesCoordinates(
      coordinates,
      watchState ? { state: watchState } : {},
    );

  const graveOptions = useMemo(
    () =>
      graves.map((g) => ({
        value: String(g.id),
        label:
          g.distance != null
            ? `${g.name} (${showEarthDistance(g.distance)})`
            : g.name,
      })),
    [graves],
  );

  const { data: persons, isLoading: isPersonLoading } =
    trpc.deadperson.getDeadPersonByGraveId.useQuery(
      { graveId: Number(watchSelectedGrave) ?? 0 },
      { enabled: !!watchSelectedGrave },
    );

  const personOptions = useMemo(
    () => (persons ?? []).map((p) => ({ value: String(p.id), label: p.name })),
    [persons],
  );

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: "name", label: "Name", type: "text" },
      { field: "phoneno", label: "Phone No.", type: "phone" },
      { field: "type", label: "Record Type", type: "select" },
      { field: "state", label: "State", type: "select" },
      { field: "entityId", label: "Record", type: "select" },
      { field: "suggestedchanges", label: "Suggested Changes", type: "text" },
      { field: "reason", label: "Reason", type: "text" },
    ]);

    if (!isValid) return;

    if (recentCount >= 3) {
      showWarning(
        translate("You have reached the limit of 3 suggestions per hour"),
      );
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
      type === "person" ? selectedGraveId : type === "grave" ? entityId : null;
    const selectedGrave = graveId
      ? graves.find((g) => String(g.id) === String(graveId))
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
              {translate(
                "Your suggestion has been submitted to the admin for review. We will notify you after the review is complete.",
              )}
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

            <SelectForm
              name="type"
              control={control}
              label={translate("Record Type")}
              placeholder={translate("Select Record Type")}
              options={[
                { value: "person", label: translate("Record Person") },
                { value: "grave", label: translate("Record Grave") },
              ]}
              required
              errors={errors}
              onValueChange={() => {
                setValue("watchSelectedGrave", "");
                setValue("entityId", "");
              }}
            />

            {watchType && (
              <SelectForm
                name="state"
                control={control}
                label={translate("State")}
                placeholder={translate("Select state")}
                options={STATES_MY}
                required
                errors={errors}
                onValueChange={() => {
                  setValue("watchSelectedGrave", "");
                  setValue("entityId", "");
                }}
              />
            )}

            {watchType === "person" && (
              <Select2Form
                name="watchSelectedGrave"
                control={control}
                label={translate("Select Grave")}
                required
                errors={errors}
                options={graveOptions}
                disabled={!watchState}
                loading={isGravesLoading}
                disabledMessage={
                  !watchState ? translate("Select state first") : undefined
                }
                noSelectionMessage={
                  !watchState
                    ? translate("Please select a state to see available graves")
                    : undefined
                }
                placeholder={translate("Select nearby grave")}
                searchPlaceholder={translate("Search grave...")}
                emptyMessage={translate("No grave found")}
                onValueChange={() => setValue("entityId", "")}
              />
            )}

            {watchType === "person" && watchSelectedGrave && (
              <Select2Form
                name="entityId"
                control={control}
                label={translate("Select Deceased")}
                required
                errors={errors}
                options={personOptions}
                loading={isPersonLoading}
                placeholder={translate("Select Deceased")}
                searchPlaceholder={translate("Search deceased...")}
                emptyMessage={translate("No deceased found")}
              />
            )}

            {watchType === "grave" && (
              <Select2Form
                name="entityId"
                control={control}
                label={translate("Select Grave")}
                required
                errors={errors}
                options={graveOptions}
                disabled={!watchState}
                loading={isGravesLoading}
                disabledMessage={
                  !watchState ? translate("Select state first") : undefined
                }
                noSelectionMessage={
                  !watchState
                    ? translate("Please select a state to see available graves")
                    : undefined
                }
                placeholder={translate("Select nearby grave")}
                searchPlaceholder={translate("Search grave...")}
                emptyMessage={translate("No grave found")}
              />
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
                {translate(
                  "Example: 'The name should be Ahmad bin Abu, not Ahmad bin Bakar'",
                )}
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
