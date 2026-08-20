export type Credentials = {
  clientId: string;
  clientSecret: string;
  ruc: string;
  solUsuario: string;
  solPassword: string;
};

export class CredentialsError extends Error {
  override readonly name = "CredentialsError";
}

const KEYS = {
  clientId: "SUNAT_CLIENT_ID",
  clientSecret: "SUNAT_CLIENT_SECRET",
  ruc: "SUNAT_RUC",
  solUsuario: "SUNAT_SOL_USER",
  solPassword: "SUNAT_SOL_PASSWORD",
} as const;

export function parseCredentials(
  env: Record<string, string | undefined>,
): Credentials {
  const clientId = requireEnv(env, KEYS.clientId);
  const clientSecret = requireEnv(env, KEYS.clientSecret);
  const ruc = requireEnv(env, KEYS.ruc);
  const solUsuario = requireEnv(env, KEYS.solUsuario);
  const solPassword = requireEnv(env, KEYS.solPassword);
  if (!/^\d{11}$/.test(ruc)) {
    throw new CredentialsError(`${KEYS.ruc} must be 11 digits`);
  }
  return { clientId, clientSecret, ruc, solUsuario, solPassword };
}

export function oauthUsername(credentials: Credentials): string {
  return `${credentials.ruc}${credentials.solUsuario}`;
}

function requireEnv(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim();
  if (value === undefined || value === "") {
    throw new CredentialsError(`missing ${key}`);
  }
  return value;
}
