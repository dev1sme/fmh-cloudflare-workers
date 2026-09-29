# Notifications

Spec: `docs/notifications.md`. Read it before touching Zalo bots, notification destinations, `notify.ts`, `domain/zalo.ts`, or `bots` / `bot_targets`.

Must hold:

- A `GROUP` destination is never sent room names or amounts. `kind` is not patchable.
- `bots.token` is AES-GCM ciphertext (`v1.<iv>.<ct>`), fresh 12-byte IV per encrypt. No response returns a token (`has_token` only). `token` is read in exactly `getBotTokenById` plus the routing query.
- Key unset → 503 `ENCRYPTION_NOT_CONFIGURED`.
- Sending never breaks the trigger: `waitUntil` + `console.error`, `Promise.allSettled`. Only `POST /bot-targets/:code/test` awaits.
- Invoice runs send one message per building, tallied from rows actually created.
- `parse_mode: "markdown"`, not `text_styles`. Escape DB values with `thoat()`. Zalo errors come back as 200 `{"ok": false}`.
