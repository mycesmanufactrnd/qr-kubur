import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SelectForm({
  name,
  control,
  label,
  placeholder,
  options,
  required = false,
  errors = {},
  disabled = false,
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
        disabled={disabled}
        rules={
          required
            ? { required: `${label} is required` }
            : undefined
        }
        render={({ field }) => (
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.map((option, idx) => {
                if (typeof option === "string") {
                  return (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  );
                } else {
                  return (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  );
                }
              })}
            </SelectContent>
          </Select>
        )}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
