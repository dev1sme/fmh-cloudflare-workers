# Project state

Built so far: the Vite + Hono + Wrangler scaffold, `migrations/0001_init.sql` (schema + seed), cookie-session auth with two roles, the full management API (buildings, rooms, tenants, readings, invoices, payments), the read-only tenant API under `/api/me`, and the SPA screens for both roles.

**Deployed** at `https://rentals.dev1sme.cloud` (account `letuanthong0305@gmail.com`, zone `dev1sme.cloud`). It was `fmh.dev1sme.cloud` until the app was renamed to Rentals Hub; that hostname was dropped outright rather than kept alongside, so a saved link to it fails rather than going quietly stale. Its DNS record may still exist in the zone — Wrangler adds a record for a custom domain but does not remove one when the route goes away. The custom domain is declared as `routes` in `wrangler.toml`, which **disables the `*.workers.dev` URL** — that is intentional; re-enable it with `workers_dev = true` if a fallback URL is ever wanted.

All eight migrations are applied to the remote D1 — verified with `SELECT name FROM d1_migrations`, not by counting files.

That distinction is the whole reason this line reads the way it does. It once said "all applied" on the strength of the directory listing while the remote was four behind, so every write answered 500 on production: no table had its `code` column, which every insert names and `listRooms` selects. Check the table, never the directory.

`wrangler d1 migrations apply --remote` failed once with `code 7403` ("account is not authorized") and then succeeded on an immediate retry with no change in between. Retry before believing it.

`JWT_SECRET` is set as a Worker secret, `SEPAY_WEBHOOK_SECRET` is not yet, and one manager account exists in production (the owner renamed it and set their own password — do not assume it is still called `quanly`). Production data is otherwise just migration 0001's seed (building `FMH`, rooms `FMH-P01`/`FMH-P02`, two placeholder tenants) — the real building, room and tenant data has to be entered through the UI.

The local D1 holds throwaway accounts (`quanly`, `phong01`, `phong02`, passwords `<name>-test-123`) plus test readings, invoices and a second building; none of that exists in production.

The SePay webhook is built and deployed at `POST /hooks/sepay-payment`, with `SEPAY_WEBHOOK_SECRET` set on the Worker. Probed on production: a missing or stale timestamp answers 401 `STALE_SIGNATURE`, a wrong signature 401 `UNAUTHORIZED`, and the response is the JSON envelope rather than `index.html` — which confirms `/hooks/*` is in `run_worker_first` and actually reaching the Worker.

**A successful delivery has still never happened.** Everything verified so far is a rejection path; the accept path was only ever exercised locally with hand-signed payloads. Confirm it with one small real transfer and `wrangler tail`. `README.md` (Vietnamese) is the design spec and its task list at the bottom ("Việc cần làm") is the authoritative backlog.

Deployment checks worth repeating after any change to auth or hashing:

```bash
./node_modules/.bin/wrangler tail nha-tro --format json    # cpuTime per request
```

No test runner has been chosen yet.
