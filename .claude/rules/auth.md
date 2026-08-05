# Auth

No auth framework. Stateless — there is no session table, and there should not be one.

**Three accounts, two roles.** `users.vai_tro` is `quan_ly` (one account — the owner, full management) or `nguoi_thue` (one account per room, read-only). A tenant account is bound to a **room**, not to a person, via `users.room_id`: when a tenant moves out, the password changes and the account stays. The schema enforces both halves — `quan_ly` must have a NULL `room_id`, `nguoi_thue` must have one, and a partial unique index allows at most one account per room.

Three middlewares in `auth.ts`:

- `requireAuth` — any valid session.
- `requireQuanLy` — management endpoints; 403 for tenants.
- `requirePhong` — `/api/me/*`; requires a `room_id` on the token, so the manager gets 403 there.

The room in `/api/me/*` queries always comes from the token, never the request. `GET /api/me/invoices/:id` re-checks `room_id` and answers 404 (not 403) for another room's invoice, so ids cannot be probed.

Password records are stored in `users.password_hash` as `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`. The iteration count is part of the record, so raising it later is a re-hash plus an `UPDATE`, never a migration.

Hashing runs **in the Worker** (`hashPassword` in `auth.ts`) so the manager can create accounts and reset passwords from the UI. `scripts/hash-password.mjs` produces the identical format offline and is still how the first manager account is bootstrapped into an empty database.

**Plaintext passwords are never stored and never readable.** A generated or chosen password is returned exactly once, in the response to the create/reset call that produced it, so the manager can pass it to the tenant; `GET /api/accounts` never includes `password_hash` or any password. A forgotten password is replaced, not recovered — do not add an endpoint, column, or log line that keeps the plaintext, even if asked for a "view password" feature. Reset gives the same practical capability without the liability.

## The iteration count

**Iterations are 10,000, not the OWASP-recommended 600,000, and that is deliberate.** Workers Free allows 10 ms CPU per request. Measured **on the deployed Worker** (`wrangler tail --format json`, `cpuTime` field): 50k cost 11-17 ms and blew the limit on every login; at 10k a warm login is 2-3 ms, median 8 ms, with occasional 13 ms spikes on cold isolates. For reference `/api/summary` (JWT verify + D1 count) is ~3 ms and `/api/health` ~0 ms.

**Never tune this from a local benchmark.** This dev machine runs 50k in ~6 ms — roughly three times faster than Cloudflare's CPU — which is exactly the mistake that shipped an over-limit login. Re-measure on the deployed Worker after any change, and remember that changing the constant only affects accounts whose passwords are re-hashed afterwards.

Halving it to 5k buys ~1-1.5 ms and costs one bit of work factor; it does not fix a cold-isolate spike, which is isolate startup rather than hashing. Do not change the constant without a measured problem on the deployed Worker.

Long random passwords carry the security here, not the work factor. That holds only while the passwords actually are long and random — a manager password chosen by hand is the weak point, not the iteration count.

## Other details that are easy to break

- `POST /api/auth/login` verifies against a dummy record when the username does not exist, so a bad username and a bad password take the same time and cannot be distinguished.
- Verification uses a constant-time byte compare, and Web Crypto (`crypto.subtle`), not Node `crypto`.
- The session cookie is `session`: `httpOnly`, `secure`, `sameSite=Lax`, 7-day TTL, carrying an HS256 JWT signed with `jose` (`sub` = user id).
- Route layout in `src/server/index.ts`: `/api/health` and `/api/auth/*` are public and registered **first**; everything else is mounted through a sub-app with `requireAuth`. Registration order is what makes this work in Hono — a new public route must go above the sub-app mount.
- There is **no login rate limiting**. Adding one would need KV or Durable Objects, which the project deliberately avoids; three fixed accounts with long random passwords is the mitigation.
