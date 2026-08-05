# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the app is

Internal rental-property manager for 2 buildings ("nhà trọ"): record monthly electricity/water meter readings, generate invoices (room rent + electricity + water + other fees), show tenants a VietQR code to pay, keep meter-reading history. Three fixed admin accounts — no signup, no email verification, no password reset.

Scale is deliberately tiny and must stay inside Cloudflare's free tier. Prefer the simplest thing that works; do not introduce infrastructure (queues, KV, Durable Objects, external services) without a concrete need.

## Rules — read the matching file before you work

The detail lives in `.claude/rules/`, one file per topic. **They are not loaded automatically.** Only this file is. Read the rule file that matches the task **before** editing, not after — several of these files exist because something was already broken once by guessing.

| Read this | Before you |
| --- | --- |
| `.claude/rules/project-state.md` | assume what is deployed, what data exists in production vs the local D1, or what is still unbuilt |
| `.claude/rules/architecture.md` | add a file, move code between layers, touch the Vite/Wrangler build, or write a React hook or page |
| `.claude/rules/commands.md` | run any npm script, wrangler, or a migration |
| `.claude/rules/mcp-servers.md` | call a `cloudflare-bindings` or `cloudflare-docs` MCP tool |
| `.claude/rules/data-model.md` | write a migration, add a column, or compute money |
| `.claude/rules/api.md` | add or change any route under `/api`, or touch `src/server/db/` |
| `.claude/rules/envelop-conventions.md` | change the response envelope itself |
| `.claude/rules/auth.md` | touch login, sessions, roles, accounts, or password hashing |
| `.claude/rules/security-headers.md` | change `public/_headers`, `src/server/headers.ts`, or CSP |
| `.claude/rules/payments.md` | touch VietQR, bank details, or the SePay webhook |
| `.claude/rules/secrets.md` | add a secret or wonder where one lives |

When you add a rule file, add a row here. A file with no row is a file nobody opens.

## Hard invariants

These are the ones that cost money, break production, or leak data when broken. They are repeated here so they are in context even when the rule file has not been opened; the file always has the reasoning.

- **Never tune PBKDF2 iterations from a local benchmark.** 10,000 is deliberate and measured on the deployed Worker. This machine is ~3× faster than Cloudflare's CPU, which is exactly how an over-limit login shipped once. → `auth.md`
- **Unit prices are snapshotted onto `invoices`.** Never recompute a past invoice from today's tariff. → `data-model.md`
- **`readings` holds meter numbers only; money lives in `invoices`.** → `data-model.md`
- **Plaintext passwords are never stored, logged, or readable back.** A password is returned exactly once, in the response that created it. → `auth.md`
- **The VietQR payload is built in-house.** Never route it through `img.vietqr.io` or any QR image service — that hands a third party who owes how much. → `payments.md`
- **Handlers never call `c.json` directly.** Go through `ok` / `failure` / `notFound` in `src/server/envelope.ts`. → `api.md`
- **Never pass a request body into `buildSet`.** Column names come from a fixed allowlist at each call site; `...body` would be an injection hole. → `api.md`
- **Error codes are the API contract.** `errors.ts` maps them to Vietnamese. Do not reword or re-case them. → `api.md`
- **`d1_database_query` hits the REMOTE database.** Reads are fine; any write needs explicit approval first. → `mcp-servers.md`
- **`npx` does not work here** — a shell hook rewrites it to `npm`. Use an npm script or `./node_modules/.bin/<bin>`. → `commands.md`
