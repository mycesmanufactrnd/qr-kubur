import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Eye, Loader2, Target, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import FilterDrawer from '../components/mobile/FilterDrawer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Green marker for graves
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
  "Terengganu", "Wilayah Persekutuan"
];

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export default function MapKubur() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedState, setSelectedState] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [mapCenter, setMapCenter] = useState([4.2105, 101.9758]); // Malaysia center
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: graves = [], isLoading } = useQuery({
    queryKey: ['graves-map'],
    queryFn: () => base44.entities.Grave.list()
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLoadingLocation(false);
          
          // Auto-detect state based on location (simplified)
          detectState(latitude, longitude);
        },
        () => {
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  const detectState = (lat, lng) => {
    // Simplified state detection based on coordinates
    // In production, use reverse geocoding API
    const stateCoords = {
      'Selangor': { lat: 3.0738, lng: 101.5183 },
      'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
      'Johor': { lat: 1.4854, lng: 103.7618 },
      'Penang': { lat: 5.4164, lng: 100.3327 },
    };
    // For now, don't auto-select state
  };

  const filteredGraves = graves.filter(grave => {
    const hasCoords = grave.gps_lat && grave.gps_lng;
    const matchesState = selectedState === 'all' || grave.state === selectedState;
    const matchesSearch = !searchQuery || 
      grave.cemetery_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return hasCoords && matchesState && matchesSearch;
  });

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter([...userLocation]);
    }
  };

  const openDirections = (grave) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${grave.gps_lat},${grave.gps_lng}`, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peta Kubur</h1>
          <p className="text-xs text-gray-500">{filteredGraves.length} lokasi</p>
        </div>
        
        <div className="flex gap-2">
          {userLocation && (
            <Button size="sm" variant="outline" onClick={centerOnUser} className="lg:flex hidden">
              <Target className="w-4 h-4" />
            </Button>
          )}
          <FilterDrawer
            trigger={
              <Button size="sm" variant="outline" className="lg:hidden">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            }
            title="Tapis Peta"
            open={filterOpen}
            onOpenChange={setFilterOpen}
          >
            <div className="space-y-4 px-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Cari</label>
                <Input
                  type="text"
                  placeholder="Nama kubur"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Negeri</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Negeri</SelectItem>
                    {STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userLocation && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    centerOnUser();
                    setFilterOpen(false);
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Lokasi Saya
                </Button>
              )}

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setFilterOpen(false)}
              >
                Terapkan
              </Button>
            </div>
          </FilterDrawer>
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="border-0 shadow-sm hidden lg:block">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari tanah perkuburan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48 h-10">
                <SelectValue placeholder="Pilih Negeri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Negeri</SelectItem>
                {STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-[400px] lg:h-[500px]">
          <MapContainer
            center={mapCenter}
            zoom={7}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={mapCenter} />

            {/* User location marker */}
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Lokasi Anda</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Grave markers */}
            {filteredGraves.map(grave => (
              <Marker
                key={grave.id}
                position={[grave.gps_lat, grave.gps_lng]}
                icon={greenIcon}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-lg text-emerald-700">{grave.cemetery_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{grave.state}</p>
                    {grave.block && <p className="text-sm">Blok: {grave.block}</p>}
                    {grave.total_graves > 0 && (
                      <p className="text-sm">Jumlah Kubur: {grave.total_graves}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link to={createPageUrl('GraveDetails') + `?id=${grave.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Lihat
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => openDirections(grave)}>
                        <Navigation className="w-3 h-3 mr-1" />
                        Arah
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {/* List View */}
      <Card className="border-0 shadow-sm lg:hidden">
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm mb-3">Senarai</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : filteredGraves.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">Tiada kubur</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {filteredGraves.slice(0, 5).map(grave => (
                <Link 
                  key={grave.id} 
                  to={createPageUrl('GraveDetails') + `?id=${grave.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {grave.cemetery_name}
                      </p>
                      <p className="text-xs text-gray-500">{grave.state}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      openDirections(grave);
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}