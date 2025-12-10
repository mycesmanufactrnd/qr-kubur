import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, MapPin, Map, QrCode, Heart, BookOpen, 
  ArrowRight, Users, Building2, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [graves, persons, tahfiz, donations] = await Promise.all([
        base44.entities.Grave.list(),
        base44.entities.DeadPerson.list(),
        base44.entities.TahfizCenter.list(),
        base44.entities.Donation.list()
      ]);
      return {
        graves: graves.length,
        persons: persons.length,
        tahfiz: tahfiz.length,
        donations: donations.filter(d => d.status === 'verified').reduce((sum, d) => sum + (d.amount || 0), 0)
      };
    }
  });

  const quickActions = [
    { 
      title: 'Cari Kubur', 
      description: 'Cari makam menggunakan nama atau lokasi', 
      icon: Search, 
      page: 'SearchGrave',
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200'
    },
    { 
      title: 'Peta Tahfiz', 
      description: 'Cari pusat tahfiz berhampiran', 
      icon: Map, 
      page: 'MapTahfiz',
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-200'
    },
    { 
      title: 'Imbas QR', 
      description: 'Imbas kod QR pada batu nisan', 
      icon: QrCode, 
      page: 'ScanQR',
      color: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-200'
    },
    { 
      title: 'Derma', 
      description: 'Sumbang untuk pengurusan kubur', 
      icon: Heart, 
      page: 'DonationPage',
      color: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-200'
    },
    { 
      title: 'Surah & Doa', 
      description: 'Baca Yasin, Tahlil, dan doa-doa', 
      icon: BookOpen, 
      page: 'SurahPage',
      color: 'from-amber-500 to-yellow-600',
      shadow: 'shadow-amber-200'
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl('SearchGrave') + `?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Compact Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 lg:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-xl lg:text-3xl font-bold mb-2">
            Selamat Datang ke QR Kubur
          </h1>
          <p className="text-emerald-100 text-sm lg:text-base mb-4">
            Sistem pengurusan makam pintar
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-white/95 border-0 text-gray-800 text-sm"
              />
            </div>
            <Button type="submit" className="h-11 px-6 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50">
              Cari
            </Button>
          </form>
        </div>
      </div>

      {/* Compact Actions */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Akses Pantas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {quickActions.map((action, i) => (
            <Link key={i} to={createPageUrl(action.page)}>
              <Card className={`border-0 shadow-sm hover:shadow-md transition-all`}>
                <CardContent className="p-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{action.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Compact CTA */}
      <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Mohon Tahlil</h3>
            <p className="text-xs text-gray-600">Hubungi pusat tahfiz</p>
          </div>
          <Link to={createPageUrl('TahlilRequestPage')}>
            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              Mohon
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}