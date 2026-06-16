// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Home,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { DONATION_AMOUNTS, PLATFORM_FEE, TahlilStatus } from "@/utils/enums";
import { useGetTahfizById } from "@/hooks/useTahfizMutations";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { validateFields } from "@/utils/validations";
import { defaultTahlilRequestField } from "@/utils/defaultformfields";
import { trimEmptyArray } from "@/utils/helpers";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSearchParams } from "react-router-dom";
import TextInputForm from "@/components/Forms/TextInputForm.jsx";
import PaymentSuccessfulComponent from "@/components/PaymentSuccessfulComponent";
import { translate } from "@/utils/translations";
import { userGoogleAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";

const CUSTOM_SERVICE_KEY = "custom";
const SAVED_PHONE_KEY = "userphoneno";

function Section({ title, icon: Icon, accent = "emerald", children }) {
  const colors = {
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-500",
    blue: "text-blue-500",
    rose: "text-rose-500",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        {Icon && <Icon className={`w-4 h-4 ${colors[accent]}`} />}
        <p
          className={`text-[11px] font-semibold uppercase tracking-widest ${colors[accent]}`}
        >
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function QuickTahlil() {
  const { googleUser } = userGoogleAccess();
  const [searchParams] = useSearchParams();
  const tahfizId = searchParams.get("tahfizId")
    ? Number(searchParams.get("tahfizId"))
    : null;

  const [loadingPayment, setLoadingPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDeceasedNames, setSubmittedDeceasedNames] = useState([]);
  const [showSavePhoneDialog, setShowSavePhoneDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingPhone, setPendingPhone] = useState("");

  const { data: tahfiz, isLoading: isTahfizLoading } =
    useGetTahfizById(tahfizId);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createTahlilRunningNoMutation =
    trpc.runningNo.createTahlilRunningNo.useMutation();

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...defaultTahlilRequestField,
      tahfizId: tahfizId ? String(tahfizId) : "",
    },
  });

  const selectedservices = watch("selectedservices");
  const customservice = watch("customservice");
  const amount = watch("amount");
  const customAmount = watch("customAmount");
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (googleUser) {
      setValue("requestorname", googleUser?.name ?? "");
      setValue("requestoremail", googleUser?.email ?? "");
    }
  }, [googleUser]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PHONE_KEY);
    if (saved && !watch("requestorphoneno"))
      setValue("requestorphoneno", saved);
  }, []);

  const selectedTahfizServices = useMemo(
    () => (Array.isArray(tahfiz?.services) ? tahfiz.services : []),
    [tahfiz],
  );

  const selectedTahfizServicePrice = useMemo(
    () =>
      selectedTahfizServices.reduce((acc, service) => {
        acc[service.service] = Number(service.price || 0);
        return acc;
      }, {}),
    [selectedTahfizServices],
  );

  const availableTahfizServices = useMemo(
    () => selectedTahfizServices.map((s) => s.service?.trim()).filter(Boolean),
    [selectedTahfizServices],
  );

  const hasTahfizService = (v) => selectedTahfizServicePrice[v] !== undefined;
  const hasTahfizServicePrice = (v) =>
    Number(selectedTahfizServicePrice[v] || 0) > 0;

  const selectableTahfizServices = useMemo(
    () =>
      availableTahfizServices.includes(CUSTOM_SERVICE_KEY)
        ? availableTahfizServices
        : [...availableTahfizServices, CUSTOM_SERVICE_KEY],
    [availableTahfizServices],
  );

  const validServiceTypes = useMemo(
    () => (selectedservices || []).filter((t) => t && hasTahfizServicePrice(t)),
    [selectedservices, selectedTahfizServicePrice],
  );

  const hasService = (selectedservices || []).some(
    (t) => t && hasTahfizServicePrice(t),
  );

  const serviceAmount = useMemo(
    () =>
      validServiceTypes.reduce(
        (sum, t) => sum + Number(selectedTahfizServicePrice[t] || 0),
        0,
      ),
    [validServiceTypes, selectedTahfizServicePrice],
  );

  const donationAmount = useMemo(
    () => Number(customAmount || amount) || 0,
    [amount, customAmount],
  );
  const hasDonation = donationAmount > 0;
  const finalAmountWithoutFee = useMemo(
    () => donationAmount + serviceAmount,
    [donationAmount, serviceAmount],
  );
  const hasAnyServiceSelected = (selectedservices || []).length > 0;
  const platformFee = hasAnyServiceSelected || hasDonation ? PLATFORM_FEE : 0;
  const finalAmountWithFee = finalAmountWithoutFee + platformFee;

  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: tahfizId ? Number(tahfizId) : undefined,
    entityType: "tahfiz",
    enabled: !!tahfizId,
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};
    paymentConfigs.forEach((c) => {
      if (!c.paymentplatform) return;
      const code = c.paymentplatform.code;
      if (!map[code])
        map[code] = { code, name: c.paymentplatform.name, fields: [] };
      if (c.paymentfield)
        map[code].fields.push({
          key: c.paymentfield.key,
          label: c.paymentfield.label,
          fieldtype: c.paymentfield.fieldtype,
          value: c.value,
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
    const exists = paymentPlatforms.some((p) => p.code === paymentMethod);
    if (!exists) setValue("paymentMethod", paymentPlatforms[0].code);
  }, [paymentPlatforms, paymentMethod, setValue]);

  const toggleServiceType = (value) => {
    const current = watch("selectedservices") || [];
    const isSelected = current.includes(value);
    setValue(
      "selectedservices",
      isSelected ? current.filter((v) => v !== value) : [...current, value],
    );
    if (value === CUSTOM_SERVICE_KEY && isSelected)
      setValue("customservice", "");
  };

  const handleAddDeceased = () =>
    setValue("deceasednames", [...watch("deceasednames"), ""]);
  const handleRemoveDeceased = (i) => {
    const names = watch("deceasednames");
    if (names.length > 1)
      setValue(
        "deceasednames",
        names.filter((_, idx) => idx !== i),
      );
  };
  const handleDeceasedChange = (i, value) => {
    const names = [...watch("deceasednames")];
    names[i] = value;
    setValue("deceasednames", names);
  };

  const handlePaymentConfig = async (formData) => {
    if (!formData) return false;
    setLoadingPayment(true);
    sessionStorage.setItem(
      "tahlilRequestPending",
      JSON.stringify({ formData, selectedAccount }),
    );
    const nextRunningNo = await createTahlilRunningNoMutation.mutateAsync();
    const year = new Date().getFullYear();
    const runningNo = `THL-${year}-${String(nextRunningNo).padStart(4, "0")}`;
    try {
      const bill = await createBillMutation.mutateAsync({
        amount: finalAmountWithFee,
        referenceNo: runningNo,
        name: formData?.requestorname ?? "ANONYMOUS",
        email: formData?.requestoremail ?? "noreply@gmail.com",
        phone: formData?.requestorphoneno ?? "0123456789",
        returnTo: "tahfiz",
      });
      if (bill?.paymentUrl) {
        window.location.href = bill.paymentUrl;
        return true;
      }
      setLoadingPayment(false);
      showError("No payment URL returned.");
    } catch (err) {
      setLoadingPayment(false);
      showError(err.message || "Unknown error");
    }
    return false;
  };

  const proceedToPayment = async (payload) => {
    const res = await handlePaymentConfig(payload);
    if (!res) {
      showError("Payment Failed");
      setLoadingPayment(false);
    }
  };

  const onSubmit = async (formData) => {
    formData.selectedservices = trimEmptyArray(formData.selectedservices);
    formData.deceasednames = trimEmptyArray(formData.deceasednames);
    const isValid = validateFields(formData, [
      {
        field: "requestorphoneno",
        label: "Requestor Phone No.",
        type: "phone",
      },
      { field: "requestoremail", label: "Requestor Email", type: "email" },
      { field: "selectedservices", label: "Service Type", type: "array" },
      { field: "deceasednames", label: "Deceased Names", type: "array" },
      { field: "paymentMethod", label: "Payment Method", type: "text" },
    ]);
    if (!isValid) return;
    if (
      formData.selectedservices?.includes(CUSTOM_SERVICE_KEY) &&
      !formData.customservice?.trim()
    ) {
      showError(translate("Please specify the special service."));
      return;
    }
    if (!formData.selectedservices?.includes(CUSTOM_SERVICE_KEY))
      formData.customservice = "";
    const tahlilRequest = {
      tahfizcenter: { id: Number(tahfizId) },
      selectedservices: formData.selectedservices,
      deceasednames: formData.deceasednames,
      requestorname: formData.requestorname,
      requestorphoneno: formData.requestorphoneno,
      requestoremail: formData.requestoremail,
      customservice: formData.customservice || "",
      status: TahlilStatus.PENDING,
      platformfeeamount: platformFee,
      serviceamount: finalAmountWithoutFee,
    };

    const phone = formData.requestorphoneno?.trim();
    const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
    if (phone && phone !== savedPhone) {
      setPendingPayload(tahlilRequest);
      setPendingPhone(phone);
      setShowSavePhoneDialog(true);
      return;
    }
    await proceedToPayment(tahlilRequest);
  };

  if (submitted) {
    return (
      <PaymentSuccessfulComponent
        shouldRedirect={false}
        extraContent={
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {translate("Tahlil application for the deceased")}{" "}
            <span className="font-bold text-emerald-600">
              {submittedDeceasedNames.filter((n) => n).join(", ")}
            </span>{" "}
            {translate("has been sent to the tahfiz center.")}
          </p>
        }
        actionButton={
          <Button
            onClick={() => setSubmitted(false)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {translate("Submit Another Application")}
          </Button>
        }
      />
    );
  }

  if (isTahfizLoading || loadingPayment) return <PageLoadingComponent />;

  if (!tahfizId || !tahfiz) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-slate-500 dark:text-slate-400">
            {translate("Tahfiz center not found")}
          </p>
          <Link
            to={createPageUrl("UserDashboard")}
            className="text-emerald-600 underline text-sm"
          >
            {translate("Go to Home")}
          </Link>
        </div>
      </div>
    );
  }

  const deceasedNames = watch("deceasednames");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-10">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wide">
            {translate("Tahlil at")}
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {tahfiz.name}
          </p>
          {tahfiz.state && (
            <p className="text-[11px] text-slate-400 truncate">
              {tahfiz.state}
            </p>
          )}
        </div>
        <Link to={createPageUrl("UserDashboard")}>
          <Home className="w-5 h-5 text-slate-400" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-3 pt-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {tahfiz && (
            <Section
              title={translate("Service Type")}
              icon={CheckCircle2}
              accent="violet"
            >
              <div className="space-y-2">
                {selectableTahfizServices.map((serviceValue) => {
                  const isSelected = (selectedservices || []).includes(
                    serviceValue,
                  );
                  const serviceLabel =
                    serviceValue === CUSTOM_SERVICE_KEY
                      ? translate("Special Service (Note)")
                      : serviceValue;
                  const price = selectedTahfizServicePrice[serviceValue];

                  return (
                    <label
                      key={serviceValue}
                      onClick={() => toggleServiceType(serviceValue)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-900/20 shadow-sm"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-violet-500 bg-violet-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm font-medium ${isSelected ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {serviceLabel}
                      </span>
                      {hasTahfizService(serviceValue) &&
                        price !== undefined && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              price > 0
                                ? isSelected
                                  ? "bg-violet-200 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {price > 0 ? `RM ${price}` : ""}
                          </span>
                        )}
                    </label>
                  );
                })}
              </div>
              {(selectedservices || []).includes(CUSTOM_SERVICE_KEY) && (
                <Textarea
                  placeholder={translate("Specify special service...")}
                  value={customservice}
                  onChange={(e) => setValue("customservice", e.target.value)}
                  className="mt-3 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm resize-none"
                  rows={3}
                />
              )}
            </Section>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500">
                {translate("Deceased Information")}
              </p>
              <button
                type="button"
                onClick={handleAddDeceased}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 active:opacity-70 transition-opacity"
              >
                <Plus className="w-3 h-3" /> {translate("Add")}
              </button>
            </div>
            <div className="p-4 space-y-2">
              {deceasedNames && deceasedNames.length === 0 ? (
                <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
                  {translate("No deceased names")}
                </div>
              ) : (
                deceasedNames.map((name, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-rose-400">
                        {i + 1}
                      </span>
                    </div>
                    <Input
                      placeholder={`${translate("Deceased Name")}${deceasedNames.length > 1 ? ` ${i + 1}` : ""}`}
                      value={name}
                      onChange={(e) => handleDeceasedChange(i, e.target.value)}
                      className="flex-1 h-10 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-sm"
                    />
                    {deceasedNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDeceased(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <Section
            title={translate("Requester Information")}
            icon={Info}
            accent="blue"
          >
            <div className="space-y-3">
              <TextInputForm
                name="requestorname"
                control={control}
                label={translate("Requester Name")}
                required
                errors={errors}
              />
              <TextInputForm
                name="requestoremail"
                control={control}
                label={translate("Email")}
                required
                errors={errors}
              />
              <TextInputForm
                name="requestorphoneno"
                control={control}
                label={translate("Phone No")}
                required
                errors={errors}
              />
              <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                <span className="text-base leading-none mt-0.5">📩</span>
                <span>
                  {translate(
                    "Payment receipt will be sent to the provided email. Save reference number to watch the Tahlil live stream.",
                  )}
                </span>
              </div>
            </div>
          </Section>

          <Section title={translate("Donation Amount")} accent="amber">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {DONATION_AMOUNTS.map((amt) => {
                const isActive = amount === String(amt);
                return (
                  <button
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
                  </button>
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
              className="h-11 rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 text-sm"
            />
          </Section>

          {paymentPlatforms.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                  {translate("Payment Method")}
                </p>
              </div>
              <div className="p-4 space-y-2">
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
                  <div className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
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

              <div className="mx-4 mb-4 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {hasService && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      {translate("Selected Services")}
                    </p>
                    <div className="space-y-1">
                      {validServiceTypes.map(
                        (type) =>
                          hasTahfizServicePrice(type) && (
                            <div
                              key={type}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-slate-600 dark:text-slate-400">
                                {type}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                RM {selectedTahfizServicePrice[type]}
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}
                {hasDonation && (
                  <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-slate-100 dark:border-slate-700 text-sm">
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      {translate("Donation")}
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      RM {donationAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {translate("Platform Fee")}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      RM {platformFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {translate("Total Amount")}
                  </span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    RM {finalAmountWithFee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-200 active:opacity-80 transition-all"
          >
            {translate("Submit Application")}
          </Button>
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
          localStorage.setItem(SAVED_PHONE_KEY, pendingPhone);
        }}
      />
    </div>
  );
}
