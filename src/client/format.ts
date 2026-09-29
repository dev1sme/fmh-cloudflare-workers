import i18n, { isEnglish } from "./i18n";

/**
 * These are plain functions, not hooks, because they are called from tooltips,
 * chart formatters and toast text where a hook cannot go. They read the active
 * language straight off the i18next instance.
 *
 * That means they do not themselves trigger a re-render when the language
 * changes — `App.tsx` subscribes with `useTranslation()` so the whole tree
 * re-renders instead. At this size that is cheaper than threading a locale
 * through every call site.
 */

const NUMBER_FORMATS = { vi: new Intl.NumberFormat("vi-VN"), en: new Intl.NumberFormat("en-US") };

function numberFormat(): Intl.NumberFormat {
  return isEnglish() ? NUMBER_FORMATS.en : NUMBER_FORMATS.vi;
}

function locale(): string {
  return isEnglish() ? "en-US" : "vi-VN";
}

/** 2370000 -> "2.370.000 đ" (vi) / "2,370,000 đ" (en) */
export function money(value: number): string {
  return i18n.t("format.currency", { value: numberFormat().format(value) });
}

/**
 * 2415000 -> "2,4tr" (vi) / "2.4M" (en). For chart axes and other places where
 * the full figure does not fit: an axis exists to show magnitude, and the exact
 * number is one hover away in the tooltip.
 */
export function moneyShort(value: number): string {
  const shorten = (divisor: number) =>
    (value / divisor).toLocaleString(locale(), { maximumFractionDigits: 1 });

  if (value >= 1_000_000_000) return i18n.t("format.billion", { value: shorten(1_000_000_000) });
  if (value >= 1_000_000) return i18n.t("format.million", { value: shorten(1_000_000) });
  if (value >= 1_000) return i18n.t("format.thousand", { value: Math.round(value / 1_000) });
  return String(value);
}

/** "2026-08" -> "Tháng 08/2026" (vi) / "Aug 2026" (en) */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-");

  // Built in UTC on purpose: a local-time date for the 1st can land on the
  // previous month west of Greenwich and name the wrong month.
  const monthName = new Intl.DateTimeFormat(locale(), { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(Number(year), Number(month) - 1, 1)),
  );

  return i18n.t("format.period", { month, year, monthName });
}

/**
 * Separators for Mantine's `NumberInput`, which takes them as props rather
 * than deriving them from a locale. Hard-coding the Vietnamese pair left an
 * English-language manager typing rent into a field that groups with dots.
 */
export function separators(): { thousandSeparator: string; decimalSeparator: string } {
  return isEnglish()
    ? { thousandSeparator: ",", decimalSeparator: "." }
    : { thousandSeparator: ".", decimalSeparator: "," };
}

/** "2026-08" -> "08/26", short enough for a chart axis tick. */
export function periodTick(period: string): string {
  const [year, month] = period.split("-");
  return `${month}/${year?.slice(2)}`;
}

/**
 * "2026-08-04" -> "04/08/2026", in both languages.
 *
 * Deliberately not localised. Switching to en-US would render the same day as
 * "08/04/2026", so a tenant who flips the language toggle on an invoice sees
 * two different dates for one payment and has no way to tell which reading is
 * right.
 */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
