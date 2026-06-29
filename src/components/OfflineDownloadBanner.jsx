// @ts-nocheck
import { Download, AlertCircle, WifiOff } from "lucide-react";
import { translate } from "@/utils/translations";

export function OfflineDownloadBanner({ status, progress = 0, onDownload, idleLabel }) {
  if (status === "checking") return null;

  if (status === "cached") return null;

  if (status === "downloading") {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
          <span className="text-xs text-blue-700 dark:text-blue-400">
            {translate("Downloading")}... {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-between gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600 dark:text-red-400 truncate">
            {translate("Download failed")}
          </span>
        </div>
        <button
          onClick={onDownload}
          className="text-xs font-semibold text-red-600 dark:text-red-400 underline flex-shrink-0"
        >
          {translate("Retry")}
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <WifiOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {idleLabel ?? translate("Save for offline use?")}
        </span>
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex-shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        {translate("Download")}
      </button>
    </div>
  );
}
