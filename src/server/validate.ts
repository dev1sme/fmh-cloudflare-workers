/**
 * Hand-rolled request validation. Every failure throws a ValidationError whose
 * message is a stable code (`missing_ten_phong`, `invalid_ky`, …) that the
 * client maps to Vietnamese text. No schema library, deliberately — the number
 * of shapes here does not justify the dependency.
 */
export class ValidationError extends Error {}

export function fail(code: string): never {
  throw new ValidationError(code);
}

export function requireString(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== "string" || value.trim() === "") fail(`missing_${field}`);
  const trimmed = (value as string).trim();
  if (trimmed.length > maxLength) fail(`too_long_${field}`);
  return trimmed;
}

export function optionalString(value: unknown, field: string, maxLength = 200): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, maxLength);
}

/** Non-negative integer — money in VND, or a meter reading. */
export function requireInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) fail(`invalid_${field}`);
  return value as number;
}

export function optionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requireInt(value, field);
}

/** Positive integer used as a foreign key. */
export function requireId(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) fail(`invalid_${field}`);
  return value as number;
}

/** Path parameters arrive as strings. */
export function parseId(value: string | undefined, field = "id"): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`invalid_${field}`);
  return parsed;
}

export function optionalArea(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) fail(`invalid_${field}`);
  return value as number;
}

const KY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Billing period, `YYYY-MM`. */
export function requireKy(value: unknown): string {
  if (typeof value !== "string" || !KY_PATTERN.test(value)) fail("invalid_ky");
  return value as string;
}

export function optionalKy(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requireKy(value);
}

export function requireDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) fail(`invalid_${field}`);
  return value as string;
}

export function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireDate(value, field);
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) fail(`invalid_${field}`);
  return value as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return requireEnum(value, field, allowed);
}

/** Query string number, e.g. `?room_id=3`. */
export function queryId(value: string | undefined, field: string): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`invalid_${field}`);
  return parsed;
}

export async function jsonBody(req: {
  json: () => Promise<unknown>;
}): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (body === null || typeof body !== "object" || Array.isArray(body)) fail("invalid_body");
  return body as Record<string, unknown>;
}
