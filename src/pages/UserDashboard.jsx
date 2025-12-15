import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, QrCode, Heart, BookOpen, FileText, Map, LogIn, BookText, Compass } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserDashboard() {
  const quickActions = [
    { icon: Search, title: 'Cari Kubur', page: 'SearchGrave', color: 'bg-blue-100 text-blue-600' },
    { icon: QrCode, title: 'Imbas QR', page: 'ScanQR', color: 'bg-emerald-100 text-emerald-600' },
    { icon: Map, title: 'Cari Tahfiz', page: 'SearchTahfiz', color: 'bg-violet-100 text-violet-600' },
    { icon: Compass, title: 'Kompas Kiblat', page: 'QiblaCompass', color: 'bg-green-100 text-green-600' },
    { icon: BookOpen, title: 'Mohon Tahlil', page: 'TahlilRequestPage', color: 'bg-teal-100 text-teal-600' },
    { icon: Heart, title: 'Derma', page: 'DonationPage', color: 'bg-pink-100 text-pink-600' },
    { icon: FileText, title: 'Cadangan', page: 'SubmitSuggestion', color: 'bg-amber-100 text-amber-600' },
    { icon: BookText, title: 'Surah & Doa', page: 'SurahPage', color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="space-y-4 pb-2">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">QR Kubur</h1>
        <p className="text-sm text-gray-500">Sistem Pengurusan Kubur</p>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Akses Pantas</h2>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={createPageUrl(action.page)}>
                <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}