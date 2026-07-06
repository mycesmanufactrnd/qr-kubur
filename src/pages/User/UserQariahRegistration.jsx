// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Users, Loader2 } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { showApiError } from "@/components/ToastrNotification";
import { useLocationContext } from "@/providers/LocationProvider";
import { initFCM } from "@/firebase/firebase";



const SectionTitle = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 pb-1 border-b border-slate-100 dark:border-slate-700">
    {children}
  </p>
);

export default function UserQariahRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const { userState } = useLocationContext();

  const { data: mosques = [], isLoading: mosqueLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery({
      state: selectedState || null,
    });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullname: "",
      icnumber: "",
      phone: "",
      email: "",
      address: "",
      state: "",
      mosqueId: "",
    },
  });

  const registerMutation = trpc.deathCharityMember.registerQariah.useMutation({
    onSuccess: () => setIsSubmitted(true),
    onError: (err) => showApiError(err),
  });

  const saveQariahDeviceToken = trpc.qariahDevice.saveToken.useMutation();

  const onSubmit = async (data) => {
    const icnumber = data.icnumber.replace(/-/g, "");
    const mosqueId = data.mosqueId ? Number(data.mosqueId) : null;

    // Request notification permission first, while the click's user-activation
    // is still active — some browsers (e.g. Edge) silently drop the prompt into
    // a "quiet"/blocked state if requestPermission() fires after an await.
    const token = await initFCM();

    await registerMutation.mutateAsync({
      fullname: data.fullname,
      icnumber,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      mosque: mosqueId ? { id: mosqueId } : null,
    });

    if (token) {
      localStorage.setItem("fcmQariahToken", token);
      saveQariahDeviceToken.mutate({
        fcmQariahToken: token,
        icnumber,
        mosqueId,
      });
    }
  };

  useEffect(() => {
    if (userState && STATES_MY.includes(userState)) {
      setValue("state", userState);
      setSelectedState(userState);
    }
  }, [userState, setValue]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <BackNavigation title={translate("Qariah Registration")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
            {translate("Registration Submitted")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            {translate(
              "Your Qariah registration has been submitted and is pending approval.",
            )}
          </p>
          <Button
            className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            onClick={() => {
              setIsSubmitted(false);
              reset();
              setSelectedState("");
            }}
          >
            {translate("Register Another")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <BackNavigation title={translate("Qariah Registration")} />

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {translate("Qariah Registration")}
            </p>
            <p className="text-xs text-slate-400">
              {translate("Register as a member of your local mosque Qariah")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
            <SectionTitle>{translate("Personal Information")}</SectionTitle>

            <TextInputForm
              name="fullname"
              control={control}
              label={translate("Full Name")}
              required
              errors={errors}
              placeholder={translate("As per IC")}
            />

            <TextInputForm
              name="icnumber"
              control={control}
              label={translate("IC Number")}
              required
              errors={errors}
              isICNumber
              placeholder="000000-00-0000"
            />

            <TextInputForm
              name="phone"
              control={control}
              label={translate("Phone Number")}
              required
              errors={errors}
              isPhone
              placeholder="0123456789"
            />

            <TextInputForm
              name="email"
              control={control}
              label={translate("Email")}
              errors={errors}
              isEmail
              placeholder="email@example.com"
            />

            <TextInputForm
              name="address"
              control={control}
              label={translate("Address")}
              errors={errors}
              isTextArea
              rows={3}
              placeholder={translate("Street, Area, City")}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
            <SectionTitle>{translate("Mosque / Qariah")}</SectionTitle>

            <SelectForm
              name="state"
              control={control}
              label={translate("State")}
              placeholder={translate("Select state")}
              options={STATES_MY}
              errors={errors}
              onValueChange={setSelectedState}
            />

            <Select2Form
              name="mosqueId"
              control={control}
              label={translate("Mosque")}
              options={mosques.map((m) => ({ value: String(m.id), label: m.name }))}
              errors={errors}
              disabled={!selectedState}
              loading={mosqueLoading}
              disabledMessage={translate("Select state first")}
              placeholder={translate("Search mosque...")}
              searchPlaceholder={translate("Search mosque...")}
              emptyMessage={translate("No mosque found")}
              noSelectionMessage={translate("Please select a state to see available mosques")}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || registerMutation.isPending}
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm"
          >
            {(isSubmitting || registerMutation.isPending) && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            {translate("Submit Registration")}
          </Button>
        </form>
      </div>
    </div>
  );
}
