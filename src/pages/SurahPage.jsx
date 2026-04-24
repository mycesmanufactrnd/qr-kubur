import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { getCurrentLanguage, translate } from "@/utils/translations";
import { SURAH_DATA, SURAH_LIST, RECITERS } from "@/utils/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackNavigation from "@/components/BackNavigation";

const TABS = [
  { value: "tahlil", label: "Tahlil" },
  { value: "doa", label: "Doa Tahlil" },
  { value: "talqin", label: "Talqin" },
  { value: "surah", label: "Surah" },
];

function Section({ title, accent = "emerald", children }) {
  const colors = {
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-500",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${colors[accent]}`}>{title}</p>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function SurahPage() {
  const TahlilPdf = "/Tahlil.pdf";
  const TalqinPdf = "/Talqin.pdf";
  const DoaTahlilPdf = "/DoaTahlil.pdf";

  const [activeTab, setActiveTab] = useState("tahlil");
  const [surahId, setSurahId] = useState(36);
  const [reciterId, setReciterId] = useState(1);

  const surah = SURAH_DATA[surahId];
  const surahAudio = surah?.audio?.[reciterId];

  let lang = getCurrentLanguage() === "ms" ? "en" : getCurrentLanguage();
  const surahQuery = trpc.surah.getSurah.useQuery({ surahId, lang });

  useEffect(() => {
    if (!SURAH_DATA[surahId]?.audio?.[reciterId]) setReciterId(1);
  }, [surahId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <BackNavigation title={translate("Surah, Doa & Tahlil")} />

      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 flex gap-1">
          {TABS.map(({ value, label }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {translate(label)}
              </button>
            );
          })}
        </div>

        {activeTab === "surah" && (
          <div className="space-y-4">

            <Section title={translate("Select Qari")} accent="emerald">
              <div className="space-y-3">
                <Select value={String(reciterId)} onValueChange={(v) => setReciterId(Number(v))}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm">
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
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                    <audio
                      key={`${surahId}-${reciterId}`}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full"
                    >
                      <source src={surahAudio.url} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
              </div>
            </Section>

            <Section title={translate("Surah")} accent="emerald">
              <div className="space-y-4">
                <Select value={String(surahId)} onValueChange={(v) => setSurahId(Number(v))}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm">
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
                    <h2 className="text-center text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
                      {surahQuery.data.transliteration}
                    </h2>

                    <div className="space-y-5 pt-3">
                      {surahQuery.data.verses.map((v, idx) => (
                        <div key={v.id} className="space-y-2">
                          {/* Verse number chip */}
                          <div className="flex justify-end">
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">
                              {idx + 1}
                            </span>
                          </div>
                          <p dir="rtl" className="text-right text-2xl leading-loose text-slate-800 font-arabic">
                            {v.text}
                          </p>
                          <p className="text-sm text-slate-500 leading-relaxed">{v.translation}</p>
                          {idx < surahQuery.data.verses.length - 1 && (
                            <div className="h-px bg-slate-100 mt-3" />
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

        {activeTab === "doa" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate("Doa")}</p>
            </div>
            <iframe
              src={`${DoaTahlilPdf}#toolbar=0&navpanes=0`}
              className="w-full h-[78vh]"
              title="Doa Tahlil PDF"
            />
          </div>
        )}

        {activeTab === "tahlil" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate("Tahlil")}</p>
            </div>
            <iframe
              src={`${TahlilPdf}#toolbar=0&navpanes=0`}
              className="w-full h-[78vh]"
              title="Tahlil PDF"
            />
          </div>
        )}
        
        {activeTab === "talqin" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{translate("Talqin")}</p>
            </div>
            <iframe
              src={`${TalqinPdf}#toolbar=0&navpanes=0`}
              className="w-full h-[78vh]"
              title="Tahlil PDF"
            />
          </div>
        )}

        <p className="text-center text-slate-400 text-xs pb-2">
          {translate("May the reward of this recitation reach the deceased")} 🤲
        </p>
      </div>
    </div>
  );
}