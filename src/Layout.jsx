import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl, useAdminAccess } from './utils/index.jsx';
import { base44 } from '@/api/base44Client';
import { PermissionsProvider, usePermissions } from './components/PermissionsContext';
import { 
  Home, Search, Map, MapPin, Heart, BookOpen, Settings, 
  Users, Building2, Menu, X, LogOut, QrCode, ChevronDown,
  Bell, FileText, Shield,
  User,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { translate } from '@/utils/translations.jsx';
import { handleLogout, removeImpersonation } from './utils/auth.jsx';
import PageLoadingComponent from './components/PageLoadingComponent.jsx';

export default function Layout({ children, currentPageName }) {
  return (
    <PermissionsProvider>
      <LayoutContent 
        children={children} 
        currentPageName={currentPageName}
      />
    </PermissionsProvider>
  );
}

function LayoutContent({ children, currentPageName }) {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
  } = useAdminAccess();

  const { clearPermissions } = usePermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState('false');

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: currentUser?.email, is_read: false }),
    enabled: !!currentUser,
  });

  const unreadCount = notifications.length;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isImpersonating = localStorage.getItem('isImpersonating');
    
    setIsImpersonating(isImpersonating);

    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    
    if (isAdmin && (currentPageName === 'AppUserLogin' )) {
      window.location.href = createPageUrl('AdminDashboard');
    }

    if (isSuperAdmin && (currentPageName === 'AppUserLogin' )) {
      window.location.href = createPageUrl('SuperadminDashboard');
    }
    
  }, [isAdmin, currentPageName, currentUser, loadingUser]);

  const onLogoutClick = () => {
    handleLogout(clearPermissions);
  };

  const adminNavItems = [
    { name: 'Admin Dashboard', icon: User, page: 'AdminDashboard' },
    { name: 'Settings', icon: Settings, page: 'SettingsPage' },
  ];
  
  const superAdminNavItems = [
    ...adminNavItems,
    { name: 'Super Admin', icon: Shield, page: 'SuperadminDashboard' },
    { name: 'Impersonate User', icon: UserX, page: 'ImpersonateUser' },
  ];

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  const bottomNavItems = [
    { name: translate('main'), icon: Home, page: 'UserDashboard' },
    { name: translate('searchNav'), icon: Search, page: 'SearchGrave' },
    { name: translate('scanNav'), icon: QrCode, page: 'ScanQR' },
    { name: translate('settingsNav'), icon: Settings, page: 'SettingsPage' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Header - Admin Only */}
      {isAdmin && (
        <header className="lg:hidden sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-emerald-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Burger Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* Logo */}
            <Link to={createPageUrl(isSuperAdmin ? 'SuperadminDashboard' : 'AdminDashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  QR Kubur
                </h1>
              </div>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                    {currentUser?.full_name?.[0] || currentUser?.email?.[0]?.toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{currentUser?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  <p className="text-xs text-emerald-600 capitalize">{currentUser?.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogoutClick} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}

      {/* Mobile Drawer - Admin Only */}
      {isAdmin && (
        <>
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          <div
            className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="p-4 space-y-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentPageName === item.page
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}

              {isSuperAdmin && (
                <>
                  <div className="border-t my-2" />
                  {superAdminNavItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        currentPageName === item.page
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Header - Desktop Only */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-emerald-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl(isSuperAdmin ? 'SuperadminDashboard' : isAdmin ? 'AdminDashboard' : 'UserDashboard')} className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
              {/* Notification */}
              {hasAdminAccess && (
                <Link to={createPageUrl('NotificationPage')} className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                        {currentUser.full_name?.[0] || currentUser.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {currentUser.full_name || currentUser.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{currentUser.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                      <p className="text-xs text-emerald-600 capitalize">{currentUser.role}</p>
                    </div>

                    {isAdmin && (
                      <>
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
                    {isImpersonating === "true" ? (
                      <DropdownMenuItem onClick={removeImpersonation} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Leave Impersonating
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={onLogoutClick} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Keluar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to={createPageUrl('AppUserLogin')}>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200"
                  >
                    Log Masuk
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 py-3 pb-20 lg:pt-6 lg:pb-6 w-full">
        {children}
      </main>

      {/* Bottom Navigation Bar - Mobile Only */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl lg:hidden">
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
      )}

      {/* Footer - Desktop Only */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-600">© {new Date().getFullYear()} QR Kubur. Hak Cipta Terpelihara.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to={createPageUrl('UserDashboard')} className="hover:text-emerald-600 transition-colors">Utama</Link>
              <Link to={createPageUrl('SurahPage')} className="hover:text-emerald-600 transition-colors">Surah & Doa</Link>
              <Link to={createPageUrl('DonationPage')} className="hover:text-emerald-600 transition-colors">Derma</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}