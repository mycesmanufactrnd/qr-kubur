// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";
import { openPaymentUrl } from "@/utils/payment";
import {
  Heart,
  Building2,
  CreditCard,
  Search,
  MapPin,
  User,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  showError,
  showSuccess,
  showWarning,
} from "@/components/ToastrNotification";
import BackNavigation from "@/components/BackNavigation";
import {
  DONATION_AMOUNTS,
  normalizeState,
  paymentToyyibStatus,
  PLATFORM_DONATION_FEE,
  STATES_MY,
  VerificationStatus,
} from "@/utils/enums";
import { useGetTahfizCoordinates } from "@/hooks/useTahfizMutations";
import { useGetOrganisationCoordinates } from "@/hooks/useOrganisationMutations";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { validateFields } from "@/utils/validations";
import { useLocationContext } from "@/providers/LocationProvider";
import { defaultDonationField } from "@/utils/defaultformfields";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSearchParams } from "react-router-dom";
import { activityLogError, clearQueryParams } from "@/utils/helpers";
import { translate } from "@/utils/translations";
import PaymentSuccessfulComponent from "@/components/PaymentSuccessfulComponent";
import { userGoogleAccess } from "@/utils/auth";

const MAX_VISIBLE_RECIPIENTS = 3;

function Section({
  title,
  icon: Icon,
  accent = "emerald",
  headerAction,
  children,
}) {
  const colors = {
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-500",
    blue: "text-blue-500",
    rose: "text-rose-500",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${colors[accent]}`} />}
          <p
            className={`text-[11px] font-semibold uppercase tracking-widest ${colors[accent]}`}
          >
            {title}
          </p>
        </div>
        {headerAction ? <div>{headerAction}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TypeToggle({ value, onChange }) {
  const options = [
    {
      value: "organisation",
      label: translate("Organisation"),
      icon: Building2,
    },
    { value: "tahfiz", label: translate("Tahfiz Center"), icon: Heart },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
              isActive
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DonationPage() {
  const { googleUser } = userGoogleAccess();
  const hasAppliedUrlRecipient = useRef(false);
  const searchDebounceRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selectedState, setSelectedState] = useState(() => {
    const rawState = searchParams.get("state");
    if (!rawState || rawState === "nearby") return "nearby";
    const matched = STATES_MY.find(
      (s) => normalizeState(s) === normalizeState(rawState),
    );
    return matched || "nearby";
  });

  const urlParamId = searchParams.get("id") || null;
  const urlParamType = searchParams.get("type");
  const status_id = searchParams.get("status_id");
  const order_id = searchParams.get("order_id");

  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [showSavePhoneDialog, setShowSavePhoneDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingPhone, setPendingPhone] = useState("");
  const { watch, setValue, handleSubmit, reset } = useForm({
    defaultValues: {
      ...defaultDonationField,
      donorname: "HAMBA ALLAH",
    },
  });
  const { userLocation, userState, locationDenied } = useLocationContext();

  const recipientType = watch("recipientType");
  const selectedRecipient = watch("selectedRecipient");
  const amount = watch("amount");
  const customAmount = watch("customAmount");
  const paymentMethod = watch("paymentMethod");
  const donorname = watch("donorname");
  const donorphoneno = watch("donorphoneno");
  const donoremail = watch("donoremail");
  const notes = watch("notes");
  const hasDonorInfo = Boolean(
    donorname || donoremail || donorphoneno || notes,
  );

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const saveTransactionAccountMutation =
    trpc.toyyibPay.saveTransactionAccount.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createDonationRunningNoMutation =
    trpc.runningNo.createDonationRunningNo.useMutation();
  const createDonation = trpc.donation.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Thank you! Your donation has been recorded."));
      reset(defaultDonationField);
    },
  });

  useEffect(() => {
    if (googleUser) {
      setValue("donorname", googleUser?.name ?? "");
      setValue("donoremail", googleUser?.email ?? "");
    }
  }, [googleUser]);

  useEffect(() => {
    const saved = localStorage.getItem("userphoneno");
    if (saved && !watch("donorphoneno")) {
      setValue("donorphoneno", saved);
    }
  }, []);

  useEffect(() => {
    if (locationDenied) showWarning(translate("Location not available"));
  }, [locationDenied]);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilterName(searchQuery);
    }, 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  const baseAmount = useMemo(
    () => Number(customAmount || amount) || 0,
    [amount, customAmount],
  );
  const payableAmount = useMemo(
    () =>
      baseAmount > 0 ? baseAmount + Number(PLATFORM_DONATION_FEE || 0) : 0,
    [baseAmount],
  );

  // Handles a terminal ToyyibPay result, whether it came from the web
  // redirect (`?status_id=...` in the URL, see effect below) or from native
  // polling via `openPaymentUrl`'s `onStatus` callback (see handlePaymentConfig).
  const handlePaymentResult = (statusText, orderId) => {
    const pendingDonation = localStorage.getItem("donationPending");
    if (!pendingDonation) return;

    const { formData, baseAmount, payableAmount, selectedAccount } =
      JSON.parse(pendingDonation);

    const handleFinally = () => {
      const cleanUrl = clearQueryParams();
      if (cleanUrl) window.location.href = cleanUrl;
      localStorage.removeItem("donationPending");
      setLoadingPayment(false);
    };

    if (statusText === "Success") {
      setLoadingPayment(true);
      setPaymentSucceeded(true);
      showSuccess(translate("Payment successful!"));

      const storedUser =
        localStorage.getItem("googleAuth") ||
        sessionStorage.getItem("googleAuth");
      let googleRecordPayload = null;

      if (storedUser) {
        googleRecordPayload = JSON.parse(storedUser);
      }

      createDonation
        .mutateAsync({
          ...formData,
          amount: Number(baseAmount ?? payableAmount ?? 0) || null,
          tahfizcenter:
            formData.recipientType === "tahfiz" && formData.selectedRecipient
              ? { id: Number(formData.selectedRecipient) }
              : null,
          organisation:
            formData.recipientType === "organisation" &&
            formData.selectedRecipient
              ? { id: Number(formData.selectedRecipient) }
              : null,
          status: VerificationStatus.PENDING,
          referenceno: orderId || null,
          googleuserId: googleRecordPayload?.id ?? null,
        })
        .then(async (res) => {
          if (res) {
            const orderNo = String(orderId || "");

            if (
              orderNo &&
              selectedAccount?.accountno &&
              selectedAccount?.bankname
            ) {
              try {
                await saveTransactionAccountMutation.mutateAsync({
                  orderNo,
                  accountNo: selectedAccount?.accountno ?? "",
                  bankName: selectedAccount?.bankname ?? "",
                  type: "Donation",
                });
              } catch (accountError) {
                await createLogMutation.mutateAsync({
                  activitytype: "Save Transaction Account",
                  functionname: "saveTransactionAccountMutation.mutateAsync",
                  useremail: "",
                  level: "error",
                  summary: activityLogError(accountError),
                  extramessage: JSON.stringify({ orderNo, selectedAccount }),
                });
              }
            }
          }
        })
        .catch((error) => {
          createLogMutation.mutateAsync({
            activitytype: "Create Donation",
            functionname: "createDonation.mutateAsync",
            useremail: "",
            level: "error",
            summary: activityLogError(error),
            extramessage: pendingDonation,
          });
        })
        .finally(handleFinally);
    } else if (statusText === "Pending") {
      showError(translate("Payment is still being processed."));
      setLoadingPayment(false);
    } else {
      showError(translate("Payment failed."));
      setLoadingPayment(false);
    }
  };

  useEffect(() => {
    if (!status_id) return;
    handlePaymentResult(paymentToyyibStatus[status_id] || "Unknown", order_id);
  }, [searchParams]);

  const hasSpecificState = selectedState !== "nearby" && !!selectedState;

  const shouldFetchOrganisation =
    recipientType === "organisation" && (!!userLocation || hasSpecificState);

  const shouldFetchTahfiz =
    recipientType === "tahfiz" && (!!userLocation || hasSpecificState);

  const { organisations = [], isLoading: isOrgLoading } =
    useGetOrganisationCoordinates(
      shouldFetchOrganisation && userLocation
        ? { latitude: userLocation.lat, longitude: userLocation.lng }
        : null,
      selectedState === "nearby" ? userState : selectedState,
      filterName,
      true,
      true,
      MAX_VISIBLE_RECIPIENTS,
    );

  const { data: tahfizCenters = [], isLoading: isTahfizLoading } =
    useGetTahfizCoordinates({
      coordinates:
        shouldFetchTahfiz && userLocation
          ? { latitude: userLocation.lat, longitude: userLocation.lng }
          : null,
      filterState: selectedState === "nearby" ? userState : selectedState,
      isTahlilServiceOnly: false,
      filterName,
      filterHasPaymentConfig: true,
      limit: MAX_VISIBLE_RECIPIENTS,
    });

  useEffect(() => {
    if (!urlParamType || !["tahfiz", "organisation"].includes(urlParamType))
      return;
    setValue("recipientType", urlParamType);
    setValue("paymentMethod", "");
  }, [urlParamType, setValue]);

  useEffect(() => {
    if (hasAppliedUrlRecipient.current || !urlParamId || !urlParamType) return;

    if (urlParamType === "tahfiz" && tahfizCenters.length > 0) {
      setValue("selectedRecipient", String(urlParamId));
      hasAppliedUrlRecipient.current = true;
    }

    if (urlParamType === "organisation" && organisations.length > 0) {
      setValue("selectedRecipient", String(urlParamId));
      hasAppliedUrlRecipient.current = true;
    }
  }, [
    urlParamId,
    urlParamType,
    tahfizCenters.length,
    organisations.length,
    setValue,
  ]);

  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: Number(selectedRecipient),
    entityType: recipientType,
    enabled: !!selectedRecipient && !!recipientType,
  });

  useEffect(() => {
    if (!selectedRecipient) return;

    const exists =
      recipientType === "organisation"
        ? organisations.some((o) => String(o.id) === String(selectedRecipient))
        : tahfizCenters.some((t) => String(t.id) === String(selectedRecipient));

    if (!exists) {
      setValue("selectedRecipient", "");
      setValue("paymentMethod", "");
    }
  }, [
    organisations,
    tahfizCenters,
    selectedRecipient,
    recipientType,
    setValue,
  ]);

  const paymentPlatforms = useMemo(() => {
    const map = {};
    paymentConfigs.forEach((config) => {
      if (!config.paymentplatform) return;
      const code = config.paymentplatform.code;
      if (!map[code])
        map[code] = { code, name: config.paymentplatform.name, fields: [] };
      if (config.paymentfield)
        map[code].fields.push({
          key: config.paymentfield.key,
          label: config.paymentfield.label,
          fieldtype: config.paymentfield.fieldtype,
          value: config.value,
        });
    });
    return Object.values(map);
  }, [paymentConfigs]);

  const selectedPlatform = paymentPlatforms.find(
    (p) => p.code === paymentMethod,
  );
  const selectedAccount = useMemo(() => {
    if (!selectedPlatform?.fields?.length)
      return { bankname: "", accountno: "" };
    const fields = selectedPlatform.fields;
    return {
      bankname: fields.find((f) => f.key === "bank_name")?.value?.trim() || "",
      accountno:
        fields.find((f) => f.key === "account_no")?.value?.trim() || "",
    };
  }, [selectedPlatform]);

  useEffect(() => {
    if (!paymentPlatforms.length) return;
    if (!paymentPlatforms.some((p) => p.code === paymentMethod))
      setValue("paymentMethod", paymentPlatforms[0].code);
  }, [paymentPlatforms, paymentMethod, setValue]);

  const handlePaymentConfig = async (formData) => {
    if (!formData) return false;
    setLoadingPayment(true);
    localStorage.setItem(
      "donationPending",
      JSON.stringify({ formData, baseAmount, payableAmount, selectedAccount }),
    );
    const nextRunningNo = await createDonationRunningNoMutation.mutateAsync();
    const year = new Date().getFullYear();
    const runningNo = `DON-${year}-${String(nextRunningNo).padStart(4, "0")}`;
    try {
      const bill = await createBillMutation.mutateAsync({
        amount: payableAmount,
        referenceNo: runningNo,
        name: formData?.donorname ?? "ANONYMOUS",
        email: formData?.donoremail ?? "noreply@gmail.com",
        phone: formData?.donorphoneno ?? "0123456789",
        returnTo: "donation",
      });
      if (bill?.paymentUrl) {
        openPaymentUrl(bill.paymentUrl, {
          orderNo: runningNo,
          onStatus: (statusText) => {
            if (statusText) handlePaymentResult(statusText, runningNo);
            else setLoadingPayment(false);
          },
        });
        setLoadingPayment(false);
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
      { field: "recipientType", label: "Recipient Type", type: "select" },
      { field: "selectedRecipient", label: "Recipient", type: "text" },
      { field: "email", label: "Email", type: "email", required: false },
      { field: "paymentMethod", label: "Payment Method", type: "text" },
    ]);
    if (!isValid) return;
    if (!baseAmount) {
      showError(translate("Please complete donation information"));
      return;
    }
    const phone = (formData.donorphoneno || "").trim();
    const savedPhone = localStorage.getItem("userphoneno");

    if (phone && phone !== savedPhone) {
      setPendingPayload(formData);
      setPendingPhone(phone);
      setShowSavePhoneDialog(true);
      return;
    }

    await proceedToPayment(formData);
  };

  const proceedToPayment = async (payload) => {
    const resPayment = await handlePaymentConfig(payload);
    if (!resPayment) {
      showError("Payment Failed");
      setLoadingPayment(false);
    }
  };

  if (loadingPayment) return <PageLoadingComponent />;
  if (status_id || paymentSucceeded) return <PaymentSuccessfulComponent />;

  const isPreselected = !!urlParamId && !!urlParamType;
  const isListLoading = isOrgLoading || isTahfizLoading;
  const recipientList =
    recipientType === "organisation" ? organisations : tahfizCenters;

  const selectedRecipientObj = recipientList.find(
    (r) => String(r.id) === String(selectedRecipient),
  );

  const clearDonorInfo = () => {
    setValue("donorname", "");
    setValue("donoremail", "");
    setValue("donorphoneno", "");
    setValue("notes", "");
  };

  return (
    <div className="min-h-screen pb-10">
      <BackNavigation title={translate("Donation")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Section
            title={translate("Donation Recipient")}
            icon={Heart}
            accent="rose"
          >
            {isPreselected ? (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-100 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  {urlParamType === "organisation" ? (
                    <Building2 className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Building2 className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 leading-none mb-0.5">
                    {urlParamType === "organisation"
                      ? translate("Organisation")
                      : translate("Tahfiz Center")}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedRecipientObj?.name ?? translate("Loading...")}
                  </p>
                </div>
              </div>
            ) : selectedRecipientObj ? (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-100 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 leading-none mb-0.5">
                    {recipientType === "organisation"
                      ? translate("Organisation")
                      : translate("Tahfiz Center")}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedRecipientObj.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue("selectedRecipient", "");
                    setValue("paymentMethod", "");
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 shrink-0"
                >
                  {translate("Change")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <TypeToggle
                  value={recipientType}
                  onChange={(v) => {
                    setValue("recipientType", v);
                    setValue("selectedRecipient", "");
                    setValue("paymentMethod", "");
                    setSearchQuery("");
                    setFilterName("");
                  }}
                />

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder={translate("Search by name")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8 h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterName("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Select
                    value={selectedState}
                    onValueChange={(v) => {
                      setSelectedState(v);
                      setValue("selectedRecipient", "");
                      setValue("paymentMethod", "");
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm flex-1">
                      <SelectValue placeholder={translate("State")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearby">
                        {translate("Nearby")}
                      </SelectItem>
                      {STATES_MY.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border border-slate-100 dark:border-slate-700 p-1.5">
                  {isListLoading ? (
                    <p className="text-center text-xs text-slate-400 py-6">
                      {translate("Searching...")}
                    </p>
                  ) : recipientList.length > 0 ? (
                    recipientList.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setValue("selectedRecipient", String(r.id));
                          setValue("paymentMethod", "");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-rose-50 dark:hover:bg-rose-900/20 active:bg-rose-100 dark:active:bg-rose-900/30 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {r.name}
                          </p>
                          {r.address && (
                            <p className="text-xs text-slate-400 truncate">
                              {r.address}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-6">
                      {recipientType === "organisation"
                        ? translate("No organisation found")
                        : translate("No tahfiz centers found")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Section>

          <Section title={translate("Total Donations")} accent="amber">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {DONATION_AMOUNTS.map((amt) => {
                  const isActive = amount === String(amt);
                  return (
                    <Button
                      key={amt}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setValue("amount", "");
                        } else {
                          setValue("amount", String(amt));
                          setValue("customAmount", "");
                        }
                      }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                        isActive
                          ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                          : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-300 hover:bg-amber-50"
                      }`}
                    >
                      RM {amt}
                    </Button>
                  );
                })}
              </div>

              <Input
                type="number"
                placeholder={`${translate("Other amount")} (RM)`}
                value={customAmount}
                onChange={(e) => {
                  setValue("customAmount", e.target.value);
                  setValue("amount", "");
                }}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 text-sm"
              />

              {baseAmount > 0 && (
                <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-700 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {translate("Donation Amount")}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      RM {baseAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 border-t border-slate-100 dark:border-slate-700 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {translate("Platform Fee")}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      RM {Number(PLATFORM_DONATION_FEE).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      {translate("Total Amount")}
                    </span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      RM {payableAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {paymentPlatforms.length > 0 && (
            <Section
              title={translate("Payment Method")}
              icon={CreditCard}
              accent="emerald"
            >
              <div className="space-y-2">
                {paymentPlatforms.map((p) => {
                  const isSelected = paymentMethod === p.code;
                  return (
                    <label
                      key={p.code}
                      onClick={() => setValue("paymentMethod", p.code)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {p.name}
                      </span>
                    </label>
                  );
                })}

                {selectedPlatform && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 space-y-2">
                    {selectedPlatform.fields.map((f) =>
                      f.fieldtype === "image" ? (
                        <img
                          key={f.key}
                          src={f.value}
                          alt={f.label}
                          className="max-w-[180px] rounded-lg border"
                        />
                      ) : (
                        <p
                          key={f.key}
                          className="text-xs text-slate-600 dark:text-slate-400"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {f.label}:
                          </span>{" "}
                          {f.value}
                        </p>
                      ),
                    )}
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section
            title={translate("Donor Information (Optional)")}
            icon={User}
            accent="blue"
            headerAction={
              <button
                type="button"
                onClick={clearDonorInfo}
                disabled={!hasDonorInfo}
                title={translate("Clear")}
                aria-label={translate("Clear donor information")}
                className="inline-flex items-center justify-center text-slate-400 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-3">
              <Input
                placeholder={translate("Name")}
                value={donorname}
                onChange={(e) => setValue("donorname", e.target.value)}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm"
              />
              <Input
                placeholder={translate("Email")}
                value={donoremail}
                onChange={(e) => setValue("donoremail", e.target.value)}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm"
              />
              <Input
                placeholder={translate("Phone No")}
                value={donorphoneno}
                onChange={(e) => setValue("donorphoneno", e.target.value)}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm"
              />
              <Textarea
                placeholder={translate("Notes")}
                value={notes}
                onChange={(e) => setValue("notes", e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                <span className="text-base leading-none mt-0.5">📩</span>
                <span>
                  {translate(
                    "Payment receipt will be sent to the provided email if available.",
                  )}
                </span>
              </div>
            </div>
          </Section>

          <button
            type="submit"
            disabled={paymentPlatforms.length === 0 || createDonation.isPending}
            className={`w-full h-12 rounded-2xl font-semibold text-sm shadow-lg transition-all
            ${
              paymentPlatforms.length > 0
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white active:opacity-80"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed"
            }
          `}
          >
            {createDonation.isPending
              ? translate("Submitting...")
              : translate("Submit Donation")}
          </button>
        </form>
      </div>

      <ConfirmDialog
        isMobile
        open={showSavePhoneDialog}
        onOpenChange={(open) => {
          setShowSavePhoneDialog(open);
          if (!open && pendingPayload) {
            const payload = pendingPayload;
            setPendingPayload(null);
            setPendingPhone("");
            proceedToPayment(payload);
          }
        }}
        title={translate("Save Phone Number")}
        description={translate("Save {phone} for future use?").replace(
          "{phone}",
          pendingPhone,
        )}
        confirmText={translate("Save")}
        cancelText={translate("No")}
        onConfirm={() => {
          localStorage.setItem("userphoneno", pendingPhone);
        }}
      />
    </div>
  );
}
