# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the app is

Internal rental-property manager for 2 buildings ("nhà trọ"): record monthly electricity/water meter readings, generate invoices (room rent + electricity + water + other fees), show tenants a VietQR code to pay, keep meter-reading history. Three fixed admin accounts — no signup, no email verification, no password reset.

Scale is deliberately tiny and must stay inside Cloudflare's free tier. Prefer the simplest thing that works; do not introduce infrastructure (queues, KV, Durable Objects, external services) without a concrete need.

## Rules

The detail lives in `.claude/rules/`, one file per topic. Each is imported below, so it is loaded every session.

**A rule file that is not imported here is a rule Claude never sees** — Claude Code loads `CLAUDE.md` automatically but does not read `.claude/rules/` on its own. When adding a rule file, add its `@` line too, or it is dead text.

| File | What it covers |
| --- | --- |
| `project-state.md` | What is built, what is deployed, what is only in the local D1 |
| `architecture.md` | One-Worker layout, the Vite plugin, the file tree, client layering |
| `commands.md` | npm scripts, and the `npx` / `npm audit` traps |
| `mcp-servers.md` | The two Cloudflare MCP servers and when a call needs approval |
| `data-model.md` | Schema, Vietnamese column names, the two pricing invariants |
| `api.md` | Response envelope, endpoint surface, behaviour to preserve, SQL safety |
| `envelop-conventions.md` | The response format standard `api.md` implements |
| `auth.md` | Roles, middlewares, password records, why PBKDF2 is 10k |
| `security-headers.md` | Why headers are set in two places, and the `before next()` trap |
| `payments.md` | VietQR built in-house, bank details per building, the SePay webhook |
| `secrets.md` | Which secrets exist and where they live |

@.claude/rules/project-state.md
@.claude/rules/architecture.md
@.claude/rules/commands.md
@.claude/rules/mcp-servers.md
@.claude/rules/data-model.md
@.claude/rules/api.md
@.claude/rules/envelop-conventions.md
@.claude/rules/auth.md
@.claude/rules/security-headers.md
@.claude/rules/payments.md
@.claude/rules/secrets.md
