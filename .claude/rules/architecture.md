# Architecture

**One Worker serves everything.** Vite builds the React SPA and the Worker together; the same Worker serves the static assets and handles `/api/*` via Hono. One deploy, one URL. Next.js/OpenNext was explicitly rejected to avoid the configuration overhead — do not reintroduce a meta-framework.

Build and dev go through **`@cloudflare/vite-plugin`**, not a bare Vite build plus a hand-rolled `[assets] directory`. `npm run dev` runs the Worker in the real workerd runtime with a local D1 binding and client HMR in one process. Consequences worth knowing:

- `assets.directory` is *not* set in `wrangler.toml` — the plugin points it at the client build output itself.
- `vite build` emits `dist/client/` (assets) and `dist/nha_tro/` (Worker + a generated output `wrangler.json`). Deploy reads the generated config; `wrangler.toml` is the input.
- `run_worker_first = ["/api/*"]` routes API calls to the Worker explicitly; everything else falls through to the SPA (`not_found_handling = "single-page-application"`).

```
index.html            Vite entry, loads src/client/main.tsx
public/               copied verbatim into dist/client/ — holds _headers
src/client/           React SPA (Mantine + react-router)
  App.tsx             session gate only
  routes.tsx          route table per role
  api.ts              typed wrappers over every endpoint
  errors.ts           API error code -> Vietnamese message, toasts
  format.ts           tiền / ngày / kỳ formatting
  hooks/              useResource (fetch + reload), useConfirm (dialog)
  components/         cross-feature UI: AppLayout, InvoiceLines, PaymentsTable,
                      PeriodPicker, PageState, StatusBadge, ConfirmModal
  features/<name>/    login, dashboard, rooms, tenants, readings, invoices,
                      settings, accounts, change-password, not-found,
                      my (the tenant's own screens)
    XxxPage.tsx       composition only
    components/       that feature's UI, one component per file
    useXxx.ts         data loading + mutations, no JSX
src/server/           Hono API on the Worker
  index.ts            Worker entry: route table, error mapping
  auth.ts             password verify, JWT sign/verify, the three middlewares
  envelope.ts         ok / failure / notFound — the only place c.json is called
  headers.ts          security headers for /api/*
  validate.ts         hand-rolled request validation
  types.ts            SessionUser / AppEnv (server-only types)
  routes/             auth, accounts, buildings, rooms, tenants, readings,
                      invoices, payments, me
  domain/             pure logic — invoice.ts (amounts, HD codes), period.ts
                      (periods), vietqr.ts, password.ts
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

A hook passed into a child's `useEffect` must be memoised — `useReadings`' `goiY` is wrapped in `useCallback` for exactly that reason, and dropping it produces an infinite render loop in `ReadingModal`. The same applies to any array a child seeds state from: `useXemTruocSinh` memoises `rooms` with `useMemo` so `GenerateInvoicesModal`'s selection effect does not loop.

The SPA has no client-side auth guard beyond the route table: `App.tsx` asks `GET /api/auth/me` once, then `routes.tsx` renders the manager routes or the tenant routes. That is navigation convenience, not security — the API enforces the roles.

**Everything a caller can see is English**: URLs, directory names, DB columns, API fields, error codes and enum values. Vietnamese survives only in UI copy and in internal identifiers (`xacNhan`, `thongBaoLoi`, `tien`) — see `data-model.md` and `api.md`.

Unknown paths render `NotFoundPage`, not a redirect. Only the bare `/` redirects to the role's home (`/dashboard` or `/my-invoices`); bouncing everything else would hide a mistyped or stale link instead of reporting it. The 404 deliberately does not distinguish "no such page" from "that page belongs to the other role" — saying which would leak the manager's route names to a tenant.

`not_found_handling = "single-page-application"` means Cloudflare answers **200 with `index.html`** for any non-asset path, so the 404 is a client-side screen; the HTTP status is not 404 and cannot be from the assets layer.

Data loading is `useResource` (fetch on mount, `reload()` after a mutation). No query library, no cache: one manager and two rooms do not need one. Errors surface through `errors.ts`, which maps API codes to Vietnamese and falls back to a readable message for generated codes like `INVALID_RENT`.

Confirmations go through `useConfirm` (`xacNhan({...})` + render `hopThoai`), never `window.confirm` — a native dialog cannot be styled or animated and blocks the whole tab.

TypeScript is split into three project references — `tsconfig.app.json` (client, DOM libs), `tsconfig.worker.json` (Worker, workerd types), `tsconfig.node.json` (`vite.config.ts`). Client code must not import from `src/server/`, only from `src/shared/`.

Stack: TypeScript, React + Vite, Mantine (UI), `@mantine/charts` + Recharts (the dashboard bar chart only), Hono, Cloudflare D1 (SQLite), `jose` for JWT.

Recharts costs about 400 kB raw / 120 kB gzipped and is the reason the client bundle is over 1 MB. It earns that only if the dashboard chart is worth it; if a second opinion ever says no, dropping `RevenueChart` removes the dependency entirely.
