# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

Built so far: the Vite + Hono + Wrangler scaffold, `migrations/0001_init.sql` (schema + seed), cookie-session auth with two roles, the full management API (buildings, rooms, tenants, readings, invoices, payments), the read-only tenant API under `/api/me`, and the SPA screens for both roles.

The D1 database `nha-tro` exists (APAC, id in `wrangler.toml`), but migration 0001 has been applied **locally only** — the remote database is still empty, and nothing has ever been deployed. The local D1 holds throwaway accounts (`quanly`, `phong01`, `phong02`) and test readings/invoices; the real accounts do not exist anywhere yet.

Not built yet: VietQR and the SePay webhook. `README.md` (Vietnamese) is the design spec and its task list at the bottom ("Việc cần làm") is the authoritative backlog.

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
src/client/           React SPA (Mantine + react-router)
  App.tsx             session gate only
  routes.tsx          route table per role
  api.ts              typed wrappers over every endpoint
  errors.ts           API error code -> Vietnamese message, toasts
  format.ts           tiền / ngày / kỳ formatting
  hooks/              useResource (fetch + reload), useConfirm (dialog)
  components/         cross-feature UI: AppLayout, InvoiceLines, PaymentsTable,
                      KyPicker, PageState, TrangThaiBadge, ConfirmModal
  features/<ten>/     dang-nhap, phong, nguoi-thue (manager), chi-so, hoa-don,
                      cai-dat, cua-toi (the tenant's own screens)
    XxxPage.tsx       composition only
    components/       that feature's UI, one component per file
    useXxx.ts         data loading + mutations, no JSX
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

**Client layering, enforced by convention:**

- A `*Page.tsx` composes — it holds screen-level state (which modal is open, which period is selected) and renders components. It must not call `api.ts` directly, contain a table/modal's JSX, or hold `try/catch` around a request.
- A `use*.ts` in a feature owns data loading and mutations. Mutations return `Promise<boolean>` and raise their own toast, so the caller only decides whether to close a modal.
- A component under `features/*/components/` takes props and callbacks. It never imports `api.ts`. UI used by more than one feature moves up to `src/client/components/`.

The point is that adding an animation or reworking one table touches one file. When a page file starts growing again, split it rather than letting it absorb the next feature.

A hook passed into a child's `useEffect` must be memoised — `useChiSo`'s `goiY` is wrapped in `useCallback` for exactly that reason, and dropping it produces an infinite render loop in `ReadingModal`.

The SPA has no client-side auth guard beyond the route table: `App.tsx` asks `GET /api/auth/me` once, then `routes.tsx` renders the manager routes or the tenant routes and sends anything unknown to that role's home. That is navigation convenience, not security — the API enforces the roles.

Data loading is `useResource` (fetch on mount, `reload()` after a mutation). No query library, no cache: one manager and two rooms do not need one. Errors surface through `errors.ts`, which maps API codes to Vietnamese and falls back to a readable message for generated codes like `invalid_gia_phong`.

Confirmations go through `useConfirm` (`xacNhan({...})` + render `hopThoai`), never `window.confirm` — a native dialog cannot be styled or animated and blocks the whole tab.

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
tenants   (id, room_id, ho_ten, sdt, ⊕so_nguoi, ngay_vao, ⊕ngay_ra)   UNIQUE(room_id) WHERE ngay_ra IS NULL
readings  (id, room_id, ky /YYYY-MM/, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi)   ⊕UNIQUE(room_id, ky)
invoices  (id, room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
           don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao)                 ⊕UNIQUE(room_id, ky)
payments  (id, invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu)
users     (id, username, password_hash)
```

- `buildings.don_gia_dien` / `don_gia_nuoc` hold the **current** tariff, per building (the two buildings may differ). It is what a newly generated invoice copies from; it is never read when displaying an existing invoice.
- `tenants.ngay_ra` NULL means still renting. The partial unique index enforces at most one active tenant per room, while keeping past tenants for history. **One tenancy = one named tenant**; several people living in the room are counted in `so_nguoi` (≥ 1, includes the named tenant) rather than as extra rows. Do not "fix" this by allowing multiple active tenants — it is the agreed model.
- The `UNIQUE(room_id, ky)` pairs stop a double meter entry from producing two invoices for the same month.

Money is `INTEGER` VND — no floats, no minor units. Dates are ISO `TEXT`. `trang_thai` ∈ `chua_thanh_toan` | `da_thanh_toan` | `huy`; `phuong_thuc` ∈ `chuyen_khoan` | `tien_mat` (both CHECK-constrained).

Two invariants that the design depends on:

- **Unit prices are snapshotted onto `invoices`** (`don_gia_dien`, `don_gia_nuoc`). Never recompute a past invoice from today's tariff — a price change must not rewrite history.
- **`readings` holds meter numbers only; money lives in `invoices`.** This keeps reading history clean and lets a period's opening reading (`dien_cu`/`nuoc_cu`) be auto-filled from the previous period's closing reading.

Billing period is `ky` in `YYYY-MM` form. Invoice line: `tien_dien = (dien_moi - dien_cu) * don_gia_dien`, same shape for water.

## API

Everything below `/api` except `/api/health` and `/api/auth/*` requires a session.

Management (`requireQuanLy`): full CRUD on `/buildings`, `/rooms`, `/tenants`, `/readings`, `/invoices`, plus `DELETE /payments/:id` and `GET /summary`.

The app is not hard-wired to two buildings and four rooms: the manager adds a building from **Cài đặt** (each with its own `don_gia_dien` / `don_gia_nuoc`) and rooms from **Phòng**. Deleting is FK-restricted — a building with rooms, or a room with readings/invoices/tenants, returns 409 `rang_buoc_du_lieu` rather than cascading. Room names are unique per building, not globally. A room cannot be moved to another building and a tenancy cannot be moved to another room; both would rewrite priced history, so the UI disables those selects when editing.

Accounts (`/api/accounts`, manager only): `GET` lists them, `POST` creates one (password optional — omitted means the server generates a 20-character one), `PATCH` renames, `POST /:id/reset-password` resets **without asking for the current password**, `DELETE` removes. Two guards keep the app reachable: you cannot delete the account you are logged in as (`khong_tu_xoa`), and you cannot delete the last manager (`phai_con_mot_quan_ly`). One account per room is enforced by the partial unique index.

Sessions are stateless, so a reset does not kick out an existing session — the old JWT stays valid until it expires. That is acceptable here (three accounts, one manager); fixing it would need a token version column and a lookup per request.

On `/tenants`: POST moves someone in, `PATCH { ngay_ra: "…" }` moves them out, `PATCH { ngay_ra: null }` undoes a mistaken move-out (409 if the room already has a new tenant), and DELETE erases a record entered by mistake. `GET /tenants` returns everyone ever, newest tenancy per room first, with `ten_phong` joined in; `?dang_thue=1` narrows it to current tenants and `?room_id=` to one room. Moving a tenancy to another room is not supported — that is a new tenancy.

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

Password records are stored in `users.password_hash` as `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`. The iteration count is part of the record, so raising it later is a re-hash plus an `UPDATE`, never a migration.

Hashing runs **in the Worker** (`hashPassword` in `auth.ts`) so the manager can create accounts and reset passwords from the UI. `scripts/hash-password.mjs` produces the identical format offline and is still how the first manager account is bootstrapped into an empty database.

**Plaintext passwords are never stored and never readable.** A generated or chosen password is returned exactly once, in the response to the create/reset call that produced it, so the manager can pass it to the tenant; `GET /api/accounts` never includes `password_hash` or any password. A forgotten password is replaced, not recovered — do not add an endpoint, column, or log line that keeps the plaintext, even if asked for a "view password" feature. Reset gives the same practical capability without the liability.

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
