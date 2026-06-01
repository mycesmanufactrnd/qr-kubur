//@ts-nocheck
import { useEffect, useState } from "react";

export default function MobileEmptyList({ icon: Icon, title, description }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-8 text-center transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-3xl bg-slate-200 dark:bg-slate-700 blur-lg opacity-50 scale-110" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner border border-slate-200/60 dark:border-slate-600/40">
            <Icon className="w-9 h-9 text-slate-300 dark:text-slate-500" strokeWidth={1.5} />
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
        {title}
      </p>

      {description && (
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1.5 max-w-[220px] leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}
