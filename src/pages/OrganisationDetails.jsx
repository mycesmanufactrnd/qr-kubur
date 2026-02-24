import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft, Building2, CreditCard, ExternalLink, FileText,
  Globe, Mail, MapPin, Phone, Share2, ChevronRight, CheckCircle2
} from 'lucide-react';
import MapBox from '@/components/MapBox';
import DirectionButton from '@/components/DirectionButton';
import DonationButton from '@/components/DonationButton';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import PaymentSuccessfulComponent from '@/components/PaymentSuccessfulComponent';
import { useLocationContext } from '@/providers/LocationProvider';
import { useGetConfigByEntity } from '@/hooks/usePaymentConfigMutations';
import { MAINTENANCE_FEE, paymentToyyibStatus } from '@/utils/enums';
import { activityLogError, shareLink } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { validateFields } from '@/utils/validations';
import { showError, showSuccess } from '@/components/ToastrNotification';
import TextInputForm from '@/components/forms/TextInputForm';
import { userGoogleAccess } from '@/utils/auth';

export default function OrganisationDetails() {
  const { googleUser } = userGoogleAccess();
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
  const saveTransactionAccountMutation = trpc.toyyibPay.saveTransactionAccount.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createQuoteRunningNoMutation = trpc.runningNo.createQuotationRunningNo.useMutation();
  const createOrganisationQuotation = trpc.quotation.create.useMutation();

  const pendingQuotationRaw = sessionStorage.getItem("quotationPending") || '{}';
  const status_id = searchParams.get("status_id");
  const order_id = searchParams.get("order_id");

  useEffect(() => {
    if (googleUser) {
      setValue('payername', googleUser?.name ?? '');
      setValue('payeremail', googleUser?.email ?? '');
    }
  }, [googleUser]);

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
      if (!map[code]) map[code] = { code, name: config.paymentplatform.name, fields: [] };
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

  const selectedPlatform = paymentPlatforms.find((p) => p.code === paymentMethod);
  const selectedAccount = useMemo(() => {
    if (!selectedPlatform?.fields?.length) return { bankname: '', accountno: '' };
    const fields = selectedPlatform.fields;
    return {
      bankname: fields.find(f => f.key === 'bank_name')?.value?.trim() || '',
      accountno: fields.find(f => f.key === 'account_no')?.value?.trim() || '',
    };
  }, [selectedPlatform]);

  const isFromDeadPerson = !!deadpersonId;
  const serviceItems = useMemo(() => {
    if (!organisation) return [];
    return (organisation.serviceoffered || []).map((name) => ({
      name,
      price: Number(organisation.serviceprice?.[name] || 0),
    }));
  }, [organisation]);

  const selectedServiceItems = useMemo(() =>
    serviceItems.filter((s) => selectedServices.includes(s.name)),
    [serviceItems, selectedServices]);

  const quotationSubtotal = useMemo(() =>
    selectedServiceItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedServiceItems]);

  const quotationTotal = quotationSubtotal + MAINTENANCE_FEE;

  const toggleSelectedService = (name) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    if (!paymentPlatforms.length) return;
    const exists = paymentPlatforms.some((p) => p.code === paymentMethod);
    if (!exists) setValue('paymentMethod', paymentPlatforms[0].code);
  }, [paymentPlatforms, paymentMethod, setValue]);

  useEffect(() => {
    const statusText = status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown";
    if (!status_id || !pendingQuotationRaw) return;
    const formData = JSON.parse(pendingQuotationRaw);
    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    if (formData?.organisation?.id) url.searchParams.set("id", formData.organisation.id);
    if (formData?.deadperson?.id) url.searchParams.set("deadpersonId", formData.deadperson.id);
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
      const storedUser = sessionStorage.getItem("googleAuth");
      const googleRecordPayload = storedUser ? JSON.parse(storedUser) : null;
      createOrganisationQuotation.mutateAsync({
        ...formData,
        referenceno: order_id || formData.referenceno || null,
        googleuserId: googleRecordPayload?.id ?? null,
      })
      .then(async (res) => {
        if (res) {
          const orderNo = String(order_id || '');
          if (orderNo && formData?.selectedAccount?.accountno && formData?.selectedAccount?.bankname) {
            try {
              await saveTransactionAccountMutation.mutateAsync({
                orderNo,
                accountNo: String(formData.selectedAccount.accountno),
                bankName: String(formData.selectedAccount.bankname),
                type: 'Organisation',
              });
            } catch (err) {
              await createLogMutation.mutateAsync({ activitytype: 'Save Transaction Account', functionname: 'saveTransactionAccountMutation.mutateAsync', useremail: '', level: 'error', summary: activityLogError(err), extramessage: JSON.stringify({ orderNo, selectedAccount: formData?.selectedAccount }) });
            }
          }
          setSelectedServices([]);
          setIsQuotationDialogOpen(false);
        }
      })
      .catch((err) => createLogMutation.mutateAsync({ activitytype: 'Create Organisation Quotation', functionname: 'createOrganisationQuotation.mutateAsync', useremail: '', level: 'error', summary: activityLogError(err), extramessage: pendingQuotationRaw }))
      .finally(handleFinally);
    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const onSubmit = async (formData) => {
    const isValid = validateFields(
      { ...formData, selectedServiceItems, paymentPlatforms, paymentMethod },
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
      selectedservices: selectedServiceItems.map((item) => ({ service: item.name, price: Number(item.price || 0) })),
      serviceamount: Number(quotationSubtotal.toFixed(2)),
      maintenancefeeamount: Number(MAINTENANCE_FEE.toFixed(2)),
      totalamount: Number(quotationTotal.toFixed(2)),
      payername, payeremail, payerphone,
    };
    const resPayment = await handlePaymentConfig(quotationDetails);
    if (!resPayment) { showError('Payment Failed'); setLoadingPayment(false); }
  };

  const handlePaymentConfig = async (quotationDetails) => {
    if (!quotationDetails) return false;
    setLoadingPayment(true);
    const nextRunningNo = await createQuoteRunningNoMutation.mutateAsync();
    const runningNo = `QUO-${new Date().getFullYear()}-${String(nextRunningNo).padStart(4, '0')}`;
    sessionStorage.setItem("quotationPending", JSON.stringify({ ...quotationDetails, referenceno: runningNo, selectedAccount }));
    try {
      const quotation = await createBillMutation.mutateAsync({
        amount: quotationDetails?.totalamount ?? 0,
        referenceNo: runningNo,
        name: quotationDetails?.payername ?? 'ANONYMOUS',
        email: quotationDetails?.payeremail ?? 'noreply@gmail.com',
        phone: quotationDetails?.payerphone ?? '0123456789',
        returnTo: 'organisation',
      });
      if (quotation?.paymentUrl) { window.location.href = quotation.paymentUrl; return true; }
      else { setLoadingPayment(false); showError("No payment URL returned."); }
    } catch (err) {
      setLoadingPayment(false);
      showError(err.message || "Unknown error");
    }
  };

  if (isLoading || loadingPayment) return <PageLoadingComponent />;
  if (status_id) return <PaymentSuccessfulComponent />;
  if (isError || !organisation) return <NoDataCardComponent isPage={true} description="Organisation Not Found" />;

  const imageSrc = organisation.photourl
    ? `/api/file/bucket-organisation/${encodeURIComponent(organisation.photourl)}`
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={organisation.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Share */}
        <button
          onClick={() => shareLink({ title: organisation?.name, text: `Visit ${organisation?.name}`, url: window.location.href })}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-8 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-2">
              {organisation.organisationtype?.name && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/20">
                  {organisation.organisationtype.name}
                </span>
              )}
              {Array.isArray(organisation.states) && organisation.states[0] && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/20">
                  <MapPin className="w-3 h-3" />{organisation.states[0]}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{organisation.name}</h1>
            {organisation.address && (
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{organisation.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-12">

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <DirectionButton latitude={organisation.latitude} longitude={organisation.longitude} />
          {organisation.canbedonated && (
            <DonationButton
              recipientId={organisation.id}
              recipientType="organisation"
              state={Array.isArray(organisation.states) ? organisation.states[0] : 'nearby'}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Services */}
            {organisation.serviceoffered?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-violet-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Services Offered</p>
                </div>

                <div className="p-4">
                  {isFromDeadPerson ? (
                    <div className="space-y-2">
                      {serviceItems.map((serviceItem) => {
                        const isSelected = selectedServices.includes(serviceItem.name);
                        return (
                          <button
                            key={serviceItem.name}
                            type="button"
                            onClick={() => toggleSelectedService(serviceItem.name)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                              isSelected
                                ? 'border-violet-400 bg-violet-50'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="flex-1 text-sm font-medium text-slate-700">{serviceItem.name}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-violet-600' : 'text-slate-500'}`}>
                              RM {serviceItem.price.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}

                      {selectedServices.length > 0 && (
                        <button
                          onClick={() => setIsQuotationDialogOpen(true)}
                          className="w-full mt-1 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-violet-200 active:opacity-80 transition-all"
                        >
                          Get Quotation ({selectedServices.length} selected)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {organisation.serviceoffered.map((name) => (
                        <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 border border-violet-100 text-violet-700">
                          {name}
                          {Number(organisation.serviceprice?.[name] || 0) > 0 && (
                            <span className="font-bold">· RM {Number(organisation.serviceprice?.[name] || 0)}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {organisation.latitude != null && organisation.longitude != null && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-violet-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Location</p>
                </div>
                <div className="h-56">
                  <MapBox
                    dataMap={organisation}
                    userLocation={userLocation}
                    pageToUrl="OrganisationDetails"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-violet-600" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Contact Information</p>
              </div>
              <div className="divide-y divide-slate-100">
                {organisation.phone && (
                  <a href={`tel:${organisation.phone}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-semibold text-slate-700">{organisation.phone}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </a>
                )}
                {organisation.email && (
                  <a href={`mailto:${organisation.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">{organisation.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </a>
                )}
                {organisation.url && (
                  <a href={organisation.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Website</p>
                      <p className="text-sm font-semibold text-violet-600 flex items-center gap-1">Visit <ExternalLink className="w-3 h-3" /></p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </a>
                )}
                {organisation.address && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Address</p>
                      <p className="text-sm font-semibold text-slate-700">{organisation.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white">

          <div className="px-5 pt-5 pb-2 border-b border-slate-100">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Quotation
            </DialogTitle>
            <p className="text-base font-bold text-slate-800">{organisation.name}</p>          
          </div>

          <div className="px-5 pb-4 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Maklumat Pemohon</p>
                <TextInputForm name="payername"  control={control} label="Name"  required errors={errors} />
                <TextInputForm name="payeremail" control={control} label="Email" isEmail required errors={errors} />
                <TextInputForm name="payerphone" control={control} label="Phone" isPhone required errors={errors} />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Perkhidmatan</p>
                {deadPerson?.name && (
                  <p className="text-xs text-slate-400 mt-0.5">For: <span className="font-semibold text-slate-600">{deadPerson.name}</span></p>
                )}
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                  {selectedServiceItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="text-sm font-bold text-slate-700">RM {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-xs text-slate-400">Subtotal</span>
                    <span className="text-sm font-semibold text-slate-600">RM {quotationSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white">
                    <span className="text-xs text-slate-400">Maintenance Fee</span>
                    <span className="text-sm font-semibold text-slate-600">RM {MAINTENANCE_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-violet-50">
                    <span className="text-sm font-bold text-violet-700">Total</span>
                    <span className="text-base font-bold text-violet-700">RM {quotationTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {paymentPlatforms.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Kaedah Pembayaran</p>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setValue('paymentMethod', v)}>
                    <div className="space-y-2">
                      {paymentPlatforms.map((platform) => {
                        const isActive = paymentMethod === platform.code;
                        return (
                          <label
                            key={platform.code}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                              isActive ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <RadioGroupItem value={platform.code} />
                            <CreditCard className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-semibold ${isActive ? 'text-violet-700' : 'text-slate-600'}`}>{platform.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  {selectedPlatform && (
                    <div className="space-y-2 mt-2">
                      {selectedPlatform.fields.map((field) =>
                        field.fieldtype === 'image' ? (
                          <img key={field.key} src={field.value} alt={field.label} className="max-w-xs rounded-xl border border-slate-100" />
                        ) : (
                          <div key={field.key} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs text-slate-400 uppercase tracking-wide">{field.label}</span>
                            <span className="text-sm font-semibold text-slate-700">{field.value}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentPlatforms.length === 0 && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  Kaedah pembayaran belum dikonfigurasi untuk organisasi ini.
                </p>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-violet-200 active:opacity-80 transition-all"
              >
                Bayar Sekarang
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}