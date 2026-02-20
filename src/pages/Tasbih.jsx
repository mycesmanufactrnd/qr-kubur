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


const getStageAt = (offset) => {
  const index = (stageIndex + offset + GUIDED_STAGES.length) % GUIDED_STAGES.length;
  return GUIDED_STAGES[index];
};

const prevStage = getStageAt(-1);
const nextStage = getStageAt(1)

return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 overflow-hidden">
      <BackNavigation title={translate('Tasbih')} />
      <div className="max-w-md w-full flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 dark:text-teal-300 mb-1">{t.title}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>

        {/* Daily Progress */}
        <div className="text-center mb-6">
          <div className="inline-block px-5 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 font-medium">
              {t.today}: {dailyCount}
            </p>
          </div>
        </div>

        {/* Mode Toggle Slider */}
        <div className="flex justify-center mb-6 sm:mb-8 scale-90 sm:scale-100">
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
            <button onClick={() => setMode('free')} className={`relative z-10 flex-1 text-center font-medium text-sm ${mode === 'free' ? 'text-teal-800 dark:text-teal-300' : 'text-gray-500'}`}>Free</button>
            <button onClick={() => setMode('guided')} className={`relative z-10 flex-1 text-center font-medium text-sm ${mode === 'guided' ? 'text-teal-800 dark:text-teal-300' : 'text-gray-500'}`}>Guided</button>
          </div>
        </div>

        {/* --- CAROUSEL / MAIN BUTTON AREA --- */}
        <div className="relative flex items-center justify-center w-full mb-8 sm:mb-12 px-2">
          
          {/* Left Preview */}
          {mode === 'guided' && (
            <motion.div 
              key={`prev-${stageIndex}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 0.15 }} 
              className="absolute left-[-45%] sm:left-[-40%] w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-teal-400/50 to-purple-400/50 scale-75 pointer-events-none flex flex-col items-center justify-center"
            >
              <p className="text-white text-4xl font-bold opacity-30">0</p>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-2 sm:gap-6 z-10">
            {/* Left Chevron */}
            {mode === 'guided' && (
              <button onClick={goToPrevStage} className="p-2 sm:p-3 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md text-gray-400 hover:text-teal-600 active:scale-90 transition-all">
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Combined Main Button Section */}
            <motion.div animate={animate ? { scale: [1, 1.05, 1] } : {}} className="relative flex-shrink-0">
              <button
                onClick={handleCount}
                className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-teal-400 via-blue-400 to-purple-400 dark:from-teal-600 dark:via-blue-600 dark:to-purple-600 shadow-xl flex flex-col items-center justify-center active:scale-95 transition-transform overflow-hidden relative"
              >
                {/* Counter Number */}
                <div className="text-7xl sm:text-8xl font-bold text-white leading-none z-10">
                  {displayCount}
                </div>
                
                {/* Guided Info Overlay */}
                {mode === 'guided' && (
                  <>
                    <div className="text-white/70 text-xs sm:text-sm font-medium mt-1 z-10">Goal: {targetGoal}</div>
                    
                    {/* Central Text Box */}
                    <div className="mt-4 bg-white/95 dark:bg-slate-900/90 rounded-2xl px-5 sm:px-8 py-2 sm:py-3 flex flex-col items-center min-w-[140px] sm:min-w-[180px] shadow-lg z-10">
                      <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                        {currentStage.arabic}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                        {currentStage.transliteration}
                      </p>
                    </div>
                  </>
                )}
                
                {mode === 'free' && <p className="text-white/90 text-sm sm:text-lg font-medium mt-4 z-10">{t.tap}</p>}
              </button>

              {/* Ripple Effect Animation */}
              {animate && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }} 
                  animate={{ scale: 1.5, opacity: 0 }} 
                  transition={{ duration: 0.6 }} 
                  className="absolute inset-0 rounded-full bg-white dark:bg-teal-400 pointer-events-none z-0" 
                />
              )}
            </motion.div>

            {/* Right Chevron */}
            {mode === 'guided' && (
              <button onClick={goToNextStage} className="p-2 sm:p-3 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md text-gray-400 hover:text-teal-600 active:scale-90 transition-all">
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Right Preview */}
          {mode === 'guided' && (
            <motion.div 
              key={`next-${stageIndex}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 0.15 }}
              className="absolute right-[-45%] sm:right-[-40%] w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-teal-400/50 to-purple-400/50 scale-75 pointer-events-none flex flex-col items-center justify-center"
            >
              <p className="text-white text-4xl font-bold opacity-30">0</p>
            </motion.div>
          )}
        </div>

        {/* --- BOTTOM CONTROL BAR --- */}
        <div className="w-full max-w-[380px] space-y-3 px-2">
          {mode === 'guided' ? (
            <>
              {/* Row 1: Primary Reset Button */}
              <div className="flex justify-center w-full">
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  className="w-full py-7 text-lg font-black text-slate-800 dark:text-white border-2 border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-gray-800 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-5 h-5 mr-3 text-gray-400" />
                  {t.reset}
                </Button>
              </div>

              {/* Row 2: Secondary Controls */}
              <div className="flex items-stretch justify-center gap-2 h-16 sm:h-20">
                
                {/* Goal Selector */}
                <div className="relative flex-1">
                  <button 
                    onClick={() => { setShowGoalMenu(!showGoalMenu); setShowZikirMenu(false); }} 
                    className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl active:scale-95 shadow-sm"
                  >
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Goal:</span>
                    <span className="text-sm sm:text-base font-black text-teal-600">{targetGoal}</span>
                  </button>
                  {showGoalMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border-2 border-teal-100 rounded-xl shadow-xl z-50 min-w-[80px] overflow-hidden">
                      {[33, 66, 99, 100].map((num) => (
                        <button key={num} onClick={() => { setTargetGoal(num); setShowGoalMenu(false); }} className={`block w-full px-4 py-2.5 text-xs font-bold border-b dark:border-gray-700 last:border-none ${targetGoal === num ? 'bg-teal-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-teal-50'}`}>{num}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zikir Selector */}
                <div className="relative flex-[2.5]">
                  <button 
                    onClick={() => { setShowZikirMenu(!showZikirMenu); setShowGoalMenu(false); }} 
                    className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl active:scale-95 shadow-sm px-2 overflow-hidden"
                  >
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Zikir:</span>
                    <span className="text-[11px] sm:text-xs font-black text-teal-600 truncate w-full text-center">
                      {currentStage.transliteration}
                    </span>
                  </button>
                  {showZikirMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border-2 border-teal-100 rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden">
                      {GUIDED_STAGES.map((stage, index) => (
                        <button key={stage.id} onClick={() => { setStageIndex(index); setGuidedCount(0); setShowZikirMenu(false); }} className={`block w-full px-4 py-2.5 text-left text-xs font-bold border-b dark:border-gray-700 last:border-none ${stageIndex === index ? 'bg-teal-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-teal-50'}`}>{stage.transliteration}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice/Volume Button */}
                <button 
                  onClick={speakZikir} 
                  className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm active:scale-90 transition-transform"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-teal-400" />
                </button>
              </div>
            </>
          ) : (
            /* Free Mode Reset Button */
            <div className="flex justify-center w-full">
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="w-full max-w-[220px] py-7 text-lg font-black text-slate-800 dark:text-white border-2 border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-gray-800 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5 mr-3 text-gray-400" />
                {t.reset}
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}