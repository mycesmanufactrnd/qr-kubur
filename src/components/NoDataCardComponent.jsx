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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";
import { createPageUrl } from "@/utils";

function GPSIllustration() {
  return (
    <div className="relative w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-6">
      <MapPin className="w-8 h-8 text-rose-500" strokeWidth={2} />
      <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow">
        <WifiOff className="w-3 h-3 text-rose-500" strokeWidth={2.5} />
      </span>
    </div>
  );
}

function NoDataIllustration() {
  return (
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
      <FileSearch className="w-8 h-8 text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
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
