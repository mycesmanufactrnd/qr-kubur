// @ts-nocheck
import { Controller, useFormState } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateFields } from "@/utils/validations";
import { formatICNumber, capitalizeWords, capitalizeFirst } from "@/utils/helpers";
import { translate } from "@/utils/translations";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

// Stores/displays burial time as a plain "hh:mm AM/PM" string (e.g. "02:05 PM")
// instead of a native <input type="time">, which renders 24-hour on most
// devices regardless of locale settings.
function parseAmPmTime(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((value ?? "").trim());
  if (!match) return { hour: "", minute: "", period: "" };
  return {
    hour: match[1].padStart(2, "0"),
    minute: match[2],
    period: match[3].toUpperCase(),
  };
}

function TimeAmPmInput({ value, onChange, disabled }) {
  const { hour, minute, period } = parseAmPmTime(value);

  const emit = (next) => {
    const h = next.hour ?? hour;
    const m = next.minute ?? minute;
    const p = next.period ?? period;
    onChange(h && m && p ? `${h}:${m} ${p}` : "");
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={hour}
        onValueChange={(v) => emit({ hour: v })}
        disabled={disabled}
      >
        <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <SelectValue placeholder={translate("Hour")} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {HOUR_OPTIONS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={minute}
        onValueChange={(v) => emit({ minute: v })}
        disabled={disabled}
      >
        <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <SelectValue placeholder={translate("Minute")} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MINUTE_OPTIONS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(v) => emit({ period: v })}
        disabled={disabled}
      >
        <SelectTrigger className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function TextInputForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  isTextArea = false,
  rows = 3,
  isNumber = false,
  isDate = false,
  isTime = false,
  isPhone = false,
  isEmail = false,
  isMoney = false,
  isICNumber = false,
  capitalizeWords: shouldCapitalizeWords = false,
  capitalizeFirst: shouldCapitalizeFirst = false,
  step = "any",
  placeholder,
  disabled = false,
}) {
  const { isSubmitted } = useFormState({ control });
  const errorMessage = errors?.[name]?.message;

  const applyCapitalization = (value) => {
    if (shouldCapitalizeWords) return capitalizeWords(value);
    if (shouldCapitalizeFirst) return capitalizeFirst(value);
    return value;
  };

  return (
    <div className="space-y-2">
      <Label className={disabled ? "text-gray-400 dark:text-gray-500" : ""}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{
          required: required
            ? translate("{label} is required").replace("{label}", label)
            : false,
          validate: (value) => {
            if (isEmail && value) {
              const isValid = validateFields(
                { [name]: value },
                [{ field: name, label, type: "email", required: false }]
              );
              return isValid || `${label} tidak sah`;
            }

            if (isPhone && value) {
              const isValid = validateFields(
                { [name]: value },
                [{ field: name, label, type: "phone", required: false }]
              );
              return isValid || `${label} tidak sah`;
            }

            return true;
          },
        }}
        render={({ field }) => {
          if (isTextArea) {
            return (
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => field.onChange(applyCapitalization(e.target.value))}
                className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            );
          }

          if (isTime) {
            return (
              <TimeAmPmInput
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
              />
            );
          }

          return (
            <div className="relative">
              <Input
                {...field}
                type={isNumber ? "number" : isDate ? "date" : "text"}
                disabled={disabled}
                step={isNumber ? step || "any" : undefined}
                placeholder={placeholder}
                value={
                  isMoney
                    ? field.value !== undefined && field.value !== null
                      ? Number(field.value)
                      : ""
                    : field.value ?? ""
                }
                maxLength={isICNumber ? 14 : undefined}
                onChange={(e) => {
                  if (isNumber || isMoney) {
                    field.onChange(Number(e.target.value) || 0);
                  } else if (isICNumber) {
                    field.onChange(formatICNumber(e.target.value));
                  } else {
                    field.onChange(applyCapitalization(e.target.value));
                  }
                }}
                className={isMoney ? "pr-12 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" : "dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"}
              />
              {isMoney && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 pointer-events-none">
                  RM
                </span>
              )}
            </div>
          );
        }}
      />

      {isSubmitted && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
