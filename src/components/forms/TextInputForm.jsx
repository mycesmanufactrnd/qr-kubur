// @ts-nocheck
import { Controller, useFormState } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateFields } from "@/utils/validations";
import { formatICNumber } from "@/utils/helpers";
import { translate } from "@/utils/translations";

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
  isPhone = false,
  isEmail = false,
  isMoney = false,
  isICNumber = false,
  step = "any",
  placeholder,
  disabled = false,
}) {
  const { isSubmitted } = useFormState({ control });
  const errorMessage = errors?.[name]?.message;

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
                className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
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
                    field.onChange(e.target.value);
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
