import { Link } from "react-router-dom";
import {
  Search,
  QrCode,
  BookOpen,
  Heart,
  FileText,
  MapPin,
  MoonStar,
  Globe,
  ChevronRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Newspaper,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { DraggableFloatingButton } from "@/components/mobile/DraggableFloatingButton";
import doaBanners from "./DailyDoaBanner";

const todayDoa =
  doaBanners[Math.floor(Date.now() / 86400000) % doaBanners.length];

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
  .db-arabic { font-family: 'Amiri', serif; font-size: 20px; color: rgba(255,255,255,0.92); direction: rtl; text-align: right; line-height: 1.6; }
  .db-trans { font-size: 11px; color: rgba(255,255,255,0.55); font-style: italic; margin-top: 6px; line-height: 1.5; }
  .db-ref { display: inline-block; font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 4px; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 10px; letter-spacing: 0.5px; }

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

  .db-body { padding: 22px 16px 0; }

  .db-sec { margin-bottom: 28px; }

  /* ── Section header ── */
  .db-ns-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 14px;
  }
  .db-ns-dot { width: 8px; height: 8px; border-radius: 50%; }
  .db-ns-label { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.2px; }

  /* ── Feature card (full-width gradient) ── */
  .db-feat-card {
    border-radius: 22px;
    padding: 22px 20px 18px;
    min-height: 132px;
    display: flex; flex-direction: column; justify-content: space-between;
    text-decoration: none; overflow: hidden; position: relative;
    margin-bottom: 10px;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.18s;
  }
  .db-feat-card:active { transform: scale(0.97); }
  .db-feat-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
    color: rgba(255,255,255,0.6); margin-bottom: 4px;
  }
  .db-feat-title { font-size: 21px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.2; }
  .db-feat-sub { font-size: 11.5px; color: rgba(255,255,255,0.65); margin-top: 4px; }
  .db-feat-cta {
    margin-top: 14px;
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 14px; padding: 6px 14px;
    font-size: 11px; font-weight: 600; color: #fff; width: fit-content;
  }
  .db-feat-bg-icon {
    position: absolute; right: -8px; bottom: -8px;
    opacity: 0.07; pointer-events: none; user-select: none;
  }
  .db-feat-shine {
    position: absolute; top: -30px; right: -30px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(255,255,255,0.1); pointer-events: none;
  }

  /* ── Row card (white, icon + text + chevron) ── */
  .db-row-card {
    background: #fff;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; overflow: hidden; position: relative;
    border: 1.5px solid #f0ede8;
    box-shadow: 0 2px 14px rgba(0,0,0,0.05);
    transition: transform 0.18s;
    -webkit-tap-highlight-color: transparent;
    margin-bottom: 8px;
  }
  .db-row-card:active { transform: scale(0.97); }
  .db-row-card:last-child { margin-bottom: 0; }

  .db-row-icon {
    width: 46px; height: 46px; border-radius: 15px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .db-row-info { flex: 1; }
  .db-row-badge {
    display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; padding: 2px 8px; border-radius: 8px; margin-bottom: 3px;
  }
  .db-row-title { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.3; }
  .db-row-sub { font-size: 11px; color: #9ca3af; margin-top: 1px; }
  .db-row-arrow { color: #d1d5db; flex-shrink: 0; }

  .db-row-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 18px 0 0 18px; }

  /* ── Animations ── */
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

  .db-hero  { animation: fadeSlideUp 0.5s ease both; }
  .db-quick-wrap { animation: fadeSlideUp 0.5s 0.1s ease both; }
  .db-sec:nth-child(1) { animation: fadeSlideUp 0.5s 0.15s ease both; }
  .db-sec:nth-child(2) { animation: fadeSlideUp 0.5s 0.22s ease both; }
  .db-sec:nth-child(3) { animation: fadeSlideUp 0.5s 0.29s ease both; }

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

export default function UserDashboard() {
  return (
    <div className="db">
      <style>{css}</style>

      <div className="db-hero">
        <div className="db-geo" />
        <div className="db-crescent" />
        <div className="db-orb" />

        <div className="db-toprow">
          <div>
            <div className="db-greeting">{translate("Assalamualaikum")}</div>
            <div className="db-appname">QR Kubur</div>
            <div className="db-tagline">
              {translate("Funeral Guide & Management")}
            </div>
          </div>
          <div className="db-moonbtn">
            <MoonStar style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
        </div>

        <div className="db-ayah-banner">
          <div className="db-arabic">{todayDoa.doa}</div>
          {todayDoa.trans && <div className="db-trans">{todayDoa.trans}</div>}
          <span className="db-ref">{todayDoa.source}</span>
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
              icon: BookOpen,
              label: translate("Tahlil"),
              page: "SearchTahlil",
              g: G.indigo,
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
              <div className="db-qicon" style={{ background: g }}>
                <Icon style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <div className="db-qlabel">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="db-body">
        <div className="db-sec">
          <div className="db-ns-head">
            <div className="db-ns-dot" style={{ background: "#14a07a" }} />
            <div className="db-ns-label">{translate("Guidance")}</div>
          </div>

          <Link
            to={createPageUrl("SurahPage")}
            className="db-feat-card"
            style={{ background: G.forest }}
          >
            <div className="db-feat-shine" />
            <BookOpen
              className="db-feat-bg-icon"
              style={{ width: 110, height: 110 }}
            />
            <div>
              <div
                className="db-feat-eyebrow db-shimmer-badge"
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                {translate("Complete Collection")}
              </div>
              <div className="db-feat-title">
                {translate("Surah, Doa & Tahlil")}
              </div>
              <div className="db-feat-sub">
                {translate("Daily recitations, tahlil & prayer guide")}
              </div>
            </div>
            <div className="db-feat-cta">
              {translate("Open now")}{" "}
              <ChevronRight style={{ width: 12, height: 12 }} />
            </div>
          </Link>

          <Link to={createPageUrl("SolatJenazah")} className="db-row-card">
            <div className="db-row-accent" style={{ background: "#e74c3c" }} />
            <div className="db-row-icon" style={{ background: "#fff0f0" }}>
              <Newspaper style={{ width: 20, height: 20, color: "#c0392b" }} />
            </div>
            <div className="db-row-info">
              <div
                className="db-row-badge"
                style={{ background: "#fee2e2", color: "#c0392b" }}
              >
                {translate("Immediate Guide")}
              </div>
              <div className="db-row-title">{translate("Solat Jenazah")}</div>
              <div className="db-row-sub">
                {translate("Procedure & complete guide")}
              </div>
            </div>
            <ChevronRight
              className="db-row-arrow"
              style={{ width: 16, height: 16 }}
            />
          </Link>
        </div>

        <div className="db-sec">
          <div className="db-ns-head">
            <div className="db-ns-dot" style={{ background: "#c97000" }} />
            <div className="db-ns-label">{translate("Location & Places")}</div>
          </div>

          {[
            {
              icon: MapPin,
              name: translate("Search Mosque"),
              desc: translate("Nearby mosque & surau"),
              page: "SearchMosque",
              iconColor: "#14a07a",
              iconBg: "#e8faf5",
              accent: "#14a07a",
            },
            {
              icon: Globe,
              name: translate("Heritage Site"),
              desc: translate("Islamic heritage & history sites"),
              page: "SearchHeritage",
              iconColor: "#c97000",
              iconBg: "#fef7e6",
              accent: "#c97000",
            },
          ].map(
            ({ icon: Icon, name, desc, page, iconColor, iconBg, accent }) => (
              <Link key={page} to={createPageUrl(page)} className="db-row-card">
                <div className="db-row-accent" style={{ background: accent }} />
                <div className="db-row-icon" style={{ background: iconBg }}>
                  <Icon style={{ width: 20, height: 20, color: iconColor }} />
                </div>
                <div className="db-row-info">
                  <div className="db-row-title">{name}</div>
                  <div className="db-row-sub">{desc}</div>
                </div>
                <ChevronRight
                  className="db-row-arrow"
                  style={{ width: 16, height: 16 }}
                />
              </Link>
            ),
          )}
        </div>
      </div>

      <DraggableFloatingButton />
    </div>
  );
}
