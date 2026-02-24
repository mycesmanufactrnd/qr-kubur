import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";

const translations = {
  en: {
    title: 'Rukun Islam & Iman',
    subtitle: 'Pillars of Islam & Articles of Faith',
    islamTitle: '5 Pillars of Islam',
    imanTitle: '6 Articles of Faith',
    pillars: [
      { name: 'Shahadah', icon: '☪️', short: 'Declaration of Faith', full: 'The Shahadah is the Muslim declaration of belief in the oneness of God and acceptance of Muhammad as His prophet. It states: "There is no god but Allah, and Muhammad is the Messenger of Allah." This is the foundation of Islamic faith and must be recited with sincere belief.' },
      { name: 'Salah', icon: '🤲', short: 'Prayer', full: 'Muslims are required to perform five daily prayers at prescribed times: Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (night). These prayers are a direct link between the worshipper and Allah, performed while facing the Kaaba in Mecca.' },
      { name: 'Zakat', icon: '💰', short: 'Charity', full: "Zakat is the obligatory giving of a portion of one's wealth (typically 2.5% annually) to those in need. It purifies wealth and helps redistribute resources to the less fortunate, fostering social responsibility and economic justice in the Muslim community." },
      { name: 'Sawm', icon: '🌙', short: 'Fasting', full: 'During the holy month of Ramadan, Muslims fast from dawn until sunset, abstaining from food, drink, and other physical needs. Fasting teaches self-discipline, spiritual reflection, and empathy for those who are less fortunate.' },
      { name: 'Hajj', icon: '🕋', short: 'Pilgrimage', full: 'The Hajj is the annual Islamic pilgrimage to Mecca, Saudi Arabia, that every able-bodied Muslim who can afford it must undertake at least once in their lifetime. It occurs during the Islamic month of Dhul-Hijjah.' }
    ],
    articles: [
      { name: 'Belief in Allah', icon: '☪️', short: 'One God', full: 'Muslims believe in one God (Allah) who is the Creator, Sustainer, and Master of the universe. He is unique, has no partners or equals, and possesses all perfect attributes.' },
      { name: 'Belief in Angels', icon: '👼', short: 'Divine Messengers', full: 'Angels are spiritual beings created by Allah from light. They have no free will and exist only to serve and worship Allah.' },
      { name: 'Belief in Books', icon: '📖', short: 'Divine Scriptures', full: 'Muslims believe that Allah revealed divine books to guide humanity, including the Torah, Psalms, Gospel, and the Quran as the final revelation.' },
      { name: 'Belief in Prophets', icon: '🕊️', short: 'Messengers of God', full: 'Allah sent prophets throughout history to guide humanity. Prophet Muhammad is the final messenger for all of humanity until the Day of Judgment.' },
      { name: 'Belief in Day of Judgment', icon: '⚖️', short: 'Accountability', full: 'Muslims believe in life after death and a Day of Judgment when all humans will be held accountable for their actions.' },
      { name: 'Belief in Qadar', icon: '✨', short: 'Divine Decree', full: "Qadar refers to divine predestination and Allah's knowledge of all things. Muslims believe in accepting Allah's decree with patience and trust." }
    ]
  },
  ms: {
    title: 'Rukun Islam & Iman',
    subtitle: 'Pillars of Islam & Articles of Faith',
    islamTitle: '5 Rukun Islam',
    imanTitle: '6 Rukun Iman',
    pillars: [
      { name: 'Syahadah', icon: '☪️', short: 'Pengakuan Iman', full: 'Syahadah ialah pengakuan Muslim tentang kepercayaan kepada keesaan Allah dan penerimaan Muhammad sebagai Nabi-Nya.' },
      { name: 'Solat', icon: '🤲', short: 'Sembahyang', full: 'Umat Islam dikehendaki menunaikan lima solat wajib pada waktu yang ditetapkan: Subuh, Zohor, Asar, Maghrib, dan Isyak.' },
      { name: 'Zakat', icon: '💰', short: 'Sedekah Wajib', full: 'Zakat adalah pemberian wajib sebahagian daripada harta seseorang kepada mereka yang memerlukan.' },
      { name: 'Puasa', icon: '🌙', short: 'Berpuasa', full: 'Semasa bulan suci Ramadan, umat Islam berpuasa dari subuh hingga matahari terbenam.' },
      { name: 'Haji', icon: '🕋', short: 'Mengerjakan Haji', full: 'Haji adalah ibadah haji Islam tahunan ke Mekah yang mesti dilakukan oleh setiap Muslim yang mampu.' }
    ],
    articles: [
      { name: 'Iman kepada Allah', icon: '☪️', short: 'Tuhan Yang Esa', full: 'Umat Islam percaya kepada satu Tuhan (Allah) yang merupakan Pencipta, Pemelihara, dan Penguasa alam semesta.' },
      { name: 'Iman kepada Malaikat', icon: '👼', short: 'Utusan Ilahi', full: 'Malaikat adalah makhluk rohani yang diciptakan oleh Allah dari cahaya untuk melayani dan menyembah Allah.' },
      { name: 'Iman kepada Kitab-Kitab', icon: '📖', short: 'Kitab Suci', full: 'Umat Islam percaya bahawa Allah menurunkan kitab-kitab suci termasuk Taurat, Zabur, Injil, dan Al-Quran sebagai wahyu terakhir.' },
      { name: 'Iman kepada Rasul-Rasul', icon: '🕊️', short: 'Utusan Allah', full: 'Allah menghantar nabi-nabi untuk membimbing manusia. Nabi Muhammad adalah rasul terakhir untuk seluruh umat manusia.' },
      { name: 'Iman kepada Hari Akhirat', icon: '⚖️', short: 'Hari Pembalasan', full: 'Umat Islam percaya pada kehidupan selepas mati dan Hari Kiamat apabila semua manusia akan dipertanggungjawabkan.' },
      { name: 'Iman kepada Qada dan Qadar', icon: '✨', short: 'Takdir', full: 'Qada dan Qadar merujuk kepada takdir ilahi dan pengetahuan Allah. Umat Islam percaya untuk menerima takdir Allah dengan sabar.' }
    ]
  }
};

function PillarCard({ pillar, index, accent = 'emerald' }) {
  const [expanded, setExpanded] = useState(false);

  const accents = {
    emerald: { num: 'text-emerald-600 bg-emerald-50 border-emerald-100', name: 'text-slate-800', expand: 'bg-emerald-50 text-emerald-600' },
    teal:    { num: 'text-teal-600    bg-teal-50    border-teal-100',    name: 'text-slate-800', expand: 'bg-teal-50    text-teal-600'    },
  };
  const a = accents[accent] || accents.emerald;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold ${a.num}`}>
          {index}
        </div>

        <span className="text-2xl leading-none shrink-0">{pillar.icon}</span>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${a.name}`}>{pillar.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{pillar.short}</p>
        </div>

        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${a.expand} ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 pb-4">
          <div className="h-px bg-slate-100 mb-3" />
          <p className="text-sm text-slate-600 leading-relaxed">{pillar.full}</p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ emoji, title }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <span className="text-xl leading-none">{emoji}</span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
    </div>
  );
}

export default function RukunIslam() {
  const language = localStorage.getItem('language') || 'ms';
  const t = translations[language];

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate('Rukun Islam')} />

      <div className="flex flex-col items-center text-center gap-2 px-4 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-1">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-base font-bold text-slate-800">{t.title}</h2>
        <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">{t.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6">

        <div>
          <SectionLabel emoji="🕌" title={t.islamTitle} />
          <div className="space-y-3">
            {t.pillars.map((pillar, i) => (
              <PillarCard key={i} pillar={pillar} index={i + 1} accent="emerald" />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel emoji="✨" title={t.imanTitle} />
          <div className="space-y-3">
            {t.articles.map((article, i) => (
              <PillarCard key={i} pillar={article} index={i + 1} accent="teal" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}