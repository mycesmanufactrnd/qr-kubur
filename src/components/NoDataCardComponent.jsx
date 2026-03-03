import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home, RefreshCw, MapPin, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function GPSPulse() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
      <span className="absolute inline-flex w-full h-full rounded-full bg-orange-400 opacity-20 animate-ping" style={{ animationDuration: "1.8s" }} />
      <span className="absolute inline-flex w-20 h-20 rounded-full bg-orange-400 opacity-25 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.4s" }} />
      <span className="absolute inline-flex w-12 h-12 rounded-full bg-orange-400 opacity-30 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.8s" }} />
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-300/40">
        <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
        <WifiOff className="absolute w-5 h-5 text-white/80" strokeWidth={2} style={{ bottom: 4, right: 4 }} />
      </div>
    </div>
  );
}

function NoDataIllustration() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-inner">
        <AlertCircle className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
      </div>
      <span className="absolute top-1 right-3 w-2.5 h-2.5 rounded-full bg-slate-200" />
      <span className="absolute bottom-3 left-2 w-1.5 h-1.5 rounded-full bg-slate-200" />
      <span className="absolute top-3 left-5 w-1 h-1 rounded-full bg-slate-300" />
    </div>
  );
}

export default function NoDataCardComponent({
  title = "Tiada rekod ditemui",
  description = "Tiada data yang sepadan dengan carian anda.",
  isPage = false,
  isNoGPS = false,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const gpsTitle = "Lokasi Tidak Dapat Dikesan";
  const gpsDescription =
    "GPS anda tidak aktif atau isyarat terlalu lemah. Sila hidupkan perkhidmatan lokasi dan cuba semula.";

  const displayTitle = isNoGPS ? gpsTitle : title;
  const displayDesc = isNoGPS ? gpsDescription : description;

  const containerClasses = isPage
    ? "flex flex-col items-center justify-center min-h-[60vh] p-4"
    : "";

  return (
    <div className={containerClasses}>
      <Card
        className={`
          w-full max-w-sm mx-auto overflow-hidden border-0 shadow-xl
          transition-all duration-500
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          ${
            isNoGPS
              ? "bg-gradient-to-b from-amber-50 to-orange-50 shadow-orange-100"
              : "bg-gradient-to-b from-white to-slate-50 shadow-slate-200"
          }
        `}
        style={{
          borderRadius: "1.25rem",
        }}
      >
        {/* Top accent stripe */}
        <div
          className={`h-1 w-full ${
            isNoGPS
              ? "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
              : "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300"
          }`}
        />

        <CardContent className="px-7 pt-8 pb-7 text-center">
          {/* Illustration */}
          {isNoGPS ? <GPSPulse /> : <NoDataIllustration />}

          {/* Text */}
          <h3
            className={`text-base font-semibold tracking-tight mb-2 ${
              isNoGPS ? "text-orange-700" : "text-slate-700"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {displayTitle}
          </h3>
          <p
            className={`text-sm leading-relaxed mb-0 ${
              isNoGPS ? "text-orange-500/80" : "text-slate-400"
            }`}
          >
            {displayDesc}
          </p>

          {/* GPS hint badge */}
          {isNoGPS && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs font-medium text-orange-600">
                Menunggu isyarat GPS…
              </span>
            </div>
          )}

          {/* Page action buttons */}
          {isPage && (
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className={`gap-1.5 rounded-xl text-xs font-medium border ${
                  isNoGPS
                    ? "border-orange-200 text-orange-600 hover:bg-orange-100"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className={`gap-1.5 rounded-xl text-xs font-medium border ${
                  isNoGPS
                    ? "border-orange-200 text-orange-600 hover:bg-orange-100"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Utama
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className={`gap-1.5 rounded-xl text-xs font-medium shadow-sm ${
                  isNoGPS
                    ? "bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white border-0"
                    : "bg-slate-800 hover:bg-slate-700 text-white border-0"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}