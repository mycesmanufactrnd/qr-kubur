import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Navigation, ArrowLeft, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NEARBY_STATES = ["Selangor", "Kuala Lumpur", "Putrajaya", "Negeri Sembilan", "Melaka"];

export default function SearchTahfiz() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('nearby');
  const [userLocation, setUserLocation] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { data: tahfizCenters = [], isLoading } = useQuery({
    queryKey: ['tahfiz-search'],
    queryFn: () => base44.entities.TahfizCenter.list()
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

  const centersWithDistance = tahfizCenters
    .filter(c => c.gps_lat && c.gps_lng)
    .map(center => ({
      ...center,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, center.gps_lat, center.gps_lng)
        : null
    }))
    .sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

  const filteredCenters = centersWithDistance.filter(center => {
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === 'nearby' || center.state === selectedState;
    return matchesSearch && matchesState;
  });

  const displayedCenters = filteredCenters.slice(0, displayedCount);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
    if (bottom && displayedCount < filteredCenters.length) {
      setDisplayedCount(prev => prev + 10);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredCenters.length]);

  const openDirections = (center) => {
    if (center.gps_lat && center.gps_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.gps_lat},${center.gps_lng}`, '_blank');
    }
  };

  return (
    <div className="space-y-3 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Cari Pusat Tahfiz</h1>
      </div>

      {/* Search Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <Input
            placeholder="Nama pusat tahfiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
          <div className="flex gap-2">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Negeri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">Berdekatan</SelectItem>
                {NEARBY_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="h-9 bg-violet-600 hover:bg-violet-700">
              <Search className="w-4 h-4 mr-1" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching || isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedCenters.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-gray-500">Tiada pusat tahfiz dijumpai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedCenters.map((center) => (
            <Card key={center.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{center.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {center.state}
                      </p>
                      {center.distance !== null && (
                        <p className="text-xs text-violet-600 mt-1">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {center.distance < 1 
                            ? `${Math.round(center.distance * 1000)}m`
                            : `${center.distance.toFixed(1)}km`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {center.gps_lat && center.gps_lng && (
                      <Button 
                        size="sm" 
                        onClick={() => openDirections(center)}
                        className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Arah
                      </Button>
                    )}
                    <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${center.id}`}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs w-full"
                      >
                        Mohon
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {displayedCount < filteredCenters.length && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayedCount(prev => prev + 10)}>
                Muat Lagi
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}