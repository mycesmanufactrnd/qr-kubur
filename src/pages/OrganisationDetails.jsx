import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Building2, ExternalLink, FileText, Globe, Mail, MapPin, Phone, Share2 } from 'lucide-react';
import MapBox from '@/components/MapBox';
import DirectionButton from '@/components/DirectionButton';
import DonationButton from '@/components/DonationButton';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { useLocationContext } from '@/providers/LocationProvider';
import { paymentToyyibStatus, SERVICE_FEE } from '@/utils/enums';
import { activityLogError, clearQueryParams, shareLink } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { showError, showSuccess } from '@/components/ToastrNotification';

export default function OrganisationDetails() {
  const navigate = useNavigate();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { userLocation } = useLocationContext();
  const [searchParams] = useSearchParams();
  const organisationId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const deadpersonId = searchParams.get('deadpersonId') ? Number(searchParams.get('deadpersonId')) : null;
  const [selectedServices, setSelectedServices] = useState([]);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createQuoteRunningNoMutation = trpc.runningNo.createQuotationRunningNo.useMutation();

  const { data: organisation, isLoading, isError } = trpc.organisation.getById.useQuery(
    { id: organisationId ?? 0 },
    { enabled: !!organisationId }
  );

  const { data: deadPerson } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: deadpersonId ?? 0 },
    { enabled: !!deadpersonId }
  );

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

  const quotationTotal = quotationSubtotal + SERVICE_FEE; 

  const toggleSelectedService = (serviceName) => {
    setSelectedServices((previous) =>
      previous.includes(serviceName)
        ? previous.filter((value) => value !== serviceName)
        : [...previous, serviceName]
    );
  };

  useEffect(() => {
    const status_id = searchParams.get("status_id");
    const order_id = searchParams.get("order_id");
    const statusText = status_id ? paymentToyyibStatus[status_id] || "Unknown" : "Unknown";

    if (!status_id) return;

    const pendingTahlil = sessionStorage.getItem("quotationPending");
    if (!pendingTahlil) return;

    const formData = JSON.parse(pendingTahlil);

    if (statusText === "Success") {

      showSuccess("Pembayaran berjaya!");
      // createOrganisationQuotation.mutateAsync({
      //   requestorname: formData.requestorname || "",
      //   requestorphoneno: formData.requestorphoneno || "",
      //   requestoremail: formData.requestoremail || "",
      //   deceasednames: formData.deceasednames || [],
      //   selectedservices: formData.selectedservices || [],
      //   tahfizcenter: formData.tahfizcenter || null,
      //   customservice: formData.customservice || null,
      //   referenceno: order_id || formData.referenceno || null,
      //   serviceamount: Number(formData.serviceamount) || 0,
      //   platformfeeamount: Number(formData.platformfeeamount) || 0,
      //   status: TahlilStatus.PENDING,
      // })
      // .then((res) => {
      //   if (res) {
      //     sessionStorage.removeItem("quotationPending");
      //     clearQueryParams();
      //   }
      // })
      // .catch((error) => {
      //   createLogMutation.mutateAsync({
      //     activitytype: 'Create Organisation Quaotation',
      //     functionname: 'createOrganisationQuotation.mutateAsync',
      //     useremail: '',
      //     level: 'error',
      //     summary: activityLogError(error),
      //     extramessage: pendingTahlil,
      //   })

      //   sessionStorage.removeItem("quotationPending");
      //   clearQueryParams();
      // })

    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const handlePayment = async () => {
    let quotationDetails = {
      organisation: { id: Number(organisationId) },
      deadperson: { id: Number(deadpersonId) },
      serviceamount: quotationTotal,
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

    sessionStorage.setItem("quotationPending", JSON.stringify({ quotationDetails }));

    const nextRunningNo = await createQuoteRunningNoMutation.mutateAsync();
    
    const year = new Date().getFullYear();
    const runningNo = `QUO-${year}-${String(nextRunningNo).padStart(4, '0')}`

    try {
      const bill = await createBillMutation.mutateAsync({
        amount: quotationDetails?.serviceamount ?? 0,
        referenceNo: runningNo,
        name: quotationDetails?.donorname ?? 'ANONYMOUS',
        email: quotationDetails?.donoremail ?? 'noreply@gmail.com',
        phone: quotationDetails?.donorphoneno ?? '0123456789',
        returnTo: 'organisation',
      });

      if (bill && bill.paymentUrl) {
        const sessionData = JSON.parse(sessionStorage.getItem("quotationPending") || "{}");
        const quotationDetails = sessionData?.quotationDetails;

        const url = new URL(bill.paymentUrl);

        if (quotationDetails?.organisation?.id) {
          url.searchParams.set("id", quotationDetails.organisation.id);
        }

        if (quotationDetails?.deadperson?.id) {
          url.searchParams.set("deadpersonId", quotationDetails.deadperson.id);
        }

        window.location.href = url.toString();
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle>Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
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
                <span className="font-medium">RM {SERVICE_FEE.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-violet-700">RM {quotationTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handlePayment} 
              className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Pay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
