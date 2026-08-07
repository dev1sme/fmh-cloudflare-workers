import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { vi } from "./locales/vi";

/** The options the language switcher offers, in the order it shows them. */
export const NGON_NGU = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
] as const;

export const LUU_TAI = "fmh-lang";

const HO_TRO = ["vi", "en"] as const;
type NgonNgu = (typeof HO_TRO)[number];

function hopLe(value: string | null | undefined): NgonNgu | null {
  const goc = value?.slice(0, 2).toLowerCase();
  return HO_TRO.find((item) => item === goc) ?? null;
}

/**
 * Stored choice first, browser preference second, Vietnamese last.
 *
 * Read and written here rather than through `i18next-browser-languagedetector`.
 * The detector was persisting under its own default key while reading the one
 * configured here, so a language picked from the menu survived until the next
 * full page load and then reverted. Ten lines of explicit storage removes both
 * the bug and the dependency, and the fallback chain is now readable in one
 * place.
 */
function ngonNguBanDau(): NgonNgu {
  try {
    const daLuu = hopLe(localStorage.getItem(LUU_TAI));
    if (daLuu) return daLuu;
  } catch {
    // Storage can throw in a locked-down browser; the browser preference and
    // the fallback below still give a usable answer.
  }

  return hopLe(navigator.language) ?? "vi";
}

void i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: ngonNguBanDau(),

  // Vietnamese is the source language, so an English key that has not been
  // written yet renders Vietnamese instead of the raw key.
  fallbackLng: "vi",
  supportedLngs: [...HO_TRO],

  // React escapes interpolated values already; letting i18next escape too
  // turns a tenant's name with an apostrophe into `&#39;`.
  interpolation: { escapeValue: false },
});

/**
 * Persist the choice, and keep `<html lang>` in step with it. Screen readers
 * pick their pronunciation from that attribute, and Vietnamese read with an
 * English voice is not understandable.
 */
function ghiNhoNgonNgu(lng: string): void {
  const chon = hopLe(lng) ?? "vi";
  document.documentElement.lang = chon;

  try {
    localStorage.setItem(LUU_TAI, chon);
  } catch {
    // Not being able to remember the choice is a smaller problem than
    // throwing out of a language change.
  }
}

document.documentElement.lang = i18n.resolvedLanguage ?? "vi";
i18n.on("languageChanged", ghiNhoNgonNgu);

/** True when the active language is English, for the locale-aware formatters. */
export function laTiengAnh(): boolean {
  return (i18n.resolvedLanguage ?? "vi").startsWith("en");
}

export default i18n;
