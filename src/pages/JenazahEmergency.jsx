import { useState } from 'react';
import { useGetMosqueCoordinates } from '@/hooks/useMosqueMutations';
import { Button } from "@/components/ui/button";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { useLocationContext } from '@/providers/LocationProvider';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { Phone, MapPin, Navigation, AlertCircle, User } from 'lucide-react';
import { openDirections, showEarthDistance } from '@/utils/helpers';

const EmergencyMosqueCard = ({ mosque }) => {
  if (!mosque) return null;

  return (
    <div className="bg-white border border-red-100 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{mosque.name}</p>
          {mosque.picname && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 flex-shrink-0" />
              {mosque.picname}
            </p>
          )}
        </div>
        {mosque.distance && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
            {showEarthDistance(mosque.distance)}
          </span>
        )}
      </div>

      {mosque.address && (
        <p className="text-xs text-gray-500 flex items-start gap-1 line-clamp-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
          {mosque.address}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <a
          href={mosque.picphoneno ? `tel:${mosque.picphoneno}` : undefined}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg ${
            mosque.picphoneno
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-100 text-gray-400 pointer-events-none'
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
  const { userLocation, userState } = useLocationContext();
  const [filters] = useState({ state: userState, canarrangefuneral: true });

  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    { ...filters, limit: 5 }
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Jenazah Emergency') || "Kecemasan Jenazah"} />

      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <p className="text-xs text-red-700">Contact the nearest mosque for immediate funeral arrangements.</p>
      </div>

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : mosques.length === 0 ? (
        <NoDataCardComponent isPage title={translate('No Mosque Found')} />
      ) : (
        <div className="space-y-2">
          {mosques.slice(0, displayedCount).map(m => (
            <EmergencyMosqueCard key={m.id} mosque={m} />
          ))}
          {displayedCount < mosques.length && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                {translate('Load More')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
