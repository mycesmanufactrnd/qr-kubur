// @ts-nocheck
import { useState } from "react";
import FloatingLabel from "@/components/plainforms/FloatingLabel";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Select({
  value,
  onChange,
  label,
  placeholder,
  options = [],
  required = false,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  // No label — plain select with a normal placeholder, unchanged from before.
  if (!label) {
    return (
      <UiSelect
        value={value ?? ""}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          disabled={disabled}
          className={`bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0 ${className}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalized.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    );
  }

  // Labelled — the label itself sits inside the field as the placeholder,
  // then floats up once opened or a real option is matched. Based on
  // whether an option actually matches (not value-emptiness) since the
  // trigger always renders the matched option's label — including "all"/""
  // sentinel options — which would otherwise sit under the resting label.
  const selected = normalized.find((o) => String(o.value) === String(value));
  const floated = open || !!selected;

  return (
    <div className="relative">
      <FloatingLabel label={label} required={required} floated={floated} />
      <UiSelect
        value={value ?? ""}
        onValueChange={onChange}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectTrigger
          disabled={disabled}
          className={`h-10 pt-3.5 pb-0.5 bg-transparent dark:border-slate-600 dark:text-white dark:hover:bg-white/10 focus:ring-0 ${className}`}
        >
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          {normalized.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    </div>
  );
}
