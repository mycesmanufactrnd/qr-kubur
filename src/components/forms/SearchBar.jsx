// @ts-nocheck
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";
import PlainTextInput from "@/components/plainforms/TextInput";
import PlainSelect from "@/components/plainforms/Select";
import PlainSelect2 from "@/components/plainforms/Select2";

/**
 * Reusable search bar card.
 *
 * Two ways to supply filter fields:
 *
 * 1. `children` (legacy) — pass fully built filter elements (Select, Input, etc.)
 *    Layout: quick-search input + Search button on one line, filters +
 *    Reset button below.
 *
 * 2. `filters` (JSON) — pass a plain array describing each field instead of
 *    building the elements yourself. SearchBar renders them with the plain
 *    (non react-hook-form) components in components/plainforms, auto-wrapping
 *    at 4 per row. Search / Reset are rendered together as a single action
 *    row underneath all fields.
 *
 *    Each entry: { type: "text" | "select" | "select2", key, value, onChange,
 *      label, options, disabled, loading, show, ...extra props passed
 *      through to the underlying plain component }
 *    `options` accepts strings or { value, label } objects.
 *    `show: false` skips rendering that field (e.g. superadmin-only filters).
 *    Prefer `label` over `placeholder` for filter fields — the plain
 *    components render the label INSIDE the field as the resting placeholder,
 *    then float it up once focused/filled, so there's no separate
 *    placeholder text (see components/plainforms).
 *
 * Props
 * ─────
 * value            string          current search input value (legacy mode)
 * onChange         fn(string)      called on every keystroke (legacy mode)
 * onSearch         fn()            called on button click or Enter
 * onReset          fn()            when provided, renders a Reset button
 * placeholder      string          input placeholder text (legacy mode)
 * buttonClassName  string          Tailwind classes for the Search button
 *                                  (default: emerald)
 * filtersClassName string          className for the filters wrapper div
 *                                  (legacy mode only; default: "grid grid-cols-2 sm:grid-cols-4 gap-3")
 * filters          array           JSON filter field definitions (see above)
 * children         ReactNode       filter elements (legacy mode)
 */
export default function SearchBar({
  value,
  onChange,
  onSearch,
  onReset,
  placeholder = "Search...",
  buttonClassName = "bg-emerald-600 hover:bg-emerald-700 text-white",
  filtersClassName = "grid grid-cols-2 sm:grid-cols-4 gap-3",
  filters,
  children,
}) {
  if (filters) {
    const visibleFilters = filters.filter((f) => f.show !== false);
    const handleEnter = (e) => {
      if (e.key === "Enter") onSearch?.();
    };

    return (
      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visibleFilters.map((filter, idx) => {
              const key = filter.key ?? idx;
              const {
                type,
                show,
                key: _key,
                ...fieldProps
              } = filter;

              if (type === "select") {
                return <PlainSelect key={key} {...fieldProps} />;
              }
              if (type === "select2") {
                return <PlainSelect2 key={key} {...fieldProps} />;
              }
              return (
                <PlainTextInput
                  key={key}
                  {...fieldProps}
                  onKeyDown={fieldProps.onKeyDown ?? handleEnter}
                />
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            {onReset && (
              <Button
                variant="outline"
                onClick={onReset}
                className="bg-transparent border-slate-400/40 text-inherit hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                {translate("Reset")}
              </Button>
            )}
            <Button onClick={onSearch} className={`px-6 ${buttonClassName}`}>
              <Search className="w-4 h-4 mr-2" />
              {translate("Search")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md dark:bg-slate-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
              className="pl-10 dark:border-slate-600"
            />
          </div>
          <Button onClick={onSearch} className={`px-6 ${buttonClassName}`}>
            {translate("Search")}
          </Button>
        </div>

        {(children || onReset) && (
          <div className={filtersClassName}>
            {children}
            {onReset && (
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full bg-transparent border-slate-400/40 text-inherit hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                {translate("Reset")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
