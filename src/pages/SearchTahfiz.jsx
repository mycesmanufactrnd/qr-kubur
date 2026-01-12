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
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  // 2. Use the tRPC hook. It automatically fetches when userLocation is set.
  const { tahfizCenters, isLoading } = useGetTahfizCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  // 3. Logic is simplified because the backend/hook now handles distance sorting
  const filteredCenters = (tahfizCenters || []).filter(center => {
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = selectedState === 'nearby' 
      ? true // Assuming 'getTahfiz' returns closest regardless of state, or handles nearby logic
      : center.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const displayedCenters = filteredCenters.slice(0, displayedCount);

  const openDirections = (center) => {
    if (center.gps_lat && center.gps_lng) {
      // Fixed the string interpolation for the Google Maps URL
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.gps_lat},${center.gps_lng}`, '_blank');
    }
  };

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('searchTahfizTitle') || "Search Tahfiz Center"}/>
      
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
                {/* 4. Tip: Map through STATES_MY instead of hardcoding for productivity */}
                {STATES_MY.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="h-9 bg-violet-600">
              <Search className="w-4 h-4 mr-1" />
              {translate('search')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {isLoading || isSearching ? (
         <div className="space-y-2 text-center p-10">
            <p className="animate-pulse">{translate('loading')}</p>
         </div>
      ) : displayedCenters.length === 0 ? (
        <Card className="border-0 shadow-sm dark:bg-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500">{translate('noTahfizFound')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedCenters.map((center) => (
            <Card key={center.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{center.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {center.state}
                      </p>
                      {/* Distance is already calculated by tRPC query */}
                      {center.distance && (
                        <p className="text-xs text-violet-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {center.distance < 1 
                            ? `${Math.round(center.distance * 1000)}m`
                            : `${center.distance.toFixed(1)}km`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={() => openDirections(center)} className="h-7 text-xs bg-violet-600">
                      {translate('direction')}
                    </Button>
                    <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${center.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full">
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