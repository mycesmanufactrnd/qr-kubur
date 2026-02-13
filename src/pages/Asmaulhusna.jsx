import { useEffect, useState } from 'react';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';

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
    <div className="pb-12 min-h-screen ">
      <BackNavigation title={translate('Asmaul Husna')} />
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pb-8 pt-4 px-4 text-center text-white shadow-lg">
        <h5 className="text-xl font-bold mb-2">{translate('99 Names of Allah')}</h5>
        <p className="text-sm text-white/90 max-w-md mx-auto">
          {translate('Asma Ul-Husna')}
        </p>
      </div>
      <div className="-mt-2 mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
        <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">{translate('Listen & Memorize')}</h2>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/pTk9jVDWNV0?loop=1&playlist=pTk9jVDWNV0"
            title="Asma Ul-Husna"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>
      {loading 
        ? <ListCardSkeletonComponent /> 
        : (
          <div className="grid grid-cols-2 gap-3">
            {namesOfAllah.map((name, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg pb-4 shadow-md hover:shadow-lg transition-all duration-300 border border-teal-100 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-center mb-1 text-purple-700 dark:text-purple-300">
                  {name.arabic}
                </h3>
                <p className="text-center text-gray-700 dark:text-gray-300 text-sm font-medium mb-0.5">
                  {name.transliteration}
                </p>
                <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                  {name.meaning[language] || name.meaning['en']}
                </p>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}