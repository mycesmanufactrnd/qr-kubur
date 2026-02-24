import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { HelpCircle, FileText, LogIn, Shield, Type, Globe, Palette } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import { useLoginGoogle } from '@/utils/auth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('ms');
  const [theme, setTheme] = useState('light');
  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem('appUserAuth'));

  const { login, loading, error, setError } = useLoginGoogle();

  const handleCredentialResponse = (response) => {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    const { email, name, picture } = payload || {};
    
    console.log("Encoded JWT ID token:", response.credential);
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("Picture:", picture);

    login(response.credential);
  };

  useEffect(() => {
    if (isAdmin) return;

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id) return false;

      window.google.accounts.id.initialize({
        client_id: "52708588654-9680sm9l110i7qrag9g6uf3sbf0h6cb1.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("guest-google-signin"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
        }
      );

      return true;
    };

    const interval = setInterval(() => {
      if (initializeGoogleSignIn()) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    const savedLanguage = localStorage.getItem('language') || 'ms';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    setFontSize(savedSize);
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    
    applyFontSize(savedSize);
    applyTheme(savedTheme);

    const appUserAuth = sessionStorage.getItem('appUserAuth');
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
      title: translate('Display'),
      items: [
        { type: 'fontSize' },
        { type: 'language' },
        { type: 'theme' }
      ]
    },
    {
      title: translate('Support'),
      items: [
        { icon: HelpCircle, label: translate('FAQ'), action: () => alert('FAQ coming soon') },
        { icon: FileText, label: translate('Contact / Feedback'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Maklum Balas QR Kubur' },
        { icon: Shield, label: translate('Report Bug'), action: () => window.location.href = 'mailto:support@qrkubur.com?subject=Laporan Pepijat' },
      ]
    },
    {
      title: translate('Information'),
      items: [
        { icon: FileText, label: translate('Terms & Conditions'), page: 'TermsAndConditions' },
        { icon: Shield, label: translate('Privacy Policy'), page: 'PrivacyPolicy' },
        ...(isAdmin 
          ? [{ icon: LogIn, label: translate('Log Out'), action: () => {
              localStorage.removeItem('appUserAuth');
              window.location.href = createPageUrl('AppUserLogin');
            }}] 
          : [{ icon: LogIn, label: translate('Admin Login'), page: 'AppUserLogin' }]
        ),
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-2">
      <BackNavigation title={translate('Settings')} />
      {!isAdmin && (
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {translate('Guest Google Sign-In')}
            </p>
            <div id="guest-google-signin" className="g-signin2" data-onsuccess="onSignIn"></div>
          </CardContent>
        </Card>
      )}
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
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('Font Size')}</Label>
                          <Select value={fontSize} onValueChange={handleFontSizeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              <SelectItem value="small">{translate('Small')}</SelectItem>
                              <SelectItem value="medium">{translate('Medium')}</SelectItem>
                              <SelectItem value="large">{translate('Large')}</SelectItem>
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
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('Language')}</Label>
                          <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              <SelectItem value="ms">{translate('Malay')}</SelectItem>
                              <SelectItem value="en">{translate('English')}</SelectItem>
                              <SelectItem value="ar">{translate('Arabic')}</SelectItem>
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
                          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{translate('Theme')}</Label>
                          <Select value={theme} onValueChange={handleThemeChange}>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              <SelectItem value="light">{translate('Light')}</SelectItem>
                              <SelectItem value="dark">{translate('Dark')}</SelectItem>
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
        <p className="text-xs text-gray-400">{translate('Version')}</p>
      </div>
    </div>
  );
}
