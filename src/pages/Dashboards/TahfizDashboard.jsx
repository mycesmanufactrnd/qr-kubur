import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  BookOpen,
  Users,
  Heart,
  Calendar,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { translate } from '@/utils/translations';

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
  } = useAdminAccess();

  const {
    TTRStats, isTTRLoading,
    DDVStats, isDDVLoading,
  } = useGetAdminDashboardStats(currentUser, isSuperAdmin);

  const tahfizCount = TTRStats?.tahfizCount ?? 0;
  const tahlilRequestCount = TTRStats?.tahlilRequestCount ?? 0;
  const donationCount = DDVStats?.donationCount ?? 0;
  const donationVerified = DDVStats?.donationVerified ?? 0;

  if (loadingUser) return <PageLoadingComponent />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* ================= Header ================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {translate('Tahfiz Dashboard')}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              السلام عليكم • {currentUser?.full_name || translate('Admin')}
            </p>
          </div>

          {isSuperAdmin && (
            <div className="flex gap-2">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-700">{translate('Admin')}</span>
                </Button>
              </Link>

              <Link to={createPageUrl('SuperAdminDashboard')}>
                <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700">{translate('Super Admin')}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ================= Stats Overview ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <Link to={createPageUrl('ManageTahfizCenters')}>
          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-orange-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-amber-700 font-medium mb-1">
                {translate('Tahfiz Centers')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {isTTRLoading ? '—' : tahfizCount}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ManageTahlilRequests')}>
          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-cyan-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-teal-700 font-medium mb-1">
                {translate('Tahlil Requests')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {isTTRLoading ? '—' : tahlilRequestCount}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ManageDonations')}>
          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-rose-700 font-medium mb-1">
                {translate('Total Donations')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                {isDDVLoading ? '—' : donationCount}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-emerald-700 font-medium mb-1">
              {translate('Verified Donations')}
            </p>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {isDDVLoading ? '—' : `RM ${donationVerified.toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ================= Main Grid ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -------- Left (2/3) -------- */}
        <div className="lg:col-span-2">
          <Card className="h-full border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                {translate('Tahfiz Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-6">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                <span className="text-amber-700 font-medium">{translate('Tahfiz Centers')}</span>
                <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {tahfizCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                <span className="text-teal-700 font-medium">{translate('Pending Tahlil Requests')}</span>
                <span className="font-bold text-lg bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {tahlilRequestCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                <span className="text-rose-700 font-medium">{translate('Total Donations')}</span>
                <span className="font-bold text-lg bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {donationCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                <span className="text-emerald-700 font-medium">{translate('Verified Donations')}</span>
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  RM {donationVerified.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* -------- Right (1/3) -------- */}
        <div>
          <Card className="h-full border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                {translate('Quick Actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-6">
              {[
                { label: translate('Manage Tahfiz Centers'), page: 'ManageTahfizCenters', icon: BookOpen, color: 'amber' },
                { label: translate('Manage Tahlil Requests'), page: 'ManageTahlilRequests', icon: Calendar, color: 'teal' },
                { label: translate('Manage Donations'), page: 'ManageDonations', icon: Heart, color: 'rose' },
                { label: translate('Manage Users'), page: 'ManageUsers', icon: Users, color: 'blue' },
                { label: translate('Manage Permissions'), page: 'ManagePermissions', icon: UserCheck, color: 'indigo' },
              ].map((action, i) => (
                <Link key={i} to={createPageUrl(action.page)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start hover:bg-${action.color}-50 transition-all group mb-2`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 flex items-center justify-center mr-3 transition-all`}>
                      <action.icon className={`w-4 h-4 text-${action.color}-600`} />
                    </div>
                    <span className="text-slate-700 group-hover:text-slate-900 font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}