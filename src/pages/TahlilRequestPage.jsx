import React, { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import {
  BookOpen,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Building2,
  ArrowLeft,
  Plus,
  Trash2,
  CreditCard
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from '@/components/ToastrNotification';
import BackNavigation from "@/components/BackNavigation";

const SERVICE_TYPES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas', description: 'Bacaan tahlil ringkas untuk arwah' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang', description: 'Bacaan tahlil lengkap dengan surah-surah pilihan' },
  { value: 'yasin', label: 'Bacaan Yasin', description: 'Pembacaan Surah Yasin untuk arwah' },
  { value: 'doa_arwah', label: 'Doa Arwah', description: 'Doa khusus untuk arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas', description: 'Perkhidmatan mengikut permintaan' }
];

export default function TahlilRequestPage() {
  const [preSelected, setPreSelected] = useState({ tahfiz: '', deceased: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreSelected({
      tahfiz: params.get('tahfiz') || '',
      deceased: params.get('deceased') || ''
    });
  }, []);

  const [selectedTahfiz, setSelectedTahfiz] = useState('');
  const [serviceTypes, setServiceTypes] = useState(['tahlil_ringkas']);
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [deceasedNames, setDeceasedNames] = useState(['']);
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customService, setCustomService] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (preSelected.tahfiz) setSelectedTahfiz(preSelected.tahfiz);
    if (preSelected.deceased) setDeceasedNames([preSelected.deceased]);
  }, [preSelected]);

  const { data: tahfizCenters = [], isLoading: centersLoading } =trpc.tahfiz.getTahfiz.useQuery({ coordinates: null });

  const { data: paymentPlatforms = [] } = trpc.paymentPlatform.filter.useQuery({ status: 'active' });
  const { data: paymentFields = [] } = trpc.paymentPlatformField.getAll.useQuery();
  const { data: paymentConfigs = [] } =
    trpc.tahfizPaymentConfig.filter.useQuery(
      { tahfiz_id: Number(selectedTahfiz) },
      { enabled: !!selectedTahfiz }
    );

  const createRequest = trpc.tahlilRequest.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showSuccess('Permohonan tahlil telah dihantar!');
    },
    onError: (err) => showError(err.message || 'Gagal menghantar permohonan'),
  });

  const selectedCenter = useMemo(
    () => tahfizCenters.find(c => String(c.id) === String(selectedTahfiz)),
    [tahfizCenters, selectedTahfiz]
  );

  const availablePlatforms = useMemo(() => {
    if (!paymentConfigs.length || !paymentPlatforms.length) return [];
    const codes = [...new Set(paymentConfigs.map(c => c.payment_platform_code).filter(Boolean))];
    return paymentPlatforms.filter(p => codes.includes(p.code));
  }, [paymentConfigs, paymentPlatforms]);

  const getPaymentDetails = (platformCode) => {
    const details = {};
    paymentConfigs
      .filter(c => c.payment_platform_code === platformCode)
      .forEach(c => { if (c.key) details[c.key] = c.value; });
    return details;
  };

  const addDeceasedName = () => setDeceasedNames([...deceasedNames, '']);
  const removeDeceasedName = (i) => deceasedNames.length > 1 && setDeceasedNames(deceasedNames.filter((_, idx) => idx !== i));
  const updateDeceasedName = (i, v) => {
    const copy = [...deceasedNames];
    copy[i] = v;
    setDeceasedNames(copy);
  };

  const toggleServiceType = (v) => {
    setServiceTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTahfiz || !requesterName || !requesterPhone || !referenceId) {
      showError('Sila lengkapkan maklumat wajib');
      return;
    }

    createRequest.mutate({
      tahfizcenter: { id: Number(selectedTahfiz) },
      selectedservices: serviceTypes,
      requestorname: requesterName,
      requestorphoneno: requesterPhone,
      requestoremail: requesterEmail || undefined,
      deceasednames: deceasedNames.filter(Boolean),
      preferreddate: preferredDate ? new Date(preferredDate) : undefined,
      notes,
      referenceno: referenceId,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-2">
      <BackNavigation title="Mohon Servis" />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilih Pusat Tahfiz */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Pilih Pusat Tahfiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTahfiz} onValueChange={setSelectedTahfiz}>
              <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="Pilih pusat tahfiz" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700">
                {tahfizCenters.map(center => (
                  <SelectItem key={center.id} value={String(center.id)}>
                    <div className="flex flex-col items-start">
                      <span>{center.name}</span>
                      <span className="text-xs text-gray-500">{center.state}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Service Type */}
        {selectedCenter && selectedCenter.serviceoffered?.length > 0 && (
            <Card className="border-0 shadow-md dark:bg-gray-800">
              <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Jenis Perkhidmatan</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid gap-3">
                  {SERVICE_TYPES
                    .filter(st => selectedCenter.serviceoffered.includes(st.value) || st.value === 'custom')
                    .map(service => {
                      const price = selectedCenter?.serviceprice?.[service.value];
                      return (
                        <Label key={service.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${serviceTypes.includes(service.value) ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'dark:border-gray-600'}`}>
                          <Checkbox checked={serviceTypes.includes(service.value)} onCheckedChange={() => toggleServiceType(service.value)} className="mt-1" />
                          <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold dark:text-white">{service.label}</span>
                                {price && <span className="text-violet-600 dark:text-violet-400 font-bold">RM {price}</span>}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                          </div>
                        </Label>
                      );
                    })}
                  </div>
                  {serviceTypes.includes('custom') && (
                    <div className="mt-4">
                      <Label className="dark:text-gray-300">Nyatakan Perkhidmatan Khas *</Label>
                      <Textarea value={customService} onChange={(e) => setCustomService(e.target.value)} className="mt-2" />
                    </div>
                  )}
              </CardContent>
            </Card>
        )}

        {/* Maklumat Arwah */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg dark:text-white">Maklumat Arwah</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addDeceasedName} className="h-8">
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {deceasedNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label className="dark:text-gray-300">Nama Arwah {deceasedNames.length > 1 ? index + 1 : ''} *</Label>
                  <Input value={name} onChange={(e) => updateDeceasedName(index, e.target.value)} required className="dark:bg-gray-700 dark:text-white" />
                </div>
                {deceasedNames.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDeceasedName(index)} className="mt-7 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maklumat Pemohon */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader><CardTitle className="text-lg dark:text-white">Maklumat Pemohon</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="dark:text-gray-300">Nama Pemohon *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className="pl-10 dark:bg-gray-700" required />
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-300">No. Telefon *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} className="pl-10 dark:bg-gray-700" required />
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} className="pl-10 dark:bg-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Notes */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader><CardTitle className="text-lg dark:text-white">Tarikh & Catatan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="dark:text-gray-300">Tarikh Pilihan</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="pl-10 dark:bg-gray-700" />
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-300">Catatan Tambahan</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="dark:bg-gray-700" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Platform */}
        {availablePlatforms.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader><CardTitle className="text-lg dark:text-white">Kaedah Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="grid gap-3">
                  {availablePlatforms.map(platform => (
                    <Label key={platform.code} className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer [&:has(:checked)]:border-violet-500 [&:has(:checked)]:bg-violet-50">
                      <RadioGroupItem value={platform.code} />
                      <CreditCard className="w-5 h-5" />
                      <span className="dark:text-gray-300">{platform.name}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
              {paymentMethod && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Maklumat Pembayaran</h4>
                  <div className="space-y-2">
                    {paymentFields.filter(f => f.payment_platform_code === paymentMethod).map(field => {
                      const val = getPaymentDetails(paymentMethod)[field.key];
                      if (!val) return null;
                      return (
                        <p key={field.key} className="text-sm text-blue-800 dark:text-blue-300">
                          <span className="font-medium">{field.label}:</span> {field.field_type === 'image' ? <img src={val} className="max-w-xs mt-1" /> : val}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction ID */}
        <Card className="border-0 shadow-md dark:bg-gray-800 border-2 border-amber-200">
          <CardHeader><CardTitle className="text-lg dark:text-white">Butiran Transaksi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
              <strong>Penting:</strong> Sila masukkan ID rujukan transaksi resit pembayaran.
            </div>
            <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="ID Rujukan Transaksi" required className="font-mono dark:bg-gray-700" />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg" disabled={createRequest.isLoading}>
          {createRequest.isLoading ? 'Menghantar...' : 'Hantar Permohonan'}
        </Button>
      </form>
    </div>
  );
}