# Security headers

Set in **two places, and both are needed** — `run_worker_first = ["/api/*"]` means Cloudflare serves every non-API path straight from the assets store without invoking the Worker, so a Hono middleware can never reach the HTML.

- `public/_headers` covers the SPA: CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Vite copies it into `dist/client/`; Cloudflare reads it as configuration and does not serve it. Startup logs `Parsed N valid header rule` — watch that number after editing.
- `securityHeaders` in `src/server/headers.ts` covers `/api/*`: `Cache-Control: no-store` (invoices and tenant names must not sit in a cache), `nosniff`, `Referrer-Policy`, and a `default-src 'none'` CSP.

The middleware sets its headers **before** `await next()`. Hono keeps them as prepared headers and merges them into whatever response the context finally builds, including `app.onError`'s 400s and `app.notFound`'s 404s. Moving them after `next()` silently drops every error response, because a thrown `ValidationError` never returns to the middleware.

`style-src` needs `'unsafe-inline'`: Mantine injects a `<style>` element for its CSS variables at runtime. `script-src` does not — the Vite build emits no inline scripts. `src/client/components/VietQR.tsx` uses `dangerouslySetInnerHTML`, but the SVG comes from `@paulmillr/qr` as `<path>` data, not from interpolated text.

HSTS is `max-age=31536000; includeSubDomains`, deliberately **without** `preload`. A browser that loads the site once refuses plain HTTP to that exact hostname for a year afterwards, so shortening or removing the header does not take effect immediately. The pin is per-host, so the move to `rentals.dev1sme.cloud` started a fresh year on the new name and left the old pin in place on the old one.

`_headers` only applies to a real build — `npm run dev` does not serve it. Verify with `npm run build && ./node_modules/.bin/vite preview`, then check both an asset response and an API response.
