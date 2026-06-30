// @ts-nocheck
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { CheckCircle2, Users, Loader2, ChevronsUpDown, Check } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";
import { showApiError } from "@/components/ToastrNotification";

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-slate-500 dark:text-slate-400">{label}</Label>
    {children}
    {error && <p className="text-xs text-red-500">{error.message}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 pb-1 border-b border-slate-100 dark:border-slate-700">
    {children}
  </p>
);

export default function UserQariahRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const { data: mosques = [], isLoading: mosqueLoading } =
    trpc.deathCharityMember.getMosquesByState.useQuery({ state: selectedState || null });

  const {
    register,
    handleSubmit,
    control,
    reset,
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

  const onSubmit = async (data) => {
    await registerMutation.mutateAsync({
      fullname: data.fullname,
      icnumber: data.icnumber,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      mosque: data.mosqueId ? { id: Number(data.mosqueId) } : null,
    });
  };

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
            {translate("Your Qariah registration has been submitted and is pending approval.")}
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
          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
            <SectionTitle>{translate("Personal Information")}</SectionTitle>

            <Field label={`${translate("Full Name")} *`} error={errors.fullname}>
              <Input
                {...register("fullname", { required: translate("Full name is required") })}
                placeholder={translate("As per IC")}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </Field>

            <Field label={`${translate("IC Number")} *`} error={errors.icnumber}>
              <Input
                {...register("icnumber", { required: translate("IC number is required") })}
                placeholder="000000-00-0000"
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </Field>

            <Field label={translate("Phone Number")} error={errors.phone}>
              <Input
                {...register("phone")}
                placeholder="0123456789"
                type="tel"
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </Field>

            <Field label={translate("Email")} error={errors.email}>
              <Input
                {...register("email")}
                placeholder="email@example.com"
                type="email"
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </Field>

            <Field label={translate("Address")} error={errors.address}>
              <Textarea
                {...register("address")}
                placeholder={translate("Street, Area, City")}
                rows={3}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 resize-none"
              />
            </Field>
          </div>

          {/* Mosque */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
            <SectionTitle>{translate("Mosque / Qariah")}</SectionTitle>

            <Field label={translate("State")} error={errors.state}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedState(val);
                    }}
                  >
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                      <SelectValue placeholder={translate("Select state")} />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES_MY.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={translate("Mosque")} error={errors.mosqueId}>
              <Controller
                name="mosqueId"
                control={control}
                render={({ field }) => {
                  const selected = mosques.find((m) => String(m.id) === field.value);
                  const [open, setOpen] = useState(false);
                  const isDisabled = !selectedState || mosqueLoading;
                  const triggerLabel = !selectedState
                    ? translate("Select state first")
                    : mosqueLoading
                      ? translate("Loading...")
                      : selected
                        ? selected.name
                        : translate("Search mosque...");

                  return (
                    <Popover open={open && !isDisabled} onOpenChange={(o) => !isDisabled && setOpen(o)}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={isDisabled}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                        >
                          <span className={!selected ? "text-muted-foreground" : ""}>
                            {triggerLabel}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={translate("Search mosque...")} />
                          <CommandList>
                            <CommandEmpty>{translate("No mosque found")}</CommandEmpty>
                            <CommandGroup>
                              {mosques.map((m) => (
                                <CommandItem
                                  key={m.id}
                                  value={m.name}
                                  onSelect={() => {
                                    field.onChange(String(m.id));
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${String(m.id) === field.value ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {m.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
              {!selectedState && (
                <p className="text-xs text-amber-500 dark:text-amber-400">
                  {translate("Please select a state to see available mosques")}
                </p>
              )}
            </Field>
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
