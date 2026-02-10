import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";

const translations = {
  en: {
    title: 'Prayer Times',
    subtitle: 'Waktu Solat',
    selectZone: 'Select Zone',
    today: 'Today',
    hijri: 'Hijri',
    gregorian: 'Gregorian',
    subuh: 'Subuh',
    syuruk: 'Syuruk',
    zohor: 'Zohor',
    asar: 'Asar',
    maghrib: 'Maghrib',
    isyak: 'Isyak',
    next: 'Next Prayer',
    loading: 'Loading prayer times...'
  },
  ms: {
    title: 'Waktu Solat',
    subtitle: 'Prayer Times',
    selectZone: 'Pilih Zon',
    today: 'Hari Ini',
    hijri: 'Hijriah',
    gregorian: 'Gregorian',
    subuh: 'Subuh',
    syuruk: 'Syuruk',
    zohor: 'Zohor',
    asar: 'Asar',
    maghrib: 'Maghrib',
    isyak: 'Isyak',
    next: 'Solat Seterusnya',
    loading: 'Memuatkan waktu solat...'
  }
};

const malaysiaZones = [
  { code: 'JHR01', name: 'Pulau Aur dan Pulau Pemanggil' },
  { code: 'JHR02', name: 'Johor Bahru, Kota Tinggi, Mersing' },
  { code: 'JHR03', name: 'Kluang dan Pontian' },
  { code: 'JHR04', name: 'Batu Pahat, Muar, Segamat, Gemas' },
  { code: 'KDH01', name: 'Kota Setar, Kubang Pasu, Pokok Sena' },
  { code: 'KDH02', name: 'Pendang, Kuala Muda, Yan' },
  { code: 'KDH03', name: 'Padang Terap, Sik' },
  { code: 'KDH04', name: 'Baling' },
  { code: 'KDH05', name: 'Bandar Baharu, Kulim' },
  { code: 'KDH06', name: 'Langkawi' },
  { code: 'KDH07', name: 'Gunung Jerai' },
  { code: 'KTN01', name: 'Kota Bharu, Pasir Mas, Tumpat' },
  { code: 'KTN02', name: 'Bachok, Pasir Puteh' },
  { code: 'KTN03', name: 'Tanah Merah, Machang, Kuala Krai' },
  { code: 'KUL01', name: 'Kuala Lumpur' },
  { code: 'MLK01', name: 'Melaka' },
  { code: 'NGS01', name: 'Negeri Sembilan' },
  { code: 'PHG01', name: 'Pulau Tioman' },
  { code: 'PHG02', name: 'Kuantan, Pekan, Rompin' },
  { code: 'PHG03', name: 'Jerantut, Temerloh, Maran, Bera' },
  { code: 'PHG04', name: 'Bentong, Lipis, Raub' },
  { code: 'PHG05', name: 'Cameron Highlands' },
  { code: 'PHG06', name: 'Bukit Fraser' },
  { code: 'PLS01', name: 'Kangar, Padang Besar, Arau' },
  { code: 'PNG01', name: 'Seluruh Negeri Pulau Pinang' },
  { code: 'PRK01', name: 'Tapah, Slim River, Tanjung Malim' },
  { code: 'PRK02', name: 'Kuala Kangsar, Sg. Siput, Ipoh' },
  { code: 'PRK03', name: 'Lenggong, Pengkalan Hulu, Grik' },
  { code: 'PRK04', name: 'Temengor, Belum' },
  { code: 'PRK05', name: 'Kg Gajah, Teluk Intan, Bagan Datuk' },
  { code: 'PRK06', name: 'Lumut, Sitiawan, Pulau Pangkor' },
  { code: 'PRK07', name: 'Beruas, Parit, Lumut, Setiawan' },
  { code: 'SBH01', name: 'Sandakan, Bdr. Bkt. Garam, Semawang' },
  { code: 'SBH02', name: 'Pintas, Terusan, Beluran, Kuamut' },
  { code: 'SBH03', name: 'Lahad Datu, Silabukan, Kunak' },
  { code: 'SBH04', name: 'Tawau, Balong, Merotai, Kalabakan' },
  { code: 'SBH05', name: 'Kudat, Kota Marudu, Pitas, Pulau Banggi' },
  { code: 'SBH06', name: 'Gunung Kinabalu' },
  { code: 'SBH07', name: 'Papar, Ranau, Kota Belud, Tuaran' },
  { code: 'SBH08', name: 'Penampang, Kota Kinabalu, Putatan' },
  { code: 'SBH09', name: 'Beaufort, Kuala Penyu, Sipitang, Tenom' },
  { code: 'SGR01', name: 'Gombak, Petaling, Sepang, Hulu Langat' },
  { code: 'SGR02', name: 'Kuala Selangor, Sabak Bernam' },
  { code: 'SGR03', name: 'Klang, Kuala Langat' },
  { code: 'SWK01', name: 'Kuching, Samarahan, Serian, Simunjan' },
  { code: 'SWK02', name: 'Betong, Saratok, Debak, Kabong' },
  { code: 'SWK03', name: 'Sarikei, Matu, Julau, Bintangor' },
  { code: 'SWK04', name: 'Sibu, Mukah, Dalat, Oya' },
  { code: 'SWK05', name: 'Belaga, Kapit, Song, Katibas' },
  { code: 'SWK06', name: 'Bintulu, Tatau, Sebauh' },
  { code: 'SWK07', name: 'Miri, Niah, Bekenu, Sibuti, Marudi' },
  { code: 'SWK08', name: 'Limbang, Sundar, Trusan, Lawas' },
  { code: 'SWK09', name: 'Limbang, Sundar, Trusan, Lawas' },
  { code: 'TRG01', name: 'Kuala Terengganu, Marang' },
  { code: 'TRG02', name: 'Besut, Setiu' },
  { code: 'TRG03', name: 'Hulu Terengganu' },
  { code: 'TRG04', name: 'Kemaman, Dungun' },
  { code: 'WLY01', name: 'Wilayah Persekutuan Kuala Lumpur' },
  { code: 'WLY02', name: 'Wilayah Persekutuan Labuan' }
];

export default function PrayerTimes() {
  const language = localStorage.getItem('language') || 'ms';
  const t = translations[language];
  
  const [selectedZone, setSelectedZone] = useState(() => {
    return localStorage.getItem('prayerZone') || 'KUL01';
  });

  useEffect(() => {
    localStorage.setItem('prayerZone', selectedZone);
  }, [selectedZone]);

  const { data: prayerData, isLoading, error } = useQuery({
    queryKey: ['prayerTimes', selectedZone],
    queryFn: async () => {
      const response = await fetch(
        `https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=today&zone=${selectedZone}`
      );
      if (!response.ok) throw new Error('Failed to fetch prayer times');
      const data = await response.json();
      return data.prayerTime[0];
    },
    refetchInterval: 60000, 
  });

  const getNextPrayer = () => {
    if (!prayerData) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'subuh', time: prayerData.fajr },
      { name: 'syuruk', time: prayerData.syuruk },
      { name: 'zohor', time: prayerData.dhuhr },
      { name: 'asar', time: prayerData.asr },
      { name: 'maghrib', time: prayerData.maghrib },
      { name: 'isyak', time: prayerData.isha }
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      if (prayerTime > currentTime) {
        return prayer.name;
      }
    }
    
    return 'subuh';
  };

  const nextPrayer = getNextPrayer();

  const prayerCards = prayerData ? [
    { name: 'subuh', time: prayerData.fajr, icon: '🌅' },
    { name: 'syuruk', time: prayerData.syuruk, icon: '☀️' },
    { name: 'zohor', time: prayerData.dhuhr, icon: '🌞' },
    { name: 'asar', time: prayerData.asr, icon: '🌤️' },
    { name: 'maghrib', time: prayerData.maghrib, icon: '🌆' },
    { name: 'isyak', time: prayerData.isha, icon: '🌙' }
  ] : [];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
    <BackNavigation title={translate('Prayer Times')} /> 
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-2">{t.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t.subtitle}</p>
      </div>

      {/* Zone Selector */}
      <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t.selectZone}
          </label>
        </div>
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-full text-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {malaysiaZones.map((zone) => (
              <SelectItem key={zone.code} value={zone.code}>
                {zone.code} - {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <p className="text-red-600 dark:text-red-400">Failed to load prayer times</p>
        </div>
      )}

      {prayerData && (
        <>
       
          <div className="mb-6 bg-gradient-to-r from-purple-100 to-teal-100 dark:from-purple-900/30 dark:to-teal-900/30 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.gregorian}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{prayerData.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.hijri}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{prayerData.hijri}</p>
                </div>
              </div>
            </div>
          </div>

         
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {prayerCards.map((prayer) => {
              const isNext = prayer.name === nextPrayer;
              return (
                <div
                  key={prayer.name}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md transition-all duration-300 ${
                    isNext
                      ? 'ring-4 ring-teal-400 dark:ring-teal-600 scale-105 bg-gradient-to-br from-teal-50 to-purple-50 dark:from-teal-900/30 dark:to-purple-900/30'
                      : 'hover:shadow-xl'
                  }`}
                >
                  {isNext && (
                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.next}
                    </div>
                  )}
                  <div className="text-3xl mb-2">{prayer.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize mb-1">
                    {t[prayer.name]}
                  </h3>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {prayer.time}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}