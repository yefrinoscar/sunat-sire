import { describe, expect, test } from "bun:test";
import { zipSync } from "fflate";
import { parseRceZip, summarizeRce } from "./rce-file.ts";

describe("parseRceZip", () => {
  test("reads proveedor columns with messy header spaces", () => {
    const txt = [
      "Fecha de emisión|Tipo CP/Doc.|Serie del CDP|Nro CP o Doc. Nro Inicial (Rango)|Apellidos Nombres/ Razón  Social|Nro Doc Identidad|BI Gravado DG|IGV / IPM DG|Total CP|Moneda|Est. Comp.",
      "30/07/2026|01|E001|1398|HIGHER PERU S.R.L.|20600999452|20920.00|3765.60|24685.60|PEN|1",
    ].join("\n");
    const zip = zipSync({ "c.txt": new TextEncoder().encode(txt) });
    const table = parseRceZip(zip);
    expect(table.rows[0]?.proveedor).toBe("HIGHER PERU S.R.L.");
    expect(table.rows[0]?.bi).toBe("20920.00");
    const kpis = summarizeRce(table.rows);
    expect(kpis.facturas).toBe(1);
    expect(kpis.igv).toBeCloseTo(3765.6);
  });
});
