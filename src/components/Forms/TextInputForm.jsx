import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";

export default function TextInputForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  isTextArea = false,
  rows = 3,
  isNumber = false,
  step = "any",
}) {
  const errorMessage = errors?.[name]?.message;

  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={
          required
            ? { required: `${label} is required` }
            : undefined
        }
        render={({ field }) => {
          if (isTextArea) {
            return <Textarea {...field} value={field.value ?? ""} rows={rows} />;
          }

          return (
            <Input
              {...field}
              type={isNumber ? "number" : "text"}
              step={isNumber ? step || "any" : undefined}
              value={field.value ?? ""}
              onChange={(e) => {
                field.onChange(isNumber ? e.target.valueAsNumber : e.target.value);
              }}
            />
          );
        }}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
