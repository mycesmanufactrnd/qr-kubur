// @ts-nocheck
import { useNavigate, useLocation } from "react-router-dom";
import { Pause, Play, X, Music2 } from "lucide-react";

import { useAudioPlayer } from "@/providers/AudioPlayerProvider";
import { createPageUrl } from "@/utils";

export default function AudioMiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { track, isPlaying, currentTime, duration, togglePlay, stop } =
    useAudioPlayer();

  if (!track) return null;
  if (location.pathname === createPageUrl("SurahPage")) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-[1001] px-3 lg:px-0 lg:flex lg:justify-center pointer-events-none">
      <div
        className="
          pointer-events-auto
          max-w-md
          w-full
          mx-auto
          bg-white
          dark:bg-slate-800
          border
          border-slate-200
          dark:border-slate-700
          rounded-2xl
          shadow-lg
          overflow-hidden
        "
      >
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => navigate(createPageUrl("SurahPage"))}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {track.title}
              </p>
              {track.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {track.subtitle}
                </p>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={stop}
            className="w-8 h-8 shrink-0 rounded-full text-slate-400 dark:text-slate-500 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
