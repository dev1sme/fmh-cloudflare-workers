# Data model

Spec: `docs/data-model.md`. Read it before writing a migration, adding a column, or computing money.

Must hold:

- Unit prices are snapshotted onto `invoices`. Never recompute a past invoice from today's `buildings` tariff.
- `readings` holds meter numbers only; money lives in `invoices`.
- Money is `INTEGER` VND. Dates are ISO `TEXT`. `period` is `YYYY-MM`.
- One active tenancy per room; extra people go in `occupants`, not extra rows.
- Every URL-addressable table has a random, prefixed `code` (`HD`, `RM`, `TN`, `AC`, `RD`, `PM`, `BT`, `TG`); `buildings` is the only one on `:id`.
- Enums are CHECK-constrained UPPER_SNAKE; changing one means rebuilding the table in a migration.
- `bots.token` is ciphertext; `bot_targets.kind` is not patchable.
- `0001_init.sql` does not describe the live schema (0004 renamed everything). Read the migrations in order, or `PRAGMA table_info`.

When adding a table/column/enum, update `docs/data-model.md` in the same commit.
