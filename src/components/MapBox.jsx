import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';
import { createPageUrl } from '@/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DirectionButton from './DirectionButton';
import { openDirections } from '@/utils/helpers';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom green marker for tahfiz centers
const tahfizIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapBox({ dataMap, userLocation, pageToUrl }) {
  const hasCenterLocation =
    dataMap?.latitude && dataMap?.longitude;

  const defaultCenter = hasCenterLocation
    ? [dataMap.latitude, dataMap.longitude]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [4.2105, 101.9758];

  if (!hasCenterLocation && !userLocation) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-2xl">
        <div className="text-center text-slate-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No location to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="relative z-0 h-full w-full rounded-2xl"
        style={{ minHeight: '400px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {hasCenterLocation && (
          <Marker
            position={[dataMap.latitude, dataMap.longitude]}
            icon={tahfizIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-emerald-700">
                  {dataMap.name}
                </h3>
                <div className="flex gap-2">
                  <Link to={createPageUrl(`${pageToUrl}?id=${dataMap.id}`)}>
                    <Button size="sm" variant="outline" className="text-xs">
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="text-xs bg-emerald-500 hover:bg-emerald-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDirections(dataMap.latitude, dataMap.longitude);
                    }}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
