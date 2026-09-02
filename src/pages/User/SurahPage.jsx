// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Pause, Play } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { getCurrentLanguage, translate } from "@/utils/translations";
import { SURAH_DATA, SURAH_LIST, RECITERS } from "@/utils/enums";
import { useAudioPlayer } from "@/providers/AudioPlayerProvider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import BackNavigation from "@/components/BackNavigation";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const TABS = [
  { value: "tahlil", label: "Tahlil" },
  { value: "doa", label: "Doa Tahlil" },
  { value: "talqin", label: "Talqin" },
  { value: "surah", label: "Surah" },
];

// Bundled PDFs
const PDF_FILES = {
  tahlil: "/Tahlil.pdf",
  doa: "/DoaTahlil.pdf",
  talqin: "/Talqin.pdf",
};

function Section({ title, accent = "emerald", children }) {
  const colors = {
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-500",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p
            className={`text-[11px] font-semibold uppercase tracking-widest ${colors[accent]}`}
          >
            {title}
          </p>
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * PDF.js viewer
 *
 * No iframe.
 * No Google Docs Viewer.
 * No browser PDF toolbar.
 */
function PDFViewer({ src, title }) {
  const containerRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(350);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;

      setWidth(Math.min(containerWidth - 24, 700));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setNumPages(0);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="
        relative
        w-full
        h-[78vh]
        overflow-y-auto
        overflow-x-hidden
        bg-slate-100
        dark:bg-slate-900
        overscroll-contain
      "
    >
      {/* Loading */}
      {!loaded && !error && (
        <div
          className="
          absolute
          inset-0
          z-10
          flex
          flex-col
          items-center
          justify-center
          gap-3
          bg-white
          dark:bg-slate-800
        "
        >
          <div
            className="
            h-10
            w-10
            animate-spin
            rounded-full
            border-4
            border-emerald-500
            border-t-transparent
          "
          />

          <p
            className="
            text-xs
            text-slate-400
            dark:text-slate-500
          "
          >
            {translate("Loading...")}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="
          absolute
          inset-0
          z-10
          flex
          items-center
          justify-center
          p-6
          bg-white
          dark:bg-slate-800
        "
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {translate("Unable to load PDF.")}
          </p>
        </div>
      )}

      {/* PDF */}
      <Document
        file={src}
        loading={null}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoaded(true);
        }}
        onLoadError={(error) => {
          console.error(`PDF loading error: ${title}`, error);
          setError(true);
        }}
      >
        <div className="flex flex-col items-center py-3">
          {Array.from({ length: numPages }, (_, index) => (
            <div key={`page_${index + 1}`} className="mb-3 shadow-md">
              <Page
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}

export default function SurahPage() {
  const [activeTab, setActiveTab] = useState("tahlil");
  const [surahId, setSurahId] = useState(36);
  const [reciterId, setReciterId] = useState(1);

  const { track, isPlaying, currentTime, duration, playTrack, togglePlay } =
    useAudioPlayer();

  const surah = SURAH_DATA[surahId];
  const surahAudio = surah?.audio?.[reciterId];
  const surahLabel =
    SURAH_LIST.find((s) => s.id === surahId)?.label || `Surah ${surahId}`;

  const trackId = `${surahId}-${reciterId}`;
  const isCurrentTrack = track?.id === trackId;
  const isCurrentTrackPlaying = isCurrentTrack && isPlaying;
  const progress =
    isCurrentTrack && duration > 0 ? (currentTime / duration) * 100 : 0;

  let lang = getCurrentLanguage() === "ms" ? "en" : getCurrentLanguage();

  const surahQuery = trpc.surah.getSurah.useQuery({
    surahId,
    lang,
  });

  useEffect(() => {
    if (!SURAH_DATA[surahId]?.audio?.[reciterId]) {
      setReciterId(1);
    }
  }, [surahId]);

  const handlePlayPause = () => {
    if (!surahAudio) return;
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack({
        id: trackId,
        title: surahLabel,
        subtitle: surahAudio.reciter,
        url: surahAudio.url,
      });
    }
  };

  return (
    <div className="min-h-screen pb-10 bg-slate-50 dark:bg-slate-900">
      <BackNavigation title={translate("Surah, Doa & Tahlil")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        {/* TABS */}
        <div
          className="
          bg-white
          dark:bg-slate-800
          rounded-2xl
          shadow-sm
          border
          border-slate-100
          dark:border-slate-700
          p-1.5
          flex
          gap-1
        "
        >
          {TABS.map(({ value, label }) => {
            const isActive = activeTab === value;

            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`
                  flex-1
                  flex
                  items-center
                  justify-center
                  py-2.5
                  rounded-xl
                  text-xs
                  font-semibold
                  transition-all
                  ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }
                `}
              >
                {translate(label)}
              </button>
            );
          })}
        </div>

        {/* SURAH */}
        {activeTab === "surah" && (
          <div className="space-y-4">
            <Section title={translate("Select Qari")} accent="emerald">
              <div className="space-y-3">
                <Select
                  value={String(reciterId)}
                  onValueChange={(v) => setReciterId(Number(v))}
                >
                  <SelectTrigger
                    className="
                    h-11
                    rounded-xl
                    border-slate-200
                    dark:border-slate-600
                    bg-slate-50
                    dark:bg-slate-700
                    dark:text-slate-200
                    text-sm
                  "
                  >
                    <SelectValue placeholder={translate("Select Qari")} />
                  </SelectTrigger>

                  <SelectContent>
                    {RECITERS.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.reciter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {surahAudio && (
                  <div
                    className="
                    bg-slate-50
                    dark:bg-slate-700
                    rounded-xl
                    border
                    border-slate-100
                    dark:border-slate-600
                    p-3
                    space-y-2
                  "
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePlayPause}
                        className="w-11 h-11 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                      >
                        {isCurrentTrackPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {surahLabel}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {surahAudio.reciter}
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {translate(
                        "Playback continues in the background and when you switch pages.",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Section>

            <Section title={translate("Surah")} accent="emerald">
              <div className="space-y-4">
                <Select
                  value={String(surahId)}
                  onValueChange={(v) => setSurahId(Number(v))}
                >
                  <SelectTrigger
                    className="
                    h-11
                    rounded-xl
                    border-slate-200
                    dark:border-slate-600
                    bg-slate-50
                    dark:bg-slate-700
                    dark:text-slate-200
                    text-sm
                  "
                  >
                    <SelectValue placeholder="Pilih Surah" />
                  </SelectTrigger>

                  <SelectContent>
                    {SURAH_LIST.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {surahQuery.data && (
                  <div className="space-y-1">
                    <h2
                      className="
                      text-center
                      text-base
                      font-bold
                      text-slate-800
                      dark:text-slate-200
                      pb-2
                      border-b
                      border-slate-100
                      dark:border-slate-700
                    "
                    >
                      {surahQuery.data.transliteration}
                    </h2>

                    <div className="space-y-5 pt-3">
                      {surahQuery.data.verses.map((v, idx) => (
                        <div key={v.id} className="space-y-2">
                          <div className="flex justify-end">
                            <span
                              className="
                                w-6
                                h-6
                                flex
                                items-center
                                justify-center
                                rounded-full
                                bg-emerald-50
                                dark:bg-emerald-900/20
                                border
                                border-emerald-100
                                dark:border-emerald-800
                                text-[10px]
                                font-bold
                                text-emerald-600
                                dark:text-emerald-400
                              "
                            >
                              {idx + 1}
                            </span>
                          </div>

                          <p
                            dir="rtl"
                            className="
                                text-right
                                text-2xl
                                leading-loose
                                text-slate-800
                                dark:text-slate-100
                                font-arabic
                              "
                          >
                            {v.text}
                          </p>

                          <p
                            className="
                              text-sm
                              text-slate-500
                              dark:text-slate-400
                              leading-relaxed
                            "
                          >
                            {v.translation}
                          </p>

                          {idx < surahQuery.data.verses.length - 1 && (
                            <div
                              className="
                                h-px
                                bg-slate-100
                                dark:bg-slate-700
                                mt-3
                              "
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* DOA TAHLIL */}
        {activeTab === "doa" && (
          <div
            className="
            bg-white
            dark:bg-slate-800
            rounded-2xl
            shadow-sm
            border
            border-slate-100
            dark:border-slate-700
            overflow-hidden
          "
          >
            <div
              className="
              px-4
              py-3
              border-b
              border-slate-100
              dark:border-slate-700
            "
            >
              <p
                className="
                text-[11px]
                font-semibold
                uppercase
                tracking-widest
                text-emerald-600
              "
              >
                {translate("Doa Tahlil")}
              </p>
            </div>

            <PDFViewer src={PDF_FILES.doa} title="Doa Tahlil PDF" />
          </div>
        )}

        {/* TAHLIL */}
        {activeTab === "tahlil" && (
          <div
            className="
            bg-white
            dark:bg-slate-800
            rounded-2xl
            shadow-sm
            border
            border-slate-100
            dark:border-slate-700
            overflow-hidden
          "
          >
            <div
              className="
              px-4
              py-3
              border-b
              border-slate-100
              dark:border-slate-700
            "
            >
              <p
                className="
                text-[11px]
                font-semibold
                uppercase
                tracking-widest
                text-emerald-600
              "
              >
                {translate("Tahlil")}
              </p>
            </div>

            <PDFViewer src={PDF_FILES.tahlil} title="Tahlil PDF" />
          </div>
        )}

        {/* TALQIN */}
        {activeTab === "talqin" && (
          <div
            className="
            bg-white
            dark:bg-slate-800
            rounded-2xl
            shadow-sm
            border
            border-slate-100
            dark:border-slate-700
            overflow-hidden
          "
          >
            <div
              className="
              px-4
              py-3
              border-b
              border-slate-100
              dark:border-slate-700
            "
            >
              <p
                className="
                text-[11px]
                font-semibold
                uppercase
                tracking-widest
                text-emerald-600
              "
              >
                {translate("Talqin")}
              </p>
            </div>

            <PDFViewer src={PDF_FILES.talqin} title="Talqin PDF" />
          </div>
        )}

        {/* FOOTER */}
        <p
          className="
          text-center
          text-slate-400
          dark:text-slate-500
          text-xs
          pb-2
        "
        >
          {translate("May the reward of this recitation reach the deceased")} 🤲
        </p>
      </div>
    </div>
  );
}
