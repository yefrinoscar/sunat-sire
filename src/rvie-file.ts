import { unzipSync } from "fflate";

export type RvieRow = {
  fecha: string;
  tipo: string;
  serie: string;
  numero: string;
  cliente: string;
  doc: string;
  bi: string;
  igv: string;
  total: string;
  moneda: string;
  estado: string;
};

export type RvieTable = {
  txtName: string;
  rows: RvieRow[];
};

const COL = {
  fecha: "Fecha de emisión",
  tipo: "Tipo CP/Doc.",
  serie: "Serie del CDP",
  numero: "Nro CP o Doc. Nro Inicial (Rango)",
  cliente: "Apellidos Nombres/ Razón Social",
  doc: "Nro Doc Identidad",
  bi: "BI Gravada",
  igv: "IGV / IPM",
  total: "Total CP",
  moneda: "Moneda",
  estado: "Est. Comp",
} as const;

export function parseRvieZip(bytes: Uint8Array): RvieTable {
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
  const cols = header.split("|");
  const index = (label: string) => cols.indexOf(label);
  const rows: RvieRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split("|");
    rows.push({
      fecha: cell(cells, index(COL.fecha)),
      tipo: cell(cells, index(COL.tipo)),
      serie: cell(cells, index(COL.serie)),
      numero: cell(cells, index(COL.numero)),
      cliente: cell(cells, index(COL.cliente)),
      doc: cell(cells, index(COL.doc)),
      bi: cell(cells, index(COL.bi)),
      igv: cell(cells, index(COL.igv)),
      total: cell(cells, index(COL.total)),
      moneda: cell(cells, index(COL.moneda)),
      estado: cell(cells, index(COL.estado)),
    });
  }
  return { txtName, rows };
}

function cell(cells: string[], i: number): string {
  if (i < 0) {
    return "";
  }
  return cells[i] ?? "";
}
