import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';
import { translate } from '@/utils/translations';

const GUIDED_STAGES = [
  { id: 'subhanallah',  arabic: 'سُبْحَانَ ٱللَّٰهِ', transliteration: 'Subhanallah'  },
  { id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ',  transliteration: 'Alhamdulillah' },
  { id: 'allahuakbar',  arabic: 'ٱللَّٰهُ أَكْبَرُ',   transliteration: 'Allahu Akbar'  },
];

const GOAL_OPTIONS  = [33, 66, 99, 100];

export default function Tasbih() {
  const [mode,           setMode]           = useState('free');
  const [stageIndex,     setStageIndex]     = useState(0);
  const [targetGoal,     setTargetGoal]     = useState(33);
  const [showGoalMenu,   setShowGoalMenu]   = useState(false);
  const [showZikirMenu,  setShowZikirMenu]  = useState(false);
  const [freeCount,      setFreeCount]      = useState(0);
  const [guidedCount,    setGuidedCount]    = useState(0);
  const [animate,        setAnimate]        = useState(false);

  const [dailyCount, setDailyCount] = useState(() => {
    const saved     = localStorage.getItem('tasbihDaily');
    const today     = new Date().toDateString();
    const savedDate = localStorage.getItem('tasbihDate');
    return (savedDate === today && saved) ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('tasbihDaily', dailyCount.toString());
    localStorage.setItem('tasbihDate', today);
  }, [dailyCount]);

  const currentStage  = GUIDED_STAGES[stageIndex];
  const displayCount  = mode === 'free' ? freeCount : guidedCount;

  const speakZikir = () => {
    if (!('speechSynthesis' in window)) return;
    const msg  = new SpeechSynthesisUtterance();
    msg.text   = currentStage.transliteration;
    msg.lang   = 'ar-SA';
    window.speechSynthesis.speak(msg);
  };

  const vibrate = (pattern) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const handleCount = () => {
    if (mode === 'free') {
      setFreeCount(prev => prev + 1);
    } else {
      const next = guidedCount + 1;
      if (next >= targetGoal) {
        setStageIndex(prev => (prev + 1) % GUIDED_STAGES.length);
        setGuidedCount(0);
        vibrate([100, 50, 100]);
      } else {
        setGuidedCount(next);
        vibrate(50);
      }
    }
    setDailyCount(prev => prev + 1);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
  };

  const handleReset = () => {
    if (mode === 'free') setFreeCount(0);
    else setGuidedCount(0);
    vibrate([50, 100, 50]);
  };

  const goToStage = (dir) => {
    setStageIndex(prev => (prev + dir + GUIDED_STAGES.length) % GUIDED_STAGES.length);
    setGuidedCount(0);
    vibrate(100);
  };

  const closeMenus = () => { setShowGoalMenu(false); setShowZikirMenu(false); };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title={translate('Tasbih')} />

      <div className="flex flex-col items-center text-center gap-2 px-4 pb-4 max-w-md mx-auto">
        <h2 className="text-base font-bold text-slate-800">{translate('Digital Tasbih')}</h2>
        <p className="text-xs text-slate-400">{translate('Count your dhikr')}</p>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate("Today's Count")}
            </p>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {dailyCount} {translate('zikir')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 flex gap-1">
          {['free', 'guided'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'free' ? translate('Free') : translate('Guided')}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-center gap-4">

            {mode === 'guided' && (
              <button
                onClick={() => goToStage(-1)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col items-center gap-4">
              <motion.button
                animate={animate ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.3 }}
                onClick={handleCount}
                className="w-52 h-52 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 shadow-xl shadow-emerald-200 flex flex-col items-center justify-center active:scale-95 transition-transform relative overflow-hidden"
              >
                {animate && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-full bg-white pointer-events-none"
                  />
                )}
                <span className="text-6xl font-bold text-white leading-none z-10">
                  {displayCount}
                </span>
                {mode === 'guided' && (
                  <div className="mt-3 bg-white/90 rounded-xl px-4 py-1.5 flex flex-col items-center z-10">
                    <p className="text-base font-bold text-slate-800 leading-tight">{currentStage.arabic}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {currentStage.transliteration}
                    </p>
                  </div>
                )}
                {mode === 'free' && (
                  <p className="text-white/80 text-xs font-semibold mt-2 z-10">{translate('Tap to Count')}</p>
                )}
              </motion.button>

              {mode === 'guided' && (
                <p className="text-[11px] font-semibold text-slate-400">
                  {translate('Goal')}: <span className="text-emerald-600">{targetGoal}</span>
                </p>
              )}
            </div>

            {mode === 'guided' && (
              <button
                onClick={() => goToStage(1)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate('Controls')}</p>
          </div>
          <div className="p-4 space-y-3">

            <button
              onClick={handleReset}
              className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              {translate('Reset')}
            </button>

            {mode === 'guided' && (
              <div className="flex gap-2">

                {/* Goal Selector */}
                <div className="relative flex-1">
                  <button
                    onClick={() => { setShowGoalMenu(p => !p); setShowZikirMenu(false); }}
                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center active:opacity-70 transition-opacity"
                  >
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{translate('Goal')}</span>
                    <span className="text-sm font-bold text-emerald-600">{targetGoal}</span>
                  </button>
                  {showGoalMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[80px]">
                      {GOAL_OPTIONS.map(num => (
                        <button
                          key={num}
                          onClick={() => { setTargetGoal(num); setShowGoalMenu(false); }}
                          className={`block w-full px-4 py-2.5 text-xs font-bold border-b border-slate-100 last:border-none ${
                            targetGoal === num ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex-[2]">
                  <button
                    onClick={() => { setShowZikirMenu(p => !p); setShowGoalMenu(false); }}
                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center px-3 overflow-hidden active:opacity-70 transition-opacity"
                  >
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{translate('Zikir')}</span>
                    <span className="text-xs font-bold text-emerald-600 truncate w-full text-center">
                      {currentStage.transliteration}
                    </span>
                  </button>
                  {showZikirMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[160px]">
                      {GUIDED_STAGES.map((stage, i) => (
                        <button
                          key={stage.id}
                          onClick={() => { setStageIndex(i); setGuidedCount(0); setShowZikirMenu(false); }}
                          className={`block w-full px-4 py-2.5 text-left text-xs font-bold border-b border-slate-100 last:border-none ${
                            stageIndex === i ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
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
                  className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center active:opacity-70 transition-opacity"
                >
                  <Volume2 className="w-4 h-4 text-slate-500" />
                </button>

              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 items-start px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
          <span className="text-base mt-0.5">📿</span>
          <p className="text-xs text-blue-600 leading-relaxed">
            <span className="font-bold">Tip:</span> {translate('Regular dhikr brings peace to the heart and closeness to Allah.')}
          </p>
        </div>

      </div>
    </div>
  );
}