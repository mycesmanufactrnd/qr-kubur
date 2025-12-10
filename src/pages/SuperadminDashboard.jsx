import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Users, Database, CheckCircle, XCircle, Clock, 
  Eye, Terminal, Copy, AlertCircle
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

const SQL_EXAMPLES = `-- CRUD Examples for QR Kubur Database

-- CREATE: Insert new grave
INSERT INTO Grave (cemetery_name, state, block, lot, status)
VALUES ('Tanah Perkuburan Islam Sg Buloh', 'Selangor', 'A', '123', 'active');

-- CREATE: Insert new deceased person
INSERT INTO DeadPerson (name, ic_number, date_of_death, grave_id)
VALUES ('Ahmad bin Abu', '800101-10-1234', '2024-01-15', 'grave_id_here');

-- CREATE: Insert new organisation
INSERT INTO Organisation (name, type, state, address)
VALUES ('Majlis Agama Islam Selangor', 'government', 'Selangor', 'Shah Alam');

-- CREATE: Insert new tahfiz center
INSERT INTO TahfizCenter (name, state, services_offered, phone)
VALUES ('Pusat Tahfiz Al-Quran', 'Selangor', '["tahlil_ringkas", "yasin"]', '03-12345678');

-- READ: List all graves in Selangor
SELECT * FROM Grave WHERE state = 'Selangor' ORDER BY created_date DESC;

-- READ: Find deceased by name
SELECT * FROM DeadPerson WHERE name LIKE '%Ahmad%';

-- READ: Get all pending donations
SELECT * FROM Donation WHERE status = 'pending';

-- READ: Get all pending suggestions
SELECT * FROM Suggestion WHERE status = 'pending';

-- UPDATE: Update grave status
UPDATE Grave SET status = 'full' WHERE id = 'grave_id_here';

-- UPDATE: Approve donation
UPDATE Donation SET status = 'verified' WHERE id = 'donation_id_here';

-- UPDATE: Approve suggestion
UPDATE Suggestion SET status = 'approved', admin_notes = 'Approved' WHERE id = 'suggestion_id_here';

-- DELETE: Remove a grave record
DELETE FROM Grave WHERE id = 'grave_id_here';

-- DELETE: Remove deceased record
DELETE FROM DeadPerson WHERE id = 'person_id_here';

-- AGGREGATE: Count graves by state
SELECT state, COUNT(*) as total FROM Grave GROUP BY state ORDER BY total DESC;

-- AGGREGATE: Total donations by status
SELECT status, SUM(amount) as total FROM Donation GROUP BY status;

-- JOIN: Get deceased with grave info
SELECT d.name, d.date_of_death, g.cemetery_name, g.state
FROM DeadPerson d
LEFT JOIN Grave g ON d.grave_id = g.id;
`;

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

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
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
    }
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

  const isSuperAdmin = user?.role === 'admin';

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500">Pengurusan sistem penuh</p>
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
          <Card key={i} className="border-0 shadow-md">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="add">
            <Database className="w-4 h-4 mr-2" />
            Tambah
          </TabsTrigger>
          <TabsTrigger value="sql">
            <Terminal className="w-4 h-4 mr-2" />
            SQL
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Pending Admin Approvals */}
          {pendingAdmins.length > 0 && (
            <Card className="border-0 shadow-md border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
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
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Senarai Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Create Organization Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Organization accounts must be created via the invite system. Use the "Manage Users" page to invite organizations.
              </p>
              <Link to={createPageUrl('ManageUsers')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users & Create Organization
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to={createPageUrl('ManageOrganisations') + '?action=add'}>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Database className="w-10 h-10 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Tambah Organisasi</h3>
                  <p className="text-sm text-gray-600">Tambah organisasi pengurusan baharu</p>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('Documentation')}>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Terminal className="w-10 h-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Dokumentasi Sistem</h3>
                  <p className="text-sm text-gray-600">Muat turun SRS dokumen (PDF)</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* SQL Console Tab */}
        <TabsContent value="sql">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-600" />
                SQL Console (Contoh Sahaja)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(SQL_EXAMPLES)}>
                <Copy className="w-4 h-4 mr-2" />
                Salin Semua
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Ini adalah contoh arahan SQL sahaja. Arahan tidak akan dijalankan di sini.
                </p>
              </div>
              <ScrollArea className="h-[500px]">
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg text-sm font-mono whitespace-pre-wrap">
                  {SQL_EXAMPLES}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}