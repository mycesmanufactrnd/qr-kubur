import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { Search, MapPin, Navigation, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess } from '@/components/ToastrNotification.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { STATES_MY } from '@/utils/enums';
import { useSearchGraves } from '@/hooks/useGraveMutations';

export default function SearchGrave() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [userLocation, setUserLocation] = useState(null);
  const [userState, setUserState] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);

  // Smooth initial animation (same as SearchTahfiz)
  const [isSearching, setIsSearching] = useState(true);

  // Fetch user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setIsSearching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('User location:', location);
        setUserLocation(location);

        // Reverse geocoding to get state
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
          );
          const data = await response.json();
          const state = data.address.state || null;
          console.log('User state:', state);
          setUserState(state);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }

        setTimeout(() => setIsSearching(false), 300);
      },
      (err) => {
        console.error('Error getting location:', err);
        setLocationDenied(true);
        setIsSearching(false);
      }
    );
  }, []);

  // Fetch graves
  const { gravesList, isLoading, refetch } = useSearchGraves({
    search: searchQuery,
    filterState: selectedState === 'nearby' ? userState : selectedState,
    coordinates: userLocation,
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = () => {
    setIsSearching(true);
    setDisplayedCount(10);

    setTimeout(() => {
      refetch();
      setIsSearching(false);
    }, 300);
  };

  const processedGraves = gravesList
    .map(grave => ({
      ...grave,
      distance:
        userLocation && grave.latitude && grave.longitude
          ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              grave.latitude,
              grave.longitude
            )
          : null
    }))
    .sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

  const displayedGraves = processedGraves.slice(0, displayedCount);

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title="Search Graves" />

      {/* Search Input */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <Input
            placeholder={translate('Grave')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />

          <div className="flex gap-2">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder={translate('state')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700">
                <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                {STATES_MY.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location Denied */}
      {locationDenied && selectedState === "nearby" && (
        <Card className="border-0 shadow-sm dark:bg-gray-800 p-4 text-center">
          <p className="text-sm text-gray-500">
            Sila benarkan lokasi untuk melihat kubur berdekatan.
          </p>
        </Card>
      )}

      {/* Loading */}
      {isLoading || isSearching ? (
        <div className="space-y-2 text-center p-10">
          <p className="animate-pulse text-gray-500">{translate('loading')}</p>
        </div>
      ) : displayedGraves.length === 0 ? (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {translate('noGravesFound')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedGraves.map(grave => (
            <Card
              key={grave.id}
              className="mb-2 border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={createPageUrl('GraveDetails') + `?id=${grave.id}`}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {grave.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {grave.state}
                      </p>

                      {grave.distance !== null && (
                        <p className="text-xs text-emerald-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {grave.distance < 1
                            ? `${Math.round(grave.distance * 1000)}m`
                            : `${grave.distance.toFixed(1)}km`}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col gap-1">
                    {grave.latitude && grave.longitude && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${grave.latitude},${grave.longitude}`,
                            '_blank'
                          );
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Navigation className="w-3 h-3 mr-1" /> Arah
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}${createPageUrl('GraveDetails')}?id=${grave.id}`;
                        if (navigator.share) {
                          navigator.share({ title: grave.name, url });
                        } else {
                          navigator.clipboard.writeText(url);
                          showSuccess('Pautan disalin');
                        }
                      }}
                      className="h-7 text-xs w-full dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Kongsi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {displayedCount < processedGraves.length && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
