import { translate } from "@/utils/translations";

export default function PageLoadingComponent() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-emerald-50/95 dark:bg-slate-900/95 backdrop-blur-sm pointer-events-auto">
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Spinning ring around the logo */}
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/40 border-t-emerald-500 animate-spin" />

        <img
          src="/Logo-No_Background.png"
          alt="QubuR"
          className="relative z-10 w-20 h-20 object-contain animate-[pulse_2s_ease-in-out_infinite] drop-shadow-md"
        />
      </div>

      <p className="text-xs font-semibold tracking-[0.3em] uppercase text-emerald-700/70 dark:text-emerald-400/70">
        {translate("Loading...")}
        <span className="animate-[blink_1s_step-end_infinite] text-emerald-500">
          _
        </span>
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
