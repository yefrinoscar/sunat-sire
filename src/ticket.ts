import { parsePeriodo, type Periodo } from "./periodo.ts";

export type ArchivoReporte = {
  nomArchivoReporte: string;
  codTipoArchivoReporte: string;
  codProceso?: string;
};

export type TicketState =
  | { kind: "processing"; ticket: string; code: string; desc: string }
  | { kind: "ready"; ticket: string; archivo: ArchivoReporte; periodo: Periodo }
  | { kind: "empty"; ticket: string }
  | { kind: "error"; ticket: string; code: string; desc: string };

const ERROR_CODES = new Set(["03", "07", "10"]);
const EMPTY_NAME_MARKERS = ["sin datos", "vacio", "vacío"] as const;

export function parseSunatTicket(
  input: unknown,
  expected?: { ticket?: string; periodo?: Periodo },
): TicketState {
  const fallbackTicket = expected?.ticket ?? ticketOf(input);
  const registros = registrosOf(input);
  if (registros === undefined) {
    return processing(fallbackTicket, "", "");
  }
  const registro = pickRecord(registros, expected?.ticket) ?? firstRecord(registros);
  if (registro === undefined) {
    return processing(fallbackTicket, "", "");
  }
  const ticket = readString(registro, "numTicket") ?? fallbackTicket;
  const detalle = isRecord(registro.detalleTicket)
    ? registro.detalleTicket
    : undefined;
  const code =
    parseCode(registro.codEstadoProceso) ??
    (detalle !== undefined ? parseCode(detalle.codEstadoEnvio) : undefined) ??
    "";
  const desc =
    readString(registro, "desEstadoProceso") ??
    (detalle !== undefined ? readString(detalle, "desEstadoEnvio") : undefined) ??
    "";
  if (ERROR_CODES.has(code)) {
    return { kind: "error", ticket, code, desc };
  }
  const archivo = parseArchivo(registro, detalle);
  const readyBy06 = code === "06";
  const readyBy04 = code === "04" && archivo !== undefined;
  if (!readyBy06 && !readyBy04) {
    return processing(ticket, code, desc);
  }
  if (readyBy06 && archivo === undefined) {
    return { kind: "empty", ticket };
  }
  if (archivo !== undefined && isEmptyReportName(archivo.nomArchivoReporte)) {
    return { kind: "empty", ticket };
  }
  if (archivo === undefined) {
    return { kind: "empty", ticket };
  }
  const periodo = periodoOf(registro, input) ?? expected?.periodo;
  if (periodo === undefined) {
    return processing(ticket, code, desc);
  }
  return { kind: "ready", ticket, archivo, periodo };
}

function processing(
  ticket: string,
  code: string,
  desc: string,
): TicketState {
  return { kind: "processing", ticket, code, desc };
}

function registrosOf(input: unknown): unknown[] | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const registros = input.registros;
  if (registros === undefined) {
    return undefined;
  }
  if (!Array.isArray(registros)) {
    return undefined;
  }
  return registros;
}

function firstRecord(
  registros: unknown[],
): Record<string, unknown> | undefined {
  const first = registros[0];
  return isRecord(first) ? first : undefined;
}

function pickRecord(
  registros: unknown[],
  ticket: string | undefined,
): Record<string, unknown> | undefined {
  if (ticket === undefined || ticket === "") {
    return undefined;
  }
  for (const item of registros) {
    if (isRecord(item) && readString(item, "numTicket") === ticket) {
      return item;
    }
  }
  return undefined;
}

function ticketOf(input: unknown): string {
  if (!isRecord(input)) {
    return "";
  }
  return readString(input, "numTicket") ?? "";
}

function periodoOf(
  registro: Record<string, unknown>,
  input: unknown,
): Periodo | undefined {
  const raw =
    readString(registro, "perTributario") ??
    readString(registro, "periodo") ??
    (isRecord(input) ? readString(input, "perIni") : undefined);
  if (raw === undefined) {
    return undefined;
  }
  try {
    return parsePeriodo(raw);
  } catch {
    return undefined;
  }
}

function parseArchivo(
  registro: Record<string, unknown>,
  detalle: Record<string, unknown> | undefined,
): ArchivoReporte | undefined {
  const raw =
    registro.archivoReporte ??
    (detalle !== undefined ? detalle.archivoReporte : undefined);
  const list = asArray(raw);
  const first = list[0];
  if (!isRecord(first)) {
    return undefined;
  }
  const nomArchivoReporte = readString(first, "nomArchivoReporte");
  if (nomArchivoReporte === undefined || nomArchivoReporte === "") {
    return undefined;
  }
  // SUNAT responses misspell this as codTipoAchivoReporte.
  // File type is 0/1/2. Status codes are padded to two digits; this field is not.
  const rawTipo =
    readString(first, "codTipoArchivoReporte") ??
    readString(first, "codTipoAchivoReporte") ??
    "0";
  const asNumber = Number(rawTipo);
  const codTipoArchivoReporte = Number.isFinite(asNumber)
    ? String(asNumber)
    : rawTipo;
  const codProceso =
    readString(first, "codProceso") ?? readString(registro, "codProceso");
  if (codProceso === undefined) {
    return { nomArchivoReporte, codTipoArchivoReporte };
  }
  return { nomArchivoReporte, codTipoArchivoReporte, codProceso };
}

function isEmptyReportName(name: string): boolean {
  const lower = name.toLowerCase();
  return EMPTY_NAME_MARKERS.some((marker) => lower.includes(marker));
}

function parseCode(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).padStart(2, "0");
  }
  if (typeof value === "string" && value !== "") {
    return /^\d+$/.test(value) ? value.padStart(2, "0") : value;
  }
  return undefined;
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

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
