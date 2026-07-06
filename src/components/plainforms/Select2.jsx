// @ts-nocheck
import { useState } from "react";
import FloatingLabel from "@/components/plainforms/FloatingLabel";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function Select2({
  value,
  onChange,
  label,
  options = [],
  required = false,
  disabled = false,
  loading = false,
  placeholder,
  disabledMessage,
  searchPlaceholder,
  emptyMessage = "No results found",
  noSelectionMessage,
}) {
  const [open, setOpen] = useState(false);

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const selected = normalized.find((o) => String(o.value) === String(value));
  const isDisabled = disabled || loading;

  // When labelled, the label itself fills the resting-placeholder slot, so
  // the trigger shows nothing until something is actually selected.
  const restingText = label ? "" : (placeholder ?? "Select...");
  const triggerLabel =
    isDisabled && disabledMessage
      ? disabledMessage
      : loading
        ? "Loading..."
        : selected
          ? selected.label
          : restingText;

  // Float whenever an option is actually matched (not based on
  // value-emptiness) — the trigger renders that option's label regardless,
  // including "all"/"" sentinel options, so a resting label would overlap it.
  const floated = !!label && (open || !!selected);

  return (
    <div className="relative">
      <FloatingLabel label={label} required={required} floated={floated} />

      <Popover
        open={open && !isDisabled}
        onOpenChange={(o) => !isDisabled && setOpen(o)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            className={`flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 ${
              label ? "h-10 pt-3.5 pb-0.5" : "h-9 py-2"
            }`}
          >
            <span className={!selected ? "text-muted-foreground" : ""}>
              {triggerLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder ?? "Search..."} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {normalized.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      onChange?.(o.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${String(o.value) === String(value) ? "opacity-100" : "opacity-0"}`}
                    />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {disabled && noSelectionMessage && (
        <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400">
          {noSelectionMessage}
        </p>
      )}
    </div>
  );
}
