import { useState, useEffect, useMemo } from 'react';
import { Heart, Building2, CheckCircle, CreditCard } from 'lucide-react';

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
import { DONATION_AMOUNTS, STATES_MY, VerificationStatus } from '@/utils/enums';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { useGetOrganisationCoordinates } from '@/hooks/useOrganisationMutations';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { useForm } from 'react-hook-form';
import { trpc } from '@/utils/trpc';
import { validateFields } from '@/utils/validations';
import { useLocationContext } from '@/providers/LocationProvider';

const defaultValues = {
  recipientType: 'organisation',
  selectedRecipient: '',
  amount: '',
  customAmount: '',
  paymentMethod: '',
  donorName: '',
  donorEmail: '',
  notes: '',
};

export default function DonationPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    watch,
    setValue,
    handleSubmit,
    reset,
  } = useForm({ defaultValues });
  const {
    userLocation,
    userState,
    locationDenied,
    isLocationLoading,
  } = useLocationContext();
  const recipientType = watch('recipientType');
  const selectedRecipient = watch('selectedRecipient');
  const amount = watch('amount');
  const customAmount = watch('customAmount');
  const paymentMethod = watch('paymentMethod');
  const donorName = watch('donorName');
  const donorEmail = watch('donorEmail');
  const notes = watch('notes');

  const { organisations = [] } = useGetOrganisationCoordinates({
    coordinates: userLocation?.lat && userLocation?.lng
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : undefined,
    enabled: !!userLocation && recipientType === 'organisation',
  });

  const { data: tahfizCenters = [] } = useGetTahfizCoordinates(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null
  );

  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: Number(selectedRecipient),
    entityType: recipientType,
    enabled: !!selectedRecipient && !!recipientType,
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};

    paymentConfigs.forEach(config => {
      if (!config.paymentplatform) return;

      const code = config.paymentplatform.code;

      if (!map[code]) {
        map[code] = {
          code,
          name: config.paymentplatform.name,
          fields: [],
        };
      }

      if (config.paymentfield) {
        map[code].fields.push({
          key: config.paymentfield.key,
          label: config.paymentfield.label,
          fieldtype: config.paymentfield.fieldtype,
          value: config.value,
        });
      }
    });

    return Object.values(map);
  }, [paymentConfigs]);

  const selectedPlatform = paymentPlatforms.find(p => p.code === paymentMethod);

  useEffect(() => {
    setValue('paymentMethod', '');
  }, [selectedRecipient]);
  
  const createDonation = trpc.donation.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showSuccess('Terima kasih! Derma anda telah direkodkan.');
      reset(defaultValues);
    },
  });

  const onSubmit = (data) => {
    const isValid = validateFields(data, [
      { field: 'recipientType', label: 'Recipient Type', type: 'select' },
    ]);

    if (!isValid) return;

    const finalAmount = data.customAmount || data.amount;

    if (!finalAmount || !data.selectedRecipient || !data.paymentMethod) {
      showError('Sila lengkapkan maklumat derma');
      return;
    }

    createDonation.mutate({
      donorname: data.donorName || null,
      donoremail: data.donorEmail || null,
      amount: Number(finalAmount) || null,
      tahfizcenter: data.recipientType === 'tahfiz' && data.selectedRecipient
        ? { id: Number(data.selectedRecipient) }
        : null,
      organisation: data.recipientType === 'organisation' && data.selectedRecipient
        ? { id: Number(data.selectedRecipient) }
        : null,
      notes: data.notes || null,
      status: VerificationStatus.PENDING,
    });
  };

  {locationDenied && (
    <p className="text-xs text-gray-500 mt-2">
      Lokasi tidak tersedia. Senarai tidak disusun mengikut jarak.
    </p>
  )}

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
            <h2 className="text-xl font-bold mb-2">Terima Kasih!</h2>
            <p>Derma anda telah direkodkan.</p>
            <Button className="mt-6" onClick={() => setSubmitted(false)}>
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Penerima Derma</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={recipientType}
              onValueChange={(v) => {
                setValue('recipientType', v);
                setValue('selectedRecipient', '');
                setValue('paymentMethod', '');
              }}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="organisation">
                  <Building2 className="w-4 h-4 mr-2" /> Organisasi
                </TabsTrigger>
                <TabsTrigger value="tahfiz">
                  <Heart className="w-4 h-4 mr-2" /> Tahfiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organisation" className="mt-4">
                <Select
                  value={selectedRecipient ? String(selectedRecipient) : ''}
                  onValueChange={v => setValue('selectedRecipient', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih organisasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {organisations.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="tahfiz" className="mt-4 space-y-3">
                <Select
                  value={selectedRecipient ? String(selectedRecipient) : ''}
                  onValueChange={v => setValue('selectedRecipient', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pusat tahfiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {tahfizCenters.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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

        {paymentPlatforms.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Kaedah Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={v => setValue('paymentMethod', v)}>
                {paymentPlatforms.map(p => (
                  <Label key={p.code} className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                    <RadioGroupItem value={p.code} />
                    <CreditCard className="w-4 h-4" />
                    {p.name}
                  </Label>
                ))}
              </RadioGroup>

              {selectedPlatform && (
                <div className="mt-4 space-y-2">
                  {selectedPlatform.fields.map(f => (
                    f.fieldtype === 'image' ? (
                      <img key={f.key} src={f.value} alt={f.label} className="max-w-xs rounded border" />
                    ) : (
                      <p key={f.key}>
                        <strong>{f.label}:</strong> {f.value}
                      </p>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Maklumat Penderma</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nama" value={donorName} onChange={e => setValue('donorName', e.target.value)} />
            <Input placeholder="Email" value={donorEmail} onChange={e => setValue('donorEmail', e.target.value)} />
            <Textarea placeholder="Catatan" value={notes} onChange={e => setValue('notes', e.target.value)} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          {createDonation.isPending ? 'Menghantar...' : 'Hantar Derma'}
        </Button>
      </form>
    </div>
  );
}
