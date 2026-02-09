import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translate } from "@/utils/translations";
import BackNavigation from "@/components/BackNavigation";


const namesOfAllah = [
  { arabic: "ٱلْرَّحْمَـانُ", transliteration: "Ar-Rahman", meaning: { en: "The Most Merciful", ms: "Yang Maha Pemurah" } },
  { arabic: "ٱلْرَّحِيْمُ", transliteration: "Ar-Rahim", meaning: { en: "The Most Compassionate", ms: "Yang Maha Penyayang" } },
  { arabic: "ٱلْمَلِكُ", transliteration: "Al-Malik", meaning: { en: "The King", ms: "Yang Maha Merajai" } },
  { arabic: "ٱلْقُدُّوسُ", transliteration: "Al-Quddus", meaning: { en: "The Most Holy", ms: "Yang Maha Suci" } },
  { arabic: "ٱلْسَّلَامُ", transliteration: "As-Salam", meaning: { en: "The Source of Peace", ms: "Yang Maha Sejahtera" } },
  { arabic: "ٱلْمُؤْمِنُ", transliteration: "Al-Mu'min", meaning: { en: "The Granter of Security", ms: "Yang Maha Mengaruniakan Keamanan" } },
  { arabic: "ٱلْمُهَيْمِنُ", transliteration: "Al-Muhaymin", meaning: { en: "The Guardian", ms: "Yang Maha Pengawas" } },
  { arabic: "ٱلْعَزِيزُ", transliteration: "Al-Aziz", meaning: { en: "The Almighty", ms: "Yang Maha Perkasa" } },
  { arabic: "ٱلْجَبَّارُ", transliteration: "Al-Jabbar", meaning: { en: "The Compeller", ms: "Yang Maha Memaksa" } },
  { arabic: "ٱلْمُتَكَبِّرُ", transliteration: "Al-Mutakabbir", meaning: { en: "The Supreme", ms: "Yang Maha Megah" } },
  { arabic: "ٱلْخَالِقُ", transliteration: "Al-Khaliq", meaning: { en: "The Creator", ms: "Yang Maha Pencipta" } },
  { arabic: "ٱلْبَارِئُ", transliteration: "Al-Bari", meaning: { en: "The Originator", ms: "Yang Maha Mengadakan" } },
  { arabic: "ٱلْمُصَوِّرُ", transliteration: "Al-Musawwir", meaning: { en: "The Fashioner", ms: "Yang Maha Membentuk Rupa" } },
  { arabic: "ٱلْغَفَّارُ", transliteration: "Al-Ghaffar", meaning: { en: "The Great Forgiver", ms: "Yang Maha Pengampun" } },
  { arabic: "ٱلْقَهَّارُ", transliteration: "Al-Qahhar", meaning: { en: "The All-Prevailing One", ms: "Yang Maha Mengalahkan" } },
  { arabic: "ٱلْوَهَّابُ", transliteration: "Al-Wahhab", meaning: { en: "The Supreme Bestower", ms: "Yang Maha Pemberi Kurnia" } },
  { arabic: "ٱلْرَّزَّاقُ", transliteration: "Ar-Razzaq", meaning: { en: "The Provider", ms: "Yang Maha Pemberi Rezeki" } },
  { arabic: "ٱلْفَتَّاحُ", transliteration: "Al-Fattah", meaning: { en: "The Opener", ms: "Yang Maha Pembuka" } },
  { arabic: "ٱلْعَلِيمُ", transliteration: "Al-Alim", meaning: { en: "The All-Knowing", ms: "Yang Maha Mengetahui" } },
  { arabic: "ٱلْقَابِضُ", transliteration: "Al-Qabid", meaning: { en: "The Withholder", ms: "Yang Maha Menyempitkan" } },
  { arabic: "ٱلْبَاسِطُ", transliteration: "Al-Basit", meaning: { en: "The Extender", ms: "Yang Maha Melapangkan" } },
  { arabic: "ٱلْخَافِضُ", transliteration: "Al-Khafid", meaning: { en: "The Reducer", ms: "Yang Maha Merendahkan" } },
  { arabic: "ٱلْرَّافِعُ", transliteration: "Ar-Rafi", meaning: { en: "The Exalter", ms: "Yang Maha Meninggikan" } },
  { arabic: "ٱلْمُعِزُّ", transliteration: "Al-Mu'izz", meaning: { en: "The Honourer", ms: "Yang Maha Memuliakan" } },
  { arabic: "ٱلْمُذِلُّ", transliteration: "Al-Muzill", meaning: { en: "The Dishonourer", ms: "Yang Maha Menghinakan" } },
  { arabic: "ٱلْسَّمِيعُ", transliteration: "As-Sami", meaning: { en: "The All-Hearing", ms: "Yang Maha Mendengar" } },
  { arabic: "ٱلْبَصِيرُ", transliteration: "Al-Basir", meaning: { en: "The All-Seeing", ms: "Yang Maha Melihat" } },
  { arabic: "ٱلْحَكَمُ", transliteration: "Al-Hakam", meaning: { en: "The Judge", ms: "Yang Maha Hakim" } },
  { arabic: "ٱلْعَدْلُ", transliteration: "Al-Adl", meaning: { en: "The Just", ms: "Yang Maha Adil" } },
  { arabic: "ٱلْلَّطِيفُ", transliteration: "Al-Latif", meaning: { en: "The Subtle One", ms: "Yang Maha Lembut" } },
  { arabic: "ٱلْخَبِيرُ", transliteration: "Al-Khabir", meaning: { en: "The All-Aware", ms: "Yang Maha Mengetahui Segala Rahsia" } },
  { arabic: "ٱلْحَلِيمُ", transliteration: "Al-Halim", meaning: { en: "The Forbearing", ms: "Yang Maha Penyantun" } },
  { arabic: "ٱلْعَظِيمُ", transliteration: "Al-Azim", meaning: { en: "The Magnificent", ms: "Yang Maha Agung" } },
  { arabic: "ٱلْغَفُورُ", transliteration: "Al-Ghafur", meaning: { en: "The Great Forgiver", ms: "Yang Maha Pengampun" } },
  { arabic: "ٱلْشَّكُورُ", transliteration: "Ash-Shakur", meaning: { en: "The Most Appreciative", ms: "Yang Maha Pembalas Syukur" } },
  { arabic: "ٱلْعَلِيُّ", transliteration: "Al-Ali", meaning: { en: "The Most High", ms: "Yang Maha Tinggi" } },
  { arabic: "ٱلْكَبِيرُ", transliteration: "Al-Kabir", meaning: { en: "The Most Great", ms: "Yang Maha Besar" } },
  { arabic: "ٱلْحَفِيظُ", transliteration: "Al-Hafiz", meaning: { en: "The Preserver", ms: "Yang Maha Memelihara" } },
  { arabic: "ٱلْمُقِيتُ", transliteration: "Al-Muqit", meaning: { en: "The Sustainer", ms: "Yang Maha Pemberi Kecukupan" } },
  { arabic: "ٱلْحَسِيبُ", transliteration: "Al-Hasib", meaning: { en: "The Reckoner", ms: "Yang Maha Menghitung" } },
  { arabic: "ٱلْجَلِيلُ", transliteration: "Al-Jalil", meaning: { en: "The Majestic", ms: "Yang Maha Mulia" } },
  { arabic: "ٱلْكَرِيمُ", transliteration: "Al-Karim", meaning: { en: "The Most Generous", ms: "Yang Maha Pemurah" } },
  { arabic: "ٱلْرَّقِيبُ", transliteration: "Ar-Raqib", meaning: { en: "The Watchful", ms: "Yang Maha Mengawasi" } },
  { arabic: "ٱلْمُجِيبُ", transliteration: "Al-Mujib", meaning: { en: "The Responsive", ms: "Yang Maha Memperkenankan" } },
  { arabic: "ٱلْوَاسِعُ", transliteration: "Al-Wasi", meaning: { en: "The All-Encompassing", ms: "Yang Maha Luas" } },
  { arabic: "ٱلْحَكِيمُ", transliteration: "Al-Hakim", meaning: { en: "The Wise", ms: "Yang Maha Bijaksana" } },
  { arabic: "ٱلْوَدُودُ", transliteration: "Al-Wadud", meaning: { en: "The Loving", ms: "Yang Maha Mengasihi" } },
  { arabic: "ٱلْمَجِيدُ", transliteration: "Al-Majid", meaning: { en: "The Glorious", ms: "Yang Maha Mulia" } },
  { arabic: "ٱلْبَاعِثُ", transliteration: "Al-Ba'ith", meaning: { en: "The Resurrector", ms: "Yang Maha Membangkitkan" } },
  { arabic: "ٱلْشَّهِيدُ", transliteration: "Ash-Shahid", meaning: { en: "The Witness", ms: "Yang Maha Menyaksikan" } },
  { arabic: "ٱلْحَقُّ", transliteration: "Al-Haqq", meaning: { en: "The Truth", ms: "Yang Maha Benar" } },
  { arabic: "ٱلْوَكِيلُ", transliteration: "Al-Wakil", meaning: { en: "The Trustee", ms: "Yang Maha Mewakili" } },
  { arabic: "ٱلْقَوِيُّ", transliteration: "Al-Qawiyy", meaning: { en: "The Strong", ms: "Yang Maha Kuat" } },
  { arabic: "ٱلْمَتِينُ", transliteration: "Al-Matin", meaning: { en: "The Firm", ms: "Yang Maha Teguh" } },
  { arabic: "ٱلْوَلِيُّ", transliteration: "Al-Waliyy", meaning: { en: "The Protecting Friend", ms: "Yang Maha Melindungi" } },
  { arabic: "ٱلْحَمِيدُ", transliteration: "Al-Hamid", meaning: { en: "The Praiseworthy", ms: "Yang Maha Terpuji" } },
  { arabic: "ٱلْمُحْصِيُ", transliteration: "Al-Muhsi", meaning: { en: "The Accounter", ms: "Yang Maha Menghitung" } },
  { arabic: "ٱلْمُبْدِئُ", transliteration: "Al-Mubdi", meaning: { en: "The Originator", ms: "Yang Maha Memulakan" } },
  { arabic: "ٱلْمُعِيدُ", transliteration: "Al-Mu'id", meaning: { en: "The Restorer", ms: "Yang Maha Mengembalikan" } },
  { arabic: "ٱلْمُحْيِى", transliteration: "Al-Muhyi", meaning: { en: "The Giver of Life", ms: "Yang Maha Menghidupkan" } },
  { arabic: "ٱلْمُمِيتُ", transliteration: "Al-Mumit", meaning: { en: "The Bringer of Death", ms: "Yang Maha Mematikan" } },
  { arabic: "ٱلْحَىُّ", transliteration: "Al-Hayy", meaning: { en: "The Ever-Living", ms: "Yang Maha Hidup" } },
  { arabic: "ٱلْقَيُّومُ", transliteration: "Al-Qayyum", meaning: { en: "The Sustainer", ms: "Yang Maha Berdiri Sendiri" } },
  { arabic: "ٱلْوَاجِدُ", transliteration: "Al-Wajid", meaning: { en: "The Finder", ms: "Yang Maha Menemui" } },
  { arabic: "ٱلْمَاجِدُ", transliteration: "Al-Majid", meaning: { en: "The Noble", ms: "Yang Maha Mulia" } },
  { arabic: "ٱلْوَاحِدُ", transliteration: "Al-Wahid", meaning: { en: "The One", ms: "Yang Maha Esa" } },
  { arabic: "ٱلْأَحَد", transliteration: "Al-Ahad", meaning: { en: "The Unique", ms: "Yang Maha Tunggal" } },
  { arabic: "ٱلْصَّمَدُ", transliteration: "As-Samad", meaning: { en: "The Eternal", ms: "Yang Maha Kekal" } },
  { arabic: "ٱلْقَادِرُ", transliteration: "Al-Qadir", meaning: { en: "The Capable", ms: "Yang Maha Berkuasa" } },
  { arabic: "ٱلْمُقْتَدِرُ", transliteration: "Al-Muqtadir", meaning: { en: "The Powerful", ms: "Yang Maha Menguasai" } },
  { arabic: "ٱلْمُقَدِّمُ", transliteration: "Al-Muqaddim", meaning: { en: "The Expediter", ms: "Yang Maha Mendahulukan" } },
  { arabic: "ٱلْمُؤَخِّرُ", transliteration: "Al-Mu'akhkhir", meaning: { en: "The Delayer", ms: "Yang Maha Mengakhirkan" } },
  { arabic: "ٱلأَوَّلُ", transliteration: "Al-Awwal", meaning: { en: "The First", ms: "Yang Maha Awal" } },
  { arabic: "ٱلْآخِرُ", transliteration: "Al-Akhir", meaning: { en: "The Last", ms: "Yang Maha Akhir" } },
  { arabic: "ٱلْظَّاهِرُ", transliteration: "Az-Zahir", meaning: { en: "The Manifest", ms: "Yang Maha Nyata" } },
  { arabic: "ٱلْبَاطِنُ", transliteration: "Al-Batin", meaning: { en: "The Hidden", ms: "Yang Maha Tersembunyi" } },
  { arabic: "ٱلْوَالِي", transliteration: "Al-Wali", meaning: { en: "The Governor", ms: "Yang Maha Memerintah" } },
  { arabic: "ٱلْمُتَعَالِي", transliteration: "Al-Muta'ali", meaning: { en: "The Most Exalted", ms: "Yang Maha Tinggi" } },
  { arabic: "ٱلْبَرُّ", transliteration: "Al-Barr", meaning: { en: "The Source of Goodness", ms: "Yang Maha Penderma" } },
  { arabic: "ٱلْتَّوَّابُ", transliteration: "At-Tawwab", meaning: { en: "The Acceptor of Repentance", ms: "Yang Maha Penerima Taubat" } },
  { arabic: "ٱلْمُنْتَقِمُ", transliteration: "Al-Muntaqim", meaning: { en: "The Avenger", ms: "Yang Maha Pembalas" } },
  { arabic: "ٱلْعَفُوُّ", transliteration: "Al-Afuww", meaning: { en: "The Pardoner", ms: "Yang Maha Pemaaf" } },
  { arabic: "ٱلْرَّؤُفُ", transliteration: "Ar-Ra'uf", meaning: { en: "The Most Kind", ms: "Yang Maha Pengasih" } },
  { arabic: "ٱلْمَالِكُ ٱلْمُلْكُ", transliteration: "Malik-ul-Mulk", meaning: { en: "Master of the Kingdom", ms: "Yang Maha Penguasa" } },
  { arabic: "ٱلْذُو ٱلْجَلَالِ وَٱلْإِكْرَامُ", transliteration: "Dhul-Jalali wal-Ikram", meaning: { en: "Lord of Majesty and Generosity", ms: "Yang Mempunyai Kebesaran dan Kemuliaan" } },
  { arabic: "ٱلْمُقْسِطُ", transliteration: "Al-Muqsit", meaning: { en: "The Equitable", ms: "Yang Maha Adil" } },
  { arabic: "ٱلْجَامِعُ", transliteration: "Al-Jami", meaning: { en: "The Gatherer", ms: "Yang Maha Mengumpulkan" } },
  { arabic: "ٱلْغَنيُّ", transliteration: "Al-Ghani", meaning: { en: "The Self-Sufficient", ms: "Yang Maha Kaya" } },
  { arabic: "ٱلْمُغْنِيُ", transliteration: "Al-Mughni", meaning: { en: "The Enricher", ms: "Yang Maha Memberi Kekayaan" } },
  { arabic: "ٱلْمَانِعُ", transliteration: "Al-Mani", meaning: { en: "The Preventer", ms: "Yang Maha Mencegah" } },
  { arabic: "ٱلْضَّارُ", transliteration: "Ad-Darr", meaning: { en: "The Distresser", ms: "Yang Maha Memberi Mudarat" } },
  { arabic: "ٱلْنَّافِعُ", transliteration: "An-Nafi", meaning: { en: "The Benefactor", ms: "Yang Maha Memberi Manfaat" } },
  { arabic: "ٱلْنُّورُ", transliteration: "An-Nur", meaning: { en: "The Light", ms: "Yang Maha Bercahaya" } },
  { arabic: "ٱلْهَادِي", transliteration: "Al-Hadi", meaning: { en: "The Guide", ms: "Yang Maha Memberi Petunjuk" } },
  { arabic: "ٱلْبَدِيعُ", transliteration: "Al-Badi", meaning: { en: "The Incomparable", ms: "Yang Maha Mencipta" } },
  { arabic: "ٱلْبَاقِي", transliteration: "Al-Baqi", meaning: { en: "The Everlasting", ms: "Yang Maha Kekal" } },
  { arabic: "ٱلْوَارِثُ", transliteration: "Al-Warith", meaning: { en: "The Inheritor", ms: "Yang Maha Mewarisi" } },
  { arabic: "ٱلْرَّشِيدُ", transliteration: "Ar-Rashid", meaning: { en: "The Guide to the Right Path", ms: "Yang Maha Memberi Petunjuk" } },
  { arabic: "ٱلْصَّبُورُ", transliteration: "As-Sabur", meaning: { en: "The Patient", ms: "Yang Maha Sabar" } }
];

export default function AsmaUlHusna() {

 const language = localStorage.getItem('language') || 'ms';
  
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <BackNavigation title={translate('Asmaul Husna')} />
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-2">
            {translate('99 Names of Allah')}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{translate('Asma Ul-Husna')}</p>
      </div>

    
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
        <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">{translate('Listen & Memorize')}</h2>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/pTk9jVDWNV0?loop=1&playlist=pTk9jVDWNV0"
            title="Asma Ul-Husna"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>

      
      <div className="grid grid-cols-2 gap-3">
        {namesOfAllah.map((name, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-teal-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
            <h3 className="text-xl font-bold text-center mb-1 text-purple-700 dark:text-purple-300">
              {name.arabic}
            </h3>
            <p className="text-center text-gray-700 dark:text-gray-300 text-sm font-medium mb-0.5">
              {name.transliteration}
            </p>
            <p className="text-center text-xs text-gray-600 dark:text-gray-400">
              {name.meaning[language] || name.meaning['en']}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}