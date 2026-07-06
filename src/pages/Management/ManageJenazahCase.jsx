// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useIsNarrow } from "@/hooks/useIsNarrow";
import MobileManageJenazahCase from "@/pages/Mobile/ManageJenazahCase";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { useAdminAccess } from "@/utils/auth";
import Breadcrumb from "@/components/Breadcrumb";
import SearchBar from "@/components/forms/SearchBar";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import ConfirmDialog from "@/components/ConfirmDialog";
import { translate } from "@/utils/translations";
import { useGetGravePaginated } from "@/hooks/useGraveMutations";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import {
  MapPinned,
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
import { CARE_SCENARIOS } from "@/utils/enums";
import { parseDobFromIcNumber } from "@/utils/helpers";
import { defaultManageJenazahCaseField } from "@/utils/defaultformfields";

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
            <Trash2 className="w-4 h-4" /> {translate("Delete Case?")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {translate(
            "This action cannot be undone. This case will be permanently deleted.",
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {translate("Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isDeleting ? translate("Deleting...") : translate("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_CONFIG = {
  pending: {
    label: translate("Pending"),
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: translate("Approved"),
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: translate("Rejected"),
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
  const parsedDob = parseDobFromIcNumber(icRaw);

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
      heirname: d.heirname ?? "",
      heirphoneno: d.heirphoneno ?? "",
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
            {translate("Funeral Case Details")}
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
                  {translate("Mosque")}
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
                {translate("Maklumat Jenazah")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label={translate("Name")} value={d.deceasedFullname} />
                <DetailRow label={translate("IC No.")} value={d.deceasedIcnumber} />
                <DetailRow label={translate("Phone")} value={d.deceasedPhone} />
                <DetailRow label={translate("Email")} value={d.deceasedEmail} />
              </div>
              {d.deceasedAddress && (
                <DetailRow label={translate("Address")} value={d.deceasedAddress} />
              )}
              <DetailRow label={translate("Qariah Member Status")}>
                {d.isQariahMember ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                    <BadgeCheck className="w-3.5 h-3.5" /> {translate("Registered Qariah Member")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Info className="w-3.5 h-3.5" /> {translate("Not a Qariah Member")}
                  </span>
                )}
              </DetailRow>
            </div>

            <div className="space-y-2 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {translate("Funeral Procedure")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow
                  label={translate("Incident Location")}
                  value={
                    d.isOutOfArea === true
                      ? translate("Outside state/district")
                      : d.isOutOfArea === false
                        ? translate("Within area")
                        : null
                  }
                />
                <DetailRow
                  label={translate("Burial Date")}
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
                label={translate("Bathing & Prayer Management")}
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
                  {translate("Pickup Location")}
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <MapPinned className="w-4 h-4" /> {translate("Pickup at current location")}
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 underline"
                >
                  <Navigation className="w-3 h-3" />
                  {d.pickupLat?.toFixed(5)}, {d.pickupLng?.toFixed(5)} —{" "}
                  {translate("Open Map")}
                </a>
              </div>
            )}

            <DetailRow label={translate("Application Date")}>
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
                  label={translate("Death Confirmation")}
                  value={caseItem?.deathconfirmationphotourl}
                  bucket="bucket-death-confirmation"
                />
                <DocumentLinks
                  label={translate("Police Report")}
                  value={caseItem?.policereportphotourl}
                  bucket="bucket-police-report"
                />
                <DocumentLinks
                  label={translate("Supporting Documents")}
                  value={caseItem?.supportingphotourl}
                  bucket="supporting-doc-jenazah-case"
                />
              </>
            )}

            {/* User remarks — read-only, show if set */}
            {caseItem?.userremarks && (
              <div className="space-y-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {translate("Applicant's Remarks")}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {caseItem.userremarks}
                </p>
              </div>
            )}

            {/* Admin remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400">
                {translate("Notes")} Admin{" "}
                {caseItem?.status === "pending"
                  ? `(${translate("Optional")})`
                  : ""}
              </Label>
              {caseItem?.status === "pending" ? (
                <Textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={translate("Internal admin notes...")}
                  rows={2}
                  className="text-sm resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseItem?.adminremarks || (
                    <span className="text-slate-400 italic">{translate("No remarks")}</span>
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
                  <XCircle className="w-4 h-4 mr-1.5" /> {translate("Reject")}
                </Button>
                {showDeceasedForm ? (
                  <Button
                    onClick={() => setShowDeceasedForm(false)}
                    variant="outline"
                    disabled={isBusy}
                  >
                    {translate("Cancel")}
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
                {translate("Reset to Pending")}
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
                  {isAddingToQariah ? translate("Registering...") : translate("Add to Qariah")}
                </Button>
              )}
            {caseItem?.addedtoqariah && (
              <p className="text-xs text-center text-emerald-600 flex items-center justify-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> {translate("Already registered as a Qariah member")}
              </p>
            )}
          </div>

          {showDeceasedForm && (
            <div className="space-y-4 border-l pl-6 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b pb-2 dark:border-slate-600">
                {translate("Deceased Information")}
              </h3>

              <DocumentLinks
                label={translate("Death Confirmation")}
                value={caseItem?.deathconfirmationphotourl}
                bucket="bucket-death-confirmation"
              />
              <DocumentLinks
                label={translate("Police Report")}
                value={caseItem?.policereportphotourl}
                bucket="bucket-police-report"
              />
              <DocumentLinks
                label={translate("Supporting Documents")}
                value={caseItem?.supportingphotourl}
                bucket="supporting-doc-jenazah-case"
              />

              <SelectForm
                name="grave"
                control={dc}
                label={translate("Grave")}
                placeholder={translate("Select Grave")}
                options={graves.map((g) => ({ value: g.id, label: g.name }))}
                required={showDeceasedForm}
                errors={de}
              />

              <TextInputForm
                name="gravelot"
                control={dc}
                label={translate("Grave Lot")}
                errors={de}
                required={showDeceasedForm}
              />

              <TextInputForm
                name="causeofdeath"
                control={dc}
                label={translate("Cause of Death")}
                errors={de}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInputForm
                  name="dateofbirth"
                  control={dc}
                  label={translate("Date of Birth")}
                  isDate
                  errors={de}
                />
                <TextInputForm
                  name="dateofdeath"
                  control={dc}
                  label={translate("Date of Death")}
                  isDate
                  errors={de}
                  required={showDeceasedForm}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextInputForm
                  name="heirname"
                  control={dc}
                  label={translate("Nama Waris")}
                  errors={de}
                />
                <TextInputForm
                  name="heirphoneno"
                  control={dc}
                  label={translate("No. Tel. Waris")}
                  errors={de}
                />
              </div>

              <Button
                onClick={onApproveSubmit}
                disabled={isBusy}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                {isBusy ? translate("Saving...") : translate("Approve & Save")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CaseFormDialog({ open, onClose, onSubmit, isSubmitting }) {
  const { currentUser } = useAdminAccess();
  const userOrgId = currentUser?.organisation?.id ?? null;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({ defaultValues: defaultManageJenazahCaseField });

  const selectedOrgId = watch("selectedOrgId");
  const selectedMosqueId = watch("selectedMosqueId");
  const skipMosqueResetRef = useRef(false);

  const [searchedIc, setSearchedIc] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isQariahMember, setIsQariahMember] = useState(false);
  const [isOutOfArea, setIsOutOfArea] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [activeTab, setActiveTab] = useState("deceased");

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
      setIsQariahMember(false);
    }
    setSearchAttempted(true);
  }, [memberResult, memberSearching, searchedIc, setValue]);

  useEffect(() => {
    if (!open) return;
    reset(defaultManageJenazahCaseField);
    setIsQariahMember(false);
    setSearchedIc("");
    setSearchAttempted(false);
    setIsOutOfArea(null);
    setShowMap(true);
    setActiveTab("deceased");
  }, [open, reset]);

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

  const handleNextFromDeceased = async () => {
    if (!searchAttempted) {
      showApiError({
        message: translate("Please search by IC number first."),
      });
      return;
    }
    const valid = await trigger(["deceasedFullname", "heirname", "heirphoneno"]);
    if (!valid) {
      showApiError({
        message: translate("Please complete the required fields before proceeding."),
      });
      return;
    }
    setActiveTab("management");
  };

  const handleNextFromManagement = async () => {
    if (isOutOfArea === null) {
      showApiError({
        message: translate("Please answer the incident location question."),
      });
      return;
    }
    const fieldsToCheck = ["careScenario", "burialdate"];
    if (careScenario === "other") fieldsToCheck.push("careScenarioOther");
    const valid = await trigger(fieldsToCheck);
    if (!valid) {
      showApiError({
        message: translate("Please complete the required fields before proceeding."),
      });
      return;
    }
    setActiveTab("notes");
  };

  const handleFormSubmit = (data) => {
    if (isOutOfArea === null) {
      showApiError({
        message: translate("Please answer the incident location question."),
      });
      return;
    }
    if (!data.careScenario) {
      showApiError({
        message: translate("Please select the funeral management location."),
      });
      return;
    }
    if (data.careScenario === "other" && !data.careScenarioOther?.trim()) {
      showApiError({
        message: translate(
          "Please specify the funeral management procedure.",
        ),
      });
      return;
    }
    if (!data.burialdate) {
      showApiError({
        message: translate("Please specify the burial date."),
      });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{translate("Add Funeral Case")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deceased" className="pointer-events-none">
                {translate("Maklumat Jenazah")}
              </TabsTrigger>
              <TabsTrigger value="management" className="pointer-events-none">
                {translate("Funeral Management")}
              </TabsTrigger>
              <TabsTrigger value="notes" className="pointer-events-none">
                {translate("Notes & Documents")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deceased" className="space-y-5 mt-4">
              <div className="space-y-3">
                <Select2Form
                  name="selectedOrgId"
                  control={control}
                  label={translate("Organisation")}
                  placeholder={translate("Select organisation")}
                  searchPlaceholder={translate("Search organisation...")}
                  emptyMessage={translate("No organisations.")}
                  options={organisations.map((o) => ({
                    value: o.id,
                    label: o.name,
                  }))}
                />
                <Select2Form
                  name="selectedMosqueId"
                  control={control}
                  label={translate("Mosque")}
                  placeholder={
                    selectedOrgId
                      ? translate("Select Mosque")
                      : translate("Select organisation first")
                  }
                  searchPlaceholder={translate("Search mosque...")}
                  emptyMessage={translate("No mosques found.")}
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
                      label={translate("IC No.")}
                      isICNumber
                      placeholder={translate("Enter IC number")}
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
                    {memberSearching ? translate("Searching...") : translate("Search")}
                  </Button>
                </div>
                {searchAttempted ? (
                  memberResult ? (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> {translate("Registered Qariah Member")}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> {translate("Not found — fill in details manually")}
                    </p>
                  )
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> {translate("Please search by IC number first.")}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <TextInputForm
                  name="deceasedFullname"
                  control={control}
                  label={translate("Full Name")}
                  required
                  errors={errors}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
                  {translate("Maklumat Waris")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <TextInputForm
                    name="heirname"
                    control={control}
                    label={translate("Nama Waris")}
                    required
                    errors={errors}
                  />
                  <TextInputForm
                    name="heirphoneno"
                    control={control}
                    label={translate("No. Tel. Waris")}
                    isPhone
                    required
                    errors={errors}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-5 mt-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {translate("Incident Location")}
                  <span className="text-red-500 ml-1">*</span>
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

              <div className="space-y-3">
                <SelectForm
                  name="careScenario"
                  control={control}
                  label={translate("Funeral Management")}
                  placeholder={translate("Select funeral management")}
                  options={CARE_SCENARIOS}
                  required
                  errors={errors}
                />
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

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {translate("Pickup Location")} ({translate("Optional")})
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap((v) => !v)}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    {showMap ? translate("Hide Map") : translate("Pick on Map")}
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
                    placeholder={translate("Search location...")}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-5 mt-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {translate("Admin Notes")}
                </p>
                <TextInputForm
                  name="adminremarks"
                  control={control}
                  label={`${translate("Notes")} (${translate("Optional")})`}
                  isTextArea
                  rows={2}
                  placeholder={translate("Internal notes for record...")}
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  bucketName="supporting-doc-jenazah-case"
                  handleFileUpload={handleFileUpload}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            {activeTab === "deceased" && (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  {translate("Cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleNextFromDeceased}
                  disabled={!searchAttempted}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {translate("Next")}
                </Button>
              </>
            )}
            {activeTab === "management" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("deceased")}
                >
                  {translate("Back")}
                </Button>
                <Button
                  type="button"
                  onClick={handleNextFromManagement}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {translate("Next")}
                </Button>
              </>
            )}
            {activeTab === "notes" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("management")}
                >
                  {translate("Back")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {translate("Add Case")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      showSuccess(translate("Case status updated."));
      setSelectedCase(null);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const createMutation = trpc.jenazahCase.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Funeral case added successfully."));
      setFormOpen(false);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.jenazahCase.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate("Funeral case deleted successfully."));
      setDeleteId(null);
      refetch();
    },
    onError: (err) => showApiError(err),
  });

  const addToQariahMutation = trpc.jenazahCase.addToQariah.useMutation({
    onSuccess: () => {
      showSuccess(translate("Member successfully registered to Qariah."));
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
          { label: translate("Funeral Case Management"), page: "ManageJenazahCase" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <ClipboardList className="w-6 h-6 text-rose-600" />
          {translate("Funeral Case Management")}
        </h1>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {translate("Add Case")}
        </Button>
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        buttonClassName="bg-rose-600 hover:bg-rose-700 text-white"
        filters={[
          {
            type: "text",
            key: "search",
            value: tempSearch,
            onChange: setTempSearch,
            label: translate("Search deceased name or IC No."),
          },
          {
            type: "select",
            key: "status",
            value: tempStatus,
            onChange: setTempStatus,
            label: translate("Status"),
            options: [
              { value: "all", label: translate("All Status") },
              { value: "pending", label: translate("Pending") },
              { value: "approved", label: translate("Approved") },
              { value: "rejected", label: translate("Rejected") },
            ],
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Reference No")}</TableHead>
                <TableHead>{translate("Deceased Name")}</TableHead>
                <TableHead>{translate("IC No.")}</TableHead>
                <TableHead>{translate("Mosque")}</TableHead>
                <TableHead className="text-center">{translate("Qariah Member")}</TableHead>
                <TableHead className="text-center">{translate("Date")}</TableHead>
                <TableHead className="text-center">{translate("Status")}</TableHead>
                <TableHead className="text-center">{translate("Action")}</TableHead>
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
                      <TableCell className="text-sm font-mono text-slate-600 dark:text-slate-300">
                        {c.referenceno || (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
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
                            <BadgeCheck className="w-3 h-3 mr-1" /> {translate("Yes")}
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
                                title={translate("Add to Qariah")}
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
        title={translate("Add to Qariah")}
        description={translate(
          "Are you sure you want to register this deceased person as a Qariah member? A record will be created in the member list.",
        )}
        confirmText={translate("Yes, Add")}
        onConfirm={() => addToQariahMutation.mutate({ id: addToQariahId })}
      />
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────

export default function ManageJenazahCase() {
  const isNarrow = useIsNarrow();
  return isNarrow ? <MobileManageJenazahCase /> : <ManageJenazahCaseDesktop />;
}
