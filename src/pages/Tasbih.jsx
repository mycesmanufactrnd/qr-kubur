import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";

const translations = {
  en: {
    title: 'Digital Tasbih',
    subtitle: 'Count your dhikr',
    tap: 'Tap to Count',
    reset: 'Reset',
    today: "Today's Count"
  },
  ms: {
    title: 'Tasbih Digital',
    subtitle: 'Kira zikir anda',
    tap: 'Tekan untuk Mengira',
    reset: 'Set Semula',
    today: 'Kiraan Hari Ini'
  }
};

export default function Tasbih() {
  const language = localStorage.getItem('language') || 'ms';
  const t = translations[language];
  
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('tasbihCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [dailyCount, setDailyCount] = useState(() => {
    const saved = localStorage.getItem('tasbihDaily');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('tasbihDate');
    
    if (savedDate === today && saved) {
      return parseInt(saved, 10);
    }
    return 0;
  });

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    localStorage.setItem('tasbihCount', count.toString());
  }, [count]);

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('tasbihDaily', dailyCount.toString());
    localStorage.setItem('tasbihDate', today);
  }, [dailyCount]);

  const handleCount = () => {
    setCount(count + 1);
    setDailyCount(dailyCount + 1);
    setAnimate(true);
    
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => setAnimate(false), 300);
  };

  const handleReset = () => {
    setCount(0);
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  return (
    
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6">
      <BackNavigation title={translate('Tasbih')} />
      <div className="max-w-md w-full">
     
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>

       
        <div className="text-center mb-6">
          <div className="inline-block px-6 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">
              {t.today}: {dailyCount}
            </p>
          </div>
        </div>

        
        <motion.div
          animate={animate ? { scale: [1, 1.05, 1] } : {}}
          className="relative mb-8"
        >
          <button
            onClick={handleCount}
            className="w-full aspect-square rounded-full bg-gradient-to-br from-teal-400 via-blue-400 to-purple-400 dark:from-teal-600 dark:via-blue-600 dark:to-purple-600 shadow-2xl hover:shadow-3xl transition-all duration-300 active:scale-95 flex flex-col items-center justify-center group"
          >
            <motion.div
              animate={animate ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              className="text-8xl font-bold text-white mb-2"
            >
              {count}
            </motion.div>
            <p className="text-white/90 text-lg font-medium">{t.tap}</p>
          </button>
          
         
          {animate && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-teal-400 dark:bg-teal-600 pointer-events-none"
            />
          )}
        </motion.div>

       
        <div className="flex justify-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="px-8 py-6 text-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            {t.reset}
          </Button>
        </div>

    
        <div className="mt-8 flex justify-center gap-2">
          {[33, 99, 100].map((milestone) => (
            <div
              key={milestone}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                count >= milestone
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}
            >
              {milestone}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}