import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CheckboxForm({
  name,
  control,
  label,
  required = false,
  errors = {},
}) {
  const errorMessage = errors?.[name]?.message;

  return (
    <div className="space-y-1">
      <Controller
        name={name}
        control={control}
        rules={
          required
            ? {
                validate: (v) => v === true || `${label} is required`,
              }
            : undefined
        }
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(val) => field.onChange(val === true)}
            />
            <Label>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        )}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
