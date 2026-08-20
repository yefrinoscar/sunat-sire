import { describe, expect, test } from "bun:test";
import { zipSync } from "fflate";
import { parseRvieZip, summarizeRvie } from "./rvie-file.ts";

describe("parseRvieZip", () => {
  test("reads pipe rows from the txt inside the zip", () => {
    const txt = [
      "Fecha de emisión|Tipo CP/Doc.|Serie del CDP|Nro CP o Doc. Nro Inicial (Rango)|Apellidos Nombres/ Razón Social|Nro Doc Identidad|BI Gravada|IGV / IPM|Total CP|Moneda|Est. Comp",
      "01/07/2026|01|F001|3|Inversiones Tarlan sac|20612245402|205.68|37.02|242.7|PEN|1",
    ].join("\n");
    const zip = zipSync({
      "LE.txt": new TextEncoder().encode(txt),
    });
    const table = parseRvieZip(zip);
    expect(table.txtName).toBe("LE.txt");
    expect(table.rows).toEqual([
      {
        fecha: "01/07/2026",
        tipo: "01",
        serie: "F001",
        numero: "3",
        cliente: "Inversiones Tarlan sac",
        doc: "20612245402",
        bi: "205.68",
        igv: "37.02",
        total: "242.7",
        moneda: "PEN",
        estado: "1",
        exonerado: "",
        inafecto: "",
        exportacion: "",
      },
    ]);
  });
});

describe("summarizeRvie", () => {
  test("splits facturas and boletas and nets credit notes", () => {
    const kpis = summarizeRvie([
      {
        fecha: "",
        tipo: "01",
        serie: "F001",
        numero: "1",
        cliente: "",
        doc: "",
        bi: "100",
        igv: "18",
        total: "118",
        moneda: "PEN",
        estado: "1",
        exonerado: "0",
        inafecto: "0",
        exportacion: "0",
      },
      {
        fecha: "",
        tipo: "03",
        serie: "B001",
        numero: "1",
        cliente: "",
        doc: "",
        bi: "50",
        igv: "9",
        total: "59",
        moneda: "PEN",
        estado: "1",
        exonerado: "0",
        inafecto: "0",
        exportacion: "0",
      },
      {
        fecha: "",
        tipo: "07",
        serie: "FC01",
        numero: "1",
        cliente: "",
        doc: "",
        bi: "10",
        igv: "1.8",
        total: "11.8",
        moneda: "PEN",
        estado: "1",
        exonerado: "0",
        inafecto: "0",
        exportacion: "0",
      },
    ]);
    expect(kpis.facturas.count).toBe(1);
    expect(kpis.boletas.count).toBe(1);
    expect(kpis.notasCredito.count).toBe(1);
    expect(kpis.netoBi).toBe(140);
    expect(kpis.netoTotal).toBeCloseTo(165.2);
  });
});

