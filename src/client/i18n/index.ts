import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { vi } from "./locales/vi";

/** The options the language switcher offers, in the order it shows them. */
export const NGON_NGU = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
] as const;

export const LUU_TAI = "fmh-lang";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { vi: { translation: vi }, en: { translation: en } },

    // Vietnamese is the source language, so an English key that has not been
    // written yet renders Vietnamese instead of the raw key. That is what lets
    // the manager screens stay untranslated without looking broken.
    fallbackLng: "vi",
    supportedLngs: ["vi", "en"],
    // A browser reporting `vi-VN` or `en-GB` resolves to `vi` / `en` rather
    // than falling through to the fallback.
    nonExplicitSupportedLngs: true,

    // React escapes interpolated values already; letting i18next escape too
    // turns a tenant's name with an apostrophe into `&#39;`.
    interpolation: { escapeValue: false },

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LUU_TAI,
      caches: ["localStorage"],
    },
  });

/**
 * Keep `<html lang>` in step with the choice. Screen readers pick their
 * pronunciation from it, and Vietnamese read with an English voice is not
 * understandable.
 */
function datNgonNguHtml(lng: string): void {
  document.documentElement.lang = lng.startsWith("en") ? "en" : "vi";
}

datNgonNguHtml(i18n.resolvedLanguage ?? "vi");
i18n.on("languageChanged", datNgonNguHtml);

/** True when the active language is English, for the locale-aware formatters. */
export function laTiengAnh(): boolean {
  return (i18n.resolvedLanguage ?? "vi").startsWith("en");
}

export default i18n;
