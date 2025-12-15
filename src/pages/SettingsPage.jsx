import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, HelpCircle, FileText, LogIn, Shield, Type } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    setFontSize(savedSize);
    applyFontSize(savedSize);
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

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
  };

  const settingsSections = [
    {
      title: 'Paparan',
      items: [
        { type: 'fontSize' }
      ]
    },
    {
      title: 'Maklumat',
      items: [
        { icon: HelpCircle, label: 'Bantuan', action: () => alert('Hubungi support@qrkubur.com') },
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
              {section.items.map((item, i) => (
                item.type === 'fontSize' ? (
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
                ) : (
                  <button
                    key={i}
                    onClick={item.action || (() => navigate(createPageUrl(item.page)))}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </button>
                )
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