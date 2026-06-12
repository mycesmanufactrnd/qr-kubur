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
      className={`flex flex-col items-center justify-center py-20 px-8 text-center transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        </div>
      )}

      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
        {title}
      </p>

      {description && (
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-2 max-w-[200px] leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-6">
        {[4, 16, 4].map((w, i) => (
          <span
            key={i}
            className="h-1 rounded-full bg-slate-200 dark:bg-slate-700"
            style={{ width: w }}
          />
        ))}
      </div>
    </div>
  );
}
