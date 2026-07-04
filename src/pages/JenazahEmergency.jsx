// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetMosqueCoordinates } from "@/hooks/useMosqueMutations";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { Phone, MapPin, Navigation, AlertCircle, User } from "lucide-react";
import { openDirections, showEarthDistance } from "@/utils/helpers";
import BackNavigation from "@/components/BackNavigation";

const EmergencyMosqueCard = ({ mosque, onRequest }) => {
  if (!mosque) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 leading-tight truncate">
            {mosque.name}
          </p>
          {mosque.picname && (
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 flex-shrink-0" />
              {mosque.picname}
            </p>
          )}
        </div>
        {mosque.distance && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
            {showEarthDistance(mosque.distance)}
          </span>
        )}
      </div>

      {mosque.address && (
        <p className="text-xs text-gray-500 dark:text-slate-400 flex items-start gap-1 line-clamp-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400 dark:text-slate-500" />
          {mosque.address}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <a
          href={mosque.picphoneno ? `tel:${mosque.picphoneno}` : undefined}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg ${
            mosque.picphoneno
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 pointer-events-none"
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        <button
          onClick={() => openDirections(mosque.latitude, mosque.longitude)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Navigation className="w-3.5 h-3.5" /> Directions
        </button>
        <button
          onClick={() => onRequest(mosque)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <User className="w-3.5 h-3.5" /> Jenazah
        </button>
      </div>
    </div>
  );
};

export default function JenazahEmergency() {
  const navigate = useNavigate();
  const [displayedCount, setDisplayedCount] = useState(10);
  const sentinelRef = useRef(null);
  const { userLocation, userState } = useLocationContext();
  const [filters] = useState({ state: userState, canarrangefuneral: true });

  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    { ...filters, limit: 5 },
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDisplayedCount((prev) => prev + 10);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayedCount, mosques.length]);

  const handleRequest = (mosque) => {
    navigate(createPageUrl("JenazahEmergencyRequest"), { state: { mosque } });
  };

  return (
    <div className="min-h-screen space-y-3 pb-2">
      <BackNavigation
        title={translate("Jenazah Emergency") || "Kecemasan Jenazah"}
      />

      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
        <p className="text-xs text-red-700 dark:text-red-400">
          {translate(
            "Contact the nearest mosque for immediate funeral arrangements.",
          )}
        </p>
      </div>

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : mosques.length === 0 ? (
        <NoDataCardComponent isPage title={translate("No Mosque Found")} />
      ) : (
        <div className="space-y-2">
          {mosques.slice(0, displayedCount).map((m) => (
            <EmergencyMosqueCard key={m.id} mosque={m} onRequest={handleRequest} />
          ))}
          {displayedCount < mosques.length && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
