import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { 
  MapPin, Users, Building2, Heart, FileText, TrendingUp, 
  BookOpen, Clock, Book, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate } from '@/utils/translations';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent.jsx';
import { useAdminAccess } from '@/utils/auth';
import { trpc } from '@/utils/trpc';

export default function AdminDashboard() {
  const {
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isTahfizAdmin,
  } = useAdminAccess();

  const stats = {
    totalDonations: 0,
    pendingDonations: 0, 
  }

  const { data: OGDSStats, isLoading: isOGDSLoading } = trpc.dashboard.getOGDSAdminStates.useQuery(
    { 
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      isSuperAdmin: isSuperAdmin 
    },
    { enabled: isSuperAdmin || (!!currentUser && !!currentUser.organisation) }
  );

  const { data: TTRStats, isLoading: isTTRLoading } = trpc.dashboard.getTTRAdminStates.useQuery(
    { 
      currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
      isSuperAdmin: isSuperAdmin 
    },
    { enabled: isSuperAdmin || (!!currentUser && !!currentUser.tahfizcenter) }
  );

  const { data: DDVStats, isLoading: isDDVLoading } = trpc.dashboard.getDDVAdminStates.useQuery(
    { 
      currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      isSuperAdmin: isSuperAdmin 
    },
    { 
      enabled: isSuperAdmin ||
        (!!currentUser && !!currentUser.organisation) ||
        (!!currentUser && !!currentUser.tahfizcenter) 
    }
  );

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
      label: translate('totalGraves'), 
      value: graveCount || 0, 
      icon: MapPin, 
      color: 'emerald', 
      page: 'ManageGraves',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('totalPersons'), 
      value: deadPersonCount || 0, 
      icon: Users, 
      color: 'blue', 
      page: 'ManageDeadPersons',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('totalOrgs'), 
      value: organisationCount || 0, 
      icon: Building2, 
      color: 'violet', 
      page: 'ManageOrganisations',
      disabled: isTahfizAdmin && !isSuperAdmin,
      loading: isOGDSLoading
    },
    { 
      label: translate('totalTahfiz'), 
      value: tahfizCount || 0, 
      icon: BookOpen, 
      color: 'amber', 
      page: 'ManageTahfizCenters',
      disabled: !isTahfizAdmin && !isSuperAdmin,
      loading: isTTRLoading
    },
  ];

  const pendingItems = [
    { 
      label: translate('totalSuggestions'), 
      value: suggestionCount || 0, 
      loading: isDDVLoading, 
      page: 'ManageSuggestions',
      color: 'amber' 
    },
    { 
      label: translate('totalDonations'), 
      value: donationCount || 0, 
      loading: isDDVLoading, 
      page: 'ManageDonations',
      color: 'red' 
    },
    { 
      label: translate('totalTahlilRequests'), 
      value: tahlilRequestCount || 0, 
      loading: isTTRLoading, 
      page: 'ManageTahlilRequests',
      color: 'blue' 
    },
  ];

 if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent/>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{translate('adminDashboard')}</h1>
          <p className="text-xs text-gray-500">{currentUser?.full_name || 'Admin'}</p>
        </div>
        {isSuperAdmin && (
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Badge className="w-fit bg-purple-100 text-purple-700 border-purple-200">
              To {translate('superadminDashboard')}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {quickStats.map((stat, i) => (
            <Link key={i} to={stat.disabled ? "#" : createPageUrl(stat.page)}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center shrink-0`}
                        >
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>

                        <div className="flex flex-col leading-tight">
                        <div className="text-lg font-bold text-gray-900">
                          {stat.loading ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-gray-400 rounded-full animate-spin mx-auto"></div>
                          ) : (
                            stat.value
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                            {stat.label}
                        </p>
                        </div>
                    </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            {translate('pendingApproval')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-2">
            {pendingItems.map((item, i) => (
              <Link key={i} to={createPageUrl(item.page)}>
                <div className={`p-2 rounded-lg bg-${item.color}-50 hover:bg-${item.color}-100 transition-colors text-center`}>
                  <p className='text-md'>
                    {item.loading ? (
                      <span className="inline-block w-6 h-6 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></span>
                    ) : (
                      item.value
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 truncate">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs">{translate('totalVerified')}</p>
              <p className="text-xl font-bold">
                {isDDVLoading ? (
                  <span className="inline-block w-6 h-6 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></span>
                ) : (
                  `RM ${(donationVerified || 0).toLocaleString()}`
                )}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">{translate('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: translate('manageGraves'), page: 'ManageGraves', icon: MapPin },
              { label: translate('managePersons'), page: 'ManageDeadPersons', icon: Users },
              { label: translate('manageOrgs'), page: 'ManageOrganisations', icon: Building2 },
              { label: translate('manageTahfiz'), page: 'ManageTahfizCenters', icon: BookOpen },
              { label: translate('manageSuggestions'), page: 'ManageSuggestions', icon: FileText },
              { label: translate('manageDonations'), page: 'ManageDonations', icon: Heart },
              { label: translate('manageTahlil'), page: 'ManageTahlilRequests', icon: Book },
              { label: translate('manageUsers'), page: 'ManageUsers', icon: Users },
              { label: translate('Manage Permissions'), page: 'ManagePermissions', icon: UserCheck },
            ].map((action, i) => (
              <Link key={i} to={createPageUrl(action.page)}>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-9">
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
