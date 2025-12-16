import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, HelpCircle, FileText, LogIn, Shield, Type, Globe, Palette } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTranslation, getCurrentLanguage } from '../components/translations';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('ms');
  const [theme, setTheme] = useState('system');
  const [lang, setLang] = useState('ms');

  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    const savedLanguage = localStorage.getItem('language') || 'ms';
    const savedTheme = localStorage.getItem('theme') || 'system';
    
    setFontSize(savedSize);
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    setLang(savedLanguage);
    
    applyFontSize(savedSize);
    applyTheme(savedTheme);
  }, []);

  const t = (key) => getTranslation(key, lang);

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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setLang(newLang);
    localStorage.setItem('language', newLang);
    window.location.reload();
  };

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    applyTheme(selectedTheme);
  };

  const settingsSections = [
    {
      title: t('display'),
      items: [
        { type: 'fontSize' },
        { type: 'language' },
        { type: 'theme' }
      ]
    },
    {
      title: t('support'),
      items: [
        { icon: HelpCircle, label: t('faq'), action: () => alert('FAQ coming soon') },
        { icon: FileText, label: t('contactFeedback'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Maklum Balas QR Kubur' },
        { icon: Shield, label: t('reportBug'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Laporan Pepijat' },
      ]
    },
    {
      title: t('information'),
      items: [
        { icon: FileText, label: t('termsConditions'), page: 'TermsAndConditions' },
        { icon: Shield, label: t('privacyPolicy'), page: 'PrivacyPolicy' },
        { icon: LogIn, label: t('adminLogin'), page: 'AppUserLogin' },
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
      </div>
      
      {settingsSections.map((section, idx) => (
        <Card key={idx} className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-0">
            <div className="p-3 border-b dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h2>
            </div>
            <div className="divide-y">
              {section.items.map((item, i) => {
                if (item.type === 'fontSize') {
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-3">
                        <Type className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{t('fontSize')}</Label>
                          <Select value={fontSize} onValueChange={handleFontSizeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                              <SelectItem value="small" className="text-gray-900 dark:text-white">{t('small')}</SelectItem>
                              <SelectItem value="medium" className="text-gray-900 dark:text-white">{t('medium')}</SelectItem>
                              <SelectItem value="large" className="text-gray-900 dark:text-white">{t('large')}</SelectItem>
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
                        <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{t('language')}</Label>
                          <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                              <SelectItem value="ms" className="text-gray-900 dark:text-white">Bahasa Melayu</SelectItem>
                              <SelectItem value="en" className="text-gray-900 dark:text-white">English</SelectItem>
                              <SelectItem value="ar" className="text-gray-900 dark:text-white">العربية</SelectItem>
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
                        <Palette className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{t('theme')}</Label>
                          <Select value={theme} onValueChange={handleThemeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                              <SelectItem value="light" className="text-gray-900 dark:text-white">{t('light')}</SelectItem>
                              <SelectItem value="dark" className="text-gray-900 dark:text-white">{t('dark')}</SelectItem>
                              <SelectItem value="system" className="text-gray-900 dark:text-white">{t('system')}</SelectItem>
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
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
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