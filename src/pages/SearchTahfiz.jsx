import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { Search, Building2, Navigation, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { STATES_MY } from '@/utils/enums';

export default function SearchTahfiz() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [userLocation, setUserLocation] = useState(null);
  const [userState, setUserState] = useState(null); // <-- user's state
  const [locationDenied, setLocationDenied] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch tahfiz centers with coordinates if userLocation is available
  const { data: tahfizCenters, isLoading } = useGetTahfizCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null
  );

  // Auto-get location on first load
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
console.log('lat', lat, 'lng', lng)
        setUserLocation({ lat, lng });

        // Optional: Reverse geocode to get state
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          // Nominatim returns address.state
          setUserState(data.address?.state || null);
        } catch (err) {
          console.error('Reverse geocode error:', err);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  // Filter centers: search + nearby + same state
  const filteredCenters = (tahfizCenters || []).filter(center => {
    const matchesSearch = !searchQuery || center.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Only show nearby AND same state if selectedState = 'nearby'
    const matchesState =
      selectedState === 'nearby'
        ? userLocation && userState && center.state === userState
        : center.state === selectedState;

    return matchesSearch && matchesState;
  });

  // Sort by distance if nearby is selected
  const sortedCenters =
    selectedState === 'nearby' && userLocation
      ? filteredCenters.sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999))
      : filteredCenters;

  const displayedCenters = sortedCenters.slice(0, displayedCount);

  const openDirections = (center) => {
    if (center.latitude && center.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`,
        '_blank'
      );
    }
  };

  // DEBUG
  console.log('User Location:', userLocation);
  console.log('User State:', userState);
  console.log('Fetched Centers:', tahfizCenters);
  console.log('Displayed Centers:', displayedCenters);

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('searchTahfizTitle') || "Search Tahfiz Center"} />

      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <Input
            placeholder={translate('tahfizName')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 dark:bg-gray-700"
          />

          <div className="flex gap-2">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-9 dark:bg-gray-700">
                <SelectValue placeholder={translate('state')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">{translate('nearby')}</SelectItem>
                {STATES_MY.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            
          </div>
        </CardContent>
      </Card>

      {locationDenied && selectedState === "nearby" && (
        <Card className="border-0 shadow-sm dark:bg-gray-800 p-4 text-center">
          <p className="text-sm text-gray-500">
            {translate('pleaseEnableLocation') || "Please enable your location to view nearby Tahfiz."}
          </p>
        </Card>
      )}

      {isLoading || isSearching ? (
        <div className="space-y-2 text-center p-10">
          <p className="animate-pulse text-gray-500">{translate('loading')}</p>
        </div>
      ) : displayedCenters.length === 0 ? (
        <Card className="border-0 shadow-sm dark:bg-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500">{translate('Loading...')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedCenters.map(center => (
            <Card key={center.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-violet-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{center.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {center.state}
                      </p>

                      {center.distance && (
                        <p className="text-xs text-violet-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {center.distance < 1
                            ? `${Math.round(center.distance * 1000)}m`
                            : `${Number(center.distance).toFixed(1)}km`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => openDirections(center)}
                      className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                    >
                      {translate('direction')}
                    </Button>

                    <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${center.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full dark:bg-gray-700">
                        {translate('request')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}