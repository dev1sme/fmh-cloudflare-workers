# Payments

Spec: `docs/payments.md`. Read it before touching VietQR, bank details, MoMo, or the SePay webhook.

Must hold:

- The VietQR payload is built in-house (`src/server/domain/vietqr.ts`). Never route it through `img.vietqr.io` or any QR image service. Touching CRC: verify `"123456789"` → `29B1`.
- The QR encodes `outstanding`, not `total`.
- Money rows copy the raw integer (`value`) while showing the formatted string (`display`) — `CopyableRow`.
- MoMo is text only, never a QR.
- Webhook: `/hooks/*` must stay in `run_worker_first`. Verify HMAC against the raw body before `JSON.parse`; 300 s timestamp window; constant-time compare; unset secret → 503.
- Everything a retry cannot fix answers 200. Idempotency is the `payments.external_id` unique index, not a SELECT-then-INSERT.
- Status is re-derived via `capNhatTrangThai`, never set to `PAID` outright. Cancelled invoices are left alone.
