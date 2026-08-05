-- Replaces the sequential invoice code (HD00001, derived from the row id)
-- with a random one, so neither the URL nor the transfer memo reveals how
-- many invoices exist or lets one be guessed from another.
--
-- Uppercase hex on purpose. The code is typed by hand into a bank transfer
-- memo, and 0-9A-F contains no O/I/l to be misread as 0/1 — a Base32 or
-- Base62 alphabet would be shorter but would trade typos for length.
--
-- Added as a nullable column rather than rebuilding the table: payments hold
-- a foreign key into invoices, so a rebuild would need the FK deferred or
-- payments dropped and recreated. The column is NOT NULL in the TypeScript
-- input type and always set by createInvoices, and the unique index below
-- catches a collision — a NOT NULL constraint here is not worth risking the
-- payment rows for.

ALTER TABLE invoices ADD COLUMN code TEXT;

-- Backfill any invoice that predates this migration.
UPDATE invoices SET code = 'HD' || upper(hex(randomblob(4))) WHERE code IS NULL;

CREATE UNIQUE INDEX idx_invoices_code ON invoices (code);
