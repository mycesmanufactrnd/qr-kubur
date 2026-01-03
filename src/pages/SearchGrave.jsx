import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Navigation, ArrowLeft, Share2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess } from '@/components/ToastrNotification.jsx';

const NEARBY_STATES = ["Selangor", "Kuala Lumpur", "Putrajaya", "Negeri Sembilan", "Melaka"];

export default function SearchGrave() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [userLocation, setUserLocation] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { data: graves = [], isLoading } = useQuery({
    queryKey: ['graves-search'],
    queryFn: () => base44.entities.Grave.list()
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      );
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setDisplayedCount(10);
      setIsSearching(false);
    }, 300);
  };

  const gravesWithDistance = graves
    .filter(g => g.gps_lat && g.gps_lng)
    .map(grave => ({
      ...grave,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, grave.gps_lat, grave.gps_lng)
        : null
    }))
    .sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

  const filteredGraves = gravesWithDistance.filter(grave => {
    const matchesSearch = !searchQuery || 
      grave.cemetery_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === 'nearby' || grave.state === selectedState;
    return matchesSearch && matchesState;
  });

  const displayedGraves = filteredGraves.slice(0, displayedCount);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
    if (bottom && displayedCount < filteredGraves.length) {
      setDisplayedCount(prev => prev + 10);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredGraves.length]);

  return (
    <div className="space-y-3 pb-2">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">{translate('searchGrave')}</h1>
      
      {/* Search Controls */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3 space-y-2">
          <Input
            placeholder={translate('graveName')}
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
                <SelectItem value="nearby">{translate('nearby')}</SelectItem>
                {NEARBY_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="h-9 bg-emerald-600 hover:bg-emerald-700">
              <Search className="w-4 h-4 mr-1" />
              {translate('search')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching || isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedGraves.length === 0 ? (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{translate('noGravesFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedGraves.map((grave) => (
            <Card key={grave.id} className="mb-2 border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link to={createPageUrl('GraveDetails') + `?id=${grave.id}`} className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{grave.cemetery_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{grave.state}</p>
                      {grave.distance !== null && (
                        <p className="text-xs text-emerald-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {grave.distance < 1 
                            ? `${Math.round(grave.distance * 1000)}m`
                            : `${grave.distance.toFixed(1)}km`
                          }
                        </p>
                      )}
                    </div>
                  </Link>
                  {grave.gps_lat && grave.gps_lng && (
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Arah
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}${createPageUrl('GraveDetails')}?id=${grave.id}`;
                          if (navigator.share) {
                            navigator.share({ title: grave.cemetery_name, url });
                          } else {
                            navigator.clipboard.writeText(url);
                            showSuccess('Pautan disalin');
                          }
                        }}
                        className="h-7 text-xs w-full dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Kongsi
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {displayedCount < filteredGraves.length && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)} className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                {translate('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}