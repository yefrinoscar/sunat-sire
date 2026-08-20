import { describe, expect, test } from "bun:test";
import { zipSync } from "fflate";
import { parseRvieZip } from "./rvie-file.ts";

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
      },
    ]);
  });
});
