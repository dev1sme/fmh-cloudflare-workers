# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

The repository is **greenfield**: it contains only `README.md` (the design spec, in Vietnamese) and `LICENSE`. There is no `package.json`, no source tree, and no `wrangler.toml` yet. Everything below describes the target design agreed in `README.md` — treat it as the contract to build against, and update this file once the real code diverges from it.

The task list at the bottom of `README.md` ("Việc cần làm") is the authoritative backlog.

## What the app is

Internal rental-property manager for 2 buildings ("nhà trọ"): record monthly electricity/water meter readings, generate invoices (room rent + electricity + water + other fees), show tenants a VietQR code to pay, keep meter-reading history. Three fixed admin accounts — no signup, no email verification, no password reset.

Scale is deliberately tiny and must stay inside Cloudflare's free tier. Prefer the simplest thing that works; do not introduce infrastructure (queues, KV, Durable Objects, external services) without a concrete need.

## Architecture

**One Worker serves everything.** The React SPA is built by Vite into `dist/`, served as static assets by the same Worker that handles `/api/*` via Hono. One deploy, one URL. Next.js/OpenNext was explicitly rejected to avoid the configuration overhead — do not reintroduce a meta-framework.

```
src/client/   React SPA (Vite)
src/server/   Hono API on the Worker
  index.ts    Worker entry: static assets + /api routes
  routes/     rooms, readings, invoices, payments, auth, webhook
  auth.ts     password hash/verify, JWT sign/verify, middleware
  db.ts       D1 queries
migrations/   SQL for D1
```

Stack: TypeScript, React + Vite, Mantine (UI), Hono, Cloudflare D1 (SQLite), `jose` for JWT.

## Commands

Per `README.md`; the npm scripts do not exist yet and must be created alongside `package.json`.

```bash
npm install
npm run dev                                                              # local dev
npm run build                                                            # Vite -> dist/
npx wrangler deploy                                                      # Worker + static assets

npx wrangler d1 create nha-tro                                           # then paste database_id into wrangler.toml
npx wrangler d1 execute nha-tro --local --file ./migrations/0001_init.sql # local migration
npx wrangler d1 execute nha-tro --remote --file ./migrations/0001_init.sql
npx wrangler secret put JWT_SECRET
```

No test runner has been chosen yet.

## Data model conventions

Table/column names mix English table names with **Vietnamese column names** (`ten_phong`, `gia_phong`, `tien_dien`, `trang_thai`, `ngay_tao`). Keep this convention for new columns rather than normalizing to English.

```
buildings (id, name, address)
rooms     (id, building_id, ten_phong, gia_phong, dien_tich)
tenants   (id, room_id, ho_ten, sdt, ngay_vao)
readings  (id, room_id, ky /YYYY-MM/, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi)
invoices  (id, room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
           don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao)
payments  (id, invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu)
users     (id, username, password_hash)
```

Two invariants that the design depends on:

- **Unit prices are snapshotted onto `invoices`** (`don_gia_dien`, `don_gia_nuoc`). Never recompute a past invoice from today's tariff — a price change must not rewrite history.
- **`readings` holds meter numbers only; money lives in `invoices`.** This keeps reading history clean and lets a period's opening reading (`dien_cu`/`nuoc_cu`) be auto-filled from the previous period's closing reading.

Billing period is `ky` in `YYYY-MM` form. Invoice line: `tien_dien = (dien_moi - dien_cu) * don_gia_dien`, same shape for water.

## Auth

No auth framework. Passwords are PBKDF2-hashed **offline** and inserted into `users` (changing a password = updating `password_hash` in D1). Login signs a JWT with `jose` and sets it in an `httpOnly` + `secure` + `sameSite` cookie; protected routes go through middleware that verifies the cookie. Stateless — there is no session table, and there should not be one.

Hashing uses Web Crypto (Workers runtime), not Node `crypto`.

## Payments

Default flow is manual: each invoice renders a VietQR code whose transfer memo carries the invoice code (e.g. `HD00123`); the admin marks it paid.

Optional automation: SePay balance-change webhook at `/api/webhook/sepay` parses the invoice code out of the transfer memo, sets `invoices.trang_thai = 'da_thanh_toan'`, and inserts a `payments` row. The webhook must authenticate with `SEPAY_WEBHOOK_TOKEN` before mutating anything.

## Secrets

Set via `wrangler secret put`, never committed: `JWT_SECRET`, and `SEPAY_WEBHOOK_TOKEN` if the SePay webhook is enabled.
