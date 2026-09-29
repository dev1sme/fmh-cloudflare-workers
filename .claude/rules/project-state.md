# Project state

Built so far: the Vite + Hono + Wrangler scaffold, `migrations/0001_init.sql` (schema + seed), cookie-session auth with two roles, the full management API (buildings, rooms, tenants, readings, invoices, payments), the read-only tenant API under `/api/me`, and the SPA screens for both roles.

**Deployed** at `https://rentals.dev1sme.cloud` (account `letuanthong0305@gmail.com`, zone `dev1sme.cloud`). It was `fmh.dev1sme.cloud` until the app was renamed to Rentals Hub; that hostname was dropped outright rather than kept alongside, so a saved link to it fails rather than going quietly stale. Its DNS record may still exist in the zone — Wrangler adds a record for a custom domain but does not remove one when the route goes away. The custom domain is declared as `routes` in `wrangler.toml`, which **disables the `*.workers.dev` URL** — that is intentional; re-enable it with `workers_dev = true` if a fallback URL is ever wanted.

All nine migrations are applied to the remote D1 — verified with `SELECT COUNT(*) FROM d1_migrations` returning 9, not by counting files.

That distinction is the whole reason this line reads the way it does. It once said "all applied" on the strength of the directory listing while the remote was four behind, so every write answered 500 on production: no table had its `code` column, which every insert names and `listRooms` selects. Check the table, never the directory.

`wrangler d1 migrations apply --remote` failed once with `code 7403` ("account is not authorized") and then succeeded on an immediate retry with no change in between. Retry before believing it.

Zalo notifications moved from the three `ZALO_*` secrets to the `bots` / `bot_targets` tables (migration 0009, applied remote). `BOT_ENCRYPTION_KEY` is set on the Worker.

**The `ZALO_*` secrets were never on the Worker at all** — `wrangler secret list` returns exactly `BOT_ENCRYPTION_KEY`, `JWT_SECRET`, `SEPAY_WEBHOOK_SECRET`. So Zalo notifications have never run on production; the feature only ever worked locally, against `.dev.vars`. There is nothing to clean up, and this file previously claimed those secrets were set, which was never checked against the Worker.

**`bots` is still empty on production, so notifications are off there.** Turning them on is: deploy the code, then enter the bot and its destinations through Thông báo. The live bot token and the two chat ids are in the local `.dev.vars` — that is the only place they exist now.

`JWT_SECRET` and `SEPAY_WEBHOOK_SECRET` are both set as Worker secrets. Do not assume the manager account is still called `quanly` — the owner renamed it and set their own password.

**Production now holds real data, not the seed**: 2 buildings, 3 rooms, 4 accounts, 3 invoices as of 2026-08-20. Anything in this file about production being "just migration 0001's seed" is out of date; count the rows before assuming.

The local D1 holds throwaway accounts (`quanly`, `phong01`, `phong02`, passwords `<name>-test-123`) plus test readings, invoices and a second building; none of that exists in production.

The SePay webhook is built and deployed at `POST /hooks/sepay-payment`, with `SEPAY_WEBHOOK_SECRET` set on the Worker. Probed on production: a missing or stale timestamp answers 401 `STALE_SIGNATURE`, a wrong signature 401 `UNAUTHORIZED`, and the response is the JSON envelope rather than `index.html` — which confirms `/hooks/*` is in `run_worker_first` and actually reaching the Worker.

**A successful delivery has still never happened.** Everything verified so far is a rejection path; the accept path was only ever exercised locally with hand-signed payloads. Confirm it with one small real transfer and `wrangler tail`. `docs/` (Vietnamese) is the design spec; `docs/roadmap.md` is the authoritative backlog.

Deployment checks worth repeating after any change to auth or hashing:

```bash
./node_modules/.bin/wrangler tail nha-tro --format json    # cpuTime per request
```

No test runner has been chosen yet.
