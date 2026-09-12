// @ts-nocheck
import { useSearchParams, useNavigate } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  Users,
  MapPin,
  Phone,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import InfoCard from "@/jenazah/InfoCard";
import Field from "@/jenazah/Field";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import DocumentLinks from "@/components/DocumentLinks";
import { translate } from "@/utils/translations";

const TABS = [
  { value: "peribadi", label: "Peribadi", icon: User },
  { value: "kematian", label: "Kematian", icon: Calendar },
  { value: "penanggung", label: "Keluarga", icon: Users },
  { value: "pemakaman", label: "Pemakaman", icon: MapPin },
  { value: "dokumen", label: translate("Documents"), icon: Paperclip },
];

export default function MobileDetailJenazah() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personId = Number(searchParams.get("id"));

  const { data: person, isLoading } =
    trpc.deadperson.getDeadPersonById.useQuery(
      { id: personId },
      { enabled: !!personId },
    );

  if (isLoading) return <PageLoadingComponent />;

  if (!person) {
    return (
      <div className="flex flex-col min-h-screen">
        <MobileDetailHeader onClose={() => navigate(-1)} title="—" />
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            Rekod tidak dijumpai.
          </p>
        </div>
      </div>
    );
  }

  const isBuried = !!person.gravelot;
  const status = isBuried ? "Sudah Dikebumikan" : "Belum Dikebumikan";
  const lokasi =
    [person.grave?.name, person.gravelot ? `Lot ${person.gravelot}` : null]
      .filter(Boolean)
      .join(", ") || null;

  const cleanName = (person.name || "").replace(
    /^(Allahyarhamah|Allahyarham)\s+/i,
    "",
  );
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const initials =
    ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "")).toUpperCase() ||
    "?";

  let age = null;
  if (person.dateofbirth && person.dateofdeath) {
    const b = new Date(person.dateofbirth);
    const d = new Date(person.dateofdeath);
    let a = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
    if (a >= 0) age = a;
  }

  return (
    <div className="min-h-screen pb-6">
      <MobileDetailHeader onClose={() => navigate(-1)} title={person.name} />

      <div className="max-w-2xl mx-auto px-3 pt-3 space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                {person.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {person.icnumber || "—"}
              </p>
              <Badge
                className={
                  "mt-2 " +
                  (isBuried
                    ? "bg-emerald-600 text-white border-0"
                    : "bg-amber-100 text-amber-800 border-amber-300")
                }
              >
                {status}
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
            {[
              { label: "Tarikh Lahir", value: person.dateofbirth || "—" },
              { label: "Tarikh Meninggal", value: person.dateofdeath || "—" },
              { label: "Umur", value: age != null ? `${age} tahun` : "—" },
              { label: "Sebab Meninggal", value: person.causeofdeath || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  {label}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="peribadi" className="w-full">
          <TabsList className="w-full h-auto justify-start gap-1.5 bg-transparent p-0 overflow-x-auto flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-none data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 data-[state=active]:shadow-none"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="peribadi" className="mt-3">
            <InfoCard title="Maklumat Peribadi" icon={User}>
              <div className="grid grid-cols-1 gap-x-8">
                <Field label="Nama Lengkap" value={person.name} />
                <Field
                  label="No. Kad Pengenalan (MyKad)"
                  value={person.icnumber}
                />
                <Field label="Tarikh Lahir" value={person.dateofbirth} />
                <Field label="Sebab Meninggal" value={person.causeofdeath} />
              </div>
            </InfoCard>
          </TabsContent>

          <TabsContent value="kematian" className="mt-3">
            <InfoCard title="Maklumat Kematian" icon={Calendar}>
              <div className="grid grid-cols-1 gap-x-8">
                <Field label="Tarikh Meninggal" value={person.dateofdeath} />
                <Field label="Sebab Meninggal" value={person.causeofdeath} />
                <Field label="Lot Kubur" value={person.gravelot} />
                <Field
                  label="Nama Tanah Perkuburan"
                  value={person.grave?.name}
                />
              </div>
            </InfoCard>
          </TabsContent>

          <TabsContent value="penanggung" className="mt-3">
            <InfoCard title="Maklumat Penanggung Jawab" icon={Users}>
              <div className="grid grid-cols-1 gap-x-8">
                <Field label="Nama Waris" value={person.heirname} />
                <div className="flex items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mt-0.5 mr-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-1">
                      No. Telefon
                    </p>
                    <p
                      className={`text-sm ${person.heirphoneno ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}`}
                    >
                      {person.heirphoneno || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </TabsContent>

          <TabsContent value="pemakaman" className="mt-3">
            <InfoCard title="Maklumat Pemakaman" icon={MapPin}>
              <div className="grid grid-cols-1 gap-x-8">
                <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-1">
                    Status Pemakaman
                  </p>
                  <Badge
                    className={
                      isBuried
                        ? "bg-emerald-600 text-white border-0 hover:bg-emerald-600"
                        : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <Field label="Lokasi Pemakaman" value={lokasi} />
                <div className="py-3">
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    Biografi / Catatan
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>{person.biography || "—"}</span>
                  </div>
                </div>
              </div>
            </InfoCard>
          </TabsContent>

          <TabsContent value="dokumen" className="mt-3">
            <InfoCard title={translate("Documents")} icon={Paperclip}>
              {person.deathconfirmationphotourl ||
              person.policereportphotourl ||
              person.supportingdocphotourl ? (
                <div className="space-y-4">
                  <DocumentLinks
                    label={translate("Death Confirmation")}
                    value={person.deathconfirmationphotourl}
                    bucket="bucket-death-confirmation"
                  />
                  <DocumentLinks
                    label={translate("Police Report")}
                    value={person.policereportphotourl}
                    bucket="bucket-police-report"
                  />
                  <DocumentLinks
                    label={translate("Supporting Documents")}
                    value={person.supportingdocphotourl}
                    bucket="supporting-doc-jenazah-case"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  {translate("No documents available.")}
                </p>
              )}
            </InfoCard>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-2">
          Data jenazah bersifat sulit. Sila jaga kerahsiaan maklumat ini.
        </p>
      </div>
    </div>
  );
}

function MobileDetailHeader({ onClose, title }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:opacity-70 shrink-0"
      >
        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </button>
      <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
        {title}
      </h2>
    </div>
  );
}
