# API

Everything below `/api` except `/api/health` and `/api/auth/*` requires a session.

## Response envelope

**Every response is wrapped in an envelope**, per the response format rules in `envelop-conventions.md`:

```jsonc
// success
{ "success": true,  "message": "Invoices retrieved.", "data": { "invoices": [] }, "meta": { "timestamp": 1785900251 } }
// failure
{ "success": false, "message": "Duplicate data.", "error": { "code": "trung_du_lieu", "details": null }, "meta": { "timestamp": 1785900251 } }
```

- Handlers **never call `c.json` directly** — they go through `ok` / `failure` / `notFound` in `src/server/envelope.ts`, so `success`, `message` and `meta.timestamp` cannot be present on one endpoint and missing on the next. `grep -rn "c\.json(" src/server/` should only ever match `envelope.ts`.
- `data` keeps the inner shape each route always returned (`{ invoices }`, `{ room }`, `{ ok: true }`) rather than being flattened. That is why `request<T>` in `api.ts` unwraps exactly one level and every caller in the client was left untouched.
- **Error codes stayed lowercase snake_case** (`trung_du_lieu`, `missing_ten_phong`) even though the rule's examples show `SCREAMING_SNAKE`. The rule states no case convention, and the codes are the contract `errors.ts` maps to Vietnamese. Do not rename them.
- Validation keeps its **specific** code (`missing_ten_phong`), not a blanket `VALIDATION_ERROR`, and adds `details` on top: `{ "ten_phong": ["missing_ten_phong"] }`. `chiTietValidation` derives the field from the code, so domain codes that name no field (`dien_moi_nho_hon_dien_cu`) get `details: null`. Sending `VALIDATION_ERROR` instead would force the Vietnamese wording onto the server, which is not where it lives.
- `message` is English prose for logs and integrators. The SPA never displays it — it renders its own Vietnamese from `error.code`. Never put an internal exception message there; `onError` logs the real error and returns `loi_he_thong`.

## Surface

Management (`requireQuanLy`): full CRUD on `/buildings`, `/rooms`, `/tenants`, `/readings`, `/invoices`, plus `DELETE /payments/:id` and `GET /summary`.

The app is not hard-wired to two buildings and four rooms: the manager adds a building from **Cài đặt** (each with its own `don_gia_dien` / `don_gia_nuoc`) and rooms from **Phòng**. Deleting is FK-restricted — a building with rooms, or a room with readings/invoices/tenants, returns 409 `rang_buoc_du_lieu` rather than cascading. Room names are unique per building, not globally. A room cannot be moved to another building and a tenancy cannot be moved to another room; both would rewrite priced history, so the UI disables those selects when editing.

Accounts (`/api/accounts`, manager only): `GET` lists them, `POST` creates one (password optional — omitted means the server generates a 20-character one), `PATCH` renames, `POST /:id/reset-password` resets **without asking for the current password**, `DELETE` removes. Two guards keep the app reachable: you cannot delete the account you are logged in as (`khong_tu_xoa`), and you cannot delete the last manager (`phai_con_mot_quan_ly`). One account per room is enforced by the partial unique index.

`POST /api/auth/change-password` is the self-service change, open to both roles, and it **does** require the current password — a session cookie alone must not be enough to lock the real owner out of an unattended device. The manager's reset is the opposite case and deliberately skips it.

Sessions are stateless, so a reset does not kick out an existing session — the old JWT stays valid until it expires. That is acceptable here (three accounts, one manager); fixing it would need a token version column and a lookup per request.

On `/tenants`: POST moves someone in, `PATCH { ngay_ra: "…" }` moves them out, `PATCH { ngay_ra: null }` undoes a mistaken move-out (409 if the room already has a new tenant), and DELETE erases a record entered by mistake. `GET /tenants` returns everyone ever, newest tenancy per room first, with `ten_phong` joined in; `?active=1` narrows it to current tenants and `?room_id=` to one room. Moving a tenancy to another room is not supported — that is a new tenancy.

Tenant (`requirePhong`): `GET /api/me/room`, `/api/me/invoices`, `/api/me/invoices/:id`, `/api/me/readings`. Read-only by design — tenants never mark an invoice paid; that is the manager's action, or the SePay webhook's.

## Behaviour worth preserving

- `POST /api/readings` fills `dien_cu`/`nuoc_cu` from the previous period's closing numbers when they are omitted; `GET /api/readings/suggest?room_id=&ky=` returns the same suggestion for pre-filling a form. That route is registered **before** `/:id` — order matters in Hono.
- `GET /api/invoices/generate-preview?ky=` reports every room for a period, its `trang_thai` (`san_sang` | `thieu_chi_so` | `da_co_hoa_don`) and the amounts it would be billed, writing nothing. It is registered **before** `/:id` for the same reason. Both it and `POST /generate` price rooms through `tamTinhHoaDon`, so the preview is by construction what generation writes.
- `POST /api/invoices/generate` takes `{ ky, room_ids? }` and returns `{ created, skipped }`. Omitting `room_ids` bills every room; an **empty array is rejected** (`thieu_room_ids`) rather than falling back to "every room", in both the route and the query builder. Rooms with no reading or an existing invoice are reported in `skipped` rather than failing the batch, because the manager needs to know which rooms still need a meter entry. Inserts run in one `db.batch()`, so a period is created all-or-nothing.
- `PATCH /api/invoices/:id` accepts `tien_phong`, `phi_khac` and `trang_thai` only, and recomputes `tong_tien`. **`don_gia_*` is deliberately not patchable** — fixing a wrong tariff means deleting the invoice and generating it again, so a stored invoice always matches the price it was issued at.
- Recording or deleting a payment re-derives `trang_thai` from `SUM(payments)` vs `tong_tien` (`capNhatTrangThai` in `routes/payments.ts`). A `huy` invoice is never touched by that arithmetic and rejects new payments.
- Errors: `ValidationError` → 400 with a stable code (`invalid_ky`, `dien_moi_nho_hon_dien_cu`, …); D1 UNIQUE → 409 `trung_du_lieu`; FOREIGN KEY → 409 `rang_buoc_du_lieu`; CHECK → 400. Codes are the API contract — the client maps them to Vietnamese, so do not reword them casually.

## SQL safety

Every value reaches D1 through `.bind()`. The only strings interpolated into SQL are file-level constants (`COLUMNS`, `SELECT`), generated placeholders (`roomIds.map(() => "?")`), and column names from `buildSet` / `Where`.

`buildSet` takes column names from its argument's keys, so a route that passed a request body straight in would open an injection hole. Every call site builds the patch field by field instead — there is no `...body` anywhere in `src/server/`. Keep it that way rather than adding runtime escaping.
