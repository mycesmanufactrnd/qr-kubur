import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, Users, Building2, Heart, FileText, TrendingUp, 
  ArrowRight, BookOpen, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    loadUser();
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
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [graves, persons, orgs, tahfiz, donations, suggestions, tahlilRequests] = await Promise.all([
        base44.entities.Grave.list(),
        base44.entities.DeadPerson.list(),
        base44.entities.Organisation.list(),
        base44.entities.TahfizCenter.list(),
        base44.entities.Donation.list(),
        base44.entities.Suggestion.list(),
        base44.entities.TahlilRequest.list()
      ]);
      
      return {
        graves: graves.length,
        persons: persons.length,
        organisations: orgs.length,
        tahfiz: tahfiz.length,
        totalDonations: donations.filter(d => d.status === 'verified').reduce((sum, d) => sum + (d.amount || 0), 0),
        pendingDonations: donations.filter(d => d.status === 'pending').length,
        pendingSuggestions: suggestions.filter(s => s.status === 'pending').length,
        pendingTahlil: tahlilRequests.filter(r => r.status === 'pending').length
      };
    }
  });

  const quickStats = [
    { label: 'Tanah Perkuburan', value: stats?.graves || 0, icon: MapPin, color: 'emerald', page: 'ManageGraves' },
    { label: 'Rekod Si Mati', value: stats?.persons || 0, icon: Users, color: 'blue', page: 'ManageDeadPersons' },
    { label: 'Organisasi', value: stats?.organisations || 0, icon: Building2, color: 'violet', page: 'ManageOrganisations' },
    { label: 'Pusat Tahfiz', value: stats?.tahfiz || 0, icon: BookOpen, color: 'amber', page: 'ManageTahfizCenters' },
  ];

  const pendingItems = [
    { label: 'Cadangan Menunggu', value: stats?.pendingSuggestions || 0, icon: FileText, page: 'ManageSuggestions', color: 'orange' },
    { label: 'Derma Menunggu', value: stats?.pendingDonations || 0, icon: Heart, page: 'ManageDonations', color: 'pink' },
    { label: 'Permohonan Tahlil', value: stats?.pendingTahlil || 0, icon: Clock, page: 'ManageTahlilRequests', color: 'blue' },
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 mb-4">Anda tidak mempunyai akses kepada halaman ini.</p>
            <Link to={createPageUrl('AppUserLogin')}>
              <Button>Log Masuk</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' }
      ]} />
      
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
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
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
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
            Menunggu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-2">
            {pendingItems.map((item, i) => (
              <Link key={i} to={createPageUrl(item.page)}>
                <div className={`p-2 rounded-lg bg-${item.color}-50 hover:bg-${item.color}-100 transition-colors text-center`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-600 mx-auto mb-1`} />
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
              <p className="text-emerald-100 text-xs">Derma Terkumpul</p>
              <p className="text-xl font-bold">RM {(stats?.totalDonations || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      {/* Compact Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Aksi Pantas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Kubur', page: 'ManageGraves', icon: MapPin },
              { label: 'Si Mati', page: 'ManageDeadPersons', icon: Users },
              { label: 'Tahfiz', page: 'ManageTahfizCenters', icon: BookOpen },
              { label: 'Cadangan', page: 'ManageSuggestions', icon: FileText },
              { label: 'Derma', page: 'ManageDonations', icon: Heart },
              { label: 'Organisasi', page: 'ManageOrganisations', icon: Building2 },
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