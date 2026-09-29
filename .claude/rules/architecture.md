# Architecture

Spec: `docs/architecture.md` (layout, layering, code splitting), `docs/ui.md` (two shells, visual system, i18n, theme). Read the one that matches before adding a file, moving code between layers, touching the Vite/Wrangler build, or writing a hook or page.

Must hold:

- One Worker serves SPA + `/api/*` + `/hooks/*`. No meta-framework (Next.js/OpenNext rejected).
- `run_worker_first = ["/api/*", "/hooks/*"]`. A new prefix outside `/api` must be added there or it answers `index.html`.
- Route handlers never write SQL — that lives in `src/server/db/`. Money arithmetic lives in `src/server/domain/invoice.ts`.
- Client never imports from `src/server/`, only `src/shared/`.
- `*Page.tsx` composes only: no `api.ts`, no table/modal JSX, no `try/catch`. `use*.ts` owns data + mutations (return `Promise<boolean>`, raise own toast). Feature components never import `api.ts`.
- Anything passed into a child's `useEffect` is memoised (`useCallback` / `useMemo`) — dropping it loops `ReadingModal` / `GenerateInvoicesModal`.
- Confirm via `useConfirm`, never `window.confirm`.
- Every screen behind login is `React.lazy`; `LoginPage`, `NotFoundPage` and both layouts stay eager. `<Suspense>` inside each layout, outside `PageTransition`.
- Colours and sizes come from `theme.ts` / `theme.css` only. Two accents (`owed`, `settled`), no third. No `striped` tables.
- Everything in code is English: URLs, dirs, columns, fields, codes, enums **and every identifier** (functions, variables, hooks, components, types, props). Vietnamese lives only in UI copy (`locales/vi.ts`) and Zalo message text. Do not reintroduce Vietnamese identifiers.
