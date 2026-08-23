import Providers, { money, tipoLabel, MONTHS_SHORT } from "./Providers";
import { useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
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

function periodoLabel(per: string): string {
  const m = Number(per.slice(4, 6));
  return `${MONTHS_SHORT[m] ?? per.slice(4, 6)} ${per.slice(0, 4)}`;
}

export default function PeriodoView(props: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { raw, title, alreadyGenerated } = props;
  const hasData = props.ventasRows.length > 0 || props.comprasRows.length > 0;
  const doneCount = props.plan ? props.plan.steps.filter((s) => s.state === "done").length : 0;

  return (
    <Providers>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Breadcrumbs variant="light" size="sm">
          <BreadcrumbItem href="/">Periodos</BreadcrumbItem>
          <BreadcrumbItem>{title}</BreadcrumbItem>
        </Breadcrumbs>
        <div className="ml-auto flex gap-1.5">
          {props.prev ? (
            <Button
              as="a"
              href={`/periodo/${props.prev}`}
              size="sm"
              variant="bordered"
              className="border-divider font-medium"
              startContent={<Arrow dir="left" />}
            >
              {periodoLabel(props.prev)}
            </Button>
          ) : null}
          {props.next ? (
            <Button
              as="a"
              href={`/periodo/${props.next}`}
              size="sm"
              variant="bordered"
              className="border-divider font-medium"
              endContent={<Arrow dir="right" />}
            >
              {periodoLabel(props.next)}
            </Button>
          ) : null}
        </div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary font-semibold mb-2">
            Periodo tributario · {raw}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight capitalize leading-[1.05]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {props.plan ? (
            <Chip
              variant="dot"
              color={alreadyGenerated ? "success" : "warning"}
              className="border-divider bg-content1"
            >
              {alreadyGenerated ? "Generado en SIRE" : "Sin generar"}
            </Chip>
          ) : null}
          {props.plan ? (
            <Button color="primary" size="sm" onPress={onOpen} className="font-medium shadow-md shadow-primary-600/20">
              Checklist
              <span className="font-mono text-[0.7rem] rounded-full bg-white/20 px-1.5 py-0.5 tabular-nums">
                {doneCount}/{props.plan.steps.length}
              </span>
            </Button>
          ) : null}
        </div>
      </header>

      {props.error ? (
        <ErrorState message={props.error} />
      ) : !hasData ? (
        <EmptyState emptyTicket={props.emptyTicket} />
      ) : (
        <div className="space-y-8">
          {props.plan ? <Stepper plan={props.plan} /> : null}
          {props.kpis ? <Casillas kpis={props.kpis} comprasKpis={props.comprasKpis} /> : null}

          <Tabs
            aria-label="Detalle del periodo"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full border-b border-divider rounded-none p-0",
              tab: "max-w-fit px-0 h-11 font-medium",
              cursor: "w-full bg-primary",
              tabContent: "group-data-[selected=true]:text-foreground",
            }}
          >
            <Tab key="resumen" title="Resumen">
              <Resumen kpis={props.kpis} comprasKpis={props.comprasKpis} raw={raw} ventasCount={props.ventasRows.length} comprasCount={props.comprasRows.length} />
            </Tab>
            <Tab key="ventas" title={<TabTitle label="Ventas" count={props.ventasRows.length} />}>
              <VentasTable rows={props.ventasRows} />
            </Tab>
            <Tab key="compras" title={<TabTitle label="Compras" count={props.comprasRows.length} />}>
              <ComprasTable rows={props.comprasRows} />
            </Tab>
          </Tabs>
        </div>
      )}

      {props.plan ? (
        <Drawer isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur" placement="right">
          <DrawerContent>
            {(onCloseInner) => (
              <>
                <DrawerHeader className="flex-col items-start gap-1 border-b border-divider">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-primary font-semibold">
                    Para presentar · {raw}
                  </p>
                  <span className="font-display text-xl font-semibold tracking-tight">Checklist de presentación</span>
                </DrawerHeader>
                <DrawerBody className="py-5">
                  <p className="text-sm text-default-500 leading-relaxed">
                    Esta pantalla no envía nada a SUNAT. “Presentar” en SIRE es generar el RVIE y el RCE; el 621 usa
                    las casillas después. Toca un paso para ver cómo se hace.
                  </p>
                  <Accordion
                    selectionMode="multiple"
                    variant="splitted"
                    itemClasses={{
                      base: "shadow-none border border-divider bg-content1 !px-4",
                      trigger: "py-3.5",
                      content: "pb-4",
                    }}
                  >
                    {props.plan.steps.map((step, i) => (
                      <AccordionItem
                        key={step.id}
                        aria-label={step.title}
                        startContent={
                          <span
                            className={[
                              "inline-grid place-items-center size-6 rounded-full font-mono text-[0.68rem] font-bold shrink-0",
                              step.state === "done"
                                ? "bg-primary text-primary-foreground"
                                : "bg-content3 text-default-500",
                            ].join(" ")}
                          >
                            {step.state === "done" ? "✓" : i + 1}
                          </span>
                        }
                        title={
                          <span className="flex items-center gap-2 pr-2">
                            <span className="font-medium text-sm leading-snug">{step.title.replace(/^\d+\. /, "")}</span>
                            <Chip size="sm" variant="flat" color={stepChipColor(step.state)} className="h-5 shrink-0 text-tiny">
                              {STATE_LABEL[step.state]}
                            </Chip>
                          </span>
                        }
                      >
                        <p className="text-sm text-default-600 mb-3 leading-relaxed">{step.detail}</p>
                        {step.howTo ? (
                          <div className="border-t border-dashed border-divider pt-3">
                            <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary font-semibold mb-2">
                              {step.howTo.title}
                            </p>
                            <ol className="space-y-2 list-none p-0 m-0">
                              {step.howTo.steps.map((t, n) => (
                                <li key={n} className="relative pl-8 text-sm leading-relaxed text-default-700">
                                  <span className="absolute left-0 top-0.5 inline-grid place-items-center size-5 rounded-full bg-primary/10 text-primary text-[0.62rem] font-bold font-mono">
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
                </DrawerBody>
                <DrawerFooter className="border-t border-divider">
                  <p className="text-xs text-default-500 mr-auto max-w-64 text-left leading-relaxed">
                    Esta app no envía nada a SUNAT: los envíos se hacen con tu clave SOL.
                  </p>
                  <Button color="primary" size="sm" onPress={onClose ?? onCloseInner} className="font-medium">
                    Entendido
                  </Button>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>
      ) : null}
    </Providers>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <path d="M19 12H5m6 6-6-6 6-6" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

function TabTitle({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <span className="font-mono text-[0.68rem] rounded-full bg-content2 px-1.5 py-0.5 tabular-nums text-default-500 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
        {count}
      </span>
    </span>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-large border border-danger-200 bg-danger-50 dark:bg-danger-50/10 px-6 py-8 text-center">
      <span className="inline-grid place-items-center size-11 rounded-full bg-danger/10 text-danger mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h2 className="font-semibold mb-1">No se pudo consultar SUNAT</h2>
      <p className="text-sm text-danger-600 dark:text-danger-400 max-w-lg mx-auto">{message}</p>
    </div>
  );
}

function EmptyState({ emptyTicket }: { emptyTicket?: string | null }) {
  return (
    <div className="rounded-large border border-dashed border-divider bg-content1 px-6 py-14 text-center">
      <span className="inline-grid place-items-center size-12 rounded-full bg-content2 text-default-400 mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
          <path d="M8 9h8M8 13h5" />
          <path d="m16 19 2 2 4-4" />
        </svg>
      </span>
      <h3 className="font-display text-lg font-semibold tracking-tight">
        SUNAT no devolvió comprobantes para este periodo
      </h3>
      <p className="text-sm text-default-500 max-w-md mx-auto mt-2 leading-relaxed">
        No hay ventas ni compras cargadas.{emptyTicket ? ` Ticket ${emptyTicket}.` : ""} Si el mes tuvo movimiento,
        probablemente falta complementar la propuesta desde SOL.
      </p>
    </div>
  );
}

function Stepper({ plan }: { plan: NonNullable<Props["plan"]> }) {
  return (
    <section className="rounded-large border border-divider bg-content1 px-5 py-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <h2 className="font-display font-semibold tracking-tight">Ruta de presentación</h2>
        <span className="text-xs text-default-500 font-mono">
          {plan.preliminarOpen
            ? `Preliminar disponible desde el ${plan.preliminarOpensOn}`
            : `El preliminar se abre el ${plan.preliminarOpensOn}`}
        </span>
      </div>
      <ol className="flex items-start gap-0 overflow-x-auto pb-1 m-0 p-0 list-none">
        {plan.steps.map((step, i) => (
          <li key={step.id} className="flex items-start flex-1 min-w-[104px]">
            <div className="flex flex-col items-center text-center gap-2 w-full">
              <div className="flex items-center w-full">
                <span className={`h-px flex-1 ${i === 0 ? "bg-transparent" : lineClass(plan.steps[i - 1]!.state)}`} />
                <span
                  title={step.title.replace(/^\d+\. /, "")}
                  className={[
                    "inline-grid place-items-center size-8 rounded-full border-2 font-mono text-xs font-bold shrink-0 transition-colors",
                    step.state === "done" && "border-primary bg-primary text-primary-foreground",
                    step.state === "ready" && "border-warning bg-warning/15 text-warning-600 dark:text-warning-400",
                    step.state === "later" && "border-default-300 bg-content2 text-default-500 border-dashed",
                    step.state === "blocked" && "border-default-200 bg-content2 text-default-400",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {step.state === "done" ? "✓" : i + 1}
                </span>
                <span className={`h-px flex-1 ${i === plan.steps.length - 1 ? "bg-transparent" : lineClass(step.state)}`} />
              </div>
              <span className="text-[0.7rem] font-medium leading-tight text-default-600 px-1">
                {STEP_SHORT[i] ?? step.title}
              </span>
              <span
                className={[
                  "text-[0.62rem] font-mono uppercase tracking-wide",
                  step.state === "done" && "text-primary",
                  step.state === "ready" && "text-warning-600 dark:text-warning-400",
                  (step.state === "blocked" || step.state === "later") && "text-default-400",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {STATE_LABEL[step.state]}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-default-500 mt-4 leading-relaxed max-w-3xl">
        Esta pantalla solo <strong className="text-default-700">lee</strong> la propuesta de SUNAT. “Presentar” el
        libro es un flujo aparte en SOL; el IGV no se declara acá. Después del cierre, SUNAT arma las casillas del FV
        621 con lo que ves abajo.
      </p>
    </section>
  );
}

function lineClass(state: PlanStep["state"]): string {
  return state === "done" ? "bg-primary/60" : "bg-divider";
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
  if (highlight) {
    return (
      <div className="relative overflow-hidden rounded-large bg-gradient-to-br from-primary-600 to-primary-800 text-white px-5 py-4 shadow-lg shadow-primary-900/15">
        <div aria-hidden="true" className="absolute -right-8 -top-10 size-32 rounded-full bg-white/10 blur-xl" />
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-primary-100 font-semibold">{label}</p>
        <p className="font-mono text-2xl font-bold tabular-nums mt-1.5">{value}</p>
        <p className="text-xs text-primary-100/90 mt-1">{desc}</p>
      </div>
    );
  }
  return (
    <div className="rounded-large border border-divider bg-content1 px-5 py-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold">{label}</p>
      <p className="font-mono text-2xl font-bold tabular-nums mt-1.5">{value}</p>
      <p className="text-xs text-default-400 mt-1">{desc}</p>
    </div>
  );
}

function Resumen({ kpis, comprasKpis, raw, ventasCount, comprasCount }: { kpis: RvieKpis | null; comprasKpis: RceKpis | null; raw: string; ventasCount: number; comprasCount: number }) {
  if (!kpis) return null;
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-large border border-divider bg-content1 p-5">
          <BarChart kpis={kpis} />
        </div>
        <div className="rounded-large border border-divider bg-content1 p-5">
          <SalesSummary kpis={kpis} />
        </div>
      </div>
      {comprasKpis ? (
        <div className="rounded-large border border-divider bg-content1 p-5">
          <PurchasesSummary comprasKpis={comprasKpis} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-default-500">
          {ventasCount > 0 ? `${ventasCount} ventas` : "sin ventas"}
          {comprasCount > 0 ? ` · ${comprasCount} compras` : ""}
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            as="a"
            href={`/periodo/${raw}/zip`}
            size="sm"
            variant="bordered"
            className="border-divider font-medium"
            startContent={<DownloadIcon />}
          >
            ZIP ventas
          </Button>
          {comprasCount > 0 ? (
            <Button
              as="a"
              href={`/periodo/${raw}/zip?libro=rce`}
              size="sm"
              variant="bordered"
              className="border-divider font-medium"
              startContent={<DownloadIcon />}
            >
              ZIP compras
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
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
      <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold mb-4">
        Comprobantes emitidos por tipo
      </h3>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span className="font-medium">
                {bar.label} <span className="text-default-400 font-mono text-xs">×{bar.count}</span>
              </span>
              <span className="tabular-nums font-mono text-xs text-default-600">{money(bar.amount)}</span>
            </div>
            <div
              role="img"
              aria-label={`${bar.label}: ${money(bar.amount)}`}
              className="h-2 rounded-full bg-content3 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-[width]"
                style={{ width: `${Math.max(Math.round((bar.amount / max) * 100), bar.count > 0 ? 4 : 0)}%` }}
              />
            </div>
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

const summaryTableClasses = {
  th: "bg-transparent border-b border-divider font-mono text-[0.65rem] uppercase tracking-[0.14em] text-default-400",
  td: "py-2.5",
} as const;

function SalesSummary({ kpis }: { kpis: RvieKpis }) {
  return (
    <div>
      <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold mb-3">
        Resumen de ventas
      </h3>
      <Table removeWrapper removeHoverEvents aria-label="Resumen de ventas" classNames={summaryTableClasses}>
        <TableHeader>
          <TableColumn>CONCEPTO</TableColumn>
          <TableColumn align="end">CANT.</TableColumn>
          <TableColumn align="end">TOTAL</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Facturas</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{kpis.facturas.count}</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{money(kpis.facturas.total)}</TableCell></TableRow>
          <TableRow><TableCell>Boletas</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{kpis.boletas.count}</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{money(kpis.boletas.total)}</TableCell></TableRow>
          <TableRow><TableCell>N. crédito</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{kpis.notasCredito.count}</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{money(kpis.notasCredito.total)}</TableCell></TableRow>
          <TableRow><TableCell>N. débito</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{kpis.notasDebito.count}</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{money(kpis.notasDebito.total)}</TableCell></TableRow>
        </TableBody>
      </Table>
      <div className="flex justify-between items-baseline mt-3 pt-3 px-3 pb-2.5 rounded-medium bg-primary/8 border border-primary/20">
        <span className="text-sm font-semibold">Casilla 101 · IGV neto</span>
        <span className="tabular-nums font-bold font-mono">{money(kpis.netoIgv)}</span>
      </div>
    </div>
  );
}

function PurchasesSummary({ comprasKpis }: { comprasKpis: RceKpis }) {
  return (
    <div>
      <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold mb-3">
        Resumen de compras
      </h3>
      <Table removeWrapper removeHoverEvents aria-label="Resumen de compras" classNames={{ ...summaryTableClasses, base: "max-w-md" }}>
        <TableHeader>
          <TableColumn>CONCEPTO</TableColumn>
          <TableColumn align="end">VALOR</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Facturas de proveedores</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{comprasKpis.facturas}</TableCell></TableRow>
          <TableRow><TableCell>Boletas (sin crédito fiscal)</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{comprasKpis.boletas}</TableCell></TableRow>
          <TableRow><TableCell>Base imponible de compras</TableCell><TableCell className="text-right tabular-nums font-mono text-sm">{money(comprasKpis.bi)}</TableCell></TableRow>
          <TableRow><TableCell className="font-semibold">Crédito fiscal (IGV)</TableCell><TableCell className="text-right tabular-nums font-mono text-sm font-bold">{money(comprasKpis.igv)}</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

const cellNum = "text-right tabular-nums font-mono text-[0.8rem]";

const detailTableClasses = {
  base: "min-w-[880px]",
  th: "bg-content2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-default-500 first:rounded-l-medium last:rounded-r-medium",
  td: "py-2.5 border-b border-divider/60 group-data-[last=true]/tr:border-b-0",
} as const;

function TipoChip({ tipo }: { tipo: string }) {
  const isNota = tipo === "07" || tipo === "08";
  return (
    <Chip
      size="sm"
      variant="flat"
      className={[
        "h-5 text-tiny font-medium",
        tipo === "01" && "bg-primary/10 text-primary-700 dark:text-primary-300",
        tipo === "03" && "bg-default-100 text-default-600",
        isNota && "bg-warning/10 text-warning-700 dark:text-warning-400",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tipoLabel(tipo)}
    </Chip>
  );
}

function VentasTable({ rows }: { rows: VentaRow[] }) {
  return (
    <div className="rounded-large border border-divider bg-content1 p-2 sm:p-4 mt-6">
      <Scrollable>
        <Table removeWrapper aria-label="Ventas RVIE" classNames={detailTableClasses}>
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
                <TableCell className="whitespace-nowrap font-mono text-[0.8rem]">{row.fecha}</TableCell>
                <TableCell><TipoChip tipo={row.tipo} /></TableCell>
                <TableCell className="font-mono text-[0.8rem]">{row.serie}</TableCell>
                <TableCell className="font-mono text-[0.8rem]">{row.numero}</TableCell>
                <TableCell><span className="block max-w-52 truncate font-medium" title={row.cliente}>{row.cliente}</span></TableCell>
                <TableCell className="tabular-nums font-mono text-[0.8rem] text-default-500">{row.doc}</TableCell>
                <TableCell className={cellNum}>{row.bi}</TableCell>
                <TableCell className={cellNum}>{row.igv}</TableCell>
                <TableCell className={`${cellNum} whitespace-nowrap font-semibold`}>{row.total} <span className="text-default-400 font-normal">{row.moneda}</span></TableCell>
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
    <div className="rounded-large border border-divider bg-content1 p-2 sm:p-4 mt-6">
      <Scrollable>
        <Table removeWrapper aria-label="Compras RCE" classNames={detailTableClasses}>
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
                <TableCell className="whitespace-nowrap font-mono text-[0.8rem]">{row.fecha}</TableCell>
                <TableCell><TipoChip tipo={row.tipo} /></TableCell>
                <TableCell className="font-mono text-[0.8rem]">{row.serie}</TableCell>
                <TableCell className="font-mono text-[0.8rem]">{row.numero}</TableCell>
                <TableCell><span className="block max-w-52 truncate font-medium" title={row.proveedor}>{row.proveedor}</span></TableCell>
                <TableCell className="tabular-nums font-mono text-[0.8rem] text-default-500">{row.doc}</TableCell>
                <TableCell className={cellNum}>{row.bi}</TableCell>
                <TableCell className={cellNum}>{row.igv}</TableCell>
                <TableCell className={`${cellNum} whitespace-nowrap font-semibold`}>{row.total} <span className="text-default-400 font-normal">{row.moneda}</span></TableCell>
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
