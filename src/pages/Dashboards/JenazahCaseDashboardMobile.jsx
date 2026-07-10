// @ts-nocheck
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { resolveFileUrl } from "@/utils";
import { useAdminAccess } from "@/utils/auth";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import DirectionButton from "@/components/DirectionButton";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Users,
  BadgeCheck,
  Info,
  FileText,
  LandPlot,
  Sparkles,
} from "lucide-react";
import { CARE_SCENARIOS } from "@/utils/enums";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  ongoing: {
    label: "Ongoing",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle,
  },
  closed: {
    label: "Closed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: BadgeCheck,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {translate(cfg.label)}
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

function DocumentThumb({ fileKey, bucket, label, onOpen }) {
  const src = resolveFileUrl(fileKey, bucket);
  const isPdf = isPdfKey(fileKey);
  return (
    <button
      type="button"
      onClick={() => onOpen({ src, isPdf, title: label })}
      className="group text-left"
    >
      {isPdf ? (
        <div className="h-24 w-full flex flex-col items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 group-active:border-emerald-400 transition-colors">
          <FileText className="w-7 h-7 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-400">PDF</span>
        </div>
      ) : (
        <img
          src={src}
          alt={label}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="h-24 w-full object-cover rounded-lg border border-slate-200 dark:border-slate-600 group-active:border-emerald-400 transition-colors"
        />
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
        {label}
      </p>
    </button>
  );
}

function ComingSoonPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg py-10">
      <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600" />
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {translate("Coming Soon")}
      </p>
    </div>
  );
}

const TABS = [
  { value: "case", label: "Case Details", icon: Info },
  { value: "jenazah", label: "Maklumat Jenazah", icon: User },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "grave", label: "Grave Details", icon: LandPlot },
  { value: "extra1", label: "Coming Soon", icon: Sparkles },
  { value: "extra2", label: "Coming Soon", icon: Sparkles },
];

export default function JenazahCaseDashboardMobile() {
  const { hasAdminAccess, loadingUser } = useAdminAccess();
  const [searchParams] = useSearchParams();
  const referenceno = searchParams.get("referenceno");
  const [previewFile, setPreviewFile] = useState(null);

  const { data: caseItem, isLoading: caseLoading } =
    trpc.jenazahCase.getByReferenceNo.useQuery(
      { referenceno },
      { enabled: !!referenceno && hasAdminAccess },
    );

  const d = caseItem?.details ?? {};
  const icRaw = (d.deceasedIcnumber ?? "").replace(/-/g, "");

  const { data: deadPerson } = trpc.deadperson.getByIcNumber.useQuery(
    { icnumber: icRaw },
    { enabled: !!icRaw && hasAdminAccess },
  );

  const grave = deadPerson?.grave ?? null;

  const supportingKeys = (
    caseItem?.supportingdocphotourl ??
    caseItem?.supportingphotourl ??
    ""
  )
    .split(",")
    .filter(Boolean);

  const documents = [
    caseItem?.deathconfirmationphotourl && {
      key: caseItem.deathconfirmationphotourl,
      bucket: "bucket-death-confirmation",
      label: translate("Death Confirmation"),
    },
    caseItem?.policereportphotourl && {
      key: caseItem.policereportphotourl,
      bucket: "bucket-police-report",
      label: translate("Police Report"),
    },
    ...supportingKeys.map((key, idx) => ({
      key,
      bucket: "supporting-doc-jenazah-case",
      label:
        `${translate("Supporting Documents")} ${supportingKeys.length > 1 ? idx + 1 : ""}`.trim(),
    })),
  ].filter(Boolean);

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!referenceno)
    return <NoDataCardComponent isPage title={translate("Case not found")} />;
  if (caseLoading) return <PageLoadingComponent />;
  if (!caseItem)
    return <NoDataCardComponent isPage title={translate("Case not found")} />;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-2xl mx-auto px-3">
        <BackNavigation title="Funeral Case Details" />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">
              {caseItem.referenceno}
            </p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {d.deceasedFullname || translate("No Name")}
            </h1>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <Tabs defaultValue="case" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto gap-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 rounded-lg shadow-sm">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <tab.icon className="w-4 h-4" />
                <span className="truncate max-w-full">{translate(tab.label)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 1. Case Details */}
          <TabsContent value="case" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4 space-y-3">
                {caseItem.mosque && (
                  <DetailRow label={translate("Mosque")}>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {caseItem.mosque.name}
                    </p>
                    {caseItem.mosque.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {caseItem.mosque.address}
                      </p>
                    )}
                  </DetailRow>
                )}
                <DetailRow label={translate("Application Date")}>
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {caseItem.createdat
                      ? new Date(caseItem.createdat).toLocaleString("ms-MY", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "-"}
                  </p>
                </DetailRow>
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
                <DetailRow
                  label={translate("Bathing & Prayer Management")}
                  value={
                    d.careScenario === "other"
                      ? d.careScenarioOther
                      : CARE_SCENARIOS.find((s) => s.value === d.careScenario)
                          ?.label
                  }
                />
                {d.pickupLat && d.pickupLng && (
                  <DetailRow label={translate("Pickup Location")}>
                    <DirectionButton
                      latitude={d.pickupLat}
                      longitude={d.pickupLng}
                    />
                  </DetailRow>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Jenazah Details & Waris Details */}
          <TabsContent value="jenazah" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4 space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow
                      label={translate("Name")}
                      value={d.deceasedFullname}
                    />
                    <DetailRow
                      label={translate("IC No.")}
                      value={d.deceasedIcnumber}
                    />
                    <DetailRow
                      label={translate("Phone")}
                      value={d.deceasedPhone}
                    />
                    <DetailRow
                      label={translate("Email")}
                      value={d.deceasedEmail}
                    />
                  </div>
                  {d.deceasedAddress && (
                    <DetailRow
                      label={translate("Address")}
                      value={d.deceasedAddress}
                    />
                  )}
                  {d.causeofdeath && (
                    <DetailRow
                      label={translate("Cause of Death")}
                      value={d.causeofdeath}
                    />
                  )}
                  <DetailRow label={translate("Qariah Member Status")}>
                    {d.isQariahMember ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {translate("Registered Qariah Member")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Info className="w-3.5 h-3.5" />
                        {translate("Not a Qariah Member")}
                      </span>
                    )}
                  </DetailRow>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {translate("Maklumat Waris")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow
                      label={translate("Nama Waris")}
                      value={d.heirname}
                    />
                    <DetailRow
                      label={translate("No. Tel. Waris")}
                      value={d.heirphoneno}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Documents */}
          <TabsContent value="documents" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                    {translate("No records")}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {documents.map((doc, idx) => (
                      <DocumentThumb
                        key={`${doc.key}-${idx}`}
                        fileKey={doc.key}
                        bucket={doc.bucket}
                        label={doc.label}
                        onOpen={setPreviewFile}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Grave Details */}
          <TabsContent value="grave" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4 space-y-3">
                {grave ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow label={translate("Name")} value={grave.name} />
                      <DetailRow label={translate("Block")} value={grave.block} />
                      <DetailRow label={translate("Lot")} value={grave.lot} />
                      <DetailRow
                        label={translate("Grave Lot")}
                        value={deadPerson?.gravelot}
                      />
                    </div>
                    {grave.address && (
                      <DetailRow
                        label={translate("Address")}
                        value={grave.address}
                      />
                    )}
                    {grave.state && (
                      <DetailRow label={translate("State")} value={grave.state} />
                    )}
                    {grave.picname && (
                      <DetailRow label={translate("Supervisor (PIC)")}>
                        <p className="text-sm text-slate-800 dark:text-slate-100">
                          {grave.picname}
                        </p>
                        {grave.picphoneno && (
                          <a
                            href={`tel:${grave.picphoneno}`}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            {grave.picphoneno}
                          </a>
                        )}
                      </DetailRow>
                    )}
                    <DetailRow label={translate("Grave Location")}>
                      <DirectionButton
                        latitude={deadPerson?.latitude || grave.latitude}
                        longitude={deadPerson?.longitude || grave.longitude}
                      />
                    </DetailRow>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                    {translate("No grave assigned yet")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5 & 6. Reserved for future use */}
          <TabsContent value="extra1" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4">
                <ComingSoonPanel />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="extra2" className="mt-4">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="py-4 px-4">
                <ComingSoonPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FilePreviewDialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        src={previewFile?.src}
        isPdf={previewFile?.isPdf}
        title={previewFile?.title}
      />
    </div>
  );
}
