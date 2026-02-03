import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CheckboxForm({
  name,
  control,
  label,
}) {
  return (
    <div className="flex flex-col space-y-1">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(val) => field.onChange(val)}
            />
            <Label>{label}</Label>
          </div>
        )}
      />
    </div>
  );
}
