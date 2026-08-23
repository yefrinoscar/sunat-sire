import { parseCredentials, type Credentials } from "../../src/credentials.ts";

export async function serverCredentials(_locals?: unknown): Promise<Credentials> {
  const runtimeEnv = await cloudflareEnv();
  return parseCredentials({
    SUNAT_CLIENT_ID: env("SUNAT_CLIENT_ID", runtimeEnv),
    SUNAT_CLIENT_SECRET: env("SUNAT_CLIENT_SECRET", runtimeEnv),
    SUNAT_RUC: env("SUNAT_RUC", runtimeEnv),
    SUNAT_SOL_USER: env("SUNAT_SOL_USER", runtimeEnv),
    SUNAT_SOL_PASSWORD: env("SUNAT_SOL_PASSWORD", runtimeEnv),
  });
}

async function cloudflareEnv(): Promise<Record<string, string> | undefined> {
  if (isWorkerd()) {
    try {
      const id = "cloudflare:workers";
      const mod = (await import(/* @vite-ignore */ id)) as {
        env?: Record<string, string>;
      };
      return mod.env;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function isWorkerd(): boolean {
  try {
    const nav = (
      globalThis as { navigator?: { userAgent?: string } }
    ).navigator;
    return nav?.userAgent === "Cloudflare-Workers";
  } catch {
    return false;
  }
}

function env(
  key: string,
  runtimeEnv?: Record<string, string>,
): string | undefined {
  const fromRuntime = runtimeEnv?.[key];
  if (typeof fromRuntime === "string" && fromRuntime !== "") {
    return fromRuntime;
  }
  const meta = import.meta.env as Record<string, string | undefined>;
  return meta[key] ?? processEnv(key);
}

function processEnv(key: string): string | undefined {
  try {
    const source = process.env as Record<string, string | undefined>;
    return source[key];
  } catch {
    return undefined;
  }
}
