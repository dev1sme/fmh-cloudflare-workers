# Data model conventions

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

Seed in 0001: one building (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), two rooms (`P101`, `P102`, `gia_phong = 0`), one placeholder tenant. Names and `gia_phong` are placeholders awaiting real data — do not treat them as facts.
