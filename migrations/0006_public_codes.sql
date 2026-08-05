-- Extends the random public code from invoices (0005) to every other table a
-- URL can address: rooms, tenants and users.
--
-- Same shape and same reasoning as 0005 — a two-letter prefix naming the
-- resource plus four random bytes as uppercase hex, added as a nullable
-- column and backfilled rather than rebuilding the table. rooms in particular
-- is referenced by tenants, readings, invoices and users, so a rebuild would
-- mean deferring four foreign keys to save a NOT NULL the TypeScript input
-- types already enforce.
--
-- The prefix is what stops a room code from being accepted where a tenant
-- code belongs; the route validators check it before any lookup happens.

ALTER TABLE rooms   ADD COLUMN code TEXT;
ALTER TABLE tenants ADD COLUMN code TEXT;
ALTER TABLE users   ADD COLUMN code TEXT;

UPDATE rooms   SET code = 'RM' || upper(hex(randomblob(4))) WHERE code IS NULL;
UPDATE tenants SET code = 'TN' || upper(hex(randomblob(4))) WHERE code IS NULL;
UPDATE users   SET code = 'AC' || upper(hex(randomblob(4))) WHERE code IS NULL;

CREATE UNIQUE INDEX idx_rooms_code   ON rooms (code);
CREATE UNIQUE INDEX idx_tenants_code ON tenants (code);
CREATE UNIQUE INDEX idx_users_code   ON users (code);
