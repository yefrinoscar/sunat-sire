# sunat-sire

GET-only CLI for SUNAT SIRE RVIE ingresos.

## Setup

Copy `.env.example` to `.env` and fill in your SOL credentials.

The SOL app must have URI **MIGE RCE y RVIE - SIRE**. Edit the app in Empresas → Credenciales de API SUNAT if token returns `unauthorized_client`.

OAuth username is `SUNAT_RUC` plus `SUNAT_SOL_USER` with no space. The CLI builds that string. You do not set it yourself.

## Web (Astro)

Server-side UI. Credentials stay in `.env`. The browser never sees them.

```
bun run web
```

Open http://localhost:4321 — period list, then a period for the RVIE rows. First load of a period talks to SUNAT and can take about a minute.

## List periodos

```
bun src/cli.ts periodos
```

## Download a propuesta

`--periodo` is required. Default `--out` is `./propuesta-{periodo}.zip`.

```
bun src/cli.ts propuesta --periodo 202507
bun src/cli.ts propuesta --periodo 202507 --out propuesta-202507.zip
```

Success prints JSON on stdout. Failures print `{"ok":false,"error":"..."}` and exit 1.

## Cloudflare Worker

Live URL for the SUNAT app field:

`https://sunat-sire.yefri.workers.dev`

That URL is metadata for SOL. Calls still go Worker → `api-sire.sunat.gob.pe`. The Worker does not fix `unauthorized_client`. MIGE still has to be ticked on ZENTOFACT.

```
curl https://sunat-sire.yefri.workers.dev/health
curl -H "Authorization: Bearer $API_KEY" https://sunat-sire.yefri.workers.dev/periodos
curl -H "Authorization: Bearer $API_KEY" -o propuesta.zip \
  "https://sunat-sire.yefri.workers.dev/propuesta?periodo=202607"
```

`API_KEY` is a Worker secret. It lives in `.env` locally, not in git.

## Tests

```
bun test
```
