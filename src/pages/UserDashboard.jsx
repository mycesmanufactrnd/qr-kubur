import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, QrCode, Heart, BookOpen, FileText, Map, LogIn, BookText, Compass } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslation, getCurrentLanguage } from '../components/translations';

export default function UserDashboard() {
  const [lang, setLang] = useState('ms');
  
  useEffect(() => {
    setLang(getCurrentLanguage());
  }, []);

  const t = (key) => getTranslation(key, lang);
  const quickActions = [
    { icon: Search, title: t('searchGrave'), page: 'SearchGrave', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { icon: QrCode, title: t('scanQR'), page: 'ScanQR', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
    { icon: Map, title: t('searchTahfiz'), page: 'SearchTahfiz', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300' },
    // { icon: Compass, title: t('qiblaCompass'), page: 'QiblaCompass', color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
    { icon: BookOpen, title: t('requestTahlil'), page: 'TahlilRequestPage', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300' },
    { icon: Heart, title: t('donate'), page: 'DonationPage', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300' },
    { icon: FileText, title: t('suggestion'), page: 'SubmitSuggestion', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' },
    { icon: BookText, title: t('surahDoa'), page: 'SurahPage', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-4 pb-2">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">QR Kubur</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Sistem Pengurusan Kubur</p>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('quickActions')}</h2>
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