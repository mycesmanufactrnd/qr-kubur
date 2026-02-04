import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function DuaCard({ dua }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-0.5 bg-emerald-500" />

      <div className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug">
            {dua.title}
          </h3>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-right text-xl leading-loose font-arabic text-slate-900">
            {dua.arabic}
          </p>
        </div>

        {dua.latin && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? 'Hide' : 'Show'} Transliteration
          </button>
        )}

        {open && dua.latin && (
          <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded">
            {dua.latin}
          </p>
        )}

        {dua.translation && (
          <p className="text-sm text-slate-700 leading-relaxed">
            {dua.translation}
          </p>
        )}

        {dua.notes && (
          <div className="text-xs bg-amber-50 border border-amber-100 p-2 rounded">
            <span className="font-semibold">Note:</span> {dua.notes}
          </div>
        )}

        {dua.fawaid && (
          <div className="text-xs bg-blue-50 border border-blue-100 p-2 rounded">
            <span className="font-semibold">Benefit:</span> {dua.fawaid}
          </div>
        )}

        {dua.source && (
          <p className="text-[11px] text-slate-500 italic">
            — {dua.source}
          </p>
        )}
      </div>
    </Card>
  );
}
