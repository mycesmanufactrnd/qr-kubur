import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, Users, Building2, Heart, FileText, TrendingUp, 
  ArrowRight, BookOpen, Clock, CheckCircle, AlertCircle, Book
} from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [lang, setLang] = useState('ms');

  const t = (key) => getAdminTranslation(key, lang);

  useEffect(() => {
    loadUser();
    setLang(getCurrentLanguage());
  }, []);

  const loadUser = async () => {
    try {
      const appUserAuth = localStorage.getItem('appUserAuth');
      if (appUserAuth) {
        setUser(JSON.parse(appUserAuth));
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', user?.id],
    queryFn: async () => {
      const isSuperAdmin = user?.role === 'superadmin';
      const isTahfizAdmin = !!user?.tahfiz_center_id;
      const userStates = Array.isArray(user?.state) ? user.state : [];
      
      // Build filter queries
      const stateFilter = isSuperAdmin ? {} : { state: { $in: userStates } };
      
      const [graves, orgs, tahfiz, donations, suggestions] = await Promise.all([
        isTahfizAdmin ? [] : base44.entities.Grave.filter(stateFilter),
        isTahfizAdmin ? [] : base44.entities.Organisation.filter(stateFilter),
        base44.entities.TahfizCenter.filter(stateFilter),
        base44.entities.Donation.list(),
        base44.entities.Suggestion.list()
      ]);

      // Fetch persons based on graves in user's states
      const graveIds = graves.map(g => g.id);
      const persons = isTahfizAdmin 
        ? []
        : isSuperAdmin 
          ? await base44.entities.DeadPerson.list()
          : await base44.entities.DeadPerson.filter({ grave_id: { $in: graveIds } });

      // Tahlil requests
      const allTahlilRequests = await base44.entities.TahlilRequest.list();
      const tahlilRequests = isSuperAdmin
        ? allTahlilRequests
        : isTahfizAdmin
          ? allTahlilRequests.filter(r => r.tahfiz_center_id === user.tahfiz_center_id)
          : [];
      
      // Filter donations
      const filteredDonations = isSuperAdmin 
        ? donations 
        : isTahfizAdmin
          ? donations.filter(d => d.recipient_type === 'tahfiz' && d.tahfiz_center_id === user.tahfiz_center_id)
          : donations.filter(d => d.recipient_type === 'organisation' && d.organisation_id === user.organisation_id);

      // Filter suggestions based on role
      const filteredSuggestions = isSuperAdmin 
        ? suggestions 
        : isTahfizAdmin
          ? suggestions.filter(s => s.entity_type === 'tahfiz' && s.tahfiz_center_id === user.tahfiz_center_id)
          : suggestions.filter(s => {
              if (s.entity_type === 'organisation' && s.organisation_id) {
                return s.organisation_id === user.organisation_id;
              }
              if ((s.entity_type === 'grave' || s.entity_type === 'person') && s.state_id) {
                return userStates.includes(s.state_id);
              }
              return false;
            });
      
      return {
        graves: graves.length,
        persons: persons.length,
        organisations: orgs.length,
        tahfiz: tahfiz.length,
        totalDonations: filteredDonations.filter(d => d.status === 'verified').reduce((sum, d) => sum + (d.amount || 0), 0),
        pendingDonations: filteredDonations.filter(d => d.status === 'pending').length,
        pendingSuggestions: filteredSuggestions.filter(s => s.status === 'pending').length,
        pendingTahlil: tahlilRequests.filter(r => r.status === 'pending').length
      };
    },
    enabled: !!user
  });

  const quickStats = [
    { label: t('totalGraves'), value: stats?.graves || 0, icon: MapPin, color: 'emerald', page: 'ManageGraves' },
    { label: t('totalPersons'), value: stats?.persons || 0, icon: Users, color: 'blue', page: 'ManageDeadPersons' },
    { label: t('totalOrgs'), value: stats?.organisations || 0, icon: Building2, color: 'violet', page: 'ManageOrganisations' },
    { label: t('totalTahfiz'), value: stats?.tahfiz || 0, icon: BookOpen, color: 'amber', page: 'ManageTahfizCenters' },
  ];

  const pendingItems = [
    { label: t('totalSuggestions'), value: stats?.pendingSuggestions || 0, page: 'ManageSuggestions', color: 'orange' },
    { label: t('totalDonations'), value: stats?.pendingDonations || 0, page: 'ManageDonations', color: 'pink' },
    { label: t('totalTahlilRequests'), value: stats?.pendingTahlil || 0, page: 'ManageTahlilRequests', color: 'blue' },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'employee';

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
            <p className="text-gray-600 mb-4">{t('noPermission')}</p>
            <Link to={createPageUrl('AppUserLogin')}>
              <Button>{t('adminLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('adminDashboard')}</h1>
          <p className="text-xs text-gray-500">{user?.full_name || 'Admin'}</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
          {user?.role}
        </Badge>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {quickStats.map((stat, i) => (
            <Link key={i} to={createPageUrl(stat.page)}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                        className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center shrink-0`}
                        >
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>

                        {/* Text */}
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

      {/* Compact Pending */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            {t('pendingApproval')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-2">
            {pendingItems.map((item, i) => (
              <Link key={i} to={createPageUrl(item.page)}>
                <div className={`p-2 rounded-lg bg-${item.color}-50 hover:bg-${item.color}-100 transition-colors text-center`}>
                  <Badge variant="secondary" className={`bg-${item.color}-200 text-${item.color}-800 text-xs`}>
                    {item.value}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1 truncate">{item.label.split(' ')[0]}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compact Total */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs">{t('totalVerified')}</p>
              <p className="text-xl font-bold">RM {(stats?.totalDonations || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      {/* Compact Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">{t('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('manageGraves'), page: 'ManageGraves', icon: MapPin },
              { label: t('managePersons'), page: 'ManageDeadPersons', icon: Users },
              { label: t('manageTahfiz'), page: 'ManageTahfizCenters', icon: BookOpen },
              { label: t('manageSuggestions'), page: 'ManageSuggestions', icon: FileText },
              { label: t('manageDonations'), page: 'ManageDonations', icon: Heart },
              { label: t('manageOrgs'), page: 'ManageOrganisations', icon: Building2 },
              { label: t('manageTahlil'), page: 'ManageTahlilRequests', icon: Book },
              { label: t('manageUsers'), page: 'ManageUsers', icon: Users },
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