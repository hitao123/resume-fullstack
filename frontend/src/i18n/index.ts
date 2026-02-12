import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const STORAGE_KEY = 'app_language';

function normalizeLang(lang?: string) {
  const l = (lang || '').toLowerCase();
  if (l.startsWith('zh')) return 'zh-CN';
  if (l.startsWith('en')) return 'en-US';
  return 'zh-CN';
}

const saved = normalizeLang(localStorage.getItem(STORAGE_KEY) || undefined);
const browser = normalizeLang(navigator.language);
const defaultLang = saved || browser;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng: defaultLang,
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, normalizeLang(lng));
  } catch {
    // ignore
  }
});

export default i18n;

