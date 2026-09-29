import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { vi } from "./locales/vi";

/** The options the language switcher offers, in the order it shows them. */
export const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
] as const;

export const LANG_STORAGE_KEY = "fmh-lang";

const SUPPORTED = ["vi", "en"] as const;
type Language = (typeof SUPPORTED)[number];

function supported(value: string | null | undefined): Language | null {
  const base = value?.slice(0, 2).toLowerCase();
  return SUPPORTED.find((item) => item === base) ?? null;
}

/**
 * A stored choice, or Vietnamese.
 *
 * `navigator.language` is deliberately not consulted. The tenants here are
 * Vietnamese; a phone set to English is common and says nothing about which
 * language someone wants to read their own bill in. Letting the browser decide
 * meant a first-time visitor on such a phone landed in English, which is the
 * exception, not the default. English stays one click away and is remembered
 * once chosen.
 *
 * Read and written here rather than through `i18next-browser-languagedetector`.
 * The detector was persisting under its own default key while reading the one
 * configured here, so a language picked from the menu survived until the next
 * full page load and then reverted.
 */
function initialLanguage(): Language {
  try {
    return supported(localStorage.getItem(LANG_STORAGE_KEY)) ?? "vi";
  } catch {
    // Storage throws in a locked-down browser; the default still applies.
    return "vi";
  }
}

void i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: initialLanguage(),

  // Vietnamese is the source language, so an English key that has not been
  // written yet renders Vietnamese instead of the raw key.
  fallbackLng: "vi",
  supportedLngs: [...SUPPORTED],

  // React escapes interpolated values already; letting i18next escape too
  // turns a tenant's name with an apostrophe into `&#39;`.
  interpolation: { escapeValue: false },
});

/**
 * Persist the choice, and keep `<html lang>` in step with it. Screen readers
 * pick their pronunciation from that attribute, and Vietnamese read with an
 * English voice is not understandable.
 */
function rememberLanguage(lng: string): void {
  const chosen = supported(lng) ?? "vi";
  document.documentElement.lang = chosen;

  try {
    localStorage.setItem(LANG_STORAGE_KEY, chosen);
  } catch {
    // Not being able to remember the choice is a smaller problem than
    // throwing out of a language change.
  }
}

document.documentElement.lang = i18n.resolvedLanguage ?? "vi";
i18n.on("languageChanged", rememberLanguage);

/** True when the active language is English, for the locale-aware formatters. */
export function isEnglish(): boolean {
  return (i18n.resolvedLanguage ?? "vi").startsWith("en");
}

export default i18n;
