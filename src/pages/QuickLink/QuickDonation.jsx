// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Building2, CreditCard, User, XCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showError } from "@/components/ToastrNotification";
import { DONATION_AMOUNTS, PLATFORM_DONATION_FEE } from "@/utils/enums";
import { useGetMosqueById } from "@/hooks/useMosqueMutations";
import { useGetConfigByEntity } from "@/hooks/usePaymentConfigMutations";
import { useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { validateFields } from "@/utils/validations";
import { defaultDonationField } from "@/utils/defaultformfields";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSearchParams } from "react-router-dom";
import { translate } from "@/utils/translations";
import { userGoogleAccess } from "@/utils/auth";
import { createPageUrl } from "@/utils";

const SAVED_PHONE_KEY = "userphoneno";

function Section({ title, icon: Icon, accent = "emerald", headerAction, children }) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-500",
    blue: "text-blue-500",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${colors[accent]}`} />}
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${colors[accent]}`}>
            {title}
          </p>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function QuickDonation() {
  const { googleUser } = userGoogleAccess();
  const [searchParams] = useSearchParams();
  const mosqueId = searchParams.get("mosqueId") ? Number(searchParams.get("mosqueId")) : null;

  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showSavePhoneDialog, setShowSavePhoneDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingPhone, setPendingPhone] = useState("");

  const { data: mosque, isLoading: isMosqueLoading } = useGetMosqueById(mosqueId);
  const organisationId = mosque?.organisation?.id ?? null;

  const { watch, setValue, handleSubmit } = useForm({
    defaultValues: { ...defaultDonationField, donorname: "HAMBA ALLAH" },
  });

  const amount = watch("amount");
  const customAmount = watch("customAmount");
  const paymentMethod = watch("paymentMethod");
  const donorname = watch("donorname");
  const donorphoneno = watch("donorphoneno");
  const donoremail = watch("donoremail");
  const notes = watch("notes");
  const hasDonorInfo = Boolean(donorname || donoremail || donorphoneno || notes);

  const createBillMutation = trpc.toyyibPay.createBill.useMutation();
  const createDonationRunningNoMutation = trpc.runningNo.createDonationRunningNo.useMutation();

  useEffect(() => {
    if (googleUser) {
      setValue("donorname", googleUser?.name ?? "");
      setValue("donoremail", googleUser?.email ?? "");
    }
  }, [googleUser]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PHONE_KEY);
    if (saved && !watch("donorphoneno")) setValue("donorphoneno", saved);
  }, []);

  const baseAmount = useMemo(() => Number(customAmount || amount) || 0, [amount, customAmount]);
  const payableAmount = useMemo(
    () => (baseAmount > 0 ? baseAmount + Number(PLATFORM_DONATION_FEE || 0) : 0),
    [baseAmount],
  );

  const { data: paymentConfigs = [] } = useGetConfigByEntity({
    entityId: organisationId ? Number(organisationId) : undefined,
    entityType: "organisation",
    enabled: !!organisationId,
  });

  const paymentPlatforms = useMemo(() => {
    const map = {};
    paymentConfigs.forEach((config) => {
      if (!config.paymentplatform) return;
      const code = config.paymentplatform.code;
      if (!map[code]) map[code] = { code, name: config.paymentplatform.name, fields: [] };
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

  const selectedPlatform = paymentPlatforms.find((p) => p.code === paymentMethod);
  const selectedAccount = useMemo(() => {
    if (!selectedPlatform?.fields?.length) return { bankname: "", accountno: "" };
    const fields = selectedPlatform.fields;
    return {
      bankname: fields.find((f) => f.key === "bank_name")?.value?.trim() || "",
      accountno: fields.find((f) => f.key === "account_no")?.value?.trim() || "",
    };
  }, [selectedPlatform]);

  useEffect(() => {
    if (!paymentPlatforms.length) return;
    if (!paymentPlatforms.some((p) => p.code === paymentMethod))
      setValue("paymentMethod", paymentPlatforms[0].code);
  }, [paymentPlatforms, paymentMethod, setValue]);

  const handlePaymentConfig = async (formData) => {
    if (!formData || !organisationId) return false;
    setLoadingPayment(true);
    sessionStorage.setItem(
      "donationPending",
      JSON.stringify({
        formData: {
          ...formData,
          recipientType: "organisation",
          selectedRecipient: String(organisationId),
        },
        baseAmount,
        payableAmount,
        selectedAccount,
      }),
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
    if (!organisationId) {
      showError(translate("Mosque not found or has no organisation linked"));
      return;
    }
    const isValid = validateFields(formData, [
      { field: "email", label: "Email", type: "email", required: false },
      { field: "paymentMethod", label: "Payment Method", type: "text" },
    ]);
    if (!isValid) return;
    if (!baseAmount) {
      showError(translate("Please complete donation information"));
      return;
    }
    const phone = (formData.donorphoneno || "").trim();
    const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
    if (phone && phone !== savedPhone) {
      setPendingPayload(formData);
      setPendingPhone(phone);
      setShowSavePhoneDialog(true);
      return;
    }
    await proceedToPayment(formData);
  };

  const clearDonorInfo = () => {
    setValue("donorname", "");
    setValue("donoremail", "");
    setValue("donorphoneno", "");
    setValue("notes", "");
  };

  if (isMosqueLoading || loadingPayment) return <PageLoadingComponent />;

  if (!mosqueId || !mosque) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-slate-500">{translate("Mosque not found")}</p>
          <Link to={createPageUrl("UserDashboard")} className="text-emerald-600 underline text-sm">
            {translate("Go to Home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-10">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wide">
            {translate("Donation for")}
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {mosque.name}
          </p>
        </div>
        <Link to={createPageUrl("UserDashboard")}>
          <Home className="w-5 h-5 text-slate-400" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-3 pt-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Section title={translate("Total Donations")} accent="amber">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
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
            <Section title={translate("Payment Method")} icon={CreditCard} accent="emerald">
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
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
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
                        <p key={f.key} className="text-xs text-slate-600 dark:text-slate-400">
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
                className="text-slate-400 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
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
            disabled={paymentPlatforms.length === 0}
            className={`w-full h-12 rounded-2xl font-semibold text-sm shadow-lg transition-all ${
              paymentPlatforms.length > 0
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white active:opacity-80"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed"
            }`}
          >
            {translate("Submit Donation")}
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
        description={translate("Save {phone} for future use?").replace("{phone}", pendingPhone)}
        confirmText={translate("Save")}
        cancelText={translate("No")}
        onConfirm={() => {
          localStorage.setItem(SAVED_PHONE_KEY, pendingPhone);
        }}
      />
    </div>
  );
}
