import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils/index';
import { 
  BookOpen, Users, Heart, Calendar, UserCheck, TrendingUp,
  Award, Clock, CheckCircle2, AlertCircle,
  Sparkles
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

export default function TahfizDashboard() {
  const {
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isTahfizAdmin,
  } = useAdminAccess();

  const {
    TTRStats, isTTRLoading,
    DDVStats, isDDVLoading,
  } = useGetAdminDashboardStats(currentUser, isSuperAdmin);

  const tahfizCount = TTRStats?.tahfizCount ?? 0;
  const tahlilRequestCount = TTRStats?.tahlilRequestCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;

  if (loadingUser) {
    return <PageLoadingComponent/>;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent/>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      {/* Header with Islamic Pattern Background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl mb-6 p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.3) 35px, rgba(255,255,255,.3) 70px)`,
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {translate('Tahfiz Dashboard')}
              </h1>
              <p className="text-emerald-100 text-sm">
                السلام عليكم • {currentUser?.full_name || translate('Admin')}
              </p>
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
                        <Link to={createPageUrl('AdminDashboard')}>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:shadow-lg transition-all px-4 py-2 gap-1">
                            <BookOpen className="w-3 h-3" />
                            {translate('Admin')}
                        </Badge>
                        </Link>
                    </>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tahfiz Centers */}
        <Link to={createPageUrl('ManageTahfizCenters')}>
          <Card className="group border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <Award className="w-5 h-5 opacity-50" />
              </div>
              <div className="text-4xl font-bold mb-1">
                {isTTRLoading ? (
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  tahfizCount
                )}
              </div>
              <p className="text-amber-100 text-sm font-medium">
                {translate('Tahfiz Centers')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Tahlil Requests */}
        <Link to={createPageUrl('ManageTahlilRequests')}>
          <Card className="group border-0 bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <Clock className="w-5 h-5 opacity-50" />
              </div>
              <div className="text-4xl font-bold mb-1">
                {isTTRLoading ? (
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  tahlilRequestCount
                )}
              </div>
              <p className="text-teal-100 text-sm font-medium">
                {translate('Tahlil Requests')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Donations */}
        <Link to={createPageUrl('ManageDonations')}>
          <Card className="group border-0 bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Heart className="w-6 h-6" />
                </div>
                <AlertCircle className="w-5 h-5 opacity-50" />
              </div>
              <div className="text-4xl font-bold mb-1">
                {isDDVLoading ? (
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  donationCount
                )}
              </div>
              <p className="text-rose-100 text-sm font-medium">
                {translate('Total Donations')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Verified Donations */}
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-50" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {isDDVLoading ? (
                <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                `RM ${(donationVerified || 0).toLocaleString()}`
              )}
            </div>
            <p className="text-emerald-100 text-sm font-medium">
              {translate('Total Verified')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-6">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            {translate('Management Center')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                label: translate('Manage Tahfiz Centers'), 
                page: 'ManageTahfizCenters', 
                icon: BookOpen,
                gradient: 'from-amber-500 to-orange-500',
                description: 'Oversee and manage Tahfiz centers'
              },
              { 
                label: translate('Manage Tahlil Requests'), 
                page: 'ManageTahlilRequests', 
                icon: Calendar,
                gradient: 'from-teal-500 to-cyan-500',
                description: 'Review and process Tahlil requests'
              },
              { 
                label: translate('Manage Donations'), 
                page: 'ManageDonations', 
                icon: Heart,
                gradient: 'from-rose-500 to-pink-500',
                description: 'Track and verify donations'
              },
              { 
                label: translate('Manage Users'), 
                page: 'ManageUsers', 
                icon: Users,
                gradient: 'from-blue-500 to-indigo-500',
                description: 'User accounts and profiles'
              },
              { 
                label: translate('Manage Permissions'), 
                page: 'ManagePermissions', 
                icon: UserCheck,
                gradient: 'from-violet-500 to-purple-500',
                description: 'Control access and permissions'
              },
            ].map((action, i) => (
              <Link key={i} to={createPageUrl(action.page)}>
                <div className="group p-5 rounded-2xl border-2 border-gray-100 hover:border-emerald-200 bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors">
                        {action.label}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decorative Footer Pattern */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">System Active</span>
        </div>
      </div>
    </div>
  );
}