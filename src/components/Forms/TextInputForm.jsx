import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { validateFields } from "@/utils/validations";

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
  step = "any",
}) {
  const errorMessage = errors?.[name]?.message;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `${label} is required` : false,
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
            return <Textarea {...field} value={field.value ?? ""} rows={rows} />;
          }

          return (
            <div className="relative">
              <Input
                {...field}
                type={isNumber ? "number" : isDate ? "date" : "text"}
                step={isNumber ? step || "any" : undefined}
                value={
                    isMoney
                      ? field.value !== undefined && field.value !== null
                        ? Number(field.value)
                        : ""
                      : field.value ?? ""
                  }
                onChange={(e) => {
                  if (isNumber || isMoney) {
                    field.onChange(Number(e.target.value) || 0);
                  } else if (isDate) {
                    field.onChange(e.target.value);
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
                className={isMoney ? "pr-12" : undefined}
              />
              {isMoney && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  RM
                </span>
              )}
            </div>
          );
        }}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
