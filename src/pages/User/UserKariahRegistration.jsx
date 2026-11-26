// @ts-nocheck
import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  Search,
  RotateCcw,
  MapPin,
  Info,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { useLocationContext } from "@/providers/LocationProvider";
import { initFCM } from "@/firebase/firebase";
import { defaultKariahRegistration } from "@/utils/defaultformfields";
import {
  useCheckKariahStatus,
  useSavedKariahMembership,
  useQariahMemberMutations,
} from "@/mutations/useQariahMemberMutations";
import { getGoogleIdToken } from "@/utils/auth";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.myces.qubur&pcampaignid=web_share";
const APP_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.myces.qubur&pcampaignid=web_share";

function QrHeader({ title, subtitle }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/10 pt-8 pb-6">
      <div className="pointer-events-none absolute left-1/2 top-[-90px] -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-200/40 dark:bg-emerald-800/20 blur-3xl" />
      <div className="relative px-4 max-w-lg mx-auto w-full flex flex-col items-center text-center gap-2.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function AppDownloadFooter() {
  return (
    <div className="border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-lg mx-auto w-full px-4 pt-5 pb-8 flex flex-col items-center text-center gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {translate("Get the Qubur App for faster access")}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            className="transition-transform active:scale-95"
          >
            <img
              src="/applestore.png"
              alt="Download on the App Store"
              className="h-9 w-auto object-contain"
            />
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get it on Google Play"
            className="transition-transform active:scale-95"
          >
            <img
              src="/playstore.png"
              alt="Get it on Google Play"
              className="h-9 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

// result / register cards slide in after "Cari", like the app's other reveals
const REVEAL =
  "animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none";

// Semak -> Daftar: shows where the user is in the check-then-register flow.
const StepIndicator = ({ labels, active }) => (
  <div className="flex items-center gap-2">
    {labels.map((label, i) => {
      const step = i + 1;
      const reached = step <= active;
      return (
        <Fragment key={step}>
          {i > 0 && (
            <div
              className={`h-px flex-1 transition-colors duration-300 ${reached ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`}
            />
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors duration-300 ${reached ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-700"}`}
            >
              {step}
            </span>
            <span
              className={`text-xs font-medium ${step === active ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}`}
            >
              {label}
            </span>
          </div>
        </Fragment>
      );
    })}
  </div>
);

// `action`: optional control shown at the right end of the title row
const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-700">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
      {children}
    </p>
    {action}
  </div>
);

const formatIcDisplay = (icnumber) => {
  const digits = (icnumber || "").replace(/\D/g, "");
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="font-medium text-slate-800 dark:text-slate-100 text-right">
      {value}
    </span>
  </div>
);

export default function UserKariahRegistration() {
  const location = useLocation();
  const preselectedMosque = location.state?.mosque;
  const [searchParams] = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const { userState } = useLocationContext();

  const {
    membership: savedRegistration,
    save: saveMembership,
    forget: forgetMembership,
  } = useSavedKariahMembership();
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedIc, setSearchedIc] = useState("");
  const [searchMosqueId, setSearchMosqueId] = useState(null);
  const [foundMember, setFoundMember] = useState(null);
  const [saveDismissed, setSaveDismissed] = useState(false);

  const urlParamType = searchParams.get("type");
  const isQrView = urlParamType === "qr";

  const { data: mosques = [], isLoading: mosqueLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery({
      state: selectedState || null,
      hasKariahRegistration: true,
    });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultKariahRegistration,
  });

  const { registerQariahMember: registerMutation } = useQariahMemberMutations();

  const saveKariahDeviceToken = trpc.kariahDevice.saveToken.useMutation();

  const searchQuery = useCheckKariahStatus({
    icnumber: searchedIc,
    mosqueId: searchMosqueId,
  });

  const isRegistering = hasSearched && !foundMember;
  const searchedMosqueName =
    foundMember?.mosque?.name ??
    mosques.find((m) => m.id === searchMosqueId)?.name;

  useEffect(() => {
    if (!searchedIc || searchQuery.isFetching) return;
    setFoundMember(searchQuery.data ?? null);
    setHasSearched(true);
  }, [searchQuery.data, searchQuery.isFetching, searchedIc]);

  const onSubmit = async (data) => {
    const icnumber = data.icnumber.replace(/-/g, "");
    const mosqueId = data.mosqueId ? Number(data.mosqueId) : null;

    const token = await initFCM();
    // links the registration to the signed-in Google account (null if none)
    const googleIdToken = await getGoogleIdToken();

    try {
      await registerMutation.mutateAsync({
        fullname: data.fullname,
        icnumber,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        mosqueId,
        googleIdToken,
      });
    } catch {
      return; // error toast comes from the hook
    }
    setIsSubmitted(true);

    if (token) {
      saveKariahDeviceToken.mutate({
        fcmKariahToken: token,
        icnumber,
        mosqueId,
      });
    }
  };

  useEffect(() => {
    if (preselectedMosque?.state) {
      setValue("state", preselectedMosque.state);
      setSelectedState(preselectedMosque.state);
    } else if (userState && STATES_MY.includes(userState)) {
      setValue("state", userState);
      setSelectedState(userState);
    }
  }, [preselectedMosque, userState, setValue]);

  useEffect(() => {
    if (preselectedMosque?.id) {
      setValue("mosqueId", String(preselectedMosque.id));
    }
  }, [preselectedMosque, setValue]);

  const handleSearch = async () => {
    const valid = await trigger(["state", "mosqueId", "icnumber"]);
    if (!valid) return;

    const ic = (getValues("icnumber") || "").replace(/-/g, "").trim();
    const mosqueIdVal = getValues("mosqueId");

    setSaveDismissed(false);
    setFoundMember(null);
    setHasSearched(false);
    setSearchMosqueId(mosqueIdVal ? Number(mosqueIdVal) : null);
    setSearchedIc(ic);
  };

  const handleReset = () => {
    setHasSearched(false);
    setSearchedIc("");
    setSearchMosqueId(null);
    setFoundMember(null);
    setSaveDismissed(false);
    setValue("fullname", "");
    setValue("phone", "");
    setValue("email", "");
    setValue("address", "");
  };

  const handleSaveRegistration = () => {
    if (!foundMember || !searchMosqueId) return;
    saveMembership({
      icnumber: searchedIc,
      mosqueId: searchMosqueId,
      mosqueName: foundMember.mosque?.name ?? "",
      isApproved: !!foundMember.isapproved,
    });
  };

  const handleForgetRegistration = () => {
    forgetMembership();
    handleReset();
    reset();
    setSelectedState("");
  };

  if (isSubmitted) {
    return (
      <div
        className={`min-h-screen flex flex-col ${
          isQrView
            ? "bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/10 dark:via-slate-900 dark:to-slate-900"
            : ""
        }`}
      >
        {isQrView ? (
          <QrHeader title={translate("Kariah Registration")} />
        ) : (
          <BackNavigation title={translate("Kariah Registration")} />
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-4">
          <div className="relative w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center ring-8 ring-emerald-50/60 dark:ring-emerald-900/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
            {translate("Registration Submitted")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            {translate(
              "Your Kariah registration has been submitted and is pending approval.",
            )}
          </p>
          <Button
            className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            onClick={() => {
              setIsSubmitted(false);
              reset();
              setSelectedState("");
              handleReset();
            }}
          >
            {translate("Register Another")}
          </Button>
        </div>

        {isQrView && <AppDownloadFooter />}
      </div>
    );
  }

  if (savedRegistration) {
    return (
      <div
        className={`min-h-screen flex flex-col ${
          isQrView
            ? "bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/10 dark:via-slate-900 dark:to-slate-900"
            : ""
        }`}
      >
        {isQrView ? (
          <QrHeader title={translate("Kariah Registration")} />
        ) : (
          <BackNavigation title={translate("Kariah Registration")} />
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${savedRegistration.isApproved ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}
          >
            {savedRegistration.isApproved ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <Clock className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
            {savedRegistration.isApproved
              ? translate("You're Already Registered")
              : translate("Registration Pending Approval")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            {savedRegistration.isApproved
              ? translate(
                  "This IC number is already registered as a Kariah member.",
                )
              : translate(
                  "Your Kariah registration has been submitted and is pending approval.",
                )}
          </p>

          <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
            <InfoRow
              label={translate("IC Number")}
              value={formatIcDisplay(savedRegistration.icnumber)}
            />
            <InfoRow
              label={translate("Mosque")}
              value={savedRegistration.mosqueName || "-"}
            />
          </div>

          <Button
            variant="outline"
            className="mt-2 rounded-xl"
            onClick={handleForgetRegistration}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {translate("Search Again")}
          </Button>
        </div>

        {isQrView && <AppDownloadFooter />}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isQrView
          ? "bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/10 dark:via-slate-900 dark:to-slate-900"
          : ""
      }`}
    >
      {isQrView ? (
        <QrHeader
          title={translate("Kariah Registration")}
          subtitle={translate(
            "Register or check your membership status with your local mosque Kariah.",
          )}
        />
      ) : (
        <BackNavigation title={translate("Kariah Registration")} />
      )}

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
        {!isQrView && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mb-2">
            {translate("Register as a member of your local mosque Kariah")}
          </p>
        )}

        {/* found: approval progress (Menunggu -> Diluluskan); else Semak -> Daftar */}
        {foundMember ? (
          <StepIndicator
            labels={[translate("Pending"), translate("Approved")]}
            active={foundMember.isapproved ? 2 : 1}
          />
        ) : (
          <StepIndicator
            labels={[translate("Check"), translate("Register")]}
            active={isRegistering ? 2 : 1}
          />
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4">
          <SectionTitle
            action={
              hasSearched && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 rounded-lg px-2 py-1 -my-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:opacity-70"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {translate("Search Again")}
                </button>
              )
            }
          >
            {translate("Check Registration Status")}
          </SectionTitle>

          {hasSearched && (
            <div className="flex items-start gap-3 animate-in fade-in duration-300 motion-reduce:animate-none">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">
                  {searchedMosqueName || "-"}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedState && `${selectedState} · `}
                  <span className="whitespace-nowrap">
                    {formatIcDisplay(searchedIc)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* kept mounted (only hidden) after a search so the form keeps state/mosque/IC */}
          <div className={hasSearched ? "hidden" : "space-y-4"}>
          <p className="text-xs text-slate-400 -mt-2">
            {translate(
              "Select your state and mosque, then enter your IC number to check if you're already registered.",
            )}
          </p>

          <SelectForm
            name="state"
            control={control}
            label={translate("State")}
            placeholder={translate("Select state")}
            options={STATES_MY}
            required
            errors={errors}
            disabled={hasSearched}
            onValueChange={(val) => {
              setSelectedState(val);
              setValue("mosqueId", "");
            }}
          />

          <Select2Form
            name="mosqueId"
            control={control}
            label={translate("Mosque")}
            required
            options={mosques.map((m) => ({
              value: String(m.id),
              label: m.name,
            }))}
            errors={errors}
            disabled={!selectedState || hasSearched}
            loading={mosqueLoading}
            disabledMessage={
              !selectedState ? translate("Select state first") : undefined
            }
            placeholder={translate("Search mosque...")}
            searchPlaceholder={translate("Search mosque...")}
            emptyMessage={translate("No mosque found")}
            noSelectionMessage={
              !selectedState
                ? translate("Please select a state to see available mosques")
                : undefined
            }
          />

          <TextInputForm
            name="icnumber"
            control={control}
            label={translate("IC Number")}
            required
            errors={errors}
            isICNumber
            disabled={hasSearched}
            placeholder="000000-00-0000"
          />

          <Button
            type="button"
            onClick={handleSearch}
            disabled={searchQuery.isFetching}
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm"
          >
            {searchQuery.isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {translate("Search")}
          </Button>
          </div>
        </div>

        {hasSearched && foundMember && (
          <div
            className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-4 space-y-3 ${REVEAL} ${foundMember.isapproved ? "border-emerald-100 dark:border-emerald-800" : "border-amber-100 dark:border-amber-800"}`}
          >
            <div className="flex items-center gap-2">
              {foundMember.isapproved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500" />
              )}
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {foundMember.isapproved
                  ? translate("You're Already Registered")
                  : translate("Registration Pending Approval")}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {foundMember.isapproved
                ? translate(
                    "This IC number is already registered as a Kariah member.",
                  )
                : translate(
                    "Your Kariah registration has been submitted and is pending approval.",
                  )}
            </p>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
              <InfoRow
                label={translate("IC Number")}
                value={formatIcDisplay(searchedIc)}
              />
              <InfoRow
                label={translate("Mosque")}
                value={foundMember.mosque?.name || "-"}
              />
            </div>

            {!saveDismissed && (
              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {translate(
                    "Save this on your device so you won't need to search again next time you visit.",
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveRegistration}
                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm"
                  >
                    {translate("Save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDismissed(true)}
                    className="flex-1 h-10 rounded-xl text-sm"
                  >
                    {translate("Not Now")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isRegistering && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4 ${REVEAL}`}
          >
              <SectionTitle>{translate("Personal Information")}</SectionTitle>

              <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                <Info className="w-4 h-4 mt-px shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {translate(
                    "No registration found for this IC number. Please complete the form below to register.",
                  )}
                </p>
              </div>

              <TextInputForm
                name="fullname"
                control={control}
                label={translate("Full Name")}
                required
                errors={errors}
                placeholder={translate("As per IC")}
              />

              <TextInputForm
                name="phone"
                control={control}
                label={translate("Phone Number")}
                required
                errors={errors}
                isPhone
                placeholder="0123456789"
              />

              <TextInputForm
                name="email"
                control={control}
                label={translate("Email")}
                errors={errors}
                isEmail
                placeholder="email@example.com"
              />

              <TextInputForm
                name="address"
                control={control}
                label={translate("Address")}
                errors={errors}
                isTextArea
                rows={3}
                placeholder={translate("Street, Area, City")}
              />

            <Button
              type="submit"
              disabled={isSubmitting || registerMutation.isPending}
              className="w-full h-11 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm"
            >
              {(isSubmitting || registerMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {translate("Submit Registration")}
            </Button>
          </form>
        )}
      </div>

      {isQrView && <AppDownloadFooter />}
    </div>
  );
}