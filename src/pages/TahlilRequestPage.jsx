import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Building2,
  CreditCard,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import BackNavigation from "@/components/BackNavigation";
import { showError, showSuccess } from "@/components/ToastrNotification";
import { useLocationContext } from "@/providers/LocationProvider";
import {
  useGetTahfizById,
  useGetTahfizCoordinates,
} from "@/hooks/useTahfizMutations";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import {
  DONATION_AMOUNTS,
  paymentToyyibStatus,
  PLATFORM_FEE,
  TahlilStatus,
} from "@/utils/enums";
import { defaultTahlilRequestField } from "@/utils/defaultformfields";
import { validateFields } from "@/utils/validations";
import {
  activityLogError,
  clearQueryParams,
  trimEmptyArray,
} from "@/utils/helpers";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import { trpc } from "@/utils/trpc";
import { useSearchParams } from "react-router-dom";
import TextInputForm from "@/components/forms/TextInputForm";
import PaymentSuccessfulComponent from "@/components/PaymentSuccessfulComponent";
import { userGoogleAccess } from "@/utils/auth";
import ConfirmDialog from "@/components/ConfirmDialog";

const CUSTOM_SERVICE_KEY = "custom";
const CUSTOM_SERVICE_LABEL = "Perkhidmatan Khas (Nota)";
const SAVED_PHONE_KEY = "userphoneno";

function Section({ title, icon: Icon, children, accent = "emerald" }) {
  const colors = {
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-500",
    blue: "text-blue-500",
    rose: "text-rose-500",
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
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

export default function TahlilRequestPage() {
  const { googleUser } = userGoogleAccess();
  const [searchParams] = useSearchParams();
  const { userLocation, userState } = useLocationContext();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDeceasedNames, setSubmittedDeceasedNames] = useState([]);
  const [showSavePhoneDialog, setShowSavePhoneDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingPhone, setPendingPhone] = useState("");

  const status_id = searchParams.get("status_id");
  const order_id = searchParams.get("order_id");

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const saveTransactionAccountMutation =
    trpc.toyyibPay.saveTransactionAccount.useMutation();
  const createLogMutation = trpc.activityLogs.create.useMutation();
  const createTahlilRunningNoMutation =
    trpc.runningNo.createTahlilRunningNo.useMutation();
  const createTahlilRequest = trpc.tahlilRequest.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      showSuccess("Terima kasih! Permohonan anda telah direkodkan.");
      reset({ ...defaultTahlilRequestField, tahfizId: preSelectedTahfiz });
    },
  });

  const preSelectedTahfiz = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tahfiz") || "";
  }, []);

  const hasPreselectedTahfiz = !!preSelectedTahfiz;

  const { data: tahfizById } = useGetTahfizById(
    hasPreselectedTahfiz ? Number(preSelectedTahfiz) : null,
  );

  const { data: nearbyTahfiz = [], isLoading: isTahfizLoading } =
    useGetTahfizCoordinates({
      coordinates:
        !hasPreselectedTahfiz && userLocation
          ? { latitude: userLocation.lat, longitude: userLocation.lng }
          : null,
      isTahlilServiceOnly: false,
      filterState: userState,
    });

  const tahfizCenters = useMemo(() => {
    if (hasPreselectedTahfiz && tahfizById) return [tahfizById];
    return nearbyTahfiz;
  }, [hasPreselectedTahfiz, tahfizById, nearbyTahfiz]);

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
      tahfizId: preSelectedTahfiz,
    },
  });

  const tahfizId = watch("tahfizId");
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
    if (saved && !watch("requestorphoneno")) {
      setValue("requestorphoneno", saved);
    }
  }, []);

  const selectedTahfiz = useMemo(
    () => tahfizCenters.find((c) => c.id === Number(tahfizId)) || null,
    [tahfizCenters, tahfizId],
  );

  const selectedTahfizServices = useMemo(
    () =>
      Array.isArray(selectedTahfiz?.services) ? selectedTahfiz.services : [],
    [selectedTahfiz],
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

  useEffect(() => {
    const statusText = status_id
      ? paymentToyyibStatus[status_id] || "Unknown"
      : "Unknown";
    if (!status_id) return;

    const pendingTahlil = sessionStorage.getItem("tahlilRequestPending");
    if (!pendingTahlil) return;

    const { formData, selectedAccount } = JSON.parse(pendingTahlil);

    if (statusText === "Success") {
      setSubmittedDeceasedNames(formData.deceasednames);
      showSuccess("Pembayaran berjaya!");

      const storedUser =
        localStorage.getItem("googleAuth") ||
        sessionStorage.getItem("googleAuth");
      let googleRecordPayload = null;

      if (storedUser) {
        googleRecordPayload = JSON.parse(storedUser);
      }

      createTahlilRequest
        .mutateAsync({
          ...formData,
          deceasednames: formData.deceasednames || [],
          selectedservices: formData.selectedservices || [],
          tahfizcenter: formData.tahfizcenter || null,
          customservice: formData.customservice || null,
          referenceno: order_id || formData.referenceno || null,
          serviceamount: Number(formData.serviceamount) || 0,
          platformfeeamount: Number(formData.platformfeeamount) || 0,
          status: TahlilStatus.PENDING,
          googleuserId: googleRecordPayload?.id ?? null,
        })
        .then(async (res) => {
          if (res) {
            const orderNo = String(order_id || "");
            if (
              orderNo &&
              selectedAccount?.accountno &&
              selectedAccount?.bankname
            ) {
              try {
                await saveTransactionAccountMutation.mutateAsync({
                  orderNo,
                  accountNo: String(selectedAccount.accountno),
                  bankName: String(selectedAccount.bankname),
                  type: "Tahlil",
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
            sessionStorage.removeItem("tahlilRequestPending");
            clearQueryParams();
          }
        })
        .catch((error) => {
          createLogMutation.mutateAsync({
            activitytype: "Create Tahlil Request",
            functionname: "createTahlilRequest.mutateAsync",
            useremail: "",
            level: "error",
            summary: activityLogError(error),
            extramessage: pendingTahlil,
          });
          sessionStorage.removeItem("tahlilRequestPending");
          clearQueryParams();
        });
    } else if (statusText === "Pending") {
      showError("Pembayaran masih dalam proses.");
    } else {
      showError("Pembayaran gagal.");
    }
  }, [searchParams]);

  const { data: paymentConfigs } = useGetConfigByEntity({
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
    formData.selectedservices = trimEmptyArray(formData.selectedservices);
    formData.deceasednames = trimEmptyArray(formData.deceasednames);
    const isValid = validateFields(formData, [
      { field: "tahfizId", label: "Tahfiz Center", type: "select" },
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
      showError("Sila jelaskan perkhidmatan khas.");
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

  const proceedToPayment = async (payload) => {
    const resPayment = await handlePaymentConfig(payload);
    if (!resPayment) {
      showError("Payment Failed");
      setLoadingPayment(false);
    }
  };

  if (submitted) {
    return (
      <PaymentSuccessfulComponent
        shouldRedirect={false}
        extraContent={
          <p className="text-gray-600 mb-6">
            Permohonan tahlil untuk arwah{" "}
            <span className="font-bold text-emerald-600">
              {submittedDeceasedNames.filter((n) => n).join(", ")}
            </span>{" "}
            telah dihantar ke pusat tahfiz.
          </p>
        }
        actionButton={
          <Button
            onClick={() => setSubmitted(false)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Buat Permohonan Lagi
          </Button>
        }
      />
    );
  }

  if (loadingPayment || isTahfizLoading) return <PageLoadingComponent />;

  const deceasedNames = watch("deceasednames");

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title="Mohon Servis" />

      <div className="max-w-2xl mx-auto px-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Section title="Pilih Pusat Tahfiz" icon={Building2} accent="emerald">
            <Select
              value={tahfizId}
              onValueChange={(v) => setValue("tahfizId", v)}
            >
              <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 text-sm">
                <SelectValue placeholder="Pilih pusat tahfiz" />
              </SelectTrigger>
              <SelectContent>
                {tahfizCenters.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {selectedTahfiz && (
            <Section
              title="Jenis Perkhidmatan"
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
                      ? CUSTOM_SERVICE_LABEL
                      : serviceValue;
                  const price = selectedTahfizServicePrice[serviceValue];

                  return (
                    <label
                      key={serviceValue}
                      onClick={() => toggleServiceType(serviceValue)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-violet-500 bg-violet-500"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm font-medium ${isSelected ? "text-violet-800" : "text-slate-700"}`}
                      >
                        {serviceLabel}
                      </span>
                      {hasTahfizService(serviceValue) &&
                        price !== undefined && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              price > 0
                                ? isSelected
                                  ? "bg-violet-200 text-violet-700"
                                  : "bg-slate-200 text-slate-600"
                                : "bg-emerald-100 text-emerald-600"
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
                  placeholder="Jelaskan perkhidmatan khas..."
                  value={customservice}
                  onChange={(e) => setValue("customservice", e.target.value)}
                  className="mt-3 rounded-xl border-slate-200 text-sm resize-none"
                  rows={3}
                />
              )}
            </Section>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500">
                Maklumat Arwah
              </p>
              <button
                type="button"
                onClick={handleAddDeceased}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 active:opacity-70 transition-opacity"
              >
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            <div className="p-4 space-y-2">
              {deceasedNames.map((name, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-rose-400">
                      {i + 1}
                    </span>
                  </div>
                  <Input
                    placeholder={`Nama Arwah ${deceasedNames.length > 1 ? i + 1 : ""}`}
                    value={name}
                    onChange={(e) => handleDeceasedChange(i, e.target.value)}
                    className="flex-1 h-10 rounded-xl border-slate-200 text-sm"
                  />
                  {deceasedNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeceased(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Section title="Maklumat Pemohon" icon={Info} accent="blue">
            <div className="space-y-3">
              <TextInputForm
                name="requestorname"
                control={control}
                label="Nama Pemohon"
                required
                errors={errors}
              />
              <TextInputForm
                name="requestoremail"
                control={control}
                label="Emel"
                required
                errors={errors}
              />
              <TextInputForm
                name="requestorphoneno"
                control={control}
                label="No. Telefon"
                required
                errors={errors}
              />
              <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 leading-relaxed">
                <span className="text-base leading-none mt-0.5">📩</span>
                <span>
                  Resit pembayaran akan dihantar ke emel yang diberikan. Simpan
                  nombor rujukan untuk menonton siaran langsung Tahlil.
                </span>
              </div>
            </div>
          </Section>

          <Section title="Jumlah Derma" icon={null} accent="amber">
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
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    RM {amt}
                  </button>
                );
              })}
            </div>
            <Input
              type="number"
              placeholder="Jumlah lain (RM)"
              value={customAmount}
              onChange={(e) => {
                setValue("customAmount", e.target.value);
                setValue("amount", "");
              }}
              className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
            />
          </Section>

          {selectedTahfiz && paymentPlatforms.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                  Kaedah Pembayaran
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
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-emerald-800" : "text-slate-700"}`}
                      >
                        {p.name}
                      </span>
                    </label>
                  );
                })}

                {selectedPlatform && (
                  <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {selectedPlatform.fields.map((f) =>
                      f.fieldtype === "image" ? (
                        <img
                          key={f.key}
                          src={f.value}
                          alt={f.label}
                          className="max-w-[180px] rounded-lg border"
                        />
                      ) : (
                        <p key={f.key} className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {f.label}:
                          </span>{" "}
                          {f.value}
                        </p>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="mx-4 mb-4 rounded-xl border border-slate-100 overflow-hidden">
                {hasService && (
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Servis Dipilih
                    </p>
                    <div className="space-y-1">
                      {validServiceTypes.map(
                        (type) =>
                          hasTahfizServicePrice(type) && (
                            <div
                              key={type}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-slate-600">{type}</span>
                              <span className="font-semibold text-slate-800">
                                RM {selectedTahfizServicePrice[type]}
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

                {hasDonation && (
                  <div className="flex justify-between items-center p-3 bg-amber-50 border-b border-slate-100 text-sm">
                    <span className="text-amber-700 font-medium">Derma</span>
                    <span className="font-semibold text-amber-700">
                      RM {donationAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {platformFee > 0 && (
                  <div className="flex justify-between items-center p-3 border-b border-slate-100 text-sm">
                    <span className="text-slate-500">Yuran Platform</span>
                    <span className="text-slate-600">
                      RM {platformFee.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-emerald-50">
                  <span className="text-sm font-bold text-emerald-800">
                    Jumlah Keseluruhan
                  </span>
                  <span className="text-base font-bold text-emerald-700">
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
            Hantar Permohonan
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
        title="Simpan No. Telefon"
        description={`Simpan ${pendingPhone} untuk kegunaan masa hadapan?`}
        confirmText="Simpan"
        cancelText="Tidak"
        onConfirm={() => {
          localStorage.setItem(SAVED_PHONE_KEY, pendingPhone);
        }}
      />
    </div>
  );
}
