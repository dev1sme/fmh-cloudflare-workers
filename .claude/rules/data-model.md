# Data model conventions

Table and column names are **English**; enum values are **UPPER_SNAKE English**. Migration `0004_english_names.sql` renamed everything from the original Vietnamese naming — earlier migrations still spell the old names, which is why `0001_init.sql` alone no longer describes the live schema.

```
buildings (id, name, address, electricity_rate, water_rate,
           bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name)
rooms     (id, building_id, room_name, rent, area)              UNIQUE(building_id, room_name)
tenants   (id, room_id, full_name, phone, occupants,
           moved_in, moved_out)                                 UNIQUE(room_id) WHERE moved_out IS NULL
readings  (id, room_id, period /YYYY-MM/, electricity_start, electricity_end,
           water_start, water_end, recorded_on)                 UNIQUE(room_id, period)
invoices  (id, room_id, period, rent_amount, electricity_amount, water_amount,
           other_fees, electricity_rate, water_rate, total,
           status, created_at)                                  UNIQUE(room_id, period)
payments  (id, invoice_id, amount, paid_on, method, note)
users     (id, username, password_hash, role, room_id)
```

`rooms.room_name`, not `name`: rooms are joined into invoices, readings, tenants and accounts where a bare `name` would sit beside `building_name` and read ambiguously. One spelling everywhere also lets `buildSet` pass patch keys straight through as column names.

- `buildings.electricity_rate` / `water_rate` hold the **current** tariff, per building (the two buildings may differ). It is what a newly generated invoice copies from; it is never read when displaying an existing invoice.
- `tenants.moved_out` NULL means still renting. The partial unique index enforces at most one active tenant per room, while keeping past tenants for history. **One tenancy = one named tenant**; several people living in the room are counted in `occupants` (≥ 1, includes the named tenant) rather than as extra rows. Do not "fix" this by allowing multiple active tenants — it is the agreed model.
- The `UNIQUE(room_id, period)` pairs stop a double meter entry from producing two invoices for the same month.

Money is `INTEGER` VND — no floats, no minor units. Dates are ISO `TEXT`.

Enum values, all CHECK-constrained, so changing one needs a migration:

| Column | Values |
| --- | --- |
| `invoices.status` | `UNPAID` \| `PAID` \| `CANCELLED` |
| `payments.method` | `BANK_TRANSFER` \| `CASH` |
| `users.role` | `MANAGER` \| `TENANT` |

SQLite cannot alter a CHECK constraint, so a table whose enum changes has to be rebuilt — that is why `0004` renames most columns in place with `ALTER TABLE … RENAME COLUMN` but rebuilds `invoices`, `payments` and `users`.

Two invariants that the design depends on:

- **Unit prices are snapshotted onto `invoices`** (`electricity_rate`, `water_rate`). Never recompute a past invoice from today's tariff — a price change must not rewrite history.
- **`readings` holds meter numbers only; money lives in `invoices`.** This keeps reading history clean and lets a period's opening reading (`electricity_start`/`water_start`) be auto-filled from the previous period's closing reading.

Billing period is `period` in `YYYY-MM` form. Invoice line: `electricity_amount = (electricity_end - electricity_start) * electricity_rate`, same shape for water.

Seed in 0001: one building (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), two rooms (`P101`, `P102`, `rent = 0`), one placeholder tenant. Names and `rent` are placeholders awaiting real data — do not treat them as facts.
