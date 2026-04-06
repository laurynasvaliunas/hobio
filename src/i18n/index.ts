import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import lt from "./translations/lt.json";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, lt: { translation: lt } },
  lng: "lt",
  fallbackLng: "lt",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
  // RN has no Suspense boundary by default; true causes useTranslation to throw a Promise → white screen
  react: { useSuspense: false },
});

export default i18n;
