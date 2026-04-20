import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, User, BookOpen } from 'lucide-react';
import PaymentForm from '@/components/deathcharity/PaymentForm';
import { useGetMemberByDeathCharity } from '@/hooks/useDeathCharityMemberMutations';
import { useDeathCharityPaymentMutations, useGetPaymentByMemberId } from '@/hooks/useDeathCharityPaymentMutations';
import { useSearchParams } from 'react-router-dom';
import { useGetDeathCharityByOrganisation } from '@/hooks/useDeathCharityMutations';
import { translate } from '@/utils/translations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Breadcrumb from '@/components/Breadcrumb';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';

export default function ManageDeathCharityLedger() {
  const [searchParams] = useSearchParams();
  const urlMemberId = searchParams.get('member') ? Number(searchParams.get('member')) : null;
  const urlDeathCharityId = searchParams.get('deathcharity') ? Number(searchParams.get('deathcharity')) : null;

  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('death_charity');

  const currentYear = new Date().getFullYear();
  const [selectedDeathCharity, setSelectedDeathCharity] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 4);

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();

  const { data: deathCharityMemberList = [], isLoading: loadingMembers } = 
    useGetMemberByDeathCharity(selectedDeathCharity?.id);

  useEffect(() => {
    if (
      urlDeathCharityId &&
      deathCharityList?.length > 0
    ) {
      const found = deathCharityList.find(
        (d) => Number(d.id) === Number(urlDeathCharityId)
      );

      if (found) {
        setSelectedDeathCharity(found);
      }
    }
  }, [urlDeathCharityId, deathCharityList]);

  useEffect(() => {
    if (
      urlMemberId &&
      deathCharityMemberList?.length > 0
    ) {
      const found = deathCharityMemberList.find(
        (m) => Number(m.id) === Number(urlMemberId)
      );

      if (found) {
        setSelectedMember(found);
      }
    }
  }, [urlMemberId, deathCharityMemberList]);

  const { data: payments = [] } = useGetPaymentByMemberId(selectedMember?.id);

  const { createDeathCharityPayment } = useDeathCharityPaymentMutations();

  const columns = useMemo(() => {
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [startYear, endYear]);

  useEffect(() => {
    if (startYear > endYear) {
      setEndYear(startYear);
    }
  }, [startYear, endYear]);

  const chunkColumns = (columns, size) => {
    const chunks = [];
    for (let i = 0; i < columns.length; i += size) {
      chunks.push(columns.slice(i, i + size));
    }
    return chunks;
  };

  const columnRows = chunkColumns(columns, 5);

  const paymentsByPeriod = useMemo(() => {
    const grouped = {};
    
    payments.forEach(payment => {
      if (!payment.coversfromyear) return;
      
      const fromYear = payment.coversfromyear;
      const toYear = payment.coverstoyear || fromYear;
      
      // Add payment to all years it covers
      for (let year = fromYear; year <= toYear; year++) {
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(payment);
      }
    });
    
    return grouped;
  }, [payments]);

  const stats = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const registrationPayments = payments.filter(p => p.paymenttype === 'registration').length;
    
    return { totalPaid, registrationPayments, totalPayments: payments.length };
  }, [payments]);

  const handleCellClick = (period) => {
    setSelectedCell(period);
    setShowPaymentDialog(true);
  };

  const handleCreatePayment = async (data) => {
    try {
      await createDeathCharityPayment.mutateAsync(data)
      .then((res) => {
        if (res) {
          setShowPaymentDialog(false);
          setSelectedCell(null);
        }
      });
    } catch (error) {
      console.error("Failed to create payment:", error);
    }
  };

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
          ...(selectedMember
            ? [ { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember'} ]
            : []),
          { label: translate('Manage Death Charity Ledger'), page: 'ManageDeathCharityLedger' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        ...(selectedMember
          ? [ { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember'} ]
          : []),
        { label: translate('Manage Death Charity Ledger'), page: 'ManageDeathCharityLedger' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          {translate('Manage Death Charity Ledger')}
        </h1>
      </div>

      <div className="pb-10">
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Death Charity</label>
                <Select 
                  value={selectedDeathCharity?.id ? String(selectedDeathCharity.id) : ""}
                  onValueChange={(id) => {
                    const found = deathCharityList.find(
                      (m) => Number(m.id) === Number(id)
                    );
                    setSelectedDeathCharity(found);
                    setSelectedMember(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deathCharityList.map(deathcharity => (
                      <SelectItem key={deathcharity.id} value={String(deathcharity.id)}>
                        {deathcharity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Member</label>
                <Select 
                  value={selectedMember?.id ? String(selectedMember.id) : ""}
                  onValueChange={(id) => {
                    const found = deathCharityMemberList.find(
                      (m) => Number(m.id) === Number(id)
                    );
                    setSelectedMember(found);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deathCharityMemberList.map(member => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.fullname} ({member.icnumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMember && (
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{selectedMember.fullname}</span>
                    <Badge className={selectedMember.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">IC: {selectedMember.icnumber} • Phone: {selectedMember.phone}</p>
                </div>
              )}
            </div>

            {selectedMember && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-blue-700">RM {stats.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 mb-1">Total Payments</p>
                  <p className="text-lg font-bold text-emerald-700">{stats.totalPayments}</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <p className="text-xs text-pink-600 mb-1">Registration</p>
                  <p className="text-lg font-bold text-pink-700">{stats.registrationPayments}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedMember && (
          <>
            <Card className="mb-6 border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-700">
                    Yearly Payment Ledger
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Start Year</label>
                        <Select value={startYear.toString()} onValueChange={v => setStartYear(Number(v))}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => currentYear - 10 + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">End Year</label>
                        <Select value={endYear.toString()} onValueChange={v => setEndYear(Number(v))}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => currentYear + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Ledger</span>                  
                  <Button onClick={() => setShowPaymentDialog(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">                
                <div className="space-y-4 p-4">
                  {columnRows.map((yearRow, rowIndex) => (
                    <table
                      key={rowIndex}
                      className="w-full border border-slate-200 border-collapse mb-4 shadow-sm"
                    >
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          {yearRow.map((year, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 text-center text-xs font-semibold text-slate-700 border-l"
                            >
                              {year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {yearRow.map((year, idx) => {
                            const periodPayments = paymentsByPeriod[year] || [];
                            const totalAmount = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

                            return (
                              <td
                                key={idx}
                                className="px-4 py-3 border-l cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => handleCellClick(year)}
                              >
                                {periodPayments.length > 0 ? (
                                  <div className="text-center">
                                    <p className="text-lg font-bold text-emerald-600">
                                      RM {totalAmount.toFixed(2)}
                                    </p>
                                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                                      {periodPayments.map((payment, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {payment.paymentmethod}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {periodPayments.length} payment{periodPayments.length > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center text-slate-300">
                                    <Plus className="w-6 h-6 mx-auto mb-1" />
                                    <p className="text-xs">Add</p>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedMember && !loadingMembers && (
          <Card className="text-center py-16">
            <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Select a Member
            </h3>
            <p className="text-slate-500">
              Choose a member from the dropdown above to view their payment ledger
            </p>
          </Card>
        )}
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            memberId={selectedMember?.id}
            payments={payments}
            onSubmit={handleCreatePayment}
            onCancel={() => {
              setShowPaymentDialog(false);
              setSelectedCell(null);
            }}
            selectedYear={selectedCell}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}