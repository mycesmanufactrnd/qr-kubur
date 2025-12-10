import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Bell, Shield, HelpCircle, FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Maklumat',
      items: [
        { icon: Info, label: 'Tentang Sistem', page: 'AboutSystem' },
        { icon: HelpCircle, label: 'Bantuan', action: () => alert('Hubungi support@qrkubur.com') },
        { icon: FileText, label: 'Terma & Syarat', action: () => alert('Terma & Syarat') },
        { icon: Login, label: 'Admin Login', page: 'AppUserLogin' },
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-2">
      <h1 className="text-xl font-bold text-gray-900 pt-2">Tetapan</h1>
      
      {settingsSections.map((section, idx) => (
        <Card key={idx} className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="p-3 border-b">
              <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="divide-y">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action || (() => navigate(`/${item.page}`))}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">Versi 1.0.0</p>
      </div>
    </div>
  );
}