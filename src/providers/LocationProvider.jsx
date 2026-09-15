//@ts-nocheck
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { booleanPointInPolygon } from '@turf/turf';
import { getMalaysiaGeo } from '@/utils/helpers';

const LocationContext = createContext(null);

// A single fast, high-accuracy fix often fails: cold GPS chips can take well
// over 8s to lock, and on native the OS permission dialog can still be
// unanswered when this first fires. Retry with looser accuracy/timeout
// before giving up — but never retry PERMISSION_DENIED, since no amount of
// waiting fixes that.
const GPS_ATTEMPTS = [
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
  { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
];
const GPS_RETRY_DELAYS_MS = [2000, 4000];

const getPosition = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPositionWithRetries() {
  let lastError = null;

  for (let i = 0; i < GPS_ATTEMPTS.length; i++) {
    try {
      return await getPosition(GPS_ATTEMPTS[i]);
    } catch (err) {
      lastError = err;
      if (err?.code === 1 /* PERMISSION_DENIED */) break;
      if (i < GPS_ATTEMPTS.length - 1) {
        await wait(GPS_RETRY_DELAYS_MS[i] ?? 4000);
      }
    }
  }

  throw lastError;
}

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
      const position = await getPositionWithRetries();

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
    } catch (err) {
      const e = /** @type {any} */ (err);
      console.error('[GPS] getCurrentPosition failed:', e?.code, e?.message, e);
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
