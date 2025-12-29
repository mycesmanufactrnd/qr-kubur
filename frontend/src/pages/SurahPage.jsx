import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronUp, Play, Pause, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SURAH_CONTENT = {
  fatihah: {
    title: 'Surah Al-Fatihah',
    arabic: `بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ

ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ
ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
مَـٰلِكِ يَوْمِ ٱلدِّينِ
إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ
صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ`,
    rumi: `Bismillāhir-raḥmānir-raḥīm

Al-ḥamdu lillāhi rabbil-'ālamīn
Ar-raḥmānir-raḥīm
Māliki yawmid-dīn
Iyyāka na'budu wa iyyāka nasta'īn
Ihdinaṣ-ṣirāṭal-mustaqīm
Ṣirāṭal-ladhīna an'amta 'alayhim ghayril-maghḍūbi 'alayhim wa laḍ-ḍāllīn`,
    translation: `Dengan nama Allah, Yang Maha Pengasih, lagi Maha Penyayang.

Segala puji bagi Allah, Tuhan seluruh alam.
Yang Maha Pengasih, lagi Maha Penyayang.
Pemilik hari pembalasan.
Hanya kepada Engkau kami menyembah dan hanya kepada Engkau kami mohon pertolongan.
Tunjukilah kami jalan yang lurus.
Iaitu jalan orang-orang yang telah Engkau beri nikmat kepada mereka; bukan jalan mereka yang dimurkai, dan bukan pula jalan mereka yang sesat.`
  },
  doa_ziarah: {
    title: 'Doa Ziarah Kubur',
    arabic: `اَلسَّلاَمُ عَلَيْكُمْ يَا أَهْلَ الْقُبُوْرِ، يَغْفِرُ اللهُ لَنَا وَلَكُمْ، أَنْتُمْ سَلَفُنَا وَنَحْنُ بِاْلأَثَرِ

اَللّٰهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ وَعَافِهِمْ وَاعْفُ عَنْهُمْ`,
    rumi: `Assalāmu 'alaikum yā ahlal-qubūr, yaghfirullāhu lanā wa lakum, antum salafunā wa naḥnu bil-athar

Allāhummaghfir lahum warḥamhum wa 'āfihim wa'fu 'anhum`,
    translation: `Salam sejahtera ke atas kamu wahai penghuni kubur. Semoga Allah mengampuni kami dan kamu. Kamu adalah pendahulu kami dan kami akan menyusul.

Ya Allah, ampunkanlah mereka, rahmatilah mereka, sejahterakanlah mereka, dan maafkanlah mereka.`
  },
  doa_arwah: {
    title: 'Doa Untuk Arwah',
    arabic: `اَللّٰهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ وَأَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ`,
    rumi: `Allāhummaghfir lahū warḥamhu wa 'āfihi wa'fu 'anhu wa akrim nuzulahū wa wassi' mudkhalahū waghsilhu bil-mā'i waṯ-ṯalji wal-barad wa naqqihi minal-khaṭāyā kamā naqqaytat-ṯawbal-abyaḍa minad-danas wa abdilhu dāran khayran min dārihī wa ahlan khayran min ahlihī wa zawjan khayran min zawjihī wa adkhilhul-jannah wa a'iżhu min 'ażābil-qabri wa min 'ażābin-nār`,
    translation: `Ya Allah, ampunilah dia, rahmatilah dia, sejahterakanlah dia, maafkanlah dia, muliakanlah tempatnya, lapangkanlah kuburnya, mandikanlah dia dengan air, salji dan embun, bersihkanlah dia dari segala dosa sebagaimana Engkau membersihkan pakaian putih dari kotoran, gantikanlah rumahnya dengan rumah yang lebih baik, ahlinya dengan ahli yang lebih baik, pasangannya dengan pasangan yang lebih baik, masukkanlah dia ke dalam syurga dan lindungilah dia dari azab kubur dan azab neraka.`
  },
  tahlil_ringkas: {
    title: 'Tahlil Ringkas',
    arabic: `بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ

اَلْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِيْنَ حَمْدًا يُّوَافِى نِعَمَهُ وَيُكَافِئُ مَزِيْدَهُ

اَللّٰهُمَّ صَلِّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِيْنَ

لَا اِلٰهَ اِلَّا اللهُ (100x)

سُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا اِلٰهَ اِلَّا اللهُ وَاللهُ اَكْبَرُ`,
    rumi: `Bismillāhir-raḥmānir-raḥīm

Alḥamdu lillāhi rabbil-'ālamīn ḥamdan yuwāfī ni'amahu wa yukāfi'u mazīdah

Allāhumma ṣalli wa sallim 'alā sayyidinā Muḥammadin wa 'alā ālihī wa ṣaḥbihī ajma'īn

Lā ilāha illallāh (100x)

Subḥānallāhi walḥamdu lillāhi wa lā ilāha illallāhu wallāhu akbar`,
    translation: `Dengan nama Allah, Yang Maha Pengasih, lagi Maha Penyayang.

Segala puji bagi Allah Tuhan sekelian alam, pujian yang menyamai nikmat-Nya dan membalas tambahan-Nya.

Ya Allah, cucurilah rahmat dan salam ke atas junjungan kami Nabi Muhammad dan ke atas keluarga serta sahabatnya.

Tiada tuhan melainkan Allah (100x)

Maha Suci Allah, segala puji bagi Allah, tiada tuhan melainkan Allah, dan Allah Maha Besar.`
  }
};

export default function SurahPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fatihah');
  const [expandedSections, setExpandedSections] = useState(['arabic']);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const currentContent = SURAH_CONTENT[activeTab];
  
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-2">
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Surah & Doa</h1>
      </div>

      {/* Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="fatihah" className="text-xs md:text-sm py-3">Al-Fatihah</TabsTrigger>
          <TabsTrigger value="doa_ziarah" className="text-xs md:text-sm py-3">Doa Ziarah</TabsTrigger>
          <TabsTrigger value="doa_arwah" className="text-xs md:text-sm py-3">Doa Arwah</TabsTrigger>
          <TabsTrigger value="tahlil_ringkas" className="text-xs md:text-sm py-3">Tahlil Ringkas</TabsTrigger>
        </TabsList>

        {Object.keys(SURAH_CONTENT).map(key => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-t-lg">
                <CardTitle className="text-center text-xl">
                  {SURAH_CONTENT[key].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Arabic Section */}
                <Collapsible 
                  open={expandedSections.includes('arabic')}
                  onOpenChange={() => toggleSection('arabic')}
                >
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b">
                    <span className="font-semibold text-gray-900">Arab</span>
                    {expandedSections.includes('arabic') ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 bg-amber-50">
                      <p className="text-2xl md:text-3xl leading-loose text-right font-arabic text-gray-800 whitespace-pre-wrap" style={{ fontFamily: 'Amiri, serif' }}>
                        {SURAH_CONTENT[key].arabic}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Rumi Section */}
                <Collapsible 
                  open={expandedSections.includes('rumi')}
                  onOpenChange={() => toggleSection('rumi')}
                >
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b">
                    <span className="font-semibold text-gray-900">Rumi</span>
                    {expandedSections.includes('rumi') ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 bg-blue-50">
                      <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap italic">
                        {SURAH_CONTENT[key].rumi}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Translation Section */}
                <Collapsible 
                  open={expandedSections.includes('translation')}
                  onOpenChange={() => toggleSection('translation')}
                >
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-gray-900">Terjemahan</span>
                    {expandedSections.includes('translation') ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 bg-emerald-50">
                      <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {SURAH_CONTENT[key].translation}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Toggle */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={expandedSections.includes('arabic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSection('arabic')}
              className={expandedSections.includes('arabic') ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              Arab
            </Button>
            <Button
              variant={expandedSections.includes('rumi') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSection('rumi')}
              className={expandedSections.includes('rumi') ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Rumi
            </Button>
            <Button
              variant={expandedSections.includes('translation') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSection('translation')}
              className={expandedSections.includes('translation') ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Terjemahan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-0 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Panduan:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Baca dengan penuh khusyuk dan ikhlas</li>
            <li>• Hadapkan pahala bacaan kepada arwah yang dikehendaki</li>
            <li>• Boleh dibaca semasa atau selepas menziarahi kubur</li>
            <li>• Disunnahkan membaca Al-Fatihah dan Surah Yasin</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}