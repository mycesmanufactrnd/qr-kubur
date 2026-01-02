import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index.jsx';
import { 
  QrCode, Search, MapPin, Map, Heart, BookOpen, FileText, 
  Users, Building2, Shield, Clock, CheckCircle, Smartphone,
  Globe, Database, Bell, Camera, Navigation, Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AboutSystem() {
  const userFeatures = [
    {
      category: "Carian & Paparan",
      icon: Search,
      color: "emerald",
      features: [
        { name: "Cari Si Mati", description: "Carian mengikut nama atau No. IC", page: "SearchGrave" },
        { name: "Cari Tanah Perkuburan", description: "Carian mengikut nama kubur atau negeri", page: "SearchGrave" },
        { name: "Paparan Butiran Kubur", description: "Maklumat lengkap tanah perkuburan", page: "GraveDetails" },
        { name: "Paparan Butiran Si Mati", description: "Biodata dan maklumat arwah", page: "DeadPersonDetails" },
      ]
    },
    {
      category: "Peta Interaktif",
      icon: MapPin,
      color: "blue",
      features: [
        { name: "Peta Kubur", description: "Peta dengan penanda hijau untuk semua kubur", page: "MapKubur" },
        { name: "Peta Tahfiz", description: "Peta dengan penanda biru untuk pusat tahfiz", page: "MapTahfiz" },
        { name: "Geolokasi", description: "Cari lokasi semasa pengguna" },
        { name: "Navigasi GPS", description: "Arah ke lokasi kubur menggunakan Google Maps" },
        { name: "Tapis Mengikut Negeri", description: "Tapis paparan peta mengikut negeri" },
      ]
    },
    {
      category: "QR Code",
      icon: QrCode,
      color: "violet",
      features: [
        { name: "Imbas QR", description: "Imbas kod QR untuk akses maklumat kubur", page: "ScanQR" },
        { name: "Input Manual", description: "Masukkan kod QR secara manual" },
        { name: "Muat Naik Gambar QR", description: "Ekstrak kod QR daripada gambar" },
      ]
    },
    {
      category: "Derma & Sumbangan",
      icon: Heart,
      color: "pink",
      features: [
        { name: "Derma ke Organisasi", description: "Sumbangan kepada organisasi pengurusan kubur", page: "DonationPage" },
        { name: "Derma ke Pusat Tahfiz", description: "Sumbangan kepada pusat tahfiz" },
        { name: "Pelbagai Kaedah Bayaran", description: "Bank transfer, DuitNow QR, Online Banking" },
        { name: "Muat Naik Resit", description: "Bukti pembayaran untuk pengesahan" },
      ]
    },
    {
      category: "Perkhidmatan Tahlil",
      icon: BookOpen,
      color: "amber",
      features: [
        { name: "Mohon Tahlil", description: "Permohonan bacaan tahlil untuk arwah", page: "TahlilRequestPage" },
        { name: "Pilih Jenis Perkhidmatan", description: "Tahlil ringkas, tahlil panjang, yasin, doa arwah" },
        { name: "Pilih Pusat Tahfiz", description: "Pilih pusat tahfiz mengikut negeri" },
      ]
    },
    {
      category: "Surah & Doa",
      icon: BookOpen,
      color: "teal",
      features: [
        { name: "Surah Al-Fatihah", description: "Teks Arab, Rumi dan terjemahan", page: "SurahPage" },
        { name: "Doa Ziarah Kubur", description: "Doa ketika menziarahi kubur" },
        { name: "Doa Arwah", description: "Doa untuk arwah" },
        { name: "Tahlil Ringkas", description: "Bacaan tahlil ringkas" },
      ]
    },
    {
      category: "Cadangan & Maklum Balas",
      icon: FileText,
      color: "orange",
      features: [
        { name: "Hantar Cadangan", description: "Cadang pembetulan maklumat", page: "SubmitSuggestion" },
        { name: "Kongsi Lokasi", description: "Kongsi pautan lokasi kubur" },
      ]
    },
  ];

  const adminFeatures = [
    {
      category: "Pengurusan Data",
      icon: Database,
      color: "indigo",
      features: [
        { name: "Urus Tanah Perkuburan", description: "CRUD untuk rekod kubur", page: "ManageGraves" },
        { name: "Urus Rekod Si Mati", description: "CRUD untuk rekod arwah", page: "ManageDeadPersons" },
        { name: "Urus Organisasi", description: "CRUD untuk organisasi", page: "ManageOrganisations" },
        { name: "Urus Pusat Tahfiz", description: "CRUD untuk pusat tahfiz", page: "ManageTahfizCenters" },
      ]
    },
    {
      category: "Pengurusan Permohonan",
      icon: Clock,
      color: "yellow",
      features: [
        { name: "Semak Cadangan", description: "Lulus/tolak cadangan pembetulan", page: "ManageSuggestions" },
        { name: "Semak Derma", description: "Sahkan resit pembayaran derma", page: "ManageDonations" },
        { name: "Urus Permohonan Tahlil", description: "Terima/tolak permohonan tahlil", page: "ManageTahlilRequests" },
      ]
    },
  ];

  const superadminFeatures = [
    {
      category: "Pengurusan Sistem",
      icon: Shield,
      color: "purple",
      features: [
        { name: "Senarai Pengguna", description: "Paparan semua pengguna sistem", page: "SuperadminDashboard" },
        { name: "Kelulusan Admin", description: "Lulus/tolak permohonan admin" },
        { name: "Tambah Organisasi", description: "Tambah organisasi pengurusan baharu", page: "ManageOrganisations" },
        { name: "Tambah Admin", description: "Tambah pentadbir baharu", page: "ManageUsers" },
        { name: "Urus Kebenaran", description: "Tetapkan kebenaran modul untuk pengguna", page: "ManagePermissions" },
        { name: "Dokumentasi Sistem", description: "Muat turun SRS dalam PDF", page: "Documentation" },
        { name: "SQL Console", description: "Contoh arahan SQL untuk rujukan" },
      ]
    },
  ];

  const entities = [
    { name: "User", description: "Pengguna sistem (admin/user)" },
    { name: "Grave", description: "Rekod tanah perkuburan" },
    { name: "DeadPerson", description: "Rekod si mati / arwah" },
    { name: "Organisation", description: "Organisasi pengurusan (kerajaan/NGO)" },
    { name: "TahfizCenter", description: "Pusat tahfiz / madrasah" },
    { name: "Donation", description: "Rekod derma/sumbangan" },
    { name: "Suggestion", description: "Cadangan pembetulan data" },
    { name: "TahlilRequest", description: "Permohonan perkhidmatan tahlil" },
    { name: "VisitLog", description: "Log lawatan / imbasan QR" },
  ];

  const FeatureSection = ({ title, icon: Icon, features, bgColor }) => (
    <Card className="border-0 shadow-md">
      <CardHeader className={`bg-${bgColor}-50`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`w-5 h-5 text-${bgColor}-600`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{feature.name}</p>
                <p className="text-sm text-gray-500">{feature.description}</p>
                {feature.page && (
                  <Link 
                    to={createPageUrl(feature.page)} 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Pergi ke halaman →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">QR Kubur</h1>
        <p className="text-gray-500 mt-2">Smart Grave Management System</p>
        <Badge className="mt-3 bg-emerald-100 text-emerald-700">Versi 1.0</Badge>
      </div>

      {/* System Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-3">Tentang Sistem</h2>
          <p className="text-emerald-100">
            QR Kubur adalah sistem pengurusan kubur pintar yang membolehkan pengguna mencari dan 
            mengakses maklumat kubur melalui kod QR, peta interaktif, dan carian. Sistem ini juga 
            menyediakan perkhidmatan derma dan permohonan tahlil kepada pusat tahfiz.
          </p>
        </CardContent>
      </Card>

      {/* User Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Ciri-Ciri Pengguna
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {userFeatures.map((section, i) => (
            <FeatureSection 
              key={i} 
              title={section.category} 
              icon={section.icon} 
              features={section.features}
              bgColor={section.color}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Admin Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Ciri-Ciri Admin
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {adminFeatures.map((section, i) => (
            <FeatureSection 
              key={i} 
              title={section.category} 
              icon={section.icon} 
              features={section.features}
              bgColor={section.color}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Superadmin Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Ciri-Ciri Super Admin
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {superadminFeatures.map((section, i) => (
            <FeatureSection 
              key={i} 
              title={section.category} 
              icon={section.icon} 
              features={section.features}
              bgColor={section.color}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Database Entities */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600" />
          Entiti Pangkalan Data
        </h2>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entities.map((entity, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-mono font-semibold text-gray-900">{entity.name}</p>
                  <p className="text-sm text-gray-500">{entity.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Senarai Halaman Sistem
        </h2>
        <div className="space-y-4">
          {/* Public User Pages */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-emerald-50 p-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Halaman Pengguna Awam
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { name: "UserDashboard", label: "Dashboard" },
                  { name: "SearchGrave", label: "Cari Kubur" },
                  { name: "SearchTahfiz", label: "Cari Tahfiz" },
                  { name: "ScanQR", label: "Imbas QR" },
                  { name: "GraveDetails", label: "Butiran Kubur" },
                  { name: "DeadPersonDetails", label: "Butiran Si Mati" },
                  { name: "DonationPage", label: "Derma" },
                  { name: "TahlilRequestPage", label: "Mohon Tahlil" },
                  { name: "SurahPage", label: "Surah & Doa" },
                  { name: "SubmitSuggestion", label: "Hantar Cadangan" },
                  { name: "SettingsPage", label: "Tetapan" },
                  { name: "AboutSystem", label: "Tentang Sistem" },
                  { name: "MoreMenu", label: "Menu Lagi" },
                ].map((page, i) => (
                  <Link 
                    key={i}
                    to={createPageUrl(page.name)}
                    className="p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 block">{page.label}</span>
                    <span className="text-xs text-emerald-600 font-mono">{page.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Pages */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-indigo-50 p-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Halaman Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { name: "AdminDashboard", label: "Admin Dashboard" },
                  { name: "ManageGraves", label: "Urus Kubur" },
                  { name: "ManageDeadPersons", label: "Urus Si Mati" },
                  { name: "ManageOrganisations", label: "Urus Organisasi" },
                  { name: "ManageTahfizCenters", label: "Urus Tahfiz" },
                  { name: "ManageSuggestions", label: "Urus Cadangan" },
                  { name: "ManageDonations", label: "Urus Derma" },
                  { name: "ManageTahlilRequests", label: "Urus Tahlil" },
                  { name: "ManageEmployees", label: "Urus Employee" },
                ].map((page, i) => (
                  <Link 
                    key={i}
                    to={createPageUrl(page.name)}
                    className="p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 block">{page.label}</span>
                    <span className="text-xs text-indigo-600 font-mono">{page.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Superadmin Pages */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-purple-50 p-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Halaman Super Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { name: "SuperadminDashboard", label: "Super Admin Dashboard" },
                  { name: "ManageUsers", label: "Urus Pengguna" },
                  { name: "ManagePermissions", label: "Urus Kebenaran" },
                  { name: "ViewLogs", label: "Log Aktiviti" },
                  { name: "Documentation", label: "Dokumentasi SRS" },
                ].map((page, i) => (
                  <Link 
                    key={i}
                    to={createPageUrl(page.name)}
                    className="p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 block">{page.label}</span>
                    <span className="text-xs text-purple-600 font-mono">{page.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gray-50 p-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-600" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <Link 
                  to={createPageUrl('AppUserLogin')}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 block">Log Masuk Admin</span>
                  <span className="text-xs text-gray-600 font-mono">AppUserLogin</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-600" />
            Teknologi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["React", "Tailwind CSS", "shadcn/ui", "React Query", "React Leaflet", "Lucide Icons", "Base44 Platform"].map((tech, i) => (
              <Badge key={i} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}