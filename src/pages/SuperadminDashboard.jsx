import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Users, Database, CheckCircle, XCircle, Clock, 
  Eye, Terminal, Copy, AlertCircle, Book, Sparkles, List, CreditCard, Settings,
  User,
  UserCheck
} from 'lucide-react';
import { getAdminTranslation, getCurrentLanguage } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

export default function SuperadminDashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [lang, setLang] = useState('ms');

  const queryClient = useQueryClient();
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
      } else {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isSuperAdmin
  });

  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      const [graves, persons, orgs, tahfiz, donations, suggestions] = await Promise.all([
        base44.entities.Grave.list(),
        base44.entities.DeadPerson.list(),
        base44.entities.Organisation.list(),
        base44.entities.TahfizCenter.list(),
        base44.entities.Donation.list(),
        base44.entities.Suggestion.list()
      ]);
      
      return {
        graves: graves.length,
        persons: persons.length,
        organisations: orgs.length,
        tahfiz: tahfiz.length,
        donations: donations.length,
        suggestions: suggestions.length,
        users: users.length
      };
    },
    enabled: isSuperAdmin
  });

  const pendingAdmins = users.filter(u => u.admin_status === 'pending');

  const approveAdminMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { admin_status: 'approved', role: 'admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('Admin telah diluluskan');
    }
  });

  const rejectAdminMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { admin_status: 'none' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('Permohonan admin ditolak');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
            <p className="text-gray-600 mb-4">{t('noPermission')}</p>
            <Link to={createPageUrl('Dashboard')}>
              <Button>{getAdminTranslation('back', lang)}</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {t('superadminDashboard')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('systemStats')}</p>
        </div>
        <Badge className="w-fit bg-purple-100 text-purple-700 border-purple-200">
          <Shield className="w-4 h-4 mr-1" />
          {t('superadminDashboard')}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('manageUsers'), value: users.length, icon: Users },
          { label: t('totalGraves'), value: stats?.graves || 0, icon: Database },
          { label: t('totalPersons'), value: stats?.persons || 0, icon: Database },
          { label: t('totalDonations'), value: stats?.donations || 0, icon: Database },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="system">
            <Database className="w-4 h-4 mr-2" />
            Pengurusan Sistem
          </TabsTrigger>
        </TabsList>

        {/* System Management Tab */}
        <TabsContent value="system" className="space-y-6">

          <div className="grid md:grid-cols-3 gap-3">
            <Link to={createPageUrl('ManageUsers')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Urus Pengguna</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ManageOrganisationTypes')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <List className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Jenis Organisasi</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ManageOrganisations')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Database className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Urus Organisasi</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ViewLogs')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Terminal className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Log Aktiviti</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('Documentation')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Book className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Documentation</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('IconLibrary')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Icon Library</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ManagePaymentPlatforms')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Payment Platforms</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ManagePaymentFields')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Payment Fields</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('ManagePermissions')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Manage Permission</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}