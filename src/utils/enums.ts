
export const LANG = [ "en", "ms", "ar" ];

export const STATES_MY = [
    "Federal", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
    "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", 
    "Terengganu", "Wilayah Persekutuan"
];

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

export const SERVICE_LABELS = {
  'tahlil_ringkas': 'Tahlil Ringkas',
  'tahlil_panjang': 'Tahlil Panjang',
  'yasin': 'Bacaan Yasin',
  'doa_arwah': 'Doa Arwah',
  'custom': 'Perkhidmatan Khas'
};

export const ACTION_MAPS = {
  create: 'Created Successfully',
  edit: 'Edited Successfully',
  update: 'Edited Successfully',
  delete: 'Deleted Successfully',
  approve: 'Approved Successfully',
  deny: 'Denied Successfully',
};

export const ACTION_FAILURE_MAPS = {
  create: 'Creation Failed',
  edit: 'Edit Failed',
  update: 'Edit Failed',
  delete: 'Deletion Failed',
  approve: 'Approval Failed',
  deny: 'Denial Failed',
};

export enum ActiveInactiveStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum VerificationStatus {
  PENDING = "pending",
  VERIFY = "verify",
  REJECTED = "rejected",
}