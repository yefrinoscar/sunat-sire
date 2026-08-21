import { unzipSync } from "fflate";
import { money, tipoLabel } from "./rvie-file.ts";

export type RceRow = {
  fecha: string;
  tipo: string;
  serie: string;
  numero: string;
  proveedor: string;
  doc: string;
  bi: string;
  igv: string;
  total: string;
  moneda: string;
  estado: string;
};

export type RceTable = {
  txtName: string;
  rows: RceRow[];
};

export type RceKpis = {
  count: number;
  facturas: number;
  boletas: number;
  notasCredito: number;
  notasDebito: number;
  bi: number;
  igv: number;
  total: number;
};

export function parseRceZip(bytes: Uint8Array): RceTable {
  const files = unzipSync(bytes);
  const txtName = Object.keys(files).find((name) => name.toLowerCase().endsWith(".txt"));
  if (txtName === undefined) {
    throw new Error("zip has no txt");
  }
  const content = files[txtName];
  if (content === undefined) {
    throw new Error("zip has no txt");
  }
  const text = new TextDecoder("utf-8").decode(content).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const header = lines[0];
  if (header === undefined) {
    return { txtName, rows: [] };
  }
  const cols = header.split("|").map(norm);
  const index = (...labels: string[]) => {
    const wanted = labels.map(norm);
    return cols.findIndex((c) => wanted.includes(c));
  };
  const rows: RceRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split("|");
    rows.push({
      fecha: cell(cells, index("Fecha de emisión")),
      tipo: cell(cells, index("Tipo CP/Doc.")),
      serie: cell(cells, index("Serie del CDP")),
      numero: cell(cells, index("Nro CP o Doc. Nro Inicial (Rango)")),
      proveedor: cell(cells, index("Apellidos Nombres/ Razón Social", "Apellidos Nombres/ Razón  Social")),
      doc: cell(cells, index("Nro Doc Identidad")),
      bi: cell(cells, index("BI Gravado DG", "BI Gravada")),
      igv: cell(cells, index("IGV / IPM DG", "IGV / IPM")),
      total: cell(cells, index("Total CP")),
      moneda: cell(cells, index("Moneda")),
      estado: cell(cells, index("Est. Comp.", "Est. Comp")),
    });
  }
  return { txtName, rows };
}

export function summarizeRce(rows: RceRow[]): RceKpis {
  let facturas = 0;
  let boletas = 0;
  let notasCredito = 0;
  let notasDebito = 0;
  let bi = 0;
  let igv = 0;
  let total = 0;
  for (const row of rows) {
    if (row.tipo === "01") facturas += 1;
    else if (row.tipo === "03") boletas += 1;
    else if (row.tipo === "07") notasCredito += 1;
    else if (row.tipo === "08") notasDebito += 1;
    const sign = row.tipo === "07" ? -1 : 1;
    bi += sign * num(row.bi);
    igv += sign * num(row.igv);
    total += sign * num(row.total);
  }
  return { count: rows.length, facturas, boletas, notasCredito, notasDebito, bi, igv, total };
}

export { money, tipoLabel };

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function cell(cells: string[], i: number): string {
  if (i < 0) return "";
  return cells[i] ?? "";
}

function num(raw: string): number {
  const n = Number(raw.replace(",", ""));
  return Number.isFinite(n) ? n : 0;
}
