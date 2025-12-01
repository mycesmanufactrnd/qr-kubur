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
      title: 'Peta Kubur', 
      description: 'Lihat semua tanah perkuburan di peta', 
      icon: MapPin, 
      page: 'MapKubur',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-200'
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Selamat Datang ke QR Kubur
          </h1>
          <p className="text-emerald-100 text-lg mb-6 max-w-2xl">
            Sistem pengurusan makam pintar yang memudahkan anda mencari, menziarahi, dan menguruskan makam ahli keluarga.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama si mati atau lokasi kubur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white/95 border-0 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50">
              Cari
            </Button>
          </form>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tanah Perkuburan', value: stats?.graves || 0, icon: MapPin, color: 'emerald' },
          { label: 'Rekod Si Mati', value: stats?.persons || 0, icon: Users, color: 'blue' },
          { label: 'Pusat Tahfiz', value: stats?.tahfiz || 0, icon: Building2, color: 'violet' },
          { label: 'Jumlah Derma', value: `RM ${(stats?.donations || 0).toLocaleString()}`, icon: TrendingUp, color: 'pink' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-100 flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Akses Pantas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} to={createPageUrl(action.page)}>
              <Card className={`border-0 shadow-lg ${action.shadow} hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden`}>
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg ${action.shadow}`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                  <div className="flex items-center text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                    Pergi <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mahu Mohon Tahlil?</h3>
            <p className="text-gray-600">Hubungi pusat tahfiz berhampiran untuk perkhidmatan tahlil dan bacaan Al-Quran.</p>
          </div>
          <Link to={createPageUrl('TahlilRequestPage')}>
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200">
              Mohon Tahlil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}