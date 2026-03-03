import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { booleanPointInPolygon } from '@turf/turf';
import { getMalaysiaGeo } from '@/utils/helpers';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [userState, setUserState] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const resolveUserLocation = useCallback(async ({ forceRefresh = false } = {}) => {
    setIsLocationLoading(true);

    if (!forceRefresh) {
      const cached = sessionStorage.getItem('user_location');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserLocation(parsed.location ?? null);
          setUserState(parsed.state ?? null);
          setLocationDenied(false);
          setIsLocationLoading(false);
          return true;
        } catch {
          sessionStorage.removeItem('user_location');
        }
      }
    }

    if (!navigator.geolocation) {
      setUserLocation(null);
      setUserState(null);
      setLocationDenied(true);
      setIsLocationLoading(false);
      return false;
    }

    try {
      const malaysiaStates = await getMalaysiaGeo();
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            timeout: 8000,
            enableHighAccuracy: true,
            maximumAge: 0,
          }
        );
      });

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
        state: detectedState,
      };

      sessionStorage.setItem('user_location', JSON.stringify(payload));

      setUserLocation(payload.location);
      setUserState(payload.state);
      setLocationDenied(false);
      return true;
    } catch {
      setUserLocation(null);
      setUserState(null);
      setLocationDenied(true);
      return false;
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    resolveUserLocation();
  }, [resolveUserLocation]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        userState,
        locationDenied,
        isLocationLoading,
        requestLocation: resolveUserLocation,
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
