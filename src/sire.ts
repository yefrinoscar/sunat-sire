import { oauthUsername, type Credentials } from "./credentials.ts";
import type { Periodo } from "./periodo.ts";
import { parseSunatTicket, type TicketState } from "./ticket.ts";

const COD_LIBRO_RVIE = "140000";
const TOKEN_URL = "https://api-seguridad.sunat.gob.pe/v1/clientessol";
const SIRE_URL = "https://api-sire.sunat.gob.pe/v1/contribuyente/migeigv/libros";
const SCOPE = "https://api-sire.sunat.gob.pe";
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_DELAY_START_MS = 2000;
const POLL_DELAY_CAP_MS = 15000;

export type FetchedPropuesta =
  | { kind: "file"; bytes: Uint8Array; nomArchivo: string; ticket: string }
  | { kind: "empty"; ticket: string };

export class SireError extends Error {
  override readonly name = "SireError";
}

export type Clock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export async function listPeriodos(
  credentials: Credentials,
): Promise<unknown[]> {
  const token = await getToken(credentials);
  const url = `${SIRE_URL}/rvierce/padron/web/omisos/${COD_LIBRO_RVIE}/periodos`;
  const payload = await getJson(url, token);
  return parsePeriodosPayload(payload);
}

export async function fetchPropuesta(input: {
  credentials: Credentials;
  periodo: Periodo;
  clock?: Clock;
}): Promise<FetchedPropuesta> {
  const clock = input.clock ?? defaultClock;
  const token = await getToken(input.credentials);
  const ticket = await startPropuesta(token, input.periodo);
  const state = await pollUntilTerminal(token, ticket, input.periodo, clock);
  switch (state.kind) {
    case "ready": {
      const bytes = await downloadReporte({
        token,
        nomArchivoReporte: state.archivo.nomArchivoReporte,
        codTipoArchivoReporte: state.archivo.codTipoArchivoReporte,
        periodo: input.periodo,
        codProceso: state.archivo.codProceso,
        numTicket: state.ticket,
      });
      return {
        kind: "file",
        bytes,
        nomArchivo: state.archivo.nomArchivoReporte,
        ticket: state.ticket,
      };
    }
    case "empty":
      return { kind: "empty", ticket: state.ticket };
    case "error":
      throw new SireError(
        `ticket ${state.ticket} failed (${state.code}): ${state.desc}`,
      );
    case "processing":
      throw new SireError(`poll timed out after 5 minutes (ticket ${state.ticket})`);
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

async function getToken(credentials: Credentials): Promise<string> {
  const url = `${TOKEN_URL}/${encodeURIComponent(credentials.clientId)}/oauth2/token/`;
  const body = new URLSearchParams({
    grant_type: "password",
    scope: SCOPE,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    username: oauthUsername(credentials),
    password: credentials.solPassword,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new SireError(
      `token request failed (HTTP ${res.status}): ${oauthError(payload)}`,
    );
  }
  if (!isRecord(payload) || typeof payload.access_token !== "string") {
    throw new SireError("token response missing access_token");
  }
  return payload.access_token;
}

async function startPropuesta(
  token: string,
  periodo: Periodo,
): Promise<string> {
  const url = `${SIRE_URL}/rvie/propuesta/web/propuesta/${periodo}/exportapropuesta?codTipoArchivo=0`;
  const payload = await getJson(url, token);
  if (!isRecord(payload)) {
    throw new SireError("propuesta response is not an object");
  }
  const ticket = readString(payload, "numTicket");
  if (ticket === undefined || ticket === "") {
    throw new SireError("propuesta response missing numTicket");
  }
  return ticket;
}

async function pollUntilTerminal(
  token: string,
  ticket: string,
  periodo: Periodo,
  clock: Clock,
): Promise<TicketState> {
  const started = clock.now();
  let delay = POLL_DELAY_START_MS;
  for (;;) {
    const url =
      `${SIRE_URL}/rvierce/gestionprocesosmasivos/web/masivo/consultaestadotickets` +
      `?numTicket=${encodeURIComponent(ticket)}` +
      `&perIni=${periodo}&perFin=${periodo}&page=1&perPage=20`;
    const payload = await getJson(url, token);
    const state = parseSunatTicket(payload, { ticket, periodo });
    if (state.kind !== "processing") {
      return state;
    }
    if (clock.now() - started >= POLL_TIMEOUT_MS) {
      return state;
    }
    await clock.sleep(delay);
    delay = Math.min(delay * 2, POLL_DELAY_CAP_MS);
  }
}

async function downloadReporte(input: {
  token: string;
  nomArchivoReporte: string;
  codTipoArchivoReporte: string;
  periodo: Periodo;
  codProceso?: string;
  numTicket: string;
}): Promise<Uint8Array> {
  const params = new URLSearchParams({
    nomArchivoReporte: input.nomArchivoReporte,
    codTipoArchivoReporte: input.codTipoArchivoReporte,
    codLibro: COD_LIBRO_RVIE,
    perTributario: input.periodo,
    numTicket: input.numTicket,
  });
  if (input.codProceso !== undefined) {
    params.set("codProceso", input.codProceso);
  }
  const url = `${SIRE_URL}/rvierce/gestionprocesosmasivos/web/masivo/archivoreporte?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${input.token}` },
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("json")) {
    const body = await res.text();
    throw new SireError(
      `download returned JSON instead of a file: ${truncate(body)}`,
    );
  }
  if (!res.ok) {
    throw new SireError(`download failed (HTTP ${res.status})`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function getJson(url: string, token: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new SireError(
      `SUNAT request failed (HTTP ${res.status}): ${truncate(safeMessage(payload))}`,
    );
  }
  return payload;
}

function parsePeriodosPayload(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (isRecord(input) && Array.isArray(input.registros)) {
    return input.registros;
  }
  throw new SireError("periodos response is neither an array nor { registros }");
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text === "") {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    if (res.status === 401 && text.toLowerCase().includes("authorization required")) {
      throw new SireError(
        "SUNAT nginx 401 on api-sire. Token is valid. Check Alcance Desktop on the MIGE app and Save.",
      );
    }
    throw new SireError(`invalid JSON from SUNAT (HTTP ${res.status})`);
  }
}

function oauthError(payload: unknown): string {
  if (!isRecord(payload)) {
    return "unknown error";
  }
  const description = readString(payload, "error_description");
  const error = readString(payload, "error");
  return description ?? error ?? "unknown error";
}

function safeMessage(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  if (!isRecord(payload)) {
    return "unknown error";
  }
  return (
    readString(payload, "msg") ??
    readString(payload, "message") ??
    readString(payload, "descripcion") ??
    readString(payload, "error") ??
    "unknown error"
  );
}

function truncate(text: string): string {
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

function readString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = obj[key];
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
