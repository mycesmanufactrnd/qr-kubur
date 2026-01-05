import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingUser from '../components/PageLoadingComponent';
import Breadcrumb from '../components/Breadcrumb';
import { usePermissions } from '../components/PermissionsContext';
import { translate } from '@/utils/translations';
import { showSuccess } from '@/components/ToastrNotification';

export default function ManageSuggestions() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [lang, setLang] = useState('ms');

  const queryClient = useQueryClient();

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

  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const hasViewPermission = hasPermission('suggestions_view');
  const hasApprovePermission = hasPermission('suggestions_approve');
  const hasRejectPermission = hasPermission('suggestions_reject');

  const { data: allSuggestions = [], isLoading } = useQuery({
    queryKey: ['admin-suggestions'],
    queryFn: () => base44.entities.Suggestion.list('-created_date'),
    enabled: !!user && hasViewPermission
  });

  const { data: graves = [] } = useQuery({
    queryKey: ['graves-for-suggestions'],
    queryFn: () => base44.entities.Grave.list(),
    enabled: !!user
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons-for-suggestions'],
    queryFn: () => base44.entities.DeadPerson.list(),
    enabled: !!user
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations-for-suggestions'],
    queryFn: () => base44.entities.Organisation.list(),
    enabled: !!user
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz-for-suggestions'],
    queryFn: () => base44.entities.TahfizCenter.list(),
    enabled: !!user
  });

  // Filter suggestions based on user role
  const suggestions = useMemo(() => {
    if (!user) return [];
    
    if (isSuperAdmin) {
      return allSuggestions;
    }

    // Admin filters by their context
    return allSuggestions.filter(s => {
      // Organisation admin - can only see their organisation's suggestions
      if (s.entity_type === 'organisation' && s.organisation_id) {
        return s.organisation_id === user.organisation_id;
      }
      
      // Tahfiz admin - can only see their tahfiz center's suggestions
      if (s.entity_type === 'tahfiz' && s.tahfiz_center_id) {
        // Check if admin manages this tahfiz center (via organisation or direct permission)
        return s.tahfiz_center_id === user.tahfiz_center_id;
      }
      
      // State admin - can only see suggestions for their assigned states
      if ((s.entity_type === 'grave' || s.entity_type === 'person') && s.state_id) {
        const adminStates = user.state || [];
        return adminStates.includes(s.state_id);
      }
      
      return false;
    });
  }, [allSuggestions, user, isSuperAdmin]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Suggestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-suggestions']);
      setIsDialogOpen(false);
      setSelectedSuggestion(null);
      showSuccess('Cadangan telah dikemaskini');
    }
  });

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      return filterStatus === 'all' || s.status === filterStatus;
    });
  }, [suggestions, filterStatus]);

  if (loadingUser) {
    return <LoadingUser />;
  }

  if (!hasViewPermission) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('adminDashboard'), page: 'AdminDashboard' },
          { label: translate('manageSuggestionsTitle'), page: 'ManageSuggestions' }
        ]} />
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{translate('accessDenied')}</h2>
            <p className="text-gray-600">{translate('noPermission')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEntityDetails = (suggestion) => {
    if (suggestion.entity_type === 'grave' && suggestion.grave_id) {
      const grave = graves.find(g => g.id === suggestion.grave_id);
      return {
        main: grave ? `${grave.cemetery_name} - ${grave.state}` : 'Tidak dijumpai',
        secondary: null
      };
    }
    if (suggestion.entity_type === 'person' && suggestion.dead_person_id) {
      const person = persons.find(p => p.id === suggestion.dead_person_id);
      const grave = suggestion.grave_id ? graves.find(g => g.id === suggestion.grave_id) : null;
      return {
        main: person ? `${person.name} (${person.ic_number || 'Tiada IC'})` : 'Tidak dijumpai',
        secondary: grave ? `Lokasi: ${grave.cemetery_name}, ${grave.block || ''} ${grave.lot || ''} - ${grave.state}` : null
      };
    }
    if (suggestion.entity_type === 'organisation' && suggestion.organisation_id) {
      const org = organisations.find(o => o.id === suggestion.organisation_id);
      return {
        main: org ? `${org.name} - ${Array.isArray(org.state) ? org.state.join(', ') : org.state}` : 'Tidak dijumpai',
        secondary: null
      };
    }
    if (suggestion.entity_type === 'tahfiz' && suggestion.tahfiz_center_id) {
      const tahfiz = tahfizCenters.find(t => t.id === suggestion.tahfiz_center_id);
      return {
        main: tahfiz ? `${tahfiz.name} - ${tahfiz.state}` : 'Tidak dijumpai',
        secondary: null
      };
    }
    return { main: '-', secondary: null };
  };

  const openDetailDialog = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'approved', admin_notes: adminNotes }
    });

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'suggestion_approve',
        function_name: 'ManageSuggestions',
        user_email: user?.email,
        level: 'info',
        summary: `Cadangan diluluskan: ${selectedSuggestion.entity_type}`,
        details: { suggestion_id: selectedSuggestion.id, entity_type: selectedSuggestion.entity_type },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion) return;
    updateMutation.mutate({
      id: selectedSuggestion.id,
      data: { status: 'rejected', admin_notes: adminNotes }
    });

    // Log activity
    try {
      await base44.entities.LogActivity.create({
        activity_type: 'suggestion_reject',
        function_name: 'ManageSuggestions',
        user_email: user?.email,
        level: 'warn',
        summary: `Cadangan ditolak: ${selectedSuggestion.entity_type}`,
        details: { suggestion_id: selectedSuggestion.id, entity_type: selectedSuggestion.entity_type },
        success: true
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{translate('pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{translate('approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{translate('rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      person: translate('recordPerson'),
      grave: translate('recordGrave'),
      organisation: translate('recordOrg'),
      tahfiz: translate('recordTahfiz')
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('adminDashboard'), page: 'AdminDashboard' },
        { label: translate('manageSuggestionsTitle'), page: 'ManageSuggestions' }
      ]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            {translate('manageSuggestionsTitle')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {suggestions.filter(s => s.status === 'pending').length} {translate('awaitingReview')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: translate('pending'), value: suggestions.filter(s => s.status === 'pending').length, color: 'yellow' },
          { label: translate('approved'), value: suggestions.filter(s => s.status === 'approved').length, color: 'green' },
          { label: translate('rejected'), value: suggestions.filter(s => s.status === 'rejected').length, color: 'red' }
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
              <SelectValue placeholder={translate('allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate('allStatus')}</SelectItem>
              <SelectItem value="pending">{translate('pending')}</SelectItem>
              <SelectItem value="approved">{translate('approved')}</SelectItem>
              <SelectItem value="rejected">{translate('rejected')}</SelectItem>
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
        ) : filteredSuggestions.length === 0 ? (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{translate('noRecords')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredSuggestions.map(suggestion => (
            <Card key={suggestion.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getEntityTypeLabel(suggestion.entity_type)}
                      </Badge>
                      {getStatusBadge(suggestion.status)}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {suggestion.suggested_changes?.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(suggestion.created_date).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)} className="h-8 w-8 p-0">
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
                <TableHead>{translate('suggestionType')}</TableHead>
                <TableHead>{translate('suggestion')}</TableHead>
                <TableHead>{translate('status')}</TableHead>
                <TableHead>{translate('date')}</TableHead>
                <TableHead className="text-right">{translate('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">{translate('loading')}</TableCell>
                </TableRow>
              ) : filteredSuggestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">{translate('noRecords')}</TableCell>
                </TableRow>
              ) : (
                filteredSuggestions.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getEntityTypeLabel(suggestion.entity_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {suggestion.suggested_changes?.substring(0, 50)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                    <TableCell>
                      {new Date(suggestion.created_date).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(suggestion)}>
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
            <DialogTitle className="dark:text-white">{translate('details')}</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('suggestionType')}</p>
                <p className="font-semibold dark:text-white">{getEntityTypeLabel(selectedSuggestion.entity_type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('recordDetails')}</p>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mt-1 space-y-2">
                  <p className="font-medium dark:text-white">{getEntityDetails(selectedSuggestion).main}</p>
                  {getEntityDetails(selectedSuggestion).secondary && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{getEntityDetails(selectedSuggestion).secondary}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('suggestedChanges')}</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mt-1">
                  <p className="whitespace-pre-wrap dark:text-gray-200">{selectedSuggestion.suggested_changes}</p>
                </div>
              </div>
              {selectedSuggestion.reason && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{translate('reason')}</p>
                  <p className="dark:text-gray-200">{selectedSuggestion.reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('status')}</p>
                {getStatusBadge(selectedSuggestion.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{translate('adminNotes')}</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={translate('notes')}
                  rows={3}
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {translate('close')}
            </Button>
            {selectedSuggestion?.status === 'pending' && (
              <>
                {hasRejectPermission && (
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {translate('reject')}
                  </Button>
                )}
                {hasApprovePermission && (
                  <Button 
                    onClick={handleApprove}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {translate('approve')}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}