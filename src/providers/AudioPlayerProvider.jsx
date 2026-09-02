// @ts-nocheck
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [track, setTrack] = useState(null); // { id, title, subtitle, url }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
    audioRef.current.playsInline = true;
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const playTrack = useCallback((nextTrack) => {
    const audio = audioRef.current;
    if (!audio || !nextTrack) return;

    setTrack((prev) => {
      if (prev?.id !== nextTrack.id) {
        audio.src = nextTrack.url;
        audio.currentTime = 0;
      }
      return nextTrack;
    });

    audio.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [track]);

  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setTrack(null);
  }, []);

  // Media Session — lock screen / notification controls (Android WebView + browsers)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.subtitle || "",
        album: "QubuR",
        artwork: [
          { src: "/playstore.png", sizes: "512x512", type: "image/png" },
        ],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler("stop", () => stop());
  }, [track, stop]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  return (
    <AudioPlayerContext.Provider
      value={{
        track,
        isPlaying,
        currentTime,
        duration,
        playTrack,
        togglePlay,
        seekTo,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }
  return context;
}
