import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { ArrowLeft, HelpCircle, FileText, LogIn, Shield, Type, Globe, Palette } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translate } from '@/utils/translations.jsx';
import BackNavigation from '@/components/BackNavigation';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('ms');
  const [theme, setTheme] = useState('light');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    const savedLanguage = localStorage.getItem('language') || 'ms';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    setFontSize(savedSize);
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    
    applyFontSize(savedSize);
    applyTheme(savedTheme);

    const appUserAuth = localStorage.getItem('appUserAuth');
    if (appUserAuth) {
      setIsAdmin(true);
    }
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
    } else {
      root.classList.remove('dark');
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
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
      title: translate('display'),
      items: [
        { type: 'fontSize' },
        { type: 'language' },
        { type: 'theme' }
      ]
    },
    {
      title: translate('support'),
      items: [
        { icon: HelpCircle, label: translate('faq'), action: () => alert('FAQ coming soon') },
        { icon: FileText, label: translate('contactFeedback'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Maklum Balas QR Kubur' },
        { icon: Shield, label: translate('reportBug'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Laporan Pepijat' },
      ]
    },
    {
      title: translate('information'),
      items: [
        { icon: FileText, label: translate('termsConditions'), page: 'TermsAndConditions' },
        { icon: Shield, label: translate('privacyPolicy'), page: 'PrivacyPolicy' },
        ...(isAdmin 
          ? [{ icon: LogIn, label: 'Log Keluar', action: () => {
              localStorage.removeItem('appUserAuth');
              window.location.href = createPageUrl('AppUserLogin');
            }}] 
          : [{ icon: LogIn, label: translate('adminLogin'), page: 'AppUserLogin' }]
        ),
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-2">
      <BackNavigation title="Settings" />
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
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('fontSize')}</Label>
                          <Select value={fontSize} onValueChange={handleFontSizeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              <SelectItem value="small">{translate('small')}</SelectItem>
                              <SelectItem value="medium">{translate('medium')}</SelectItem>
                              <SelectItem value="large">{translate('large')}</SelectItem>
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
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('language')}</Label>
                          <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
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
                        <Palette className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div className="flex-1">
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('theme')}</Label>
                          <Select value={theme} onValueChange={handleThemeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              <SelectItem value="light">{translate('light')}</SelectItem>
                              <SelectItem value="dark">{translate('dark')}</SelectItem>
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