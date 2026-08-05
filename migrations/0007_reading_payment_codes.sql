-- Finishes what 0005 and 0006 started: readings and payments were the last two
-- tables still addressed by row id in a path.
--
-- Same shape, same reasoning — a two-letter prefix plus four random bytes as
-- uppercase hex, added nullable and backfilled rather than rebuilding. payments
-- carries a foreign key into invoices and readings one into rooms, so a rebuild
-- would mean deferring those to gain a NOT NULL the TypeScript input types
-- already enforce.

ALTER TABLE readings ADD COLUMN code TEXT;
ALTER TABLE payments ADD COLUMN code TEXT;

UPDATE readings SET code = 'RD' || upper(hex(randomblob(4))) WHERE code IS NULL;
UPDATE payments SET code = 'PM' || upper(hex(randomblob(4))) WHERE code IS NULL;

CREATE UNIQUE INDEX idx_readings_code ON readings (code);
CREATE UNIQUE INDEX idx_payments_code ON payments (code);
