# Secrets

Set via `wrangler secret put`, never committed: `JWT_SECRET`, and `SEPAY_WEBHOOK_TOKEN` if the SePay webhook is enabled.

`wrangler.toml` declares `[secrets] required = ["JWT_SECRET", "SEPAY_WEBHOOK_TOKEN"]`, so `wrangler deploy` fails if a secret is missing on the Worker instead of shipping a build that 500s on every login.

**That list also decides which secrets reach `c.env` in local dev.** The schema describes `required` as affecting type generation and startup warnings, but the Vite plugin uses it to choose what to copy out of `.dev.vars` into `dist/nha_tro/`; a secret missing from the list is simply `undefined` at runtime, with no warning anywhere. A webhook route was debugged for a while against a 503 that turned out to be exactly this. Add every new secret name here.

Locally the same values live in `.dev.vars` (gitignored; `.dev.vars.example` is the committed template). The Vite plugin copies `.dev.vars` into `dist/nha_tro/` so `vite preview` can run — that is build output, gitignored, and not served to browsers, but it does mean `dist/` holds a real secret on disk.
