import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./translations/en.json";
import lt from "./translations/lt.json";

const supported = ["en", "lt"] as const;

/**
 * Pick initial UI language from the device locale (Expo / OS settings).
 * - Region Lithuania (LT) → Lithuanian, so phones sold / configured for LT default to lt even if system UI is English.
 * - Otherwise: use device language when it is en or lt, else English.
 */
function resolveInitialLanguage(): "en" | "lt" {
  const primary = Localization.getLocales()[0];
  const region = primary?.regionCode;
  const languageCode = primary?.languageCode ?? "en";

  if (region === "LT") {
    return "lt";
  }

  if ((supported as readonly string[]).includes(languageCode)) {
    return languageCode as "en" | "lt";
  }

  return "en";
}

const lng = resolveInitialLanguage();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, lt: { translation: lt } },
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
  // RN has no Suspense boundary by default; true causes useTranslation to throw a Promise → white screen
  react: { useSuspense: false },
});

export default i18n;
