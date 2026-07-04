// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import MultipleFileUploadForm from "@/components/forms/MultipleFileUploadForm";
import { appendCurrentUserToFormData, createPageUrl } from "@/utils";
import BackNavigation from "@/components/BackNavigation";
import NoDataCardComponent from "@/components/NoDataCardComponent";
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
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { CARE_SCENARIOS } from "@/utils/enums";

const toDateInputValue = (d) => d.toISOString().split("T")[0];

export default function JenazahEmergencyRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const mosque = location.state?.mosque ?? null;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      icSearch: "",
      fullname: "",
      icnumber: "",
      phone: "",
      userremarks: "",
      deathconfirmationphotourl: "",
      policereportphotourl: "",
      supportingphotourl: "",
      burialdate: "",
      careScenarioOther: "",
    },
  });

  const icSearch = watch("icSearch");
  const burialdate = watch("burialdate");

  const [pageStep, setPageStep] = useState(1);
  const [isOutOfArea, setIsOutOfArea] = useState(null); // null=not answered yet
  const [careScenario, setCareScenario] = useState(null);
  const [searchedIc, setSearchedIc] = useState("");
  const [currentCoords, setCurrentCoords] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      showApiError({ message: "Peranti ini tidak menyokong perkongsian lokasi." });
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
        showSuccess("Lokasi GPS berjaya dikongsikan.");
      },
      () => {
        setFetchingLocation(false);
        showApiError({ message: "Tidak dapat mendapatkan lokasi semasa." });
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
        showApiError({ message: "Gagal memuat naik fail" });
        return null;
      }
      const data = await res.json();
      showSuccess("Fail berjaya dimuat naik");
      return data.file_url;
    } catch {
      showApiError({ message: "Gagal memuat naik fail" });
      return null;
    }
  };

  const [memberResult, setMemberResult] = useState(undefined);

  const searchQuery = trpc.deathCharityMember.searchByIcNumber.useQuery(
    { icnumber: searchedIc, mosqueId: mosque?.id },
    { enabled: !!searchedIc, staleTime: 0 },
  );

  const createCase = trpc.jenazahCase.create.useMutation({
    onSuccess: () => {
      showSuccess("Permohonan jenazah telah dihantar.");
      navigate(createPageUrl("JenazahEmergency"));
    },
    onError: (err) => showApiError(err),
  });

  useEffect(() => {
    if (!searchedIc) return;
    if (searchQuery.isFetching) return;
    if (searchQuery.data) {
      const m = searchQuery.data;
      setMemberResult(m);
      setValue("fullname", m.fullname ?? "");
      setValue("icnumber", m.icnumber ?? "");
      setValue("phone", "");
    } else {
      setMemberResult(null);
      setValue("icnumber", searchedIc);
      setValue("fullname", "");
      setValue("phone", "");
    }
  }, [searchQuery.data, searchQuery.isFetching, searchedIc]);

  const handleSearch = () => {
    const ic = (icSearch ?? "").replace(/-/g, "").trim();
    if (!ic) return;
    setMemberResult(undefined);
    setSearchedIc(ic);
  };

  const handleNextStep = async () => {
    if (isOutOfArea === null) {
      showApiError({ message: "Sila jawab soalan lokasi kejadian." });
      return;
    }
    if (!careScenario) {
      showApiError({ message: "Sila pilih lokasi pengurusan jenazah." });
      return;
    }
    if (careScenario === "other") {
      const valid = await trigger("careScenarioOther");
      if (!valid) {
        showApiError({ message: "Sila nyatakan cara pengurusan jenazah." });
        return;
      }
    }
    if (!currentCoords) {
      showApiError({ message: "Sila kongsikan lokasi GPS anda." });
      return;
    }
    const validDate = await trigger("burialdate");
    if (!validDate) {
      showApiError({ message: "Sila nyatakan tarikh pengebumian." });
      return;
    }
    setPageStep(2);
  };

  // If required page-1 fields (burialdate, careScenarioOther) are invalid,
  // react-hook-form blocks onSubmit before it runs — since those fields
  // aren't rendered on page 2, send the user back so they can see why.
  const onInvalid = (formErrors) => {
    if (formErrors.burialdate || formErrors.careScenarioOther) {
      showApiError({ message: "Sila lengkapkan maklumat lokasi & prosedur." });
      setPageStep(1);
    }
  };

  const onSubmit = (data) => {
    if (isOutOfArea === null) {
      showApiError({ message: "Sila jawab soalan lokasi kejadian." });
      setPageStep(1);
      return;
    }
    if (!careScenario) {
      showApiError({ message: "Sila pilih lokasi pengurusan jenazah." });
      setPageStep(1);
      return;
    }
    if (careScenario === "other" && !data.careScenarioOther?.trim()) {
      showApiError({ message: "Sila nyatakan cara pengurusan jenazah." });
      setPageStep(1);
      return;
    }
    if (!currentCoords) {
      showApiError({ message: "Sila kongsikan lokasi GPS anda." });
      setPageStep(1);
      return;
    }
    if (!data.burialdate) {
      showApiError({ message: "Sila nyatakan tarikh pengebumian." });
      setPageStep(1);
      return;
    }

    const details = {
      deceasedFullname: data.fullname,
      deceasedIcnumber: data.icnumber,
      deceasedPhone: data.phone,
      isQariahMember: !!memberResult,
      isOutOfArea: !!isOutOfArea,
      careScenario,
      careScenarioOther:
        careScenario === "other" ? data.careScenarioOther?.trim() : null,
      burialDate: data.burialdate,
      pickupLat: currentCoords?.lat ?? null,
      pickupLng: currentCoords?.lng ?? null,
    };

    createCase.mutate({
      mosqueId: mosque?.id ?? null,
      qariahmemberid: memberResult?.id ?? null,
      details,
      userremarks: data.userremarks?.trim() || null,
      deathconfirmationphotourl: data.deathconfirmationphotourl || null,
      policereportphotourl: data.policereportphotourl || null,
      supportingphotourl: data.supportingphotourl || null,
    });
  };

  const isSearching = searchQuery.isFetching;
  const hasSearched = searchedIc !== "";

  if (!mosque) {
    return (
      <div className="min-h-screen space-y-3 pb-2">
        <BackNavigation title="Permohonan Pengurusan Jenazah" />
        <NoDataCardComponent
          isPage
          title="Tiada Masjid Dipilih"
          description="Sila pilih masjid daripada senarai kecemasan jenazah terlebih dahulu."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-3 pb-2">
      <BackNavigation title="Permohonan Pengurusan Jenazah" />

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="px-4 space-y-5 max-w-lg mx-auto w-full"
      >
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5 space-y-0.5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Masjid Dipilih
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

        {pageStep === 1 && (
          <>
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
              Lokasi & Prosedur
            </h3>

            {/* Out-of-area check — must be answered before the rest of the procedure */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                Lokasi Kejadian
                <span className="text-red-500 ml-1">*</span>
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Adakah kematian berlaku di luar negeri atau daerah masjid ini?
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
                  Tidak, dalam kawasan
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
                  Ya, luar negeri/daerah
                </button>
              </div>
            </div>

            {isOutOfArea !== null && (
              <>
                {/* Share GPS location to help the mosque locate the deceased */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Lokasi GPS
                    <span className="text-red-500 ml-1">*</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Kongsikan lokasi GPS anda supaya masjid dapat mencari
                    lokasi jenazah dengan lebih tepat.
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
                      ? "Mendapatkan lokasi..."
                      : currentCoords
                        ? "Kongsi Semula Lokasi Semasa"
                        : "Kongsi Lokasi Semasa"}
                  </Button>
                  {currentCoords && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Lokasi dikongsikan: {currentCoords.lat.toFixed(5)},{" "}
                        {currentCoords.lng.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Where is the deceased, and where will mandi/solat happen */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Pengurusan Jenazah
                    <span className="text-red-500 ml-1">*</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Di manakah jenazah kini, dan di manakah mandi jenazah &
                    solat akan dilakukan?
                  </p>
                  <Select
                    value={careScenario ?? ""}
                    onValueChange={setCareScenario}
                  >
                    <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue placeholder="Pilih pengurusan jenazah" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARE_SCENARIOSNARIOS.map((s) => (
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
                      label="Nyatakan cara pengurusan"
                      isTextArea
                      rows={2}
                      required
                      errors={errors}
                      placeholder="Terangkan lokasi jenazah, mandi, dan solat"
                    />
                  )}
                </div>

                {/* Burial date */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Tarikh Pengebumian
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
                      Hari Ini
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
                      Esok
                    </Button>
                  </div>
                  <TextInputForm
                    name="burialdate"
                    control={control}
                    label="Atau pilih tarikh lain"
                    isDate
                    required
                    errors={errors}
                  />
                </div>
              </>
            )}
          </>
        )}

        {pageStep === 2 && (
          <>
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
              Maklumat Jenazah
            </h3>

            <div className="space-y-1.5">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <TextInputForm
                    name="icSearch"
                    control={control}
                    label="Cari Ahli Qariah (No. IC)"
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

              {hasSearched && !isSearching && memberResult && (
                <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Ahli Qariah Dijumpai
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
              {hasSearched && !isSearching && memberResult === null && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 mt-1">
                  <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Tiada ahli qariah dijumpai. Sila isi maklumat di bawah.
                  </p>
                </div>
              )}
            </div>

            {hasSearched && !isSearching && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextInputForm
                    name="fullname"
                    control={control}
                    label="Nama Penuh Jenazah"
                    required
                    errors={errors}
                    placeholder="Nama penuh"
                  />
                  <TextInputForm
                    name="phone"
                    control={control}
                    label="No. Telefon"
                    isPhone
                    required
                    placeholder="0123456789"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  No. telefon yang boleh dihubungi berkenaan permohonan ini
                </p>

                <TextInputForm
                  name="userremarks"
                  control={control}
                  label="Catatan Tambahan (opsional)"
                  isTextArea
                  rows={2}
                  placeholder="Sebarang maklumat tambahan untuk masjid"
                />

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Dokumen
                  </p>
                  <FileUploadForm
                    name="deathconfirmationphotourl"
                    control={control}
                    label="Pengesahan Kematian"
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
                    label="Laporan Polis"
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
                    label="Dokumen Sokongan (opsional)"
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

        <div className="flex gap-2 pt-2 pb-6">
          {pageStep === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("JenazahEmergency"))}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Seterusnya
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
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={createCase.isPending || !hasSearched || isSearching}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
              >
                {createCase.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Hantar Permohonan
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
