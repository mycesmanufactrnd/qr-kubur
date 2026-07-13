// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Users, Loader2, Search, RotateCcw } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { showApiError } from "@/components/ToastrNotification";
import { useLocationContext } from "@/providers/LocationProvider";
import { initFCM } from "@/firebase/firebase";
import { defaultQariahRegistration } from "@/utils/defaultformfields";

const STORAGE_KEY = "qariahRegisteredMember";

const SectionTitle = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 pb-1 border-b border-slate-100 dark:border-slate-700">
    {children}
  </p>
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

export default function UserQariahRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const { userState } = useLocationContext();

  const [savedRegistration, setSavedRegistration] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedIc, setSearchedIc] = useState("");
  const [searchMosqueId, setSearchMosqueId] = useState(null);
  const [foundMember, setFoundMember] = useState(null);
  const [saveDismissed, setSaveDismissed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setSavedRegistration(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const { data: mosques = [], isLoading: mosqueLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery({
      state: selectedState || null,
      hasDeathCharity: true,
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
    defaultValues: defaultQariahRegistration
  });

  const registerMutation = trpc.deathCharityMember.registerQariah.useMutation({
    onSuccess: () => setIsSubmitted(true),
    onError: (err) => showApiError(err),
  });

  const saveQariahDeviceToken = trpc.qariahDevice.saveToken.useMutation();

  const searchQuery = trpc.deathCharityMember.searchByIcNumber.useQuery(
    { icnumber: searchedIc, mosqueId: searchMosqueId },
    { enabled: !!searchedIc, staleTime: 0 },
  );

  useEffect(() => {
    if (!searchedIc || searchQuery.isFetching) return;
    setFoundMember(searchQuery.data ?? null);
    setHasSearched(true);
  }, [searchQuery.data, searchQuery.isFetching, searchedIc]);

  const onSubmit = async (data) => {
    const icnumber = data.icnumber.replace(/-/g, "");
    const mosqueId = data.mosqueId ? Number(data.mosqueId) : null;

    const token = await initFCM();

    await registerMutation.mutateAsync({
      fullname: data.fullname,
      icnumber,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      mosque: mosqueId ? { id: mosqueId } : null,
    });

    if (token) {
      saveQariahDeviceToken.mutate({
        fcmQariahToken: token,
        icnumber,
        mosqueId,
      });
    }
  };

  useEffect(() => {
    if (userState && STATES_MY.includes(userState)) {
      setValue("state", userState);
      setSelectedState(userState);
    }
  }, [userState, setValue]);

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
    if (!foundMember) return;
    const record = {
      fullname: foundMember.fullname ?? "",
      icnumber: foundMember.icnumber ?? searchedIc,
      mosqueName: foundMember.mosque?.name ?? "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setSavedRegistration(record);
  };

  const handleForgetRegistration = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedRegistration(null);
    handleReset();
    reset();
    setSelectedState("");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <BackNavigation title={translate("Qariah Registration")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
            {translate("Registration Submitted")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            {translate(
              "Your Qariah registration has been submitted and is pending approval.",
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
      </div>
    );
  }

  if (savedRegistration) {
    return (
      <div className="min-h-screen flex flex-col">
        <BackNavigation title={translate("Qariah Registration")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
            {translate("You're Already Registered")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            {translate("This IC number is already registered as a Qariah member.")}
          </p>

          <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
            <InfoRow label={translate("Name")} value={savedRegistration.fullname || "-"} />
            <InfoRow
              label={translate("IC Number")}
              value={formatIcDisplay(savedRegistration.icnumber)}
            />
            <InfoRow label={translate("Mosque")} value={savedRegistration.mosqueName || "-"} />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <BackNavigation title={translate("Qariah Registration")} />

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {translate("Qariah Registration")}
            </p>
            <p className="text-xs text-slate-400">
              {translate("Register as a member of your local mosque Qariah")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
          <SectionTitle>{translate("Check Registration Status")}</SectionTitle>
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
            options={mosques.map((m) => ({ value: String(m.id), label: m.name }))}
            errors={errors}
            disabled={!selectedState || hasSearched}
            loading={mosqueLoading}
            disabledMessage={translate("Select state first")}
            placeholder={translate("Search mosque...")}
            searchPlaceholder={translate("Search mosque...")}
            emptyMessage={translate("No mosque found")}
            noSelectionMessage={translate("Please select a state to see available mosques")}
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

          {!hasSearched && (
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
          )}

          {hasSearched && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="w-full h-11 rounded-xl font-semibold text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {translate("Search Again")}
            </Button>
          )}
        </div>

        {hasSearched && foundMember && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {translate("You're Already Registered")}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {translate("This IC number is already registered as a Qariah member.")}
            </p>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
              <InfoRow label={translate("Name")} value={foundMember.fullname || "-"} />
              <InfoRow
                label={translate("IC Number")}
                value={formatIcDisplay(foundMember.icnumber)}
              />
              <InfoRow label={translate("Mosque")} value={foundMember.mosque?.name || "-"} />
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

        {hasSearched && !foundMember && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {translate(
                  "No registration found for this IC number. Please complete the form below to register.",
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
              <SectionTitle>{translate("Personal Information")}</SectionTitle>

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
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || registerMutation.isPending}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm"
            >
              {(isSubmitting || registerMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {translate("Submit Registration")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
