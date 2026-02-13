import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { useLocationContext } from '@/providers/LocationProvider';

export default function PrayerTimes() {
  const { userLocation, locationDenied, userState } = useLocationContext();

  const [malaysiaZones, setMalaysiaZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("WLY01");

  useEffect(() => {
    fetch('/Zone_MY.json')
      .then(res => res.json())
      .then(data => setMalaysiaZones(data))
      .catch(err => console.error('Failed to load zones:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userState || malaysiaZones.length === 0) return;

    setSelectedZone((prev) => {
      if (prev !== "WLY01") return prev;

      const matchedZone = malaysiaZones.find(
        (zone) => zone.state.toLowerCase() === userState.toLowerCase()
      );
      return matchedZone ? matchedZone.code : prev;
    });
  }, [userState, malaysiaZones]);

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
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

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
      if (prayerTime > currentMinutes) return prayer.name;
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
    <div className="pb-12 min-h-screen">
      <BackNavigation title={translate('Prayer Times')} />

      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pb-8 pt-4 px-4 text-center text-white shadow-lg">
        <h5 className="text-xl font-bold mb-2">{translate('Prayer Times')}</h5>
        <p className="text-sm text-white/90 max-w-md mx-auto">حيان على الصلاة</p>
      </div>

      <div className="-mt-4 mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {translate("Select Zone")}
          </label>
        </div>
        {loading ? (
          <PageLoadingComponent />
        ) : (
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
        )}
      </div>

      {isLoading && <PageLoadingComponent />}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{translate("Gregorian")}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{prayerData.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{translate("Hijri")}</p>
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
                      {translate("Next Prayer")}
                    </div>
                  )}
                  <div className="text-3xl mb-2">{prayer.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize mb-1">
                    {prayer.name}
                  </h3>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{prayer.time}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
