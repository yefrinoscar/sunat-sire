import Providers, { money, tipoLabel } from "./Providers";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tab,
  Tabs,
  useDisclosure,
} from "@heroui/react";

export type TipoKpi = { count: number; total: number };
export type RvieKpis = {
  facturas: TipoKpi;
  boletas: TipoKpi;
  notasCredito: TipoKpi & { bi?: number };
  notasDebito: TipoKpi;
  bi: number;
  netoBi: number;
  netoIgv: number;
  netoTotal: number;
  exonerado: number;
  inafecto: number;
  exportacion: number;
  count: number;
};
export type RceKpis = { facturas: number; boletas: number; bi: number; total: number; igv: number };
export type VentaRow = { fecha: string; tipo: string; serie: string; numero: string; cliente: string; doc: string; bi: string; igv: string; total: string; moneda: string };
export type CompraRow = Omit<VentaRow, "cliente"> & { proveedor: string };
export type StepHowTo = { title: string; steps: string[] };
export type PlanStep = { id: string; title: string; detail: string; state: "done" | "ready" | "blocked" | "later"; howTo?: StepHowTo };

type Props = {
  raw: string;
  title: string;
  alreadyGenerated: boolean;
  prev?: string | null;
  next?: string | null;
  error?: string | null;
  emptyTicket?: string | null;
  plan: { steps: PlanStep[]; preliminarOpen: boolean; preliminarOpensOn: string } | null;
  kpis: RvieKpis | null;
  comprasKpis: RceKpis | null;
  ventasRows: VentaRow[];
  comprasRows: CompraRow[];
};

const STEP_SHORT = [
  "Propuesta RVIE",
  "Propuesta RCE",
  "Aceptar o complementar",
  "Ventana preliminar",
  "Generar preliminar",
  "Generar en SOL",
  "Declaración IGV",
];

const STATE_LABEL: Record<string, string> = { done: "listo", later: "aún no", ready: "pendiente", blocked: "falta" };

function stepChipColor(state: PlanStep["state"]) {
  return state === "done" ? "success" : state === "ready" || state === "later" ? "warning" : "danger";
}

export default function PeriodoView(props: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { raw, title, alreadyGenerated } = props;
  const hasData = props.ventasRows.length > 0 || props.comprasRows.length > 0;

  return (
    <Providers>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Breadcrumbs variant="light" size="sm">
          <BreadcrumbItem href="/">Periodos</BreadcrumbItem>
          <BreadcrumbItem>{title}</BreadcrumbItem>
        </Breadcrumbs>
        <div className="ml-auto flex gap-1">
          {props.prev ? (
            <Button as="a" href={`/periodo/${props.prev}`} size="sm" variant="flat">← {props.prev}</Button>
          ) : null}
          {props.next ? (
            <Button as="a" href={`/periodo/${props.next}`} size="sm" variant="flat">{props.next} →</Button>
          ) : null}
        </div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Periodo tributario {raw}</p>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {props.plan ? (
            <Chip color={alreadyGenerated ? "success" : "warning"} variant="flat" size="sm">
              {alreadyGenerated ? "generado en SIRE" : "sin generar"}
            </Chip>
          ) : null}
          {props.plan ? (
            <Button color="primary" size="sm" onPress={onOpen}>
              Checklist · {props.plan.steps.filter((s) => s.state === "done").length}/{props.plan.steps.length}
            </Button>
          ) : null}
        </div>
      </header>

      {props.error ? (
        <div role="alert" className="rounded-large border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger mb-6">
          {props.error}
        </div>
      ) : !hasData ? (
        <Card shadow="sm" className="border border-divider">
          <CardBody className="items-center py-10 text-center gap-1">
            <h3 className="font-semibold">SUNAT no devolvió comprobantes para este periodo</h3>
            <p className="text-sm text-default-500 max-w-md">
              No hay ventas ni compras cargadas.{props.emptyTicket ? ` Ticket ${props.emptyTicket}.` : ""} Si el mes tuvo
              movimiento, probablemente falta complementar la propuesta desde SOL.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {props.plan ? <Overview {...props} /> : null}
          {props.kpis ? <Casillas kpis={props.kpis} comprasKpis={props.comprasKpis} /> : null}

          <Tabs aria-label="Detalle del periodo" radius="sm">
            <Tab key="resumen" title="Resumen">
              <Resumen kpis={props.kpis} comprasKpis={props.comprasKpis} raw={raw} ventasCount={props.ventasRows.length} comprasCount={props.comprasRows.length} />
            </Tab>
            <Tab key="ventas" title={`Ventas (${props.ventasRows.length})`}>
              <VentasTable rows={props.ventasRows} />
            </Tab>
            <Tab key="compras" title={`Compras (${props.comprasRows.length})`}>
              <ComprasTable rows={props.comprasRows} />
            </Tab>
          </Tabs>
        </div>
      )}

      {props.plan ? (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside" backdrop="blur">
          <ModalContent>
            {(onCloseInner) => (
              <>
                <ModalHeader className="flex-col items-start gap-0.5">
                  <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Para presentar · {raw}</p>
                  <span className="text-lg">Checklist de presentación</span>
                </ModalHeader>
                <ModalBody>
                  <p className="text-sm text-default-600 -mt-1">
                    Esta pantalla no envía nada a SUNAT. “Presentar” en SIRE es generar el RVIE y el RCE; el 621 usa las
                    casillas después. Toca un paso para ver cómo se hace.
                  </p>
                  <Accordion selectionMode="multiple" variant="splitted" itemClasses={{ base: "shadow-small", trigger: "py-3", content: "pb-3" }}>
                    {props.plan.steps.map((step, i) => (
                      <AccordionItem
                        key={step.id}
                        aria-label={step.title}
                        startContent={<span className="font-mono text-xs text-default-400 w-5">{i + 1}</span>}
                        title={
                          <span className="flex items-center gap-2 pr-2">
                            <span className="font-medium text-sm leading-snug">{step.title}</span>
                            <Chip size="sm" variant="flat" color={stepChipColor(step.state)} className="h-5 shrink-0">
                              {STATE_LABEL[step.state]}
                            </Chip>
                          </span>
                        }
                      >
                        <p className="text-sm text-default-600 mb-2">{step.detail}</p>
                        {step.howTo ? (
                          <div className="border-t border-dashed border-divider pt-2">
                            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">{step.howTo.title}</p>
                            <ol className="space-y-1.5 list-none p-0 m-0">
                              {step.howTo.steps.map((t, n) => (
                                <li key={n} className="relative pl-8 text-sm leading-relaxed">
                                  <span className="absolute left-0 top-0.5 inline-grid place-items-center size-5 rounded-full bg-primary/10 text-primary text-[0.62rem] font-bold">
                                    {n + 1}
                                  </span>
                                  {t}
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ModalBody>
                <ModalFooter>
                  <p className="text-xs text-default-500 mr-auto max-w-56 text-left">
                    Esta app no envía nada a SUNAT: los envíos se hacen con tu clave SOL.
                  </p>
                  <Button color="primary" size="sm" onPress={onClose ?? onCloseInner}>Entendido</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      ) : null}
    </Providers>
  );
}

function Overview({ plan }: Props) {
  return (
    <Card shadow="sm" className="border border-divider">
      <CardBody className="gap-3 py-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold">Overview</h2>
          <span className="text-sm text-default-500">
            {plan.preliminarOpen ? `Preliminar disponible desde el ${plan.preliminarOpensOn}` : `El preliminar se abre el ${plan.preliminarOpensOn}`}
          </span>
        </div>
        <p className="text-sm text-default-600 max-w-3xl">
          Esta pantalla solo <strong>lee</strong> la propuesta de SUNAT. “Presentar” el libro es un flujo aparte: revisar
          propuestas → aceptar o complementar en SOL → generar preliminar → generar registros. El IGV no se declara acá:
          después del cierre, SUNAT arma las casillas del FV 621 con lo que ves abajo.
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.steps.map((step, i) => (
            <span
              key={step.id}
              title={step.title.replace(/^\d+\. /, "")}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                step.state === "done" && "border-success/30 bg-success/10 text-success",
                step.state === "ready" && "border-warning/40 bg-warning/10 text-warning",
                step.state === "blocked" && "border-default-300 bg-content2/60 text-default-500",
                step.state === "later" && "border-secondary/30 bg-secondary/10 text-secondary",
              ].filter(Boolean).join(" ")}
            >
              {step.state === "done" ? <span aria-hidden="true">✓</span> : <span className="font-mono opacity-60">{i + 1}</span>}
              {STEP_SHORT[i] ?? step.title}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function Casillas({ kpis, comprasKpis }: Pick<Props, "kpis" | "comprasKpis">) {
  if (!kpis) return null;
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Stat
        label="Casilla 100 · BI gravada neta"
        value={money(kpis.netoBi)}
        desc={`bruta ${money(kpis.bi)} · NC −${money(kpis.notasCredito.bi ?? 0)}`}
      />
      <Stat
        label="Casilla 101 · IGV neto a declarar"
        value={money(kpis.netoIgv)}
        desc="lo que SUNAT precarga en el FV 621"
        highlight
      />
      <Stat
        label="Crédito fiscal (compras RCE)"
        value={comprasKpis ? money(comprasKpis.igv) : "—"}
        desc={comprasKpis ? `sobre BI de compras ${money(comprasKpis.bi)}` : "sin compras cargadas"}
      />
    </section>
  );
}

function Stat({ label, value, desc, highlight }: { label: string; value: string; desc: string; highlight?: boolean }) {
  return (
    <Card shadow="sm" className={highlight ? "border border-primary/40 bg-primary/5" : "border border-divider"}>
      <CardBody className="py-4 gap-0.5">
        <p className="text-xs uppercase tracking-wider text-default-500 font-medium">{label}</p>
        <p className={`text-xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>{value}</p>
        <p className="text-xs text-default-400">{desc}</p>
      </CardBody>
    </Card>
  );
}

function Resumen({ kpis, comprasKpis, raw, ventasCount, comprasCount }: { kpis: RvieKpis | null; comprasKpis: RceKpis | null; raw: string; ventasCount: number; comprasCount: number }) {
  if (!kpis) return null;
  return (
    <div className="bg-content1 border border-divider rounded-large p-5 mt-2 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart kpis={kpis} />
        <SalesSummary kpis={kpis} />
      </div>
      {comprasKpis ? <PurchasesSummary comprasKpis={comprasKpis} /> : null}
      <p className="text-xs text-default-500">
        {ventasCount > 0 ? `${ventasCount} ventas` : "sin ventas"}{comprasCount > 0 ? ` · ${comprasCount} compras` : ""}. Descarga:{" "}
        <a href={`/periodo/${raw}/zip`} className="text-primary hover:underline font-medium">ZIP ventas</a>
        {comprasCount > 0 ? <> · <a href={`/periodo/${raw}/zip?libro=rce`} className="text-primary hover:underline font-medium">ZIP compras</a></> : null}
      </p>
    </div>
  );
}

function BarChart({ kpis }: { kpis: RvieKpis }) {
  const bars = useMemo(
    () => [
      { label: "Facturas", count: kpis.facturas.count, amount: kpis.facturas.total },
      { label: "Boletas", count: kpis.boletas.count, amount: kpis.boletas.total },
      { label: "N. crédito", count: kpis.notasCredito.count, amount: kpis.notasCredito.total },
      { label: "N. débito", count: kpis.notasDebito.count, amount: kpis.notasDebito.total },
    ],
    [kpis],
  );
  const max = Math.max(...bars.map((b) => b.amount), 1);
  return (
    <div>
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-default-500">Comprobantes emitidos por tipo</h3>
      <div className="space-y-4 mt-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span>
                {bar.label} <span className="text-default-400">×{bar.count}</span>
              </span>
              <span className="tabular-nums text-default-600">{money(bar.amount)}</span>
            </div>
            <Progress
              aria-label={`${bar.label}: ${money(bar.amount)}`}
              value={Math.max(Math.round((bar.amount / max) * 100), bar.count > 0 ? 4 : 0)}
              size="sm"
              radius="sm"
              classNames={{ track: "bg-default-100 h-2", indicator: "bg-gradient-to-r from-primary-400 to-primary-600" }}
            />
          </div>
        ))}
        {(kpis.exonerado > 0 || kpis.inafecto > 0 || kpis.exportacion > 0) ? (
          <p className="text-xs text-default-500 pt-1">
            No gravadas: exonerado {money(kpis.exonerado)} · inafecto {money(kpis.inafecto)} · exportación {money(kpis.exportacion)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SalesSummary({ kpis }: { kpis: RvieKpis }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-default-500">Resumen de ventas</h3>
      <Table removeWrapper removeHoverEvents aria-label="Resumen de ventas" classNames={{ base: "mt-2" }}>
        <TableHeader>
          <TableColumn>CONCEPTO</TableColumn>
          <TableColumn align="end">CANT.</TableColumn>
          <TableColumn align="end">TOTAL</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Facturas</TableCell><TableCell className="text-right tabular-nums">{kpis.facturas.count}</TableCell><TableCell className="text-right tabular-nums">{money(kpis.facturas.total)}</TableCell></TableRow>
          <TableRow><TableCell>Boletas</TableCell><TableCell className="text-right tabular-nums">{kpis.boletas.count}</TableCell><TableCell className="text-right tabular-nums">{money(kpis.boletas.total)}</TableCell></TableRow>
          <TableRow><TableCell>N. crédito</TableCell><TableCell className="text-right tabular-nums">{kpis.notasCredito.count}</TableCell><TableCell className="text-right tabular-nums">{money(kpis.notasCredito.total)}</TableCell></TableRow>
          <TableRow><TableCell>N. débito</TableCell><TableCell className="text-right tabular-nums">{kpis.notasDebito.count}</TableCell><TableCell className="text-right tabular-nums">{money(kpis.notasDebito.total)}</TableCell></TableRow>
        </TableBody>
      </Table>
      <div className="flex justify-between items-baseline border-t border-divider mt-2 pt-2 px-3 pb-1 rounded-medium bg-content2/50">
        <span className="text-sm font-semibold">Casilla 101 · IGV neto</span>
        <span className="tabular-nums font-bold">{money(kpis.netoIgv)}</span>
      </div>
    </div>
  );
}

function PurchasesSummary({ comprasKpis }: { comprasKpis: RceKpis }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-default-500">Resumen de compras</h3>
      <Table removeWrapper removeHoverEvents aria-label="Resumen de compras" classNames={{ base: "mt-2 max-w-md" }}>
        <TableHeader>
          <TableColumn>CONCEPTO</TableColumn>
          <TableColumn align="end">VALOR</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Facturas de proveedores</TableCell><TableCell className="text-right tabular-nums">{comprasKpis.facturas}</TableCell></TableRow>
          <TableRow><TableCell>Boletas (sin crédito fiscal)</TableCell><TableCell className="text-right tabular-nums">{comprasKpis.boletas}</TableCell></TableRow>
          <TableRow><TableCell>Base imponible de compras</TableCell><TableCell className="text-right tabular-nums">{money(comprasKpis.bi)}</TableCell></TableRow>
          <TableRow><TableCell className="font-semibold">Crédito fiscal (IGV)</TableCell><TableCell className="text-right tabular-nums font-bold">{money(comprasKpis.igv)}</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

const cellNum = "text-right tabular-nums";

function VentasTable({ rows }: { rows: VentaRow[] }) {
  return (
    <div className="bg-content1 border border-divider rounded-large p-2 sm:p-4 mt-2">
      <Scrollable>
        <Table removeWrapper aria-label="Ventas RVIE" classNames={{ base: "min-w-[880px]" }} removeHoverEvents={false}>
          <TableHeader>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>TIPO</TableColumn>
            <TableColumn>SERIE</TableColumn>
            <TableColumn>N°</TableColumn>
            <TableColumn>CLIENTE</TableColumn>
            <TableColumn>RUC/DNI</TableColumn>
            <TableColumn align="end">BI</TableColumn>
            <TableColumn align="end">IGV</TableColumn>
            <TableColumn align="end">TOTAL</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Sin ventas registradas." items={rows.map((r, i) => ({ ...r, key: `${i}` }))}>
            {(row) => (
              <TableRow>
                <TableCell className="whitespace-nowrap">{row.fecha}</TableCell>
                <TableCell>{tipoLabel(row.tipo)}</TableCell>
                <TableCell>{row.serie}</TableCell>
                <TableCell>{row.numero}</TableCell>
                <TableCell><span className="block max-w-52 truncate" title={row.cliente}>{row.cliente}</span></TableCell>
                <TableCell className="tabular-nums">{row.doc}</TableCell>
                <TableCell className={cellNum}>{row.bi}</TableCell>
                <TableCell className={cellNum}>{row.igv}</TableCell>
                <TableCell className={`${cellNum} whitespace-nowrap`}>{row.total} {row.moneda}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Scrollable>
    </div>
  );
}

function ComprasTable({ rows }: { rows: CompraRow[] }) {
  return (
    <div className="bg-content1 border border-divider rounded-large p-2 sm:p-4 mt-2">
      <Scrollable>
        <Table removeWrapper aria-label="Compras RCE" classNames={{ base: "min-w-[880px]" }}>
          <TableHeader>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>TIPO</TableColumn>
            <TableColumn>SERIE</TableColumn>
            <TableColumn>N°</TableColumn>
            <TableColumn>PROVEEDOR</TableColumn>
            <TableColumn>RUC</TableColumn>
            <TableColumn align="end">BI</TableColumn>
            <TableColumn align="end">IGV</TableColumn>
            <TableColumn align="end">TOTAL</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Sin compras registradas." items={rows.map((r, i) => ({ ...r, key: `${i}` }))}>
            {(row) => (
              <TableRow>
                <TableCell className="whitespace-nowrap">{row.fecha}</TableCell>
                <TableCell>{tipoLabel(row.tipo)}</TableCell>
                <TableCell>{row.serie}</TableCell>
                <TableCell>{row.numero}</TableCell>
                <TableCell><span className="block max-w-52 truncate" title={row.proveedor}>{row.proveedor}</span></TableCell>
                <TableCell className="tabular-nums">{row.doc}</TableCell>
                <TableCell className={cellNum}>{row.bi}</TableCell>
                <TableCell className={cellNum}>{row.igv}</TableCell>
                <TableCell className={`${cellNum} whitespace-nowrap`}>{row.total} {row.moneda}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Scrollable>
    </div>
  );
}

function Scrollable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
