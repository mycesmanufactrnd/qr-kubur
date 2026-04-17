
export const LANG = [ "en", "ms", "ar" ];

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const DONATION_AMOUNTS = [10, 20, 50, 100, 200, 500];

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhul-Qi\'dah', 'Dhul-Hijjah'
];

export const ISLAMIC_EVENTS_CATEGORIES = ['Event', 'Fasting', 'Prayer', 'Hajj'];

export const STATES_MY = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
    "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
    "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan"
];

export const normalizeState = (stateFromUrl) => {
  if (!stateFromUrl) return 'nearby';

  return STATES_MY.find(
    s => s.toLowerCase() === stateFromUrl.toLowerCase()
  ) || 'nearby';
};

const defaultSurahId = 1;
export const QURAN_API = `https://alquran-api.pages.dev/api/quran/surah/${defaultSurahId}`;

export const SURAH_DATA = {
  1: {
    audio: {
      1: { reciter: "Mishary Rashid Al-Afasy", url: "https://server8.mp3quran.net/afs/001.mp3" },
      2: { reciter: "Abu Bakr Al-Shatri", url: "https://server11.mp3quran.net/shatri/001.mp3" },
      3: { reciter: "Nasser Al-Qatami", url: "https://server6.mp3quran.net/qtm/001.mp3" },
      4: { reciter: "Yasser Al-Dosari", url: "https://server11.mp3quran.net/yasser/001.mp3" },
    },
  },
  36: {
    audio: {
      1: { reciter: "Mishary Rashid Al-Afasy", url: "https://server8.mp3quran.net/afs/036.mp3" },
      2: { reciter: "Abu Bakr Al-Shatri", url: "https://server11.mp3quran.net/shatri/036.mp3" },
      3: { reciter: "Nasser Al-Qatami", url: "https://server6.mp3quran.net/qtm/036.mp3" },
      4: { reciter: "Yasser Al-Dosari", url: "https://server11.mp3quran.net/yasser/036.mp3" },
    },
  },
  112: {
    audio: {
      1: { reciter: "Mishary Rashid Al-Afasy", url: "https://server8.mp3quran.net/afs/112.mp3" },
      2: { reciter: "Abu Bakr Al-Shatri", url: "https://server11.mp3quran.net/shatri/112.mp3" },
      3: { reciter: "Nasser Al-Qatami", url: "https://server6.mp3quran.net/qtm/112.mp3" },
      4: { reciter: "Yasser Al-Dosari", url: "https://server11.mp3quran.net/yasser/112.mp3" },
    },
  },
  113: {
    audio: {
      1: { reciter: "Mishary Rashid Al-Afasy", url: "https://server8.mp3quran.net/afs/113.mp3" },
      2: { reciter: "Abu Bakr Al-Shatri", url: "https://server11.mp3quran.net/shatri/113.mp3" },
      3: { reciter: "Nasser Al-Qatami", url: "https://server6.mp3quran.net/qtm/113.mp3" },
      4: { reciter: "Yasser Al-Dosari", url: "https://server11.mp3quran.net/yasser/113.mp3" },
    },
  },
  114: {
    audio: {
      1: { reciter: "Mishary Rashid Al-Afasy", url: "https://server8.mp3quran.net/afs/114.mp3" },
      2: { reciter: "Abu Bakr Al-Shatri", url: "https://server11.mp3quran.net/shatri/114.mp3" },
      3: { reciter: "Nasser Al-Qatami", url: "https://server6.mp3quran.net/qtm/114.mp3" },
      4: { reciter: "Yasser Al-Dosari", url: "https://server11.mp3quran.net/yasser/114.mp3" },
    },
  },
};

export const RECITERS = [
  { id: 1, reciter: "Mishary Rashid Al-Afasy", },
  { id: 2, reciter: "Abu Bakr Al-Shatri" },
  { id: 3, reciter: "Nasser Al-Qatami" },
  { id: 4, reciter: "Yasser Al-Dosari" },
]

export const SURAH_LIST = [
  { id: 1, label: "Al-Fatihah" },
  { id: 36, label: "Yasin" },
  { id: 112, label: "Al-Ikhlas" },
  { id: 113, label: "Al-Falaq" },
  { id: 114, label: "An-Nas" },
];

export const getServiceLabel = (value: string) => {
  return value;
};

export const getServiceLabels = (values: string[] = []) => {
  return values.map(v => getServiceLabel(v)).join(', ');
};

export const ACTION_MAPS = {
  create: 'Created Successfully',
  upload: 'Upload Successfully',
  save: 'Saved Successfully',
  edit: 'Edited Successfully',
  update: 'Edited Successfully',
  delete: 'Deleted Successfully',
  approve: 'Approved Successfully',
  deny: 'Denied Successfully',
} as const;

export const ACTION_FAILURE_MAPS = {
  create: 'Creation Failed',
  upload: 'Upload Failed',
  save: 'Saved Failed',
  edit: 'Edit Failed',
  update: 'Edit Failed',
  delete: 'Deletion Failed',
  approve: 'Approval Failed',
  deny: 'Denial Failed',
} as const;

export enum ActiveInactiveStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export enum GraveStatus {
  ACTIVE = "active",
  FULL = "full",
  MAINTENANCE = "maintenance"
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum TahlilStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export const paymentToyyibStatus = {
  "1": "Success",
  "2": "Pending",
  "3": "Unsuccessful",
  "01": "Success",
  "02": "Pending",
  "03": "Unsuccessful",
};

export const SST_PERCENTAGE = 0.06;
export const MAINTENANCE_FEE_PERCENTAGE = 0.05;
export const MAINTENANCE_FEE = 2;
export const SERVICE_FEE = 3;

export enum WaqfCategory {
  EDUCATION = 'Education',
  MOSQUE = 'Mosque',
  HEALTHCARE = 'Healthcare',
  ORPHANS = 'Orphans',
  WATER = 'Water',
  GENERALCHARITY = 'General Charity',
}

export enum ProjectStatus {
  PLANNED = 'Planned',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  ONHOLD = 'On Hold',
}

export enum WaqfType {
  CASH = 'Cash Waqf',
  PROPERTY = 'Property Waqf',
  ASSET = 'Asset Waqf',
}

export enum ClaimStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  PAID = 'Paid',
}
