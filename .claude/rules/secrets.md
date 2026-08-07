# Secrets

Set via `wrangler secret put`, never committed:

- `JWT_SECRET`
- `SEPAY_WEBHOOK_SECRET` — the **Secret Key** from SePay's webhook settings, which signs the HMAC the webhook route verifies.
- `ZALO_BOT_TOKEN`, `ZALO_GROUP_CHAT_ID`, `ZALO_MANAGER_CHAT_ID` — the bot token from the *Zalo Bot Manager* OA, plus the two destinations. The chat ids are not really secrets, but they are stored the same way rather than as `[vars]`, which would put the owner's personal Zalo id in git.

Leaving any of the three Zalo values empty turns notifications off; the code checks for a value rather than assuming one.

`wrangler.toml` declares `[secrets] required = ["JWT_SECRET", "SEPAY_WEBHOOK_SECRET"]`, so `wrangler deploy` fails if a secret is missing on the Worker instead of shipping a build that 500s on every login.

**That list also decides which secrets reach `c.env` in local dev.** The schema describes `required` as affecting type generation and startup warnings, but the Vite plugin uses it to choose what to copy out of `.dev.vars` into `dist/nha_tro/`; a secret missing from the list is simply `undefined` at runtime, with no warning anywhere. A webhook route was debugged for a while against a 503 that turned out to be exactly this. Add every new secret name here.

Locally the same values live in `.dev.vars` (gitignored; `.dev.vars.example` is the committed template). The Vite plugin copies `.dev.vars` into `dist/nha_tro/` so `vite preview` can run — that is build output, gitignored, and not served to browsers, but it does mean `dist/` holds a real secret on disk.
