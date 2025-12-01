import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Building2, Navigation, Heart, BookOpen, Loader2, Target, Search, Filter, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Blue marker for tahfiz centers
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

const SERVICE_LABELS = {
  'tahlil_ringkas': 'Tahlil Ringkas',
  'tahlil_panjang': 'Tahlil Panjang',
  'yasin': 'Bacaan Yasin',
  'doa_arwah': 'Doa Arwah',
  'custom': 'Perkhidmatan Khas'
};

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

export default function MapTahfiz() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedState, setSelectedState] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [mapCenter, setMapCenter] = useState([4.2105, 101.9758]); // Malaysia center

  const { data: tahfizCenters = [], isLoading } = useQuery({
    queryKey: ['tahfiz-map'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLoadingLocation(false);
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

  const filteredCenters = tahfizCenters.filter(center => {
    const hasCoords = center.gps_lat && center.gps_lng;
    const matchesState = selectedState === 'all' || center.state === selectedState;
    const matchesSearch = !searchQuery || 
      center.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return hasCoords && matchesState && matchesSearch;
  });

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter([...userLocation]);
    }
  };

  const openDirections = (center) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.gps_lat},${center.gps_lng}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Peta Pusat Tahfiz
          </h1>
          <p className="text-gray-500 mt-1">Cari pusat tahfiz untuk perkhidmatan tahlil dan bacaan Al-Quran</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            Pusat Tahfiz
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari pusat tahfiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Pilih Negeri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Negeri</SelectItem>
                {STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userLocation && (
              <Button variant="outline" onClick={centerOnUser}>
                <Target className="w-4 h-4 mr-2" />
                Lokasi Saya
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>{filteredCenters.length} pusat tahfiz dijumpai</span>
            {loadingLocation && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendapatkan lokasi...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-[500px] md:h-[600px]">
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

            {/* Tahfiz center markers */}
            {filteredCenters.map(center => (
              <Marker
                key={center.id}
                position={[center.gps_lat, center.gps_lng]}
                icon={blueIcon}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="font-bold text-lg text-blue-700">{center.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{center.state}</p>
                    
                    {center.services_offered && center.services_offered.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Perkhidmatan:</p>
                        <div className="flex flex-wrap gap-1">
                          {center.services_offered.slice(0, 3).map(service => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {SERVICE_LABELS[service] || service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {center.phone && (
                      <p className="text-sm flex items-center gap-1 mb-2">
                        <Phone className="w-3 h-3" />
                        {center.phone}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 mt-3">
                      <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${center.id}`}>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Mohon Tahlil
                        </Button>
                      </Link>
                      <div className="flex gap-2">
                        <Link to={createPageUrl('DonationPage') + `?tahfiz=${center.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Heart className="w-3 h-3 mr-1" />
                            Derma
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => openDirections(center)}>
                          <Navigation className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {/* List View */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Senarai Pusat Tahfiz</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : filteredCenters.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Tiada pusat tahfiz dijumpai.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredCenters.map(center => (
                <div 
                  key={center.id} 
                  className="p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{center.name}</p>
                        <p className="text-sm text-gray-500">{center.state}</p>
                        {center.services_offered && center.services_offered.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {center.services_offered.slice(0, 2).map(service => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {SERVICE_LABELS[service] || service}
                              </Badge>
                            ))}
                            {center.services_offered.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{center.services_offered.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={createPageUrl('TahlilRequestPage') + `?tahfiz=${center.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Mohon
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openDirections(center)}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}