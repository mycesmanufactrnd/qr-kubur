import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, CheckCircle, XCircle, Clock, Eye, Filter, ExternalLink } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import LoadingUser from '../components/LoadingUser';
import Breadcrumb from '../components/Breadcrumb';

export default function ManageDonations() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [lang, setLang] = useState('ms');

  const queryClient = useQueryClient();
  const t = (key) => getAdminTranslation(key, lang);

  React.useEffect(() => {
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

  const isSuperAdmin = user?.role === 'superadmin';
  const hasViewPermission = isSuperAdmin || user?.permissions?.donations?.view;

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['admin-donations', user?.organisation_id, user?.tahfiz_center_id],
    queryFn: async () => {
      const allDonations = await base44.entities.Donation.list('-created_date');
      
      // If superadmin, return all
      if (isSuperAdmin) return allDonations;
      
      // Tahfiz center admin - filter by tahfiz center
      if (user?.tahfiz_center_id) {
        return allDonations.filter(d => 
          d.recipient_type === 'tahfiz' && d.tahfiz_center_id === user.tahfiz_center_id
        );
      }
      
      // Organization admin - filter by organization
      if (user?.organisation_id) {
        return allDonations.filter(d => 
          d.recipient_type === 'organisation' && d.organisation_id === user.organisation_id
        );
      }
      
      return [];
    },
    enabled: !!user && hasViewPermission
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Donation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-donations']);
      setIsDialogOpen(false);
      setSelectedDonation(null);
      toast.success('Status derma telah dikemaskini');
    }
  });

  const filteredDonations = donations.filter(d => {
    return filterStatus === 'all' || d.status === filterStatus;
  });

  const totalVerified = donations
    .filter(d => d.status === 'verified')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const openDetailDialog = (donation) => {
    setSelectedDonation(donation);
    setIsDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedDonation) return;
    updateMutation.mutate({
      id: selectedDonation.id,
      data: { status: 'verified' }
    });

    // Create notification if donor has email
    if (selectedDonation.donor_email) {
      try {
        await base44.entities.Notification.create({
          user_email: selectedDonation.donor_email,
          type: 'donation',
          title: 'Derma Disahkan',
          message: `Derma anda sebanyak RM${selectedDonation.amount?.toFixed(2)} telah disahkan.`,
          related_id: selectedDonation.id,
          status: 'verified'
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'donation_verify',
        function_name: 'ManageDonations',
        user_email: user?.email,
        level: 'info',
        summary: `Derma disahkan: RM${selectedDonation.amount}`,
        details: { donation_id: selectedDonation.id, amount: selectedDonation.amount },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedDonation) return;
    updateMutation.mutate({
      id: selectedDonation.id,
      data: { status: 'rejected' }
    });

    // Create notification if donor has email
    if (selectedDonation.donor_email) {
      try {
        await base44.entities.Notification.create({
          user_email: selectedDonation.donor_email,
          type: 'donation',
          title: 'Derma Ditolak',
          message: `Derma anda sebanyak RM${selectedDonation.amount?.toFixed(2)} telah ditolak.`,
          related_id: selectedDonation.id,
          status: 'rejected'
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'donation_reject',
        function_name: 'ManageDonations',
        user_email: user?.email,
        level: 'warn',
        summary: `Derma ditolak: RM${selectedDonation.amount}`,
        details: { donation_id: selectedDonation.id, amount: selectedDonation.amount },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const getRecipientName = (donation) => {
    if (donation.organisation_id) {
      const org = organisations.find(o => o.id === donation.organisation_id);
      return org?.name || 'Organisasi';
    }
    if (donation.tahfiz_center_id) {
      const center = tahfizCenters.find(c => c.id === donation.tahfiz_center_id);
      return center?.name || 'Pusat Tahfiz';
    }
    return '-';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Disahkan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingUser || isLoading) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'Admin Dashboard', page: 'AdminDashboard' },
          { label: 'Urus Derma', page: 'ManageDonations' }
        ]} />
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600">Anda tidak mempunyai kebenaran untuk mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Admin Dashboard', page: 'AdminDashboard' },
        { label: 'Urus Derma', page: 'ManageDonations' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            Urus Derma
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {donations.filter(d => d.status === 'pending').length} menunggu pengesahan
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white">
          <CardContent className="p-4">
            <p className="text-emerald-100 text-sm">Jumlah Disahkan</p>
            <p className="text-2xl font-bold">RM {totalVerified.toLocaleString()}</p>
          </CardContent>
        </Card>
        {[
          { label: 'Menunggu', value: donations.filter(d => d.status === 'pending').length, color: 'yellow' },
          { label: 'Disahkan', value: donations.filter(d => d.status === 'verified').length, color: 'green' },
          { label: 'Ditolak', value: donations.filter(d => d.status === 'rejected').length, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder={t('allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="verified">{t('verified')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredDonations.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredDonations.map(donation => (
            <Card key={donation.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {donation.donor_name || t('anonymous')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getRecipientName(donation)}</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      RM {donation.amount?.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(donation.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(donation.created_date).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openDetailDialog(donation)} className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penderma</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">{t('loading')}</TableCell>
                </TableRow>
              ) : filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">{t('noRecords')}</TableCell>
                </TableRow>
              ) : (
                filteredDonations.map(donation => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium">
                      {donation.donor_name || 'Tanpa Nama'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getRecipientName(donation)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      RM {donation.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(donation.status)}</TableCell>
                    <TableCell>
                      {new Date(donation.created_date).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(donation)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('details')}</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Penderma</p>
                  <p className="font-semibold">{selectedDonation.donor_name || 'Tanpa Nama'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah</p>
                  <p className="font-semibold text-lg text-emerald-600">
                    RM {selectedDonation.amount?.toFixed(2)}
                  </p>
                </div>
              </div>
              {selectedDonation.donor_email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{selectedDonation.donor_email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Penerima</p>
                <p>{getRecipientName(selectedDonation)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kaedah Pembayaran</p>
                <p className="capitalize">{selectedDonation.payment_method?.replace('_', ' ')}</p>
              </div>
              {selectedDonation.notes && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p>{selectedDonation.notes}</p>
                </div>
              )}
              {selectedDonation.receipt_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Resit</p>
                  <a 
                    href={selectedDonation.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lihat Resit
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status Semasa</p>
                {getStatusBadge(selectedDonation.status)}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Tutup
            </Button>
            {selectedDonation?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  onClick={handleVerify}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sahkan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}