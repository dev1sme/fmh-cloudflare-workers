# Payments

Default flow is manual: each invoice renders a VietQR code whose transfer memo carries the invoice code (e.g. `HD3C8EA506`); the admin marks it paid.

**The QR payload is built in-house** (`src/server/domain/vietqr.ts`, EMVCo TLV with the NAPAS profile) and encoded to SVG in the browser with `@paulmillr/qr`. Do not replace this with `img.vietqr.io` or any QR image service: that would tell a third party who owes how much, and break the page whenever that service is down. The CRC is CRC-16/CCITT-FALSE over the payload including the trailing `6304` tag — verify against the standard vector (`"123456789"` → `29B1`) if you touch it.

Bank details live on `buildings` (`bank_bin`, `bank_account_no`, `bank_account_name`, migration 0002) because each building may collect into a different account. `GET /api/invoices/:id` returns `bank_transfer` with the payload, or **null** when the building has no bank details, the invoice is cancelled, or nothing is left to pay — the UI falls back to showing the invoice code as text. The amount encoded is `outstanding`, not `total`, so a partly paid invoice asks for the remainder.

Every payment detail is copyable through `CopyableRow` (`src/client/components/`): the account number, the amount and the memo each get a visible button. The tenant pays from a phone, so a `title` tooltip on the text is not a discoverable affordance — the button is a real control.

**The amount copies as a raw integer** (`2415000`) while displaying as `2.415.000 đ`. Pasting the formatted string into a banking app transfers the wrong number or is rejected, so `CopyableRow` keeps `value` and `display` separate. Any new money row must do the same.

MoMo is text only, never a QR: MoMo's personal QR payload format is unverified here, and a guessed one could send money to the wrong wallet.

SePay balance-change webhook at `POST /api/webhook/sepay`. It parses the invoice code out of the transfer memo (`parseMaHoaDon`, case-insensitive, normalised to upper case), looks it up with `getInvoiceByCode`, inserts a `payments` row, and then calls `capNhatTrangThai`.

It **re-derives** the status from `SUM(payments)` rather than setting `PAID` outright — the same path a hand-entered payment takes. A tenant who transfers less than the total has paid something, not everything, and the invoice has to keep saying so.

Authentication is **HMAC-SHA256**, the method SePay recommends, not the API-key header. SePay sends `X-SePay-Signature: sha256=<hex>` and `X-SePay-Timestamp: <unix seconds>`, and signs the string `` `${timestamp}.${rawBody}` `` with the **Secret Key** from its dashboard (`SEPAY_WEBHOOK_SECRET`).

**Verify against the raw body, before parsing it.** `c.req.text()` first, `JSON.parse` after. Signing covers the exact bytes SePay sent; parsing and re-serialising reorders keys and drops whitespace, so a signature checked against a round-tripped body never matches.

A delivery whose timestamp is more than 300 seconds from now is refused before the signature is even checked. A signature stays valid forever, so without that window a request captured off the wire could be replayed indefinitely. SePay signs each retry afresh, so this does not fight the retry logic.

The signature comparison uses `soSanhBiMat` (constant-time), not `===`. With the secret unset the route answers 503 rather than 401: no signature would ever verify, and an unconfigured deployment must not accept anonymous writes to `payments`.

**Read the status codes as instructions to SePay, not as a verdict.** SePay retries anything that is not 2xx with `{"success": true}` inside 30 seconds. So everything a retry cannot fix answers **200 and stops** — money going out rather than in, a memo with no code, an unknown invoice, a cancelled invoice, a delivery already recorded. Only bad credentials (401), unparseable JSON (400) and genuine faults (500) are refused.

Retries are why `payments.external_id` exists (migration 0008): the SePay transaction id, with a partial unique index. The index is what makes a repeat safe, including two retries racing — a SELECT-then-INSERT check would let both through. The route catches the constraint failure and answers 200.

A cancelled invoice is left alone. The money still arrived, so that is for the manager to sort out by hand rather than something to record against a bill that was never owed.
