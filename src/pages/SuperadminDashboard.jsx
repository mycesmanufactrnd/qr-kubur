import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Users, Database, CheckCircle, XCircle, Clock, 
  Eye, Terminal, Copy, AlertCircle, Book, Sparkles
} from 'lucide-react';
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

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 mb-4">Anda tidak mempunyai akses superadmin.</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Pengurusan sistem penuh</p>
        </div>
        <Badge className="w-fit bg-purple-100 text-purple-700 border-purple-200">
          <Shield className="w-4 h-4 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pengguna', value: users.length, icon: Users },
          { label: 'Kubur', value: stats?.graves || 0, icon: Database },
          { label: 'Rekod Si Mati', value: stats?.persons || 0, icon: Database },
          { label: 'Derma', value: stats?.donations || 0, icon: Database },
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="add">
            <Database className="w-4 h-4 mr-2" />
            Tambah
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Pending Admin Approvals */}
          {pendingAdmins.length > 0 && (
            <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Clock className="w-5 h-5" />
                  Permohonan Admin ({pendingAdmins.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingAdmins.map(pendingUser => (
                    <div key={pendingUser.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{pendingUser.full_name || pendingUser.email}</p>
                        <p className="text-sm text-gray-500">{pendingUser.email}</p>
                        <p className="text-sm text-gray-500">Negeri: {pendingUser.state || '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectAdminMutation.mutate(pendingUser.id)}
                          disabled={rejectAdminMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveAdminMutation.mutate(pendingUser.id)}
                          disabled={approveAdminMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Luluskan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Users */}
          <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Senarai Pengguna</CardTitle>
            </CardHeader>
            
            {/* Mobile Cards */}
            <div className="lg:hidden px-4 pb-4 space-y-3">
              {loadingUsers ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Tiada pengguna</p>
              ) : (
                users.map(u => (
                  <div key={u.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{u.full_name || '-'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {u.role === 'admin' ? 'Admin' : 'Pengguna'}
                      </Badge>
                      {u.admin_status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">Menunggu</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <CardContent className="hidden lg:block p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Peranan</TableHead>
                    <TableHead>Negeri</TableHead>
                    <TableHead>Status Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Memuatkan...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tiada pengguna</TableCell>
                    </TableRow>
                  ) : (
                    users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role === 'admin' ? 'Admin' : 'Pengguna'}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.state || '-'}</TableCell>
                        <TableCell>
                          {u.admin_status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-700">Menunggu</Badge>
                          )}
                          {u.admin_status === 'approved' && (
                            <Badge className="bg-green-100 text-green-700">Diluluskan</Badge>
                          )}
                          {(!u.admin_status || u.admin_status === 'none') && (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Tab */}
        <TabsContent value="add" className="space-y-4">
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
                      <Terminal className="w-5 h-5 text-blue-600" />
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}