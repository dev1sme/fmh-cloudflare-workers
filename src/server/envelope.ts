import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ApiFailure, ApiSuccess } from "../shared/types";
import type { AppEnv } from "./types";

/**
 * The response envelope required by `.claude/rules/envelop-conventions.md`.
 *
 * Route handlers never call `c.json` directly — they go through `ok`, `failure`
 * or `notFound` so that `success`, `message` and `meta.timestamp` cannot be
 * forgotten on one endpoint and present on the next.
 *
 * `data` keeps the same inner shape each route always returned (`{ invoices }`,
 * `{ room }`, …) rather than being flattened, so the client only had to learn
 * to unwrap one level.
 */
function meta() {
  // Unix seconds. The convention requires a number, not an ISO string.
  return { timestamp: Math.floor(Date.now() / 1000) };
}

export function ok<T>(
  c: Context<AppEnv>,
  data: T,
  message: string,
  status: ContentfulStatusCode = 200,
) {
  return c.json({ success: true, message, data, meta: meta() } satisfies ApiSuccess<T>, status);
}

/** Every error code is UPPER_SNAKE — see `.claude/rules/envelop-conventions.md`. */
const UPPER_SNAKE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/**
 * `code` is the contract the client switches on; `message` is prose for humans
 * reading logs or integrating against the API, and is never shown to the user —
 * the SPA renders its own Vietnamese from the code.
 *
 * A code that is not UPPER_SNAKE throws rather than shipping: the whole point
 * of the convention is that an integrator can switch on the shape, and one
 * stray `not_found` in a corner is exactly what breaks that.
 */
export function failure(
  c: Context<AppEnv>,
  code: string,
  message: string,
  status: ContentfulStatusCode,
  details: ApiFailure["error"]["details"] = null,
) {
  if (!UPPER_SNAKE.test(code)) {
    throw new Error(`Error code must be UPPER_SNAKE, got "${code}"`);
  }

  return c.json(
    { success: false, message, error: { code, details }, meta: meta() } satisfies ApiFailure,
    status,
  );
}

/** The one failure nearly every route needs. */
export function notFound(c: Context<AppEnv>, message = "Resource not found.") {
  return failure(c, "NOT_FOUND", message, 404);
}

/**
 * Field-keyed details for a validation code.
 *
 * Validation codes are generated from field names (`MISSING_ROOM_NAME`,
 * `INVALID_PERIOD`, `TOO_LONG_FULL_NAME`), so the field is recoverable — the
 * key is lowercased back to the field name the caller actually sent. Domain
 * codes like `ELECTRICITY_END_BELOW_START` name no single field, and get null.
 */
export function chiTietValidation(code: string): ApiFailure["error"]["details"] {
  const match = /^(?:MISSING|INVALID|TOO_LONG)_(.+)$/.exec(code);
  return match ? { [match[1]!.toLowerCase()]: [code] } : null;
}
