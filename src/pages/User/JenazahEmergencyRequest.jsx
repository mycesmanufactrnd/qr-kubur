// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import FileUploadForm from "@/components/forms/FileUploadForm";
import MultipleFileUploadForm from "@/components/forms/MultipleFileUploadForm";
import { appendCurrentUserToFormData, createPageUrl } from "@/utils";
import BackNavigation from "@/components/BackNavigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle2,
  Loader2,
  Building2,
  XCircle,
  AlertTriangle,
  MapPin,
  Download,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { CARE_SCENARIOS, STATES_MY, JenazahCaseStatus } from "@/utils/enums";
import { useLocationContext } from "@/providers/LocationProvider";
import { defaultJenazahRequestField } from "@/utils/defaultformfields";
import { translate } from "@/utils/translations";
import { getStoredGoogleUser } from "@/utils/auth";
import { generateJenazahCasePdf } from "@/components/PDF/JenazahCase";

const toDateInputValue = (d) => d.toISOString().split("T")[0];

export default function JenazahEmergencyRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const mosqueFromNav = location.state?.mosque ?? null;
  const isMosqueLocked = !!mosqueFromNav;
  const [mosque, setMosque] = useState(mosqueFromNav);
  const { userState } = useLocationContext();

  const {
    control: pickerControl,
    watch: watchPicker,
    setValue: setPickerValue,
  } = useForm({ defaultValues: { state: "", mosqueId: "" } });

  useEffect(() => {
    if (userState && STATES_MY.includes(userState)) {
      setPickerValue("state", userState);
    }
  }, [userState, setPickerValue]);

  const pickerState = watchPicker("state");
  const pickerMosqueId = watchPicker("mosqueId");

  const { data: pickerMosques = [], isLoading: pickerMosqueLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { state: pickerState || null, canArrangeFuneral: true },
      { enabled: !isMosqueLocked },
    );

  useEffect(() => {
    if (!pickerMosqueId) return;
    const picked = pickerMosques.find((m) => String(m.id) === pickerMosqueId);
    if (picked) setMosque(picked);
  }, [pickerMosqueId, pickerMosques]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: defaultJenazahRequestField,
  });

  const icSearch = watch("icSearch");
  const burialdate = watch("burialdate");

  useEffect(() => {
    const saved = localStorage.getItem("userphoneno");
    if (saved && !watch("heirphoneno")) {
      setValue("heirphoneno", saved);
    }
  }, []);

  const [pageStep, setPageStep] = useState(1);
  const [isOutOfArea, setIsOutOfArea] = useState(null);
  const [careScenario, setCareScenario] = useState(null);
  const [searchedIc, setSearchedIc] = useState("");
  const [currentCoords, setCurrentCoords] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      showApiError({
        message: translate("This device does not support location sharing."),
      });
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setFetchingLocation(false);
        showSuccess(translate("GPS location shared successfully."));
      },
      () => {
        setFetchingLocation(false);
        showApiError({
          message: translate("Unable to get current location."),
        });
      },
    );
  };

  const handleFileUpload = async (file, bucketName) => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      appendCurrentUserToFormData(formDataUpload);
      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });
      if (!res.ok) {
        showApiError({ message: translate("Failed to upload file") });
        return null;
      }
      const data = await res.json();
      showSuccess(translate("File uploaded successfully"));
      return data.file_url;
    } catch {
      showApiError({ message: translate("Failed to upload file") });
      return null;
    }
  };

  const [memberResult, setMemberResult] = useState(undefined);
  const [existingCase, setExistingCase] = useState(null);
  const [proceedDespitePending, setProceedDespitePending] = useState(false);

  const searchQuery = trpc.deathCharityMember.searchByIcNumber.useQuery(
    { icnumber: searchedIc, mosqueId: mosque?.id, searchCase: true },
    { enabled: !!searchedIc, staleTime: 0 },
  );

  const isCaseApproved =
    existingCase?.status === JenazahCaseStatus.ONGOING ||
    existingCase?.status === JenazahCaseStatus.CLOSED;
  const isCaseBlocking =
    !!existingCase && !isCaseApproved && !proceedDespitePending;

  const createCase = trpc.jenazahCase.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Funeral case application has been submitted."));
    },
    onError: (err) => showApiError(err),
  });

  useEffect(() => {
    if (!searchedIc) return;
    if (searchQuery.isFetching) return;

    const result = searchQuery.data;
    const member = result?.member ?? null;

    setExistingCase(result?.existingCase ?? null);

    if (member) {
      setMemberResult(member);
      setValue("fullname", member.fullname ?? "");
      setValue("icnumber", member.icnumber ?? "");
      setValue("phone", "");
    } else {
      setMemberResult(null);
      setValue("icnumber", searchedIc);
      setValue("fullname", "");
      setValue("phone", "");
    }
  }, [searchQuery.data, searchQuery.isFetching, searchedIc]);

  const didMountIcSearch = useRef(false);
  useEffect(() => {
    if (!didMountIcSearch.current) {
      didMountIcSearch.current = true;
      return;
    }
    setMemberResult(undefined);
    setExistingCase(null);
    setProceedDespitePending(false);
    setSearchedIc("");
    setValue("fullname", "");
    setValue("icnumber", "");
    setValue("phone", "");
    setValue("heirname", "");
    setValue("heirphoneno", localStorage.getItem("userphoneno") || "");
    setValue("causeofdeath", "");
    setValue("userremarks", "");
    setValue("deathconfirmationphotourl", "");
    setValue("policereportphotourl", "");
    setValue("supportingphotourl", "");
  }, [icSearch]);

  const handleContinueDespitePending = () => {
    setProceedDespitePending(true);
    if (!memberResult) {
      setValue("fullname", existingCase?.details?.deceasedFullname ?? "");
      setValue("heirname", existingCase?.details?.heirname ?? "");
      setValue("causeofdeath", existingCase?.details?.causeofdeath ?? "");
    }
  };

  const handleSearch = () => {
    const ic = (icSearch ?? "").replace(/-/g, "").trim();
    if (!ic) return;
    setMemberResult(undefined);
    setExistingCase(null);
    setProceedDespitePending(false);
    setSearchedIc(ic);
  };

  const handleNextStep = async () => {
    if (isOutOfArea === null) {
      showApiError({
        message: translate("Please answer the incident location question."),
      });
      return;
    }
    if (!careScenario) {
      showApiError({
        message: translate("Please select the funeral management location."),
      });
      return;
    }
    if (careScenario === "other") {
      const valid = await trigger("careScenarioOther");
      if (!valid) {
        showApiError({
          message: translate(
            "Please specify the funeral management procedure.",
          ),
        });
        return;
      }
    }
    if (!currentCoords) {
      showApiError({ message: translate("Please share your GPS location.") });
      return;
    }
    const validDate = await trigger("burialdate");
    if (!validDate) {
      showApiError({ message: translate("Please specify the burial date.") });
      return;
    }
    setPageStep(2);
  };

  const onInvalid = (formErrors) => {
    if (formErrors.burialdate || formErrors.careScenarioOther) {
      showApiError({
        message: translate(
          "Please complete the location & procedure information.",
        ),
      });
      setPageStep(1);
    }
  };

  const onSubmit = (data) => {
    if (isCaseApproved) {
      showApiError({
        message: translate(
          "This IC number already has an approved funeral case. A new application cannot be submitted.",
        ),
      });
      return;
    }
    if (isCaseBlocking) {
      showApiError({
        message: translate(
          "An application for this IC number has already been submitted and is awaiting approval.",
        ),
      });
      return;
    }
    if (isOutOfArea === null) {
      showApiError({
        message: translate("Please answer the incident location question."),
      });
      setPageStep(1);
      return;
    }
    if (!careScenario) {
      showApiError({
        message: translate("Please select the funeral management location."),
      });
      setPageStep(1);
      return;
    }
    if (careScenario === "other" && !data.careScenarioOther?.trim()) {
      showApiError({
        message: translate("Please specify the funeral management procedure."),
      });
      setPageStep(1);
      return;
    }
    if (!currentCoords) {
      showApiError({ message: translate("Please share your GPS location.") });
      setPageStep(1);
      return;
    }
    if (!data.burialdate) {
      showApiError({ message: translate("Please specify the burial date.") });
      setPageStep(1);
      return;
    }

    const details = {
      deceasedFullname: data.fullname,
      deceasedIcnumber: data.icnumber,
      deceasedPhone: data.phone,
      causeofdeath: data.causeofdeath?.trim() || null,
      isQariahMember: !!memberResult,
      isOutOfArea: !!isOutOfArea,
      careScenario,
      careScenarioOther:
        careScenario === "other" ? data.careScenarioOther?.trim() : null,
      burialDate: data.burialdate,
      pickupLat: currentCoords?.lat ?? null,
      pickupLng: currentCoords?.lng ?? null,
      heirname: data.heirname?.trim() || null,
      heirphoneno: data.heirphoneno?.trim() || null,
    };

    const googleUser = getStoredGoogleUser();

    createCase.mutate(
      {
        mosqueId: mosque?.id ?? null,
        qariahmemberid: memberResult?.id ?? null,
        details,
        userremarks: data.userremarks?.trim() || null,
        deathconfirmationphotourl: data.deathconfirmationphotourl || null,
        policereportphotourl: data.policereportphotourl || null,
        supportingphotourl: data.supportingphotourl || null,
        googleuserId: googleUser?.id ?? null,
      },
      {
        onSuccess: (savedCase) => {
          setSubmittedCase({
            referenceno: savedCase?.referenceno,
            fullname: data.fullname,
            icnumber: data.icnumber,
            phone: data.phone,
            heirname: data.heirname,
            heirphoneno: data.heirphoneno,
            burialdate: data.burialdate,
            mosqueName: mosque?.name,
            mosqueAddress: mosque?.address,
          });
        },
      },
    );
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!submittedCase) return;
    setIsGeneratingPdf(true);
    try {
      await generateJenazahCasePdf(submittedCase);
    } catch {
      showApiError({ message: translate("Failed to generate PDF.") });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isSearching = searchQuery.isFetching;
  const hasSearched = searchedIc !== "";

  if (submittedCase) {
    return (
      <div className="min-h-screen space-y-3 pb-2">
        <BackNavigation title={translate("Funeral Management Application")} />
        <div className="px-4 max-w-lg mx-auto w-full flex flex-col items-center text-center gap-4 pt-6 pb-10">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {translate("Application Submitted Successfully")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {translate(
              "Your funeral management application has been received and is being processed by the mosque.",
            )}
          </p>

          <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {translate("Reference No")}
            </p>
            <p className="text-lg font-bold font-mono tracking-widest text-emerald-600 dark:text-emerald-400">
              {submittedCase.referenceno}
            </p>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            {translate(
              "Please save this reference number to check your application status.",
            )}
          </p>

          <div className="w-full flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {translate("Download PDF")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl("JenazahEmergency"))}
            >
              {translate("Back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-3 pb-2">
      <BackNavigation title={translate("Funeral Management Application")} />

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="px-4 space-y-5 max-w-lg mx-auto w-full"
      >
        {isMosqueLocked ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5 space-y-0.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {translate("Selected Mosque")}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {mosque.name}
            </p>
            {mosque.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mosque.address}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {translate(
                  "Select a state and mosque that provides funeral management services to proceed with the application.",
                )}
              </p>
            </div>

            <SelectForm
              name="state"
              control={pickerControl}
              label={translate("State")}
              placeholder={translate("Select state")}
              options={STATES_MY}
              onValueChange={() => setPickerValue("mosqueId", "")}
            />

            <Select2Form
              name="mosqueId"
              control={pickerControl}
              label={translate("Mosque")}
              options={pickerMosques.map((m) => ({
                value: String(m.id),
                label: m.name,
              }))}
              disabled={!pickerState}
              loading={pickerMosqueLoading}
              disabledMessage={translate("Select state first")}
              placeholder={translate("Search mosque...")}
              searchPlaceholder={translate("Search mosque...")}
              emptyMessage={translate(
                "No mosque available for funeral management in this state",
              )}
            />

            {mosque && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5 space-y-0.5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="w-3 h-3" />{" "}
                  {translate("Selected Mosque")}
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {mosque.name}
                </p>
                {mosque.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mosque.address}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {mosque && pageStep === 1 && (
          <>
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
              {translate("Location & Procedure")}
            </h3>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                {translate("Incident Location")}
                <span className="text-red-500 ml-1">*</span>
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {translate(
                  "Did the death occur outside the state or district of this mosque?",
                )}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsOutOfArea(false)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isOutOfArea === false
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {translate("Within Qariah Area")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOutOfArea(true)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isOutOfArea === true
                      ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {translate("Outside state/district")}
                </button>
              </div>
            </div>

            {isOutOfArea !== null && (
              <>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    {translate("GPS Location")}
                    <span className="text-red-500 ml-1">*</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {translate(
                      "Share your GPS location so the mosque can locate the deceased more accurately.",
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShareLocation}
                    disabled={fetchingLocation}
                    className="w-full"
                  >
                    {fetchingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    {fetchingLocation
                      ? translate("Getting location...")
                      : currentCoords
                        ? translate("Share Current Location Again")
                        : translate("Share Current Location")}
                  </Button>
                  {currentCoords && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {translate("Location shared:")}{" "}
                        {currentCoords.lat.toFixed(5)},{" "}
                        {currentCoords.lng.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    {translate("Funeral Management")}
                    <span className="text-red-500 ml-1">*</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {translate(
                      "Where is the deceased currently, and where will the bathing and prayer take place?",
                    )}
                  </p>
                  <Select
                    value={careScenario ?? ""}
                    onValueChange={setCareScenario}
                  >
                    <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue
                        placeholder={translate("Select funeral management")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {CARE_SCENARIOS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {careScenario === "other" && (
                    <TextInputForm
                      name="careScenarioOther"
                      control={control}
                      label={translate("Specify the procedure")}
                      isTextArea
                      rows={2}
                      required
                      errors={errors}
                      placeholder={translate(
                        "Describe the location, bathing, and prayer arrangements",
                      )}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    {translate("Burial Date")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setValue("burialdate", toDateInputValue(new Date()))
                      }
                      className={`flex-1 ${burialdate === toDateInputValue(new Date()) ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                    >
                      {translate("Today")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setValue(
                          "burialdate",
                          toDateInputValue(new Date(Date.now() + 86400000)),
                        )
                      }
                      className={`flex-1 ${burialdate === toDateInputValue(new Date(Date.now() + 86400000)) ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                    >
                      {translate("Tomorrow")}
                    </Button>
                  </div>
                  <TextInputForm
                    name="burialdate"
                    control={control}
                    label={translate("Or pick another date")}
                    isDate
                    required
                    errors={errors}
                  />
                </div>
              </>
            )}
          </>
        )}

        {mosque && pageStep === 2 && (
          <>
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
              {translate("Maklumat Jenazah")}
            </h3>

            <div className="space-y-1.5">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <TextInputForm
                    name="icSearch"
                    control={control}
                    label={translate("Search Qariah Member (IC No.)")}
                    isICNumber
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={
                    isSearching || !(icSearch ?? "").replace(/-/g, "").trim()
                  }
                  size="sm"
                  variant="outline"
                  className="h-10 px-3 mb-0.5"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {hasSearched && !isSearching && isCaseApproved && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 mt-1">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      {translate("Funeral Case Already Approved")}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {translate(
                        "This IC number already has an approved funeral case. A new application cannot be submitted.",
                      )}
                    </p>
                    {existingCase?.referenceno && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono font-semibold">
                        {existingCase.referenceno}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {hasSearched && !isSearching && isCaseBlocking && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {translate("Existing Application")}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {translate(
                          "An application for this IC number has already been submitted and is awaiting approval.",
                        )}
                      </p>
                      {existingCase?.referenceno && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-mono font-semibold">
                          {existingCase.referenceno}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleContinueDespitePending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {translate("Continue to Submit Application")}
                    </Button>
                  </div>
                </div>
              )}
              {hasSearched &&
                !isSearching &&
                !isCaseApproved &&
                !isCaseBlocking &&
                memberResult && (
                  <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {translate("Qariah Member Found")}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {memberResult.fullname}
                      </p>
                      {memberResult.mosque?.name && (
                        <p className="text-xs text-slate-500">
                          {memberResult.mosque.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              {hasSearched &&
                !isSearching &&
                !isCaseApproved &&
                !isCaseBlocking &&
                memberResult === null && (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 mt-1">
                    <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {translate(
                        "No Qariah member found. Please fill in the details below.",
                      )}
                    </p>
                  </div>
                )}
            </div>

            {hasSearched &&
              !isSearching &&
              !isCaseApproved &&
              !isCaseBlocking && (
                <>
                  <TextInputForm
                    name="fullname"
                    control={control}
                    label={translate("Deceased Full Name")}
                    required
                    errors={errors}
                    placeholder={translate("Full name")}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInputForm
                      name="heirname"
                      control={control}
                      label={translate("Nama Waris")}
                      required
                      placeholder={translate("Next of kin full name")}
                    />
                    <TextInputForm
                      name="heirphoneno"
                      control={control}
                      label={translate("No. Tel. Waris")}
                      isPhone
                      required
                      placeholder="0123456789"
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0">
                    {translate(
                      "Contact phone number for this application",
                    )}
                  </p>

                  <TextInputForm
                    name="causeofdeath"
                    control={control}
                    required
                    errors={errors}
                    label={translate("Cause of Death")}
                    placeholder={translate("Cause of death, if known")}
                  />

                  <TextInputForm
                    name="userremarks"
                    control={control}
                    label={`${translate("Additional notes")} (${translate("Optional")})`}
                    isTextArea
                    rows={2}
                    placeholder={translate(
                      "Any additional information for the mosque",
                    )}
                  />

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                      {translate("Documents")}
                    </p>
                    <FileUploadForm
                      name="deathconfirmationphotourl"
                      control={control}
                      label={translate("Death Confirmation")}
                      required
                      errors={errors}
                      accept="image/*,application/pdf"
                      isNeedPasteURL={false}
                      isShowList
                      bucketName="bucket-death-confirmation"
                      handleFileUpload={handleFileUpload}
                    />
                    <FileUploadForm
                      name="policereportphotourl"
                      control={control}
                      label={translate("Police Report")}
                      required
                      errors={errors}
                      accept="image/*,application/pdf"
                      isNeedPasteURL={false}
                      isShowList
                      bucketName="bucket-police-report"
                      handleFileUpload={handleFileUpload}
                    />
                    <MultipleFileUploadForm
                      name="supportingphotourl"
                      control={control}
                      label={`${translate("Supporting Documents")} (${translate("Optional")})`}
                      errors={errors}
                      accept="image/*,application/pdf"
                      bucketName="supporting-doc-jenazah-case"
                      handleFileUpload={handleFileUpload}
                    />
                  </div>
                </>
              )}
          </>
        )}

        {mosque && (
          <div className="flex gap-2 pt-2 pb-6">
            {pageStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("JenazahEmergency"))}
                  className="flex-1"
                >
                  {translate("Cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {translate("Next")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPageStep(1)}
                  className="flex-1"
                >
                  {translate("Back")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCase.isPending ||
                    !hasSearched ||
                    isSearching ||
                    isCaseApproved ||
                    isCaseBlocking
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                >
                  {createCase.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {translate("Submit")}
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
