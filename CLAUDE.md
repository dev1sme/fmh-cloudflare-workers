# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the app is

Internal rental-property manager for 2 buildings ("nhà trọ"): record monthly electricity/water meter readings, generate invoices (room rent + electricity + water + other fees), show tenants a VietQR code to pay, keep meter-reading history. Three fixed admin accounts — no signup, no email verification, no password reset.

Scale is deliberately tiny and must stay inside Cloudflare's free tier. Prefer the simplest thing that works; do not introduce infrastructure (queues, KV, Durable Objects, external services) without a concrete need.

## Rules — read the matching file before you work

Two layers, **neither loaded automatically** — only this file is:

- `docs/` (Vietnamese) is the system spec: what the system is and **why**. Single source of truth for design reasoning.
- `.claude/rules/` is thin: each topic file names its spec in `docs/` and lists the must-hold rules. The reasoning is never copied into a rule — it lives in the doc.

Read the rule file that matches the task, then the doc it points to, **before** editing, not after — several of these exist because something was already broken once by guessing. When a change alters behaviour a doc describes, update that doc in the same commit.

| Read this | Spec | Before you |
| --- | --- | --- |
| `.claude/rules/project-state.md` | `docs/roadmap.md` | assume what is deployed, what data exists in production vs the local D1, or what is still unbuilt |
| `.claude/rules/architecture.md` | `docs/architecture.md`, `docs/ui.md` | add a file, move code between layers, touch the Vite/Wrangler build, or write a React hook or page |
| `.claude/rules/commands.md` | `docs/deployment.md` | run any npm script, wrangler, or a migration |
| `.claude/rules/mcp-servers.md` | — | call a `cloudflare-bindings` or `cloudflare-docs` MCP tool |
| `.claude/rules/data-model.md` | `docs/data-model.md` | write a migration, add a column, or compute money |
| `.claude/rules/api.md` | `docs/api.md` | add or change any route under `/api`, touch `src/server/db/`, or change the response envelope |
| `.claude/rules/auth.md` | `docs/auth.md` | touch login, sessions, roles, accounts, or password hashing |
| `.claude/rules/security-headers.md` | `docs/security-headers.md` | change `public/_headers`, `src/server/headers.ts`, or CSP |
| `.claude/rules/payments.md` | `docs/payments.md` | touch VietQR, bank details, or the SePay webhook |
| `.claude/rules/notifications.md` | `docs/notifications.md` | touch Zalo bots, notification destinations, or `bots` / `bot_targets` |
| `.claude/rules/secrets.md` | `docs/deployment.md` | add a secret or wonder where one lives |

When you add a rule or doc file, add a row here. A file with no row is a file nobody opens.

## Hard invariants

These are the ones that cost money, break production, or leak data when broken. They are repeated here so they are in context even when nothing else has been opened; the linked doc always has the reasoning.

- **Never tune PBKDF2 iterations from a local benchmark.** 10,000 is deliberate and measured on the deployed Worker. This machine is ~3× faster than Cloudflare's CPU, which is exactly how an over-limit login shipped once. → `docs/auth.md`
- **Unit prices are snapshotted onto `invoices`.** Never recompute a past invoice from today's tariff. → `docs/data-model.md`
- **`readings` holds meter numbers only; money lives in `invoices`.** → `docs/data-model.md`
- **Plaintext passwords are never stored, logged, or readable back.** A password is returned exactly once, in the response that created it. → `docs/auth.md`
- **The VietQR payload is built in-house.** Never route it through `img.vietqr.io` or any QR image service — that hands a third party who owes how much. → `docs/payments.md`
- **Bot tokens are encrypted at rest and write-only.** `bots.token` is AES-GCM ciphertext; no response anywhere returns a token, and a `GROUP` destination is never sent amounts or room names. → `docs/notifications.md`
- **Handlers never call `c.json` directly.** Go through `ok` / `failure` / `notFound` in `src/server/envelope.ts`. → `docs/api.md`
- **Never pass a request body into `buildSet`.** Column names come from a fixed allowlist at each call site; `...body` would be an injection hole. → `docs/api.md`
- **Error codes are UPPER_SNAKE and are the API contract.** `failure()` and `fail()` throw on anything else. `errors.ts` maps them to Vietnamese. Do not reword or re-case them. → `docs/api.md`
- **`d1_database_query` hits the REMOTE database.** Reads are fine; any write needs explicit approval first. → `.claude/rules/mcp-servers.md`
- **`npx` does not work here** — a shell hook rewrites it to `npm`. Use an npm script or `./node_modules/.bin/<bin>`. → `.claude/rules/commands.md`
