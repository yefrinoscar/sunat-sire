# sunat-sire

GET-only CLI for SUNAT SIRE RVIE ingresos.

## Setup

Copy `.env.example` to `.env` and fill in your SOL credentials.

OAuth username is `SUNAT_RUC` plus `SUNAT_SOL_USER` with no space. The CLI builds that string. You do not set it yourself.

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

## Tests

```
bun test
```
