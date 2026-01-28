import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { Search, QrCode, Heart, BookOpen, FileText, Map, BookText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { translate } from '@/utils/translations';

export default function UserDashboard() {
  const quickActions = [
    { icon: Search, title: translate('Search Grave'), page: 'SearchGrave', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { icon: QrCode, title: translate('Scan QR'), page: 'ScanQR', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
    { icon: Map, title: translate('Search Tahfiz'), page: 'SearchTahfiz', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300' },
    { icon: BookOpen, title: translate('Request Tahlil'), page: 'TahlilRequestPage', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300' },
    { icon: FileText, title: translate('Check Tahlil Status'), page: 'CheckTahlilStatus', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' },
    { icon: Heart, title: translate('Donate'), page: 'DonationPage', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300' },
    { icon: FileText, title: translate('Suggestions'), page: 'SubmitSuggestion', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' },
    { icon: BookText, title: translate('Surah & Prayer'), page: 'SurahPage', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
    { icon: BookText, title: translate('Funeral Prayer Guide'), page: 'SolatJenazah', color: 'bg-indigo-100 text-black-600 dark:bg-emerald-900 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-4 pb-2">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{translate('Grave QR')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Grave Management System')}</p>
      </div>
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{translate('Quick Actions')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={createPageUrl(action.page)}>
                <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}