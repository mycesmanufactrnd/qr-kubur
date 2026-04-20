import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Search,
  QrCode,
  BookOpen,
  Heart,
  FileText,
  MapPin,
  MoonStar,
  Globe,
  Calendar,
  Video,
  MessageCircle,
  Newspaper,
  BookMarked,
  NotebookTabs,
  Clock,
  BookHeart,
  ChevronRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Server,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { DraggableFloatingButton } from "@/components/mobile/DraggableFloatingButton";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .db {
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    background: #f8f5f0;
    padding-bottom: 90px;
    overflow-x: hidden;
  }

  /* ════════════════════════════════
     HERO HEADER — lush green with Islamic geometry
  ════════════════════════════════ */
  .db-hero {
    position: relative;
    background: linear-gradient(160deg, #063d2e 0%, #0a5c42 35%, #0d7a58 65%, #10956a 100%);
    padding: 32px 20px 100px;
    overflow: hidden;
  }

  .db-geo {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M40 0l5 15h15l-12 9 5 15-13-9-13 9 5-15-12-9h15zM0 40l5 15h15l-12 9 5 15-13-9-13 9 5-15-12-9h15zM80 40l5 15h15l-12 9 5 15-13-9-13 9 5-15-12-9h15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }

  .db-crescent {
    position: absolute;
    right: -30px; top: -30px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: transparent;
    box-shadow: -35px 10px 0 0 rgba(255,255,255,0.06);
    pointer-events: none;
  }

  .db-orb {
    position: absolute;
    left: -60px; bottom: 20px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(32,210,140,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .db-toprow {
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 1;
  }
  .db-greeting { font-size: 11px; color: rgba(255,255,255,0.55); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
  .db-appname { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.8px; line-height: 1; }
  .db-tagline { font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 3px; letter-spacing: 0.4px; }

  .db-moonbtn {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
    position: relative; z-index: 1;
  }

  .db-ayah-banner {
    position: relative; z-index: 1;
    margin-top: 20px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 18px;
    padding: 16px 18px;
    backdrop-filter: blur(6px);
    overflow: hidden;
  }
  .db-ayah-banner::before {
    content: '٣:١٨٥';
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-family: 'Amiri', serif; font-size: 36px; color: rgba(255,255,255,0.06);
    pointer-events: none; user-select: none;
  }
  .db-arabic { font-family: 'Amiri', serif; font-size: 20px; color: rgba(255,255,255,0.92); direction: rtl; text-align: right; line-height: 1.6; }
  .db-trans { font-size: 11px; color: rgba(255,255,255,0.6); font-style: italic; margin-top: 6px; }
  .db-ref { display: inline-block; font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 4px; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 10px; letter-spacing: 0.5px; }

  /* ════════════════════════════════
     LIFTED QUICK ACTION PANEL
  ════════════════════════════════ */
  .db-quick-wrap {
    position: relative; z-index: 10;
    margin: -54px 16px 0;
    background: #fff;
    border-radius: 26px;
    padding: 18px 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
  }
  .db-quick-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
    color: #b0b8c4; margin-bottom: 14px;
  }
  .db-quick-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }

  .db-qbtn {
    display: flex; flex-direction: column; align-items: center; gap: 9px;
    text-decoration: none; -webkit-tap-highlight-color: transparent;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .db-qbtn:active { transform: scale(0.88); }

  .db-qicon {
    width: 52px; height: 52px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .db-qicon::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
    border-radius: inherit;
  }
  .db-qlabel { font-size: 10px; font-weight: 600; color: #4b5563; text-align: center; line-height: 1.3; }

  /* ════════════════════════════════
     CONTENT BODY
  ════════════════════════════════ */
  .db-body { padding: 22px 16px 0; }

  .db-sec { margin-bottom: 28px; }
  .db-sec-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .db-sec-left { display: flex; align-items: center; gap: 10px; }
  .db-sec-bar { width: 4px; height: 20px; border-radius: 4px; }
  .db-sec-name { font-size: 15px; font-weight: 700; color: #1a2332; letter-spacing: -0.3px; }
  .db-sec-all { font-size: 11px; font-weight: 600; color: #10956a; }

  /* ════════════════════════════════
     FEATURED LARGE CARD
  ════════════════════════════════ */
  .db-hero-card {
    border-radius: 24px; padding: 24px 20px;
    display: flex; flex-direction: column; gap: 12px;
    text-decoration: none; position: relative; overflow: hidden;
    min-height: 140px; margin-bottom: 10px;
    transition: transform 0.2s; -webkit-tap-highlight-color: transparent;
  }
  .db-hero-card:active { transform: scale(0.98); }
  .db-hero-card-shine {
    position: absolute; top: -30px; right: -30px; width: 160px; height: 160px;
    border-radius: 50%; background: rgba(255,255,255,0.1);
    pointer-events: none;
  }
  .db-hero-card-shine2 {
    position: absolute; bottom: -50px; left: 20px; width: 120px; height: 120px;
    border-radius: 50%; background: rgba(255,255,255,0.06);
    pointer-events: none;
  }
  .db-hc-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px; padding: 4px 12px; width: fit-content;
    font-size: 10px; font-weight: 600; color: #fff; letter-spacing: 0.3px;
  }
  .db-hc-title { font-size: 22px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.5px; }
  .db-hc-sub { font-size: 12px; color: rgba(255,255,255,0.7); }
  .db-hc-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px; padding: 7px 14px; width: fit-content;
    font-size: 11px; font-weight: 600; color: #fff;
    margin-top: 4px;
  }

  /* ════════════════════════════════
     2-COL MEDIUM CARDS
  ════════════════════════════════ */
  .db-grid2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }

  .db-med-card {
    border-radius: 20px; padding: 18px 16px 16px;
    display: flex; flex-direction: column; gap: 8px;
    text-decoration: none; position: relative; overflow: hidden;
    min-height: 116px;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  .db-med-card:active { transform: scale(0.95); }

  .db-med-icon-wrap {
    width: 42px; height: 42px; border-radius: 14px;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .db-med-icon-wrap::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg,rgba(255,255,255,0.3) 0%,transparent 70%);
    border-radius: inherit;
  }
  .db-med-title { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.3; }

  .db-med-arrow {
    position: absolute; bottom: 14px; right: 14px;
    width: 26px; height: 26px; border-radius: 50%;
    background: rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .db-med-glow {
    position: absolute; top: -20px; right: -20px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(255,255,255,0.08); pointer-events: none;
  }

  /* ════════════════════════════════
     EMERGENCY SOLAT JENAZAH CARD
  ════════════════════════════════ */
  .db-emergency-card {
    border-radius: 22px;
    padding: 18px 18px;
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #7b1d1d 0%, #c0392b 50%, #e74c3c 100%);
    box-shadow: 0 8px 32px rgba(192,57,43,0.4), 0 2px 8px rgba(192,57,43,0.2);
    border: 1px solid rgba(255,255,255,0.15);
    margin-bottom: 10px;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  .db-emergency-card:active { transform: scale(0.97); }

  /* Animated pulse ring for emergency feel */
  .db-emergency-card::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 22px;
    border: 2px solid rgba(255,255,255,0.1);
    animation: emergencyPulse 2s ease-in-out infinite;
    pointer-events: none;
  }

  .db-emergency-card-shine {
    position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    pointer-events: none;
  }
  .db-emergency-card-orb {
    position: absolute; bottom: -30px; left: -20px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(0,0,0,0.15);
    pointer-events: none;
  }

  .db-emergency-icon-wrap {
    width: 54px; height: 54px; border-radius: 18px; flex-shrink: 0;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }

  .db-emergency-icon-wrap::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg,rgba(255,255,255,0.25) 0%,transparent 60%);
    border-radius: inherit;
  }

  .db-emergency-text { flex: 1; z-index: 1; }
  .db-emergency-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px; padding: 2px 8px; margin-bottom: 4px;
    font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .db-emergency-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.4px; line-height: 1.2; }
  .db-emergency-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 2px; }

  .db-emergency-arrow {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    z-index: 1;
  }

  /* ════════════════════════════════
     HORIZONTAL SCROLL
     FIX: use padding-left on wrapper instead of inner div
     so the first card gets the same 16px margin as the body
  ════════════════════════════════ */
  .db-hscroll-wrap {
    overflow-x: auto;
    margin: 0 -16px;
    padding: 0 0 6px;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    scroll-padding-left: 16px;
  }
  .db-hscroll-wrap::-webkit-scrollbar { display: none; }
  .db-hscroll-inner {
    display: flex;
    gap: 10px;
    width: max-content;
    padding: 0 16px; /* left+right padding on the flex container itself */
  }

  .db-tall-card {
    width: 136px; border-radius: 22px; padding: 18px 14px;
    display: flex; flex-direction: column; justify-content: space-between;
    text-decoration: none; position: relative; overflow: hidden;
    min-height: 160px; scroll-snap-align: start;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }
  .db-tall-card:active { transform: scale(0.95); }

  .db-tall-label-wrap { margin-top: auto; }
  .db-tall-num {
    font-size: 36px; font-weight: 800; color: rgba(255,255,255,0.12);
    position: absolute; bottom: 8px; right: 12px; line-height: 1;
    font-variant-numeric: tabular-nums; letter-spacing: -2px;
    pointer-events: none; user-select: none;
  }
  .db-tall-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
  .db-tall-title { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.3; margin-top: 14px; }

  /* ════════════════════════════════
     LOCATION STRIP
  ════════════════════════════════ */
  .db-loc-strip { display: flex; flex-direction: column; gap: 10px; }

  .db-loc-card {
    background: #fff;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    text-decoration: none;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    border: 1.5px solid #f0ede8;
    transition: transform 0.18s, box-shadow 0.18s;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    position: relative;
  }
  .db-loc-card:active { transform: scale(0.97); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }

  .db-loc-left {
    width: 48px; height: 48px; border-radius: 15px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .db-loc-text { flex: 1; }
  .db-loc-name { font-size: 14px; font-weight: 700; color: #1a2332; }
  .db-loc-desc { font-size: 11px; color: #9ca3af; margin-top: 1px; }
  .db-loc-chevron { color: #d1d5db; flex-shrink: 0; }

  .db-loc-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 18px 0 0 18px; }

  /* ════════════════════════════════
     ANIMATIONS
  ════════════════════════════════ */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatMoon {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-4px) rotate(5deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,149,106,0.3); }
    50%       { box-shadow: 0 0 0 8px rgba(16,149,106,0); }
  }
  @keyframes emergencyPulse {
    0%, 100% { opacity: 0; transform: scale(1); }
    50%       { opacity: 1; transform: scale(1.005); }
  }

  .db-hero  { animation: fadeSlideUp 0.5s ease both; }
  .db-quick-wrap { animation: fadeSlideUp 0.5s 0.1s ease both; }

  .db-sec:nth-child(1) { animation: fadeSlideUp 0.5s 0.15s ease both; }
  .db-sec:nth-child(2) { animation: fadeSlideUp 0.5s 0.22s ease both; }
  .db-sec:nth-child(3) { animation: fadeSlideUp 0.5s 0.29s ease both; }
  .db-sec:nth-child(4) { animation: fadeSlideUp 0.5s 0.36s ease both; }

  .db-moonbtn svg { animation: floatMoon 3s ease-in-out infinite; }

  .db-shimmer-badge {
    background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 100%);
    background-size: 200% auto;
    animation: shimmer 2.5s linear infinite;
  }
`;

const G = {
  forest: "linear-gradient(140deg, #0d6b50 0%, #14a07a 100%)",
  ocean: "linear-gradient(140deg, #1a5fb4 0%, #3584e4 100%)",
  violet: "linear-gradient(140deg, #5e2ced 0%, #9141ac 100%)",
  sunset: "linear-gradient(140deg, #e01b24 0%, #f57800 100%)",
  teal: "linear-gradient(140deg, #00827a 0%, #26c2bc 100%)",
  amber: "linear-gradient(140deg, #c97000 0%, #f5a623 100%)",
  rose: "linear-gradient(140deg, #c01c28 0%, #e66100 100%)",
  indigo: "linear-gradient(140deg, #1c71d8 0%, #613583 100%)",
  pine: "linear-gradient(140deg, #1b5e3b 0%, #26a269 100%)",
  crimson: "linear-gradient(140deg, #a51d2d 0%, #c061cb 100%)",
  sapphire: "linear-gradient(140deg, #1565c0 0%, #0097a7 100%)",
};

export default function UserDashboard2() {
  return (
    <div className="db">
      <style>{css}</style>

      <div className="db-hero">
        <div className="db-geo" />
        <div className="db-crescent" />
        <div className="db-orb" />

        <div className="db-toprow">
          <div>
            <div className="db-greeting">Assalamualaikum</div>
            <div className="db-appname">QR Kubur</div>
            <div className="db-tagline">Funeral Guide & Management</div>
          </div>
          <div className="db-moonbtn">
            <MoonStar style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
        </div>

        <div className="db-ayah-banner">
          <div className="db-arabic">كُلُّ نَفْسٍ ذَائِقَةُ ٱلْمَوْتِ</div>
          <div className="db-trans">
            {translate("Every living being will surely taste death")}
          </div>
          <span className="db-ref">Ali 'Imran : 185</span>
        </div>
      </div>

      <div className="db-quick-wrap">
        <div className="db-quick-title">{translate("Quick Actions")}</div>
        <div className="db-quick-grid">
          {[
            {
              icon: Search,
              label: translate("Search Grave"),
              page: "SearchGrave",
              g: G.ocean,
            },
            {
              icon: QrCode,
              label: translate("Scan QR"),
              page: "ScanQR",
              g: G.forest,
            },
            {
              icon: MapPin,
              label: translate("Search Tahfiz"),
              page: "SearchTahfiz",
              g: G.violet,
            },
            {
              icon: Heart,
              label: translate("Donation"),
              page: "DonationPage",
              g: G.sunset,
            },
            {
              icon: FileText,
              label: translate("Tahlil Status"),
              page: "CheckTahlilStatus",
              g: G.crimson,
            },
            {
              icon: HelpCircle,
              label: translate("Service Status"),
              page: "CheckServiceStatus",
              g: G.teal,
            },
          ].map(({ icon: Icon, label, page, g }) => (
            <Link key={page} to={createPageUrl(page)} className="db-qbtn">
              <div
                className="db-qicon"
                style={{ background: g }}
              >
                <Icon style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <div className="db-qlabel">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="db-body">
        <div className="db-sec">
          <div className="db-sec-head">
            <div className="db-sec-left">
              <div className="db-sec-bar" style={{ background: G.forest }} />
              <div className="db-sec-name">{translate("Supplication & Doa")}</div>
            </div>
          </div>

          <Link
            to={createPageUrl("SurahPage")}
            className="db-hero-card"
            style={{ background: G.forest }}
          >
            <div className="db-hero-card-shine" />
            <div className="db-hero-card-shine2" />
            <div className="db-hc-badge db-shimmer-badge">
              <BookOpen style={{ width: 11, height: 11 }} />
              {translate("Complete Collection")}
            </div>
            <div className="db-hc-title">Surah, Doa &amp; Tahlil</div>
            <div className="db-hc-sub">Bacaan harian, tahlil & panduan doa</div>
            <div className="db-hc-btn">
              Buka sekarang <ChevronRight style={{ width: 13, height: 13 }} />
            </div>
          </Link>

          <div className="db-grid2">            
            <MedCard
              icon={BookHeart}
              title="Rukun Islam"
              page="RukunIslam"
              g={G.crimson}
            />
          </div>
        </div>

        {/* ── Zikir & Amalan ── */}
        <div className="db-sec">
          <div className="db-sec-head">
            <div className="db-sec-left">
              <div className="db-sec-bar" style={{ background: G.violet }} />
              <div className="db-sec-name">Zikir & Amalan</div>
            </div>
          </div>

          {/* Emergency Solat Jenazah — always visible, no scrolling needed */}
          <Link
            to={createPageUrl("SolatJenazah")}
            className="db-emergency-card"
          >
            <div className="db-emergency-card-shine" />
            <div className="db-emergency-card-orb" />
            <div className="db-emergency-icon-wrap">
              <Newspaper style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
            <div className="db-emergency-text">
              <div className="db-emergency-badge">
                <AlertCircle style={{ width: 8, height: 8 }} />
                Panduan Segera
              </div>
              <div className="db-emergency-title">Solat Jenazah</div>
              <div className="db-emergency-sub">Tatacara & panduan lengkap</div>
            </div>
            <div className="db-emergency-arrow">
              <ChevronRight style={{ width: 16, height: 16, color: "#fff" }} />
            </div>
          </Link>

          {/* Scrollable cards — Solat Jenazah removed */}
          <div className="db-hscroll-wrap">
            <div className="db-hscroll-inner">
              {[
                {
                  icon: BookMarked,
                  title: "Asmaul Husna",
                  page: "AsmaulHusna",
                  g: G.amber,
                  n: "01",
                },
                {
                  icon: NotebookTabs,
                  title: "Tasbih",
                  page: "Tasbih",
                  g: G.teal,
                  n: "02",
                },
                {
                  icon: Clock,
                  title: "Prayer Times",
                  page: "PrayerTimes",
                  g: G.indigo,
                  n: "03",
                },
                {
                  icon: Calendar,
                  title: "Islamic Events",
                  page: "IslamicCalendar",
                  g: G.pine,
                  n: "04",
                },
                {
                  icon: Video,
                  title: "Daily Dua",
                  page: "DailyDua",
                  g: G.violet,
                  n: "05",
                },
              ].map(({ icon: Icon, title, page, g, n }) => (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className="db-tall-card"
                  style={{ background: g }}
                >
                  <div className="db-tall-icon">
                    <Icon style={{ width: 20, height: 20, color: "#fff" }} />
                  </div>
                  <div className="db-tall-title">{title}</div>
                  <div className="db-tall-num">{n}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Lokasi & Tempat ── */}
        <div className="db-sec">
          <div className="db-sec-head">
            <div className="db-sec-left">
              <div className="db-sec-bar" style={{ background: G.amber }} />
              <div className="db-sec-name">Lokasi & Tempat</div>
            </div>
          </div>

          <div className="db-loc-strip">
            {[
              {
                icon: MapPin,
                name: "Cari Masjid",
                desc: "Masjid & surau berdekatan",
                page: "SearchMosque",
                g: G.teal,
                accent: "#14a07a",
                bg: "#e8faf5",
              },
              {
                icon: Globe,
                name: "Heritage Site",
                desc: "Tapak warisan & sejarah Islam",
                page: "SearchHeritage",
                g: G.amber,
                accent: "#c97000",
                bg: "#fef7e6",
              },
              {
                icon: MessageCircle,
                name: "Cari Waqf",
                desc: "Tanah & harta wakaf",
                page: "SearchWaqf",
                g: G.crimson,
                accent: "#a51d2d",
                bg: "#fdeaec",
              },
            ].map(({ icon: Icon, name, desc, page, g, accent, bg }) => (
              <Link key={page} to={createPageUrl(page)} className="db-loc-card">
                <div className="db-loc-accent" style={{ background: accent }} />
                <div className="db-loc-left" style={{ background: bg }}>
                  <Icon style={{ width: 22, height: 22, color: accent }} />
                </div>
                <div className="db-loc-text">
                  <div className="db-loc-name">{name}</div>
                  <div className="db-loc-desc">{desc}</div>
                </div>
                <ChevronRight
                  className="db-loc-chevron"
                  style={{ width: 16, height: 16 }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <DraggableFloatingButton />
    </div>
  );
}

function MedCard({ icon: Icon, title, page, g }) {
  return (
    <Link
      to={createPageUrl(page)}
      className="db-med-card"
      style={{ background: g }}
    >
      <div className="db-med-glow" />
      <div className="db-med-icon-wrap">
        <Icon style={{ width: 19, height: 19, color: "#fff" }} />
      </div>
      <div className="db-med-title">{title}</div>
      <div className="db-med-arrow">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5h6M5 2l3 3-3 3"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}
