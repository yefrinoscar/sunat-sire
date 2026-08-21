export type PresentationStep = {
  id: string;
  title: string;
  detail: string;
  state: "done" | "ready" | "blocked" | "later";
};

export type PresentationPlan = {
  periodo: string;
  alreadyGenerated: boolean;
  preliminarOpensOn: string;
  preliminarOpen: boolean;
  rvieHasRows: boolean;
  rceLoaded: boolean;
  steps: PresentationStep[];
};

export function preliminarOpenDate(periodo: string): Date {
  const year = Number(periodo.slice(0, 4));
  const month = Number(periodo.slice(4, 6));
  return new Date(year, month, 8);
}

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildPresentationPlan(input: {
  periodo: string;
  alreadyGenerated: boolean;
  rvieHasRows: boolean;
  rceLoaded?: boolean;
  rceHasRows?: boolean;
  today?: Date;
}): PresentationPlan {
  const today = input.today ?? new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const opens = preliminarOpenDate(input.periodo);
  const preliminarOpen = startToday.getTime() >= opens.getTime();
  const rceLoaded = input.rceLoaded ?? false;
  const rceHasRows = input.rceHasRows ?? false;
  const steps: PresentationStep[] = [
    {
      id: "rvie",
      title: "1. Revisar propuesta RVIE (ventas)",
      detail: input.rvieHasRows
        ? "Propuesta de SUNAT cargada. Esto es lo que se aceptaría si no hay que complementar."
        : "Aún no hay filas de ventas. Mes sin movimiento: igual hay que generar con TXT en blanco.",
      state: input.rvieHasRows ? "done" : "ready",
    },
    {
      id: "rce",
      title: "2. Revisar propuesta RCE (compras)",
      detail: !rceLoaded
        ? "No se pudo cargar compras. La generación SIRE es conjunta con RVIE."
        : rceHasRows
          ? "Propuesta de compras de SUNAT cargada (solo electrónicos). Físicos, DUA y no domiciliados no vienen acá; si hay, hay que complementar en SOL."
          : "Propuesta de compras vacía. Si hubo compras físicas o no domiciliados, hay que complementar. Esta app no las carga.",
      state: rceLoaded ? "done" : "blocked",
    },
    {
      id: "decidir",
      title: "3. Aceptar, complementar o reemplazar",
      detail:
        "Aceptar deja la propuesta tal cual. Complementar agrega lo que SUNAT no tiene. Reemplazar manda tu TXT. Esta app no envía ninguno de esos POSTs.",
      state: input.alreadyGenerated ? "done" : "blocked",
    },
    {
      id: "ventana",
      title: "4. Ventana del preliminar",
      detail: preliminarOpen
        ? `El preliminar de ${input.periodo} ya se puede generar (desde el ${formatIsoDate(opens)}).`
        : `El preliminar no se puede generar hasta el ${formatIsoDate(opens)} (día 8 del mes siguiente). Antes solo se revisa la propuesta.`,
      state: preliminarOpen ? "done" : "later",
    },
    {
      id: "preliminar",
      title: "5. Generar preliminar RVIE + RCE",
      detail:
        "Después de aceptar/complementar. Queda un preliminar; todavía no es el libro. Esta app no llama a registrapreliminar.",
      state: input.alreadyGenerated ? "done" : "blocked",
    },
    {
      id: "generar",
      title: "6. Generar registros en SOL",
      detail: input.alreadyGenerated
        ? "SUNAT ya marca este periodo como generado. Un nuevo envío sería ajuste posterior, no una generación nueva."
        : "El cierre legal (hash + constancia al buzón) se hace en SUNAT Operaciones en Línea. RVIE y RCE juntos. La API no reemplaza ese clic.",
      state: input.alreadyGenerated ? "done" : "blocked",
    },
    {
      id: "621",
      title: "7. Declaración IGV (FV/PDT 621)",
      detail:
        "SIRE no declara IGV. Después del cierre, SUNAT arma casillas (100 base gravada, 101 IGV). El 621 se presenta aparte en el cronograma de vencimientos.",
      state: input.alreadyGenerated ? "ready" : "blocked",
    },
  ];
  return {
    periodo: input.periodo,
    alreadyGenerated: input.alreadyGenerated,
    preliminarOpensOn: formatIsoDate(opens),
    preliminarOpen,
    rvieHasRows: input.rvieHasRows,
    rceLoaded,
    steps,
  };
}
