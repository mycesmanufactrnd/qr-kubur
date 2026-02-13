import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
  
  const colorConfig = {
    teal: {
      gradient: 'from-teal-500 to-cyan-600',
      bg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40',
      badge: 'bg-gradient-to-r from-teal-500 to-cyan-500',
      iconBg: 'bg-teal-100 dark:bg-teal-900/50',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-700 dark:text-teal-300'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40',
      badge: 'bg-gradient-to-r from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300'
    }
  };

  const config = colorConfig[color];

  return (
    <div 
      className={`${config.bg} rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl border ${config.border} backdrop-blur-sm`}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
      }}
    >
      <div
        className="p-5 cursor-pointer active:scale-[0.98] transition-transform duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header Section */}
        <div className="flex items-start gap-4">
          {/* Icon with animated background */}
          <div className={`${config.iconBg} rounded-2xl p-3 flex-shrink-0 transform transition-all duration-300 ${expanded ? 'scale-110 rotate-12' : ''}`}>
            <span className="text-4xl block leading-none">{pillar.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Badge and Title */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`${config.badge} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1`}>
                    <Sparkles className="w-3 h-3" />
                    {index}
                  </span>
                  <h3 className={`text-lg font-bold ${config.text} leading-tight`}>
                    {pillar.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {pillar.short}
                </p>
              </div>
              
              {/* Expand Button */}
              <button 
                className={`${config.iconBg} rounded-full p-2 transition-all duration-300 ${expanded ? 'rotate-180' : ''}`}
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                <ChevronDown className={`w-5 h-5 ${config.text}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Expanded Content */}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            expanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {pillar.full}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, gradient }) {
  return (
    <div className="relative mb-5">
      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-4 shadow-lg`}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-bold text-white text-center">
            {title}
          </h2>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r ${gradient} rounded-full opacity-50`}></div>
    </div>
  );
}

export default function RukunIslam() {
  const language = localStorage.getItem('language') || 'ms';
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
      
      <BackNavigation title={translate('Rukun Islam')} />
      
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-center text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="inline-block mb-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">Islamic Fundamentals</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 drop-shadow-lg">{t.title}</h1>
          <p className="text-sm text-white/95 max-w-md mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="px-2 py-6 max-w-2xl mx-auto">
        <div className="mb-10">
          <SectionHeader 
            title={t.islamTitle} 
            icon="🕌"
            gradient="from-teal-500 via-cyan-500 to-teal-600"
          />
          <div className="space-y-4">
            {t.pillars.map((pillar, index) => (
              <PillarCard key={index} pillar={pillar} index={index + 1} color="teal" />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <SectionHeader 
            title={t.imanTitle} 
            icon="✨"
            gradient="from-purple-500 via-pink-500 to-purple-600"
          />
          <div className="space-y-4">
            {t.articles.map((article, index) => (
              <PillarCard key={index} pillar={article} index={index + 1} color="purple" />
            ))}
          </div>
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}