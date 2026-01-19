import { createContext, useContext, useEffect, useState } from 'react';
import { booleanPointInPolygon } from '@turf/turf';
import { getMalaysiaGeo } from '@/utils/helpers';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [userState, setUserState] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem('user_location');
    if (cached) {
      const parsed = JSON.parse(cached);
      setUserLocation(parsed.location);
      setUserState(parsed.state);
      setIsLocationLoading(false);
      return;
    }

    getMalaysiaGeo().then((malaysiaStates) => {
      if (!navigator.geolocation) {
        setLocationDenied(true);
        setIsLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const point = [lng, lat];
          let detectedState = null;

          for (const feature of malaysiaStates.features) {
            if (booleanPointInPolygon(point, feature)) {
              detectedState = feature.properties.name;
              break;
            }
          }

          const payload = {
            location: { lat, lng },
            state: detectedState
          };

          sessionStorage.setItem('user_location', JSON.stringify(payload));

          setUserLocation(payload.location);
          setUserState(payload.state);
          setIsLocationLoading(false);
        },
        () => {
          setLocationDenied(true);
          setIsLocationLoading(false);
        },
        { timeout: 8000 }
      );
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        userState,
        locationDenied,
        isLocationLoading
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used inside LocationProvider');
  }
  return context;
}
