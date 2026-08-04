# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

Scaffold is in place: `package.json`, `wrangler.toml`, `vite.config.ts`, tsconfig project references, a Hono Worker with `/api/health`, a Mantine SPA shell, and `migrations/0001_init.sql` (schema + seed). The D1 database `nha-tro` exists (APAC, id in `wrangler.toml`); migration 0001 has been applied **locally only** — the remote database is still empty.

Not built yet: auth, the rooms/readings/invoices/payments API, invoice generation, VietQR, the SePay webhook, and every real UI screen. `README.md` (Vietnamese) is the design spec and its task list at the bottom ("Việc cần làm") is the authoritative backlog.

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
  index.ts            Worker entry — currently only /api/health
  routes/             rooms, readings, invoices, payments, auth, webhook (not written yet)
  auth.ts             password hash/verify, JWT sign/verify, middleware (not written yet)
  db.ts               D1 queries (not written yet)
src/shared/           types shared between client and server (not created yet)
migrations/           SQL for D1, applied via `wrangler d1 migrations apply`
```

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

Seed in 0001: one building (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), two rooms (`P101`, `P102`, `gia_phong = 0`), one placeholder tenant. Names and `gia_phong` are placeholders awaiting real data — do not treat them as facts.

## Auth

No auth framework. Passwords are PBKDF2-hashed **offline** and inserted into `users` (changing a password = updating `password_hash` in D1). Login signs a JWT with `jose` and sets it in an `httpOnly` + `secure` + `sameSite` cookie; protected routes go through middleware that verifies the cookie. Stateless — there is no session table, and there should not be one.

Hashing uses Web Crypto (Workers runtime), not Node `crypto`.

## Payments

Default flow is manual: each invoice renders a VietQR code whose transfer memo carries the invoice code (e.g. `HD00123`); the admin marks it paid.

Optional automation: SePay balance-change webhook at `/api/webhook/sepay` parses the invoice code out of the transfer memo, sets `invoices.trang_thai = 'da_thanh_toan'`, and inserts a `payments` row. The webhook must authenticate with `SEPAY_WEBHOOK_TOKEN` before mutating anything.

## Secrets

Set via `wrangler secret put`, never committed: `JWT_SECRET`, and `SEPAY_WEBHOOK_TOKEN` if the SePay webhook is enabled.
