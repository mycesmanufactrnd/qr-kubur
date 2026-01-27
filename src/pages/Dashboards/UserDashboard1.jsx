import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, QrCode, Heart, BookOpen, FileText, Map, BookText, AlertTriangle } from 'lucide-react';
import { translate } from '@/utils/translations';
import { motion } from 'framer-motion';

export default function UserDashboard1() {
  return (
    <div className="pb-28 space-y-10">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.8rem] p-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <h1 className="text-3xl font-semibold tracking-tight">
          QR Kubur
        </h1>
        <p className="mt-3 text-sm max-w-sm opacity-90 leading-relaxed">
          {translate('Ekosistem lengkap pengurusan kubur, doa, tahlil dan amal berterusan')}
        </p>

        <div className="mt-6 flex gap-4">
          <HeroPill icon={QrCode} label={translate('Scan QR')} page="ScanQR" />
          <HeroPill icon={Search} label={translate('Cari Kubur')} page="SearchGrave" />
        </div>
      </motion.div>

      <div className="grid grid-cols-6 gap-4">

        <FeatureCard
          col="col-span-6 md:col-span-4"
          icon={AlertTriangle}
          title={translate('Solat Jenazah')}
          desc={translate('Panduan kecemasan & segera')}
          page="SolatJenazah"
          accent="from-red-500 to-rose-600"
          glow
        />

        <FeatureCard
          col="col-span-3 md:col-span-2 row-span-2"
          icon={BookOpen}
          title={translate('Request Tahlil')}
          desc={translate('Permohonan bacaan')}
          page="TahlilRequestPage"
          accent="from-indigo-500 to-violet-600"
        />

        <FeatureCard
          col="col-span-3"
          icon={FileText}
          title={translate('Status Tahlil')}
          desc={translate('Semakan permohonan')}
          page="CheckTahlilStatus"
          accent="from-sky-500 to-blue-600"
        />

        <FeatureCard
          col="col-span-3"
          icon={BookText}
          title={translate('Surah & Doa')}
          desc={translate('Bacaan rohani')}
          page="SurahPage"
          accent="from-emerald-500 to-teal-600"
        />

        <FeatureCard
          col="col-span-3"
          icon={Map}
          title={translate('Cari Tahfiz')}
          desc={translate('Sekitar anda')}
          page="SearchTahfiz"
          accent="from-fuchsia-500 to-pink-600"
        />

        <FeatureCard
          col="col-span-3"
          icon={Heart}
          title={translate('Infaq & Sedekah')}
          desc={translate('Pahala berterusan')}
          page="DonationPage"
          accent="from-rose-500 to-pink-600"
        />

      </div>
    </div>
  );
}

function HeroPill({ icon: Icon, label, page }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full hover:bg-white/30 transition">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}

function FeatureCard({ icon: Icon, title, desc, page, accent, col, glow }) {
  return (
    <Link to={createPageUrl(page)} className={col}>
      <motion.div
        whileHover={{ y: -6 }}
        className={`relative h-full rounded-[2rem] p-6 text-white shadow-xl overflow-hidden bg-gradient-to-br ${accent}`}
      >
        {glow && (
          <div className="absolute inset-0 bg-white/10 blur-2xl" />
        )}

        <Icon className="w-8 h-8 mb-4 opacity-90" />
        <h3 className="font-semibold text-lg leading-tight">
          {title}
        </h3>
        <p className="text-sm opacity-90 mt-1">
          {desc}
        </p>
      </motion.div>
    </Link>
  );
}
