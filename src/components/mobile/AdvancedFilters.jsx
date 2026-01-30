import { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";

/**
 * parameter example:
 * [
 *   { label: "Name", type: "text", searchColumn: "name" },
 *   { label: "State", type: "select", searchColumn: "state", options: STATES_MY.map(s => ({ id: s, name: s })) },
 *   { label: "Organisation", type: "select", searchColumn: "organisationId", options: [{ id: 1, name: "Org 1" }] }
 * ]
 */

export default function AdvancedFilters({ parameter, onApplyFilter }) {
  const {
    userState
  } = useLocationContext();

  const [open, setOpen] = useState(false);

  const [filterValues, setFilterValues] = useState(
    () =>
      parameter.reduce((acc, curr) => {
        acc[curr.searchColumn] = "";
        return acc;
      }, {})
  );

  const handleChange = (column, value) => {
    setFilterValues((prev) => ({ ...prev, [column]: value }));
  };

  const handleApply = () => {
    onApplyFilter(filterValues); 
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-full bg-emerald-500 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
      >
        {translate("Filter")}
        <Filter className="w-4 h-4" />
        {Object.entries(filterValues)
          .filter(([_, v]) => v)
          .map(([k, v]) => (
            <span
              key={k}
              className="bg-white/20 px-2 py-0.5 rounded-full text-xs truncate max-w-[60px]"
            >
              {translate(k)}: {v}
            </span>
          ))}
        {Object.values(filterValues).every(v => !v)}
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[98]"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 w-full h-3/4 bg-white dark:bg-gray-800 shadow-lg
          z-[99] transform transition-transform duration-300
          ${open ? "translate-y-0" : "translate-y-full"}
          rounded-t-xl`}
      >
        <Card className="h-full flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="px-4 py-2 flex justify-center">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{translate("Advanced Filter")}</h3>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {parameter.map((p) => {
                if (p.type === "text") {
                  return (
                    <Input
                      key={p.searchColumn}
                      placeholder={translate(p.label)}
                      value={filterValues[p.searchColumn]}
                      onChange={(e) => handleChange(p.searchColumn, e.target.value)}
                      className="h-9"
                    />
                  );
                } else if (p.type === "select") {
                  return (
                    <Select
                      key={p.searchColumn}
                      value={filterValues[p.searchColumn]}
                      onValueChange={(value) => handleChange(p.searchColumn, value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={translate(p.label)} />
                      </SelectTrigger>
                      <SelectContent className="z-[1000]">
                        {p.options?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }
              })}
            </div>

            <div className="mt-auto flex gap-2">
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  const resetValues = Object.keys(filterValues).reduce((acc, key) => {
                    acc[key] = key === "state" ? userState || "" : "";
                    return acc;
                  }, {});
                  setFilterValues(resetValues);
                }}
              >
                {translate("Clear Filter")}
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleApply}
              >
                {translate("Apply Filter")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
