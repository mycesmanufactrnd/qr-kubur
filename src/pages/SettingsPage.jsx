import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, HelpCircle, FileText, LogIn, Shield, Type, Globe, Palette } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('ms');
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    const savedLanguage = localStorage.getItem('language') || 'ms';
    const savedTheme = localStorage.getItem('theme') || 'system';
    
    setFontSize(savedSize);
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    
    applyFontSize(savedSize);
    applyTheme(savedTheme);
  }, []);

  const applyFontSize = (size) => {
    const root = document.documentElement;
    switch(size) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      default:
        root.style.fontSize = '16px';
    }
  };

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
    } else if (selectedTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Language change would require app reload or i18n implementation
    alert('Perubahan bahasa akan dilaksanakan dalam versi akan datang');
  };

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    applyTheme(selectedTheme);
  };

  const settingsSections = [
    {
      title: 'Paparan',
      items: [
        { type: 'fontSize' },
        { type: 'language' },
        { type: 'theme' }
      ]
    },
    {
      title: 'Sokongan',
      items: [
        { icon: HelpCircle, label: 'FAQ', action: () => alert('Soalan Lazim akan datang tidak lama lagi') },
        { icon: FileText, label: 'Hubungi / Maklum Balas', action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Maklum Balas QR Kubur' },
        { icon: Shield, label: 'Laporkan Pepijat', action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Laporan Pepijat' },
      ]
    },
    {
      title: 'Maklumat',
      items: [
        { icon: FileText, label: 'Terma & Syarat', page: 'TermsAndConditions' },
        { icon: Shield, label: 'Dasar Privasi', page: 'PrivacyPolicy' },
        { icon: LogIn, label: 'Admin Login', page: 'AppUserLogin' },
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
              {section.items.map((item, i) => {
                if (item.type === 'fontSize') {
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-3">
                        <Type className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 mb-2 block">Saiz Font</Label>
                          <Select value={fontSize} onValueChange={handleFontSizeChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Kecil</SelectItem>
                              <SelectItem value="medium">Sederhana</SelectItem>
                              <SelectItem value="large">Besar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                } else if (item.type === 'language') {
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 mb-2 block">Bahasa</Label>
                          <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ms">Bahasa Melayu</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ar">العربية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                } else if (item.type === 'theme') {
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 mb-2 block">Tema</Label>
                          <Select value={theme} onValueChange={handleThemeChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Terang</SelectItem>
                              <SelectItem value="dark">Gelap</SelectItem>
                              <SelectItem value="system">Mengikut Sistem</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button
                      key={i}
                      onClick={item.action || (() => navigate(createPageUrl(item.page)))}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </button>
                  );
                }
              })}
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