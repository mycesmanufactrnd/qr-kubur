import { getStoredGoogleUser } from '@/utils/auth';

// The Kariah membership a user chose to "Save on this device" on
// UserKariahRegistration. Read by that page, the UserDashboard card and
// MosqueDetails.
//
// Stored per signed-in Google user, so people sharing a device never see each
// other's record; anyone not signed in shares the "guest" slot.
// Only what is needed to re-check the status (IC + mosque) and to show it —
// never name, phone, email or address.
export type SavedKariahMembership = {
  icnumber: string;
  mosqueId: number;
  mosqueName: string;
  isApproved: boolean;
};

const KEY_PREFIX = 'kariahRegisteredMember:';
// Pre-2026-11 records: one unscoped slot for the whole device, and no mosqueId
// to re-check with. Dropped rather than migrated — we can't tell whose it was.
const LEGACY_KEY = 'kariahRegisteredMember';

const storageKey = () => {
  const googleUserId = getStoredGoogleUser()?.id;
  return `${KEY_PREFIX}${googleUserId ? `google:${googleUserId}` : 'guest'}`;
};

export function getSavedKariahMembership(): SavedKariahMembership | null {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved?.icnumber || !saved?.mosqueId) {
      localStorage.removeItem(storageKey());
      return null;
    }
    return {
      icnumber: String(saved.icnumber),
      mosqueId: Number(saved.mosqueId),
      mosqueName: saved.mosqueName ?? '',
      isApproved: !!saved.isApproved,
    };
  } catch {
    return null;
  }
}

export function saveKariahMembership(record: SavedKariahMembership) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(record));
  } catch {
    // storage unavailable (private mode) — the status just won't persist
  }
}

export function clearSavedKariahMembership() {
  try {
    localStorage.removeItem(storageKey());
  } catch {
    // ignore
  }
}
