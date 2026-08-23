# sunat-sire

GET-only tooling for SUNAT SIRE RVIE ingresos: a Bun CLI, an Astro + React (HeroUI) web app, and Cloudflare Workers. See `README.md` for user-facing usage.

The **primary app** is the web UI (`web/`): period list, RVIE/RCE propuesta, casillas 621. It is already deployed at `https://sunat-sire-web.yefri.workers.dev`. Local Cloud Agents should treat `bun run web` as the thing to run and verify.

## Cursor Cloud specific instructions

### Runtime & package manager

- The package manager and runtime is **Bun** (`bun.lock`), not npm/pnpm. The environment install/update script bootstraps Bun (official installer → `~/.bun/bin`, symlinked to `/usr/local/bin` when possible) and then runs `bun install`. Do not switch to npm/yarn/pnpm.

### Services and how to run them

- **Tests** — `bun test`. This is the canonical verification command (there is no separate lint script). Tests mock `fetch`, so they run fully offline and need no credentials.
- **Web UI (primary app)** — `bun run web` serves SSR on http://localhost:4321 (`astro dev --root web`). Stack: Astro 7 + `@astrojs/react` + HeroUI + Tailwind. Local adapter is `@astrojs/node`; production is `@astrojs/cloudflare` via `web/astro.config.cloudflare.mjs` and `web/wrangler.toml` (worker name `sunat-sire-web`). Astro/Vite loads env from the repo-root `.env` at server start (`vite.envDir` is the repo root), so **restart the dev server to pick up `.env` changes**. Without valid credentials the page renders a graceful error box instead of period data — that is expected, not a crash.
- **CLI** — `bun src/cli.ts periodos` and `bun src/cli.ts propuesta --periodo YYYYMM`. Reads credentials from `.env` / `process.env`.
- **API Worker** — entry `src/worker.ts` (config `wrangler.toml`, live `https://sunat-sire.yefri.workers.dev`). `wrangler` is intentionally **not** a project dependency; to run it locally, invoke it on demand with `bunx wrangler dev`. The Worker's routing/auth logic is covered by `bun test` (`src/worker.test.ts`).

### Credentials / external dependency

- Live data (CLI `periodos`/`propuesta`, web period list, API Worker `/periodos` and `/propuesta`) requires **real SUNAT SOL credentials** and network access to SUNAT's production API (`api-seguridad.sunat.gob.pe`, `api-sire.sunat.gob.pe`). These are user secrets and are not available by default.
- Copy `.env.example` to `.env` and fill in `SUNAT_*`. The web app uses only those keys. The API Worker also needs `API_KEY` (a Worker secret; not in `.env.example`). `.env` is git-ignored.

### Gotchas

- `bunx tsc --noEmit` fails out of the box with `TS2688: Cannot find type definition file for 'bun'` because `tsconfig.json` declares `"types": ["bun"]` but the repo does not include `@types/bun`. This is a pre-existing repo condition; use `bun test` for verification rather than `tsc`.
