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

