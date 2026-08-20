import { describe, expect, test } from "bun:test";
import { parsePeriodo } from "./periodo.ts";
import { parseSunatTicket } from "./ticket.ts";

describe("parseSunatTicket", () => {
  test("06 with archivo is ready", () => {
    const state = parseSunatTicket({
      registros: [
        {
          numTicket: "T1",
          codEstadoProceso: "06",
          desEstadoProceso: "Terminado",
          perTributario: "202507",
          archivoReporte: [
            {
              nomArchivoReporte: "LE202507.zip",
              codTipoArchivoReporte: "0",
            },
          ],
        },
      ],
    });
    expect(state).toEqual({
      kind: "ready",
      ticket: "T1",
      periodo: "202507",
      archivo: {
        nomArchivoReporte: "LE202507.zip",
        codTipoArchivoReporte: "0",
      },
    });
  });

  test("06 without archivo is empty", () => {
    const state = parseSunatTicket({
      registros: [
        {
          numTicket: "T2",
          codEstadoProceso: "06",
          desEstadoProceso: "Terminado",
          perTributario: "202507",
        },
      ],
    });
    expect(state).toEqual({ kind: "empty", ticket: "T2" });
  });

  test("03 is error", () => {
    const state = parseSunatTicket({
      registros: [
        {
          numTicket: "T3",
          codEstadoProceso: "03",
          desEstadoProceso: "Error",
        },
      ],
    });
    expect(state).toEqual({
      kind: "error",
      ticket: "T3",
      code: "03",
      desc: "Error",
    });
  });

  test("missing registros is processing", () => {
    const state = parseSunatTicket({ numTicket: "T4" });
    expect(state).toEqual({
      kind: "processing",
      ticket: "T4",
      code: "",
      desc: "",
    });
  });

  test("picks the matching ticket among registros", () => {
    const state = parseSunatTicket(
      {
        registros: [
          {
            numTicket: "OTHER",
            codEstadoProceso: "03",
            perTributario: "202507",
          },
          {
            numTicket: "T6",
            codEstadoProceso: "06",
            perTributario: "202507",
            archivoReporte: [
              { nomArchivoReporte: "LE202507.zip", codTipoArchivoReporte: "0" },
            ],
          },
        ],
      },
      { ticket: "T6" },
    );
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") {
      throw new Error("expected ready");
    }
    expect(state.ticket).toBe("T6");
  });

  test("uses expected periodo when SUNAT omits perTributario", () => {
    const state = parseSunatTicket(
      {
        registros: [
          {
            numTicket: "T7",
            codEstadoProceso: "06",
            archivoReporte: [
              { nomArchivoReporte: "LE.zip", codTipoArchivoReporte: "0" },
            ],
          },
        ],
      },
      { ticket: "T7", periodo: parsePeriodo("202507") },
    );
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") {
      throw new Error("expected ready");
    }
    expect(state.periodo).toBe("202507");
  });

  test("normalizes file type 00 to 0", () => {
    const state = parseSunatTicket({
      registros: [
        {
          numTicket: "T8",
          codEstadoProceso: "06",
          perTributario: "202507",
          archivoReporte: [
            {
              nomArchivoReporte: "LE.zip",
              codTipoArchivoReporte: "00",
            },
          ],
        },
      ],
    });
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") {
      throw new Error("expected ready");
    }
    expect(state.archivo.codTipoArchivoReporte).toBe("0");
  });

  test("accepts typo field codTipoAchivoReporte", () => {
    const state = parseSunatTicket({
      registros: [
        {
          numTicket: "T5",
          codEstadoProceso: "06",
          perTributario: "202507",
          archivoReporte: [
            {
              nomArchivoReporte: "LE202507.zip",
              codTipoAchivoReporte: "0",
            },
          ],
        },
      ],
    });
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") {
      throw new Error("expected ready");
    }
    expect(state.archivo.codTipoArchivoReporte).toBe("0");
  });
});
