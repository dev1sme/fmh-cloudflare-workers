const TIEN = new Intl.NumberFormat("vi-VN");

/** 2370000 -> "2.370.000 đ" */
export function tien(value: number): string {
  return `${TIEN.format(value)} đ`;
}

/** "2026-08" -> "Tháng 08/2026" */
export function nhanKy(ky: string): string {
  const [year, month] = ky.split("-");
  return `Tháng ${month}/${year}`;
}

/** "2026-08-04" -> "04/08/2026" */
export function ngay(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function kyHienTai(): string {
  return new Date().toISOString().slice(0, 7);
}

export function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}
