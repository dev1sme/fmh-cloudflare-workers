# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

Built so far: the Vite + Hono + Wrangler scaffold, `migrations/0001_init.sql` (schema + seed), cookie-session auth with two roles, and the full management API (buildings, rooms, tenants, readings, invoices, payments) plus the read-only tenant API under `/api/me`. The SPA is still a login screen and a placeholder dashboard.

The D1 database `nha-tro` exists (APAC, id in `wrangler.toml`), but migration 0001 has been applied **locally only** — the remote database is still empty, and nothing has ever been deployed. The local D1 holds throwaway accounts (`quanly`, `phong01`, `phong02`) and test readings/invoices; the real accounts do not exist anywhere yet.

Not built yet: VietQR, the SePay webhook, and every real UI screen. `README.md` (Vietnamese) is the design spec and its task list at the bottom ("Việc cần làm") is the authoritative backlog.

No test runner has been chosen yet.

## What the app is

Internal rental-property manager for 2 buildings ("nhà trọ"): record monthly electricity/water meter readings, generate invoices (room rent + electricity + water + other fees), show tenants a VietQR code to pay, keep meter-reading history. Three fixed admin accounts — no signup, no email verification, no password reset.

Scale is deliberately tiny and must stay inside Cloudflare's free tier. Prefer the simplest thing that works; do not introduce infrastructure (queues, KV, Durable Objects, external services) without a concrete need.

## Architecture

**One Worker serves everything.** Vite builds the React SPA and the Worker together; the same Worker serves the static assets and handles `/api/*` via Hono. One deploy, one URL. Next.js/OpenNext was explicitly rejected to avoid the configuration overhead — do not reintroduce a meta-framework.

Build and dev go through **`@cloudflare/vite-plugin`**, not a bare Vite build plus a hand-rolled `[assets] directory`. `npm run dev` runs the Worker in the real workerd runtime with a local D1 binding and client HMR in one process. Consequences worth knowing:

- `assets.directory` is *not* set in `wrangler.toml` — the plugin points it at the client build output itself.
- `vite build` emits `dist/client/` (assets) and `dist/nha_tro/` (Worker + a generated output `wrangler.json`). Deploy reads the generated config; `wrangler.toml` is the input.
- `run_worker_first = ["/api/*"]` routes API calls to the Worker explicitly; everything else falls through to the SPA (`not_found_handling = "single-page-application"`).

```
index.html            Vite entry, loads src/client/main.tsx
src/client/           React SPA (Mantine)
src/server/           Hono API on the Worker
  index.ts            Worker entry: route table, error mapping
  auth.ts             password verify, JWT sign/verify, the three middlewares
  validate.ts         hand-rolled request validation
  types.ts            SessionUser / AppEnv (server-only types)
  routes/             auth, buildings, rooms, tenants, readings, invoices, payments, me
  domain/             pure logic — invoice.ts (amounts, HD codes), ky.ts (periods)
  db/                 one module per table + sql.ts helpers
src/shared/types.ts   API shapes shared by client and server
scripts/              hash-password.mjs (offline password hashing)
migrations/           SQL for D1, applied via `wrangler d1 migrations apply`
```

`src/server/db/` replaces the single `db.ts` the spec sketched — same idea, one file per table. Route handlers validate and decide; they do not write SQL. Money arithmetic lives in `domain/invoice.ts` so it stays testable without a database.

TypeScript is split into three project references — `tsconfig.app.json` (client, DOM libs), `tsconfig.worker.json` (Worker, workerd types), `tsconfig.node.json` (`vite.config.ts`). Client code must not import from `src/server/`, only from `src/shared/`.

Stack: TypeScript, React + Vite, Mantine (UI), Hono, Cloudflare D1 (SQLite), `jose` for JWT.

## Commands

```bash
npm install
npm run dev                  # Vite + workerd + local D1, one process, http://localhost:5173
npm run build                # tsc -b && vite build -> dist/
npm run deploy               # build + wrangler deploy
npm run typecheck
npm run cf-typegen           # regenerate worker-configuration.d.ts — rerun after editing wrangler.toml
npm run db:migrate           # apply pending migrations to the LOCAL D1
npm run db:migrate:remote    # apply pending migrations to the REMOTE D1 (needs approval)
```

`worker-configuration.d.ts` is generated and gitignored, so a fresh clone must run `npm run cf-typegen` before `npm run typecheck` will pass.

**`npx` does not work in this environment** — a shell hook rewrites it and it resolves to `npm`. Always go through an npm script, or call `./node_modules/.bin/wrangler` directly.

`npm audit` reports vulnerabilities in `undici` reached through `miniflare`/`wrangler`. Those are local-toolchain-only dev dependencies and none of it ships to the Worker; do not "fix" them by downgrading `@cloudflare/vite-plugin`.

## MCP servers

`.mcp.json` wires up two Cloudflare MCP servers (streamable HTTP). Use them instead of guessing at API shapes or shelling out to `wrangler` for read-only lookups.

- **`cloudflare-docs`** — no auth. `search_cloudflare_documentation` for anything about Workers, D1, static assets, Hono-on-Workers, `wrangler.toml` fields, free-tier limits. Consult it before inventing config; the docs move faster than model knowledge.
- **`cloudflare-bindings`** — OAuth, account-scoped (run `/mcp` to authenticate if a call fails with an auth error). Relevant tools: `d1_databases_list`, `d1_database_create`, `d1_database_get`, `d1_database_query`, `workers_list`, `workers_get_worker`, `workers_get_worker_code`. KV / R2 / Hyperdrive tools exist too but this project does not use those bindings — do not provision them.

Rules of use:

- `d1_database_query` hits the **remote** D1 instance, not the local dev one. Reads (`SELECT`, `PRAGMA table_info`) are fine unprompted; anything that writes (`INSERT`/`UPDATE`/`DELETE`/`DROP`, running a migration) needs explicit approval first, same as any destructive operation.
- Local development still goes through `npx wrangler d1 execute nha-tro --local`. MCP is for inspecting and operating the deployed environment.
- `d1_database_create` is how `nha-tro` gets created; take the returned `database_id` and paste it into `wrangler.toml`.
- MCP servers may be unavailable in headless/CI runs — never make a build or migration step depend on them.

## Data model conventions

Table/column names mix English table names with **Vietnamese column names** (`ten_phong`, `gia_phong`, `tien_dien`, `trang_thai`, `ngay_tao`). Keep this convention for new columns rather than normalizing to English.

`migrations/0001_init.sql` is the source of truth. It follows `README.md` with three additions made during scaffolding (marked ⊕):

```
buildings (id, name, address, ⊕don_gia_dien, ⊕don_gia_nuoc)
rooms     (id, building_id, ten_phong, gia_phong, dien_tich)          UNIQUE(building_id, ten_phong)
tenants   (id, room_id, ho_ten, sdt, ngay_vao, ⊕ngay_ra)              UNIQUE(room_id) WHERE ngay_ra IS NULL
readings  (id, room_id, ky /YYYY-MM/, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi)   ⊕UNIQUE(room_id, ky)
invoices  (id, room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
           don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao)                 ⊕UNIQUE(room_id, ky)
payments  (id, invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu)
users     (id, username, password_hash)
```

- `buildings.don_gia_dien` / `don_gia_nuoc` hold the **current** tariff, per building (the two buildings may differ). It is what a newly generated invoice copies from; it is never read when displaying an existing invoice.
- `tenants.ngay_ra` NULL means still renting. The partial unique index enforces at most one active tenant per room, while keeping past tenants for history.
- The `UNIQUE(room_id, ky)` pairs stop a double meter entry from producing two invoices for the same month.

Money is `INTEGER` VND — no floats, no minor units. Dates are ISO `TEXT`. `trang_thai` ∈ `chua_thanh_toan` | `da_thanh_toan` | `huy`; `phuong_thuc` ∈ `chuyen_khoan` | `tien_mat` (both CHECK-constrained).

Two invariants that the design depends on:

- **Unit prices are snapshotted onto `invoices`** (`don_gia_dien`, `don_gia_nuoc`). Never recompute a past invoice from today's tariff — a price change must not rewrite history.
- **`readings` holds meter numbers only; money lives in `invoices`.** This keeps reading history clean and lets a period's opening reading (`dien_cu`/`nuoc_cu`) be auto-filled from the previous period's closing reading.

Billing period is `ky` in `YYYY-MM` form. Invoice line: `tien_dien = (dien_moi - dien_cu) * don_gia_dien`, same shape for water.

## API

Everything below `/api` except `/api/health` and `/api/auth/*` requires a session.

Management (`requireQuanLy`): `GET|PATCH /buildings`, full CRUD on `/rooms`, `/tenants` (POST to move in, PATCH `ngay_ra` to move out), `/readings`, `/invoices`, `DELETE /payments/:id`, and `GET /summary`.

Tenant (`requirePhong`): `GET /api/me/phong`, `/api/me/invoices`, `/api/me/invoices/:id`, `/api/me/readings`. Read-only by design — tenants never mark an invoice paid; that is the manager's action, or the SePay webhook's.

Behaviour worth preserving:

- `POST /api/readings` fills `dien_cu`/`nuoc_cu` from the previous period's closing numbers when they are omitted; `GET /api/readings/goi-y?room_id=&ky=` returns the same suggestion for pre-filling a form. That route is registered **before** `/:id` — order matters in Hono.
- `POST /api/invoices/generate` takes `{ ky, room_ids? }` and returns `{ created, skipped }`. Rooms with no reading or an existing invoice are reported in `skipped` rather than failing the batch, because the manager needs to know which rooms still need a meter entry. Inserts run in one `db.batch()`, so a period is created all-or-nothing.
- `PATCH /api/invoices/:id` accepts `tien_phong`, `phi_khac` and `trang_thai` only, and recomputes `tong_tien`. **`don_gia_*` is deliberately not patchable** — fixing a wrong tariff means deleting the invoice and generating it again, so a stored invoice always matches the price it was issued at.
- Recording or deleting a payment re-derives `trang_thai` from `SUM(payments)` vs `tong_tien` (`capNhatTrangThai` in `routes/payments.ts`). A `huy` invoice is never touched by that arithmetic and rejects new payments.
- Errors: `ValidationError` → 400 with a stable code (`invalid_ky`, `dien_moi_nho_hon_dien_cu`, …); D1 UNIQUE → 409 `trung_du_lieu`; FOREIGN KEY → 409 `rang_buoc_du_lieu`; CHECK → 400. Codes are the API contract — the client maps them to Vietnamese, so do not reword them casually.

Seed in 0001: one building (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), two rooms (`P101`, `P102`, `gia_phong = 0`), one placeholder tenant. Names and `gia_phong` are placeholders awaiting real data — do not treat them as facts.

## Auth

No auth framework. Stateless — there is no session table, and there should not be one.

**Three accounts, two roles.** `users.vai_tro` is `quan_ly` (one account — the owner, full management) or `nguoi_thue` (one account per room, read-only). A tenant account is bound to a **room**, not to a person, via `users.room_id`: when a tenant moves out, the password changes and the account stays. The schema enforces both halves — `quan_ly` must have a NULL `room_id`, `nguoi_thue` must have one, and a partial unique index allows at most one account per room.

Three middlewares in `auth.ts`:

- `requireAuth` — any valid session.
- `requireQuanLy` — management endpoints; 403 for tenants.
- `requirePhong` — `/api/me/*`; requires a `room_id` on the token, so the manager gets 403 there.

The room in `/api/me/*` queries always comes from the token, never the request. `GET /api/me/invoices/:id` re-checks `room_id` and answers 404 (not 403) for another room's invoice, so ids cannot be probed.

Password records are stored in `users.password_hash` as `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`. The iteration count is part of the record, so raising it later is a re-hash plus an `UPDATE`, never a migration. Hashing happens **offline** via `npm run hash-password -- <username> [password]` (prints the password if it generates one, plus an upsert statement); the Worker only ever verifies.

**Iterations are 50,000, not the OWASP-recommended 600,000, and that is deliberate.** Workers Free allows 10 ms CPU per request; measured on this project's hardware PBKDF2-SHA256 costs ~1.4 ms at 10k, ~5.8 ms at 50k, ~11 ms at 100k, ~65 ms at 600k. 50k leaves headroom for the D1 lookup and JWT signing. Long random passwords carry the security here, not the work factor. If deployed CPU metrics show logins near the limit, lower the constant in `scripts/hash-password.mjs` and re-hash — do not raise it past ~50k while on the free plan.

Other details that are easy to break:

- `POST /api/auth/login` verifies against a dummy record when the username does not exist, so a bad username and a bad password take the same time and cannot be distinguished.
- Verification uses a constant-time byte compare, and Web Crypto (`crypto.subtle`), not Node `crypto`.
- The session cookie is `session`: `httpOnly`, `secure`, `sameSite=Lax`, 7-day TTL, carrying an HS256 JWT signed with `jose` (`sub` = user id).
- Route layout in `src/server/index.ts`: `/api/health` and `/api/auth/*` are public and registered **first**; everything else is mounted through a sub-app with `requireAuth`. Registration order is what makes this work in Hono — a new public route must go above the sub-app mount.
- There is **no login rate limiting**. Adding one would need KV or Durable Objects, which the project deliberately avoids; three fixed accounts with long random passwords is the mitigation.

## Payments

Default flow is manual: each invoice renders a VietQR code whose transfer memo carries the invoice code (e.g. `HD00123`); the admin marks it paid.

Optional automation: SePay balance-change webhook at `/api/webhook/sepay` parses the invoice code out of the transfer memo, sets `invoices.trang_thai = 'da_thanh_toan'`, and inserts a `payments` row. The webhook must authenticate with `SEPAY_WEBHOOK_TOKEN` before mutating anything.

## Secrets

Set via `wrangler secret put`, never committed: `JWT_SECRET`, and `SEPAY_WEBHOOK_TOKEN` if the SePay webhook is enabled.

`wrangler.toml` declares `[secrets] required = ["JWT_SECRET"]`, so `wrangler deploy` fails if the secret is missing on the Worker instead of shipping a build that 500s on every login. Add new secret names there too.

Locally the same values live in `.dev.vars` (gitignored; `.dev.vars.example` is the committed template). The Vite plugin copies `.dev.vars` into `dist/nha_tro/` so `vite preview` can run — that is build output, gitignored, and not served to browsers, but it does mean `dist/` holds a real secret on disk.
