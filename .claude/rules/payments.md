# Payments

Default flow is manual: each invoice renders a VietQR code whose transfer memo carries the invoice code (e.g. `HD00123`); the admin marks it paid.

**The QR payload is built in-house** (`src/server/domain/vietqr.ts`, EMVCo TLV with the NAPAS profile) and encoded to SVG in the browser with `@paulmillr/qr`. Do not replace this with `img.vietqr.io` or any QR image service: that would tell a third party who owes how much, and break the page whenever that service is down. The CRC is CRC-16/CCITT-FALSE over the payload including the trailing `6304` tag — verify against the standard vector (`"123456789"` → `29B1`) if you touch it.

Bank details live on `buildings` (`bank_bin`, `bank_so_tk`, `bank_chu_tk`, migration 0002) because each building may collect into a different account. `GET /api/invoices/:id` returns `chuyen_khoan` with the payload, or **null** when the building has no bank details, the invoice is cancelled, or nothing is left to pay — the UI falls back to showing the invoice code as text. The amount encoded is `con_lai`, not `tong_tien`, so a partly paid invoice asks for the remainder.

MoMo is text only, never a QR: MoMo's personal QR payload format is unverified here, and a guessed one could send money to the wrong wallet.

Optional automation: SePay balance-change webhook at `/api/webhook/sepay` parses the invoice code out of the transfer memo, sets `invoices.trang_thai = 'da_thanh_toan'`, and inserts a `payments` row. The webhook must authenticate with `SEPAY_WEBHOOK_TOKEN` before mutating anything, using a constant-time compare rather than `===`.
