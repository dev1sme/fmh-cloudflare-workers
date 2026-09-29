# API

Spec: `docs/api.md` (surface, behaviour to preserve, SQL safety). Envelope and error-code format: `envelop-conventions.md`. Read both before adding or changing any route under `/api` or touching `src/server/db/`.

Must hold:

- Handlers never call `c.json` — use `ok` / `failure` / `notFound` from `src/server/envelope.ts`. `grep -rn "c\.json(" src/server/` matches only `envelope.ts`.
- Error codes are UPPER_SNAKE English and are the API contract. Never reword or re-case one. Validation keeps its specific code (`MISSING_ROOM_NAME`) plus `details`, never a blanket `VALIDATION_ERROR`.
- A new user-facing error code needs a key in `src/client/i18n/locales/vi.ts` and `en.ts` (check commands in `envelop-conventions.md`).
- Paths address resources by public `code` via `parseCode`, except `/api/buildings/:code`.
- Static sub-paths (`/readings/suggest`, `/invoices/generate-preview`) are registered before `/:code`.
- Every value goes through `.bind()`. Never pass a request body into `buildSet` — build the patch field by field. No `...body` in `src/server/`.
- `electricity_rate` / `water_rate` on an invoice are not patchable. Empty `room_ids` is rejected, not treated as "all".
- Payment status is always re-derived from `SUM(payments)` via `syncInvoiceStatus`; `CANCELLED` is never touched.
- Dashboard: `CANCELLED` excluded from all money; all statements in one `db.batch()`.
- Every new route picks its guard at its own mount (see `auth.md`).

When the surface changes, update `docs/api.md` in the same commit.
