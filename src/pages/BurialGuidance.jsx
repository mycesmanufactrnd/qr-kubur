// @ts-nocheck
import { useState } from "react";

import BackNavigation from "@/components/BackNavigation";
import PDFViewer from "@/components/PDFViewer";
import { translate } from "@/utils/translations";

// Funeral Management Guide (Management + Shrouding + Solat + Burial tabs, in the order the rites happen). Was "SolatJenazah" — App.jsx
// redirects the old /SolatJenazah URL here.
// `credit` = source attribution rows shown under the PDF, taken from each PDF's own cover/
// copyright page. `label` is a translate() key; `value` is a proper noun (title, names,
// publisher) and is kept as-is. Only list what the PDF itself states — never guess a source.
const TABS = [
  {
    value: "management",
    label: "Management",
    title: "Guide to Managing the Deceased",
    pdf: "/panduan_mengurus_jenazah.pdf",
    credit: [
      { label: "Title", value: "Panduan Mengurus Jenazah", italic: true },
      { label: "Author", value: "Sheikh Abdullah Mohd. Basmeih" },
      {
        label: "Reviewed and verified by",
        value:
          "Sahib al-Samahah Tan Sri Datuk Sheikh Abdul Mohsein Haji Salleh, Mufti Wilayah Persekutuan",
      },
      {
        label: "Publisher",
        value: "Jabatan Kemajuan Islam Malaysia (JAKIM), 2015",
        href: "https://www.islam.gov.my",
      },
      { label: "ISBN", value: "978-983-042-552-8" },
    ],
  },
  {
    value: "shrouding",
    label: "Shrouding",
    title: "Shrouding Guide",
    // Our own re-arranged version of the AkuIslam article (the PDF's last page says so).
    pdf: "/Panduan_Mengkafankan_Jenazah_Kemas.pdf",
    credit: [
      {
        label: "Title",
        value: "Cara Mengkafankan Jenazah (Panduan Lengkap)",
        italic: true,
      },
      { label: "Author", value: "Muhamad Naim Abd Manaf" },
      {
        label: "Website",
        value: "AkuIslam.com",
        href: "https://akuislam.com/panduan/cara-mengkafankan-jenazah/#h-hukum-mengkapankan-jenazah",
      },
      { label: "Updated", value: "18/10/2025" },
    ],
  },
  {
    value: "solat",
    label: "Solat",
    title: "Funeral Prayer Guide",
    pdf: "/PanduanSolatJenazah.pdf",
    // The PDF names no author or publisher — add them here once known.
    credit: [
      { label: "Title", value: "E-Book Panduan Solat Jenazah", italic: true },
    ],
  },
  {
    value: "burial",
    label: "Burial",
    title: "Burial Guide",
    pdf: "/PanduanPengebumianJenazah.pdf",
    credit: [
      {
        label: "Title",
        value: "Panduan Pengurusan Pengebumian Jenazah",
        italic: true,
      },
      {
        label: "Foreword by",
        value:
          "Dato' Setia Haji Mohd Tamyes bin Abd Wahid, Dato' Seri Utama Diraja Mufti Selangor",
      },
      { label: "Publisher", value: "Jabatan Mufti Negeri Selangor" },
    ],
  },
];

export default function BurialGuidance() {
  const [activeTab, setActiveTab] = useState(TABS[0].value);
  const tab = TABS.find((t) => t.value === activeTab);

  return (
    <div className="min-h-screen pb-10 bg-slate-50 dark:bg-slate-900">
      <BackNavigation title={translate("Funeral Management Guide")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        {/* TABS — numbered steps (the rites in order); 2x2 on phones so labels never crowd */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TABS.map(({ value, label }, index) => {
            const isActive = activeTab === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(value)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-700 dark:hover:text-emerald-400"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-white dark:bg-slate-800 text-emerald-600 border border-emerald-100 dark:border-slate-600"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate">{translate(label)}</span>
              </button>
            );
          })}
        </div>

        {/* PDF */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {translate(tab.title)}
            </p>
          </div>

          <PDFViewer key={tab.value} src={tab.pdf} title={tab.title} />

          {tab.credit?.length > 0 && (
            <div className="px-4 pt-4 pb-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                {translate("Source")}
              </p>
              <dl className="divide-y divide-slate-100 dark:divide-slate-700">
                {tab.credit.map(({ label, value, href, italic }) => (
                  <div key={label} className="py-2.5">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {translate(label)}
                    </dt>
                    <dd
                      className={`mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200 ${
                        italic ? "italic" : ""
                      }`}
                    >
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 underline underline-offset-2"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <a
            href={tab.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-600 underline underline-offset-2"
          >
            {translate("Open PDF")}
          </a>
        </div>

        {/* FOOTER */}
        <p className="text-center text-slate-400 dark:text-slate-500 text-xs pb-2">
          {translate(
            "May the matters of the deceased be eased and their deeds be accepted.",
          )}{" "}
          🤲
        </p>
      </div>
    </div>
  );
}
