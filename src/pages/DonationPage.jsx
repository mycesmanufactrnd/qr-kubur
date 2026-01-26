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
import { showError, showSuccess, showWarning } from '@/components/ToastrNotification';
import BackNavigation from '@/components/BackNavigation';
import { DONATION_AMOUNTS, paymentToyyibStatus, STATES_MY, VerificationStatus } from '@/utils/enums';
import { useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { useGetOrganisationCoordinates } from '@/hooks/useOrganisationMutations';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { useForm } from 'react-hook-form';
import { trpc } from '@/utils/trpc';
import { validateFields } from '@/utils/validations';
import { useLocationContext } from '@/providers/LocationProvider';
import { defaultDonationField } from '@/utils/defaultformfields';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { useSearchParams } from 'react-router-dom';
import { activityLogError, clearQueryParams, showEarthDistance } from '@/utils/helpers';
import { translate } from '@/utils/translations';

export default function DonationPage() {
  const [searchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState('nearby');
  const [submitted, setSubmitted] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { watch, setValue, handleSubmit, reset } = useForm({ defaultValues: defaultDonationField });
  const { userLocation, userState, locationDenied } = useLocationContext();
  const recipientType = watch('recipientType');
  const selectedRecipient = watch('selectedRecipient');
  const amount = watch('amount');
  const customAmount = watch('customAmount');
  const paymentMethod = watch('paymentMethod');
  const donorname = watch('donorname');
  const donorphoneno = watch('donorphoneno');
  const donoremail = watch('donoremail');
  const notes = watch('notes');

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createDonationRunningNoMutation = trpc.runningNo.createDonationRunningNo.useMutation();
  const createDonation = trpc.donation.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showSuccess('Terima kasih! Derma anda telah direkodkan.');
      reset(defaultDonationField);
    },
  });

  useEffect(() => {
    if (locationDenied) {
      showWarning('Lokasi tidak tersedia');
    }
  }, [locationDenied]);

  const finalAmount = useMemo(() => {
    const baseAmount = customAmount || amount;
    if (!baseAmount) return 0;
    return Number(baseAmount);
  }, [amount, customAmount]);

  useEffect(() => {
    const status_id = searchParams.get("status_id");
    const order_id = searchParams.get("order_id");
    const statusText = status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown";

    if (!status_id) return;

    const pendingDonation = sessionStorage.getItem("donationPending");
    if (!pendingDonation) return;

    const { formData, finalAmount } = JSON.parse(pendingDonation);

    if (statusText === "Success") {
      showSuccess("Pembayaran berjaya!");
      
      createDonation.mutateAsync({
        donorname: formData.donorname || null,
        donorphoneno: formData.donorphoneno || null,
        donoremail: formData.donoremail || null,
        amount: Number(finalAmount) || null,
        tahfizcenter: formData.recipientType === 'tahfiz' && formData.selectedRecipient
          ? { id: Number(formData.selectedRecipient) }
          : null,
        organisation: formData.recipientType === 'organisation' && formData.selectedRecipient
          ? { id: Number(formData.selectedRecipient) }
          : null,
        notes: formData.notes || null,
        status: VerificationStatus.PENDING,
        referenceno: order_id || null,
      })
      .then((res) => {
        if (res) {
          sessionStorage.removeItem("donationPending");
          clearQueryParams();
        }
      })
      .catch((error) => {
        createLogMutation.mutateAsync({
          activitytype: 'Create Donation',
          functionname: 'createDonation.mutateAsync',
          useremail: '',
          level: 'error',
          summary: activityLogError(error),
          extramessage: pendingDonation,
        })

        sessionStorage.removeItem("donationPending");
        clearQueryParams();
      })

    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const shouldFetchOrganisation = !!userLocation && recipientType === 'organisation';
  const shouldFetchTahfiz = !!userLocation && recipientType === 'tahfiz';

  const { organisations = [] } = useGetOrganisationCoordinates(
    shouldFetchOrganisation 
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    selectedState === 'nearby' ? userState : selectedState
  );

  const { data: tahfizCenters = [] } = useGetTahfizCoordinates(
    shouldFetchTahfiz
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    selectedState === 'nearby' ? userState : selectedState
  );

  const { data: paymentConfigs } = useGetConfigByEntity({
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
    if (!paymentPlatforms.length) return;

    const exists = paymentPlatforms.some(p => p.code === paymentMethod);

    if (!exists) {
      setValue('paymentMethod', paymentPlatforms[0].code);
    }
  }, [paymentPlatforms, paymentMethod, setValue]);

  const handlePaymentConfig = async (formData) => {
    if (!formData) return false;
    
    setLoadingPayment(true);

    sessionStorage.setItem("donationPending", JSON.stringify({ formData, finalAmount }));

    const nextRunningNo = await createDonationRunningNoMutation.mutateAsync();
    
    const year = new Date().getFullYear();
    const runningNo = `DON-${year}-${String(nextRunningNo).padStart(4, '0')}`

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: finalAmount,
        referenceNo: runningNo,
        name: formData?.donorname ?? 'ANONYMOUS',
        email: formData?.donoremail ?? 'noreply@gmail.com',
        phone: formData?.donorphoneno ?? '0123456789',
        returnTo: 'donation',
      });

      if (bill && bill.paymentUrl) {
        window.location.href = bill.paymentUrl;
        return true;
      } else {
        setLoadingPayment(false);
        showError("No payment URL returned.");
      }
    } catch (err) {
      setLoadingPayment(false);
      showError(err.message || "Unknown error");

    }
  };

  const onSubmit = async (formData) => {
    const isValid = validateFields(formData, [
      { field: 'recipientType', label: 'Recipient Type', type: 'select' },
      { field: 'email', label: 'Email', type: 'email', required: false },
      { field: 'paymentMethod', label: 'Payment Method', type: 'text' },
      { field: 'selectedRecipient', label: 'Recepient', type: 'text' },
    ]);

    if (!isValid) return;

    const finalAmount = formData.customAmount || formData.amount;

    if (!finalAmount) {
      showError('Sila lengkapkan maklumat derma');
      return;
    }

    const resPayment = await handlePaymentConfig(formData);

    if (!resPayment) {
      showError('Payment Failed');
      setLoadingPayment(false);
      return;
    }    
  };

  if (loadingPayment) {
    return <PageLoadingComponent/>
  }

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
                <div className="mb-2">
                  <Select value={selectedState} 
                    onValueChange={(v) => {
                      setSelectedState(v);
                      setValue('selectedRecipient', '');
                      setValue('paymentMethod', '');
                    }}
                  >
                    <SelectTrigger className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectValue placeholder={translate('state')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700">
                      <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                      {STATES_MY.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select
                  value={selectedRecipient ? String(selectedRecipient) : ''}
                  onValueChange={v => setValue('selectedRecipient', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih organisasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {organisations.map(organisation => (
                      <SelectItem key={organisation.id} value={String(organisation.id)}>
                        {organisation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="tahfiz" className="mt-4">
                <div className="mb-2">
                  <Select value={selectedState}
                    onValueChange={(v) => {
                      setSelectedState(v);
                      setValue('selectedRecipient', '');
                      setValue('paymentMethod', '');
                    }}
                  >
                    <SelectTrigger className="h-9 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectValue placeholder={translate('state')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700">
                      <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                      {STATES_MY.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          <CardHeader><CardTitle>Maklumat Penderma (optional)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nama" value={donorname} onChange={e => setValue('donorname', e.target.value)} />
            <Input placeholder="Email" value={donoremail} onChange={e => setValue('donoremail', e.target.value)} />
            <Input placeholder="Phone No." value={donorphoneno} onChange={e => setValue('donorphoneno', e.target.value)} />
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
