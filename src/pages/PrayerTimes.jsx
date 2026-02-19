import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { useLocationContext } from '@/providers/LocationProvider';

const PRAYER_KEYS = [
  { name: 'subuh',   arabicName: 'الفجر',   key: 'fajr',    icon: '🌄', period: 'Pre-Dawn' },
  { name: 'syuruk',  arabicName: 'الشروق',  key: 'syuruk',  icon: '🌅', period: 'Sunrise' },
  { name: 'zohor',   arabicName: 'الظهر',   key: 'dhuhr',   icon: '☀️', period: 'Midday' },
  { name: 'asar',    arabicName: 'العصر',   key: 'asr',     icon: '🌤', period: 'Afternoon' },
  { name: 'maghrib', arabicName: 'المغرب',  key: 'maghrib', icon: '🌇', period: 'Sunset' },
  { name: 'isyak',   arabicName: 'العشاء',  key: 'isha',    icon: '🌙', period: 'Night' },
];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function useCountdown(prayerData) {
  const [countdown, setCountdown] = useState('');
  const [nextPrayerName, setNextPrayerName] = useState('');

  useEffect(() => {
    if (!prayerData) return;

    const tick = () => {
      const now = new Date();
      const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      for (const p of PRAYER_KEYS) {
        const pSec = timeToMinutes(prayerData[p.key]) * 60;
        if (pSec > currentSec) {
          setNextPrayerName(p.name);
          setCountdown(formatCountdown(pSec - currentSec));
          return;
        }
      }
      // Past isha — countdown to next fajr
      const fajrSec = timeToMinutes(prayerData.fajr) * 60;
      const secsUntilMidnight = 86400 - currentSec;
      setNextPrayerName('subuh');
      setCountdown(formatCountdown(secsUntilMidnight + fajrSec));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerData]);

  return { countdown, nextPrayerName };
}

export default function PrayerTimes() {
  const { userLocation, locationDenied, userState } = useLocationContext();
  const [malaysiaZones, setMalaysiaZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("WLY01");

  useEffect(() => {
    fetch('/Zone_MY.json')
      .then(res => res.json())
      .then(data => setMalaysiaZones(data))
      .catch(err => console.error('Failed to load zones:', err))
      .finally(() => setZonesLoading(false));
  }, []);

  useEffect(() => {
    if (!userState || malaysiaZones.length === 0) return;
    setSelectedZone(prev => {
      if (prev !== "WLY01") return prev;
      const match = malaysiaZones.find(z => z.state.toLowerCase() === userState.toLowerCase());
      return match ? match.code : prev;
    });
  }, [userState, malaysiaZones]);

  const { data: prayerData, isLoading, error } = useQuery({
    queryKey: ['prayerTimes', selectedZone],
    queryFn: async () => {
      const res = await fetch(
        `https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=today&zone=${selectedZone}`
      );
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      const data = await res.json();
      return data.prayerTime[0];
    },
    refetchInterval: 60000,
  });

  const { countdown, nextPrayerName } = useCountdown(prayerData);

  const selectedZoneInfo = malaysiaZones.find(z => z.code === selectedZone);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        .pt-root {
          min-height: 100vh;
          background: transparent;
          color: #1a1a2e;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .pt-bg-pattern {
          display: none;
        }

        .pt-bg-geo {
          display: none;
        }

        .pt-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
          margin: 0 auto;
          padding: 0 4px 40px;
        }

        /* Header */
        .pt-header {
          text-align: center;
          padding: 5px 0 20px;
        }

        .pt-arabic-title {
          font-family: 'Amiri', serif;
          font-size: 28px;
          color: #a07830;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .pt-title {
          font-family: 'DM Serif Display', serif;
          font-size: 15px;
          font-weight: 400;
          color: rgba(80,60,30,0.5);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        /* Zone selector */
        .pt-zone-wrapper {
          margin-bottom: 20px;
        }

        .pt-zone-label {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(160,120,48,0.8);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pt-zone-label::before,
        .pt-zone-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(160,120,48,0.2);
        }

        /* Native select for mobile-friendliness */
        .pt-native-select {
          width: 100%;
          background: rgba(160,120,48,0.06);
          border: 1px solid rgba(160,120,48,0.25);
          color: #3a2c10;
          border-radius: 10px;
          padding: 11px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a07830' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .pt-native-select:focus {
          outline: none;
          border-color: rgba(160,120,48,0.55);
        }

        /* Countdown hero */
        .pt-countdown-card {
          background: linear-gradient(135deg, rgba(160,120,48,0.1) 0%, rgba(160,120,48,0.04) 100%);
          border: 1px solid rgba(160,120,48,0.22);
          border-radius: 20px;
          padding: 24px 20px;
          text-align: center;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .pt-countdown-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(160,120,48,0.5), transparent);
        }

        .pt-countdown-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(160,120,48,0.75);
          margin-bottom: 8px;
        }

        .pt-next-prayer-name {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #a07830;
          margin-bottom: 4px;
          text-transform: capitalize;
        }

        .pt-countdown-timer {
          font-family: 'DM Serif Display', serif;
          font-size: 42px;
          letter-spacing: 0.05em;
          color: #2a1f08;
          line-height: 1;
          margin-bottom: 8px;
        }

        .pt-countdown-sublabel {
          font-size: 11px;
          color: rgba(60,45,15,0.4);
          letter-spacing: 0.1em;
        }

        /* Date strip */
        .pt-dates {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .pt-date-card {
          flex: 1;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          padding: 12px 14px;
        }

        .pt-date-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(160,120,48,0.65);
          margin-bottom: 4px;
        }

        .pt-date-value {
          font-family: 'DM Serif Display', serif;
          font-size: 13px;
          color: #2a1f08;
          line-height: 1.3;
        }

        .pt-date-hijri {
          font-family: 'Amiri', serif;
          font-size: 15px;
          direction: rtl;
        }

        /* Prayer cards */
        .pt-prayers-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pt-prayer-card {
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.025);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          padding: 14px 18px;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .pt-prayer-card.is-next {
          background: rgba(160,120,48,0.09);
          border-color: rgba(160,120,48,0.3);
          box-shadow: 0 2px 16px rgba(160,120,48,0.07);
        }

        .pt-prayer-card.is-next::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #a07830, rgba(160,120,48,0.3));
          border-radius: 3px 0 0 3px;
        }

        .pt-prayer-card.is-past {
          opacity: 0.4;
        }

        .pt-prayer-icon {
          font-size: 22px;
          width: 40px;
          flex-shrink: 0;
          text-align: center;
        }

        .pt-prayer-info {
          flex: 1;
          margin-left: 12px;
        }

        .pt-prayer-name-en {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(60,45,15,0.45);
          line-height: 1;
          margin-bottom: 2px;
        }

        .pt-prayer-name-my {
          font-family: 'DM Serif Display', serif;
          font-size: 17px;
          color: #2a1f08;
          text-transform: capitalize;
          line-height: 1.2;
        }

        .pt-prayer-card.is-next .pt-prayer-name-my {
          color: #a07830;
        }

        .pt-prayer-arabic {
          font-family: 'Amiri', serif;
          font-size: 14px;
          color: rgba(160,120,48,0.6);
          margin-left: auto;
          margin-right: 12px;
          direction: rtl;
        }

        .pt-prayer-time {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: #2a1f08;
          letter-spacing: 0.02em;
          min-width: 60px;
          text-align: right;
        }

        .pt-prayer-card.is-next .pt-prayer-time {
          color: #a07830;
        }

        .pt-next-badge {
          position: absolute;
          top: 8px;
          right: 12px;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a07830;
          background: rgba(160,120,48,0.1);
          border: 1px solid rgba(160,120,48,0.22);
          border-radius: 20px;
          padding: 2px 8px;
        }

        /* Error */
        .pt-error {
          background: rgba(220, 80, 80, 0.07);
          border: 1px solid rgba(220,80,80,0.2);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          color: rgba(80,30,30,0.8);
          font-size: 13px;
        }

        /* Divider */
        .pt-section-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(160,120,48,0.5);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .pt-section-label::before,
        .pt-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(160,120,48,0.15);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pt-prayer-card {
          animation: fadeInUp 0.4s ease both;
        }

        .pt-prayer-card:nth-child(1) { animation-delay: 0.05s; }
        .pt-prayer-card:nth-child(2) { animation-delay: 0.10s; }
        .pt-prayer-card:nth-child(3) { animation-delay: 0.15s; }
        .pt-prayer-card:nth-child(4) { animation-delay: 0.20s; }
        .pt-prayer-card:nth-child(5) { animation-delay: 0.25s; }
        .pt-prayer-card:nth-child(6) { animation-delay: 0.30s; }

        .pt-countdown-card {
          animation: fadeInUp 0.5s ease both;
        }
      `}</style>

      <div className="pt-root">
        <div className="pt-bg-pattern" />
        <div className="pt-bg-geo" />

        <div className="pt-content">
          <BackNavigation title={translate('Prayer Times')}/>
          <div className="pt-header">
            <div className="pt-arabic-title">حيّ على الصلاة</div>
            <div className="pt-title">{translate('Prayer Times')}</div>
          </div>
          <div className="pt-zone-wrapper">
            <div className="pt-zone-label">{translate("Select Zone")}</div>
            <select
              className="pt-native-select"
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              disabled={zonesLoading}
            >
              {zonesLoading ? (
                <option value="">Loading zones…</option>
              ) : (
                malaysiaZones.map(zone => (
                  <option key={zone.code} value={zone.code}>
                    {zone.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Loading */}
          {isLoading && <PageLoadingComponent />}

          {/* Error */}
          {error && (
            <div className="pt-error">
              Unable to load prayer times. Please check your connection and try again.
            </div>
          )}

          {prayerData && (
            <>
              {/* Countdown hero */}
              <div className="pt-countdown-card">
                <div className="pt-countdown-label">Next Prayer</div>
                <div className="pt-next-prayer-name">{nextPrayerName}</div>
                <div className="pt-countdown-timer">{countdown}</div>
                <div className="pt-countdown-sublabel">hours · minutes · seconds</div>
              </div>

              {/* Dates */}
              <div className="pt-dates">
                <div className="pt-date-card">
                  <div className="pt-date-label">{translate("Gregorian")}</div>
                  <div className="pt-date-value">{prayerData.date}</div>
                </div>
                <div className="pt-date-card">
                  <div className="pt-date-label">{translate("Hijri")}</div>
                  <div className="pt-date-value pt-date-hijri">{prayerData.hijri}</div>
                </div>
              </div>

              {/* Prayer cards */}
              <div className="pt-section-label">Today's Schedule</div>
              <div className="pt-prayers-grid">
                {PRAYER_KEYS.map((prayer, i) => {
                  const isNext = prayer.name === nextPrayerName;
                  const now = new Date();
                  const currentMin = now.getHours() * 60 + now.getMinutes();
                  const prayerMin = timeToMinutes(prayerData[prayer.key]);
                  const isPast = prayerMin <= currentMin && !isNext;

                  return (
                    <div
                      key={prayer.name}
                      className={`pt-prayer-card ${isNext ? 'is-next' : ''} ${isPast ? 'is-past' : ''}`}
                    >
                      <div className="pt-prayer-icon">{prayer.icon}</div>
                      <div className="pt-prayer-info">
                        <div className="pt-prayer-name-en">{prayer.period}</div>
                        <div className="pt-prayer-name-my">{prayer.name}</div>
                      </div>
                      <div className="pt-prayer-arabic">{prayer.arabicName}</div>
                      <div className="pt-prayer-time">{prayerData[prayer.key]}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}