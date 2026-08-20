# Notifications

Zalo bot messages on two events: an invoice run happened, and money arrived. Nothing else — a tool opened twice a month does not need a notification stream.

## Why this is a table and not three secrets

It was `ZALO_BOT_TOKEN` / `ZALO_GROUP_CHAT_ID` / `ZALO_MANAGER_CHAT_ID` until migration 0009. Env vars hold one bot and two chats fine; they do not hold N. Every extra destination meant a new secret name, a new field on `AppEnv`, a new entry in `wrangler.toml`'s `[secrets] required`, and a deploy — and a name missing from that list is `undefined` at runtime with no warning anywhere, which is a failure mode this project has already paid for once.

So: `bots` (who sends) and `bot_targets` (where to). Managed from **Cài đặt**, no deploy.

## The content split is the point

`bot_targets.kind` decides **what the message says**, not just where it goes:

- `GROUP` — an invoice run happened, for N rooms. **No room names, no amounts.**
- `MANAGER` — a payment arrived, with the room, the sum and what is still owed.

Everything in this app avoids telling one tenant what another owes: invoice codes are random so they cannot be guessed from each other, and the VietQR payload is built in-house so no third party learns who owes what. A group message listing every room's total would undo all of it in one line. That is why `kind` is a CHECK-constrained enum and why **it is not patchable** — changing it is a delete and a re-create, so it cannot happen by mis-clicking a select. The UI shows a warning under the field for the same reason.

`building_id` NULL means every building. Set, it means only that one — which is what lets one group per building exist without either group learning the other's numbers. `POST /api/invoices/generate` therefore sends **one message per building**, tallied from the rows actually created, not one message for the run.

## Tokens are encrypted, not stored plainly

`bots.token` holds `v1.<iv_b64>.<ciphertext_b64>` — AES-GCM under `BOT_ENCRYPTION_KEY` (32 base64 bytes, `openssl rand -base64 32`). `domain/crypto.ts` owns the format; the `v1.` prefix exists so a later rotation can still read what is stored.

A Zalo bot token can post as the bot into every chat the bot is in. That is enough to send the tenants' group a fake invoice notice carrying someone else's bank account, which is a lie tenants have no way to spot. What encryption actually defends against is not an attacker with a Worker — it is a D1 export, an MCP `d1_database_query` (project rules allow those to read the remote database unprompted), and a screenshot of a query result. All three now see ciphertext.

**A fresh random 12-byte IV per encrypt, never reused.** Reusing an IV under one key in GCM does not weaken it, it forfeits it.

The token is **write-only across the whole API**. It goes in on `POST /api/bots` or `POST /api/bots/:code/token`; no response anywhere contains it. `Bot` carries `has_token` instead. Same rule as passwords in `auth.md` — forgotten means replaced, not recovered. `token` appears in exactly one SELECT (`getBotTokenById`) plus the routing query, so there is no route that can leak it by forgetting to strip a field.

With the key unset, the bot routes answer **503 `ENCRYPTION_NOT_CONFIGURED`** rather than storing a token they could never decrypt — the same shape the SePay webhook uses for a missing signing secret. `BOT_ENCRYPTION_KEY` must stay in `wrangler.toml`'s `required` list or it is silently absent from `c.env` in local dev.

**Rotating the key does not re-encrypt existing rows.** Every bot token has to be re-entered in Cài đặt afterwards. A token that will not decrypt logs and skips that bot rather than failing the invoice run.

## Sending must never break what triggered it

`notify.ts` owns routing and fan-out; `domain/zalo.ts` owns the wire call and the wording. Both notification entry points queue through `c.executionCtx.waitUntil` and swallow failures into `console.error`. An invoice run that fails because Zalo is down has done real damage; a missing notification has not. This matters most for the SePay webhook, which gives up after 30 seconds and retries — waiting on Zalo there risks a duplicate payment to save nothing.

Fan-out is `Promise.allSettled`, not `all`. With N destinations, one chat the bot was removed from would otherwise abort the rest. Each failure is logged with its chat id.

`POST /api/bot-targets/:code/test` is the one exception: it awaits and returns the outcome, because the manager clicked it to find out whether a chat id is right. Its message names the target's label, so a chat id pointing somewhere other than the label claims is visible instead of passing as a success.

## Details easy to get wrong

- Messages use `parse_mode: "markdown"`, not `text_styles`. The styles array positions runs by UTF-16 code unit and these messages contain emoji, which are two units each — one miscounted offset bolds the wrong words.
- The API answers **200 with `{"ok": false}`** on failure, so the status code alone does not say whether the message went out.
- Values from the database go through `thoat()` before interpolation — a room name the manager typed can contain `_` or `*`, which would swallow the rest of the line into italics.
- Chat ids are re-derivable at any time: message the bot, `@`-mention it in the group, then call `getUpdates`. Group ids look like `zgr-…`.
