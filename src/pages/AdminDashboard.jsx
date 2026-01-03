import { Link } from 'react-router-dom';
import { createPageUrl, getParentAndChildOrgs, useAdminAccess } from '../utils/index.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, Users, Building2, Heart, FileText, TrendingUp, 
  BookOpen, Clock, Book, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { translate } from '@/utils/translations.jsx';
import PageLoadingComponent from '../components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent.jsx';

export default function AdminDashboard() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    isAdmin, 
    isEmployee,
    isTahfizAdmin,
    currentUserStates 
  } = useAdminAccess();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', currentUser?.id],
    queryFn: async () => {
      let gravesCount = 0;
      let organisationsCount = 0;
      let deadPersonCount = 0;
      
      if (currentUser.organisation_id) {
        const orgsId = await getParentAndChildOrgs(currentUser.organisation_id);

        const graves = await base44.entities.Grave.filter({
          organisation_id: { $in: orgsId }
        });

        gravesCount = graves.length;

        const gravesIds = [...new Set(graves.map(grave => grave.id))];

        const deadPersons = await base44.entities.DeadPerson.filter({
          grave_id: { $in: gravesIds }
        });

        deadPersonCount = deadPersons.length;
        organisationsCount = orgsId.length;
      }

      let tahfizCentreCount = 0;
      if (isTahfizAdmin) {
        tahfizCentreCount = 0;
      }

      return {
        graves: gravesCount,
        persons: deadPersonCount,
        organisations: organisationsCount,
        tahfiz: tahfizCentreCount,
        totalDonations: 0,
        pendingDonations: 0, 
        pendingSuggestions: 0, 
        pendingTahlil: 0, 
      };
    },
    enabled: !!currentUser
  });

  const quickStats = [
    { 
      label: translate('totalGraves'), 
      value: stats?.graves || 0, 
      icon: MapPin, 
      color: 'emerald', 
      page: 'ManageGraves' 
    },
    { 
      label: translate('totalPersons'), 
      value: stats?.persons || 0, 
      icon: Users, 
      color: 'blue', 
      page: 'ManageDeadPersons' 
    },
    { 
      label: translate('totalOrgs'), 
      value: stats?.organisations || 0, 
      icon: Building2, 
      color: 'violet', 
      page: 'ManageOrganisations' 
    },
    { 
      label: translate('totalTahfiz'), 
      value: stats?.tahfiz || 0, 
      icon: BookOpen, 
      color: 'amber', 
      page: 'ManageTahfizCenters',
      disabled: !isTahfizAdmin,
    },
  ];

  const pendingItems = [
    { label: translate('totalSuggestions'), value: stats?.pendingSuggestions || 0, page: 'ManageSuggestions', color: 'amber' },
    { label: translate('totalDonations'), value: stats?.pendingDonations || 0, page: 'ManageDonations', color: 'red' },
    { label: translate('totalTahlilRequests'), value: stats?.pendingTahlil || 0, page: 'ManageTahlilRequests', color: 'blue' },
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

      {/* Compact Stats */}
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
                        <p className="text-lg font-bold text-gray-900">
                            {stat.value}
                        </p>
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
                  <p className='text-md'>{item.value}</p>
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
              <p className="text-xl font-bold">RM {(stats?.totalDonations || 0).toLocaleString()}</p>
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
