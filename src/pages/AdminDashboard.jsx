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

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
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

  const isAdmin = user?.role === 'admin' || user?.admin_status === 'approved';

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 mb-4">Anda tidak mempunyai akses kepada halaman ini.</p>
            <Link to={createPageUrl('Dashboard')}>
              <Button>Kembali ke Utama</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Selamat datang, {user?.full_name || 'Admin'}</p>
        </div>
        <Badge variant="outline" className="w-fit text-emerald-600 border-emerald-200 bg-emerald-50">
          <CheckCircle className="w-4 h-4 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <Link key={i} to={createPageUrl(stat.page)}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-100 flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 group-hover:text-emerald-600 transition-colors">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Items */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Memerlukan Perhatian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {pendingItems.map((item, i) => (
              <Link key={i} to={createPageUrl(item.page)}>
                <div className={`p-4 rounded-xl bg-${item.color}-50 hover:bg-${item.color}-100 transition-colors cursor-pointer group`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <Badge variant="secondary" className={`bg-${item.color}-200 text-${item.color}-800`}>
                      {item.value}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Donations */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Jumlah Derma Terkumpul</p>
              <p className="text-3xl font-bold mt-1">RM {(stats?.totalDonations || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Aksi Pantas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Tambah Kubur Baru', page: 'ManageGraves', icon: MapPin, query: '?action=add' },
              { label: 'Tambah Rekod Si Mati', page: 'ManageDeadPersons', icon: Users, query: '?action=add' },
              { label: 'Tambah Pusat Tahfiz', page: 'ManageTahfizCenters', icon: BookOpen, query: '?action=add' },
              { label: 'Semak Cadangan', page: 'ManageSuggestions', icon: FileText },
              { label: 'Semak Derma', page: 'ManageDonations', icon: Heart },
              { label: 'Urus Organisasi', page: 'ManageOrganisations', icon: Building2 },
            ].map((action, i) => (
              <Link key={i} to={createPageUrl(action.page) + (action.query || '')}>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
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