import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { getCurrentLanguage, translate } from "@/utils/translations";
import { Card, CardContent } from "@/components/ui/card";
import { SURAH_DATA, SURAH_LIST, RECITERS } from "@/utils/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackNavigation from "@/components/BackNavigation";


export default function SurahPage() {
  const TahlilPdf = "/Tahlil.pdf";
  const DoaTahlilPdf = "/DoaTahlil.pdf";
  
  const [surahId, setSurahId] = useState(36);
  const [reciterId, setReciterId] = useState(1);

  const surah = SURAH_DATA[surahId];
  const surahAudio = surah?.audio?.[reciterId];

  let lang = getCurrentLanguage() === "ms" ? "en" : getCurrentLanguage();
  const surahQuery = trpc.surah.getSurah.useQuery({ surahId, lang });

  useEffect(() => {
    if (!SURAH_DATA[surahId]?.audio?.[reciterId]) {
      setReciterId(1);
    }
  }, [surahId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title={translate('Surah & Prayer')} />
      <Tabs defaultValue="surah" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tahlil">{translate('Tahlil')}</TabsTrigger>
          <TabsTrigger value="surah">{translate('Surah')}</TabsTrigger>
          <TabsTrigger value="doa">{translate('Doa')}</TabsTrigger>
        </TabsList>
        <TabsContent value="surah" className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-center font-semibold mt-2">{translate('Select Qari')}</h3>

              <div className="flex justify-center">
                <Select
                  value={String(reciterId)}
                  onValueChange={(v) => setReciterId(Number(v))}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder={translate('Select Qari')} />
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
                <audio
                  key={`${surahId}-${reciterId}`}
                  controls playsInline
                  preload="metadata"
                  className="w-full h-8"
                >
                  <source src={surahAudio.url} type="audio/mpeg" />
                </audio>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex justify-center mt-4">
                <Select
                  value={String(surahId)}
                  onValueChange={(v) => setSurahId(Number(v))}
                >
                  <SelectTrigger>
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
              </div>

              {surahQuery.data && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">{surahQuery.data.transliteration}</h2>
                  </div>

                  {surahQuery.data.verses.map((v) => (
                    <div key={v.id}>
                      <p dir="rtl" className="text-right text-2xl">
                        {v.text}
                      </p>
                      <p className="text-gray-700">{v.translation}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doa">
          <Card>
            <CardContent className="p-0">
              <iframe
                src={`${DoaTahlilPdf}#toolbar=0&navpanes=0`}
                className="w-full h-[80vh]"
                title="Tahlil PDF"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tahlil">
          <Card>
            <CardContent className="p-0">
              <iframe
                src={`${TahlilPdf}#toolbar=0&navpanes=0`}
                className="w-full h-[80vh]"
                title="Tahlil PDF"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-gray-500 text-sm">
        {translate('May the reward of this recitation reach the deceased')} 🤲
      </footer>
    </div>
  );
}
