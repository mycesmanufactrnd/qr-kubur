import { useEffect, useState } from "react";
import { createPageUrl, resolveFileUrl } from "../utils/index";
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle,
  ScanLine,
  RefreshCw,
  MapPin,
  Building2,
  ChevronRight,
} from "lucide-react";
import QrScanner from "react-qr-scanner";
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import { trpc } from "@/utils/trpc";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import { showSuccess } from "@/components/ToastrNotification";
import { ipAddressQueryOptions } from "@/utils/queryOptions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const css = `
  @keyframes scanMove {
    0%   { top: 15%; opacity: 1; }
    48%  { top: 78%; opacity: 1; }
    50%  { top: 78%; opacity: 0; }
    51%  { top: 15%; opacity: 0; }
    53%  { top: 15%; opacity: 1; }
    100% { top: 15%; opacity: 1; }
  }
  .qr-scan-line {
    position: absolute;
    left: 12px; right: 12px; height: 2px;
    background: linear-gradient(90deg, transparent, #34d399, #10b981, #34d399, transparent);
    border-radius: 9999px;
    box-shadow: 0 0 8px 2px rgba(52,211,153,0.6);
    animation: scanMove 2.4s ease-in-out infinite;
  }
  @keyframes cornerPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  .qr-corner { animation: cornerPulse 2.4s ease-in-out infinite; }
  @keyframes floatIcon {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  .float-icon { animation: floatIcon 3s ease-in-out infinite; }
`;

export default function ScanQR() {
  const { data: visitorIp } = trpc.auth.getClientIp.useQuery(undefined, {
    ...ipAddressQueryOptions,
  });

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedGraveId, setScannedGraveId] = useState(null);
  const [scannedDeadPersonId, setScannedDeadPersonId] = useState(null);

  const { data: selectedGrave, isLoading: graveLoading } =
    trpc.grave.getGraveById.useQuery(
      { id: scannedGraveId },
      { enabled: typeof scannedGraveId === "number" },
    );

  const { data: selectedDeadPerson, isLoading: personLoading } =
    trpc.deadperson.getDeadPersonById.useQuery(
      { id: scannedDeadPersonId },
      { enabled: typeof scannedDeadPersonId === "number" },
    );

  const result = selectedGrave
    ? { type: "grave", data: selectedGrave }
    : selectedDeadPerson
      ? { type: "deadperson", data: selectedDeadPerson }
      : null;

  const sourceGrave = scannedGraveId
    ? selectedGrave
    : scannedDeadPersonId
      ? selectedDeadPerson?.grave
      : null;

  const state = sourceGrave?.state ?? null;
  const graveOrganisationId = sourceGrave?.organisation?.id ?? null;

  const {
    data: graveServiceOrganisations = [],
    isLoading: isGraveServiceOrganisationsLoading,
  } = trpc.organisation.getGraveServiceByState.useQuery(
    {
      state,
      graveOrganisationId,
    },
    {
      enabled: !!state && !!graveOrganisationId,
    },
  );

  useEffect(() => {
    if (selectedGrave)
      showSuccess(`${translate("Record Found")}: ${selectedGrave.name}`);
    if (selectedDeadPerson)
      showSuccess(`${translate("Record Found")}: ${selectedDeadPerson.name}`);
  }, [selectedGrave, selectedDeadPerson]);

  const createMutation = trpc.visitLogs.create.useMutation();

  const createVisitLog = async (type, id) => {
    if (!visitorIp) return;
    try {
      await createMutation.mutateAsync({
        grave: type === "grave" ? { id } : null,
        deadperson: type === "deadperson" ? { id } : null,
        visitorip: visitorIp,
      });
    } catch (err) {
      console.error("Failed to log visit", err);
    }
  };

  const handleScan = async (data) => {
    if (data && !loading) {
      setLoading(true);
      setError("");
      setScanning(false);
      const qrCode = data.text || data;
      try {
        const parsed = JSON.parse(qrCode);
        const { type, id } = parsed;
        const numericId = Number(id);
        if (isNaN(numericId) || !type || !id) {
          setError(translate("Invalid QR code"));
          setLoading(false);
          return;
        }
        if (type === "grave") {
          setScannedGraveId(numericId);
          await createVisitLog(type, numericId);
        } else if (type === "deadperson") {
          setScannedDeadPersonId(numericId);
          await createVisitLog(type, numericId);
        } else {
          setError(translate("QR code not found in system."));
        }
      } catch {
        setError(translate("Invalid QR code"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = () => {
    setError(translate("Camera error. Please check camera permissions."));
  };

  const navigateToResult = () => {
    if (result?.type === "grave") {
      window.location.href =
        createPageUrl("GraveDetails") + `?id=${result.data.id}`;
    } else if (result?.type === "deadperson") {
      window.location.href =
        createPageUrl("DeadPersonDetails") + `?id=${result.data.id}`;
    }
  };

  const handleReset = () => {
    setError("");
    setScannedGraveId(null);
    setScannedDeadPersonId(null);
  };

  if (graveLoading || personLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BackNavigation title={translate("Scan QR")} />
        <PageLoadingComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{css}</style>
      <BackNavigation title={translate("Scan QR Code")} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {!result && (
          <div className="rounded-3xl overflow-hidden shadow-lg">
            {scanning ? (
              <div className="relative aspect-square w-full bg-black">
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  constraints={{ video: { facingMode: "environment" } }}
                />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-60 h-60">
                    <div className="absolute -inset-[9999px] bg-black/50" />
                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                    <span className="qr-corner absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
                    <span className="qr-corner absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
                    <span className="qr-corner absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />
                    <span className="qr-corner absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />
                    <div className="qr-scan-line" />
                  </div>
                </div>

                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <div className="px-5 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/20">
                    <p className="text-white text-xs font-medium tracking-wide">
                      {translate("Point camera to QR code")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setScanning(false)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                style={{
                  background:
                    "linear-gradient(160deg, #063d2e 0%, #0a5c42 40%, #0d7a58 70%, #10956a 100%)",
                }}
                className="px-6 pt-10 pb-8 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                <div className="relative w-44 h-44 mb-6 float-icon">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 scale-110" />
                  <span className="qr-corner absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-white/80 rounded-tl-2xl" />
                  <span className="qr-corner absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-white/80 rounded-tr-2xl" />
                  <span className="qr-corner absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-white/80 rounded-bl-2xl" />
                  <span className="qr-corner absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-white/80 rounded-br-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                      <ScanLine className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="qr-scan-line" />
                </div>

                <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {translate("Scan QR Code")}
                </h2>
                <p className="text-sm text-white/60 mb-8 max-w-[240px] leading-relaxed">
                  {translate(
                    "Scan QR code on tombstone or record to view information.",
                  )}
                </p>

                <button
                  onClick={() => setScanning(true)}
                  disabled={loading}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white text-emerald-700 text-sm font-bold shadow-lg shadow-black/20 active:opacity-80 transition-all disabled:opacity-50 mb-4"
                >
                  <Camera className="w-4 h-4" />
                  {translate("Open Camera")}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-100 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600 flex-1">{error}</p>
            <button
              onClick={() => {
                setError("");
                setScanning(true);
              }}
              className="text-xs text-red-400 font-semibold underline underline-offset-2 shrink-0 active:opacity-70"
            >
              {translate("Try again")}
            </button>
          </div>
        )}

        {result && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <p className="text-xs font-semibold text-white uppercase tracking-widest">
                  {translate("Record Found")}
                </p>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {result.data.name}
                  </h3>

                  {result.type === "grave" && result.data.state && (
                    <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {result.data.state}
                    </p>
                  )}
                  {result.type === "grave" && result.data.block && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {translate("Block")} {result.data.block},{" "}
                      {translate("Lot")} {result.data.lot}
                    </p>
                  )}
                  {result.type === "deadperson" && result.data.dateofdeath && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {new Date(result.data.dateofdeath).toLocaleDateString(
                        "ms-MY",
                      )}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={navigateToResult}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-sm shadow-emerald-200 active:opacity-80 transition-all"
                  >
                    {translate("View Details")}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold active:opacity-70 transition-opacity"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {translate("Scan Again")}
                  </button>
                </div>
              </div>
            </div>
            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3 space-y-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {translate("Grave Services")}
                </h2>

                {isGraveServiceOrganisationsLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translate("Loading...")}
                  </p>
                ) : graveServiceOrganisations.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translate(
                      "No grave service organisations available in this state",
                    )}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {graveServiceOrganisations.map((organisation) => (
                      <Link
                        key={organisation.id}
                        to={`${createPageUrl("OrganisationDetails")}?id=${organisation.id}${
                          selectedDeadPerson
                            ? `&deadpersonId=${selectedDeadPerson.id}`
                            : selectedGrave
                              ? `&graveId=${selectedGrave.id}`
                              : ""
                        }`}
                        className="block"
                      >
                        <Card className="border border-gray-100 dark:border-gray-700 shadow-none hover:border-violet-300 dark:hover:border-violet-500 transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                                {organisation.photourl ? (
                                  <img
                                    src={resolveFileUrl(
                                      organisation.photourl,
                                      "bucket-organisation",
                                    )}
                                    alt={organisation.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {organisation.name}
                                  </p>
                                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(organisation.serviceoffered || [])
                                    .slice(0, 2)
                                    .map((serviceName) => (
                                      <Badge
                                        key={`${organisation.id}-${serviceName}`}
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {serviceName}
                                      </Badge>
                                    ))}

                                  {(organisation.serviceoffered || []).length >
                                    2 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      +
                                      {(organisation.serviceoffered || [])
                                        .length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!result && !scanning && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {translate("How to use")}
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                {
                  step: "01",
                  icon: Camera,
                  color: "bg-emerald-50 text-emerald-600",
                  text: translate("Open camera to scan the QR code"),
                },
                {
                  step: "02",
                  icon: ScanLine,
                  color: "bg-blue-50 text-blue-500",
                  text: translate("Aim at the QR code on the grave marker"),
                },
                {
                  step: "03",
                  icon: CheckCircle,
                  color: "bg-violet-50 text-violet-500",
                  text: translate("Grave details will appear automatically"),
                },
              ].map(({ step, icon: Icon, color, text }) => (
                <div key={step} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-600 leading-snug flex-1">
                    {text}
                  </p>
                  <span className="text-xs font-bold text-slate-200">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
