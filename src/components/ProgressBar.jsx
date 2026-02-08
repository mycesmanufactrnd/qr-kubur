import React from 'react';
import { cn } from "@/lib/utils";

export default function ProgressBar({ percentage, showLabel = true, size = 'default' }) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100);
  
  const heights = {
    sm: 'h-1.5',
    default: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs font-semibold text-slate-700">{safePercentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", heights[size])}>
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}