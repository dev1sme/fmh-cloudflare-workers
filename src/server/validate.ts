import { maPattern, type CodePrefix } from "./domain/code";

/**
 * Hand-rolled request validation. Every failure throws a ValidationError whose
 * message is a stable UPPER_SNAKE code (`MISSING_ROOM_NAME`, `INVALID_PERIOD`,
 * …) that the client maps to Vietnamese text. No schema library, deliberately —
 * the number of shapes here does not justify the dependency.
 */
export class ValidationError extends Error {}

const UPPER_SNAKE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export function fail(code: string): never {
  // Codes are the API contract, so a lowercase one is a bug at the call site,
  // not something to paper over at runtime.
  if (!UPPER_SNAKE.test(code)) {
    throw new Error(`Error code must be UPPER_SNAKE, got "${code}"`);
  }
  throw new ValidationError(code);
}

/** `room_name` -> `ROOM_NAME`, so generated codes match the convention. */
function upper(field: string): string {
  return field.toUpperCase();
}

export function requireString(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== "string" || value.trim() === "") fail(`MISSING_${upper(field)}`);
  const trimmed = (value as string).trim();
  if (trimmed.length > maxLength) fail(`TOO_LONG_${upper(field)}`);
  return trimmed;
}

export function optionalString(value: unknown, field: string, maxLength = 200): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, maxLength);
}

/** Non-negative integer — money in VND, or a meter reading. */
export function requireInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) fail(`INVALID_${upper(field)}`);
  return value as number;
}

export function optionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requireInt(value, field);
}

/**
 * A real boolean, not `"true"`. The convention forbids string-wrapped booleans
 * on the way out, and accepting one on the way in is how they get there.
 */
export function optionalBool(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") fail(`INVALID_${upper(field)}`);
  return value as boolean;
}

/** Positive integer used as a foreign key. */
export function requireId(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) fail(`INVALID_${upper(field)}`);
  return value as number;
}

/** Path parameters arrive as strings. */
export function parseId(value: string | undefined, field = "id"): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`INVALID_${upper(field)}`);
  return parsed;
}

export function optionalArea(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) fail(`INVALID_${upper(field)}`);
  return value as number;
}

const KY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Billing period, `YYYY-MM`. */
export function requirePeriod(value: unknown): string {
  if (typeof value !== "string" || !KY_PATTERN.test(value)) fail("INVALID_PERIOD");
  return value as string;
}

export function optionalPeriod(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requirePeriod(value);
}

export function requireDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) fail(`INVALID_${upper(field)}`);
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
  if (typeof value !== "string" || !allowed.includes(value as T)) fail(`INVALID_${upper(field)}`);
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

/**
 * Public code from a path, e.g. `HD3C8EA506` or `RMC7AD24C8`.
 *
 * The prefix is checked, not just the shape: a room code in an invoice path
 * is a 400 rather than a lookup that happens to miss. Validated up front so a
 * probe cannot turn the path into a wildcard, and so a mistyped code fails
 * the same way a missing one does.
 */
export function parseCode(prefix: CodePrefix, value: string | undefined): string {
  const code = (value ?? "").toUpperCase();
  if (!maPattern(prefix).test(code)) fail("INVALID_CODE");
  return code;
}

/** Query string number, e.g. `?room_id=3`. */
export function queryId(value: string | undefined, field: string): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`INVALID_${upper(field)}`);
  return parsed;
}

export async function jsonBody(req: {
  json: () => Promise<unknown>;
}): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (body === null || typeof body !== "object" || Array.isArray(body)) fail("INVALID_BODY");
  return body as Record<string, unknown>;
}
