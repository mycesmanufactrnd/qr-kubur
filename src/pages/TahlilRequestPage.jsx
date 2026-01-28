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
import { useGetTahfizById, useGetTahfizCoordinates } from '@/hooks/useTahfizMutations';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { DONATION_AMOUNTS, paymentToyyibStatus, SERVICE_FEE_PERCENTAGE, SERVICE_TYPES, SST_PERCENTAGE, TahlilStatus } from '@/utils/enums';
import { defaultTahlilRequestField } from '@/utils/defaultformfields';
import { validateFields } from '@/utils/validations';
import { activityLogError, clearQueryParams, trimEmptyArray } from '@/utils/helpers';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { trpc } from '@/utils/trpc';
import { useSearchParams } from 'react-router-dom';

export default function TahlilRequestPage() {
  const [searchParams] = useSearchParams();
  const { userLocation, userState } = useLocationContext();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDeceasedNames, setSubmittedDeceasedNames] = useState([]);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createTahlilRunningNoMutation = trpc.runningNo.createTahlilRunningNo.useMutation();
  const createTahlilRequest = trpc.tahlilRequest.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showSuccess('Terima kasih! Permohonan anda telah direkodkan.');
      reset(defaultTahlilRequestField);
    },
  });

  const preSelectedTahfiz = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tahfiz') || '';
  }, []);

  const hasPreselectedTahfiz = !!preSelectedTahfiz;

  const { data: tahfizById } = useGetTahfizById(
    hasPreselectedTahfiz ? Number(preSelectedTahfiz) : undefined
  );

  const { data: nearbyTahfiz = [] } = useGetTahfizCoordinates(
    !hasPreselectedTahfiz && userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : null,
    userState
  );

  const tahfizCenters = useMemo(() => {
    if (hasPreselectedTahfiz && tahfizById) {
      return [tahfizById];
    }

    return nearbyTahfiz;
  }, [hasPreselectedTahfiz, tahfizById, nearbyTahfiz]);

  const { watch, setValue, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultTahlilRequestField, tahfizId: preSelectedTahfiz }
  });


  const tahfizId = watch('tahfizId');
  const selectedservices = watch('selectedservices');
  const customservice = watch('customservice');
  const amount = watch('amount');
  const customAmount = watch('customAmount');
  const paymentMethod = watch('paymentMethod');
  
  const selectedTahfiz = useMemo(() => {
    return tahfizCenters.find(c => c.id === Number(tahfizId)) || null;
  }, [tahfizCenters, tahfizId]);

  const validServiceTypes = useMemo(() => {
    return (selectedservices || []).filter(
      (type) =>
        type && selectedTahfiz?.serviceprice?.[type]
    );
  }, [selectedservices, selectedTahfiz]);
  
  const hasService = (selectedservices || []).some(
    type => type && selectedTahfiz?.serviceprice?.[type]
  );

  const serviceAmount = useMemo(() => {
    return validServiceTypes.reduce((sum, type) => {
      return sum + Number(selectedTahfiz?.serviceprice?.[type] || 0);
    }, 0);
  }, [validServiceTypes, selectedTahfiz]);

  const donationAmount = useMemo(() => {
    return Number(customAmount || amount) || 0;
  }, [amount, customAmount]);

  const platformFee = useMemo(() => {
    if (!hasService) return 0;
    return (serviceAmount) * SERVICE_FEE_PERCENTAGE;
  }, [hasService, serviceAmount]);

  const finalAmountWithoutFee = donationAmount + serviceAmount;
  const finalAmountWithFee = finalAmountWithoutFee + platformFee;

  useEffect(() => {
    const status_id = searchParams.get("status_id");
    const order_id = searchParams.get("order_id");
    const statusText = status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown";

    if (!status_id) return;

    const pendingTahlil = sessionStorage.getItem("tahlilRequestPending");
    if (!pendingTahlil) return;

    const formData = JSON.parse(pendingTahlil);

    if (statusText === "Success") {

      setSubmittedDeceasedNames(formData.deceasednames);
      
      showSuccess("Pembayaran berjaya!");
      createTahlilRequest.mutateAsync({
        requestorname: formData.requestorname || "",
        requestorphoneno: formData.requestorphoneno || "",
        requestoremail: formData.requestoremail || "",
        deceasednames: formData.deceasednames || [],
        selectedservices: formData.selectedservices || [],
        tahfizcenter: formData.tahfizcenter || null,
        customservice: formData.customservice || null,
        referenceno: order_id || formData.referenceno || null,
        serviceamount: Number(formData.serviceamount) || 0,
        platformfeeamount: Number(formData.platformfeeamount) || 0,
        status: TahlilStatus.PENDING,
      })
      .then((res) => {
        if (res) {
          sessionStorage.removeItem("tahlilRequestPending");
          clearQueryParams();
        }
      })
      .catch((error) => {
        createLogMutation.mutateAsync({
          activitytype: 'Create Tahlil Request',
          functionname: 'createTahlilRequest.mutateAsync',
          useremail: '',
          level: 'error',
          summary: activityLogError(error),
          extramessage: pendingTahlil,
        })

        sessionStorage.removeItem("tahlilRequestPending");
        clearQueryParams();
      })

    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const { data: paymentConfigs } = useGetConfigByEntity({
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

  const selectedPlatform = paymentPlatforms.find(p => p.code === paymentMethod);

  useEffect(() => {
    if (!paymentPlatforms.length) return;

    const exists = paymentPlatforms.some(p => p.code === paymentMethod);

    if (!exists) {
      setValue('paymentMethod', paymentPlatforms[0].code);
    }
  }, [paymentPlatforms, paymentMethod, setValue]);

  const toggleServiceType = (value) => {
    const current = watch('selectedservices') || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
      
    setValue('selectedservices', updated);
  };
  const handleAddDeceased = () => {
    const names = watch('deceasednames');
    setValue('deceasednames', [...names, '']);
  };

  const handleRemoveDeceased = (index) => {
    const names = watch('deceasednames');
    if (names.length > 1) setValue('deceasednames', names.filter((_, i) => i !== index));
  };

  const handleDeceasedChange = (index, value) => {
    const names = watch('deceasednames');
    names[index] = value;
    setValue('deceasednames', names);
  };

  const handlePaymentConfig = async (formData) => {
    if (!formData) return false;

    setLoadingPayment(true);

    sessionStorage.setItem(
      "tahlilRequestPending",
      JSON.stringify(formData)
    );

    const nextRunningNo = await createTahlilRunningNoMutation.mutateAsync();
    
    const year = new Date().getFullYear();
    const runningNo = `THL-${year}-${String(nextRunningNo).padStart(4, '0')}`;

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: finalAmountWithFee,
        referenceNo: runningNo,
        name: formData?.requestorname ?? 'ANONYMOUS',
        email: formData?.requestoremail ?? 'noreply@gmail.com',
        phone: formData?.requestorphoneno ?? '0123456789',
        returnTo: 'tahfiz',
      });

      if (bill && bill.paymentUrl) {
        window.location.href = bill.paymentUrl;
        return true;
      } else {
        setLoadingPayment(false);
        showError("No payment URL returned.");
      }
    } catch (err) {
      console.error('Error: ', err.message)
      setLoadingPayment(false);
      showError(err.message || "Unknown error");
    }
  };

  const onSubmit = async (formData) => {
    formData.selectedservices = trimEmptyArray(formData.selectedservices);
    formData.deceasednames = trimEmptyArray(formData.deceasednames);

    const isValid = validateFields(formData, [
      { field: 'tahfizId', label: 'Tahfiz Center', type: 'select' },
      { field: 'requestorname', label: 'Requestor Name', type: 'text' },
      { field: 'requestorphoneno', label: 'Requestor Phone No.', type: 'phone' },
      { field: 'requestoremail', label: 'Requestor Email', type: 'email', required: false },
      { field: 'selectedservices', label: 'Service Type', type: 'array' },
      { field: 'deceasednames', label: 'Deceased Names', type: 'array' },
      { field: 'paymentMethod', label: 'Payment Method', type: 'text' },
    ]);

    if (!isValid) return;

    let tahlilRequest = {
      tahfizcenter: { id: Number(tahfizId) },
      selectedservices: formData.selectedservices,
      deceasednames: formData.deceasednames,
      requestorname: formData.requestorname,
      requestorphoneno: formData.requestorphoneno,
      requestoremail: formData.requestoremail,
      customservice: formData.customservice || '',
      status: TahlilStatus.PENDING,
      platformfeeamount: platformFee,
      serviceamount: finalAmountWithoutFee,
    };

    const resPayment = await handlePaymentConfig(tahlilRequest);
    
    if (!resPayment) {
      showError('Payment Failed');
      setLoadingPayment(false);
      return;
    }    
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
                {submittedDeceasedNames.filter(n => n).join(', ')}
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

  if (loadingPayment) {
    return ( <PageLoadingComponent/> )
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
                    selectedservices.includes(service.value)
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'dark:border-gray-600'
                  }`}
                >
                  <Checkbox
                    checked={(watch('selectedservices') || []).includes(service.value)}
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

              {selectedservices.includes('custom') && (
                <Textarea
                  placeholder="Jelaskan perkhidmatan khas..."
                  value={customservice}
                  onChange={e => setValue('customservice', e.target.value)}
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
            {watch('deceasednames').map((name, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Nama Arwah ${watch('deceasednames').length > 1 ? i+1 : ''}`}
                  value={name}
                  onChange={e => handleDeceasedChange(i, e.target.value)}
                  className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                {watch('deceasednames').length > 1 && (
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
            <Input placeholder="Nama Pemohon" value={watch('requestorname')} onChange={e => setValue('requestorname', e.target.value)} />
            <Input placeholder="Telefon" value={watch('requestorphoneno')} onChange={e => setValue('requestorphoneno', e.target.value)} />
            <Input placeholder="Email" value={watch('requestoremail')} onChange={e => setValue('requestoremail', e.target.value)} />
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
                    if (amount === String(amt)) {
                      setValue('amount', '');
                    } else {
                      setValue('amount', String(amt));
                      setValue('customAmount', '');
                    }
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

         {selectedTahfiz && paymentPlatforms.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader><CardTitle className="text-lg dark:text-white">Kaedah Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={v => setValue('paymentMethod', v)}>
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
            <hr className="border-gray-300 dark:border-gray-600 my-0 mb-3" />
            <CardContent className="text-sm text-gray-500 text-left">
              {hasService && (
                <div className="space-y-1">
                  <p><strong>Servis Dipilih:</strong></p>
                  <ol className="list-disc ml-5 space-y-1">
                    {validServiceTypes.map(type =>
                      selectedTahfiz?.serviceprice?.[type] && (
                        <li key={type}>
                          {SERVICE_TYPES.find(s => s.value === type)?.label}:
                          <span className="font-medium"> RM {selectedTahfiz.serviceprice[type]}</span>
                        </li>
                      )
                    )}
                  </ol>
                </div>
              )}

              {(Number(customAmount) > 0 || Number(amount) > 0) && (
                <>
                  <hr className="my-3" />
                  <div>
                    <strong>Jumlah Derma:</strong> RM {(Number(customAmount || amount) || 0).toFixed(2)}
                  </div>
                  <span className="text-xs text-gray-400">
                    *Tidak termasuk yuran platform
                  </span>
                </>
              )}
              <hr className="my-3" />
              <div className="space-y-1">
                <p>
                  <strong>Jumlah (Tanpa Yuran):</strong> RM {finalAmountWithoutFee.toFixed(2)}
                </p>

                {hasService && (
                  <p>
                    <strong>Yuran Platform (5%):</strong> RM {platformFee.toFixed(2)}
                  </p>
                )}

                <p className="font-bold text-gray-900 dark:text-white">
                  <strong>Jumlah Keseluruhan:</strong> RM {(finalAmountWithFee).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white">
          Hantar Permohonan
        </Button>
      </form>
    </div>
  );
}
