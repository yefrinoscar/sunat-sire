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
  exonerado: string;
  inafecto: string;
  exportacion: string;
};

export type RvieTable = {
  txtName: string;
  rows: RvieRow[];
};

export type TipoKpi = {
  codigo: string;
  label: string;
  count: number;
  bi: number;
  igv: number;
  total: number;
};

export type RvieKpis = {
  count: number;
  facturas: TipoKpi;
  boletas: TipoKpi;
  notasCredito: TipoKpi;
  notasDebito: TipoKpi;
  otros: TipoKpi;
  bi: number;
  igv: number;
  total: number;
  netoBi: number;
  netoIgv: number;
  netoTotal: number;
  exonerado: number;
  inafecto: number;
  exportacion: number;
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
  exonerado: "Mto Exonerado",
  inafecto: "Mto Inafecto",
  exportacion: "Valor Facturado Exportación",
} as const;

export function tipoLabel(tipo: string): string {
  if (tipo === "01") return "Factura";
  if (tipo === "03") return "Boleta";
  if (tipo === "07") return "N. crédito";
  if (tipo === "08") return "N. débito";
  return tipo;
}

export function money(n: number): string {
  return n.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

export function summarizeRvie(rows: RvieRow[]): RvieKpis {
  const empty = (codigo: string): TipoKpi => ({
    codigo,
    label: tipoLabel(codigo),
    count: 0,
    bi: 0,
    igv: 0,
    total: 0,
  });
  const facturas = empty("01");
  const boletas = empty("03");
  const notasCredito = empty("07");
  const notasDebito = empty("08");
  const otros = empty("");
  otros.label = "Otros";
  let exonerado = 0;
  let inafecto = 0;
  let exportacion = 0;
  for (const row of rows) {
    const bucket =
      row.tipo === "01"
        ? facturas
        : row.tipo === "03"
          ? boletas
          : row.tipo === "07"
            ? notasCredito
            : row.tipo === "08"
              ? notasDebito
              : otros;
    bucket.count += 1;
    bucket.bi += num(row.bi);
    bucket.igv += num(row.igv);
    bucket.total += num(row.total);
    exonerado += num(row.exonerado);
    inafecto += num(row.inafecto);
    exportacion += num(row.exportacion);
  }
  const bi = facturas.bi + boletas.bi + notasDebito.bi + otros.bi;
  const igv = facturas.igv + boletas.igv + notasDebito.igv + otros.igv;
  const total = facturas.total + boletas.total + notasDebito.total + otros.total;
  return {
    count: rows.length,
    facturas,
    boletas,
    notasCredito,
    notasDebito,
    otros,
    bi,
    igv,
    total,
    netoBi: bi - notasCredito.bi,
    netoIgv: igv - notasCredito.igv,
    netoTotal: total - notasCredito.total,
    exonerado,
    inafecto,
    exportacion,
  };
}

function num(raw: string): number {
  const n = Number(raw.replace(",", ""));
  return Number.isFinite(n) ? n : 0;
}

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
      exonerado: cell(cells, index(COL.exonerado)),
      inafecto: cell(cells, index(COL.inafecto)),
      exportacion: cell(cells, index(COL.exportacion)),
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
