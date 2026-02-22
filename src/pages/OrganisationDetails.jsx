import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Building2, CreditCard, ExternalLink, FileText, Globe, Mail, MapPin, Phone, Share2 } from 'lucide-react';
import MapBox from '@/components/MapBox';
import DirectionButton from '@/components/DirectionButton';
import DonationButton from '@/components/DonationButton';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import PaymentSuccessfulComponent from '@/components/PaymentSuccessfulComponent';
import { useLocationContext } from '@/providers/LocationProvider';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { MAINTENANCE_FEE, paymentToyyibStatus } from '@/utils/enums';
import { activityLogError, clearQueryParams, shareLink } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { validateFields } from '@/utils/validations';
import { showError, showSuccess } from '@/components/ToastrNotification';
import TextInputForm from '@/components/forms/TextInputForm';

export default function OrganisationDetails() {
  const navigate = useNavigate();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const organisationId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const deadpersonId = searchParams.get('deadpersonId') ? Number(searchParams.get('deadpersonId')) : null;
  const [selectedServices, setSelectedServices] = useState([]);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const { control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { payername: '', payeremail: '', payerphone: '', paymentMethod: '' },
  });
  const paymentMethod = watch('paymentMethod');

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createQuoteRunningNoMutation = trpc.runningNo.createQuotationRunningNo.useMutation();
  const createOrganisationQuotation = trpc.quotation.create.useMutation();

  const pendingQuotationRaw = sessionStorage.getItem("quotationPending") || '{}';

  const status_id = searchParams.get("status_id");
  const order_id = searchParams.get("order_id");

  const { data: organisation, isLoading, isError } = trpc.organisation.getById.useQuery(
    { id: organisationId ?? 0 },
    { enabled: !!organisationId }
  );

  const { data: deadPerson } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: deadpersonId ?? 0 },
    { enabled: !!deadpersonId }
  );

  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: organisationId ?? undefined,
    entityType: 'organisation',
    enabled: !!organisationId,
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};

    paymentConfigs.forEach((config) => {
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

  const selectedPlatform = paymentPlatforms.find((platform) => platform.code === paymentMethod);

  const isFromDeadPerson = !!deadpersonId;

  const serviceItems = useMemo(() => {
    if (!organisation) return [];
    return (organisation.serviceoffered || []).map((serviceName) => ({
      name: serviceName,
      price: Number(organisation.serviceprice?.[serviceName] || 0),
    }));
  }, [organisation]);

  const selectedServiceItems = useMemo(() => {
    return serviceItems.filter((serviceItem) => selectedServices.includes(serviceItem.name));
  }, [serviceItems, selectedServices]);

  const quotationSubtotal = useMemo(() => {
    return selectedServiceItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [selectedServiceItems]);

  const quotationTotal = quotationSubtotal + MAINTENANCE_FEE;

  const toggleSelectedService = (serviceName) => {
    setSelectedServices((previous) =>
      previous.includes(serviceName)
        ? previous.filter((value) => value !== serviceName)
        : [...previous, serviceName]
    );
  };

  useEffect(() => {
    if (!paymentPlatforms.length) return;

    const exists = paymentPlatforms.some((platform) => platform.code === paymentMethod);

    if (!exists) {
      setValue('paymentMethod', paymentPlatforms[0].code);
    }
  }, [paymentPlatforms, paymentMethod, setValue]);

  useEffect(() => {
    const statusText = status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown";
    
    if (!status_id) return;    
   
    if (!pendingQuotationRaw) return;

    const formData = JSON.parse(pendingQuotationRaw);

    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);

    if (formData?.organisation?.id) {
      url.searchParams.set("id", formData.organisation.id);
    }

    if (formData?.deadperson?.id) {
      url.searchParams.set("deadpersonId", formData.deadperson.id);
    }    

    const handleFinally = () => {
      window.location.href = url.toString();
      sessionStorage.removeItem("quotationPending");
      setSelectedServices([]);
      setIsQuotationDialogOpen(false);
      setLoadingPayment(false);
    };

    if (statusText === "Success") {
      setLoadingPayment(true);
      
      showSuccess("Pembayaran berjaya!");

      createOrganisationQuotation.mutateAsync({
        ...formData,
        referenceno: order_id || formData.referenceno || null,
      })
      .then((res) => {
        if (res) {
          setSelectedServices([]);
          setIsQuotationDialogOpen(false);
        }
      })
      .catch((error) => {
        createLogMutation.mutateAsync({
          activitytype: 'Create Organisation Quotation',
          functionname: 'createOrganisationQuotation.mutateAsync',
          useremail: '',
          level: 'error',
          summary: activityLogError(error),
          extramessage: pendingQuotationRaw,
        })
      })
      .finally(() => {
        handleFinally();
      });

    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const onSubmit = async (formData) => {
    const validationData = {
      ...formData,
      selectedServiceItems,
      paymentPlatforms,
      paymentMethod,
    };

    const isValid = validateFields(validationData,
      [
        { field: 'selectedServiceItems', label: 'Service Type', type: 'array' },
        { field: 'paymentPlatforms', label: 'Payment Platform', type: 'array' },
        { field: 'paymentMethod', label: 'Payment Method', type: 'text' },
      ]
    );

    if (!isValid) return;

    const payername = (formData.payername || '').trim() || 'ANONYMOUS';
    const payeremail = (formData.payeremail || '').trim() || 'noreply@gmail.com';
    const payerphone = (formData.payerphone || '').trim() || '0123456789';

    const quotationDetails = {
      organisation: { id: Number(organisationId) },
      deadperson: { id: Number(deadpersonId) },
      selectedservices: selectedServiceItems.map((item) => ({
        service: item.name,
        price: Number(item.price || 0),
      })),
      serviceamount: Number(quotationSubtotal.toFixed(2)),
      maintenancefeeamount: Number(MAINTENANCE_FEE.toFixed(2)),
      totalamount: Number(quotationTotal.toFixed(2)),
      payername,
      payeremail,
      payerphone,
    };

    const resPayment = await handlePaymentConfig(quotationDetails);
    
    if (!resPayment) {
      showError('Payment Failed');
      setLoadingPayment(false);
      return;
    }
  }

  const handlePaymentConfig = async (quotationDetails) => {
    if (!quotationDetails) return false;
    
    setLoadingPayment(true);

    const nextRunningNo = await createQuoteRunningNoMutation.mutateAsync();
    
    const year = new Date().getFullYear();
    const runningNo = `QUO-${year}-${String(nextRunningNo).padStart(4, '0')}`;

    const payloadWithReferenceNo = {
      ...quotationDetails,
      referenceno: runningNo,
    };

    sessionStorage.setItem("quotationPending", JSON.stringify(payloadWithReferenceNo));

    try {
      const quotation = await createBillMutation.mutateAsync({
        amount: quotationDetails?.totalamount ?? 0,
        referenceNo: runningNo,
        name: quotationDetails?.payername ?? 'ANONYMOUS',
        email: quotationDetails?.payeremail ?? 'noreply@gmail.com',
        phone: quotationDetails?.payerphone ?? '0123456789',
        returnTo: 'organisation',
      });

      if (quotation && quotation.paymentUrl) {
        window.location.href = quotation.paymentUrl;
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

  if (isLoading || loadingPayment) {
    return <PageLoadingComponent />;
  }

  if (status_id) {
    return <PaymentSuccessfulComponent />;
  }

  if (isError || !organisation) {
    return <NoDataCardComponent isPage={true} description="Organisation Not Found" />;
  }

  const imageSrc = organisation.photourl
    ? `/api/file/bucket-organisation/${encodeURIComponent(organisation.photourl)}`
    : undefined;

  return (
    <div className="min-h-screen">
      <div className="relative h-72 md:h-80 overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={organisation.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            shareLink({
              title: organisation?.name,
              text: `Visit ${organisation?.name}`,
              url: window.location.href,
            });
          }}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          <Share2 className="w-5 h-5 text-stone-700" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              {organisation.organisationtype?.name && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  {organisation.organisationtype.name}
                </Badge>
              )}
              {Array.isArray(organisation.states) && organisation.states[0] && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  <MapPin className="w-3 h-3 mr-1" />
                  {organisation.states[0]}
                </Badge>
              )}
            </div>
            <h1 className="text-xl md:text-4xl font-bold text-white mb-2">{organisation.name}</h1>
            {organisation.address && (
              <p className="text-white/80 text-sm md:text-base max-w-2xl">{organisation.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8">
        <div className="flex flex-wrap gap-3 mb-8 -mt-12 relative z-10 px-4">
          <DirectionButton latitude={organisation.latitude} longitude={organisation.longitude} />
          {organisation.canbedonated && (
            <DonationButton
              recipientId={organisation.id}
              recipientType="organisation"
              state={Array.isArray(organisation.states) ? organisation.states[0] : 'nearby'}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 px-1">
          <div className="lg:col-span-2 space-y-6">
            {organisation.serviceoffered?.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="px-4 py-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-600" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  {isFromDeadPerson ? (
                    <div className="space-y-3">
                      {serviceItems.map((serviceItem) => (
                        <label
                          key={serviceItem.name}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            selectedServices.includes(serviceItem.name)
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedServices.includes(serviceItem.name)}
                            onCheckedChange={() => toggleSelectedService(serviceItem.name)}
                            className="mt-1"
                          />
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-800">{serviceItem.name}</span>
                            <span className="text-violet-600 font-semibold">RM {serviceItem.price.toFixed(2)}</span>
                          </div>
                        </label>
                      ))}

                      {selectedServices.length > 0 && (
                        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setIsQuotationDialogOpen(true)}>
                          Get Quotation
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {organisation.serviceoffered.map((serviceName) => (
                        <Badge key={serviceName} variant="secondary" className="px-3 py-1">
                          {serviceName}
                          {Number(organisation.serviceprice?.[serviceName] || 0) > 0 && (
                            <span className="ml-2 font-semibold">
                              RM {Number(organisation.serviceprice?.[serviceName] || 0)}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {organisation.latitude != null && organisation.longitude != null && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="px-4 py-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-600" />
                    Location
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="h-56">
                    <MapBox
                      dataMap={organisation}
                      userLocation={userLocation}
                      pageToUrl="OrganisationDetails"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="px-4 py-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm px-4">
                {organisation.phone && (
                  <a
                    href={`tel:${organisation.phone}`}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-slate-500">Phone</p>
                      <p className="font-medium text-slate-700">
                        {organisation.phone}
                      </p>
                    </div>
                  </a>
                )}

                {organisation.email && (
                  <a
                    href={`mailto:${organisation.email}`}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-slate-500">Email</p>
                      <p className="font-medium text-slate-700 truncate">
                        {organisation.email}
                      </p>
                    </div>
                  </a>
                )}

                {organisation.url && (
                  <a
                    href={organisation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-slate-500">Website</p>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        Visit
                        <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                )}

                {organisation.address && (
                  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-slate-500">Address</p>
                      <p className="font-medium text-slate-700 text-sm">
                        {organisation.address}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <TextInputForm
                name="payername"
                control={control}
                label="Name"
                required
                errors={errors}
              />
              <TextInputForm
                name="payeremail"
                control={control}
                label="Email"
                isEmail
                required
                errors={errors}
              />
              <TextInputForm
                name="payerphone"
                control={control}
                label="Phone"
                isPhone
                required
                errors={errors}
              />

              {deadPerson?.name && (
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-900">For:</span> {deadPerson.name}
                </p>
              )}

              <div className="space-y-2">
                {selectedServiceItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">RM {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">RM {quotationSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Maintenance Fee</span>
                  <span className="font-medium">RM {MAINTENANCE_FEE.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-violet-700">RM {quotationTotal.toFixed(2)}</span>
                </div>
              </div>

              {paymentPlatforms.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="font-semibold">Kaedah Pembayaran</p>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setValue('paymentMethod', value)}
                  >
                    <div className="grid gap-2">
                      {paymentPlatforms.map((platform) => (
                        <Label
                          key={platform.code}
                          className="flex items-center gap-3 p-3 border rounded cursor-pointer"
                        >
                          <RadioGroupItem value={platform.code} />
                          <CreditCard className="w-4 h-4" />
                          {platform.name}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>

                  {selectedPlatform && (
                    <div className="mt-2 space-y-2">
                      {selectedPlatform.fields.map((field) => (
                        field.fieldtype === 'image' ? (
                          <img key={field.key} src={field.value} alt={field.label} className="max-w-xs rounded border" />
                        ) : (
                          <p key={field.key}>
                            <strong>{field.label}:</strong> {field.value}
                          </p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {paymentPlatforms.length === 0 && (
                <p className="text-xs text-red-600">
                  Kaedah pembayaran belum dikonfigurasi untuk organisasi ini.
                </p>
              )}

              <Button
                type="submit" 
                className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white"
              >
                Pay
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
