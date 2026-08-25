import Providers, { money, tipoLabel, MONTHS_SHORT } from "./Providers";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Chip,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import BezelCard from "./ui/BezelCard";
import FadeIn from "./ui/FadeIn";
import ErrorState from "./ui/ErrorState";

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
  const { raw, title, alreadyGenerated } = props;
  const hasData = props.ventasRows.length > 0 || props.comprasRows.length > 0;
  const doneCount = props.plan ? props.plan.steps.filter((s) => s.state === "done").length : 0;

  return (
    <Providers>
      <FadeIn>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Breadcrumbs variant="light" size="sm" classNames={{ list: "gap-1" }}>
            <BreadcrumbItem href="/">Periodos</BreadcrumbItem>
            <BreadcrumbItem>{title}</BreadcrumbItem>
          </Breadcrumbs>
          <div className="ml-auto flex gap-2">
            {props.prev ? (
              <Button as="a" href={`/periodo/${props.prev}`} size="sm" variant="flat" radius="full" className="font-medium bg-content2" startContent={<Arrow dir="left" />}>
                {periodoLabel(props.prev)}
              </Button>
            ) : null}
            {props.next ? (
              <Button as="a" href={`/periodo/${props.next}`} size="sm" variant="flat" radius="full" className="font-medium bg-content2" endContent={<Arrow dir="right" />}>
                {periodoLabel(props.next)}
              </Button>
            ) : null}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <div>
            <span className="eyebrow mb-4">Periodo · {raw}</span>
            <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] font-semibold tracking-tight capitalize leading-[1.02]">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {props.plan ? (
              <Chip variant="dot" color={alreadyGenerated ? "success" : "warning"} className="bg-content1 border border-divider px-3">
                {alreadyGenerated ? "Generado en SIRE" : "Sin generar"}
              </Chip>
            ) : null}
            {props.kpis && hasData ? (
              <div className="flex gap-2">
                <Button as="a" href={`/periodo/${raw}/zip`} size="sm" variant="flat" radius="full" className="font-medium bg-content2" startContent={<DownloadIcon />}>
                  ZIP ventas
                </Button>
                {props.comprasRows.length > 0 ? (
                  <Button as="a" href={`/periodo/${raw}/zip?libro=rce`} size="sm" variant="flat" radius="full" className="font-medium bg-content2" startContent={<DownloadIcon />}>
                    ZIP compras
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>
      </FadeIn>

      {props.error ? (
        <ErrorState message={props.error} />
      ) : !hasData ? (
        <EmptyState emptyTicket={props.emptyTicket} />
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {props.kpis ? (
            <FadeIn delay={0.1}>
              <Casillas kpis={props.kpis} comprasKpis={props.comprasKpis} />
            </FadeIn>
          ) : null}

          {props.plan ? (
            <FadeIn delay={0.15}>
              <ChecklistPanel plan={props.plan} raw={raw} doneCount={doneCount} />
            </FadeIn>
          ) : null}

          <FadeIn delay={0.2}>
            <Tabs
              aria-label="Detalle del periodo"
              variant="underlined"
              classNames={{
                tabList: "gap-8 w-full border-b border-divider rounded-none p-0",
                tab: "max-w-fit px-0 h-12 font-semibold text-default-500 data-[selected=true]:text-foreground",
                cursor: "w-full bg-primary h-0.5",
                tabContent: "group-data-[selected=true]:text-foreground",
                panel: "pt-0",
              }}
            >
              <Tab key="resumen" title="Resumen">
                <Resumen kpis={props.kpis} comprasKpis={props.comprasKpis} ventasCount={props.ventasRows.length} comprasCount={props.comprasRows.length} />
              </Tab>
              <Tab key="ventas" title={<TabTitle label="Ventas" count={props.ventasRows.length} />}>
                <VentasTable rows={props.ventasRows} />
              </Tab>
              <Tab key="compras" title={<TabTitle label="Compras" count={props.comprasRows.length} />}>
                <ComprasTable rows={props.comprasRows} />
              </Tab>
            </Tabs>
          </FadeIn>
        </div>
      )}
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
      <span className="font-mono text-[0.65rem] rounded-full bg-content2 px-2 py-0.5 tabular-nums text-default-500 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
        {count}
      </span>
    </span>
  );
}

function EmptyState({ emptyTicket }: { emptyTicket?: string | null }) {
  return (
    <BezelCard innerClassName="px-8 py-16 text-center">
      <span className="inline-grid place-items-center size-14 rounded-full bg-content2 text-default-400 mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
          <path d="M8 9h8M8 13h5" />
          <path d="m16 19 2 2 4-4" />
        </svg>
      </span>
      <h3 className="font-display text-xl font-semibold tracking-tight">Sin comprobantes para este periodo</h3>
      <p className="text-sm text-default-500 max-w-md mx-auto mt-3 leading-relaxed">
        SUNAT no devolvió ventas ni compras.{emptyTicket ? ` Ticket ${emptyTicket}.` : ""} Si el mes tuvo movimiento, complementa la propuesta desde SOL.
      </p>
    </BezelCard>
  );
}

function ChecklistPanel({ plan, raw, doneCount }: { plan: NonNullable<Props["plan"]>; raw: string; doneCount: number }) {
  return (
    <BezelCard innerClassName="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Ruta de presentación</h2>
          <p className="text-sm text-default-500 mt-1">
            {plan.preliminarOpen
              ? `Preliminar disponible desde el ${plan.preliminarOpensOn}`
              : `El preliminar se abre el ${plan.preliminarOpensOn}`}
          </p>
        </div>
        <Chip size="sm" variant="flat" color="primary" className="font-mono text-xs font-semibold">
          {doneCount}/{plan.steps.length} pasos
        </Chip>
      </div>

      {/* Horizontal stepper — desktop */}
      <ol className="hidden md:flex items-start gap-0 overflow-x-auto pb-2 m-0 p-0 list-none mb-6">
        {plan.steps.map((step, i) => (
          <li key={step.id} className="flex items-start flex-1 min-w-[90px]">
            <StepNode step={step} index={i} total={plan.steps.length} prevState={i > 0 ? plan.steps[i - 1]!.state : null} short={STEP_SHORT[i] ?? step.title} />
          </li>
        ))}
      </ol>

      {/* Accordion with how-to — always visible */}
      <Accordion
        selectionMode="multiple"
        variant="splitted"
        itemClasses={{
          base: "shadow-none border border-divider bg-content1/50 !px-4 rounded-xl",
          trigger: "py-3.5",
          content: "pb-4",
        }}
      >
        {plan.steps.map((step, i) => (
          <AccordionItem
            key={step.id}
            aria-label={step.title}
            startContent={
              <span
                className={[
                  "inline-grid place-items-center size-7 rounded-full font-mono text-[0.68rem] font-bold shrink-0 transition-colors",
                  step.state === "done" && "bg-primary text-primary-foreground",
                  step.state === "ready" && "bg-warning/15 text-warning-600 dark:text-warning-400 border border-warning/30",
                  step.state === "later" && "bg-content2 text-default-400 border border-dashed border-divider",
                  step.state === "blocked" && "bg-content2 text-default-400",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {step.state === "done" ? "✓" : i + 1}
              </span>
            }
            title={
              <span className="flex items-center gap-2 pr-2 flex-wrap">
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
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary font-semibold mb-2">
                  {step.howTo.title}
                </p>
                <ol className="space-y-2 list-none p-0 m-0">
                  {step.howTo.steps.map((t, n) => (
                    <li key={n} className="relative pl-8 text-sm leading-relaxed text-default-700">
                      <span className="absolute left-0 top-0.5 inline-grid place-items-center size-5 rounded-full bg-primary/10 text-primary text-[0.6rem] font-bold font-mono">
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

      <p className="text-xs text-default-500 mt-5 leading-relaxed">
        Solo lectura · {raw}. Los envíos a SUNAT se hacen con tu clave SOL.
      </p>
    </BezelCard>
  );
}

function StepNode({ step, index, total, prevState, short }: { step: PlanStep; index: number; total: number; prevState: PlanStep["state"] | null; short: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 w-full">
      <div className="flex items-center w-full">
        <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : lineClass(prevState ?? "blocked")}`} />
        <span
          title={step.title.replace(/^\d+\. /, "")}
          className={[
            "inline-grid place-items-center size-8 rounded-full border-2 font-mono text-xs font-bold shrink-0",
            step.state === "done" && "border-primary bg-primary text-primary-foreground",
            step.state === "ready" && "border-warning bg-warning/15 text-warning-600 dark:text-warning-400",
            step.state === "later" && "border-default-300 bg-content2 text-default-500 border-dashed",
            step.state === "blocked" && "border-default-200 bg-content2 text-default-400",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {step.state === "done" ? "✓" : index + 1}
        </span>
        <span className={`h-px flex-1 ${index === total - 1 ? "bg-transparent" : lineClass(step.state)}`} />
      </div>
      <span className="text-[0.68rem] font-medium leading-tight text-default-600 px-0.5">{short}</span>
    </div>
  );
}

function lineClass(state: PlanStep["state"]): string {
  return state === "done" ? "bg-primary/50" : "bg-divider";
}

function Casillas({ kpis, comprasKpis }: Pick<Props, "kpis" | "comprasKpis">) {
  if (!kpis) return null;
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-4">
        <Stat label="Casilla 100" sublabel="BI gravada neta" value={money(kpis.netoBi)} desc={`Bruta ${money(kpis.bi)} · NC −${money(kpis.notasCredito.bi ?? 0)}`} />
      </div>
      <div className="md:col-span-5">
        <Stat label="Casilla 101" sublabel="IGV neto a declarar" value={money(kpis.netoIgv)} desc="Lo que SUNAT precarga en el FV 621" highlight />
      </div>
      <div className="md:col-span-3">
        <Stat label="Crédito fiscal" sublabel="Compras RCE" value={comprasKpis ? money(comprasKpis.igv) : "—"} desc={comprasKpis ? `BI compras ${money(comprasKpis.bi)}` : "Sin compras cargadas"} />
      </div>
    </section>
  );
}

function Stat({ label, sublabel, value, desc, highlight }: { label: string; sublabel: string; value: string; desc: string; highlight?: boolean }) {
  if (highlight) {
    return (
      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white px-6 py-5 h-full shadow-[0_8px_32px_rgba(11,110,88,0.2)]">
        <div aria-hidden="true" className="absolute -right-10 -top-12 size-36 rounded-full bg-white/8 blur-2xl" />
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-primary-100/80 font-semibold">{label}</p>
        <p className="text-sm text-primary-100/70 mt-0.5">{sublabel}</p>
        <p className="font-display text-[2rem] sm:text-[2.25rem] font-semibold tabular-nums mt-3 tracking-tight">{value}</p>
        <p className="text-xs text-primary-100/70 mt-2">{desc}</p>
      </div>
    );
  }
  return (
    <BezelCard innerClassName="px-6 py-5 h-full flex flex-col">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-default-400 font-semibold">{label}</p>
      <p className="text-sm text-default-500 mt-0.5">{sublabel}</p>
      <p className="font-display text-[1.75rem] sm:text-[2rem] font-semibold tabular-nums mt-3 tracking-tight">{value}</p>
      <p className="text-xs text-default-400 mt-auto pt-2">{desc}</p>
    </BezelCard>
  );
}

function Resumen({ kpis, comprasKpis, ventasCount, comprasCount }: { kpis: RvieKpis | null; comprasKpis: RceKpis | null; ventasCount: number; comprasCount: number }) {
  if (!kpis) return null;
  return (
    <div className="space-y-5 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BezelCard innerClassName="p-5 sm:p-6">
          <BarChart kpis={kpis} />
        </BezelCard>
        <BezelCard innerClassName="p-5 sm:p-6">
          <SalesSummary kpis={kpis} />
        </BezelCard>
      </div>
      {comprasKpis ? (
        <BezelCard innerClassName="p-5 sm:p-6">
          <PurchasesSummary comprasKpis={comprasKpis} />
        </BezelCard>
      ) : null}
      <p className="text-xs text-default-400 font-mono">
        {ventasCount > 0 ? `${ventasCount} ventas` : "sin ventas"}
        {comprasCount > 0 ? ` · ${comprasCount} compras` : ""}
      </p>
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
      { label: "Facturas", count: kpis.facturas.count, amount: kpis.facturas.total, color: "from-primary-400 to-primary-600" },
      { label: "Boletas", count: kpis.boletas.count, amount: kpis.boletas.total, color: "from-default-300 to-default-500" },
      { label: "N. crédito", count: kpis.notasCredito.count, amount: kpis.notasCredito.total, color: "from-warning-300 to-warning-500" },
      { label: "N. débito", count: kpis.notasDebito.count, amount: kpis.notasDebito.total, color: "from-warning-400 to-warning-600" },
    ],
    [kpis],
  );
  const max = Math.max(...bars.map((b) => b.amount), 1);
  return (
    <div>
      <h3 className="font-display text-lg font-semibold tracking-tight mb-5">Comprobantes por tipo</h3>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-baseline justify-between text-sm mb-2">
              <span className="font-medium">
                {bar.label} <span className="text-default-400 font-mono text-xs ml-1">×{bar.count}</span>
              </span>
              <span className="tabular-nums font-mono text-xs text-default-600">{money(bar.amount)}</span>
            </div>
            <div role="img" aria-label={`${bar.label}: ${money(bar.amount)}`} className="h-2 rounded-full bg-content3 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}
                style={{ width: `${Math.max(Math.round((bar.amount / max) * 100), bar.count > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
        {(kpis.exonerado > 0 || kpis.inafecto > 0 || kpis.exportacion > 0) ? (
          <p className="text-xs text-default-500 pt-2 border-t border-dashed border-divider">
            No gravadas: exonerado {money(kpis.exonerado)} · inafecto {money(kpis.inafecto)} · exportación {money(kpis.exportacion)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SalesSummary({ kpis }: { kpis: RvieKpis }) {
  const rows = [
    { label: "Facturas", count: kpis.facturas.count, total: kpis.facturas.total },
    { label: "Boletas", count: kpis.boletas.count, total: kpis.boletas.total },
    { label: "N. crédito", count: kpis.notasCredito.count, total: kpis.notasCredito.total },
    { label: "N. débito", count: kpis.notasDebito.count, total: kpis.notasDebito.total },
  ];
  return (
    <div>
      <h3 className="font-display text-lg font-semibold tracking-tight mb-4">Resumen de ventas</h3>
      <div className="space-y-0">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-divider/60 last:border-0">
            <span className="text-sm font-medium">{r.label}</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums font-mono text-xs text-default-400 w-8 text-right">{r.count}</span>
              <span className="tabular-nums font-mono text-sm w-24 text-right">{money(r.total)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-baseline mt-4 pt-4 px-4 pb-3 rounded-xl bg-primary/8 border border-primary/15">
        <span className="text-sm font-semibold">Casilla 101 · IGV neto</span>
        <span className="tabular-nums font-display text-lg font-semibold">{money(kpis.netoIgv)}</span>
      </div>
    </div>
  );
}

function PurchasesSummary({ comprasKpis }: { comprasKpis: RceKpis }) {
  const rows = [
    { label: "Facturas de proveedores", value: String(comprasKpis.facturas), mono: true },
    { label: "Boletas (sin crédito fiscal)", value: String(comprasKpis.boletas), mono: true },
    { label: "Base imponible de compras", value: money(comprasKpis.bi), mono: true },
    { label: "Crédito fiscal (IGV)", value: money(comprasKpis.igv), mono: true, bold: true },
  ];
  return (
    <div>
      <h3 className="font-display text-lg font-semibold tracking-tight mb-4">Resumen de compras</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 max-w-2xl">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-divider/60">
            <span className={`text-sm ${r.bold ? "font-semibold" : ""}`}>{r.label}</span>
            <span className={`tabular-nums font-mono text-sm ${r.bold ? "font-bold text-primary" : ""}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      size="sm"
      radius="full"
      placeholder={placeholder}
      value={value}
      onValueChange={onChange}
      classNames={{
        inputWrapper: "bg-content2/80 border-none shadow-none h-9",
        input: "text-sm",
      }}
      startContent={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-default-400">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
      }
    />
  );
}

function filterRows<T extends { doc: string; serie: string; numero: string } & Record<string, string>>(rows: T[], q: string, nameKey: keyof T): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => {
    const name = String(r[nameKey]).toLowerCase();
    return name.includes(s) || r.doc.includes(s) || r.serie.includes(s) || r.numero.includes(s);
  });
}

function VentasTable({ rows }: { rows: VentaRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterRows(rows, q, "cliente"), [rows, q]);
  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente, RUC, serie…" />
        <span className="text-xs text-default-400 font-mono">{filtered.length} de {rows.length}</span>
      </div>
      <BezelCard innerClassName="p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                {["Fecha", "Tipo", "Serie", "N°", "Cliente", "RUC/DNI", "BI", "IGV", "Total"].map((h, i) => (
                  <th key={h} className={`py-2.5 px-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-default-400 font-semibold ${i >= 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-default-400 text-sm">Sin resultados.</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-divider/50 hover:bg-content2/50 transition-colors duration-300">
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[0.78rem]">{row.fecha}</td>
                  <td className="py-2.5 px-3"><TipoChip tipo={row.tipo} /></td>
                  <td className="py-2.5 px-3 font-mono text-[0.78rem]">{row.serie}</td>
                  <td className="py-2.5 px-3 font-mono text-[0.78rem]">{row.numero}</td>
                  <td className="py-2.5 px-3"><span className="block max-w-48 truncate font-medium" title={row.cliente}>{row.cliente}</span></td>
                  <td className="py-2.5 px-3 tabular-nums font-mono text-[0.78rem] text-default-500">{row.doc}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem]">{row.bi}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem]">{row.igv}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem] font-semibold whitespace-nowrap">{row.total} <span className="text-default-400 font-normal">{row.moneda}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BezelCard>
    </div>
  );
}

function ComprasTable({ rows }: { rows: CompraRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterRows(rows, q, "proveedor"), [rows, q]);
  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar proveedor, RUC, serie…" />
        <span className="text-xs text-default-400 font-mono">{filtered.length} de {rows.length}</span>
      </div>
      <BezelCard innerClassName="p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                {["Fecha", "Tipo", "Serie", "N°", "Proveedor", "RUC", "BI", "IGV", "Total"].map((h, i) => (
                  <th key={h} className={`py-2.5 px-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-default-400 font-semibold ${i >= 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-default-400 text-sm">Sin resultados.</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-divider/50 hover:bg-content2/50 transition-colors duration-300">
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[0.78rem]">{row.fecha}</td>
                  <td className="py-2.5 px-3"><TipoChip tipo={row.tipo} /></td>
                  <td className="py-2.5 px-3 font-mono text-[0.78rem]">{row.serie}</td>
                  <td className="py-2.5 px-3 font-mono text-[0.78rem]">{row.numero}</td>
                  <td className="py-2.5 px-3"><span className="block max-w-48 truncate font-medium" title={row.proveedor}>{row.proveedor}</span></td>
                  <td className="py-2.5 px-3 tabular-nums font-mono text-[0.78rem] text-default-500">{row.doc}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem]">{row.bi}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem]">{row.igv}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[0.78rem] font-semibold whitespace-nowrap">{row.total} <span className="text-default-400 font-normal">{row.moneda}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BezelCard>
    </div>
  );
}
