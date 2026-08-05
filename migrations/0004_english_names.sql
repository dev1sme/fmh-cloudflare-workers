-- Renames every column to English and rewrites the enum values to UPPER_SNAKE.
--
-- Two different techniques, for a reason SQLite forces on us:
--
--   * Columns are renamed in place with ALTER TABLE ... RENAME COLUMN, which
--     keeps the data and rewrites the references inside indexes and foreign
--     keys automatically.
--   * Tables whose CHECK constraint spells out enum values (invoices.status,
--     payments.method, users.role) cannot be altered — SQLite has no
--     ALTER CONSTRAINT — so they are rebuilt.
--
-- readings, invoices and payments are empty in production, so they are simply
-- dropped and recreated. users holds the real manager account, so it is copied
-- row by row with its password_hash intact and its role mapped.
--
-- Enum values: chua_thanh_toan/da_thanh_toan/huy -> UNPAID/PAID/CANCELLED,
-- chuyen_khoan/tien_mat -> BANK_TRANSFER/CASH, quan_ly/nguoi_thue ->
-- MANAGER/TENANT.

-- ---------------------------------------------------------------------------
-- buildings, rooms, tenants — rename in place, data preserved
-- ---------------------------------------------------------------------------

ALTER TABLE buildings RENAME COLUMN don_gia_dien TO electricity_rate;
ALTER TABLE buildings RENAME COLUMN don_gia_nuoc TO water_rate;
ALTER TABLE buildings RENAME COLUMN bank_so_tk   TO bank_account_no;
ALTER TABLE buildings RENAME COLUMN bank_chu_tk  TO bank_account_name;
ALTER TABLE buildings RENAME COLUMN momo_sdt     TO momo_phone;
ALTER TABLE buildings RENAME COLUMN momo_ten     TO momo_name;

-- `room_name`, not `name`: rooms are joined into invoices, readings, tenants
-- and accounts, where a bare `name` would sit next to `building_name` and read
-- ambiguously. Keeping one spelling everywhere also means `buildSet` can take
-- the patch keys straight through as column names.
ALTER TABLE rooms RENAME COLUMN ten_phong TO room_name;
ALTER TABLE rooms RENAME COLUMN gia_phong TO rent;
ALTER TABLE rooms RENAME COLUMN dien_tich TO area;

ALTER TABLE tenants RENAME COLUMN ho_ten   TO full_name;
ALTER TABLE tenants RENAME COLUMN sdt      TO phone;
ALTER TABLE tenants RENAME COLUMN so_nguoi TO occupants;
ALTER TABLE tenants RENAME COLUMN ngay_vao TO moved_in;
ALTER TABLE tenants RENAME COLUMN ngay_ra  TO moved_out;

-- The partial index keeps working after the rename, but its own name would
-- still read `dang_thue`.
DROP INDEX idx_tenants_dang_thue;
CREATE UNIQUE INDEX idx_tenants_active ON tenants (room_id) WHERE moved_out IS NULL;

-- ---------------------------------------------------------------------------
-- readings, invoices, payments — empty, so rebuilt outright
-- ---------------------------------------------------------------------------

DROP TABLE payments;
DROP TABLE invoices;
DROP TABLE readings;

CREATE TABLE readings (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id            INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  period             TEXT    NOT NULL,             -- 'YYYY-MM'
  electricity_start  INTEGER NOT NULL,
  electricity_end    INTEGER NOT NULL,
  water_start        INTEGER NOT NULL,
  water_end          INTEGER NOT NULL,
  recorded_on        TEXT    NOT NULL,
  UNIQUE (room_id, period),
  CHECK (period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  CHECK (electricity_end >= electricity_start),
  CHECK (water_end >= water_start)
);

CREATE TABLE invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id             INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  period              TEXT    NOT NULL,            -- 'YYYY-MM'
  rent_amount         INTEGER NOT NULL DEFAULT 0,
  electricity_amount  INTEGER NOT NULL DEFAULT 0,
  water_amount        INTEGER NOT NULL DEFAULT 0,
  other_fees          INTEGER NOT NULL DEFAULT 0,
  -- The tariff at issue time, frozen here. A later price change must never
  -- alter an invoice that has already been issued.
  electricity_rate    INTEGER NOT NULL,
  water_rate          INTEGER NOT NULL,
  total               INTEGER NOT NULL,
  status              TEXT    NOT NULL DEFAULT 'UNPAID',
  created_at          TEXT    NOT NULL,
  UNIQUE (room_id, period),
  CHECK (period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  CHECK (status IN ('UNPAID', 'PAID', 'CANCELLED'))
);

CREATE INDEX idx_invoices_period ON invoices (period);
CREATE INDEX idx_invoices_status ON invoices (status);

CREATE TABLE payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  paid_on     TEXT    NOT NULL,
  method      TEXT    NOT NULL DEFAULT 'BANK_TRANSFER',
  note        TEXT,
  CHECK (method IN ('BANK_TRANSFER', 'CASH'))
);

CREATE INDEX idx_payments_invoice ON payments (invoice_id);

-- ---------------------------------------------------------------------------
-- users — rebuilt to change the CHECK, but every row is carried across
-- ---------------------------------------------------------------------------

CREATE TABLE users_new (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  role           TEXT    NOT NULL,
  -- A tenant account is bound to a ROOM, not a person: when someone moves out
  -- the password changes and the account stays.
  room_id        INTEGER REFERENCES rooms(id) ON DELETE RESTRICT,
  CHECK (role IN ('MANAGER', 'TENANT')),
  CHECK (
    (role = 'MANAGER' AND room_id IS NULL) OR
    (role = 'TENANT'  AND room_id IS NOT NULL)
  )
);

INSERT INTO users_new (id, username, password_hash, role, room_id)
SELECT id,
       username,
       password_hash,
       CASE vai_tro WHEN 'quan_ly' THEN 'MANAGER' ELSE 'TENANT' END,
       room_id
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX idx_users_room ON users (room_id) WHERE room_id IS NOT NULL;
