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

/**
 * `code` is the contract the client switches on; `message` is prose for humans
 * reading logs or integrating against the API, and is never shown to the user —
 * the SPA renders its own Vietnamese from the code.
 */
export function failure(
  c: Context<AppEnv>,
  code: string,
  message: string,
  status: ContentfulStatusCode,
  details: ApiFailure["error"]["details"] = null,
) {
  return c.json(
    { success: false, message, error: { code, details }, meta: meta() } satisfies ApiFailure,
    status,
  );
}

/** The one failure nearly every route needs. */
export function notFound(c: Context<AppEnv>, message = "Resource not found.") {
  return failure(c, "not_found", message, 404);
}

/**
 * Field-keyed details for a validation code.
 *
 * Validation codes are generated from field names (`missing_ten_phong`,
 * `invalid_ky`, `too_long_ho_ten`), so the field is recoverable. Domain codes
 * like `dien_moi_nho_hon_dien_cu` name no single field and carry no details.
 */
export function chiTietValidation(code: string): ApiFailure["error"]["details"] {
  const match = /^(?:missing|invalid|too_long)_(.+)$/.exec(code);
  return match ? { [match[1]!]: [code] } : null;
}
