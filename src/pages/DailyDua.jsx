import { useEffect, useState } from 'react';
import { Sun, Moon, Book } from 'lucide-react';
import DuaCard from '@/components/DuaCard';
import BackNavigation from '@/components/BackNavigation';
import { translate } from '@/utils/translations';

const CATEGORIES = [
  { id: 'all',               label: 'All',         emoji: '✦' },
  { id: 'daily-dua',         label: 'Daily',        emoji: '🤲' },
  { id: 'morning-dhikr',     label: 'Morning',      emoji: '🌅' },
  { id: 'evening-dhikr',     label: 'Evening',      emoji: '🌙' },
  { id: 'dhikr-after-salah', label: 'After Salah',  emoji: '🕌' },
  { id: 'selected-dua',      label: 'Selected',     emoji: '⭐' },
];

export default function DailyDua() {
  const [allDoa, setAllDoa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const files = [
      '/dua-dhikr/daily-dua.json',
      '/dua-dhikr/morning-dhikr.json',
      '/dua-dhikr/evening-dhikr.json',
      '/dua-dhikr/dhikr-after-salah.json',
      '/dua-dhikr/selected-dua.json',
    ];

    Promise.all(files.map(url => fetch(url).then(r => r.json())))
      .then(responses => {
        setAllDoa(responses.flatMap((list, i) =>
          list.map(item => ({
            ...item,
            group: files[i].replace('/dua-dhikr/', '').replace('.json', ''),
          }))
        ));
      })
      .catch(e => console.error("Failed to load du'a", e))
      .finally(() => setLoading(false));
  }, []);

  const filteredDoa = selectedCategory === 'all'
    ? allDoa
    : allDoa.filter(d => d.group === selectedCategory);

  const showMorning = selectedCategory === 'all' || selectedCategory === 'morning-dhikr';
  const showEvening = selectedCategory === 'all' || selectedCategory === 'evening-dhikr';
  const showVideos  = showMorning || showEvening;

  const activeCat = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate('Daily Dua & Dhikr')} />

      <div className="flex flex-col items-center text-center gap-2 px-4 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-1">
          <Book className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Du'a & Dhikr</h2>
        <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
          Verily, in the remembrance of Allah do hearts find rest
        </p>
      </div>

      <div className="relative mb-4 px-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-lg overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max min-w-full">
            {CATEGORIES.map(c => {
              const isActive = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4">

        {showVideos && (
          <div className={`grid gap-3 ${showMorning && showEvening ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {showMorning && (
              <div className="rounded-2xl overflow-hidden border border-amber-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Sun className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">Morning Zikir</p>
                    <p className="text-[10px] text-slate-400">Start your day with dhikr</p>
                  </div>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/rCXxm_yVmkM"
                    title="Morning Zikir"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {showEvening && (
              <div className="rounded-2xl overflow-hidden border border-indigo-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Moon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">Evening Zikir</p>
                    <p className="text-[10px] text-slate-400">End your day with remembrance</p>
                  </div>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/uawK9NL9EPA"
                    title="Evening Zikir"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && filteredDoa.length > 0 && (
          <div className="flex items-center justify-between px-1 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeCat?.emoji}</span>
              <p className="text-sm font-bold text-slate-700">
                {selectedCategory === 'all' ? "All Du'a" : activeCat?.label}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              {filteredDoa.length} du'a{filteredDoa.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading du'a...</p>
          </div>
        )}

        {!loading && filteredDoa.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 gap-3">
            <Book className="w-10 h-10 text-slate-200" />
            <p className="text-sm text-slate-400">No du'a found in this category</p>
          </div>
        )}

        {!loading && filteredDoa.map((dua, index) => (
          <DuaCard key={`${dua.group}-${index}`} dua={dua} />
        ))}
      </div>
    </div>
  );
}