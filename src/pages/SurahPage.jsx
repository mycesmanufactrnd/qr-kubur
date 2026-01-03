import React, { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import { getCurrentLanguage } from "@/utils/translations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SURAH_DATA, SURAH_LIST, RECITERS } from "@/utils/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SurahPage() {
  const [surahId, setSurahId] = useState(36);
  const [reciterId, setReciterId] = useState(1);

  const surah = SURAH_DATA[surahId];
  const surahAudio = surah?.audio?.[reciterId];

  let lang = (getCurrentLanguage() === "ms" ? "en" : getCurrentLanguage());

  const surahQuery = trpc.surah.getSurah.useQuery({ surahId, lang });

  useEffect(() => {
    if (!SURAH_DATA[surahId]?.audio?.[reciterId]) {
      setReciterId(36);
    }
  }, [surahId]);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <header className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Bacaan Surah & Tahlil</h1>
        <p className="text-gray-600">Untuk arwah yang telah meninggal dunia</p>
      </header>
      <Card className="shadow-sm">
        <CardContent className="space-y-4">
          <h3 className="mt-2 text-center font-semibold text-gray-800">
            Pilih Qari
          </h3>
          <div className="mt-4 flex justify-center">
            <Select
              value={String(reciterId)}
              onValueChange={(val) => setReciterId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Qari" />
              </SelectTrigger>

              <SelectContent>
                {RECITERS.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.reciter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {surahAudio && (
            <div className="w-full max-w-md mx-auto">
              <audio
                key={`${surahId}-${reciterId}`}
                controls
                controlsList="nodownload noplaybackrate"
                preload="metadata"
                className="w-full h-8 sm:h-auto"
              >
                <source src={surahAudio.url} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="space-y-4">
          <div className="mt-4 flex justify-center">
            <Select
              value={String(surahId)}
              onValueChange={(val) => setSurahId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Surah" />
              </SelectTrigger>

              <SelectContent>
                {SURAH_LIST.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {surahQuery.isLoading && <p className="text-center text-gray-500">Memuatkan surah...</p>}
          {surahQuery.data && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold">{surahQuery.data.transliteration}</h2>
              </div>

              <div className="space-y-4">
                {surahQuery.data.verses.map((v) => (
                  <div key={v.id} className="space-y-1">
                    <p className="text-right text-2xl leading-relaxed font-sans" dir="rtl">
                      {v.text}
                    </p>
                    <p className="text-gray-700">{v.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {surahQuery.isError && (
            <p className="text-center text-red-500">Gagal memuatkan surah. Sila cuba lagi.</p>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-gray-500 text-sm">
        Semoga bacaan ini sampai pahalanya kepada arwah 🤲
      </footer>
    </div>
  );
}
