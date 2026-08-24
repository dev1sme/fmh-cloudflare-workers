# Secrets

**The GitHub repository is public.** Anything committed is world-readable, which is why `.dev.vars` is gitignored and why no token, key or password belongs in `.dev.vars.example`, a rule file, or a comment. Check before adding anything that identifies a person or authorises an action.

Set via `wrangler secret put`, never committed:

- `JWT_SECRET`
- `SEPAY_WEBHOOK_SECRET` — the **Secret Key** from SePay's webhook settings, which signs the HMAC the webhook route verifies.
- `BOT_ENCRYPTION_KEY` — 32 base64-encoded bytes (`openssl rand -base64 32`), encrypting the notification bot tokens in `bots.token`. Unset means the bot routes answer 503 rather than storing a token they could never read back. **Rotating it does not re-encrypt existing rows** — every bot token has to be re-entered in Thông báo — so treat it as permanent. → `notifications.md`

The three `ZALO_*` variables are **gone**. The bot token, the tenants' group and the manager's chat are rows in `bots` / `bot_targets` now, managed from Thông báo: env vars could hold one bot and two chat ids, not N of each. The chat ids that used to sit in `.dev.vars.example` moved into the production D1 with them, so nothing about a Zalo destination is in git any more.

`wrangler.toml` declares `[secrets] required = [...]`. A missing name produces `▲ WARNING Missing required secrets: …` during `vite build` — that much is observed. Whether `wrangler deploy` then **refuses** was never actually tested; this file used to assert it does. Treat the list as a loud reminder, not a gate, until someone deploys with a name missing and reports which it was.

**That list also decides which secrets reach `c.env` in local dev.** The schema describes `required` as affecting type generation and startup warnings, but the Vite plugin uses it to choose what to copy out of `.dev.vars` into `dist/nha_tro/`; a secret missing from the list is simply `undefined` at runtime, with no warning anywhere. A webhook route was debugged for a while against a 503 that turned out to be exactly this. Add every new secret name here.

Locally the same values live in `.dev.vars` (gitignored; `.dev.vars.example` is the committed template). The Vite plugin copies `.dev.vars` into `dist/nha_tro/` so `vite preview` can run — that is build output, gitignored, and not served to browsers, but it does mean `dist/` holds a real secret on disk.
