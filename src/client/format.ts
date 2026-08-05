const TIEN = new Intl.NumberFormat("vi-VN");

/** 2370000 -> "2.370.000 đ" */
export function tien(value: number): string {
  return `${TIEN.format(value)} đ`;
}

/**
 * 2415000 -> "2,4tr". For chart axes and other places where the full figure
 * does not fit: an axis exists to show magnitude, and the exact number is one
 * hover away in the tooltip.
 */
export function tienRutGon(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

/** "2026-08" -> "Tháng 08/2026" */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-");
  return `Tháng ${month}/${year}`;
}

/** "2026-08-04" -> "04/08/2026" */
export function ngay(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}
