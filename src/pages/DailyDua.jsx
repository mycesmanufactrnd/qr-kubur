import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Sun, Moon, Book, Sparkles, Clock } from 'lucide-react';
import DuaCard from '@/components/DuaCard';
import BackNavigation from '@/components/BackNavigation';
import { translate } from '@/utils/translations';

const CATEGORIES = [
  { id: 'all', label: "All", color: 'emerald' },
  { id: 'daily-dua', label: 'Daily', color: 'rose' },
  { id: 'morning-dhikr', label: 'Morning', color: 'amber' },
  { id: 'evening-dhikr', label: 'Evening', color: 'indigo' },
  { id: 'dhikr-after-salah', label: 'After Salah', color: 'teal' },
  { id: 'selected-dua', label: 'Selected', color: 'purple' },
];

export default function DailyDua() {
  const [allDoa, setAllDoa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadAllDoa = async () => {
      try {
        const files = [
          '/dua-dhikr/daily-dua.json',
          '/dua-dhikr/morning-dhikr.json',
          '/dua-dhikr/evening-dhikr.json',
          '/dua-dhikr/dhikr-after-salah.json',
          '/dua-dhikr/selected-dua.json',
        ];

        const responses = await Promise.all(
          files.map(url => fetch(url).then(res => res.json()))
        );

        const merged = responses.flatMap((list, index) =>
          list.map(item => ({
            ...item,
            group: files[index]
              .replace('/dua-dhikr/', '')
              .replace('.json', '')
          }))
        );

        setAllDoa(merged);
      } catch (e) {
        console.error('Failed to load du\'a', e);
      } finally {
        setLoading(false);
      }
    };

    loadAllDoa();
  }, []);

  const filteredDoa = selectedCategory === 'all' 
    ? allDoa 
    : allDoa.filter(dua => dua.group === selectedCategory);

  const getCategoryColor = (color) => ({
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    rose: 'bg-rose-500 hover:bg-rose-600 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    teal: 'bg-teal-500 hover:bg-teal-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
  }[color]);

  const getCategoryOutline = (color) => ({
    emerald: 'border-emerald-600 text-emerald-700 hover:bg-emerald-50',
    rose: 'border-rose-500 text-rose-700 hover:bg-rose-50',
    amber: 'border-amber-500 text-amber-700 hover:bg-amber-50',
    indigo: 'border-indigo-500 text-indigo-700 hover:bg-indigo-50',
    teal: 'border-teal-500 text-teal-700 hover:bg-teal-50',
    purple: 'border-purple-500 text-purple-700 hover:bg-purple-50',
  }[color]);

  return (
    <div className="pb-12 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <BackNavigation title={translate('Daily Dua & Dhikr')} />

      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pb-8 pt-4 px-4 text-center text-white shadow-lg">
        <h5 className="text-xl font-bold mb-2">Du'a & Dhikr Collection</h5>
        <p className="text-sm text-white/90 max-w-md mx-auto">
          A strong heart remembers Allah
        </p>
      </div>
      <div className="max-w-5xl mx-auto space-y-6 -mt-2">
        <Card className="p-4 shadow-lg border-0 bg-white rounded-b-lg rounded-t-none">
          <div className="flex items-center gap-2 mb-3">
            <Book className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">Browse by Category</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                  ${
                    selectedCategory === c.id
                      ? `${getCategoryColor(c.color)} shadow-md`
                      : `${getCategoryOutline(c.color)} bg-white`
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

        </Card>

        {(selectedCategory === 'all' || selectedCategory === 'morning-dhikr' || selectedCategory === 'evening-dhikr') && (
          <div className="grid md:grid-cols-2 gap-4">
            {(selectedCategory === 'all' || selectedCategory === 'morning-dhikr') && (
              <Card className="p-4 space-y-3 border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Morning Zikir</h3>
                    <p className="text-xs text-slate-600">Start your day with dhikr</p>
                  </div>
                </div>

                <div className="relative w-full rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/rCXxm_yVmkM"
                    title="Morning Zikir"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}

            {(selectedCategory === 'all' || selectedCategory === 'evening-dhikr') && (
              <Card className="p-4 space-y-3 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Moon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Evening Zikir</h3>
                    <p className="text-xs text-slate-600">End your day with remembrance</p>
                  </div>
                </div>

                <div className="relative w-full rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/uawK9NL9EPA"
                    title="Evening Zikir"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="space-y-4">
          {!loading && filteredDoa.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-slate-800">
                {selectedCategory === 'all' ? 'All Du\'a' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h2>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {filteredDoa.length} {filteredDoa.length === 1 ? 'du\'a' : 'du\'as'}
              </span>
            </div>
          )}

          {loading && (
            <Card className="p-8 text-center border-0 shadow-sm">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading du'a...</p>
            </Card>
          )}

          {!loading && filteredDoa.length === 0 && (
            <Card className="p-8 text-center border-0 shadow-sm">
              <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No du'a found in this category</p>
            </Card>
          )}

          {!loading &&
            filteredDoa.map((dua, index) => (
              <DuaCard key={`${dua.group}-${index}`} dua={dua} />
            ))}
        </div>
      </div>
    </div>
  );
}