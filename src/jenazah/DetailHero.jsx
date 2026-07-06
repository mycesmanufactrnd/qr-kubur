import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, BookOpen, CalendarClock } from "lucide-react";

function calcAge(birth, death) {
  if (!birth || !death) return null;
  const b = new Date(birth);
  const d = new Date(death);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
}

function initials(name) {
  if (!name) return "?";
  const clean = name.replace(/^(Allahyarhamah|Allahyarham)\s+/i, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-emerald-700" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold truncate">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DetailHero({ data }) {
  const isBuried = data.status_pemakaman === "Sudah Dikebumikan";
  const age = calcAge(data.tanggal_lahir, data.tanggal_meninggal);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
            {initials(data.nama_lengkap)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{data.nama_lengkap}</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{data.mykad}</p>
          </div>
          <Badge
            className={
              isBuried
                ? "bg-emerald-600 text-white border-0 hover:bg-emerald-600 text-sm px-3 py-1.5"
                : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-sm px-3 py-1.5"
            }
          >
            {data.status_pemakaman}
          </Badge>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem icon={User} label="Jantina" value={data.jenis_kelamin} />
          <StatItem icon={BookOpen} label="Agama" value={data.agama} />
          <StatItem icon={Calendar} label="Umur" value={age != null ? `${age} tahun` : "—"} />
          <StatItem icon={CalendarClock} label="Tarikh Meninggal" value={data.tanggal_meninggal} />
        </div>
      </div>
    </div>
  );
}