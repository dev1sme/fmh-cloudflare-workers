# Auth

No auth framework. Stateless — there is no session table, and there should not be one.

**Three accounts, two roles.** `users.role` is `MANAGER` (one account — the owner, full management) or `TENANT` (one account per room, read-only). A tenant account is bound to a **room**, not to a person, via `users.room_id`: when a tenant moves out, the password changes and the account stays. The schema enforces both halves — `MANAGER` must have a NULL `room_id`, `TENANT` must have one, and a partial unique index allows at most one account per room.

Two middlewares in `auth.ts`, one per role:

- `requireQuanLy` — management endpoints; 403 for tenants.
- `requirePhong` — `/api/me/*`; requires a `room_id` on the token, so the manager gets 403 there.

There is no role-agnostic `requireAuth`. There was one, and nothing ever mounted it: every authenticated route in this app belongs to exactly one role, so a guard that only checks "signed in" is a guard nobody can correctly use. Both middlewares check the session themselves rather than composing it — five duplicated lines, against a helper that invites a route to be protected by less than it needs. `currentUser` is the shared piece, and it rejects nothing.

The room in `/api/me/*` queries always comes from the token, never the request. `GET /api/me/invoices/:id` re-checks `room_id` and answers 404 (not 403) for another room's invoice, so ids cannot be probed.

Password records are stored in `users.password_hash` as `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`. The iteration count is part of the record, so raising it later is a re-hash plus an `UPDATE`, never a migration.

Hashing runs **in the Worker** (`hashPassword` in `auth.ts`) so the manager can create accounts and reset passwords from the UI. `scripts/hash-password.mjs` produces the identical format offline and is still how the first manager account is bootstrapped into an empty database.

**Plaintext passwords are never stored and never readable.** A generated or chosen password is returned exactly once, in the response to the create/reset call that produced it, so the manager can pass it to the tenant; `GET /api/accounts` never includes `password_hash` or any password. A forgotten password is replaced, not recovered — do not add an endpoint, column, or log line that keeps the plaintext, even if asked for a "view password" feature. Reset gives the same practical capability without the liability.

## The iteration count

**Iterations are 10,000, not the OWASP-recommended 600,000, and that is deliberate.** Workers Free allows 10 ms CPU per request, and 50k measured 11-17 ms — over the limit on every login.

Measured on the deployed Worker (`wrangler tail --format json`, `cpuTime`):

| Request | cpuTime |
| --- | --- |
| Login, username exists (10k iterations) | **5 ms** |
| Login, username missing — after the dummy-record fix | **median 4 ms, max 10 ms** (n=12, spaced) |
| Login, username missing — before the fix | median 14 ms, max 26 ms (n=7) |
| `GET /api/dashboard` (6 D1 queries in one batch) | **1-2 ms** |
| `GET /api/rooms`, `/buildings`, `/tenants` | 1-3 ms |
| `GET /api/health` | 0 ms |

Sampling matters when re-measuring. Twelve logins spaced two seconds apart gave median 4 ms and never crossed 10 ms; eight fired back to back gave median 10 ms and peaked at 16 ms, because concurrent requests spin up cold isolates. Space the probes out — with three accounts, bursts are not the real traffic shape.

`/api/dashboard` costing the same as a single-query route is the point: waiting on D1 does not count toward CPU time, so the six-statement batch is free in the only budget that binds.

**The dummy record's iteration count must match `PBKDF2_ITERATIONS`.** It was hard-coded at 50k while real records were at 10k, and that single mismatch caused both problems below — it is now interpolated from the constant so the two cannot drift again.

- A login *miss* cost 10-26 ms (median 14) against 5 ms for a *hit*, so misses blew the CPU limit while hits sat comfortably inside it.
- Worse, it destroyed the property the dummy record exists for: the timing difference told an attacker which usernames exist. A constant meant to hide that was leaking it.

**Never tune the iteration count from a local benchmark.** This dev machine runs 50k in ~6 ms — roughly three times faster than Cloudflare's CPU — which is exactly the mistake that shipped an over-limit login once already. Re-measure on the deployed Worker after any change, and remember that changing the constant only affects accounts whose passwords are re-hashed afterwards.

Do not lower it to 5k: at 5 ms a real login already fits the budget with room to spare, so halving the work factor would buy nothing and cost one bit.

Long random passwords carry the security here, not the work factor. That holds only while the passwords actually are long and random — a manager password chosen by hand is the weak point, not the iteration count.

## Other details that are easy to break

- `POST /api/auth/login` verifies against a dummy record when the username does not exist, so a bad username and a bad password take the same time and cannot be distinguished.
- Verification uses a constant-time byte compare, and Web Crypto (`crypto.subtle`), not Node `crypto`.
- The session cookie is `session`: `httpOnly`, `secure`, `sameSite=Lax`, 7-day TTL, carrying an HS256 JWT signed with `jose` (`sub` = user id, plus `username` / `role` / `room_id`). The `role` claim was renamed from `vai_tro` in the English rename, so any token issued before that is rejected — everyone had to sign in again once.
- Route layout in `src/server/index.ts`: **every mount carries its own guard over its own prefix.** `quanLyOnly(...)` wraps each management resource router, `requirePhong` sits on `/api/me`, `requireQuanLy` is passed inline to `/api/dashboard`, and `/api/health`, `/api/auth/*` and `/hooks/*` carry none. There is deliberately **no `/api/*` wildcard middleware**. There was one — a single `admin` sub-app mounted on `/api` — and it made registration order load-bearing for authorisation: the public routes were public only because they sat above that line, and a route added below it would have answered 401 with nothing in the file to explain why. Adding a route now means choosing its guard, not choosing its line number. One visible consequence of the split: an unknown `/api/...` answers 404 instead of 401. That is acceptable here — the repository is public, so which endpoints exist was never a secret.
- There is **no login rate limiting**. Adding one would need KV or Durable Objects, which the project deliberately avoids; three fixed accounts with long random passwords is the mitigation.
