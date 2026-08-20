export type Periodo = string & { readonly __brand: "Periodo" };

export class PeriodoError extends Error {
  override readonly name = "PeriodoError";
}

const PERIODO_RE = /^\d{6}$/;

export function parsePeriodo(raw: string): Periodo {
  if (!PERIODO_RE.test(raw)) {
    throw new PeriodoError(`invalid periodo: ${raw}`);
  }
  const month = Number(raw.slice(4, 6));
  if (month < 1 || month > 12) {
    throw new PeriodoError(`invalid periodo month: ${raw}`);
  }
  const now = new Date();
  const current = now.getFullYear() * 100 + (now.getMonth() + 1);
  if (Number(raw) > current) {
    throw new PeriodoError(`periodo is in the future: ${raw}`);
  }
  return raw as Periodo;
}
