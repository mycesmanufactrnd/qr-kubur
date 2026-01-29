import React, { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";

/**
 * parameter example:
 * [
 *   { label: "Name", type: "text", searchColumn: "name" },
 *   { label: "State", type: "select", searchColumn: "state", options: STATES_MY.map(s => ({ id: s, name: s })) },
 *   { label: "Organisation", type: "select", searchColumn: "organisationId", options: [{ id: 1, name: "Org 1" }] }
 * ]
 */

export default function AdvancedFilters({ parameter, onApplyFilter }) {
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
      <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
        <Filter className="w-4 h-4" /> {translate("Filter")}
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

            <Button className="mt-auto w-full" onClick={handleApply}>
              {translate("Apply Filter")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
