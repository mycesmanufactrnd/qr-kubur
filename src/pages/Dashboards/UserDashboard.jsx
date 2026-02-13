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
  Calendar,
  Video,
  MessageCircle,
  ChevronRight,
  Newspaper,
  List,
  BookMarked,
  NotebookTabs,
  Clock,
  BookHeart
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { DraggableFloatingButton } from "@/components/mobile/DraggableFloatingButton";

export default function UserDashboard2() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 pt-6 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">QR Kubur</h1>
            <p className="text-[10px] text-emerald-50 mt-0.5">
              {translate('Funeral Guide & Management')}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
            <MoonStar className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-white/95 dark:bg-gray-800 rounded-xl p-3 shadow-sm">
          <p className="text-[11px] text-gray-600 dark:text-gray-300 italic text-center">
            {translate('Every living being will surely die')}
          </p>
          <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center mt-1">
            Ali 'Imran : 185
          </p>
        </div>
      </div>
      <div className="px-4 -mt-10 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <RoundedIconButton
            icon={Search}
            label="Cari Kubur"
            page="SearchGrave"
            bgColor="bg-blue-500"
          />
          <RoundedIconButton
            icon={QrCode}
            label="Imbas QR"
            page="ScanQR"
            bgColor="bg-emerald-500"
          />
          <RoundedIconButton
            icon={MapPin}
            label="Cari Tahfiz"
            page="SearchTahfiz"
            bgColor="bg-violet-500"
          />
          <RoundedIconButton
            icon={Heart}
            label="Infaq"
            page="DonationPage"
            bgColor="bg-pink-500"
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-3 pb-2">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Perkhidmatan Agama
            </h3>
            <div className="space-y-0">
              <ListItem
                icon={BookOpen}
                title="Surah, Doa & Tahlil"
                page="SurahPage"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
              />
              <ListItem
                icon={FileText}
                title="Status Tahlil"
                page="CheckTahlilStatus"
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
              <ListItem
                icon={Video}
                title="Daily Dua"
                page="DailyDua"
                iconColor="text-purple-600"
                iconBg="bg-purple-50"
              />
              <ListItem
                icon={Calendar}
                title="Islamic Events"
                page="IslamicCalendar"
                iconColor="text-orange-600"
                iconBg="bg-orange-50"
              />
              <ListItem
                icon={Newspaper}
                title="Panduan Solat Jenazah"
                page="SolatJenazah"
                iconColor="text-red-600"
                iconBg="bg-red-50"
              />
              <ListItem
                icon={BookMarked}
                title="Asmaul Husna"
                page="AsmaulHusna"
                iconColor="text-yellow-600"
                iconBg="bg-yellow-50"
              />
              <ListItem
                icon={NotebookTabs}
                title="Tasbih"
                page="Tasbih"
                iconColor="text-teal-600"
                iconBg="bg-teal-50"
              />
              <ListItem
                icon={Clock}
                title="Prayer Times"
                page="PrayerTimes"
                iconColor="text-teal-600"
                iconBg="bg-teal-50"
              />
              <ListItem
                icon={BookHeart}
                title="Rukun Islam"
                page="RukunIslam"
                iconColor="text-pink-600"
                iconBg="bg-pink-50"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700"></div>
          <div className="p-3 pt-2">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Lokasi & Tempat
            </h3>
            <div className="space-y-0">
              <ListItem
                icon={MapPin}
                title="Cari Masjid"
                page="SearchMosque"
                iconColor="text-teal-600"
                iconBg="bg-teal-50"
              />
              <ListItem
                icon={Globe}
                title="Cari Heritage Site"
                page="SearchHeritage"
                iconColor="text-amber-600"
                iconBg="bg-amber-50"
              />
              <ListItem
                icon={MessageCircle}
                title="Cari Waqf"
                page="SearchWaqf"
                iconColor="text-rose-600"
                iconBg="bg-rose-50"
                showDivider={false}
              />
            </div>
          </div>
        </div>
      </div>
      <DraggableFloatingButton/>
    </div>
  );
}

function RoundedIconButton({ icon: Icon, label, page, bgColor }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className="flex flex-col items-center gap-1.5 active:scale-95 transition">
        <div className={`${bgColor} w-12 h-12 rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-[10px] text-white-700 dark:text-white-300 text-center font-medium leading-tight px-1">
          {label}
        </p>
      </div>
    </Link>
  );
}

function ListItem({ 
  icon: Icon, 
  title, 
  page, 
  iconColor, 
  iconBg,
  showDivider = true 
}) {
  return (
    <>
      <Link to={createPageUrl(page)}>
        <div className="flex items-center gap-2.5 py-2.5 active:bg-gray-50 dark:active:bg-gray-700/50 -mx-1 px-1 rounded-lg transition">
          <div className={`${iconBg} dark:bg-opacity-20 p-1.5 rounded-lg flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-white">
              {title}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </div>
      </Link>
      {showDivider && (
        <div className="border-b border-gray-100 dark:border-gray-700/50 ml-9"></div>
      )}
    </>
  );
}