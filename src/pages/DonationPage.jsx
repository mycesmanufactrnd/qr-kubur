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
import { toast } from "sonner";

const SUGGESTED_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function DonationPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedOrg = urlParams.get('org');
  const preSelectedTahfiz = urlParams.get('tahfiz');

  const [recipientType, setRecipientType] = useState(preSelectedTahfiz ? 'tahfiz' : 'organisation');
  const [selectedRecipient, setSelectedRecipient] = useState(preSelectedOrg || preSelectedTahfiz || '');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
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

  const createDonation = useMutation({
    mutationFn: (data) => base44.entities.Donation.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['donations']);
      toast.success('Terima kasih! Derma anda telah direkodkan.');
    }
  });

  const selectedOrg = recipientType === 'organisation' 
    ? organisations.find(o => o.id === selectedRecipient)
    : tahfizCenters.find(t => t.id === selectedRecipient);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalAmount = customAmount || amount;
    if (!finalAmount || !selectedRecipient) {
      toast.error('Sila lengkapkan maklumat derma');
      return;
    }
    
    if (!referenceId) {
      toast.error('Sila masukkan ID rujukan transaksi');
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
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Derma</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Type */}
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

            {/* Bank Info */}
            {selectedOrg && (selectedOrg.bank_name || selectedOrg.bank_account) && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Maklumat Bank</h4>
                {selectedOrg.bank_name && (
                  <p className="text-sm text-blue-800 dark:text-blue-300">Bank: {selectedOrg.bank_name}</p>
                )}
                {selectedOrg.bank_account && (
                  <p className="text-sm text-blue-800 dark:text-blue-300">No. Akaun: {selectedOrg.bank_account}</p>
                )}
              </div>
            )}
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
                className="pl-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Kaedah Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid gap-3">
                // <Label className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&:has(:checked)]:border-emerald-500 [&:has(:checked)]:bg-emerald-50 dark:[&:has(:checked)]:bg-emerald-900/20">
                //   <RadioGroupItem value="bank_transfer" />
                //   <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                //   <span className="dark:text-gray-300">Pemindahan Bank</span>
                // </Label>
                <Label className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&:has(:checked)]:border-emerald-500 [&:has(:checked)]:bg-emerald-50 dark:[&:has(:checked)]:bg-emerald-900/20">
                  <RadioGroupItem value="online" />
                  <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="dark:text-gray-300">Online Banking</span>
                </Label>
                <Label className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&:has(:checked)]:border-emerald-500 [&:has(:checked)]:bg-emerald-50 dark:[&:has(:checked)]:bg-emerald-900/20">
                  <RadioGroupItem value="duitnow" />
                  <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="dark:text-gray-300">DuitNow QR</span>
                </Label>                
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Donor Info */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Maklumat Penderma (Pilihan)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="donorName" className="dark:text-gray-300">Nama</Label>
              <Input
                id="donorName"
                placeholder="Nama anda (boleh kosongkan untuk derma tanpa nama)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
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
              />
            </div>
            <div>
              <Label htmlFor="notes" className="dark:text-gray-300">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Sebarang catatan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="border-0 shadow-md dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400">💰</span>
              Butiran Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Penting:</strong> Selepas membuat pembayaran melalui FPX, sila masukkan ID rujukan transaksi yang anda terima dari resit pembayaran.
              </p>
            </div>
            <div>
              <Label htmlFor="referenceId" className="dark:text-gray-300">
                ID Rujukan Transaksi (Reference ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="referenceId"
                placeholder="Masukkan ID rujukan dari transaksi FPX"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                required
                className="font-mono"
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