import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";

export const LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" as const },
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "hi", label: "हिंदी", dir: "ltr" as const },
  { code: "bn", label: "বাংলা", dir: "ltr" as const },
];

export const DATE_LOCALES: Record<string, string> = {
  ar: "ar-SA",
  en: "en-US",
  hi: "hi-IN",
  bn: "bn-BD",
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ar: { translation: ar }, en: { translation: en }, hi: { translation: hi }, bn: { translation: bn } },
    fallbackLng: "ar",
    supportedLngs: ["ar", "en", "hi", "bn"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "pos-language",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
