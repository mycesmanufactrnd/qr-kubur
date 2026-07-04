// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useIsNarrow } from "@/hooks/useIsNarrow";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import Breadcrumb from "@/components/Breadcrumb";
import SearchBar from "@/components/forms/SearchBar";
import BackNavigation from "@/components/BackNavigation";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import FileUploadForm from "@/components/forms/FileUploadForm";
import MultipleFileUploadForm from "@/components/forms/MultipleFileUploadForm";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";
import MapLocationPicker from "@/components/MapLocationPicker";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import ConfirmDialog from "@/components/ConfirmDialog";
import { translate } from "@/utils/translations";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
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
} from "lucide-react";

const CARE_SCENARIOS = [
  { value: "home_home", label: "Di Rumah — Mandi & Solat di Rumah" },
  { value: "home_mosque", label: "Di Rumah — Mandi & Solat di Masjid" },
  { value: "hospital_hospital", label: "Di Hospital — Mandi & Solat di Hospital" },
  { value: "hospital_mosque", label: "Di Hospital — Mandi & Solat di Masjid" },
  { value: "hospital_home", label: "Di Hospital — Mandi & Solat di Rumah" },
  { value: "other", label: "Lain-lain (Nyatakan Sendiri)" },
];

const toDateInputValue = (d) => d.toISOString().split("T")[0];

function DeleteConfirmDialog({ open, onClose, onConfirm, isDeleting }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-4 h-4" /> Padam Kes?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tindakan ini tidak boleh dibatalkan. Kes ini akan dipadam secara
          kekal.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isDeleting ? "Mempadam..." : "Padam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

function CaseDetailDialog({
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

  // Pre-parse DOB from IC for the deceased form default
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
    <Dialog open={!!caseItem} onOpenChange={onClose}>
      <DialogContent
        className={`${showDeceasedForm ? "max-w-[80vw]" : "max-w-xl"} max-h-[90vh] overflow-y-auto dark:bg-slate-800`}
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            Butiran Kes Jenazah
            {caseItem && <StatusBadge status={caseItem.status} />}
          </DialogTitle>
        </DialogHeader>

        <div
          className={showDeceasedForm ? "grid grid-cols-2 gap-6" : undefined}
        >
          <div className="space-y-4 py-1">
            {caseItem?.mosque && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
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

            <div className="space-y-3 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Maklumat Jenazah
              </p>
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
            </div>

            <div className="space-y-2 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Prosedur Jenazah
              </p>
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
            </div>

            {mapsUrl && (
              <div className="space-y-1.5 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Lokasi Jemputan
                </p>
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
                  {d.pickupLat?.toFixed(5)}, {d.pickupLng?.toFixed(5)} — Buka
                  Peta
                </a>
              </div>
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

            {/* Documents — only shown here when the deceased form is not open */}
            {!showDeceasedForm && (
              <>
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
              </>
            )}

            {/* User remarks — read-only, show if set */}
            {caseItem?.userremarks && (
              <div className="space-y-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Catatan Pemohon
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {caseItem.userremarks}
                </p>
              </div>
            )}

            {/* Admin remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400">
                Catatan Admin{" "}
                {caseItem?.status === "pending" ? "(opsional)" : ""}
              </Label>
              {caseItem?.status === "pending" ? (
                <Textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Catatan dalaman admin..."
                  rows={2}
                  className="text-sm resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseItem?.adminremarks || (
                    <span className="text-slate-400 italic">Tiada catatan</span>
                  )}
                </p>
              )}
            </div>

            {caseItem?.status === "pending" && (
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  onClick={() => {
                    handleAction("rejected");
                    setShowDeceasedForm(false);
                  }}
                  disabled={isBusy}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                </Button>
                {showDeceasedForm ? (
                  <Button
                    onClick={() => setShowDeceasedForm(false)}
                    variant="outline"
                    disabled={isBusy}
                  >
                    Batal
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowDeceasedForm(true)}
                    disabled={isBusy}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {translate("Verify")}
                  </Button>
                )}
              </div>
            )}
            {caseItem?.status !== "pending" && (
              <Button
                onClick={() => handleAction("pending")}
                disabled={isBusy}
                variant="outline"
                className="w-full"
              >
                Tetapkan Semula ke Tertunda
              </Button>
            )}

            {caseItem?.isapproved &&
              !caseItem?.qariahmemberid &&
              !caseItem?.addedtoqariah && (
                <Button
                  onClick={() => onAddToQariah(caseItem.id)}
                  disabled={isAddingToQariah}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {isAddingToQariah ? "Mendaftar..." : "Tambah ke Qariah"}
                </Button>
              )}
            {caseItem?.addedtoqariah && (
              <p className="text-xs text-center text-emerald-600 flex items-center justify-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> Telah didaftarkan sebagai
                ahli qariah
              </p>
            )}
          </div>

          {showDeceasedForm && (
            <div className="space-y-4 border-l pl-6 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b pb-2 dark:border-slate-600">
                Maklumat Arwah
              </h3>

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
                required={showDeceasedForm}
                errors={de}
              />

              <TextInputForm
                name="gravelot"
                control={dc}
                label="Lot Kubur"
                errors={de}
                required={showDeceasedForm}
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
                  errors={de}
                  required={showDeceasedForm}
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

              <Button
                onClick={onApproveSubmit}
                disabled={isBusy}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                {isBusy ? "Menyimpan..." : "Luluskan & Simpan"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

function CaseFormDialog({ open, onClose, onSubmit, isSubmitting }) {
  const { currentUser } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;

  const {
    control,
    handleSubmit,
    watch,
    reset,
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
    trpc.deathCharityMember.getOrganisations.useQuery(
      { organisationId: userOrgId },
      { enabled: open },
    );

  const { data: mosques = [], isLoading: mosquesLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery(
      { organisationId: selectedOrgId },
      { enabled: open && !!selectedOrgId },
    );

  const { data: memberResult, isFetching: memberSearching } =
    trpc.deathCharityMember.searchByIcNumber.useQuery(
      { icnumber: searchedIc.trim(), mosqueId: selectedMosqueId },
      { enabled: !!searchedIc.trim(), refetchOnWindowFocus: false },
    );

  // Pre-fill form when IC search completes
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

  // Reset on open
  useEffect(() => {
    if (!open) return;
    reset(DEFAULT_CASE_FORM);
    setIsQariahMember(false);
    setSearchedIc("");
    setSearchAttempted(false);
    setIsOutOfArea(null);
    setShowMap(false);
  }, [open, reset]);

  // Reset the chosen mosque whenever the organisation changes
  // (skip once right after IC-search prefill sets both org and mosque together)
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
      burialdate,
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
        burialDate: burialdate,
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>Tambah Kes Jenazah</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                  {translate("Maklumat Jenazah")}
                </h3>
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
                    selectedOrgId
                      ? "Pilih masjid..."
                      : "Pilih organisasi dahulu"
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
              </div>

              <div className="space-y-3">
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
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={
                      !(icSearch ?? "").replace(/-/g, "").trim() ||
                      memberSearching
                    }
                    variant="outline"
                    className="shrink-0 mb-0.5"
                  >
                    {memberSearching ? "Mencari..." : "Cari"}
                  </Button>
                </div>
                {searchAttempted &&
                  (memberResult ? (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Ahli Qariah
                      Berdaftar
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Tidak ditemui — isi
                      maklumat secara manual
                    </p>
                  ))}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <TextInputForm
                    name="deceasedFullname"
                    control={control}
                    label="Nama Penuh"
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="deceasedIcnumber"
                    control={control}
                    label="No. IC"
                    isICNumber
                    errors={errors}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextInputForm
                    name="deceasedPhone"
                    control={control}
                    label="Telefon"
                    isPhone
                    errors={errors}
                  />
                  <TextInputForm
                    name="deceasedEmail"
                    control={control}
                    label="E-mel"
                    isEmail
                    errors={errors}
                  />
                </div>
                <TextInputForm
                  name="deceasedAddress"
                  control={control}
                  label="Alamat"
                  isTextArea
                />
              </div>
            </div>

            <div className="space-y-5 border-l pl-6 dark:border-slate-600">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                Pengurusan Jenazah
              </h3>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lokasi Kejadian
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
                    Dalam Kawasan Qariah
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
                    Luar Negeri/Daerah
                  </button>
                </div>
              </div>

              <div className="space-y-3">
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
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lokasi Jemputan (opsional)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap((v) => !v)}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    {showMap ? "Sembunyi Peta" : "Pilih di Peta"}
                  </Button>
                </div>
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
              </div>
            </div>

            <div className="space-y-5 border-l pl-6 dark:border-slate-600">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                Catatan & Dokumen
              </h3>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Catatan Admin
                </p>
                <TextInputForm
                  name="adminremarks"
                  control={control}
                  label="Catatan (opsional)"
                  isTextArea
                  rows={2}
                  placeholder="Catatan dalaman untuk rekod..."
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  bucketName="supporting-doc-jenazah-case"
                  handleFileUpload={handleFileUpload}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {translate("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Tambah Kes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageJenazahCaseMobile() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [addToQariahId, setAddToQariahId] = useState(null);
  const pageSize = 10;

  const { data, isLoading, refetch } = trpc.jenazahCase.getPaginated.useQuery(
    { page, pageSize, status: statusFilter || undefined },
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
      setDeleteId(null);
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
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen space-y-3 pb-6">
      <BackNavigation title="Pengurusan Kes Jenazah" />

      <Button
        onClick={() => setFormOpen(true)}
        size="sm"
        className="bg-rose-600 hover:bg-rose-700 text-white w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Kes Jenazah
      </Button>

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

      {!isLoading && (
        <p className="text-xs text-slate-400 px-0.5">{total} kes dijumpai</p>
      )}

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : items.length === 0 ? (
        <NoDataCardComponent isPage title="Tiada Kes Dijumpai" />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const d = c.details ?? {};
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 cursor-pointer hover:shadow-sm transition-all"
                onClick={() => setSelectedCase(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {d.deceasedFullname || "—"}
                    </p>
                    {d.deceasedIcnumber && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.deceasedIcnumber}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {c.mosque && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {c.mosque.name}
                    </span>
                  )}
                  {d.isQariahMember && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <BadgeCheck className="w-3 h-3" /> Ahli Qariah
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {c.createdat
                      ? new Date(c.createdat).toLocaleDateString("ms-MY", {
                          dateStyle: "medium",
                        })
                      : "—"}
                  </p>
                  <div className="flex items-center gap-2">
                    {c.isapproved && !c.qariahmemberid && !c.addedtoqariah && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddToQariahId(c.id);
                        }}
                        className="text-emerald-500 hover:text-emerald-700 transition-colors p-1"
                        title="Tambah ke Qariah"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(c.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-blue-600 font-medium">Lihat →</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 text-xs"
          >
            Sebelum
          </Button>
          <p className="text-xs text-slate-500">
            {page} / {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-3 text-xs"
          >
            Seterus
          </Button>
        </div>
      )}

      {selectedCase && (
        <CaseDetailDialog
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

      <CaseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate({ id: deleteId })}
        isDeleting={deleteMutation.isPending}
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

// ─── Desktop view ─────────────────────────────────────────────────────────

function ManageJenazahCaseDesktop() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCase, setSelectedCase] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [addToQariahId, setAddToQariahId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlStatus = searchParams.get("status") || "";
  const urlSearch = searchParams.get("search") || "";

  const [tempSearch, setTempSearch] = useState(urlSearch);
  const [tempStatus, setTempStatus] = useState(urlStatus || "all");

  useEffect(() => {
    setTempSearch(urlSearch);
    setTempStatus(urlStatus || "all");
  }, [urlSearch, urlStatus]);

  const { data, isLoading, refetch } = trpc.jenazahCase.getPaginated.useQuery(
    {
      page: urlPage,
      pageSize: itemsPerPage,
      status: urlStatus || undefined,
      search: urlSearch || undefined,
    },
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
      setDeleteId(null);
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

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  const setPage = (p) =>
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: p.toString(),
    });

  const handleSearch = () => {
    const params = { ...Object.fromEntries(searchParams), page: "1" };
    if (tempSearch) params.search = tempSearch;
    else delete params.search;
    if (tempStatus && tempStatus !== "all") params.status = tempStatus;
    else delete params.status;
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempSearch("");
    setTempStatus("all");
    setSearchParams({ page: "1" });
  };

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: "Pengurusan Kes Jenazah", page: "ManageJenazahCase" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <ClipboardList className="w-6 h-6 text-rose-600" />
          Pengurusan Kes Jenazah
        </h1>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kes
        </Button>
      </div>

      <SearchBar
        value={tempSearch}
        onChange={setTempSearch}
        onSearch={handleSearch}
        onReset={handleReset}
        placeholder="Cari nama jenazah atau No. IC..."
        buttonClassName="bg-rose-600 hover:bg-rose-700 text-white"
        filtersClassName="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Select value={tempStatus} onValueChange={setTempStatus}>
          <SelectTrigger className="bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Tertunda</SelectItem>
            <SelectItem value="approved">Diluluskan</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </SearchBar>

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Jenazah</TableHead>
                <TableHead>No. IC</TableHead>
                <TableHead>Masjid</TableHead>
                <TableHead className="text-center">Ahli Qariah</TableHead>
                <TableHead className="text-center">Tarikh</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={8} />
              ) : items.length === 0 ? (
                <NoDataTableComponent colSpan={8} />
              ) : (
                items.map((c) => {
                  const d = c.details ?? {};
                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <TableCell className="font-medium">
                        {d.deceasedFullname || (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        {d.deceasedIcnumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.mosque?.name || (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {d.isQariahMember ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 text-xs">
                            <BadgeCheck className="w-3 h-3 mr-1" /> Ya
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500">
                        {c.createdat
                          ? new Date(c.createdat).toLocaleDateString("ms-MY", {
                              dateStyle: "medium",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {c.isapproved &&
                            !c.qariahmemberid &&
                            !c.addedtoqariah && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAddToQariahId(c.id)}
                                disabled={addToQariahMutation.isPending}
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                title="Tambah ke Qariah"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCase(c)}
                            className="h-7 px-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(c.id)}
                            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setPage(1);
            }}
            totalItems={total}
          />
        )}
      </Card>

      {selectedCase && (
        <CaseDetailDialog
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

      <CaseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate({ id: deleteId })}
        isDeleting={deleteMutation.isPending}
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
      />
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────

export default function ManageJenazahCase() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <ManageJenazahCaseMobile /> : <ManageJenazahCaseDesktop />;
}
