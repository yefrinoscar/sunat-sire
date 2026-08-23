# sunat-sire

GET-only tooling for SUNAT SIRE RVIE ingresos: a Bun CLI, an Astro server-rendered web UI, and a Cloudflare Worker. See `README.md` for user-facing usage.

## Cursor Cloud specific instructions

### Runtime & package manager

- The package manager and runtime is **Bun** (`bun.lock`), not npm/pnpm. Bun is pre-installed in this environment (`/usr/local/bin/bun`); the startup update script runs `bun install`. Do not switch to npm/yarn/pnpm.

### Services and how to run them

- **Tests** — `bun test`. This is the canonical verification command (there is no separate lint script). Tests mock `fetch`, so they run fully offline and need no credentials.
- **Web UI (Astro, primary app)** — `bun run web` serves SSR on http://localhost:4321. Astro/Vite loads env from the repo-root `.env` at server start (`vite.envDir` is the repo root), so **restart the dev server to pick up `.env` changes**. Without valid credentials the page renders a graceful error box instead of period data — that is expected, not a crash.
- **CLI** — `bun src/cli.ts periodos` and `bun src/cli.ts propuesta --periodo YYYYMM`. Reads credentials from `.env` / `process.env`.
- **Cloudflare Worker** — entry `src/worker.ts` (config `wrangler.toml`). `wrangler` is intentionally **not** a project dependency; to run it locally, invoke it on demand with `bunx wrangler dev`. The Worker's routing/auth logic is covered by `bun test` (`src/worker.test.ts`).

### Credentials / external dependency

- Live data (CLI `periodos`/`propuesta`, web period list, Worker `/periodos` and `/propuesta`) requires **real SUNAT SOL credentials** and network access to SUNAT's production API (`api-seguridad.sunat.gob.pe`, `api-sire.sunat.gob.pe`). These are user secrets and are not available by default.
- Copy `.env.example` to `.env` and fill in `SUNAT_*` values plus `API_KEY`. `.env` is git-ignored.

### Gotchas

- `bunx tsc --noEmit` fails out of the box with `TS2688: Cannot find type definition file for 'bun'` because `tsconfig.json` declares `"types": ["bun"]` but the repo does not include `@types/bun`. This is a pre-existing repo condition; use `bun test` for verification rather than `tsc`.
