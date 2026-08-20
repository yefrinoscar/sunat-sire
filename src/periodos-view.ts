export type PeriodoItem = {
  perTributario: string;
  year: string;
  month: string;
  codEstado: string;
  desEstado: string;
  labelEstado: string;
  presentado: boolean;
  enCurso: boolean;
};

export function flattenPeriodos(
  raw: unknown[],
  today = new Date(),
): PeriodoItem[] {
  const current = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const items: PeriodoItem[] = [];
  for (const ejercicio of raw) {
    if (!isRecord(ejercicio) || !Array.isArray(ejercicio.lisPeriodos)) {
      continue;
    }
    for (const periodo of ejercicio.lisPeriodos) {
      if (!isRecord(periodo)) {
        continue;
      }
      const perTributario =
        typeof periodo.perTributario === "string" ? periodo.perTributario : "";
      if (!/^\d{6}$/.test(perTributario)) {
        continue;
      }
      const desEstado = typeof periodo.desEstado === "string" ? periodo.desEstado : "";
      const codEstado = typeof periodo.codEstado === "string" ? periodo.codEstado : "";
      const presentado = desEstado.toLowerCase() === "presentado";
      const enCurso = perTributario === current;
      items.push({
        perTributario,
        year: perTributario.slice(0, 4),
        month: perTributario.slice(4, 6),
        codEstado,
        desEstado,
        labelEstado: enCurso && !presentado ? "En curso" : presentado ? "Generado" : "Sin generar",
        presentado,
        enCurso,
      });
    }
  }
  items.sort((a, b) => b.perTributario.localeCompare(a.perTributario));
  return items;
}

export function shiftPeriodo(perTributario: string, delta: number): string {
  let year = Number(perTributario.slice(0, 4));
  let month = Number(perTributario.slice(4, 6)) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}${String(month).padStart(2, "0")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
