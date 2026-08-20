export type PeriodoItem = {
  perTributario: string;
  year: string;
  month: string;
  codEstado: string;
  desEstado: string;
  presentado: boolean;
};

export function flattenPeriodos(raw: unknown[]): PeriodoItem[] {
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
      items.push({
        perTributario,
        year: perTributario.slice(0, 4),
        month: perTributario.slice(4, 6),
        codEstado,
        desEstado,
        presentado: desEstado.toLowerCase() === "presentado",
      });
    }
  }
  return items;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
