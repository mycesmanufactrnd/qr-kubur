import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const [mode, setMode] = useState('free');
  const [stageIndex, setStageIndex] = useState(0);
  const [targetGoal, setTargetGoal] = useState(33);
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  
  const [showZikirMenu, setShowZikirMenu] = useState(false);
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('tasbihCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const speakZikir = () => {
  if ('speechSynthesis' in window) {
    const msg = new SpeechSynthesisUtterance();
    msg.text = currentStage.transliteration; 
    msg.lang = 'ar-SA'; 
    window.speechSynthesis.speak(msg);
      }
    };

  const [freeCount, setFreeCount] = useState(0);
  const [guidedCount, setGuidedCount] = useState(0);

  const [dailyCount, setDailyCount] = useState(() => {
    const saved = localStorage.getItem('tasbihDaily');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('tasbihDate');
    
    return (savedDate === today && saved) ? parseInt(saved, 10) : 0;
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

  const handleReset = () => {
    if (mode === 'free') setFreeCount(0);
    
    else setGuidedCount(0);
    
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const displayCount = mode === 'free' ? freeCount : guidedCount;

  const GUIDED_STAGES = [
  { id: 'subhanallah', arabic: "سُبْحَانَ ٱللَّٰهِ", transliteration: "Subhanallah" },
  { id: 'alhamdulillah', arabic: "ٱلْحَمْدُ لِلَّٰهِ", transliteration: "Alhamdulillah" },
  { id: 'allahuakbar', arabic: "ٱللَّٰهُ أَكْبَرُ", transliteration: "Allahu Akbar" }
  ];

  const getCurrentStage = () => {
    if (guidedCount < 33) return GUIDED_STAGES[0];
    if (guidedCount < 66) return GUIDED_STAGES[1];
    if (guidedCount < 100) return GUIDED_STAGES[2];
    return null; 
  };

  const currentStage = GUIDED_STAGES[stageIndex];

  const goToNextStage = () => {
    setStageIndex((prev) => (prev + 1) % GUIDED_STAGES.length); 
    setGuidedCount(0); 
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const goToPrevStage = () => {
    setStageIndex((prev) => (prev - 1 + GUIDED_STAGES.length) % GUIDED_STAGES.length); 
    setGuidedCount(0); 
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const handleCount = () => {
    if (mode === 'free') {
      setFreeCount(prev => prev + 1);
    } else {
      const nextCount = guidedCount + 1;
      const targetCount = currentStage.count;

      if (nextCount >= targetGoal) {
      
        setStageIndex((prev) => (prev + 1) % GUIDED_STAGES.length);
        setGuidedCount(0);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        setGuidedCount(nextCount);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }

    setDailyCount(prev => prev + 1);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
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

        
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-12 bg-green-100 dark:bg-green-900/30 rounded-full p-1 flex items-center border border-green-200 dark:border-green-800">
            <motion.div
              className="absolute h-10 bg-white dark:bg-slate-800 rounded-full shadow-sm z-0"
              initial={false}
              animate={{
                width: '50%',
                x: mode === 'free' ? 0 : '96%', 
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <button
              onClick={() => setMode('free')}
              className={`relative z-10 flex-1 text-center font-medium transition-colors duration-200 ${
                mode === 'free' ? 'text-teal-800 dark:text-teal-300' : 'text-gray-500'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setMode('guided')}
              className={`relative z-10 flex-1 text-center font-medium transition-colors duration-200 ${
                mode === 'guided' ? 'text-teal-800 dark:text-teal-300' : 'text-gray-500'
              }`}
            >
              Guided
            </button>
          </div>
        </div>

      
        <div className="flex items-center justify-center gap-4 w-full mb-8">
          
         
          {mode === 'guided' && (
            <button 
              onClick={goToPrevStage}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-teal-600 transition-all active:scale-90"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

        
          <motion.div animate={animate ? { scale: [1, 1.05, 1] } : {}} className="relative flex-shrink-0">
            <button
              onClick={handleCount}
              className="w-80 h-80 rounded-full bg-gradient-to-br from-teal-400 via-blue-400 to-purple-400 dark:from-teal-600 dark:via-blue-600 dark:to-purple-600 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform overflow-hidden"
            >
              <div className="flex flex-col items-center">
                <div className="text-8xl font-bold text-white leading-none">
                  {mode === 'free' ? freeCount : guidedCount}
                </div>
                
               
                {mode === 'guided' && (
                  <div className="text-white/60 text-sm font-medium mt-2">
                    Goal: {targetGoal}
                  </div>
                )}
              </div>

             
              {mode === 'guided' && (
                <div className="mt-4 bg-white/90 dark:bg-slate-800/90 rounded-full px-6 py-2 flex flex-col items-center min-w-[160px] shadow-inner">
                  <p className="text-base font-bold text-teal-900 dark:text-teal-100">
                    {currentStage.arabic}
                  </p>
                  <p className="text-[10px] font-medium text-teal-700/70 dark:text-teal-300/70 uppercase">
                    {currentStage.transliteration}
                  </p>
                </div>
              )}
              
              {mode === 'free' && (
                <p className="text-white/90 text-lg font-medium mt-4">{t.tap}</p>
              )}
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

         
          {mode === 'guided' && (
            <button 
              onClick={goToNextStage}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-teal-600 transition-all active:scale-90"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>

       
        <div className="mt-8 flex items-center justify-center gap-2 w-full">
          {mode === 'guided' ? (
            <>
             
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowGoalMenu(!showGoalMenu);
                    setShowZikirMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                >
                  <span className="text-xs font-bold text-gray-500 uppercase">Goal:</span>
                  <span className="text-sm font-black text-teal-600">{targetGoal}</span>
                </button>
                {showGoalMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border-2 border-teal-100 dark:border-teal-900 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[100px]">
                    {[33, 66, 99, 100].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setTargetGoal(num);
                          setShowGoalMenu(false);
                        }}
                        className={`block w-full px-6 py-3 text-sm font-bold transition-colors border-b last:border-none ${
                          targetGoal === num ? 'bg-teal-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-teal-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

             
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 py-6 text-base font-bold border-2 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.reset}
              </Button>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowZikirMenu(!showZikirMenu);
                    setShowGoalMenu(false);
                  }}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-all active:scale-95 min-w-[100px]"
                >
        
                  <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">
                    Zikir:
                  </span>

                  <span className="text-sm font-black text-teal-600 truncate max-w-[80px]">
                    {currentStage.transliteration}
                  </span>
                </button>

             
                {showZikirMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border-2 border-teal-100 dark:border-teal-900 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[150px]">
                    {GUIDED_STAGES.map((stage, index) => (
                      <button
                        key={stage.id}
                        onClick={() => {
                          setStageIndex(index);
                          setGuidedCount(0);
                          setShowZikirMenu(false);
                        }}
                        className={`block w-full px-4 py-3 text-left text-sm font-bold transition-colors border-b last:border-none ${
                          stageIndex === index ? 'bg-teal-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-teal-50'
                        }`}
                      >
                        {stage.transliteration}
                      </button>
                    ))}
                  </div>
                )}
              </div>

   
              <button 
                onClick={speakZikir}
                className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-teal-400 transition-all active:scale-90"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </>
          ) : (
    
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full max-w-xs py-6 text-base font-bold border-2 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.reset}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}