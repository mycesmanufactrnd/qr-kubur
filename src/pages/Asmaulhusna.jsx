import { useEffect, useState } from 'react';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import { Sparkles } from 'lucide-react';

export default function AsmaUlHusna() {
  const [namesOfAllah, setNamesOfAllah] = useState([]);
  const [loading, setLoading] = useState(true);
  const language = localStorage.getItem('language') || 'ms';

  useEffect(() => {
    fetch('/namesOfAllah.json')
      .then(res => res.json())
      .then(data => setNamesOfAllah(data))
      .catch(err => console.error('Failed to load names:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate('Asmaul Husna')} />

      <div className="flex flex-col items-center text-center gap-2 px-4 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-1">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-base font-bold text-slate-800">{translate('99 Names of Allah')}</h2>
        <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
          {translate('Asma Ul-Husna')}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate('Listen & Memorize')}
            </p>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/pTk9jVDWNV0?loop=1&playlist=pTk9jVDWNV0"
              title="Asma Ul-Husna"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {!loading && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-slate-700">Nama-nama Allah</p>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              {namesOfAllah.length} nama
            </span>
          </div>
        )}

        {loading
          ? <ListCardSkeletonComponent />
          : (
            <div className="grid grid-cols-2 gap-3">
              {namesOfAllah.map((name, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="flex justify-end px-2.5 pt-2.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {index + 1}
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-center text-slate-800 px-2 pt-1 pb-1 leading-relaxed">
                    {name.arabic}
                  </p>

                  <div className="mx-4 h-px bg-slate-100" />

                  <div className="px-3 pt-2 pb-3 text-center">
                    <p className="text-xs font-semibold text-slate-700 mb-0.5">{name.transliteration}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {name.meaning[language] || name.meaning['en']}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}