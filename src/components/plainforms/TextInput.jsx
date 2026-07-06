// @ts-nocheck
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FloatingLabel from "@/components/plainforms/FloatingLabel";

export default function TextInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  isTextArea = false,
  rows = 3,
  isNumber = false,
  isDate = false,
  className = "",
  onKeyDown,
}) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e) =>
    onChange?.(isNumber ? Number(e.target.value) || 0 : e.target.value);

  // No label — plain field with a normal placeholder, unchanged from before.
  if (!label) {
    return isTextArea ? (
      <Textarea
        value={value ?? ""}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${className}`}
      />
    ) : (
      <Input
        type={isNumber ? "number" : isDate ? "date" : "text"}
        value={value ?? ""}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${className}`}
      />
    );
  }

  // Labelled — the label itself sits inside the field as the placeholder,
  // then floats up once focused or filled. No separate placeholder text.
  const hasValue = value !== undefined && value !== null && value !== "";
  const floated = focused || hasValue || isDate; // date inputs render native chrome that always occupies the resting-label spot

  if (isTextArea) {
    return (
      <div className="relative">
        <FloatingLabel label={label} required={required} floated={floated} />
        <Textarea
          value={value ?? ""}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          placeholder=""
          disabled={disabled}
          className={`pt-4 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${className}`}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <FloatingLabel label={label} required={required} floated={floated} />
      <Input
        type={isNumber ? "number" : isDate ? "date" : "text"}
        value={value ?? ""}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder=""
        disabled={disabled}
        className={`h-10 pt-4 pb-0.5 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${className}`}
      />
    </div>
  );
}
