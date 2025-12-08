import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  Map, Heart, BookOpen, Settings, Building2, 
  ChevronRight, Shield, Users, MapPin
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function MoreMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.admin_status === 'approved';
  const isSuperAdmin = user?.role === 'admin';

  const menuItems = [
    { 
      title: 'Peta Tahfiz', 
      description: 'Cari pusat tahfiz berhampiran', 
      icon: Map, 
      page: 'MapTahfiz',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50'
    },
    { 
      title: 'Derma', 
      description: 'Sumbang untuk pengurusan kubur', 
      icon: Heart, 
      page: 'DonationPage',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50'
    },
    { 
      title: 'Surah & Doa', 
      description: 'Baca Yasin, Tahlil, dan doa-doa', 
      icon: BookOpen, 
      page: 'SurahPage',
      color: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50'
    },
    { 
      title: 'Tentang Sistem', 
      description: 'Maklumat tentang QR Kubur', 
      icon: Settings, 
      page: 'AboutSystem',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50'
    },
  ];

  const adminMenuItems = [
    { 
      title: 'Admin Dashboard', 
      description: 'Panel kawalan pentadbir',
      icon: Settings, 
      page: 'AdminDashboard',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Urus Kubur', 
      description: 'Pengurusan tanah perkuburan',
      icon: MapPin, 
      page: 'ManageGraves',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      title: 'Urus Si Mati', 
      description: 'Pengurusan rekod si mati',
      icon: Users, 
      page: 'ManageDeadPersons',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50'
    },
    { 
      title: 'Urus Organisasi', 
      description: 'Pengurusan organisasi kubur',
      icon: Building2, 
      page: 'ManageOrganisations',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50'
    },
    { 
      title: 'Urus Tahfiz', 
      description: 'Pengurusan pusat tahfiz',
      icon: BookOpen, 
      page: 'ManageTahfizCenters',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50'
    },
    { 
      title: 'Urus Cadangan', 
      description: 'Pengurusan cadangan pengguna',
      icon: Heart, 
      page: 'ManageSuggestions',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50'
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Menu Lagi</h1>
        <p className="text-sm text-gray-500 mt-1">Akses semua ciri aplikasi</p>
      </div>

      {/* Main Menu Items */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Menu Utama
        </h2>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Link key={index} to={createPageUrl(item.page)}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Menu Pentadbir
          </h2>
          <div className="space-y-2">
            {adminMenuItems.map((item, index) => (
              <Link key={index} to={createPageUrl(item.page)}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Super Admin Section */}
      {isSuperAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Super Admin
          </h2>
          <Link to={createPageUrl('SuperadminDashboard')}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">Super Admin Panel</h3>
                    <p className="text-xs text-gray-500 truncate">Kawalan penuh sistem</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* User Info */}
      {user && (
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{user.full_name || 'User'}</p>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <p className="text-xs text-emerald-600 font-medium capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}