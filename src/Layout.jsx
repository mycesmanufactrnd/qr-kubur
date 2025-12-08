import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Search, Map, MapPin, Heart, BookOpen, Settings, 
  Users, Building2, Menu, X, LogOut, QrCode, ChevronDown,
  Shield, User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.role === 'admin' || user?.admin_status === 'approved';
  const isSuperAdmin = user?.role === 'admin';

  const userNavItems = [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'Cari Kubur', icon: Search, page: 'SearchGrave' },
    { name: 'Peta Kubur', icon: MapPin, page: 'MapKubur' },
    { name: 'Peta Tahfiz', icon: Map, page: 'MapTahfiz' },
    { name: 'Imbas QR', icon: QrCode, page: 'ScanQR' },
    { name: 'Derma', icon: Heart, page: 'DonationPage' },
    { name: 'Surah & Doa', icon: BookOpen, page: 'SurahPage' },
    { name: 'Tentang Sistem', icon: Settings, page: 'AboutSystem' },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', icon: Settings, page: 'AdminDashboard' },
    { name: 'Urus Kubur', icon: MapPin, page: 'ManageGraves' },
    { name: 'Urus Si Mati', icon: Users, page: 'ManageDeadPersons' },
    { name: 'Urus Organisasi', icon: Building2, page: 'ManageOrganisations' },
    { name: 'Urus Tahfiz', icon: BookOpen, page: 'ManageTahfizCenters' },
    { name: 'Urus Cadangan', icon: Heart, page: 'ManageSuggestions' },
  ];

  const superAdminNavItems = [
    { name: 'Super Admin', icon: Shield, page: 'SuperadminDashboard' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Memuatkan...</div>
      </div>
    );
  }

  // Bottom navbar items - Main navigation
  const bottomNavItems = [
    { name: 'Utama', icon: Home, page: 'Dashboard' },
    { name: 'Cari', icon: Search, page: 'SearchGrave' },
    { name: 'Imbas', icon: QrCode, page: 'ScanQR' },
    { name: 'Peta', icon: MapPin, page: 'MapKubur' },
    { name: 'Lagi', icon: Menu, page: 'MoreMenu' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20">
      {/* Simplified Mobile Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  QR Kubur
                </h1>
              </div>
            </Link>

            {/* User Profile Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
                      {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 py-3 border-b">
                    <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    <p className="text-xs text-emerald-600 capitalize mt-1">{user.role}</p>
                  </div>
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                        Pentadbir
                      </div>
                      {adminNavItems.map((item) => (
                        <DropdownMenuItem key={item.page} asChild>
                          <Link to={createPageUrl(item.page)} className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      {superAdminNavItems.map((item) => (
                        <DropdownMenuItem key={item.page} asChild>
                          <Link to={createPageUrl(item.page)} className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 h-9 px-4 text-xs"
              >
                Log Masuk
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with padding for bottom nav */}
      <main className="px-4 py-4 min-h-[calc(100vh-140px)]">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-gray-500 active:bg-gray-100'
                }`}
              >
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}