// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import BackNavigation from "@/components/BackNavigation";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import FileUploadForm from "@/components/forms/FileUploadForm";
import MultipleFileUploadForm from "@/components/forms/MultipleFileUploadForm";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";
import MapLocationPicker from "@/components/MapLocationPicker";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import ConfirmDialog from "@/components/ConfirmDialog";
import { translate } from "@/utils/translations";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import MobileEmptyList from "@/components/mobile/MobileEmptyList";
import {
  Building2,
  MapPinned,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  BadgeCheck,
  Info,
  ClipboardList,
  CheckCircle,
  Plus,
  Save,
  Trash2,
  UserPlus,
  MapPin,
  X,
} from "lucide-react";
import { CARE_SCENARIOS } from "@/utils/enums";

const toDateInputValue = (d) => d.toISOString().split("T")[0];

const STATUS_CONFIG = {
  pending: {
    label: "Tertunda",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Diluluskan",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
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

function DetailRow({ label, value, children }) {
  if (!value && !children) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      {children ?? (
        <p className="text-sm text-slate-800 dark:text-slate-200">{value}</p>
      )}
    </div>
  );
}

const isPdfKey = (key) => /\.pdf$/i.test(key || "");

function DocumentLinks({ label, value, bucket }) {
  const [previewKey, setPreviewKey] = useState(null);
  const keys = (value ?? "").split(",").filter(Boolean);
  if (!keys.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <ul className="space-y-0.5">
        {keys.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => setPreviewKey(key)}
              className="text-xs text-blue-600 dark:text-blue-400 underline break-all text-left"
            >
              {key.replace(/^[0-9a-f-]{36}-/i, "")}
            </button>
          </li>
        ))}
      </ul>
      <FilePreviewDialog
        open={!!previewKey}
        onClose={() => setPreviewKey(null)}
        src={previewKey ? resolveFileUrl(previewKey, bucket) : null}
        isPdf={isPdfKey(previewKey)}
        title={label}
      />
    </div>
  );
}

const DEFAULT_CASE_FORM = {
  icSearch: "",
  selectedOrgId: null,
  selectedMosqueId: null,
  deceasedFullname: "",
  deceasedIcnumber: "",
  deceasedPhone: "",
  deceasedEmail: "",
  deceasedAddress: "",
  pickupLat: "",
  pickupLng: "",
  careScenario: "",
  careScenarioOther: "",
  burialdate: "",
  adminremarks: "",
  deathconfirmationphotourl: "",
  policereportphotourl: "",
  supportingphotourl: "",
};

function CaseFormSheet({ onClose, onSubmit, isSubmitting }) {
  const { currentUser } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_CASE_FORM });

  const selectedOrgId = watch("selectedOrgId");
  const selectedMosqueId = watch("selectedMosqueId");
  const skipMosqueResetRef = useRef(false);

  const [searchedIc, setSearchedIc] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isQariahMember, setIsQariahMember] = useState(false);
  const [isOutOfArea, setIsOutOfArea] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

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

  const icSearch = watch("icSearch");
  const burialdate = watch("burialdate");
  const careScenario = watch("careScenario");

  const { data: organisations = [] } =
    trpc.deathCharityMember.getOrganisations.useQuery({
      organisationId: userOrgId,
    });

  const { data: mosques = [], isLoading: mosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: selectedOrgId },
      { enabled: !!selectedOrgId },
    );

  const { data: memberResult, isFetching: memberSearching } =
    trpc.deathCharityMember.searchByIcNumber.useQuery(
      { icnumber: searchedIc.trim(), mosqueId: selectedMosqueId },
      { enabled: !!searchedIc.trim(), refetchOnWindowFocus: false },
    );

  useEffect(() => {
    if (!searchedIc || memberSearching) return;
    if (memberResult) {
      setValue("deceasedFullname", memberResult.fullname ?? "");
      setValue("deceasedIcnumber", memberResult.icnumber ?? searchedIc);
      setValue("deceasedPhone", memberResult.phone ?? "");
      setValue("deceasedEmail", memberResult.email ?? "");
      setValue("deceasedAddress", memberResult.address ?? "");
      setIsQariahMember(true);
      if (memberResult.mosque?.id) {
        setValue("selectedMosqueId", memberResult.mosque.id);
      }
      if (memberResult.organisation?.id) {
        skipMosqueResetRef.current = true;
        setValue("selectedOrgId", memberResult.organisation.id);
      }
    } else {
      setValue("deceasedFullname", "");
      setValue("deceasedIcnumber", searchedIc.trim());
      setValue("deceasedPhone", "");
      setValue("deceasedEmail", "");
      setValue("deceasedAddress", "");
      setIsQariahMember(false);
    }
    setSearchAttempted(true);
  }, [memberResult, memberSearching, searchedIc, setValue]);

  useEffect(() => {
    if (skipMosqueResetRef.current) {
      skipMosqueResetRef.current = false;
      return;
    }
    setValue("selectedMosqueId", null);
  }, [selectedOrgId, setValue]);

  const handleSearch = () => {
    const ic = (icSearch ?? "").replace(/-/g, "").trim();
    if (!ic) return;
    setSearchAttempted(false);
    setSearchedIc((prev) => (prev.trim() === ic ? ic + "​" : ic));
  };

  const handleFormSubmit = (data) => {
    if (isOutOfArea === null) {
      showApiError({ message: "Sila jawab soalan lokasi kejadian." });
      return;
    }
    if (!data.careScenario) {
      showApiError({ message: "Sila pilih lokasi pengurusan jenazah." });
      return;
    }
    if (data.careScenario === "other" && !data.careScenarioOther?.trim()) {
      showApiError({ message: "Sila nyatakan cara pengurusan jenazah." });
      return;
    }
    if (!data.burialdate) {
      showApiError({ message: "Sila nyatakan tarikh pengebumian." });
      return;
    }

    const {
      adminremarks,
      icSearch: _icSearch,
      selectedOrgId: _selectedOrgId,
      selectedMosqueId: submittedMosqueId,
      deathconfirmationphotourl,
      policereportphotourl,
      supportingphotourl,
      careScenarioOther,
      burialdate: submittedBurialdate,
      ...formDetails
    } = data;
    onSubmit({
      mosqueId: submittedMosqueId,
      adminremarks: adminremarks?.trim() || null,
      deathconfirmationphotourl: deathconfirmationphotourl || null,
      policereportphotourl: policereportphotourl || null,
      supportingphotourl: supportingphotourl || null,
      details: {
        ...formDetails,
        isQariahMember,
        isOutOfArea: !!isOutOfArea,
        careScenarioOther:
          formDetails.careScenario === "other"
            ? careScenarioOther?.trim()
            : null,
        burialDate: submittedBurialdate,
        pickupLat:
          formDetails.pickupLat !== "" && formDetails.pickupLat != null
            ? parseFloat(String(formDetails.pickupLat))
            : null,
        pickupLng:
          formDetails.pickupLng !== "" && formDetails.pickupLng != null
            ? parseFloat(String(formDetails.pickupLng))
            : null,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          Tambah Kes Jenazah
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title="Organisasi & Masjid">
          <Select2Form
            name="selectedOrgId"
            control={control}
            label="Organisasi"
            placeholder="Pilih organisasi..."
            searchPlaceholder="Cari organisasi..."
            emptyMessage="Tiada organisasi."
            options={organisations.map((o) => ({
              value: o.id,
              label: o.name,
            }))}
          />
          <Select2Form
            name="selectedMosqueId"
            control={control}
            label="Masjid"
            placeholder={
              selectedOrgId ? "Pilih masjid..." : "Pilih organisasi dahulu"
            }
            searchPlaceholder="Cari masjid..."
            emptyMessage="Tiada masjid dijumpai."
            options={mosques.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            disabled={!selectedOrgId}
            loading={mosquesLoading}
          />
        </FormSection>

        <FormSection title="Semak Ahli Qariah">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <TextInputForm
                name="icSearch"
                control={control}
                label="No. IC"
                isICNumber
                placeholder="Masukkan No. IC"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={
                !(icSearch ?? "").replace(/-/g, "").trim() || memberSearching
              }
              className="shrink-0 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 active:opacity-70 disabled:opacity-40"
            >
              {memberSearching ? "Mencari..." : "Cari"}
            </button>
          </div>
          {searchAttempted &&
            (memberResult ? (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> Ahli Qariah Berdaftar
              </p>
            ) : (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Tidak ditemui — isi maklumat
                secara manual
              </p>
            ))}
        </FormSection>

        <FormSection title="Maklumat Jenazah">
          <TextInputForm
            name="deceasedFullname"
            control={control}
            label="Nama Penuh"
            required
            errors={errors}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="deceasedIcnumber"
              control={control}
              label="No. IC"
              isICNumber
              errors={errors}
            />
            <TextInputForm
              name="deceasedPhone"
              control={control}
              label="Telefon"
              isPhone
              errors={errors}
            />
          </div>
          <TextInputForm
            name="deceasedEmail"
            control={control}
            label="E-mel"
            isEmail
            errors={errors}
          />
          <TextInputForm
            name="deceasedAddress"
            control={control}
            label="Alamat"
            isTextArea
          />
        </FormSection>

        <FormSection title="Lokasi Kejadian">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsOutOfArea(false)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                isOutOfArea === false
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Dalam Kawasan Qariah
            </button>
            <button
              type="button"
              onClick={() => setIsOutOfArea(true)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                isOutOfArea === true
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Luar Negeri/Daerah
            </button>
          </div>
        </FormSection>

        <FormSection title="Pengurusan Jenazah">
          <SelectForm
            name="careScenario"
            control={control}
            label="Pengurusan Jenazah"
            placeholder="Pilih pengurusan jenazah"
            options={CARE_SCENARIOS}
            required
            errors={errors}
          />
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
        </FormSection>

        <FormSection title="Tarikh Pengebumian">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setValue("burialdate", toDateInputValue(new Date()))
              }
              className={`flex-1 h-10 rounded-xl border text-sm font-medium ${
                burialdate === toDateInputValue(new Date())
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() =>
                setValue(
                  "burialdate",
                  toDateInputValue(new Date(Date.now() + 86400000)),
                )
              }
              className={`flex-1 h-10 rounded-xl border text-sm font-medium ${
                burialdate === toDateInputValue(new Date(Date.now() + 86400000))
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Esok
            </button>
          </div>
          <TextInputForm
            name="burialdate"
            control={control}
            label="Atau pilih tarikh lain"
            isDate
            required
            errors={errors}
          />
        </FormSection>

        <FormSection title="Lokasi Jemputan (opsional)">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 active:opacity-70"
          >
            <MapPin className="w-3.5 h-3.5" />
            {showMap ? "Sembunyi Peta" : "Pilih di Peta"}
          </button>
          {showMap && (
            <MapLocationPicker
              lat={watch("pickupLat")}
              lng={watch("pickupLng")}
              onChange={(lat, lng) => {
                setValue("pickupLat", lat.toFixed(6));
                setValue("pickupLng", lng.toFixed(6));
              }}
              placeholder="Cari lokasi..."
            />
          )}
        </FormSection>

        <FormSection title="Catatan Admin">
          <TextInputForm
            name="adminremarks"
            control={control}
            label="Catatan (opsional)"
            isTextArea
            rows={2}
            placeholder="Catatan dalaman untuk rekod..."
          />
        </FormSection>

        <FormSection title="Dokumen">
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
            bucketName="supporting-doc-jenazah-case"
            handleFileUpload={handleFileUpload}
          />
        </FormSection>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Menyimpan..." : "Tambah Kes"}
        </button>
      </div>
    </div>
  );
}

function CaseDetailSheet({
  caseItem,
  onClose,
  onStatusChange,
  isUpdating,
  onAddToQariah,
  isAddingToQariah,
}) {
  const [adminRemarks, setAdminRemarks] = useState(
    caseItem?.adminremarks ?? "",
  );
  const [showDeceasedForm, setShowDeceasedForm] = useState(false);

  const d = caseItem?.details ?? {};

  const mapsUrl =
    d.pickupLat && d.pickupLng
      ? `https://www.google.com/maps?q=${d.pickupLat},${d.pickupLng}`
      : null;

  const handleAction = (status) =>
    onStatusChange(caseItem.id, status, adminRemarks);

  const icRaw = (d.deceasedIcnumber ?? "").replace(/-/g, "");
  const parsedDob = (() => {
    if (icRaw.length >= 6) {
      const yy = icRaw.slice(0, 2);
      const mm = icRaw.slice(2, 4);
      const dd = icRaw.slice(4, 6);
      const year = parseInt(yy) <= 30 ? `20${yy}` : `19${yy}`;
      return `${year}-${mm}-${dd}`;
    }
    return "";
  })();

  const {
    control: dc,
    handleSubmit: handleDeceasedSubmit,
    formState: { errors: de },
  } = useForm({
    defaultValues: {
      grave: "",
      gravelot: "",
      causeofdeath: "",
      dateofdeath: "",
      dateofbirth: parsedDob,
      heirname: "",
      heirphoneno: "",
    },
  });

  const { gravesList = { items: [] } } = useGetGravePaginated({
    pageSize: 1000,
  });
  const graves = gravesList.items;

  const upsertDeadPerson = trpc.deadperson.upsertForQariah.useMutation({
    onError: (err) => showApiError(err),
  });

  const isBusy = isUpdating || upsertDeadPerson.isPending;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const onApproveSubmit = handleDeceasedSubmit(async (formData) => {
    try {
      await upsertDeadPerson.mutateAsync({
        name: d.deceasedFullname ?? "",
        icnumber: icRaw,
        dateofbirth: formData.dateofbirth || null,
        dateofdeath: formData.dateofdeath || null,
        causeofdeath: formData.causeofdeath || null,
        biography: null,
        photourl: null,
        latitude: null,
        longitude: null,
        heirname: formData.heirname || null,
        heirphoneno: formData.heirphoneno || null,
        grave: formData.grave ? { id: Number(formData.grave) } : undefined,
        gravelot: formData.gravelot?.trim() || null,
      });
      handleAction("approved");
    } catch {
      // error shown by onError
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            Butiran Kes Jenazah
          </h2>
          {caseItem && <StatusBadge status={caseItem.status} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-32">
        {caseItem?.mosque && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
              Masjid
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {caseItem.mosque.name}
            </p>
            {caseItem.mosque.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {caseItem.mosque.address}
              </p>
            )}
          </div>
        )}

        <FormSection title="Maklumat Jenazah">
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Nama" value={d.deceasedFullname} />
            <DetailRow label="No. IC" value={d.deceasedIcnumber} />
            <DetailRow label="Telefon" value={d.deceasedPhone} />
            <DetailRow label="E-mel" value={d.deceasedEmail} />
          </div>
          {d.deceasedAddress && (
            <DetailRow label="Alamat" value={d.deceasedAddress} />
          )}
          <DetailRow label="Status Ahli Qariah">
            {d.isQariahMember ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="w-3.5 h-3.5" /> Ahli Qariah Berdaftar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5" /> Bukan Ahli Qariah
              </span>
            )}
          </DetailRow>
        </FormSection>

        <FormSection title="Prosedur Jenazah">
          <div className="grid grid-cols-2 gap-3">
            <DetailRow
              label="Lokasi Kejadian"
              value={
                d.isOutOfArea === true
                  ? "Luar negeri/daerah"
                  : d.isOutOfArea === false
                    ? "Dalam kawasan"
                    : null
              }
            />
            <DetailRow
              label="Tarikh Pengebumian"
              value={
                d.burialDate
                  ? new Date(d.burialDate).toLocaleDateString("ms-MY", {
                      dateStyle: "medium",
                    })
                  : null
              }
            />
          </div>
          <DetailRow
            label="Pengurusan Mandi & Solat"
            value={
              d.careScenario === "other"
                ? d.careScenarioOther
                : CARE_SCENARIOS.find((s) => s.value === d.careScenario)
                    ?.label
            }
          />
        </FormSection>

        {mapsUrl && (
          <FormSection title="Lokasi Jemputan">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <MapPinned className="w-4 h-4" /> Jemput ke lokasi semasa
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 underline"
            >
              <Navigation className="w-3 h-3" />
              {d.pickupLat?.toFixed(5)}, {d.pickupLng?.toFixed(5)} — Buka Peta
            </a>
          </FormSection>
        )}

        <DetailRow label="Tarikh Permohonan">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {caseItem?.createdat
              ? new Date(caseItem.createdat).toLocaleString("ms-MY", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </p>
        </DetailRow>

        {!showDeceasedForm && (
          <div className="space-y-3">
            <DocumentLinks
              label="Pengesahan Kematian"
              value={caseItem?.deathconfirmationphotourl}
              bucket="bucket-death-confirmation"
            />
            <DocumentLinks
              label="Laporan Polis"
              value={caseItem?.policereportphotourl}
              bucket="bucket-police-report"
            />
            <DocumentLinks
              label="Dokumen Sokongan"
              value={caseItem?.supportingphotourl}
              bucket="supporting-doc-jenazah-case"
            />
          </div>
        )}

        {caseItem?.userremarks && (
          <div className="space-y-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Catatan Pemohon
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {caseItem.userremarks}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 dark:text-slate-400">
            Catatan Admin {caseItem?.status === "pending" ? "(opsional)" : ""}
          </Label>
          {caseItem?.status === "pending" ? (
            <Textarea
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Catatan dalaman admin..."
              rows={2}
              className="text-sm resize-none dark:bg-slate-800 dark:border-slate-700"
            />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {caseItem?.adminremarks || (
                <span className="text-slate-400 italic">Tiada catatan</span>
              )}
            </p>
          )}
        </div>

        {caseItem?.addedtoqariah && (
          <p className="text-xs text-center text-emerald-600 flex items-center justify-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Telah didaftarkan sebagai
            ahli qariah
          </p>
        )}

        {showDeceasedForm && (
          <FormSection title="Maklumat Arwah">
            <DocumentLinks
              label="Pengesahan Kematian"
              value={caseItem?.deathconfirmationphotourl}
              bucket="bucket-death-confirmation"
            />
            <DocumentLinks
              label="Laporan Polis"
              value={caseItem?.policereportphotourl}
              bucket="bucket-police-report"
            />
            <DocumentLinks
              label="Dokumen Sokongan"
              value={caseItem?.supportingphotourl}
              bucket="supporting-doc-jenazah-case"
            />

            <SelectForm
              name="grave"
              control={dc}
              label="Kubur"
              placeholder="Pilih Kubur"
              options={graves.map((g) => ({ value: g.id, label: g.name }))}
              required
              errors={de}
            />
            <TextInputForm
              name="gravelot"
              control={dc}
              label="Lot Kubur"
              errors={de}
              required
            />
            <TextInputForm
              name="causeofdeath"
              control={dc}
              label="Sebab Kematian"
              errors={de}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextInputForm
                name="dateofbirth"
                control={dc}
                label="Tarikh Lahir"
                isDate
                errors={de}
              />
              <TextInputForm
                name="dateofdeath"
                control={dc}
                label="Tarikh Kematian"
                isDate
                required
                errors={de}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInputForm
                name="heirname"
                control={dc}
                label="Nama Waris"
                errors={de}
              />
              <TextInputForm
                name="heirphoneno"
                control={dc}
                label="No. Tel. Waris"
                errors={de}
              />
            </div>
          </FormSection>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0 space-y-2">
        {caseItem?.status === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                handleAction("rejected");
                setShowDeceasedForm(false);
              }}
              disabled={isBusy}
              className="flex-1 h-11 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-70 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Tolak
            </button>
            {showDeceasedForm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeceasedForm(false)}
                  disabled={isBusy}
                  className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold active:opacity-70 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onApproveSubmit}
                  disabled={isBusy}
                  className="flex-[2] h-11 rounded-2xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-80 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isBusy ? "Menyimpan..." : "Luluskan & Simpan"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeceasedForm(true)}
                disabled={isBusy}
                className="flex-1 h-11 rounded-2xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-80 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {translate("Verify")}
              </button>
            )}
          </div>
        )}

        {caseItem?.status !== "pending" && (
          <button
            type="button"
            onClick={() => handleAction("pending")}
            disabled={isBusy}
            className="w-full h-11 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold active:opacity-70 disabled:opacity-50"
          >
            Tetapkan Semula ke Tertunda
          </button>
        )}

        {caseItem?.isapproved &&
          !caseItem?.qariahmemberid &&
          !caseItem?.addedtoqariah && (
            <button
              type="button"
              onClick={() => onAddToQariah(caseItem.id)}
              disabled={isAddingToQariah}
              className="w-full h-11 rounded-2xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-80 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {isAddingToQariah ? "Mendaftar..." : "Tambah ke Qariah"}
            </button>
          )}
      </div>
    </div>
  );
}

export default function MobileManageJenazahCase() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [addToQariahId, setAddToQariahId] = useState(null);
  const itemsPerPage = 10;

  const { data, isLoading, refetch } = trpc.jenazahCase.getPaginated.useQuery(
    { page, pageSize: itemsPerPage, status: statusFilter || undefined },
    { enabled: !loadingUser && hasAdminAccess },
  );

  const updateStatus = trpc.jenazahCase.updateStatus.useMutation({
    onSuccess: () => {
      showSuccess("Status kes dikemaskini.");
      setSelectedCase(null);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const createMutation = trpc.jenazahCase.create.useMutation({
    onSuccess: () => {
      showSuccess("Kes jenazah berjaya ditambah.");
      setFormOpen(false);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.jenazahCase.delete.useMutation({
    onSuccess: () => {
      showSuccess("Kes jenazah berjaya dipadam.");
      setCaseToDelete(null);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const addToQariahMutation = trpc.jenazahCase.addToQariah.useMutation({
    onSuccess: () => {
      showSuccess("Ahli berjaya didaftarkan ke Qariah.");
      setSelectedCase(null);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const handleFormSubmit = async ({
    mosqueId,
    details,
    adminremarks,
    deathconfirmationphotourl,
    policereportphotourl,
    supportingphotourl,
  }) => {
    await createMutation.mutateAsync({
      mosqueId,
      details,
      adminremarks,
      deathconfirmationphotourl,
      policereportphotourl,
      supportingphotourl,
      autoApprove: true,
    });
  };

  const STATUS_TABS = [
    { label: "Semua", value: "" },
    { label: "Tertunda", value: "pending" },
    { label: "Diluluskan", value: "approved" },
    { label: "Ditolak", value: "rejected" },
  ];

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="min-h-screen pb-6">
      <BackNavigation title="Pengurusan Kes Jenazah" />

      <div className="max-w-2xl mx-auto px-3 space-y-3 pt-1">
        <button
          onClick={() => setFormOpen(true)}
          className="w-full h-11 rounded-2xl bg-rose-600 text-white text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Kes Jenazah
        </button>

        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <InlineLoadingComponent isPage />
        ) : items.length === 0 ? (
          <MobileEmptyList icon={ClipboardList} title="Tiada Kes Dijumpai" />
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const d = c.details ?? {};
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 space-y-2 shadow-sm active:opacity-90"
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {d.deceasedFullname || "—"}
                      </p>
                      {d.deceasedIcnumber && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {d.deceasedIcnumber}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {c.mosque && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.mosque.name}
                      </span>
                    )}
                    {d.isQariahMember && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="w-3 h-3" /> Ahli Qariah
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {c.createdat
                        ? new Date(c.createdat).toLocaleDateString("ms-MY", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </p>
                    <div className="flex items-center gap-1">
                      {c.isapproved &&
                        !c.qariahmemberid &&
                        !c.addedtoqariah && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddToQariahId(c.id);
                            }}
                            className="text-emerald-500 hover:text-emerald-700 transition-colors p-1.5"
                            title="Tambah ke Qariah"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCaseToDelete(c);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={() => {}}
              totalItems={total}
            />
          </div>
        )}
      </div>

      {selectedCase && (
        <CaseDetailSheet
          caseItem={selectedCase}
          onClose={() => setSelectedCase(null)}
          onStatusChange={(id, status, adminremarks) =>
            updateStatus.mutate({
              id,
              status,
              adminremarks: adminremarks || null,
            })
          }
          isUpdating={updateStatus.isPending}
          onAddToQariah={(id) => setAddToQariahId(id)}
          isAddingToQariah={addToQariahMutation.isPending}
        />
      )}

      {formOpen && (
        <CaseFormSheet
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!caseToDelete}
        onOpenChange={(v) => {
          if (!v) setCaseToDelete(null);
        }}
        title="Padam Kes Jenazah"
        isDelete
        itemToDelete={caseToDelete?.details?.deceasedFullname}
        onConfirm={() => deleteMutation.mutate({ id: caseToDelete?.id })}
        isMobile
      />

      <ConfirmDialog
        open={!!addToQariahId}
        onOpenChange={(v) => {
          if (!v) setAddToQariahId(null);
        }}
        title="Tambah ke Qariah"
        description="Adakah anda pasti untuk mendaftarkan arwah ini sebagai ahli Qariah? Rekod akan dicipta dalam senarai ahli."
        confirmText="Ya, Tambah"
        onConfirm={() => addToQariahMutation.mutate({ id: addToQariahId })}
        isMobile
      />
    </div>
  );
}
