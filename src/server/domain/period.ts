/** Billing period helpers. `period` is always `YYYY-MM`. */

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function previousPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function bayGio(): string {
  return new Date().toISOString();
}
