# Commands

```bash
npm install
npm run dev                  # Vite + workerd + local D1, one process, http://localhost:5173
npm run build                # tsc -b && vite build -> dist/
npm run deploy               # build + wrangler deploy
npm run typecheck
npm run cf-typegen           # regenerate worker-configuration.d.ts — rerun after editing wrangler.toml
npm run db:migrate           # apply pending migrations to the LOCAL D1
npm run db:migrate:remote    # apply pending migrations to the REMOTE D1 (needs approval)
```

`worker-configuration.d.ts` is generated and gitignored, so a fresh clone must run `npm run cf-typegen` before `npm run typecheck` will pass.

**`npx` does not work in this environment** — a shell hook rewrites it and it resolves to `npm`. Always go through an npm script, or call `./node_modules/.bin/wrangler` directly.

`npm audit` reports vulnerabilities in `undici` reached through `miniflare`/`wrangler`. Those are local-toolchain-only dev dependencies and none of it ships to the Worker; do not "fix" them by downgrading `@cloudflare/vite-plugin`.
