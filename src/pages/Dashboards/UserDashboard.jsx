import { Link } from "react-router-dom";
import {
  Search,
  QrCode,
  BookOpen,
  Heart,
  FileText,
  MapPin,
  MoonStar,
  AlertTriangle
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function UserDashboard2() {
  return (
    <div className="space-y-6 pb-10">

      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 p-6 text-white shadow-xl">
        <MoonStar className="absolute right-4 top-4 opacity-20 w-20 h-20" />

        <h1 className="text-2xl font-bold">QR Kubur</h1>
        <p className="text-sm opacity-90 mt-1">
          Panduan & pengurusan jenazah di hujung jari
        </p>

        <div className="mt-4 bg-white/15 backdrop-blur rounded-2xl p-4">
          <p className="text-sm italic text-center">
            “Setiap yang bernyawa pasti akan mati.”
          </p>
          <p className="text-xs text-center opacity-80 mt-1">
            Ali ‘Imran : 185
          </p>
        </div>
      </div>

      <Link to={createPageUrl("SolatJenazah")}>
        <div className="mt-3 relative rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-4 hover:shadow-md transition">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <p className="font-semibold text-red-700">
              Kecemasan: Solat Jenazah
            </p>
            <p className="text-xs text-red-500">
              Panduan segera bila berlaku kematian
            </p>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-4">

        <ActionCard
          icon={Search}
          title="Cari Kubur"
          subtitle="Lokasi & maklumat"
          page="SearchGrave"
          color="from-blue-500 to-indigo-500"
        />

        <ActionCard
          icon={QrCode}
          title="Imbas QR"
          subtitle="Maklumat arwah"
          page="ScanQR"
          color="from-emerald-500 to-teal-500"
        />

        <ActionCard
          icon={MapPin}
          title="Cari Tahfiz"
          subtitle="Sekitar anda"
          page="SearchTahfiz"
          color="from-violet-500 to-fuchsia-500"
        />

        <ActionCard
          icon={Heart}
          title="Infaq & Sedekah"
          subtitle="Pahala berterusan"
          page="DonationPage"
          color="from-pink-500 to-rose-500"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-3">
          Servis Lain
        </h3>

        <div className="space-y-3">
          <GuideRow
            icon={BookOpen}
            title="Surah, Doa & Tahlil"
            desc="Bacaan untuk arwah"
            page="SurahPage"
          />
          <GuideRow
            icon={FileText}
            title="Status Tahlil"
            desc="Semak permohonan"
            page="CheckTahlilStatus"
          />
          <GuideRow
            icon={MapPin}
            title="Cari Masjid"
            desc="Lokasi & maklumat"
            page="MosquePage"
          />
          <GuideRow
            icon={MapPin}
            title="Cari Heritage SIte"
            desc="Lokasi & maklumat"
            page="SearchHeritage"
          />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, subtitle, page, color }) {
  return (
    <Link to={createPageUrl(page)}>
      <div
        className={`rounded-2xl p-4 text-white bg-gradient-to-br ${color} shadow-lg hover:scale-[1.02] transition`}
      >
        <Icon className="w-7 h-7 mb-3 opacity-90" />
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-90">{subtitle}</p>
      </div>
    </Link>
  );
}

function GuideRow({ icon: Icon, title, desc, page }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow transition">
        <Icon className="w-6 h-6 text-emerald-600" />
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
    </Link>
  );
}