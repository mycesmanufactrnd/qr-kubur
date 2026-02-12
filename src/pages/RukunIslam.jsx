import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";

const translations = {
  en: {
    title: 'Rukun Islam & Iman',
    subtitle: 'Pillars of Islam & Articles of Faith',
    islamTitle: '5 Pillars of Islam',
    imanTitle: '6 Articles of Faith',
    pillars: [
      {
        name: 'Shahadah',
        icon: '☪️',
        short: 'Declaration of Faith',
        full: 'The Shahadah is the Muslim declaration of belief in the oneness of God and acceptance of Muhammad as His prophet. It states: "There is no god but Allah, and Muhammad is the Messenger of Allah." This is the foundation of Islamic faith and must be recited with sincere belief.'
      },
      {
        name: 'Salah',
        icon: '🤲',
        short: 'Prayer',
        full: 'Muslims are required to perform five daily prayers at prescribed times: Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (night). These prayers are a direct link between the worshipper and Allah, performed while facing the Kaaba in Mecca.'
      },
      {
        name: 'Zakat',
        icon: '💰',
        short: 'Charity',
        full: 'Zakat is the obligatory giving of a portion of one\'s wealth (typically 2.5% annually) to those in need. It purifies wealth and helps redistribute resources to the less fortunate, fostering social responsibility and economic justice in the Muslim community.'
      },
      {
        name: 'Sawm',
        icon: '🌙',
        short: 'Fasting',
        full: 'During the holy month of Ramadan, Muslims fast from dawn until sunset, abstaining from food, drink, and other physical needs. Fasting teaches self-discipline, spiritual reflection, and empathy for those who are less fortunate. It is a time for increased devotion and prayer.'
      },
      {
        name: 'Hajj',
        icon: '🕋',
        short: 'Pilgrimage',
        full: 'The Hajj is the annual Islamic pilgrimage to Mecca, Saudi Arabia, that every able-bodied Muslim who can afford it must undertake at least once in their lifetime. It occurs during the Islamic month of Dhul-Hijjah and involves a series of rituals performed over several days.'
      }
    ],
    articles: [
      {
        name: 'Belief in Allah',
        icon: '☪️',
        short: 'One God',
        full: 'Muslims believe in one God (Allah) who is the Creator, Sustainer, and Master of the universe. He is unique, has no partners or equals, and possesses all perfect attributes.'
      },
      {
        name: 'Belief in Angels',
        icon: '👼',
        short: 'Divine Messengers',
        full: 'Angels are spiritual beings created by Allah from light. They have no free will and exist only to serve and worship Allah.'
      },
      {
        name: 'Belief in Books',
        icon: '📖',
        short: 'Divine Scriptures',
        full: 'Muslims believe that Allah revealed divine books to guide humanity, including the Torah, Psalms, Gospel, and the Quran as the final revelation.'
      },
      {
        name: 'Belief in Prophets',
        icon: '🕊️',
        short: 'Messengers of God',
        full: 'Allah sent prophets throughout history to guide humanity. Prophet Muhammad is the final messenger for all of humanity until the Day of Judgment.'
      },
      {
        name: 'Belief in Day of Judgment',
        icon: '⚖️',
        short: 'Accountability',
        full: 'Muslims believe in life after death and a Day of Judgment when all humans will be held accountable for their actions.'
      },
      {
        name: 'Belief in Qadar',
        icon: '✨',
        short: 'Divine Decree',
        full: 'Qadar refers to divine predestination and Allah\'s knowledge of all things. Muslims believe in accepting Allah\'s decree with patience and trust.'
      }
    ]
  },
  ms: {
    title: 'Rukun Islam & Iman',
    subtitle: 'Pillars of Islam & Articles of Faith',
    islamTitle: '5 Rukun Islam',
    imanTitle: '6 Rukun Iman',
    pillars: [
      {
        name: 'Syahadah',
        icon: '☪️',
        short: 'Pengakuan Iman',
        full: 'Syahadah ialah pengakuan Muslim tentang kepercayaan kepada keesaan Allah dan penerimaan Muhammad sebagai Nabi-Nya.'
      },
      {
        name: 'Solat',
        icon: '🤲',
        short: 'Sembahyang',
        full: 'Umat Islam dikehendaki menunaikan lima solat wajib pada waktu yang ditetapkan: Subuh, Zohor, Asar, Maghrib, dan Isyak.'
      },
      {
        name: 'Zakat',
        icon: '💰',
        short: 'Sedekah Wajib',
        full: 'Zakat adalah pemberian wajib sebahagian daripada harta seseorang kepada mereka yang memerlukan.'
      },
      {
        name: 'Puasa',
        icon: '🌙',
        short: 'Berpuasa',
        full: 'Semasa bulan suci Ramadan, umat Islam berpuasa dari subuh hingga matahari terbenam.'
      },
      {
        name: 'Haji',
        icon: '🕋',
        short: 'Mengerjakan Haji',
        full: 'Haji adalah ibadah haji Islam tahunan ke Mekah yang mesti dilakukan oleh setiap Muslim yang mampu.'
      }
    ],
    articles: [
      {
        name: 'Iman kepada Allah',
        icon: '☪️',
        short: 'Tuhan Yang Esa',
        full: 'Umat Islam percaya kepada satu Tuhan (Allah) yang merupakan Pencipta, Pemelihara, dan Penguasa alam semesta.'
      },
      {
        name: 'Iman kepada Malaikat',
        icon: '👼',
        short: 'Utusan Ilahi',
        full: 'Malaikat adalah makhluk rohani yang diciptakan oleh Allah dari cahaya untuk melayani dan menyembah Allah.'
      },
      {
        name: 'Iman kepada Kitab-Kitab',
        icon: '📖',
        short: 'Kitab Suci',
        full: 'Umat Islam percaya bahawa Allah menurunkan kitab-kitab suci termasuk Taurat, Zabur, Injil, dan Al-Quran sebagai wahyu terakhir.'
      },
      {
        name: 'Iman kepada Rasul-Rasul',
        icon: '🕊️',
        short: 'Utusan Allah',
        full: 'Allah menghantar nabi-nabi untuk membimbing manusia. Nabi Muhammad adalah rasul terakhir untuk seluruh umat manusia.'
      },
      {
        name: 'Iman kepada Hari Akhirat',
        icon: '⚖️',
        short: 'Hari Pembalasan',
        full: 'Umat Islam percaya pada kehidupan selepas mati dan Hari Kiamat apabila semua manusia akan dipertanggungjawabkan.'
      },
      {
        name: 'Iman kepada Qada dan Qadar',
        icon: '✨',
        short: 'Takdir',
        full: 'Qada dan Qadar merujuk kepada takdir ilahi dan pengetahuan Allah. Umat Islam percaya untuk menerima takdir Allah dengan sabar.'
      }
    ]
  }
};

function PillarCard({ pillar, index, color = 'teal' }) {
  const [expanded, setExpanded] = useState(false);
  
  const colorClasses = {
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{pillar.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClasses[color]}`}>
                    {index}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                    {pillar.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pillar.short}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0">
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {pillar.full}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RukunIslam() {
  const language = localStorage.getItem('language') || 'ms';
  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <BackNavigation title={translate('Rukun Islam')} /> 
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-teal-800 dark:text-teal-300 mb-1">{t.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t.subtitle}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-teal-700 dark:text-teal-400 mb-3">{t.islamTitle}</h2>
        <div className="space-y-2">
          {t.pillars.map((pillar, index) => (
            <PillarCard key={index} pillar={pillar} index={index + 1} color="teal" />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 mb-3">{t.imanTitle}</h2>
        <div className="space-y-2">
          {t.articles.map((article, index) => (
            <PillarCard key={index} pillar={article} index={index + 1} color="purple" />
          ))}
        </div>
      </div>
    </div>
  );
}