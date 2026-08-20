import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { parseCredentials } from "./credentials.ts";
import { parsePeriodo } from "./periodo.ts";
import { fetchPropuesta, listPeriodos } from "./sire.ts";

const USAGE =
  "usage: bun src/cli.ts periodos | bun src/cli.ts propuesta --periodo YYYYMM [--out path]";

async function main(argv: string[]): Promise<void> {
  const command = argv[0];
  if (command === undefined || command === "help" || command === "--help") {
    throw new CliError(USAGE);
  }
  const flags = parseFlags(argv.slice(1));
  if (command === "periodos") {
    const credentials = parseCredentials(process.env);
    const periodos = await listPeriodos(credentials);
    print({ ok: true, periodos });
    return;
  }
  if (command === "propuesta") {
    const rawPeriodo = flags.get("periodo");
    if (rawPeriodo === undefined) {
      throw new CliError("--periodo is required");
    }
    const periodo = parsePeriodo(rawPeriodo);
    const outPath = flags.get("out") ?? `./propuesta-${periodo}.zip`;
    const credentials = parseCredentials(process.env);
    const result = await fetchPropuesta({ credentials, periodo });
    if (result.kind === "empty") {
      print({ ok: true, kind: "empty", ticket: result.ticket });
      return;
    }
    await mkdir(dirname(outPath) || ".", { recursive: true });
    await Bun.write(outPath, result.bytes);
    print({
      ok: true,
      kind: "file",
      path: outPath,
      bytes: result.bytes.byteLength,
      nomArchivo: result.nomArchivo,
      ticket: result.ticket,
    });
    return;
  }
  throw new CliError(USAGE);
}

function parseFlags(argv: string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      break;
    }
    const eq = arg.indexOf("=");
    if (arg.startsWith("--") && eq !== -1) {
      const key = arg.slice(2, eq);
      const value = arg.slice(eq + 1);
      if (key !== "periodo" && key !== "out") {
        throw new CliError(`unknown argument: --${key}`);
      }
      flags.set(key, value);
      continue;
    }
    if (arg === "--periodo" || arg === "--out") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new CliError(`missing value for ${arg}`);
      }
      flags.set(arg.slice(2), value);
      i += 1;
      continue;
    }
    throw new CliError(`unknown argument: ${arg}`);
  }
  return flags;
}

class CliError extends Error {
  override readonly name = "CliError";
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  print({ ok: false, error: message });
  process.exit(1);
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch(fail);
}
