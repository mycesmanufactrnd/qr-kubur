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
  const [roleOverride, setRoleOverride] = useState(() => localStorage.getItem('roleOverride') || null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Check for AppUser authentication first
      const appUserAuth = localStorage.getItem('appUserAuth');
      
      if (appUserAuth) {
        const appUser = JSON.parse(appUserAuth);
        setUser({
          ...appUser,
          role: 'admin',
          admin_type: appUser.admin_type || 'admin',
          state: appUser.state || [],
          isAppUser: true
        });
        setLoading(false);
        return;
      }

      let userData = await base44.auth.me();

      // Apply role override for testing
      if (roleOverride && userData) {
        try {
          const parsed = JSON.parse(roleOverride);
          userData = {
            ...userData,
            role: 'admin',
            admin_type: 'admin',
            state: [parsed.state]
          };
        } catch {
          userData = {
            ...userData,
            role: roleOverride === 'user' ? 'user' : 'admin',
            admin_type: roleOverride === 'superadmin' ? 'superadmin' : (roleOverride === 'admin' ? 'admin' : 'none')
          };
        }
      }

      setUser(userData);
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  };
  
  const handleRoleSwitch = (role, state = null) => {
    const roleData = state ? JSON.stringify({ role, state }) : role;
    localStorage.setItem('roleOverride', roleData);
    setRoleOverride(roleData);
    window.location.reload();
  };

  const clearRoleOverride = () => {
    localStorage.removeItem('roleOverride');
    setRoleOverride(null);
    window.location.reload();
  };

  const handleLogout = () => {
    // Clear AppUser authentication
    localStorage.removeItem('appUserAuth');
    localStorage.removeItem('roleOverride');
    
    // If regular user, use base44 logout
    if (user && !user.isAppUser) {
      base44.auth.logout();
    } else {
      window.location.href = '/';
    }
  };

  const isSuperAdmin = user?.type === 'superadmin' || (user?.role === 'admin' && user?.admin_type === 'superadmin');
  const isOrganization = user?.type === 'organization';
  const isAdmin = user?.type === 'organization' || user?.type === 'employee' || user?.role === 'admin' || user?.admin_status === 'approved';

  const userNavItems = [
    { name: 'Dashboard', icon: Home, page: 'UserDashboard' },
    { name: 'Cari Kubur', icon: Search, page: 'SearchGrave' },
    { name: 'Cari Tahfiz', icon: Map, page: 'SearchTahfiz' },
    { name: 'Imbas QR', icon: QrCode, page: 'ScanQR' },
    { name: 'Derma', icon: Heart, page: 'DonationPage' },
    { name: 'Surah & Doa', icon: BookOpen, page: 'SurahPage' },
    { name: 'Tentang Sistem', icon: Settings, page: 'AboutSystem' },
  ];

  const organizationNavItems = [
    { name: 'Manage Employees', icon: Users, page: 'ManageEmployees' },
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

  // Bottom navbar items - Main navigation for mobile
  const bottomNavItems = [
    { name: 'Utama', icon: Home, page: 'UserDashboard' },
    { name: 'Cari', icon: Search, page: 'SearchGrave' },
    { name: 'Imbas', icon: QrCode, page: 'ScanQR' },
    { name: 'Tetapan', icon: Settings, page: 'SettingsPage' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header - Desktop Only */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  QR Kubur
                </h1>
                <p className="text-xs text-gray-500">Smart Grave Management</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {userNavItems.slice(0, 4).map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPageName === item.page
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-600">
                    Lagi <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {userNavItems.slice(4).map((item) => (
                    <DropdownMenuItem key={item.page} asChild>
                      <Link to={createPageUrl(item.page)} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Role Switcher - Dev/Testing Only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    {(() => {
                      if (!roleOverride) return 'Role';
                      try {
                        const parsed = JSON.parse(roleOverride);
                        return `Admin (${parsed.state})`;
                      } catch {
                        return roleOverride.charAt(0).toUpperCase() + roleOverride.slice(1);
                      }
                    })()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => handleRoleSwitch('superadmin')}>
                    <Shield className="w-4 h-4 mr-2" />
                    Super Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSwitch('admin')}>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin (All States)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"].map(state => (
                    <DropdownMenuItem key={state} onClick={() => handleRoleSwitch('admin', state)}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Admin ({state})
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleSwitch('user')}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    User
                  </DropdownMenuItem>
                  {roleOverride && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearRoleOverride} className="text-red-600">
                        <X className="w-4 h-4 mr-2" />
                        Clear Override
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {user.full_name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-emerald-600 capitalize">{user.role}</p>
                    </div>
                    
                    {isOrganization && (
                      <>
                        <DropdownMenuSeparator />
                        {organizationNavItems.map((item) => (
                          <DropdownMenuItem key={item.page} asChild>
                            <Link to={createPageUrl(item.page)} className="flex items-center gap-2">
                              <item.icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}

                    {isAdmin && !isOrganization && (
                      <>
                        <DropdownMenuSeparator />
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
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200"
                >
                  Log Masuk
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 pb-20 lg:pt-6 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl lg:hidden">
        <div className="flex items-center justify-around py-1">
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

      {/* Footer - Desktop Only */}
      <footer className="bg-white border-t border-gray-100 mt-auto hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-600">© 2024 QR Kubur. Hak Cipta Terpelihara.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to={createPageUrl('Dashboard')} className="hover:text-emerald-600 transition-colors">Utama</Link>
              <Link to={createPageUrl('SurahPage')} className="hover:text-emerald-600 transition-colors">Surah & Doa</Link>
              <Link to={createPageUrl('DonationPage')} className="hover:text-emerald-600 transition-colors">Derma</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}