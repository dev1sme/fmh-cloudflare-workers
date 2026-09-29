# Security headers

Spec: `docs/security-headers.md`. Read it before changing `public/_headers`, `src/server/headers.ts`, CSP, or the inline theme script in `index.html`.

Must hold:

- Headers live in two places and both are needed: `_headers` for the SPA, `securityHeaders` for Worker routes.
- `securityHeaders` sets headers before `await next()`; after it, error responses lose them.
- `script-src` carries a sha256 of the one inline script, never `'unsafe-inline'`. Editing that script means regenerating the hash (command in `_headers`).
- HSTS without `preload`.
- Verify with `npm run build && ./node_modules/.bin/vite preview` — `npm run dev` does not serve `_headers`. Watch the `Parsed N valid header rule` count.
