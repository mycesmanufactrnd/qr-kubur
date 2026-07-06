// @ts-nocheck
import { Label } from "@/components/ui/label";

// Shared overlay label for plainforms fields — sits inside the field like a
// placeholder at rest, then floats up + shrinks once the field has focus or
// a value, so it never costs its own row above the field.
export default function FloatingLabel({ label, required, floated }) {
  if (!label) return null;

  return (
    <Label
      className={`pointer-events-none absolute left-3 z-10 origin-left transition-all duration-150 ${
        floated
          ? "top-1.5 scale-90 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          : "top-1/2 -translate-y-1/2 text-muted-foreground"
      }`}
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );
}
