import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Navigation, Compass, MapPin, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function QiblaCompass() {
  const navigate = useNavigate();
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [location, setLocation] = useState({ lat: null, lng: null, name: 'Mengesan lokasi...' });
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [isAligned, setIsAligned] = useState(false);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Calculate Qibla direction (Kaaba coordinates: 21.4225, 39.8262)
          const kaabaLat = 21.4225;
          const kaabaLng = 39.8262;
          
          const phiK = kaabaLat * Math.PI / 180.0;
          const lambdaK = kaabaLng * Math.PI / 180.0;
          const phi = lat * Math.PI / 180.0;
          const lambda = lng * Math.PI / 180.0;
          
          const psi = Math.atan2(
            Math.sin(lambdaK - lambda),
            Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
          );
          
          let qibla = psi * 180.0 / Math.PI;
          if (qibla < 0) qibla += 360;
          
          setQiblaDirection(qibla);
          
          // Get location name using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const locationName = data.address.city || data.address.town || data.address.village || 'Unknown';
            const country = data.address.country || '';
            setLocation({ lat, lng, name: `${locationName}, ${country}` });
          } catch (error) {
            setLocation({ lat, lng, name: 'Lokasi tidak diketahui' });
          }
        },
        (error) => {
          toast.error('Tidak dapat mengesan lokasi. Sila aktifkan GPS.');
        }
      );
    }

    // Listen to device orientation
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        setHeading(360 - event.alpha);
      }
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const qiblaAngle = qiblaDirection - heading;

  // Check alignment and vibrate
  useEffect(() => {
    const angleDiff = Math.abs(qiblaAngle % 360);
    const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
    
    if (normalizedDiff < 5 && !isAligned) {
      setIsAligned(true);
      // Vibrate device
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } else if (normalizedDiff >= 10 && isAligned) {
      setIsAligned(false);
    }
  }, [qiblaAngle, isAligned]);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-2">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Kompas Kiblat</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCalibrationOpen(true)}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Kalibrasi
        </Button>
      </div>

      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">{location.name}</p>
            <p className="text-xs text-gray-500">
              {location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="arrow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="arrow">
            <Navigation className="w-4 h-4 mr-2" />
            Anak Panah
          </TabsTrigger>
          <TabsTrigger value="compass">
            <Compass className="w-4 h-4 mr-2" />
            Kompas
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="w-4 h-4 mr-2" />
            Peta
          </TabsTrigger>
        </TabsList>

        {/* Arrow Qibla */}
        <TabsContent value="arrow" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
                    style={{ transform: `rotate(${qiblaAngle}deg)` }}
                  >
                    <Navigation className="w-32 h-32 text-emerald-600 fill-emerald-600" />
                  </div>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700">
                    U
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700">
                    S
                  </div>
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-800">
                  Arah Kiblat: {qiblaDirection.toFixed(0)}°
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compass Qibla */}
        <TabsContent value="compass" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Compass background with Kaabah icon rotating */}
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-gray-300 transition-transform duration-300"
                    style={{ transform: `rotate(${heading}deg)` }}
                  >
                    {/* North marker */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-8 bg-red-500 clip-triangle"></div>
                    </div>
                    {/* Cardinal directions */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold">N</div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-bold">S</div>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold">W</div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold">E</div>
                    
                    {/* Kaabah icon on outer ring at Qibla position */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        transform: `rotate(${qiblaDirection - heading}deg) translateY(-120px)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <div 
                        className="text-3xl"
                        style={{ transform: `rotate(${-(qiblaDirection - heading)}deg)` }}
                      >
                        🕋
                      </div>
                    </div>
                  </div>
                  
                  {/* Qibla needle (fixed) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-32 bg-emerald-600 shadow-lg"></div>
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-800"></div>
                  </div>

                  {/* Alignment indicator */}
                  {isAligned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-800">
                  {isAligned ? (
                    <span className="text-green-600">✓ Menghadap Kiblat</span>
                  ) : (
                    <>Heading: {heading.toFixed(0)}° | Kiblat: {qiblaDirection.toFixed(0)}°</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Qibla */}
        <TabsContent value="map" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {location.lat && location.lng && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 5, 0 10" fill="#10b981" />
                      </marker>
                    </defs>
                    <line
                      x1="50%"
                      y1="50%"
                      x2="50%"
                      y2="10%"
                      stroke="#10b981"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead)"
                      strokeDasharray="5,5"
                      style={{ transform: `rotate(${qiblaDirection}deg)`, transformOrigin: 'center' }}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dy="-10" fill="#059669" fontSize="24" fontWeight="bold">
                      🕋
                    </text>
                    <circle cx="50%" cy="50%" r="4" fill="#059669" />
                  </svg>
                )}
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.1},${location.lat - 0.1},${location.lng + 0.1},${location.lat + 0.1}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  style={{ border: 0 }}
                ></iframe>
              </div>
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-800 text-center">
                  Arah Kiblat: <span className="font-bold">{qiblaDirection.toFixed(0)}°</span>
                  <span className="text-xs mx-2">•</span>
                  <span className="text-xs">
                    {location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calibration Dialog */}
      <Dialog open={calibrationOpen} onOpenChange={setCalibrationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kalibrasi Kompas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Untuk kalibrasi kompas, gerakkan telefon anda dalam bentuk angka 8 seperti gambar di bawah:
            </p>
            <div className="flex justify-center p-8 bg-gray-100 rounded-lg">
              <div className="text-6xl">∞</div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Gerakkan telefon dalam bentuk simbol infiniti (∞) beberapa kali
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCalibrationOpen(false)} className="bg-emerald-600">
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-0 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-xs text-blue-800 text-center">
            💡 Pastikan GPS dan sensor telefon anda aktif untuk bacaan yang tepat
          </p>
        </CardContent>
      </Card>
    </div>
  );
}