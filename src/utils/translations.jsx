import { getAdminTranslation, getCurrentLanguage } from '@/components/Translations';

let currentLang = getCurrentLanguage();

window.addEventListener('storage', () => {
  currentLang = getCurrentLanguage();
});

export const translate = (key) => {
  return getAdminTranslation(key, currentLang);
};
