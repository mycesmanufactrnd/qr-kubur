// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  Search,
  BookOpen,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Calendar,
  Building2,
  Phone,
  Mail,
  Heart,
  HeartPulse,
  IdCard,
  Users,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackNavigation from "@/components/BackNavigation";
import JoinLiveButton from "@/components/jitsi/JoinLiveButton";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { showError } from "@/components/ToastrNotification";
import { skipToken } from "@tanstack/react-query";
import { formatRM } from "@/utils/helpers";
import { resolveFileUrl } from "@/utils";
import {
  TahlilStatus,
  QuotationStatus,
  JenazahCaseStatus,
} from "@/utils/enums";
import { defaultTahlilStatus } from "@/utils/defaultformfields";

const TAHLIL_STATUS = {
  [TahlilStatus.PENDING]: {
    label: "Pending",
    Icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  [TahlilStatus.ACCEPTED]: {
    label: "Accepted",
    Icon: CheckCircle,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  [TahlilStatus.COMPLETED]: {
    label: "Completed",
    Icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
};

const SERVICE_STATUS = {
  [QuotationStatus.PENDING]: {
    label: "Pending",
    Icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  [QuotationStatus.COMPLETED]: {
    label: "Completed",
    Icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  [QuotationStatus.REJECTED]: {
    label: "Rejected",
    Icon: XCircle,
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500 dark:text-red-400",
  },
};

const JENAZAH_STATUS = {
  [JenazahCaseStatus.PENDING]: {
    label: "Pending",
    Icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  [JenazahCaseStatus.ONGOING]: {
    label: "Ongoing",
    Icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  [JenazahCaseStatus.CLOSED]: {
    label: "Closed",
    Icon: CheckCircle,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  [JenazahCaseStatus.REJECTED]: {
    label: "Rejected",
    Icon: XCircle,
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500 dark:text-red-400",
  },
};

function StatusBadge({ status, configMap }) {
  const cfg = configMap?.[status];
  if (!cfg)
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
        {status || "-"}
      </span>
    );
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      {translate(cfg.label)}
    </span>
  );
}

function InfoRow({ Icon, label, value, breakAll }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[55%] ${breakAll ? "break-all" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function StatusCheck() {
  const [activeTab, setActiveTab] = useState("tahlil");

  // Tahlil state
  const [tahlilRef, setTahlilRef] = useState("");
  const [tahlilKey, setTahlilKey] = useState("");
  const [tahlilSearching, setTahlilSearching] = useState(false);
  const [tahlilRequest, setTahlilRequest] = useState(defaultTahlilStatus);
  const [tahfizCenter, setTahfizCenter] = useState(null);
  const [tahlilDialogOpen, setTahlilDialogOpen] = useState(false);
  const autoSearched = useRef(false);

  // Service state
  const [serviceRef, setServiceRef] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [serviceSearching, setServiceSearching] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // Jenazah state
  const [jenazahRef, setJenazahRef] = useState("");
  const [jenazahKey, setJenazahKey] = useState("");
  const [jenazahSearching, setJenazahSearching] = useState(false);
  const [jenazahDialogOpen, setJenazahDialogOpen] = useState(false);

  // Auto-search from URL ?ref= (supports tahlil, jenazah case, and quotation prefixes)
  useEffect(() => {
    if (autoSearched.current) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    autoSearched.current = true;
    if (ref.toUpperCase().startsWith("THL")) {
      setActiveTab("tahlil");
      setTahlilRef(ref);
      setTahlilSearching(true);
      setTahlilKey(ref);
    } else if (ref.toUpperCase().startsWith("JNZ")) {
      setActiveTab("jenazah");
      setJenazahRef(ref);
      setJenazahSearching(true);
      setJenazahKey(ref);
    } else {
      setActiveTab("service");
      setServiceRef(ref);
      setServiceSearching(true);
      setServiceKey(ref);
    }
  }, []);

  const { data: tahlilData, isLoading: tahlilLoading } =
    trpc.tahlilRequest.getByReferenceNo.useQuery(
      tahlilKey ? { referenceno: tahlilKey } : skipToken,
      { enabled: !!tahlilKey },
    );

  useEffect(() => {
    if (!tahlilKey || tahlilLoading) return;
    setTahlilSearching(false);
    if (!tahlilData) {
      showError(translate("Request not found"));
      return;
    }
    setTahlilRequest({
      referenceno: tahlilData.referenceno ?? "",
      status: String(tahlilData.status ?? ""),
      liveurl: tahlilData.liveurl ?? "",
      requestorname: tahlilData.requestorname ?? "",
      createdat: tahlilData.createdat ?? "",
      deceasednames: tahlilData.deceasednames ?? [],
      selectedservices: tahlilData.selectedservices ?? [],
      photourls: tahlilData.photourls ?? [],
      serviceamount: tahlilData.serviceamount ?? null,
      platformfeeamount: tahlilData.platformfeeamount ?? null,
    });
    if (tahlilData.tahfizcenter) setTahfizCenter(tahlilData.tahfizcenter);
    setTahlilDialogOpen(true);
  }, [tahlilData, tahlilLoading, tahlilKey]);

  const handleTahlilSearch = () => {
    if (!tahlilRef.trim()) {
      showError(translate("Please enter Reference ID"));
      return;
    }
    setTahlilSearching(true);
    setTahlilKey(tahlilRef.trim());
  };

  const handleTahlilClose = () => {
    setTahlilDialogOpen(false);
    setTahlilKey("");
    setTahlilRequest(defaultTahlilStatus);
    setTahfizCenter(null);
  };

  const { data: quotation, isLoading: quotationLoading } =
    trpc.quotation.getByReferenceNo.useQuery(
      serviceKey ? { referenceno: serviceKey } : skipToken,
      { enabled: !!serviceKey },
    );

  useEffect(() => {
    if (!serviceKey || quotationLoading) return;
    setServiceSearching(false);
    if (!quotation) {
      showError(translate("Service not found"));
      return;
    }
    setServiceDialogOpen(true);
  }, [quotation, quotationLoading, serviceKey]);

  const handleServiceSearch = () => {
    if (!serviceRef.trim()) {
      showError(translate("Please enter Reference No."));
      return;
    }
    setServiceSearching(true);
    setServiceKey(serviceRef.trim());
  };

  const handleServiceClose = () => {
    setServiceDialogOpen(false);
    setServiceKey("");
  };

  const { data: jenazahCase, isLoading: jenazahLoading } =
    trpc.jenazahCase.getByReferenceNo.useQuery(
      jenazahKey ? { referenceno: jenazahKey } : skipToken,
      { enabled: !!jenazahKey },
    );

  useEffect(() => {
    if (!jenazahKey || jenazahLoading) return;
    setJenazahSearching(false);
    if (!jenazahCase) {
      showError(translate("Case not found"));
      return;
    }
    setJenazahDialogOpen(true);
  }, [jenazahCase, jenazahLoading, jenazahKey]);

  const handleJenazahSearch = () => {
    if (!jenazahRef.trim()) {
      showError(translate("Please enter Reference No."));
      return;
    }
    setJenazahSearching(true);
    setJenazahKey(jenazahRef.trim());
  };

  const handleJenazahClose = () => {
    setJenazahDialogOpen(false);
    setJenazahKey("");
  };

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title={translate("Status Check")} />

      <div className="max-w-2xl mx-auto px-3 space-y-4">
        <div className="flex gap-2 p-1 pb-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab("tahlil")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "tahlil"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {translate("Tahlil")}
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "service"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            {translate("Service")}
          </button>
          <button
            onClick={() => setActiveTab("jenazah")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "jenazah"
                ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            {translate("Jenazah")}
          </button>
        </div>

        {activeTab === "tahlil" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {translate("Check Tahlil Application Status")}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">
                {translate(
                  "Enter reference number to check your application status.",
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
              <div className="px-4 py-3 -mx-4 -mt-4 mb-0 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {translate("Application Search")}
                </p>
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {translate("Transaction Reference No.")}
                </label>
                <Input
                  placeholder={`${translate("Example")}: THL-2024-0001`}
                  value={tahlilRef}
                  onChange={(e) => setTahlilRef(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTahlilSearch()}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
                />
              </div>
              <Button
                onClick={handleTahlilSearch}
                disabled={tahlilSearching}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {tahlilSearching
                  ? translate("Searching...")
                  : translate("Search Status")}
              </Button>
            </div>

            <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                <span className="font-bold">{translate("Tip")}:</span>{" "}
                {translate(
                  "Your reference number can be found in the payment receipt sent to your email.",
                )}
              </p>
            </div>
          </>
        )}

        {activeTab === "service" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {translate("Check Service Status")}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">
                {translate(
                  "Enter reference number to check your service status.",
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
              <div className="px-4 py-3 -mx-4 -mt-4 mb-0 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  {translate("Service Search")}
                </p>
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {translate("Transaction Reference No.")}
                </label>
                <Input
                  placeholder={`${translate("Example")}: QUO-2024-0001`}
                  value={serviceRef}
                  onChange={(e) => setServiceRef(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleServiceSearch()}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                />
              </div>
              <Button
                onClick={handleServiceSearch}
                disabled={serviceSearching}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-semibold gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {serviceSearching
                  ? translate("Searching...")
                  : translate("Search Status")}
              </Button>
            </div>

            <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                <span className="font-bold">{translate("Tip")}:</span>{" "}
                {translate(
                  "Your reference number can be found in the payment receipt sent to your email.",
                )}
              </p>
            </div>
          </>
        )}

        {activeTab === "jenazah" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {translate("Check Funeral Case Status")}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">
                {translate(
                  "Enter reference number to check your funeral case status.",
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
              <div className="px-4 py-3 -mx-4 -mt-4 mb-0 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  {translate("Case Search")}
                </p>
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {translate("Transaction Reference No.")}
                </label>
                <Input
                  placeholder={`${translate("Example")}: JNZ-2024-0001`}
                  value={jenazahRef}
                  onChange={(e) => setJenazahRef(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJenazahSearch()}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                />
              </div>
              <Button
                onClick={handleJenazahSearch}
                disabled={jenazahSearching}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-sm font-semibold gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {jenazahSearching
                  ? translate("Searching...")
                  : translate("Search Status")}
              </Button>
            </div>

            <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                <span className="font-bold">{translate("Tip")}:</span>{" "}
                {translate(
                  "Your reference number can be found in the confirmation message sent after submitting the case.",
                )}
              </p>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={tahlilDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleTahlilClose();
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {translate("Application Status")}
            </DialogTitle>
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-lg font-bold tracking-widest font-mono text-slate-800 dark:text-slate-200">
                {tahlilRequest.referenceno}
              </span>
              <StatusBadge
                status={tahlilRequest.status}
                configMap={TAHLIL_STATUS}
              />
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">
            {tahlilRequest.liveurl && (
              <div className="flex justify-center">
                <JoinLiveButton room={tahlilRequest.liveurl} />
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              <InfoRow
                Icon={User}
                label={translate("Requester")}
                value={tahlilRequest.requestorname}
              />
              {tahfizCenter && (
                <InfoRow
                  Icon={MapPin}
                  label={translate("Tahfiz Center")}
                  value={tahfizCenter.name}
                />
              )}
              {tahlilRequest.createdat && (
                <InfoRow
                  Icon={Calendar}
                  label={translate("Date")}
                  value={new Date(tahlilRequest.createdat).toLocaleDateString(
                    "ms-MY",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                />
              )}
            </div>

            {tahlilRequest.deceasednames?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                  {translate("Deceased Name")}
                </p>
                <div className="space-y-1.5">
                  {tahlilRequest.deceasednames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {i + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tahlilRequest.selectedservices?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                  {translate("Services")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tahlilRequest.selectedservices.map((type, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tahlilRequest.serviceamount != null && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                  {translate("Amount")}
                </p>
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {translate("Service Amount")}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatRM(tahlilRequest.serviceamount)}
                  </span>
                </div>
                {tahlilRequest.platformfeeamount != null && (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {translate("Total Paid")}
                    </span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {formatRM(
                        Number(tahlilRequest.serviceamount) +
                          Number(tahlilRequest.platformfeeamount),
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {tahlilRequest.photourls?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                  {translate("Tahlil Photos")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {tahlilRequest.photourls.map((url, idx) => (
                    <img
                      key={`${url}-${idx}`}
                      src={resolveFileUrl(url, "bucket-tahlil-request")}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      alt={`Tahlil ${idx + 1}`}
                      className="h-24 w-full rounded-lg object-cover border border-slate-100 dark:border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleTahlilClose}
              variant="outline"
              className="w-full h-11 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              {translate("Close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={serviceDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleServiceClose();
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {translate("Service Application Status")}
            </DialogTitle>
            {quotation && (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-lg font-bold tracking-widest font-mono text-slate-800 dark:text-slate-200">
                  {quotation.referenceno}
                </span>
                <StatusBadge
                  status={quotation.status}
                  configMap={SERVICE_STATUS}
                />
              </div>
            )}
          </div>

          {quotation && (
            <div className="px-5 py-4 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                <InfoRow
                  Icon={User}
                  label={translate("Requester")}
                  value={quotation.payername}
                />
                <InfoRow
                  Icon={Mail}
                  label={translate("Email")}
                  value={quotation.payeremail}
                  breakAll
                />
                <InfoRow
                  Icon={Phone}
                  label={translate("Phone No")}
                  value={quotation.payerphone}
                />
                <InfoRow
                  Icon={Building2}
                  label={translate("Organisation")}
                  value={quotation.organisation?.name}
                />
                <InfoRow
                  Icon={Heart}
                  label={translate("Deceased")}
                  value={quotation.deadperson?.name}
                />
                {quotation.createdat && (
                  <InfoRow
                    Icon={Calendar}
                    label={translate("Date")}
                    value={new Date(quotation.createdat).toLocaleDateString(
                      "ms-MY",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  />
                )}
              </div>

              {quotation.selectedservices?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate("Services")}
                  </p>
                  <div className="space-y-1.5">
                    {quotation.selectedservices.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {s.service}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatRM(s.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {quotation.totalamount != null && (
                    <>
                      <div className="flex items-center justify-between px-3 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl">
                        <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">
                          {translate("Maintenance Fee")}
                        </span>
                        <span className="text-sm font-bold text-sky-700 dark:text-sky-400">
                          {formatRM(quotation.maintenancefeeamount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl">
                        <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">
                          {translate("Total Amount")}
                        </span>
                        <span className="text-sm font-bold text-sky-700 dark:text-sky-400">
                          {formatRM(quotation.totalamount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {quotation.photourl && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate("Service Photos")}
                  </p>
                  <img
                    src={resolveFileUrl(
                      quotation.photourl,
                      "bucket-organisation-services-proof",
                    )}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    alt="Service completion"
                    className="h-48 w-full rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                  />
                </div>
              )}

              <Button
                onClick={handleServiceClose}
                variant="outline"
                className="w-full h-11 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                {translate("Close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={jenazahDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleJenazahClose();
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 text-center">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {translate("Funeral Case Status")}
            </DialogTitle>
            {jenazahCase && (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-lg font-bold tracking-widest font-mono text-slate-800 dark:text-slate-200">
                  {jenazahCase.referenceno}
                </span>
                <StatusBadge
                  status={jenazahCase.status}
                  configMap={JENAZAH_STATUS}
                />
              </div>
            )}
          </div>

          {jenazahCase && (
            <div className="px-5 py-4 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                <InfoRow
                  Icon={Building2}
                  label={translate("Mosque")}
                  value={jenazahCase.mosque?.name}
                />
                <InfoRow
                  Icon={MapPin}
                  label={translate("Address")}
                  value={jenazahCase.mosque?.address}
                />
                <InfoRow
                  Icon={User}
                  label={translate("Deceased Name")}
                  value={jenazahCase.details?.deceasedFullname}
                />
                <InfoRow
                  Icon={IdCard}
                  label={translate("IC No.")}
                  value={jenazahCase.details?.deceasedIcnumber}
                />
                <InfoRow
                  Icon={Users}
                  label={translate("Nama Waris")}
                  value={jenazahCase.details?.heirname}
                />
                <InfoRow
                  Icon={Phone}
                  label={translate("No. Tel. Waris")}
                  value={jenazahCase.details?.heirphoneno}
                />
                {jenazahCase.details?.burialDate && (
                  <InfoRow
                    Icon={Calendar}
                    label={translate("Burial Date")}
                    value={new Date(
                      jenazahCase.details.burialDate,
                    ).toLocaleDateString("ms-MY", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                )}
                {jenazahCase.createdat && (
                  <InfoRow
                    Icon={Calendar}
                    label={translate("Date")}
                    value={new Date(jenazahCase.createdat).toLocaleDateString(
                      "ms-MY",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  />
                )}
              </div>

              {jenazahCase.adminremarks && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-1">
                    {translate("Notes")} Admin
                  </p>
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {jenazahCase.adminremarks}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleJenazahClose}
                variant="outline"
                className="w-full h-11 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                {translate("Close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
