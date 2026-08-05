# API

Everything below `/api` except `/api/health` and `/api/auth/*` requires a session.

## Response envelope

**Every response is wrapped in an envelope**, per the response format rules in `envelop-conventions.md`:

```jsonc
// success
{ "success": true,  "message": "Invoices retrieved.", "data": { "invoices": [] }, "meta": { "timestamp": 1785900251 } }
// failure
{ "success": false, "message": "Duplicate data.", "error": { "code": "DUPLICATE_DATA", "details": null }, "meta": { "timestamp": 1785900251 } }
```

- Handlers **never call `c.json` directly** — they go through `ok` / `failure` / `notFound` in `src/server/envelope.ts`, so `success`, `message` and `meta.timestamp` cannot be present on one endpoint and missing on the next. `grep -rn "c\.json(" src/server/` should only ever match `envelope.ts`.
- `data` keeps the inner shape each route always returned (`{ invoices }`, `{ room }`, `{ ok: true }`) rather than being flattened. That is why `request<T>` in `api.ts` unwraps exactly one level and every caller in the client was left untouched.
- **Error codes are UPPER_SNAKE English** (`DUPLICATE_DATA`, `MISSING_ROOM_NAME`), enforced at runtime: both `failure()` in `envelope.ts` and `fail()` in `validate.ts` throw on anything else. They are the contract `errors.ts` maps to Vietnamese — renaming one is a breaking change.
- Validation keeps its **specific** code (`MISSING_ROOM_NAME`), not a blanket `VALIDATION_ERROR`, and adds `details` on top: `{ "room_name": ["MISSING_ROOM_NAME"] }`. `chiTietValidation` derives the field from the code and lowercases it back, so domain codes that name no field (`ELECTRICITY_END_BELOW_START`) get `details: null`. Sending `VALIDATION_ERROR` instead would force the Vietnamese wording onto the server, which is not where it lives.
- `message` is English prose for logs and integrators. The SPA never displays it — it renders its own Vietnamese from `error.code`. Never put an internal exception message there; `onError` logs the real error and returns `INTERNAL_ERROR`.

## Surface

Management (`requireQuanLy`): full CRUD on `/buildings`, `/rooms`, `/tenants`, `/readings`, `/invoices`, plus `DELETE /payments/:id`, `GET /summary` and `GET /dashboard`.

`GET /api/dashboard?period=` (defaults to the current month) is a read-only rollup for the manager's home screen: revenue for the period, outstanding debt per room **across every period**, occupancy, meter usage against the previous period, and the last 12 periods for the chart. Its fields are English (`billed`, `collected`, `outstanding`) because it mirrors no table.

Two things it must keep doing: `CANCELLED` invoices are excluded from every money figure — a cancelled invoice was never owed — and all six statements go out in one `db.batch()`, because a serial chain of awaits spends most of the Worker's ~10 ms CPU budget waiting.

The app is not hard-wired to two buildings and four rooms: the manager adds a building from **Cài đặt** (each with its own `electricity_rate` / `water_rate`) and rooms from **Phòng**. Deleting is FK-restricted — a building with rooms, or a room with readings/invoices/tenants, returns 409 `RELATED_DATA_EXISTS` rather than cascading. Room names are unique per building, not globally. A room cannot be moved to another building and a tenancy cannot be moved to another room; both would rewrite priced history, so the UI disables those selects when editing.

Accounts (`/api/accounts`, manager only): `GET` lists them, `POST` creates one (password optional — omitted means the server generates a 20-character one), `PATCH` renames, `POST /:id/reset-password` resets **without asking for the current password**, `DELETE` removes. Two guards keep the app reachable: you cannot delete the account you are logged in as (`CANNOT_DELETE_SELF`), and you cannot delete the last manager (`LAST_MANAGER_REQUIRED`). One account per room is enforced by the partial unique index.

`POST /api/auth/change-password` is the self-service change, open to both roles, and it **does** require the current password — a session cookie alone must not be enough to lock the real owner out of an unattended device. The manager's reset is the opposite case and deliberately skips it.

Sessions are stateless, so a reset does not kick out an existing session — the old JWT stays valid until it expires. That is acceptable here (three accounts, one manager); fixing it would need a token version column and a lookup per request.

On `/tenants`: POST moves someone in, `PATCH { moved_out: "…" }` moves them out, `PATCH { moved_out: null }` undoes a mistaken move-out (409 if the room already has a new tenant), and DELETE erases a record entered by mistake. `GET /tenants` returns everyone ever, newest tenancy per room first, with `room_name` joined in; `?active=1` narrows it to current tenants and `?room_id=` to one room. Moving a tenancy to another room is not supported — that is a new tenancy.

Tenant (`requirePhong`): `GET /api/me/room`, `/api/me/invoices`, `/api/me/invoices/:id`, `/api/me/readings`. Read-only by design — tenants never mark an invoice paid; that is the manager's action, or the SePay webhook's.

## Behaviour worth preserving

- `POST /api/readings` fills `electricity_start`/`water_start` from the previous period's closing numbers when they are omitted; `GET /api/readings/suggest?room_id=&period=` returns the same suggestion for pre-filling a form. That route is registered **before** `/:id` — order matters in Hono.
- `GET /api/invoices/generate-preview?period=` reports every room for a period, its `status` (`READY` | `MISSING_READING` | `ALREADY_INVOICED`) and the amounts it would be billed, writing nothing. It is registered **before** `/:id` for the same reason. Both it and `POST /generate` price rooms through `estimateInvoice`, so the preview is by construction what generation writes.
- `POST /api/invoices/generate` takes `{ period, room_ids? }` and returns `{ created, skipped }`. Omitting `room_ids` bills every room; an **empty array is rejected** (`EMPTY_ROOM_IDS`) rather than falling back to "every room", in both the route and the query builder. Rooms with no reading or an existing invoice are reported in `skipped` rather than failing the batch, because the manager needs to know which rooms still need a meter entry. Inserts run in one `db.batch()`, so a period is created all-or-nothing.
- `PATCH /api/invoices/:id` accepts `rent_amount`, `other_fees` and `status` only, and recomputes `total`. **`electricity_rate` / `water_rate` are deliberately not patchable** — fixing a wrong tariff means deleting the invoice and generating it again, so a stored invoice always matches the price it was issued at.
- Recording or deleting a payment re-derives `status` from `SUM(payments.amount)` vs `total` (`capNhatTrangThai` in `routes/payments.ts`). A `CANCELLED` invoice is never touched by that arithmetic and rejects new payments.
- Errors: `ValidationError` → 400 with a stable code (`INVALID_PERIOD`, `ELECTRICITY_END_BELOW_START`, …); D1 UNIQUE → 409 `DUPLICATE_DATA`; FOREIGN KEY → 409 `RELATED_DATA_EXISTS`; CHECK → 400. Codes are the API contract — the client maps them to Vietnamese, so do not reword them casually.

## SQL safety

Every value reaches D1 through `.bind()`. The only strings interpolated into SQL are file-level constants (`COLUMNS`, `SELECT`), generated placeholders (`roomIds.map(() => "?")`), and column names from `buildSet` / `Where`.

`buildSet` takes column names from its argument's keys, so a route that passed a request body straight in would open an injection hole. Every call site builds the patch field by field instead — there is no `...body` anywhere in `src/server/`. Keep it that way rather than adding runtime escaping.
