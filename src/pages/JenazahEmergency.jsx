import { useState } from 'react';
import { useGetMosqueCoordinates } from '@/hooks/useMosqueMutations';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { useLocationContext } from '@/providers/LocationProvider';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import FoundDataLength from '@/components/FoundDataLength';
import { Phone, MapPin, Navigation, Clock, AlertCircle, User } from 'lucide-react';
import { openDirections, showEarthDistance } from '@/utils/helpers';

const EmergencyMosqueCard = ({ mosque }) => {
  if (!mosque) return null;

  const handleCall = (e) => {
    e.preventDefault();
    if (mosque.picphoneno) window.location.href = `tel:${mosque.picphoneno}`;
  };

  return (
    <Card className="overflow-hidden border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-white/90 uppercase tracking-wide">
            <AlertCircle className="w-5 h-5" />
            Emergency Service
          </div>
          <h3 className="text-lg font-bold text-white line-clamp-2">{mosque.name}</h3>
        </div>
        {mosque.distance && (
          <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-white">
            <div className="text-xs text-white/80 font-medium">Distance</div>
            <div className="text-sm font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {showEarthDistance(mosque.distance)}
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {mosque.address && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{mosque.address}</span>
          </div>
        )}

        {mosque.state && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            {mosque.state}
          </div>
        )}

        {mosque.picname && (
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 px-3 py-2 rounded-lg border border-red-100">
            <User className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 font-medium">Contact Person</div>
              <div className="font-semibold">{mosque.picname}</div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-red-200 grid grid-cols-2 gap-2">
          <Button
            onClick={handleCall}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md font-semibold"
          >
            <Phone className="w-4 h-4 mr-2" /> Call Now
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openDirections(mosque.latitude, mosque.longitude);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md font-semibold"
          >
            <Navigation className="w-4 h-4 mr-2" /> Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function JenazahEmergency() {
  const [displayedCount, setDisplayedCount] = useState(10);
  const { userLocation, userState } = useLocationContext();
  const [filters, setFilters] = useState({ state: userState, canarrangefuneral: true });

  const { data: mosques = [], isLoading } = useGetMosqueCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null,
    { ...filters, limit: 5 }
  );

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Jenazah Emergency') || "Kecemasan Jenazah"} />

      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900 text-sm">Emergency Jenazah Services</h3>
          <p className="text-xs text-red-700 mt-1">
            Contact the nearest mosque for immediate funeral arrangements
          </p>
        </div>
      </div>

      {!isLoading && <FoundDataLength dataList={mosques} data="Emergency Service(s)" />}

      {isLoading ? (
        <ListCardSkeletonComponent />
      ) : mosques.length === 0 ? (
        <NoDataCardComponent isPage title={translate('No Mosque Found')} />
      ) : (
        <div className="space-y-4 px-1">
          {mosques.slice(0, displayedCount).map(m => (
            <EmergencyMosqueCard key={m.id} mosque={m} />
          ))}
          {displayedCount < mosques.length && (
            <div className="text-center py-4">
              <Button variant="ghost" onClick={() => setDisplayedCount(prev => prev + 10)}>
                {translate('Load More')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
