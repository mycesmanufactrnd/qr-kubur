import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils/index';
import { 
  MapPin, Users, Building2, Heart, FileText, TrendingUp, 
  BookOpen, Clock, Book, UserCheck, BarChart3, Activity,
  Sparkles, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate } from '@/utils/translations';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent.jsx';
import { useAdminAccess } from '@/utils/auth';
import useGetAdminDashboardStats from '../../hooks/useDashboardMutations';

export default function AdminDashboard() {
  const {
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isTahfizAdmin,
  } = useAdminAccess();

  const {
    OGDSStats, isOGDSLoading,
    TTRStats, isTTRLoading,
    DDVStats, isDDVLoading,
  } = useGetAdminDashboardStats(currentUser, isSuperAdmin);

  const organisationCount = OGDSStats?.organisationCount ?? 0;
  const graveCount = OGDSStats?.graveCount ?? 0;
  const deadPersonCount = OGDSStats?.deadPersonCount ?? 0;
  const suggestionCount = OGDSStats?.suggestionCount ?? 0;
  const tahfizCount = TTRStats?.tahfizCount ?? 0;
  const tahlilRequestCount = TTRStats?.tahlilRequestCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;

  const quickStats = [
    { 
      label: translate('Total Graves'), 
      value: graveCount || 0, 
      icon: MapPin, 
      color: 'emerald', 
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      page: 'ManageGraves',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('Total Deceased'), 
      value: deadPersonCount || 0, 
      icon: Users, 
      color: 'blue', 
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      page: 'ManageDeadPersons',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('Total Organisations'), 
      value: organisationCount || 0, 
      icon: Building2, 
      color: 'violet', 
      bgColor: 'bg-violet-500',
      lightBg: 'bg-violet-50',
      page: 'ManageOrganisations',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('Total Tahfiz'), 
      value: tahfizCount || 0, 
      icon: BookOpen, 
      color: 'amber', 
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      page: 'ManageTahfizCenters',
      disabled: !isTahfizAdmin && !isSuperAdmin,
      loading: isTTRLoading
    },
  ];

  const pendingItems = [
    { 
      label: translate('Total Suggestions'), 
      value: suggestionCount || 0, 
      loading: isDDVLoading, 
      page: 'ManageSuggestions',
      color: 'amber',
      icon: FileText
    },
    { 
      label: translate('Total Donations'), 
      value: donationCount || 0, 
      loading: isDDVLoading, 
      page: 'ManageDonations',
      color: 'red',
      icon: Heart
    },
    { 
      label: translate('Total Tahlil Requests'), 
      value: tahlilRequestCount || 0, 
      loading: isTTRLoading, 
      page: 'ManageTahlilRequests',
      color: 'blue',
      icon: Book
    },
  ];

  if (loadingUser) {
    return <PageLoadingComponent/>;
  }

  if (!hasAdminAccess || isTahfizAdmin) {
    return <AccessDeniedComponent/>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-6">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {translate('Admin Dashboard')}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {currentUser?.full_name || translate('Admin')} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isSuperAdmin && (
              <>
                <Link to={createPageUrl('SuperAdminDashboard')}>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:shadow-lg transition-all px-4 py-2 gap-1">
                    <Sparkles className="w-3 h-3" />
                    {translate('Super Admin')}
                  </Badge>
                </Link>
                <Link to={createPageUrl('TahfizDashboard')}>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:shadow-lg transition-all px-4 py-2 gap-1">
                    <BookOpen className="w-3 h-3" />
                    {translate('Tahfiz')}
                  </Badge>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <Link key={i} to={stat.disabled ? "#" : createPageUrl(stat.page)} className="group">
              <Card className="relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.lightBg} rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
                
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-md`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.loading ? (
                        <InlineLoadingComponent/>
                      ) : (
                        stat.value.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals - Left Column (2/3) */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                {translate('Pending Approvals')}
                <Badge variant="outline" className="ml-auto text-xs">
                  {pendingItems.reduce((sum, item) => sum + (item.value || 0), 0)} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {pendingItems.map((item, i) => (
                  <Link key={i} to={createPageUrl(item.page)}>
                    <div className="group relative p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`p-3 bg-${item.color}-100 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">
                            {item.loading ? (
                              <InlineLoadingComponent/>
                            ) : (
                              item.value
                            )}
                          </p>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card - Right Column (1/3) */}
        <div>
          <Card className="border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-emerald-200" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">
                  {translate('Total Verified')}
                </p>
                <p className="text-4xl font-bold mb-4">
                  {isDDVLoading ? (
                    <InlineLoadingComponent/>
                  ) : (
                    `RM ${(donationVerified || 0).toLocaleString()}`
                  )}
                </p>
                <div className="flex items-center gap-2 text-emerald-100 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                    <span>Live tracking</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6 border-0 shadow-lg bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            {translate('Quick Actions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: translate('Manage Graves'), page: 'ManageGraves', icon: MapPin, color: 'emerald' },
              { label: translate('Manage Deceased'), page: 'ManageDeadPersons', icon: Users, color: 'blue' },
              { label: translate('Manage Organisations'), page: 'ManageOrganisations', icon: Building2, color: 'violet' },
              { label: translate('Manage Tahfiz'), page: 'ManageTahfizCenters', icon: BookOpen, color: 'amber' },
              { label: translate('Manage Suggestions'), page: 'ManageSuggestions', icon: FileText, color: 'orange' },
              { label: translate('Manage Donations'), page: 'ManageDonations', icon: Heart, color: 'red' },
              { label: translate('Manage Tahlil'), page: 'ManageTahlilRequests', icon: Book, color: 'cyan' },
              { label: translate('Manage Users'), page: 'ManageUsers', icon: Users, color: 'indigo' },
              { label: translate('Manage Permissions'), page: 'ManagePermissions', icon: UserCheck, color: 'purple' },
            ].map((action, i) => (
              <Link key={i} to={createPageUrl(action.page)}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto flex-col items-start p-4 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white hover:border-gray-300 transition-all group"
                >
                  <action.icon className={`w-5 h-5 text-${action.color}-600 mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-medium text-gray-700 text-left leading-tight">
                    {action.label}
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}