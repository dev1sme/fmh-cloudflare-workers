-- Ties a payment row to the bank transaction that produced it, so the SePay
-- webhook can be delivered twice without being recorded twice.
--
-- SePay retries any delivery that does not answer 200/201 with {"success":true}
-- inside 30 seconds, so a duplicate is not an edge case — a slow response is
-- enough to cause one. Without this, one transfer becomes two `payments` rows
-- and the invoice reads as overpaid.
--
-- The uniqueness is a UNIQUE INDEX rather than a check in the handler on
-- purpose: two retries arriving at once both pass a SELECT-then-INSERT, and
-- only the index stops the second write. The route catches the constraint
-- failure and answers 200, because a duplicate means the work is already done.
--
-- Partial, so the manager's hand-entered payments keep a NULL here and do not
-- collide with each other.
ALTER TABLE payments ADD COLUMN external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_external_id
  ON payments (external_id)
  WHERE external_id IS NOT NULL;
