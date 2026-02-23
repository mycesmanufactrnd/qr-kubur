export default function PageLoadingComponent() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-emerald-50/95 backdrop-blur-sm pointer-events-auto">

      <div className="relative flex items-center justify-center w-24 h-24">

        {/* Rotating outer ring with star pattern */}
        <div className="absolute inset-0 rounded-full border-2 border-amber-300/40 animate-[spin_8s_linear_infinite]">
          {/* 8-point star dots */}
          {[0,45,90,135,180,225,270,315].map((deg) => (
            <span
              key={deg}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-500"
              style={{
                top: '50%', left: '50%',
                transform: `rotate(${deg}deg) translateY(-42px) translate(-50%, -50%)`,
              }}
            />
          ))}
        </div>

        {/* Counter-rotating middle ring */}
        <div className="absolute inset-4 rounded-full border border-teal-500/30 animate-[spin_5s_linear_infinite_reverse]">
          {[0,60,120,180,240,300].map((deg) => (
            <span
              key={deg}
              className="absolute w-1 h-1 rounded-full bg-teal-500"
              style={{
                top: '50%', left: '50%',
                transform: `rotate(${deg}deg) translateY(-24px) translate(-50%, -50%)`,
              }}
            />
          ))}
        </div>

        {/* Inner slow ring */}
        <div className="absolute inset-8 rounded-full border border-amber-400/20 animate-[spin_3s_linear_infinite]" />

        {/* Core — 8-point Islamic star shape */}
        <div className="relative z-10 flex items-center justify-center w-10 h-10 animate-[pulse_2s_ease-in-out_infinite]">
          <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-md">
            <path
              d="M20 2 L23.5 16.5 L38 20 L23.5 23.5 L20 38 L16.5 23.5 L2 20 L16.5 16.5 Z"
              fill="none"
              stroke="#d97706"
              strokeWidth="1.5"
            />
            <path
              d="M20 6 L22.5 17.5 L34 20 L22.5 22.5 L20 34 L17.5 22.5 L6 20 L17.5 17.5 Z"
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            <circle cx="20" cy="20" r="4" fill="#d97706" />
          </svg>
        </div>
      </div>

      {/* Arabic-inspired label */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Decorative line with diamond */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-amber-400" />
          <span className="text-amber-500 text-[8px] rotate-45 inline-block">◆</span>
          <div className="w-8 h-px bg-amber-400" />
        </div>

        <p className="font-serif text-xs tracking-[0.3em] uppercase text-amber-800/70 animate-[fadeUp_0.6s_ease_both]">
          Loading<span className="animate-[blink_1s_step-end_infinite] text-amber-500">_</span>
        </p>

        {/* Decorative line with diamond */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-amber-400" />
          <span className="text-amber-500 text-[8px] rotate-45 inline-block">◆</span>
          <div className="w-8 h-px bg-amber-400" />
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}