import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, Calendar, CheckCircle, Building2, Plus, Trash2, CreditCard } from 'lucide-react';
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
import { DONATION_AMOUNTS } from '@/utils/enums';

const SERVICE_TYPES = [
  { value: 'tahlil_ringkas', label: 'Tahlil Ringkas', description: 'Bacaan tahlil ringkas untuk arwah' },
  { value: 'tahlil_panjang', label: 'Tahlil Panjang', description: 'Bacaan tahlil lengkap dengan surah-surah pilihan' },
  { value: 'yasin', label: 'Bacaan Yasin', description: 'Pembacaan Surah Yasin untuk arwah' },
  { value: 'doa_arwah', label: 'Doa Arwah', description: 'Doa khusus untuk arwah' },
  { value: 'custom', label: 'Perkhidmatan Khas', description: 'Perkhidmatan mengikut permintaan' }
];

export default function TahlilRequestPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedTahfiz = urlParams.get('tahfiz');
  const preSelectedDeceased = urlParams.get('deceased');

  const [selectedTahfiz, setSelectedTahfiz] = useState(preSelectedTahfiz || '');
  const [serviceTypes, setServiceTypes] = useState(['tahlil_ringkas']);
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [deceasedNames, setDeceasedNames] = useState([preSelectedDeceased || '']);
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customService, setCustomService] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const queryClient = useQueryClient();

  const { data: tahfizCenters = [], isLoading } = useQuery({
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
    queryKey: ['tahfiz-payment-config', selectedTahfiz],
    queryFn: async () => {
      if (!selectedTahfiz) return [];
      return base44.entities.TahfizPaymentConfig.filter({ tahfiz_id: selectedTahfiz });
    },
    enabled: !!selectedTahfiz
  });

  const selectedCenter = tahfizCenters.find(c => c.id === selectedTahfiz);

  const availablePlatforms = useMemo(() => {
    if (!paymentConfigs.length || !paymentPlatforms.length) return [];
    
    const platformCodes = [...new Set(paymentConfigs.map(c => c.payment_platform_code).filter(Boolean))];
    return paymentPlatforms.filter(p => p && p.code && platformCodes.includes(p.code));
  }, [paymentConfigs, paymentPlatforms]);

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

  useEffect(() => {
    const validPlatforms = availablePlatforms.filter(p => p?.code);
    if (validPlatforms.length > 0) {
      if (!paymentMethod || !validPlatforms.find(p => p.code === paymentMethod)) {
        setPaymentMethod(validPlatforms[0].code);
      }
    } else {
      setPaymentMethod('');
    }
  }, [availablePlatforms, selectedTahfiz]);

  const createRequest = useMutation({
    mutationFn: (data) => base44.entities.TahlilRequest.create(data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries(['tahlil-requests']);
      showSuccess('Permohonan tahlil telah dihantar!')
    }
  });

  const addDeceasedName = () => {
    setDeceasedNames([...deceasedNames, '']);
  };

  const removeDeceasedName = (index) => {
    if (deceasedNames.length > 1) {
      setDeceasedNames(deceasedNames.filter((_, i) => i !== index));
    }
  };

  const updateDeceasedName = (index, value) => {
    const updated = [...deceasedNames];
    updated[index] = value;
    setDeceasedNames(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTahfiz) {
      showError('Sila pilih pusat tahfiz');
      return;
    }
    if (!requesterName) {
      showError('Sila masukkan nama pemohon')
      return;
    }
    if (!requesterPhone) {
      showError('Sila masukkan nombor telefon')
      return;
    }
    if (deceasedNames.filter(n => n.trim()).length === 0) {
      showError('Sila masukkan sekurang-kurangnya satu nama arwah')
      return;
    }
    if (!referenceId) {
      showError('Sila masukkan ID rujukan transaksi')
      return;
    }

    const finalNotes = serviceTypes.includes('custom') && customService
      ? `${notes}\n\nPerkhidmatan Khas: ${customService}`.trim()
      : notes;

    const deceasedNamesObject = {};
    deceasedNames.forEach((name, index) => {
      if (name.trim()) {
        deceasedNamesObject[index] = name.trim();
      }
    });

    createRequest.mutate({
      tahfiz_center_id: selectedTahfiz,
      service_type: serviceTypes.join(','),
      requester_name: requesterName,
      requester_phone: requesterPhone,
      requester_email: requesterEmail,
      deceased_names: deceasedNamesObject,
      preferred_date: preferredDate,
      notes: finalNotes,
      reference_id: referenceId,
      status: 'pending'
    });
  };

  const toggleServiceType = (value) => {
    setServiceTypes(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Permohonan Dihantar!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Permohonan tahlil untuk <span className="font-bold dark:text-emerald-300">{Object.values(deceasedNames).filter(n => n).join(', ')}</span> telah dihantar kepada pusat tahfiz.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Pihak pusat tahfiz akan menghubungi anda untuk pengesahan.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setDeceasedNames(['']);
                setNotes('');
                setPreferredDate('');
                setReferenceId('');
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Buat Permohonan Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-2">
      <BackNavigation title="Mohon Servis" />

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  <SelectItem key={center.id} value={center.id}>
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
        {selectedCenter && selectedCenter.services_offered?.length > 0 && (
            <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-lg dark:text-white">Jenis Perkhidmatan (Boleh pilih lebih dari satu)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                {SERVICE_TYPES
                  .filter(serviceType => 
                    selectedCenter.services_offered.includes(serviceType.value) || 
                    serviceType.value === 'custom'
                  )
                  .map(service => {
                    const price = selectedCenter?.service_prices?.[service.value];
                    return (
                      <Label 
                      key={service.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          serviceTypes.includes(service.value) ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'dark:border-gray-600'
                      }`}
                      >
                      <Checkbox 
                          checked={serviceTypes.includes(service.value)}
                          onCheckedChange={() => toggleServiceType(service.value)}
                          className="mt-1"
                      />
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
                    <Label htmlFor="customService" className="dark:text-gray-300">
                      Nyatakan Perkhidmatan Khas <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="customService"
                      placeholder="Jelaskan perkhidmatan khas yang anda perlukan..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
            </CardContent>
            </Card>
        )}

        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg dark:text-white">Maklumat Arwah</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeceasedName}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {deceasedNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`deceased-${index}`} className="dark:text-gray-300">
                    Nama Arwah {deceasedNames.length > 1 ? `${index + 1}` : ''} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`deceased-${index}`}
                    placeholder="Nama penuh arwah"
                    value={name}
                    onChange={(e) => updateDeceasedName(index, e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                {deceasedNames.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeceasedName(index)}
                    className="mt-7 h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Requester Info */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Maklumat Pemohon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requesterName" className="dark:text-gray-300">Nama Pemohon <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterName"
                  placeholder="Nama anda"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="requesterPhone" className="dark:text-gray-300">No. Telefon <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterPhone"
                  placeholder="01X-XXXXXXX"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="requesterEmail" className="dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="requesterEmail"
                  type="email"
                  placeholder="email@contoh.com"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Date */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Tarikh & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferredDate" className="dark:text-gray-300">Tarikh Pilihan</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="preferredDate"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="dark:text-gray-300">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Sebarang maklumat tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                      className="flex items-center gap-3 p-4 rounded-xl border dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&:has(:checked)]:border-violet-500 [&:has(:checked)]:bg-violet-50 dark:[&:has(:checked)]:bg-violet-900/20"
                    >
                      <RadioGroupItem value={platform.code} />
                      <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="dark:text-gray-300">{platform.name || 'Unknown'}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {/* Payment Details */}
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
            <CardTitle className="text-lg dark:text-white">Jumlah Derma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {DONATION_AMOUNTS.map(amt => (
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
                ID Rujukan Transaksi (Reference ID) <span className="text-red-500">*</span>
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
          className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-200"
          disabled={createRequest.isPending || !selectedTahfiz || !requesterName || deceasedNames.filter(n => n.trim()).length === 0 || !requesterPhone || !referenceId}
        >
          {createRequest.isPending ? 'Menghantar...' : 'Hantar Permohonan'}
        </Button>
      </form>
    </div>
  );
}