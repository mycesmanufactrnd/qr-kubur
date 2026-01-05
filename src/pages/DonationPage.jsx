import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Building2, CheckCircle, CreditCard, Smartphone, QrCode, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from '@/components/ToastrNotification';
import BackNavigation from '@/components/BackNavigation';

const SUGGESTED_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function DonationPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedOrg = urlParams.get('org');
  const preSelectedTahfiz = urlParams.get('tahfiz');

  const [recipientType, setRecipientType] = useState(preSelectedTahfiz ? 'tahfiz' : 'organisation');
  const [selectedRecipient, setSelectedRecipient] = useState(preSelectedOrg || preSelectedTahfiz || '');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: organisations = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list()
  });

  const { data: tahfizCenters = [] } = useQuery({
    queryKey: ['tahfiz-centers'],
    queryFn: () => base44.entities.TahfizCenter.list()
  });

  const { data: paymentPlatforms = [] } = useQuery({
    queryKey: ['payment-platforms-active'],
    queryFn: () => base44.entities.PaymentPlatform.filter({ status: 'active' })
  });

  const { data: paymentFields = [] } = useQuery({
    queryKey: ['payment-fields'],
    queryFn: () => base44.entities.PaymentPlatformField.list()
  });

  const { data: paymentConfigs = [] } = useQuery({
    queryKey: ['payment-config', recipientType, selectedRecipient],
    queryFn: async () => {
      if (!selectedRecipient) return [];
      const entityType = recipientType === 'tahfiz' ? 'TahfizPaymentConfig' : 'OrganisationPaymentConfig';
      const entityKey = recipientType === 'tahfiz' ? 'tahfiz_id' : 'organisation_id';
      return base44.entities[entityType].filter({ [entityKey]: selectedRecipient });
    },
    enabled: !!selectedRecipient
  });

  const createDonation = useMutation({
    mutationFn: (data) => base44.entities.Donation.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['donations']);
      showSuccess('Terima kasih! Derma anda telah direkodkan.');
    }
  });

  const selectedOrg = recipientType === 'organisation' 
    ? organisations.find(o => o.id === selectedRecipient)
    : tahfizCenters.find(t => t.id === selectedRecipient);

  // Get available payment platforms for selected recipient
  const availablePlatforms = React.useMemo(() => {
    if (!paymentConfigs.length || !paymentPlatforms.length) return [];
    
    const platformCodes = [...new Set(paymentConfigs.map(c => c.payment_platform_code).filter(Boolean))];
    return paymentPlatforms.filter(p => p && p.code && platformCodes.includes(p.code));
  }, [paymentConfigs, paymentPlatforms]);

  // Get payment details for selected method
  const getPaymentDetails = (platformCode) => {
    if (!platformCode || !paymentConfigs) return {};
    const configs = paymentConfigs.filter(c => c?.payment_platform_code === platformCode);
    const details = {};
    configs.forEach(config => {
      if (config?.key) {
        details[config.key] = config.value;
      }
    });
    return details;
  };

  // Reset payment method when recipient changes
  React.useEffect(() => {
    const validPlatforms = availablePlatforms.filter(p => p?.code);
    if (validPlatforms.length > 0) {
      if (!paymentMethod || !validPlatforms.find(p => p.code === paymentMethod)) {
        setPaymentMethod(validPlatforms[0].code);
      }
    } else {
      setPaymentMethod('');
    }
  }, [availablePlatforms, selectedRecipient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalAmount = customAmount || amount;
    if (!finalAmount || !selectedRecipient) {
      showError('Sila lengkapkan maklumat derma');
      return;
    }
    
    if (!referenceId) {
      showError('Sila masukkan ID rujukan transaksi');
      return;
    }

    createDonation.mutate({
      donor_name: donorName || 'Tanpa Nama',
      donor_email: donorEmail,
      amount: parseFloat(finalAmount),
      recipient_type: recipientType,
      organisation_id: recipientType === 'organisation' ? selectedRecipient : null,
      tahfiz_center_id: recipientType === 'tahfiz' ? selectedRecipient : null,
      payment_method: paymentMethod,
      reference_id: referenceId,
      notes: notes,
      status: 'pending'
    });
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Terima Kasih!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Derma anda sebanyak <span className="font-bold text-emerald-600">RM {customAmount || amount}</span> telah direkodkan.
              Kami akan mengesahkan derma anda selepas semakan resit.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setAmount('');
                setCustomAmount('');
                setReferenceId('');
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Buat Derma Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-2">
      <BackNavigation title="Donation" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Penerima Derma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={recipientType} onValueChange={setRecipientType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="organisation">
                  <Building2 className="w-4 h-4 mr-2" />
                  Organisasi
                </TabsTrigger>
                <TabsTrigger value="tahfiz">
                  <Heart className="w-4 h-4 mr-2" />
                  Pusat Tahfiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organisation" className="mt-4">
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih organisasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {organisations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="tahfiz" className="mt-4">
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Pilih pusat tahfiz" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {tahfizCenters.map(center => (
                      <SelectItem key={center.id} value={center.id}>
                        <div className="flex flex-col">
                          <span>{center.name}</span>
                          <span className="text-xs text-gray-500">{center.state}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>


          </CardContent>
        </Card>

        {/* Amount */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Jumlah Derma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {SUGGESTED_AMOUNTS.map(amt => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === String(amt) && !customAmount ? 'default' : 'outline'}
                  className={amount === String(amt) && !customAmount ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  onClick={() => {
                    setAmount(String(amt));
                    setCustomAmount('');
                  }}
                >
                  RM {amt}
                </Button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">RM</span>
              <Input
                type="number"
                placeholder="Jumlah lain"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount('');
                }}
                className="pl-12 text-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        {availablePlatforms.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Kaedah Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="grid gap-3">
                  {availablePlatforms.filter(p => p?.code).map(platform => (
                    <Label 
                      key={platform.code}
                      className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&:has(:checked)]:border-emerald-500 [&:has(:checked)]:bg-emerald-50 dark:[&:has(:checked)]:bg-emerald-900/20"
                    >
                      <RadioGroupItem value={platform.code} />
                      <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="dark:text-gray-300">{platform.name || 'Unknown'}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {paymentMethod && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Maklumat Pembayaran</h4>
                  {(() => {
                    const details = getPaymentDetails(paymentMethod);
                    const fields = (paymentFields || []).filter(f => f?.payment_platform_code === paymentMethod);
                    
                    return (
                      <div className="space-y-2">
                        {fields.map(field => {
                          if (!field?.key) return null;
                          const value = details[field.key];
                          if (!value) return null;

                          if (field.field_type === 'image') {
                            return (
                              <div key={field.key}>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                  {field.label || field.key}
                                </p>
                                <img src={value} alt={field.label || 'Payment'} className="max-w-xs rounded border" />
                              </div>
                            );
                          }

                          return (
                            <p key={field.key} className="text-sm text-blue-800 dark:text-blue-300">
                              <span className="font-medium">{field.label || field.key}:</span> {value}
                            </p>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Maklumat Penderma (Pilihan)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="donorName" className="dark:text-gray-300">Nama</Label>
              <Input
                id="donorName"
                placeholder="Nama"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="donorEmail" className="dark:text-gray-300">Email</Label>
              <Input
                id="donorEmail"
                type="email"
                placeholder="Email untuk pengesahan"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="dark:text-gray-300">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Sebarang catatan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">
              Butiran Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Penting:</strong> Selepas membuat pembayaran, sila masukkan ID rujukan transaksi yang anda terima dari resit pembayaran.
              </p>
            </div>
            <div>
              <Label htmlFor="referenceId" className="dark:text-gray-300">
                ID Rujukan Transaksi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="referenceId"
                placeholder="ID Rujukan Transaksi"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                required
                className="font-mono dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit"
          className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-200"
          disabled={createDonation.isPending || !selectedRecipient || (!amount && !customAmount) || !referenceId}
        >
          {createDonation.isPending ? 'Menghantar...' : 'Hantar Derma'}
        </Button>
      </form>
    </div>
  );
}