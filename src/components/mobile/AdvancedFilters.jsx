import { useRef, useState } from "react";
import { X, Filter, RotateCcw, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { translate } from "@/utils/translations";
import { useLocationContext } from "@/providers/LocationProvider";
import { Button } from "../ui/button";

/**
 * parameter example:
 * [
 *   { label: "Name", type: "text", searchColumn: "name" },
 *   { label: "State", type: "select", searchColumn: "state", options: STATES_MY.map(s => ({ id: s, name: s })) },
 *   { label: "Organisation", type: "select", searchColumn: "organisationId", options: [{ id: 1, name: "Org 1" }] }
 * ]
 */

export default function AdvancedFilters({ parameter, onApplyFilter }) {
  const { userState } = useLocationContext();
  const [open, setOpen] = useState(false);
  const touchStartYRef = useRef(0);
  const movedRef = useRef(false);
  const blockClickUntilRef = useRef(0);

  const [filterValues, setFilterValues] = useState(
    () => parameter.reduce((acc, curr) => { acc[curr.searchColumn] = ""; return acc; }, {})
  );

  const activeCount = Object.values(filterValues).filter(v => v !== "" && v !== false).length;

  const handleChange = (column, value) => {
    setFilterValues(prev => ({ ...prev, [column]: value }));
  };

  const handleApply = () => {
    onApplyFilter(filterValues);
    setOpen(false);
  };

  const handleClear = () => {
    setFilterValues(
      Object.keys(filterValues).reduce((acc, key) => {
        acc[key] = key === "state" ? userState || "" : "";
        return acc;
      }, {})
    );
  };

  const handleFilterTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
    movedRef.current = false;
  };

  const handleFilterTouchMove = (e) => {
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    if (deltaY > 6) {
      movedRef.current = true;
    }
  };

  const handleFilterTouchEnd = () => {
    if (movedRef.current) {
      blockClickUntilRef.current = Date.now() + 500;
    }
  };

  const handleOpenFilter = () => {
    if (Date.now() < blockClickUntilRef.current) return;
    setOpen(true);
  };

  return (
    <>
      <Button
        data-ptr-ignore="true"
        onTouchStart={handleFilterTouchStart}
        onTouchMove={handleFilterTouchMove}
        onTouchEnd={handleFilterTouchEnd}
        onClick={handleOpenFilter}
        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-sm ${
          activeCount > 0
            ? 'bg-emerald-500 text-white shadow-emerald-200'
            : 'bg-emerald-500 border border-slate-200 text-white'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        {translate("Filter")}
        {activeCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-600 text-[11px] font-bold">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          data-ptr-ignore="true"
          className="fixed inset-0 bg-black/40 z-[98] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        data-ptr-ignore="true"
        className={`fixed bottom-0 left-0 w-full z-[99] transform transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">

          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800">{translate("Advanced Filter")}</h3>
              {activeCount > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">{activeCount} filter aktif</p>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 shrink-0" />

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {parameter.map((p) => (
              <div key={p.searchColumn} className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {translate(p.label)}
                </label>

                {p.type === "text" && (
                  <Input
                    placeholder={translate(p.label)}
                    value={filterValues[p.searchColumn]}
                    onChange={e => handleChange(p.searchColumn, e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
                  />
                )}

                {p.type === "select" && (
                  <Select
                    value={filterValues[p.searchColumn]}
                    onValueChange={value => handleChange(p.searchColumn, value)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder={translate(p.label)} />
                    </SelectTrigger>
                    <SelectContent className="z-[1000]">
                      {p.options?.map(opt => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {p.type === "checkbox" && (
                  <Button
                    type="button"
                    onClick={() => handleChange(p.searchColumn, !filterValues[p.searchColumn])}
                    className={`flex items-center gap-3 w-full p-3.5 rounded-xl border text-sm font-medium transition-all ${
                      filterValues[p.searchColumn]
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      filterValues[p.searchColumn]
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300'
                    }`}>
                      {filterValues[p.searchColumn] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {translate(p.label)}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="shrink-0 px-5 pb-6 pt-3 flex gap-3">
            <Button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold active:opacity-75 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {translate("Clear")}
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-200 active:opacity-80 transition-all"
            >
              {translate("Apply Filter")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
