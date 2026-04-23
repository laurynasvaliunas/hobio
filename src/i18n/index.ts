import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import lt from "./translations/lt.json";
import { createLogger } from "../lib/logger";

const log = createLogger("i18n");

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, lt: { translation: lt } },
    lng: "lt",
    fallbackLng: "lt",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
    // RN has no Suspense boundary by default; true causes useTranslation to throw a Promise → white screen
    react: { useSuspense: false },
  })
  .then(() => {
    log.event("initialized");
  })
  .catch((err) => {
    // Never let an i18n init error hang the splash screen forever. Log it and
    // mark the instance as initialized so the UI can proceed (it will simply
    // render keys instead of translations if resources were unavailable).
    log.error("init_failed", { name: (err as Error)?.name });
  });

export default i18n;
