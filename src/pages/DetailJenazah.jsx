// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Users, MapPin, Phone, FileText, ArrowLeft, Printer } from "lucide-react";
import InfoCard from "@/jenazah/InfoCard";
import Field from "@/jenazah/Field";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";

export default function DetailJenazah() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personId = Number(searchParams.get("id"));

  const { data: person, isLoading } = trpc.deadperson.getDeadPersonById.useQuery(
    { id: personId },
    { enabled: !!personId }
  );

  if (isLoading) return <PageLoadingComponent />;

  if (!person) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Rekod tidak dijumpai.</p>
      </div>
    );
  }

  const isBuried = !!person.gravelot;
  const status = isBuried ? "Sudah Dikebumikan" : "Belum Dikebumikan";
  const lokasi = [person.grave?.name, person.gravelot ? `Lot ${person.gravelot}` : null]
    .filter(Boolean).join(", ") || null;

  const cleanName = (person.name || "").replace(/^(Allahyarhamah|Allahyarham)\s+/i, "");
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const initials = ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "")).toUpperCase() || "?";

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
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: translate("Admin Dashboard"), page: "AdminDashboard" },
          { label: translate("Manage Deceased"), page: "ManageDeadPersons" },
          { label: person.name, page: "DetailJenazah" },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("ManageDeadPersons"))}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {translate("Back")}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detail Jenazah
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              isBuried
                ? "bg-emerald-600 text-white border-0 text-sm px-3 py-1.5"
                : "bg-amber-100 text-amber-800 border-amber-300 text-sm px-3 py-1.5"
            }
          >
            {status}
          </Badge>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {person.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
              {person.icnumber || "—"}
            </p>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tarikh Lahir", value: person.dateofbirth || "—" },
            { label: "Tarikh Meninggal", value: person.dateofdeath || "—" },
            { label: "Umur", value: age != null ? `${age} tahun` : "—" },
            { label: "Sebab Meninggal", value: person.causeofdeath || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">
                {label}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="peribadi" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-lg shadow-sm">
          <TabsTrigger
            value="peribadi"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2 py-2.5 text-sm font-medium"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Maklumat Peribadi</span>
            <span className="sm:hidden">Peribadi</span>
          </TabsTrigger>
          <TabsTrigger
            value="kematian"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2 py-2.5 text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Maklumat Kematian</span>
            <span className="sm:hidden">Kematian</span>
          </TabsTrigger>
          <TabsTrigger
            value="penanggung"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2 py-2.5 text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Penanggung Jawab</span>
            <span className="sm:hidden">Keluarga</span>
          </TabsTrigger>
          <TabsTrigger
            value="pemakaman"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2 py-2.5 text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Maklumat Pemakaman</span>
            <span className="sm:hidden">Pemakaman</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="peribadi" className="mt-5">
          <InfoCard title="Maklumat Peribadi" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Nama Lengkap" value={person.name} />
              <Field label="No. Kad Pengenalan (MyKad)" value={person.icnumber} />
              <Field label="Tarikh Lahir" value={person.dateofbirth} />
              <Field label="Sebab Meninggal" value={person.causeofdeath} />
            </div>
          </InfoCard>
        </TabsContent>

        <TabsContent value="kematian" className="mt-5">
          <InfoCard title="Maklumat Kematian" icon={Calendar}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Tarikh Meninggal" value={person.dateofdeath} />
              <Field label="Sebab Meninggal" value={person.causeofdeath} />
              <Field label="Lot Kubur" value={person.gravelot} />
              <Field label="Nama Tanah Perkuburan" value={person.grave?.name} />
            </div>
          </InfoCard>
        </TabsContent>

        <TabsContent value="penanggung" className="mt-5">
          <InfoCard title="Maklumat Penanggung Jawab" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <Field label="Nama Waris" value={person.heirname} />
              <div className="flex items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mt-0.5 mr-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-1">
                    No. Telefon
                  </p>
                  <p className={`text-sm ${person.heirphoneno ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}`}>
                    {person.heirphoneno || "—"}
                  </p>
                </div>
              </div>
            </div>
          </InfoCard>
        </TabsContent>

        <TabsContent value="pemakaman" className="mt-5">
          <InfoCard title="Maklumat Pemakaman" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
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
              <div className="md:col-span-2 py-3">
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
      </Tabs>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-2">
        Data jenazah bersifat sulit. Sila jaga kerahsiaan maklumat ini.
      </p>
    </div>
  );
}
