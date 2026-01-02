import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Navigation, Compass, MapPin, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getTranslation, getCurrentLanguage } from '../components/Translations';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const kaabaIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='font-size: 32px; text-align: center;'>🕋</div>",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='font-size: 32px; text-align: center;'>📍</div>",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

export default function QiblaCompass() {
  const navigate = useNavigate();
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [location, setLocation] = useState({ lat: null, lng: null, name: 'Mengesan lokasi...' });
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [lang, setLang] = useState('ms');

  useEffect(() => {
    setLang(getCurrentLanguage());
  }, []);

  const t = (key) => getTranslation(key, lang);

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('qiblaCompass')}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCalibrationOpen(true)}
          className="gap-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
          {t('calibrate')}
        </Button>
      </div>

      <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700">
        <CardContent className="p-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">{location.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="arrow" className="w-full">
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
          <TabsTrigger value="arrow" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            <Navigation className="w-4 h-4 mr-2" />
            {t('arrow')}
          </TabsTrigger>
          <TabsTrigger value="compass" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            <Compass className="w-4 h-4 mr-2" />
            {t('compass')}
          </TabsTrigger>
          <TabsTrigger value="map" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
            <MapPin className="w-4 h-4 mr-2" />
            {t('map')}
          </TabsTrigger>
        </TabsList>

        {/* Arrow Qibla */}
        <TabsContent value="arrow" className="mt-4">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Rotating compass ring with Kaabah icon */}
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-emerald-200 transition-transform duration-300"
                    style={{ transform: `rotate(${heading}deg)` }}
                  >
                    {/* Kaabah icon on outer ring at Qibla position - always pointing up */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        transform: `rotate(${qiblaDirection - heading}deg) translateY(-120px)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <div 
                        className="text-3xl"
                        style={{ transform: `rotate(${-heading}deg)` }}
                      >
                        🕋
                      </div>
                    </div>
                  </div>
                  
                  {/* Fixed arrow pointing up (North) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Navigation className="w-32 h-32 text-emerald-600 fill-emerald-600" />
                  </div>
                  
                  {/* Cardinal direction markers */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700">
                    U
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700">
                    S
                  </div>

                  {/* Alignment indicator */}
                  {isAligned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {isAligned ? (
                    <span className="text-green-600 dark:text-green-400">✓ {t('facingQibla')}</span>
                  ) : (
                    <>{t('qiblaDirection')}: {qiblaDirection.toFixed(0)}°</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compass Qibla */}
        <TabsContent value="compass" className="mt-4">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
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
                <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {isAligned ? (
                    <span className="text-green-600 dark:text-green-400">✓ {t('facingQibla')}</span>
                  ) : (
                    <>Heading: {heading.toFixed(0)}° | {t('qiblaDirection')}: {qiblaDirection.toFixed(0)}°</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Qibla */}
        <TabsContent value="map" className="mt-4">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardContent className="p-4">
              {location.lat && location.lng ? (
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    {/* User location marker */}
                    <Marker position={[location.lat, location.lng]} icon={userIcon} />
                    {/* Kaaba location marker */}
                    <Marker position={[21.4225, 39.8262]} icon={kaabaIcon} />
                    {/* Line connecting user to Kaaba */}
                    <Polyline
                      positions={[
                        [location.lat, location.lng],
                        [21.4225, 39.8262]
                      ]}
                      pathOptions={{ color: '#10b981', weight: 3, dashArray: '10, 10' }}
                    />
                  </MapContainer>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">{t('detectingLocation')}</p>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📍 {t('yourLocation')}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">🕋 {t('kaabah')}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">21.4225°, 39.8262°</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calibration Dialog */}
      <Dialog open={calibrationOpen} onOpenChange={setCalibrationOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('calibrate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {lang === 'en' ? 'To calibrate the compass, move your phone in a figure-8 pattern:' :
               lang === 'ar' ? 'لمعايرة البوصلة، حرك هاتفك في شكل رقم 8:' :
               'Untuk kalibrasi kompas, gerakkan telefon anda dalam bentuk angka 8:'}
            </p>
            <div className="flex justify-center p-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-6xl dark:text-gray-300">∞</div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {lang === 'en' ? 'Move phone in infinity symbol (∞) pattern' :
               lang === 'ar' ? 'حرك الهاتف في نمط رمز اللانهاية (∞)' :
               'Gerakkan telefon dalam bentuk simbol infiniti (∞)'}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCalibrationOpen(false)} className="bg-emerald-600 dark:bg-emerald-700">
              {lang === 'en' ? 'Done' : lang === 'ar' ? 'تم' : 'Selesai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-0 bg-blue-50 dark:bg-blue-900/30">
        <CardContent className="p-4">
          <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
            💡 {lang === 'en' ? 'Ensure GPS and phone sensors are active for accurate readings' :
                lang === 'ar' ? 'تأكد من تشغيل GPS وأجهزة استشعار الهاتف للحصول على قراءات دقيقة' :
                'Pastikan GPS dan sensor telefon anda aktif untuk bacaan yang tepat'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}