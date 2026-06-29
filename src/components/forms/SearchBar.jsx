import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";

/**
 * Reusable search bar card.
 *
 * Props
 * ─────
 * value            string          current search input value
 * onChange         fn(string)      called on every keystroke
 * onSearch         fn()            called on button click or Enter
 * onReset          fn()            when provided, appends a Reset button as the last
 *                                  child of the filters grid
 * placeholder      string          input placeholder text
 * buttonClassName  string          Tailwind classes for the Search button
 *                                  (default: emerald)
 * filtersClassName string          className for the filters wrapper div
 *                                  (default: "grid grid-cols-2 sm:grid-cols-4 gap-3")
 * children         ReactNode       filter elements (Select, Input, etc.) rendered
 *                                  inside the filters grid — omit when no filters needed
 */
export default function SearchBar({
  value,
  onChange,
  onSearch,
  onReset,
  placeholder = "Search...",
  buttonClassName = "bg-emerald-600 hover:bg-emerald-700 text-white",
  filtersClassName = "grid grid-cols-2 sm:grid-cols-4 gap-3",
  children,
}) {
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
