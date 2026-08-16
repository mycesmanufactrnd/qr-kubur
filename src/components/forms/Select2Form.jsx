// @ts-nocheck
import { useState } from "react";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
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
import { translate } from "@/utils/translations";

export default function Select2Form({
  name,
  control,
  label,
  options = [],
  required = false,
  errors = {},
  disabled = false,
  loading = false,
  placeholder,
  disabledMessage,
  searchPlaceholder,
  emptyMessage,
  noSelectionMessage,
  onValueChange,
}) {
  const errorMessage = errors?.[name]?.message;

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={
          required
            ? {
                required: translate("{label} is required").replace(
                  "{label}",
                  label,
                ),
              }
            : undefined
        }
        render={({ field }) => {
          const selected = normalized.find((o) => o.value === field.value);
          const [open, setOpen] = useState(false);
          const isDisabled = disabled || loading;

          const triggerLabel =
            isDisabled && disabledMessage
              ? disabledMessage
              : loading
                ? translate("Loading...")
                : selected
                  ? selected.label
                  : (placeholder ?? translate("Select..."));

          return (
            <Popover
              open={open && !isDisabled}
              onOpenChange={(o) => !isDisabled && setOpen(o)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isDisabled}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
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
                  <CommandInput
                    placeholder={searchPlaceholder ?? translate("Search...")}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {emptyMessage ?? translate("No results found")}
                    </CommandEmpty>
                    <CommandGroup>
                      {normalized.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={o.label}
                          onSelect={() => {
                            field.onChange(o.value);
                            onValueChange?.(o.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${o.value === field.value ? "opacity-100" : "opacity-0"}`}
                          />
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        }}
      />

      {disabled && noSelectionMessage && (
        <p className="text-xs text-amber-500 dark:text-amber-400">
          {noSelectionMessage}
        </p>
      )}

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
