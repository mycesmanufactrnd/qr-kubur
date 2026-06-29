// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useGetMosqueCoordinates } from "@/hooks/useMosqueMutations";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import { useLocationContext } from "@/providers/LocationProvider";
import ListCardSkeletonComponent from "@/components/ListCardSkeletonComponent";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { Phone, MapPin, Navigation, AlertCircle, User } from "lucide-react";
import { openDirections, showEarthDistance } from "@/utils/helpers";
import { OfflineDownloadBanner } from "@/components/OfflineDownloadBanner";

const OFFLINE_KEY = "qubur-offline-mosques";

const EmergencyMosqueCard = ({ mosque }) => {
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
      </div>
    </div>
  );
};

export default function JenazahEmergency() {
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

  const [savedEntry, setSavedEntry] = useState(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const savedMosques = savedEntry?.mosques ?? [];
  const offlineStatus = savedEntry ? "cached" : "idle";
  const isFallback = !isLoading && mosques.length === 0 && savedMosques.length > 0;
  const displayMosques = mosques.length > 0 ? mosques : savedMosques;

  function saveOffline() {
    try {
      const entry = { mosques, savedAt: new Date().toISOString() };
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(entry));
      setSavedEntry(entry);
    } catch {}
  }

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
  }, [displayedCount, displayMosques.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 space-y-3 pb-2">
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

      {isFallback && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {translate("Showing saved offline data")}
          </p>
        </div>
      )}

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : displayMosques.length === 0 ? (
        <NoDataCardComponent isPage title={translate("No Mosque Found")} />
      ) : (
        <div className="space-y-2">
          {displayMosques.slice(0, displayedCount).map((m) => (
            <EmergencyMosqueCard key={m.id} mosque={m} />
          ))}
          {displayedCount < displayMosques.length && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            </div>
          )}
          {!isLoading && mosques.length > 0 && (
            <OfflineDownloadBanner
              status={offlineStatus}
              onDownload={saveOffline}
              idleLabel={translate("Save mosque list for offline use?")}
            />
          )}
        </div>
      )}
    </div>
  );
}
