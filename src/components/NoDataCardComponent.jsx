// @ts-nocheck
import {
  ArrowLeft,
  Home,
  RefreshCw,
  MapPin,
  WifiOff,
  LocateFixed,
  Loader2,
  Search,
  FileSearch,
  Lightbulb,
  Bird,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";
import { createPageUrl } from "@/utils";

function SceneBackdrop({ warm }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id={`sky-${warm ? "warm" : "cool"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3f6f1" />
          <stop offset="55%" stopColor={warm ? "#fdf1e2" : "#eef9f1"} />
          <stop offset="100%" stopColor={warm ? "#fceee0" : "#eaf7ee"} />
        </linearGradient>
        <radialGradient id={`glow-${warm ? "warm" : "cool"}`} cx="50%" cy="42%" r="42%">
          <stop offset="0%" stopColor={warm ? "#fed7aa" : "#bbf7d0"} stopOpacity="0.6" />
          <stop offset="100%" stopColor={warm ? "#fed7aa" : "#bbf7d0"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="220" fill={`url(#sky-${warm ? "warm" : "cool"})`} />
      <circle cx="160" cy="95" r="90" fill={`url(#glow-${warm ? "warm" : "cool"})`} />

      <g fill="#ffffff" opacity="0.65">
        <ellipse cx="42" cy="38" rx="28" ry="11" />
        <ellipse cx="66" cy="32" rx="20" ry="9" />
      </g>

      <g fill="#a7d8ce" opacity="0.55">
        <rect x="261" y="66" width="9" height="76" rx="2" />
        <circle cx="265.5" cy="60" r="5.5" />
        <path d="M262 60 l3.5 -9 l3.5 9 z" />
        <path d="M226 142 q39.5 -58 79 0 z" />
        <circle cx="240" cy="94" r="4.5" />
        <circle cx="253" cy="88" r="4.5" />
        <circle cx="291" cy="94" r="4.5" />
      </g>

      <path
        d="M0 158 Q60 128 130 153 T260 148 T320 163 V220 H0 Z"
        fill={warm ? "#cfe8dc" : "#bfe3cf"}
        opacity="0.85"
      />
      <path
        d="M0 184 Q80 158 160 181 T320 176 V220 H0 Z"
        fill={warm ? "#a9d6c2" : "#9ccfae"}
      />
    </svg>
  );
}

function GPSIllustration() {
  return (
    <div className="relative w-full max-w-[260px] aspect-[4/3] mx-auto mb-6">
      <SceneBackdrop warm />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-28 h-28">
          <span
            className="absolute inline-flex w-full h-full rounded-full bg-rose-400/20 animate-ping"
            style={{ animationDuration: "2s" }}
          />
          <span
            className="absolute inline-flex w-20 h-20 rounded-full bg-rose-400/25 animate-ping"
            style={{ animationDuration: "2s", animationDelay: "0.3s" }}
          />
          <span className="absolute -top-1 left-3 w-1 h-4 rounded-full bg-rose-400 rotate-[20deg]" />
          <span className="absolute top-2 right-0 w-1 h-4 rounded-full bg-rose-400 -rotate-[25deg]" />
          <span className="absolute bottom-4 left-0 w-1 h-3 rounded-full bg-rose-300 rotate-[10deg]" />
          <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-rose-300/50">
            <MapPin className="w-8 h-8 text-white" strokeWidth={2.2} />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow">
              <WifiOff className="w-3 h-3 text-rose-500" strokeWidth={2.5} />
            </span>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-black/10 blur-[1px]" />
        </div>
      </div>
    </div>
  );
}

function NoDataIllustration() {
  return (
    <div className="relative w-full max-w-[260px] aspect-[4/3] mx-auto mb-6">
      <SceneBackdrop />
      <Bird className="absolute top-9 right-14 w-4 h-4 text-slate-400/70" strokeWidth={2} />
      <Leaf className="absolute bottom-1 left-1 w-9 h-9 text-emerald-400/70 -rotate-[20deg]" strokeWidth={1.5} />
      <Leaf className="absolute bottom-2 right-2 w-8 h-8 text-emerald-500/70 rotate-[110deg] scale-x-[-1]" strokeWidth={1.5} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-24 h-24">
          <span className="absolute top-1 left-2 w-1 h-4 rounded-full bg-sky-300 rotate-[15deg]" />
          <span className="absolute top-4 right-0 w-1 h-3 rounded-full bg-sky-300 -rotate-[20deg]" />
          <span className="absolute bottom-3 left-0 w-1 h-3 rounded-full bg-sky-200 rotate-[10deg]" />
          <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-sky-200/60">
            <FileSearch className="w-8 h-8 text-sky-500" strokeWidth={1.6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NoDataCardComponent({
  title = translate("No Records Found"),
  description = translate("No results match your search"),
  isPage = false,
  isNoGPS = false,
  redirectTo,
  redirectLabel,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [requestingGps, setRequestingGps] = useState(false);
  const { isLocationLoading, requestLocation } = useLocationContext();

  const showGpsLoading = isLocationLoading || requestingGps;

  const onRequestGpsClick = async () => {
    if (!requestLocation || showGpsLoading) return;
    setRequestingGps(true);
    await requestLocation({ forceRefresh: true });
    setRequestingGps(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const gpsTitle = translate("No Location Detected");
  const gpsDescription = translate(
    "Location unavailable. Please make sure GPS and mobile data are turned on, then try again.",
  );

  const displayTitle = isNoGPS ? gpsTitle : title;
  const displayDesc = isNoGPS ? gpsDescription : description;

  return (
    <div
      className={`
        flex flex-col items-center justify-center min-h-[65vh] px-6 py-10 text-center
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {isNoGPS ? <GPSIllustration /> : <NoDataIllustration />}

      <h3
        className="text-xl font-bold tracking-tight mb-2 text-slate-800 dark:text-slate-100"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {displayTitle}
      </h3>
      <p className="text-sm leading-relaxed mb-6 max-w-xs text-slate-500 dark:text-slate-400">
        {displayDesc}
      </p>

      {isNoGPS && (
        <button
          type="button"
          onClick={onRequestGpsClick}
          disabled={showGpsLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm font-medium mb-6 disabled:opacity-80"
        >
          <LocateFixed className="w-4 h-4" />
          {translate("Waiting for GPS signal...")}
          <Loader2 className="w-4 h-4 animate-spin" />
        </button>
      )}

      {isPage && (
        <div className="flex gap-3 w-full max-w-xs mb-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 gap-1.5 rounded-full h-11 text-sm font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {translate("Back")}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1 gap-1.5 rounded-full h-11 text-sm font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Home className="w-4 h-4" />
            {translate("Home")}
          </Button>
        </div>
      )}

      {isPage && !isNoGPS && (
        <>
          {redirectTo ? (
            <Button
              onClick={() => navigate(createPageUrl(redirectTo))}
              className="w-full max-w-xs h-12 rounded-full gap-2 text-sm font-semibold border-0 bg-teal-800 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white"
            >
              <Search className="w-4 h-4" />
              {redirectLabel || translate("Browse")}
            </Button>
          ) : (
            <Button
              onClick={() => window.location.reload()}
              className="w-full max-w-xs h-12 rounded-full gap-2 text-sm font-semibold border-0 bg-teal-800 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white"
            >
              <RefreshCw className="w-4 h-4" />
              {translate("Refresh")}
            </Button>
          )}
        </>
      )}

      {isNoGPS && isPage && (
        <div className="flex items-start gap-3 mt-6 w-full max-w-xs rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-4 py-3 text-left">
          <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            {translate(
              "If location is enabled, allow it in your browser settings and tap Enable GPS again.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
