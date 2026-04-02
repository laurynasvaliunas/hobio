import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./translations/en.json";
import lt from "./translations/lt.json";

const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
const supported = ["en", "lt"] as const;
const lng = (supported as readonly string[]).includes(deviceLang) ? deviceLang : "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, lt: { translation: lt } },
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
