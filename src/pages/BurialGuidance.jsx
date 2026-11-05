// @ts-nocheck
import { useState } from "react";

import BackNavigation from "@/components/BackNavigation";
import PDFViewer from "@/components/PDFViewer";
import { translate } from "@/utils/translations";

// Funeral Management Guide (Burial + Solat tabs). Was "SolatJenazah" — App.jsx
// redirects the old /SolatJenazah URL here.
const TABS = [
  {
    value: "burial",
    label: "Burial",
    title: "Burial Guide",
    pdf: "/PanduanPengebumianJenazah.pdf",
  },
  {
    value: "solat",
    label: "Solat",
    title: "Funeral Prayer Guide",
    pdf: "/PanduanSolatJenazah.pdf",
  },
];

export default function BurialGuidance() {
  const [activeTab, setActiveTab] = useState(TABS[0].value);
  const tab = TABS.find((t) => t.value === activeTab);

  return (
    <div className="min-h-screen pb-10 bg-slate-50 dark:bg-slate-900">
      <BackNavigation title={translate("Funeral Management Guide")} />

      <div className="max-w-2xl mx-auto px-2 space-y-4">
        {/* TABS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-1.5 flex gap-1">
          {TABS.map(({ value, label }) => {
            const isActive = activeTab === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {translate(label)}
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
