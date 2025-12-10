import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchGrave() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

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
        },
        (error) => {
          setLocationError('Lokasi tidak dapat diakses');
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
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cari Kubur Berdekatan</h1>
        <p className="text-gray-500">Cari kubur berdasarkan lokasi anda</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari nama kubur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {locationError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">{locationError} - Menunjukkan semua kubur</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-md animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGraves.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Hasil</h3>
            <p className="text-gray-500">Tiada kubur dijumpai untuk carian anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGraves.map((grave) => (
            <Link 
              key={grave.id}
              to={createPageUrl('GraveDetails') + `?id=${grave.id}`}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {grave.cemetery_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {grave.state}
                        </span>
                        {grave.block && <span>Blok: {grave.block}</span>}
                        {grave.lot && <span>Lot: {grave.lot}</span>}
                      </div>
                      {grave.distance !== null && (
                        <div className="flex items-center gap-1 text-sm text-emerald-600">
                          <Navigation className="w-4 h-4" />
                          {grave.distance < 1 
                            ? `${Math.round(grave.distance * 1000)}m dari lokasi anda`
                            : `${grave.distance.toFixed(1)}km dari lokasi anda`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}