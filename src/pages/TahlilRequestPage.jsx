import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, Building2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import BackNavigation from "@/components/BackNavigation";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useLocationContext } from '@/providers/LocationProvider';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { DONATION_AMOUNTS, SERVICE_TYPES, TahlilStatus } from '@/utils/enums';
import { defaultTahlilRequestField } from '@/utils/defaultformfields';

export default function TahlilRequestPage() {
  const { userLocation } = useLocationContext();
  const preSelectedTahfiz = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tahfiz') || '';
  }, []);
  const { watch, setValue, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultTahlilRequestField, tahfizId: preSelectedTahfiz }
  });
  const [submitted, setSubmitted] = useState(false);
  const { data: tahfizCenters = [] } = useGetTahfizCoordinates(
    userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : null
  );

  useEffect(() => {
    if (!preSelectedTahfiz) return;
    if (!tahfizCenters.length) return;

    const found = tahfizCenters.find(c => c.id === Number(preSelectedTahfiz));
    if (found) {
      setValue('tahfizId', String(preSelectedTahfiz));
    }
  }, [preSelectedTahfiz, tahfizCenters, setValue]);

  const tahfizId = watch('tahfizId');
  const serviceTypes = watch('tahfizId');
  const customService = watch('customService');
  const amount = watch('amount');
  const customAmount = watch('customAmount');

  const selectedTahfiz = useMemo(() => {
    return tahfizCenters.find(c => c.id === Number(tahfizId)) || null;
  }, [tahfizCenters, tahfizId]);
  
  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: Number(tahfizId),
    entityType: 'tahfiz',
    enabled: !!tahfizId
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};
    paymentConfigs.forEach(c => {
      if (!c.paymentplatform) return;
      const code = c.paymentplatform.code;
      if (!map[code]) map[code] = { code, name: c.paymentplatform.name, fields: [] };
      if (c.paymentfield) {
        map[code].fields.push({
          key: c.paymentfield.key,
          label: c.paymentfield.label,
          fieldtype: c.paymentfield.fieldtype,
          value: c.value,
        });
      }
    });
    return Object.values(map);
  }, [paymentConfigs]);

  const selectedPlatform = paymentPlatforms.find(p => p.code === watch('paymentMethod'));

  const toggleServiceType = (value) => {
    const current = watch('serviceTypes') || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
      
    setValue('serviceTypes', updated);
  };
  const handleAddDeceased = () => {
    const names = watch('deceasedNames');
    setValue('deceasedNames', [...names, '']);
  };

  const handleRemoveDeceased = (index) => {
    const names = watch('deceasedNames');
    if (names.length > 1) setValue('deceasedNames', names.filter((_, i) => i !== index));
  };

  const handleDeceasedChange = (index, value) => {
    const names = watch('deceasedNames');
    names[index] = value;
    setValue('deceasedNames', names);
  };

  const onSubmit = (data) => {
    if (!data.tahfizId) return showError('Sila pilih pusat tahfiz');
    if (!data.requesterName) return showError('Sila masukkan nama pemohon');
    if (!data.requesterPhone) return showError('Sila masukkan nombor telefon');
    if (!data.deceasedNames.filter((n) => n.trim()).length)
      return showError('Sila masukkan sekurang-kurangnya satu nama arwah');

    const tahlilRequest = {
      tahfizcenter: { id: Number(data.tahfizId) },
      selectedservices: data.serviceTypes,
      deceasednames: data.deceasedNames.filter((n) => n.trim()),
      requestorname: data.requesterName,
      requestorphoneno: data.requesterPhone,
      requestoremail: data.requesterEmail,
      preferreddate: data.preferredDate || null,
      notes: data.customService || '',
      status: TahlilStatus.PENDING,
    };

    console.log('Submit Tahlil Request', tahlilRequest);
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Permohonan Dihantar!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Permohonan tahlil untuk{' '}
              <span className="font-bold dark:text-emerald-300">
                {watch('deceasedNames').filter(n => n).join(', ')}
              </span>{' '}
              telah dihantar ke pusat tahfiz.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Pilih Pusat Tahfiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={tahfizId} onValueChange={v => setValue('tahfizId', v)}>
              <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="Pilih pusat tahfiz" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700">
                {tahfizCenters.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} - {c.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTahfiz && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">
                Pilih Jenis Perkhidmatan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {SERVICE_TYPES.filter(s => selectedTahfiz.serviceoffered?.includes(s.value) || s.value === 'custom').map(service => (
                <Label
                  key={service.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    serviceTypes.includes(service.value)
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'dark:border-gray-600'
                  }`}
                >
                  <Checkbox
                    checked={(watch('serviceTypes') || []).includes(service.value)}
                    onCheckedChange={() => toggleServiceType(service.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold dark:text-white">{service.label}</span>
                      {selectedTahfiz.serviceprice?.[service.value] && (
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                          RM {selectedTahfiz.serviceprice[service.value]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                  </div>
                </Label>
              ))}

              {serviceTypes.includes('custom') && (
                <Textarea
                  placeholder="Jelaskan perkhidmatan khas..."
                  value={customService}
                  onChange={e => setValue('customService', e.target.value)}
                  className="mt-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-lg dark:text-white">Maklumat Arwah</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddDeceased}>Tambah</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {watch('deceasedNames').map((name, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Nama Arwah ${watch('deceasedNames').length > 1 ? i+1 : ''}`}
                  value={name}
                  onChange={e => handleDeceasedChange(i, e.target.value)}
                  className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                {watch('deceasedNames').length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDeceased(i)} className="text-red-600">
                    &times;
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader><CardTitle className="text-lg dark:text-white">Maklumat Pemohon</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nama Pemohon" value={watch('requesterName')} onChange={e => setValue('requesterName', e.target.value)} />
            <Input placeholder="Telefon" value={watch('requesterPhone')} onChange={e => setValue('requesterPhone', e.target.value)} />
            <Input placeholder="Email" value={watch('requesterEmail')} onChange={e => setValue('requesterEmail', e.target.value)} />
            <Input type="date" placeholder="Tarikh Pilihan" value={watch('preferredDate')} onChange={e => setValue('preferredDate', e.target.value)} />
            <Textarea placeholder="Catatan" value={watch('customService')} onChange={e => setValue('customService', e.target.value)} />
          </CardContent>
        </Card>

        {selectedTahfiz && paymentPlatforms.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader><CardTitle className="text-lg dark:text-white">Kaedah Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={watch('paymentMethod')} onValueChange={v => setValue('paymentMethod', v)}>
                <div className="grid gap-3">
                  {paymentPlatforms.map(p => (
                    <Label key={p.code} className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                      <RadioGroupItem value={p.code} />
                      <CreditCard className="w-4 h-4" />
                      {p.name}
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {selectedPlatform && (
                <div className="mt-4 space-y-2">
                  {selectedPlatform.fields.map(f => (
                    f.fieldtype === 'image'
                      ? <img key={f.key} src={f.value} alt={f.label} className="max-w-xs rounded border" />
                      : <p key={f.key}><strong>{f.label}:</strong> {f.value}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

         <Card>
          <CardHeader><CardTitle>Jumlah Derma</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {DONATION_AMOUNTS.map(amt => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === String(amt) ? 'default' : 'outline'}
                  onClick={() => {
                    setValue('amount', String(amt));
                    setValue('customAmount', '');
                  }}
                >
                  RM {amt}
                </Button>
              ))}
            </div>

            <Input
              type="number"
              placeholder="Jumlah lain"
              value={customAmount}
              onChange={(e) => {
                setValue('customAmount', e.target.value);
                setValue('amount', '');
              }}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white">
          Hantar Permohonan
        </Button>
      </form>
    </div>
  );
}
