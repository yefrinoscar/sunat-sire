import { parseCredentials, type Credentials } from "../../src/credentials.ts";

export function serverCredentials(): Credentials {
  return parseCredentials({
    SUNAT_CLIENT_ID: env("SUNAT_CLIENT_ID"),
    SUNAT_CLIENT_SECRET: env("SUNAT_CLIENT_SECRET"),
    SUNAT_RUC: env("SUNAT_RUC"),
    SUNAT_SOL_USER: env("SUNAT_SOL_USER"),
    SUNAT_SOL_PASSWORD: env("SUNAT_SOL_PASSWORD"),
  });
}

function env(key: string): string | undefined {
  const meta = import.meta.env as Record<string, string | undefined>;
  return meta[key] ?? process.env[key];
}
