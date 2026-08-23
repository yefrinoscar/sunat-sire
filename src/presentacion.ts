export type PresentationStep = {
  id: string;
  title: string;
  detail: string;
  state: "done" | "ready" | "blocked" | "later";
  howTo?: { title: string; steps: string[] };
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
      howTo: {
        title: `Cómo revisar la propuesta RVIE de ${input.periodo}`,
        steps: [
          "SUNAT arma la propuesta con los comprobantes electrónicos informados por tus clientes y los tuyos. No la escribes tú: llega armada.",
          "Compara contra tu propio registro: facturas, boletas, notas de crédito y débito del mes. Esta pantalla te da los totales por tipo y las casillas 100/101.",
          "Si falta un comprobante o tiene datos malos (RUC, importe), no se arregla acá: lo corrige quien lo emitió o se complementa con tu TXT en el paso 3.",
          "Boletas por menos de S/ 700 a consumidores finales pueden no aparecer; entran igual al libro vía resumen diario del emisor.",
        ],
      },
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
      howTo: {
        title: `Cómo revisar la propuesta RCE de ${input.periodo}`,
        steps: [
          "El RCE solo trae comprobantes electrónicos aceptados. Facturas físicas, DUA/DAM y comprobantes de no domiciliados nunca van a aparecer en la propuesta.",
          "Revisa que el crédito fiscal (IGV neto de compras) coincida con lo que esperas deducir. Boletas no dan crédito fiscal.",
          "Lo que falte se agrega después, complementando la propuesta en SUNAT Operaciones en Línea antes de generar el libro.",
          "Si una factura tuya no está, puede que el proveedor aún no la haya enviado o esté rechazada/observada: verifícalo en su portal de consultas.",
        ],
      },
    },
    {
      id: "decidir",
      title: "3. Aceptar, complementar o reemplazar",
      detail:
        "Aceptar deja la propuesta tal cual. Complementar agrega lo que SUNAT no tiene. Reemplazar manda tu TXT. Esta app no envía ninguno de esos POSTs.",
      state: input.alreadyGenerated ? "done" : "blocked",
      howTo: {
        title: `Cómo aceptar o complementar ${input.periodo}`,
        steps: [
          "Se hace en SUNAT Operaciones en Línea → Libros electrónicos (RVIE/RCE), con clave SOL.",
          "Aceptar con conformidad: cierra la propuesta tal como está. Úsalo solo si todo cuadra.",
          "Complementar: agregas registros nuevos con un TXT adicional sin tocar lo que ya mandó SUNAT.",
          "Reemplazar: sustituye registros anteriores por tu TXT completo. Úsalo si hay errores en filas que ya estaban.",
          "Esta app solo lee y muestra la propuesta: el POST de aceptación/complemento/reemplazo lo haces tú en SOL.",
        ],
      },
    },
    {
      id: "ventana",
      title: "4. Ventana del preliminar",
      detail: preliminarOpen
        ? `El preliminar de ${input.periodo} ya se puede generar (desde el ${formatIsoDate(opens)}).`
        : `El preliminar no se puede generar hasta el ${formatIsoDate(opens)} (día 8 del mes siguiente). Antes solo se revisa la propuesta.`,
      state: preliminarOpen ? "done" : "later",
      howTo: {
        title: "Cuándo se abre la ventana",
        steps: [
          "La propuesta queda visible desde el día siguiente al cierre del mes, pero el preliminar se habilita recién el día 8 del mes siguiente.",
          "Antes del día 8 puedes (y conviene) revisar propuestas y complementar: eso no espera la ventana.",
          "El vencimiento real del libro sigue el cronograma de SUNAT según el último dígito de tu RUC; no confundas ventana de preliminar con fecha límite.",
        ],
      },
    },
    {
      id: "preliminar",
      title: "5. Generar preliminar RVIE + RCE",
      detail:
        "Después de aceptar/complementar. Queda un preliminar; todavía no es el libro. Esta app no llama a registrapreliminar.",
      state: input.alreadyGenerated ? "done" : "blocked",
      howTo: {
        title: `Cómo generar el preliminar de ${input.periodo}`,
        steps: [
          "Desde el día 8, en SOL → Libros electrónicos eliges el periodo y pides el preliminar de RVIE y RCE juntos.",
          "El preliminar consolida propuesta aceptada + complementos + reemplazos y te muestra el resultado final antes del cierre.",
          "Revísalo completo: totales por tipo de comprobante y casillas. Un error detectado aquí todavía se corrige con complemento/reemplazo.",
          "Esta app no llama al endpoint registrapreliminar: ese clic es tuyo en SOL.",
        ],
      },
    },
    {
      id: "generar",
      title: "6. Generar registros en SOL",
      detail: input.alreadyGenerated
        ? "SUNAT ya marca este periodo como generado. Un nuevo envío sería ajuste posterior, no una generación nueva."
        : "El cierre legal (hash + constancia al buzón) se hace en SUNAT Operaciones en Línea. RVIE y RCE juntos. La API no reemplaza ese clic.",
      state: input.alreadyGenerated ? "done" : "blocked",
      howTo: {
        title: `Cómo generar los registros de ${input.periodo}`,
        steps: [
          "En SOL → Libros electrónicos, con el preliminar conforme, confirmas “Generar registros” para RVIE y RCE en el mismo acto.",
          "SUNAT devuelve el hash del cierre y envía la constancia a tu buzón SOL. Ese par es tu evidencia legal del libro.",
          "Después de generado, ya no hay “generar otra vez”: cualquier corrección entra como ajuste posterior.",
          "Guarda la constancia (PDF) junto con la declaración del 621: ante observación de SUNAT son el primer respaldo.",
        ],
      },
    },
    {
      id: "621",
      title: "7. Declaración IGV (FV/PDT 621)",
      detail:
        "SIRE no declara IGV. Después del cierre, SUNAT arma casillas (100 base gravada, 101 IGV). El 621 se presenta aparte en el cronograma de vencimientos.",
      state: input.alreadyGenerated ? "ready" : "blocked",
      howTo: {
        title: `Cómo presentar el 621 de ${input.periodo}`,
        steps: [
          "El 621 se presenta en SUNAT Operaciones en Línea (SOL), no en SIRE ni en esta app.",
          "Entra a sol.sunat.gob.pe con tu usuario y clave SOL, y abrí “Declaraciones y pagos de tributos” → “Declaración de pago IGV – Renta mensual (Formulario Virtual 621)”.",
          "Elegí el periodo tributario. SUNAT precarga las casillas desde los libros aceptados: la 100 trae la base gravada de ventas y la 101 el IGV; las compras (RCE) alimentan el crédito fiscal.",
          "Compará las casillas 100 y 101 con los totales de esta pantalla antes de seguir. Si no coinciden, revisá si faltó complementar el libro.",
          "Si queda saldo a pagar, generá la orden de pago y pagala en bancos autorizados o PagoNet dentro de tu cronograma (según el último dígito del RUC).",
          "Presentá y guardá el número de orden y la constancia. Sin constancia, la declaración no cuenta como presentada.",
        ],
      },
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
