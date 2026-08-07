# Project state

Built so far: the Vite + Hono + Wrangler scaffold, `migrations/0001_init.sql` (schema + seed), cookie-session auth with two roles, the full management API (buildings, rooms, tenants, readings, invoices, payments), the read-only tenant API under `/api/me`, and the SPA screens for both roles.

**Deployed** at `https://rentals.dev1sme.cloud` (account `letuanthong0305@gmail.com`, zone `dev1sme.cloud`). It was `fmh.dev1sme.cloud` until the app was renamed to Rentals Hub; that hostname was dropped outright rather than kept alongside, so a saved link to it fails rather than going quietly stale. Its DNS record may still exist in the zone — Wrangler adds a record for a custom domain but does not remove one when the route goes away. The custom domain is declared as `routes` in `wrangler.toml`, which **disables the `*.workers.dev` URL** — that is intentional; re-enable it with `workers_dev = true` if a fallback URL is ever wanted.

**The remote D1 is behind the code.** Only `0001`–`0004` are applied there; `0005`–`0008` are not, so no table has its `code` column and `payments` has no `external_id`. Every write the app does names `code`, and `listRooms` selects it, so adding a room — and most other things — answers 500 on production until `npm run db:migrate:remote` is run.

Do not infer this from the migrations directory. It was recorded here as "all applied" once by counting files, which is how it went unnoticed; check `SELECT name FROM d1_migrations` on the remote before trusting any statement about it.

`JWT_SECRET` is set as a Worker secret, `SEPAY_WEBHOOK_TOKEN` is not yet, and one manager account exists in production (the owner renamed it and set their own password — do not assume it is still called `quanly`). Production data is otherwise just migration 0001's seed (building `FMH`, rooms `FMH-P01`/`FMH-P02`, two placeholder tenants) — the real building, room and tenant data has to be entered through the UI.

The local D1 holds throwaway accounts (`quanly`, `phong01`, `phong02`, passwords `<name>-test-123`) plus test readings, invoices and a second building; none of that exists in production.

The SePay webhook is built (`POST /api/webhook/sepay`) but has never been exercised against SePay itself — only against hand-made payloads on the local Worker. `SEPAY_WEBHOOK_TOKEN` is now in `[secrets] required`, so **`wrangler deploy` fails until it is set on the Worker**. `README.md` (Vietnamese) is the design spec and its task list at the bottom ("Việc cần làm") is the authoritative backlog.

Deployment checks worth repeating after any change to auth or hashing:

```bash
./node_modules/.bin/wrangler tail nha-tro --format json    # cpuTime per request
```

No test runner has been chosen yet.
