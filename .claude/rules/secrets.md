# Secrets

Set via `wrangler secret put`, never committed: `JWT_SECRET`, and `SEPAY_WEBHOOK_TOKEN` if the SePay webhook is enabled.

`wrangler.toml` declares `[secrets] required = ["JWT_SECRET"]`, so `wrangler deploy` fails if the secret is missing on the Worker instead of shipping a build that 500s on every login. Add new secret names there too.

Locally the same values live in `.dev.vars` (gitignored; `.dev.vars.example` is the committed template). The Vite plugin copies `.dev.vars` into `dist/nha_tro/` so `vite preview` can run — that is build output, gitignored, and not served to browsers, but it does mean `dist/` holds a real secret on disk.
