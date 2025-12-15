import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from 'jspdf';

export default function Documentation() {
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const isSuperAdmin = user?.role === 'admin' && user?.admin_type === 'superadmin';

  const generateSRS = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('QR Kubur', 105, y, { align: 'center' });
      y += 10;
      doc.setFontSize(16);
      doc.text('Software Requirements Specification', 105, y, { align: 'center' });
      y += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Smart Grave Management System', 105, y, { align: 'center' });
      y += 20;

      // System Overview
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('1. SISTEM OVERVIEW', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const overview = 'QR Kubur adalah sistem pengurusan kubur pintar yang membolehkan pengguna mencari dan mengakses maklumat kubur melalui kod QR, peta interaktif, dan carian. Sistem ini menyediakan perkhidmatan derma dan permohonan tahlil.';
      const splitOverview = doc.splitTextToSize(overview, 170);
      doc.text(splitOverview, 20, y);
      y += splitOverview.length * 5 + 10;

      // User Roles
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('2. USER ROLES', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const roles = [
        { role: 'Public User', desc: 'Akses carian, peta, QR scan, derma, surah' },
        { role: 'Employee', desc: 'Kebenaran terhad untuk urus data' },
        { role: 'Admin', desc: 'Urus data kubur, organisasi, tahfiz, derma' },
        { role: 'Superadmin', desc: 'Kawalan penuh: urus pengguna, kebenaran, organisasi' }
      ];

      roles.forEach(r => {
        doc.text(`• ${r.role}: ${r.desc}`, 25, y);
        y += 6;
      });
      y += 10;

      // New Page
      doc.addPage();
      y = 20;

      // Functional Requirements
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('3. FUNCTIONAL REQUIREMENTS', 20, y);
      y += 10;

      const features = [
        { cat: 'Search & Display', items: ['Cari si mati (nama/IC)', 'Cari kubur (nama/negeri)', 'Paparan butiran lengkap', 'Filter mengikut negeri'] },
        { cat: 'Interactive Maps', items: ['Peta kubur dengan marker', 'Peta tahfiz center', 'Geolokasi pengguna', 'Navigasi GPS ke lokasi'] },
        { cat: 'QR Code', items: ['Scan QR dengan kamera', 'Input manual kod QR', 'Terus ke maklumat kubur'] },
        { cat: 'Donations', items: ['Derma ke organisasi/tahfiz', 'Upload resit bayaran', 'Admin verify derma', 'Pelbagai kaedah bayaran'] },
        { cat: 'Tahlil Services', items: ['Mohon tahlil online', 'Pilih jenis perkhidmatan', 'Pilih pusat tahfiz', 'Admin urus permohonan'] },
        { cat: 'Admin Features', items: ['CRUD kubur & si mati', 'CRUD organisasi & tahfiz', 'Urus cadangan pengguna', 'Verify derma & tahlil', 'Urus kebenaran pengguna'] },
        { cat: 'Superadmin', items: ['Urus semua pengguna', 'Tambah organisasi/admin', 'Tetapkan kebenaran', 'Lihat dokumentasi sistem'] }
      ];

      features.forEach(feature => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(feature.cat, 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        feature.items.forEach(item => {
          doc.text(`  - ${item}`, 25, y);
          y += 5;
        });
        y += 5;
      });

      // New Page for Entities
      doc.addPage();
      y = 20;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('4. DATABASE ENTITIES', 20, y);
      y += 10;

      const entities = [
        { name: 'User', desc: 'Pengguna sistem (role, admin_type, permissions, state, org)' },
        { name: 'Grave', desc: 'Tanah perkuburan (nama, negeri, blok, lot, GPS, status)' },
        { name: 'DeadPerson', desc: 'Rekod si mati (nama, IC, tarikh lahir/mati, biografi, foto)' },
        { name: 'Organisation', desc: 'Organisasi pengurusan (majlis agama/daerah)' },
        { name: 'TahfizCenter', desc: 'Pusat tahfiz (nama, negeri, perkhidmatan, bank details)' },
        { name: 'Donation', desc: 'Rekod derma (amount, recipient, status, resit)' },
        { name: 'TahlilRequest', desc: 'Permohonan tahlil (requester, deceased, service type)' },
        { name: 'Suggestion', desc: 'Cadangan pembetulan (entity, changes, status)' },
        { name: 'VisitLog', desc: 'Log lawatan/QR scan' }
      ];

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      entities.forEach(e => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`• ${e.name}:`, 25, y);
        doc.setFont(undefined, 'normal');
        const split = doc.splitTextToSize(e.desc, 150);
        doc.text(split, 30, y + 5);
        y += 5 + split.length * 5 + 3;
      });

      // New Page for Pages
      doc.addPage();
      y = 20;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('5. SYSTEM PAGES', 20, y);
      y += 10;

      const pages = [
        { name: 'UserDashboard', desc: 'Halaman utama pengguna dengan aksi pantas', role: 'Public User' },
        { name: 'SearchGrave', desc: 'Cari kubur dan si mati dengan filter negeri', role: 'Public User' },
        { name: 'SearchTahfiz', desc: 'Cari pusat tahfiz mengikut negeri', role: 'Public User' },
        { name: 'ScanQR', desc: 'Imbas kod QR kubur dengan kamera atau input manual', role: 'Public User' },
        { name: 'GraveDetails', desc: 'Butiran lengkap kubur dengan peta dan navigasi GPS', role: 'Public User' },
        { name: 'DeadPersonDetails', desc: 'Butiran si mati dengan biografi dan foto', role: 'Public User' },
        { name: 'DonationPage', desc: 'Derma ke organisasi atau pusat tahfiz', role: 'Public User' },
        { name: 'TahlilRequestPage', desc: 'Mohon perkhidmatan tahlil untuk arwah', role: 'Public User' },
        { name: 'SurahPage', desc: 'Surah & doa (Al-Fatihah, Yasin, Doa Ziarah, Tahlil)', role: 'Public User' },
        { name: 'SubmitSuggestion', desc: 'Hantar cadangan pembetulan data', role: 'Public User' },
        { name: 'SettingsPage', desc: 'Tetapan profil dan maklumat pengguna', role: 'Public User' },
        { name: 'AboutSystem', desc: 'Maklumat sistem, ciri dan halaman', role: 'Public User' },
        { name: 'MoreMenu', desc: 'Menu tambahan untuk navigasi', role: 'Public User' },
        { name: 'AppUserLogin', desc: 'Halaman log masuk untuk admin/employee', role: 'All' },
        { name: 'AdminDashboard', desc: 'Panel admin dengan statistik dan aksi pantas', role: 'Admin' },
        { name: 'ManageGraves', desc: 'CRUD tanah perkuburan dengan filter negeri', role: 'Admin' },
        { name: 'ManageDeadPersons', desc: 'CRUD rekod si mati dengan upload foto', role: 'Admin' },
        { name: 'ManageOrganisations', desc: 'CRUD organisasi pengurusan kubur', role: 'Admin' },
        { name: 'ManageTahfizCenters', desc: 'CRUD pusat tahfiz dengan maklumat bank', role: 'Admin' },
        { name: 'ManageSuggestions', desc: 'Semak dan lulus/tolak cadangan pengguna', role: 'Admin' },
        { name: 'ManageDonations', desc: 'Sahkan derma dengan resit pembayaran', role: 'Admin' },
        { name: 'ManageTahlilRequests', desc: 'Urus permohonan tahlil (terima/tolak)', role: 'Admin' },
        { name: 'ManageEmployees', desc: 'Urus akaun employee organisasi', role: 'Admin/Organisation' },
        { name: 'SuperadminDashboard', desc: 'Panel superadmin dengan pengurusan penuh', role: 'Superadmin' },
        { name: 'ManageUsers', desc: 'Urus semua pengguna sistem', role: 'Superadmin' },
        { name: 'ManagePermissions', desc: 'Tetapkan kebenaran modul untuk pengguna', role: 'Superadmin' },
        { name: 'ViewLogs', desc: 'Paparan log aktiviti sistem', role: 'Superadmin' },
        { name: 'Documentation', desc: 'Muat turun dokumentasi SRS sistem (PDF)', role: 'Superadmin' }
      ];

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      // Group pages by role
      const roles = ['Public User', 'All', 'Admin', 'Admin/Organisation', 'Superadmin'];
      roles.forEach(role => {
        const rolePages = pages.filter(p => p.role === role);
        if (rolePages.length === 0) return;
        
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${role}:`, 20, y);
        y += 6;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        rolePages.forEach(page => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(`• ${page.name}`, 25, y);
          const splitDesc = doc.splitTextToSize(`  ${page.desc}`, 165);
          doc.text(splitDesc, 30, y + 4);
          y += 4 + splitDesc.length * 4 + 3;
        });
        y += 5;
      });

      // New Page for Tech Stack
      doc.addPage();
      y = 20;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('6. TECHNOLOGY STACK', 20, y);
      y += 10;

      const tech = [
        { cat: 'Frontend', items: ['React 18', 'Tailwind CSS', 'shadcn/ui components', 'Lucide React icons', 'React Query', 'React Router', 'React Leaflet (maps)', 'React QR Scanner', 'jsPDF'] },
        { cat: 'Backend', items: ['Base44 Platform', 'Built-in authentication', 'Entity management', 'File storage', 'Integration APIs'] },
        { cat: 'Features', items: ['Mobile-responsive design', 'QR code scanning', 'Interactive maps', 'Permission system', 'Multi-role access'] }
      ];

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      tech.forEach(t => {
        doc.setFont(undefined, 'bold');
        doc.text(t.cat + ':', 25, y);
        doc.setFont(undefined, 'normal');
        y += 6;
        t.items.forEach(item => {
          doc.text(`  - ${item}`, 30, y);
          y += 5;
        });
        y += 5;
      });

      // New Page for System Flow
      doc.addPage();
      y = 20;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('7. SYSTEM FLOW', 20, y);
      y += 10;

      const flows = [
        {
          name: 'User Flow',
          steps: ['1. Login/Register', '2. Dashboard - pilih aksi', '3. Cari kubur/peta/QR scan', '4. Lihat butiran lengkap', '5. Derma/mohon tahlil', '6. Baca surah & doa']
        },
        {
          name: 'Admin Flow',
          steps: ['1. Login sebagai admin', '2. Admin Dashboard', '3. Urus data (CRUD)', '4. Semak & approve permohonan', '5. Urus cadangan pengguna']
        },
        {
          name: 'Superadmin Flow',
          steps: ['1. Login sebagai superadmin', '2. Superadmin Dashboard', '3. Urus pengguna & kebenaran', '4. Tambah organisasi/admin', '5. Lihat dokumentasi', '6. Kawalan penuh sistem']
        },
        {
          name: 'Permission Flow',
          steps: ['1. Superadmin tetapkan admin_type', '2. Set state & organisation', '3. Configure module permissions', '4. User access based on permissions', '5. Enforcement in all pages']
        }
      ];

      doc.setFontSize(10);
      flows.forEach(flow => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(flow.name, 25, y);
        doc.setFont(undefined, 'normal');
        y += 6;
        flow.steps.forEach(step => {
          doc.text(step, 30, y);
          y += 5;
        });
        y += 8;
      });

      // Footer
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('8. CONCLUSION', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const conclusion = 'QR Kubur adalah sistem pengurusan kubur yang lengkap dengan ciri-ciri moden seperti QR scanning, peta interaktif, sistem derma, perkhidmatan tahlil, dan pengurusan kebenaran yang terperinci. Sistem ini direka untuk memudahkan pengurusan kubur di Malaysia dengan teknologi terkini.';
      const splitConc = doc.splitTextToSize(conclusion, 170);
      doc.text(splitConc, 20, y);

      // Save PDF
      doc.save('QR_Kubur_SRS.pdf');
      toast.success('Dokumen SRS berjaya dimuat turun');
    } catch (error) {
      console.error(error);
      toast.error('Ralat menjana dokumen');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          Dokumentasi Sistem
        </h1>
        {user && (
          <Badge className="bg-purple-100 text-purple-700">
            <Shield className="w-3 h-3 mr-1" />
            {user.role === 'admin' ? (isSuperAdmin ? 'Superadmin' : 'Admin') : 'User'}
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle>Software Requirements Specification (SRS)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Tentang Dokumen</h3>
              <p className="text-gray-600 text-sm">
                Dokumen SRS mengandungi maklumat lengkap tentang sistem QR Kubur termasuk:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Gambaran keseluruhan sistem</li>
                <li>Peranan pengguna (User, Employee, Admin, Superadmin)</li>
                <li>Keperluan fungsional lengkap</li>
                <li>Struktur pangkalan data & entiti</li>
                <li>Senarai halaman sistem</li>
                <li>Teknologi yang digunakan</li>
                <li>Aliran sistem (flow)</li>
                <li>Sistem kebenaran & akses</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Dokumen ini dikemaskini dengan semua perubahan terkini termasuk sistem kebenaran, 
                  pengurusan pengguna, QR scanning dengan kamera, dan ciri-ciri mobile-friendly.
                </span>
              </p>
            </div>

            <Button 
              onClick={generateSRS}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menjana Dokumen...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Muat Turun SRS (PDF)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Catatan Penting</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Dokumen SRS ini dijana secara automatik berdasarkan sistem semasa</li>
            <li>• Semua perubahan dan ciri baharu akan ditambah dalam dokumen</li>
            <li>• Simpan dokumen untuk rujukan teknikal dan dokumentasi projek</li>
            <li>• Dokumen dalam format PDF dan boleh dikongsi dengan stakeholders</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}