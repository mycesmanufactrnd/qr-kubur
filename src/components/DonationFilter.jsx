import { useEffect, useState } from "react";
import { X, Search, MapPin, Building2, Heart, ChevronRight, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";

function TypeToggle({ value, onChange }) {
  const options = [
    {
      value: "organisation",
      label: translate("Organisation"),
      icon: Building2,
    },
    { value: "tahfiz", label: translate("Tahfiz Center"), icon: Heart },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
              isActive
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Bottom-sheet recipient picker for DonationPage — same slide-up chrome as
 * AdvancedFilters, but tailored to choosing a donation recipient: type
 * toggle + state select (both re-query the backend) and a name search that
 * only filters the already-fetched `recipients` list client-side.
 */
export default function DonationFilter({
  open,
  onOpenChange,
  recipientType,
  onRecipientTypeChange,
  recipients = [],
  isLoading = false,
  selectedState,
  onStateChange,
  selectedRecipientId,
  onSelectRecipient,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  const filteredRecipients = recipients.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleSelect = (id) => {
    onSelectRecipient(id);
    onOpenChange(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[1001] backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 w-full z-[1002] transform transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {translate("Choose Recipient")}
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-700 shrink-0" />

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <TypeToggle value={recipientType} onChange={onRecipientTypeChange} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder={translate("Search by name")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Select value={selectedState} onValueChange={onStateChange}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-slate-200 flex-1">
                  <SelectValue placeholder={translate("State")} />
                </SelectTrigger>
                <SelectContent className="z-[1010]">
                  <SelectItem value="nearby">{translate("Nearby")}</SelectItem>
                  {STATES_MY.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              {isLoading ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  {translate("Searching...")}
                </p>
              ) : filteredRecipients.length > 0 ? (
                filteredRecipients.map((r) => {
                  const isSelected = String(r.id) === String(selectedRecipientId);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelect(r.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left border shadow-sm transition-all active:scale-[0.98] ${
                        isSelected
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:border-rose-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {r.name}
                        </p>
                        {r.address && (
                          <p className="text-xs text-slate-400 truncate">
                            {r.address}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">
                  {recipientType === "organisation"
                    ? translate("No organisation found")
                    : translate("No tahfiz centers found")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
