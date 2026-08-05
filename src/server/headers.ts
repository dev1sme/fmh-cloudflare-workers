import { createMiddleware } from "hono/factory";

import type { AppEnv } from "./types";

/**
 * Response headers for every API route.
 *
 * They are set *before* `next()` on purpose: Hono keeps them as prepared
 * headers and merges them into whatever response the context finally produces,
 * including the ones built by `app.onError` and `app.notFound`. Setting them
 * after `next()` would silently skip every 400 raised by a ValidationError,
 * because a thrown error never returns to this middleware.
 *
 * The SPA's headers live in `public/_headers` — static assets are served
 * straight from Cloudflare and never reach this Worker.
 */
export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  // Invoices, tenant names and session payloads. Nothing here may sit in a
  // browser cache or an intermediary after the response is rendered.
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");

  // JSON needs no subresources at all. If a response is ever coaxed into being
  // rendered as a document, it can load nothing and cannot be framed.
  c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  await next();
});
