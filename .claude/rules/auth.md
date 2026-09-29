# Auth

Spec: `docs/auth.md`. Read it before touching login, sessions, roles, accounts, or password hashing.

Must hold:

- **Never tune PBKDF2 iterations from a local benchmark.** 10,000 is measured on the deployed Worker; this machine is ~3× faster than Cloudflare. Re-measure with `wrangler tail --format json` (spaced probes) after any change. Do not lower to 5k either.
- The dummy record's iteration count is interpolated from `PBKDF2_ITERATIONS`; never hard-code it.
- Plaintext passwords are never stored, logged, or readable back. Returned exactly once in the create/reset response. No "view password" feature, ever.
- Two role middlewares only (`requireManager`, `requireTenant`); no role-agnostic `requireAuth`. Every mount carries its own guard; no `/api/*` wildcard middleware.
- `/api/me/*` takes the room from the token, never the request; another room's invoice is 404, not 403.
- Self-service change-password requires the current password; manager reset does not.
- Web Crypto (`crypto.subtle`) and constant-time compare only. No session table. No rate limiting (would need KV/DO).
