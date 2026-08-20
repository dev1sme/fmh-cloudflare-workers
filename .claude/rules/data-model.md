# Data model conventions

Table and column names are **English**; enum values are **UPPER_SNAKE English**. Migration `0004_english_names.sql` renamed everything from the original Vietnamese naming — earlier migrations still spell the old names, which is why `0001_init.sql` alone no longer describes the live schema.

```
buildings (id, name, address, electricity_rate, water_rate,
           bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name)
rooms     (id, code, building_id, room_name, rent, area)  UNIQUE(building_id, room_name), UNIQUE(code)
tenants   (id, code, room_id, full_name, phone, occupants,
           moved_in, moved_out)      UNIQUE(room_id) WHERE moved_out IS NULL, UNIQUE(code)
readings  (id, code, room_id, period /YYYY-MM/, electricity_start,
           electricity_end, water_start, water_end,
           recorded_on)                             UNIQUE(room_id, period), UNIQUE(code)
invoices  (id, code, room_id, period, rent_amount, electricity_amount,
           water_amount, other_fees, electricity_rate, water_rate, total,
           status, created_at)                    UNIQUE(room_id, period), UNIQUE(code)
payments  (id, code, invoice_id, amount, paid_on, method, note)       UNIQUE(code)
users     (id, code, username, password_hash, role, room_id)          UNIQUE(code)

bots        (id, code, name, platform, token, active, created_at)          UNIQUE(code)
bot_targets (id, code, bot_id, kind, chat_id, label,
             building_id, active)                    UNIQUE(bot_id, chat_id), UNIQUE(code)
```

`rooms.room_name`, not `name`: rooms are joined into invoices, readings, tenants and accounts where a bare `name` would sit beside `building_name` and read ambiguously. One spelling everywhere also lets `buildSet` pass patch keys straight through as column names.

- `buildings.electricity_rate` / `water_rate` hold the **current** tariff, per building (the two buildings may differ). It is what a newly generated invoice copies from; it is never read when displaying an existing invoice.
- `tenants.moved_out` NULL means still renting. The partial unique index enforces at most one active tenant per room, while keeping past tenants for history. **One tenancy = one named tenant**; several people living in the room are counted in `occupants` (≥ 1, includes the named tenant) rather than as extra rows. Do not "fix" this by allowing multiple active tenants — it is the agreed model.
- The `UNIQUE(room_id, period)` pairs stop a double meter entry from producing two invoices for the same month.
- **Every table a URL can address has a `code`**: `invoices` (`HD…`), `rooms` (`RM…`), `tenants` (`TN…`), `users` (`AC…`), `readings` (`RD…`), `payments` (`PM…`), `bots` (`BT…`), `bot_targets` (`TG…`). Random, never derived from `id`. The prefix is what stops a room code being accepted where a tenant code belongs — `parseCode` checks it before any lookup. `buildings` is the one table left on `:id`; it is manager-only and never appears in a tenant's URL.
- `invoices.code` (`HD3C8EA506`) is the one a human retypes. It is the transfer memo, the URL segment, and what a tenant reads off the invoice. Four random bytes as uppercase hex: `0-9A-F` has no O/I/l to misread when typing it into a bank app, and the unique index catches a collision. Migration 0005 added it nullable rather than rebuilding the table, because `payments` holds a foreign key into `invoices`; the TypeScript input type requires it, so nothing writes a NULL.

Money is `INTEGER` VND — no floats, no minor units. Dates are ISO `TEXT`.

Enum values, all CHECK-constrained, so changing one needs a migration:

| Column | Values |
| --- | --- |
| `invoices.status` | `UNPAID` \| `PAID` \| `CANCELLED` |
| `payments.method` | `BANK_TRANSFER` \| `CASH` |
| `users.role` | `MANAGER` \| `TENANT` |
| `bots.platform` | `ZALO` |
| `bot_targets.kind` | `GROUP` \| `MANAGER` |

SQLite cannot alter a CHECK constraint, so a table whose enum changes has to be rebuilt — that is why `0004` renames most columns in place with `ALTER TABLE … RENAME COLUMN` but rebuilds `invoices`, `payments` and `users`.

Two invariants that the design depends on:

- **Unit prices are snapshotted onto `invoices`** (`electricity_rate`, `water_rate`). Never recompute a past invoice from today's tariff — a price change must not rewrite history.
- **`bots.token` is ciphertext, never plaintext** (`v1.<iv>.<ct>`, AES-GCM under `BOT_ENCRYPTION_KEY`), and no API response returns it. `bot_targets.kind` decides whether a destination is sent amounts at all, which is why it is CHECK-constrained and not patchable. → `notifications.md`
- **`readings` holds meter numbers only; money lives in `invoices`.** This keeps reading history clean and lets a period's opening reading (`electricity_start`/`water_start`) be auto-filled from the previous period's closing reading.

Billing period is `period` in `YYYY-MM` form. Invoice line: `electricity_amount = (electricity_end - electricity_start) * electricity_rate`, same shape for water.

Seed in 0001: one building (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), two rooms (`P101`, `P102`, `rent = 0`), one placeholder tenant. Names and `rent` are placeholders awaiting real data — do not treat them as facts.
