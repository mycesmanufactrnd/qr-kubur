// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  Home,
  RefreshCw,
  MapPin,
  WifiOff,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";

function GPSPulse() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
      <span
        className="absolute inline-flex w-full h-full rounded-full bg-orange-400 opacity-20 animate-ping"
        style={{ animationDuration: "1.8s" }}
      />
      <span
        className="absolute inline-flex w-20 h-20 rounded-full bg-orange-400 opacity-25 animate-ping"
        style={{ animationDuration: "1.8s", animationDelay: "0.4s" }}
      />
      <span
        className="absolute inline-flex w-12 h-12 rounded-full bg-orange-400 opacity-30 animate-ping"
        style={{ animationDuration: "1.8s", animationDelay: "0.8s" }}
      />
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500">
        <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
        <WifiOff
          className="absolute w-5 h-5 text-white/80"
          strokeWidth={2}
          style={{ bottom: 4, right: 4 }}
        />
      </div>
    </div>
  );
}

function NoDataIllustration() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 shadow-inner">
        <AlertCircle
          className="w-8 h-8 text-slate-400 dark:text-slate-500"
          strokeWidth={1.5}
        />
      </div>
      <span className="absolute top-1 right-3 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600" />
      <span className="absolute bottom-3 left-2 w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600" />
      <span className="absolute top-3 left-5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
    </div>
  );
}

export default function NoDataCardComponent({
  title = translate("No Records Found"),
  description = translate("No results match your search"),
  isPage = false,
  isNoGPS = false,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [requestingGps, setRequestingGps] = useState(false);
  const { userLocation, locationDenied, isLocationLoading, requestLocation } =
    useLocationContext();

  const isGpsConnected = !!(userLocation?.lat && userLocation?.lng);
  const showGpsLoading = isLocationLoading || requestingGps;

  const onRequestGpsClick = async () => {
    if (!requestLocation) return;
    setRequestingGps(true);
    await requestLocation({ forceRefresh: true });
    setRequestingGps(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const gpsTitle = translate("No Data Found");
  const gpsDescription = translate(
    "Location unavailable. Enable GPS and try again",
  );

  const displayTitle = isNoGPS ? gpsTitle : title;
  const displayDesc = isNoGPS ? gpsDescription : description;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card
        className={`
          w-full max-w-sm mx-auto overflow-hidden border-0
          transition-all duration-500
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          ${
            isNoGPS
              ? "bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20"
              : "bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-800"
          }
        `}
        style={{ borderRadius: "1.25rem" }}
      >
        <CardContent className="px-7 pt-8 pb-7 text-center">
          {isNoGPS ? <GPSPulse /> : <NoDataIllustration />}

          <h3
            className={`text-base font-semibold tracking-tight mb-2 ${
              isNoGPS
                ? "text-orange-700 dark:text-orange-400"
                : "text-slate-700 dark:text-slate-200"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {displayTitle}
          </h3>
          <p
            className={`text-sm leading-relaxed mb-0 ${
              isNoGPS
                ? "text-orange-500/80 dark:text-orange-400/70"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {displayDesc}
          </p>

          {isNoGPS && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Menunggu isyarat GPS…
              </span>
            </div>
          )}

          {isPage && (
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className={`gap-1.5 rounded-xl text-xs font-medium border ${
                  isNoGPS
                    ? "border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {translate("Back")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className={`gap-1.5 rounded-xl text-xs font-medium border ${
                  isNoGPS
                    ? "border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                {translate("Home")}
              </Button>
              {isNoGPS ? (
                <Button
                  size="sm"
                  onClick={onRequestGpsClick}
                  disabled={showGpsLoading}
                  className="gap-1.5 rounded-xl text-xs font-medium border-0 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white disabled:opacity-60"
                >
                  {showGpsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                  {showGpsLoading
                    ? translate("Requesting GPS...")
                    : isGpsConnected
                      ? translate("Refresh GPS")
                      : translate("Enable GPS")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="gap-1.5 rounded-xl text-xs font-medium border-0 bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {translate("Refresh")}
                </Button>
              )}
            </div>
          )}
          {isNoGPS && isPage && (locationDenied) && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-2.5 mt-3">
              {translate("If location is blocked, allow it in your browser site settings and tap Enable GPS again.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
