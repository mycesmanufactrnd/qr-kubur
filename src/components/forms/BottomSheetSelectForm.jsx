import { Controller } from "react-hook-form";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, X } from "lucide-react";
import { translate } from "@/utils/translations";

export default function BottomSheetSelectForm({
  name,
  control,
  label,
  placeholder,
  options,
  required = false,
  errors = {},
  disabled = false,
  onValueChange,
}) {
  const errorMessage = errors?.[name]?.message;

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  return (
    <div className="space-y-1.5">
      <p
        className={`text-[11px] font-semibold uppercase tracking-widest ${
          disabled
            ? "text-slate-300 dark:text-slate-600"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>

      <Controller
        name={name}
        control={control}
        disabled={disabled}
        rules={
          required
            ? {
                required: translate("{label} is required").replace(
                  "{label}",
                  label,
                ),
              }
            : undefined
        }
        render={({ field }) => {
          const selected = normalized.find(
            (o) => String(o.value) === String(field.value),
          );

          return (
            <DialogPrimitive.Root>
              <DialogPrimitive.Trigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
                >
                  <span
                    className={
                      !selected ? "text-slate-400 dark:text-slate-500" : ""
                    }
                  >
                    {selected ? selected.label : placeholder}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                </button>
              </DialogPrimitive.Trigger>

              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-[1001] backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed bottom-0 left-0 w-full z-[1002] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300">
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between px-5 py-3 shrink-0">
                    <DialogPrimitive.Title className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {label}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <X className="w-4 h-4" />
                    </DialogPrimitive.Close>
                  </div>

                  <div className="w-full h-px bg-slate-100 dark:bg-slate-700 shrink-0" />

                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {normalized.map((o) => {
                      const isSelected =
                        String(o.value) === String(field.value);
                      return (
                        <DialogPrimitive.Close asChild key={o.value}>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(o.value);
                              onValueChange?.(o.value);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {o.label}
                            {isSelected && (
                              <Check className="w-4 h-4 shrink-0" />
                            )}
                          </button>
                        </DialogPrimitive.Close>
                      );
                    })}
                  </div>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
          );
        }}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
