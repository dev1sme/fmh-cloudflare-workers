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

## Two shells, not one

`AppLayout` is the manager's admin panel — sidebar, quick search, dense tables. `TenantLayout` is a single centred column with a header and an account menu, and no navigation at all.

They were the same shell once, which was a coding convenience rather than a design decision. A tenant has one room, opens the app once or twice a month, on a phone, to see what they owe and scan a QR — and was being shown a sidebar whose three items all led to slices of the same table.

So the tenant has **one screen** (`MyHomePage`): the newest month in full with its QR, then earlier months as one-line rows that open on demand. `/dashboard`, `/my-invoices` and `/my-readings` redirect to `/` rather than 404, so an old bookmark still lands somewhere useful. `MyDashboardPage`, `MyInvoicesPage`, `MyReadingsPage`, `MonthsTable`, `InvoiceCard` and `ReadingsHistoryTable` were deleted, not kept "just in case".

Only the newest month is fetched in full (`me.invoice(code)`); the rest come from `me.dashboard()` as summaries. `useInvoicesCuaToiChiTiet("")` resolves to null so a period with a reading but no invoice yet does not fire a request.

**Manager tables below `sm` become cards.** Nine columns on a 390 px screen is a sideways scroll with the room name off-screen, which defeats the point of columns. `InvoicesPage` renders `InvoicesTable` above `sm` and `InvoiceCards` below it — same facts, one card per invoice. Other manager tables still scroll horizontally; convert them the same way when they start being used on a phone.

**Everything a caller can see is English**: URLs, directory names, DB columns, API fields, error codes and enum values. Vietnamese survives only in UI copy and in internal identifiers (`xacNhan`, `thongBaoLoi`, `tien`) — see `data-model.md` and `api.md`.

Both roles land on `/dashboard`, which the role branch in `routes.tsx` resolves to a different component — the manager's rollup or the tenant's own months. Unknown paths render `NotFoundPage`, not a redirect. Only the bare `/` redirects to `/dashboard`; bouncing everything else would hide a mistyped or stale link instead of reporting it. The 404 deliberately does not distinguish "no such page" from "that page belongs to the other role" — saying which would leak the manager's route names to a tenant.

`not_found_handling = "single-page-application"` means Cloudflare answers **200 with `index.html`** for any non-asset path, so the 404 is a client-side screen; the HTTP status is not 404 and cannot be from the assets layer.

Data loading is `useResource` (fetch on mount, `reload()` after a mutation). No query library, no cache: one manager and two rooms do not need one. Errors surface through `errors.ts`, which maps API codes to Vietnamese and falls back to a readable message for generated codes like `INVALID_RENT`.

Confirmations go through `useConfirm` (`xacNhan({...})` + render `hopThoai`), never `window.confirm` — a native dialog cannot be styled or animated and blocks the whole tab.

TypeScript is split into three project references — `tsconfig.app.json` (client, DOM libs), `tsconfig.worker.json` (Worker, workerd types), `tsconfig.node.json` (`vite.config.ts`). Client code must not import from `src/server/`, only from `src/shared/`.

## Visual system

`src/client/theme.ts` and `theme.css` hold every design decision; components must not hard-code colours or sizes.

- **Two semantic accents, nothing else.** `owed` (amber) is money still owed, `settled` (green) is money received and the primary action colour. Both are defined as full Mantine tuples. A third accent would dilute the one signal the app exists to give: one amber row on a quiet page is unmissable.
- **Warm neutrals.** Mantine's blue-grey `dark` scale is replaced with a brown-grey one, so amber and green read as ink on paper rather than neon on black. Page surface comes from `--fmh-paper`, hairlines from `--fmh-rule`.
- **Tabular figures globally** (`font-variant-numeric: tabular-nums lining-nums`). Rents and meter readings are compared down a column; proportional digits make `1` narrower than `8` and the column wobbles. Money cells also carry `.fmh-num` for right alignment.
- **Hairline rows, not zebra stripes.** Stripes compete with the amber highlight that actually means something. `Table` has no `striped` anywhere — the border comes from `theme.css`.
- **`CollectionBar` replaces a status badge** on invoice rows. `CHƯA THANH TOÁN` answers yes/no, but the real question is how much is still out — a half-paid invoice and an untouched one are the same badge. Cancelled invoices get a flat label instead of a ratio, because nothing was ever owed.

Font is **Be Vietnam Pro**, four weights, `latin` + `vietnamese` subsets only, from `@fontsource` rather than a CDN — the CSP allows `font-src 'self'`. About 148 kB of woff2 in `dist/`; the browser fetches only the subsets it needs.

Be Vietnam Pro is wider than the system stack it replaced, which broke two things once already: chart axis ticks and stat-card figures overflowed. Long money figures on an axis use `tienRutGon` (`4,5tr`) with the exact value kept in the tooltip; stat cards size in `rem` and allow wrapping. Re-check both after any type change.

Motion is `motion` (Framer Motion), used in exactly one place: `PageTransition`, a 180 ms 6 px rise on route change. This is a tool opened twenty times a day — an animation that charms on the first view obstructs on the twentieth. `useReducedMotion` collapses the distance rather than removing the component, so layout never shifts between modes.

`QuickSearch` (Ctrl+K) is manager-only and loads the room and invoice lists once at mount. At this scale filtering a few dozen rows in memory beats a search endpoint that would need its own index and its own authorisation story.

Stack: TypeScript, React + Vite, Mantine (UI), `@tabler/icons-react`, `motion`, `@mantine/spotlight`, `@mantine/charts` + Recharts (the dashboard bar chart only), Hono, Cloudflare D1 (SQLite), `jose` for JWT.

Recharts costs about 400 kB raw / 120 kB gzipped and is the reason the client bundle is over 1 MB. It earns that only if the dashboard chart is worth it; if a second opinion ever says no, dropping `RevenueChart` removes the dependency entirely.
