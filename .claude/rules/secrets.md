# Secrets

Spec: `docs/deployment.md#secrets`. Read it before adding a secret or wondering where one lives.

Must hold:

- **The repository is public.** No token, key, password, chat id, or personal identifier in any committed file — including `.dev.vars.example`, docs, rules, and comments.
- Secrets are set with `wrangler secret put`; locally they live in `.dev.vars` (gitignored).
- Every secret name goes in `wrangler.toml` `[secrets] required`, or it is silently `undefined` in `c.env` during local dev.
- `BOT_ENCRYPTION_KEY` is effectively permanent: rotating it does not re-encrypt stored bot tokens.
