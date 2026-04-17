let cachedGeo: any = null;

export function getLabelFromId(arrayList = [], typeId, key = 'name') {
  if (!arrayList || arrayList.length === 0 || !typeId) return '-';

  const item = arrayList.find(t => t.id === typeId);
  return item?.[key] ?? '-';
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }

  // Encode the password as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashed = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashed;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export function getDistanceFromLatLonInKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function calculateAge(deadOfBirth, deadOfDeath) {
  if (!deadOfBirth || !deadOfDeath) return 0;
  const birth = new Date(deadOfBirth);
  const death = new Date(deadOfDeath);
  let age = death.getFullYear() - birth.getFullYear();
  const m = death.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
  return age;
};

export async function getMalaysiaGeo() {
  if (cachedGeo) return cachedGeo;
  const res = await fetch('/Geo_MY.json');
  cachedGeo = await res.json();
  return cachedGeo;
}

export function openDirections(latitude, longitude) {
  if (latitude && longitude) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      '_blank'
    );
  }
}

export async function shareLink({
  title, text, url,
}: {
  title?: string; text?: string; url?: string;
}) {
  const shareUrl = url || window.location.href;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || document.title,
        text: text || '',
        url: shareUrl,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Pautan telah disalin!');
      }
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);
    alert('Pautan telah disalin!');
  }
}

export function requestLocation() {
  sessionStorage.removeItem('user_location');
  window.location.reload(); 
};

export function activityLogError(error: any) {
  return JSON.stringify({
    message: error?.message,
    code: error?.data?.code ?? error?.code,
    httpStatus: error?.data?.httpStatus,
    path: error?.data?.path,
  });
}

export function trimEmptyArray(dataArray) {
  return (dataArray || []).filter(s => s && s.trim() !== '')
}

export function clearQueryParams() {
  if (typeof window !== "undefined") {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    return cleanUrl;
  }

  return null;
}

export function showEarthDistance(distanceMeters?: number | null): string {
  if (distanceMeters == null || isNaN(distanceMeters)) return '-';

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  } else {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
}

export function formatRM(value: number | string | null | undefined) {
  const num = Number(value ?? 0);

  return `RM ${num.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

