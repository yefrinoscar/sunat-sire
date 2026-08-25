import Providers, { MONTHS_SHORT } from "./Providers";
import { useState } from "react";
import { Chip, Progress, Tabs, Tab } from "@heroui/react";
import BezelCard from "./ui/BezelCard";
import FadeIn from "./ui/FadeIn";
import ErrorState from "./ui/ErrorState";

export type PeriodoItem = {
  perTributario: string;
  year: string | number;
  month: string | number;
  labelEstado: string;
  presentado: boolean;
  enCurso: boolean;
};

type Props = {
  items: PeriodoItem[];
  current: PeriodoItem | null;
  error?: string;
};

const MONTHS_LONG = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function monthOf(i: PeriodoItem): number {
  return Number(i.month);
}

function yearOf(i: PeriodoItem): number {
  return Number(i.year);
}

export default function PeriodosView({ items, current, error }: Props) {
  const years = [...new Set(items.map(yearOf))].sort((a, b) => b - a);
  const initialYear = current ? yearOf(current) : (years[0] ?? new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(initialYear);

  if (error) {
    return (
      <Providers>
        <ErrorState message={error} />
      </Providers>
    );
  }

  const yearItems = items.filter((i) => yearOf(i) === selectedYear);
  const presented = yearItems.filter((i) => i.presentado).length;
  const pct = yearItems.length > 0 ? Math.round((presented / yearItems.length) * 100) : 0;

  return (
    <Providers>
      <div className="space-y-12 sm:space-y-16">
        {/* Hero bento */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <FadeIn className="lg:col-span-7 flex flex-col justify-end">
            <span className="eyebrow mb-5 w-fit">Libros electrónicos · SUNAT</span>
            <h1 className="font-display text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-semibold tracking-tight leading-[1.02] text-foreground">
              Periodos<br className="hidden sm:block" /> tributarios
            </h1>
            <p className="text-default-500 mt-5 max-w-lg text-[0.95rem] leading-relaxed">
              Propuestas mensuales del RVIE. Entra a un mes para ver casillas del 621,
              ventas, compras y el checklist de presentación.
            </p>
          </FadeIn>

          {current ? (
            <FadeIn delay={0.1} className="lg:col-span-5">
              <CurrentCard current={current} />
            </FadeIn>
          ) : (
            <FadeIn delay={0.1} className="lg:col-span-5">
              <BezelCard innerClassName="p-6 h-full flex flex-col justify-center">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-400 font-semibold">Ejercicio</p>
                <p className="font-display text-5xl font-semibold tabular-nums mt-2">{selectedYear}</p>
                <p className="text-sm text-default-500 mt-2">{years.length} ejercicios disponibles</p>
              </BezelCard>
            </FadeIn>
          )}
        </section>

        {/* Stats bento row */}
        <FadeIn delay={0.15}>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BezelCard innerClassName="px-6 py-5">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-default-400 font-semibold">Año visible</p>
              <p className="font-display text-4xl font-semibold tabular-nums mt-2">{selectedYear}</p>
              <p className="text-xs text-default-400 mt-1.5">{totalYearsLabel(years.length)}</p>
            </BezelCard>

            <BezelCard innerClassName="px-6 py-5 sm:col-span-1">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-default-400 font-semibold">Generados en SIRE</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display text-4xl font-semibold tabular-nums text-primary">{presented}</span>
                <span className="text-default-400 text-sm font-mono">/ {yearItems.length}</span>
              </div>
              <Progress
                aria-label={`${pct}% de periodos generados`}
                value={pct}
                size="sm"
                className="mt-3"
                classNames={{
                  track: "bg-content3 h-1.5 rounded-full",
                  indicator: "bg-gradient-to-r from-primary-400 to-primary-600 rounded-full",
                }}
              />
            </BezelCard>

            <BezelCard innerClassName="px-6 py-5">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-default-400 font-semibold">Por revisar</p>
              <p className="font-display text-4xl font-semibold tabular-nums mt-2 text-warning-600 dark:text-warning-400">
                {yearItems.length - presented}
              </p>
              <p className="text-xs text-default-400 mt-1.5">periodos sin generar</p>
            </BezelCard>
          </section>
        </FadeIn>

        {/* Month grid */}
        <FadeIn delay={0.2}>
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Meses</h2>
                <p className="text-sm text-default-500 mt-1">Selecciona un periodo para ver la propuesta</p>
              </div>
              <Tabs
                aria-label="Año"
                selectedKey={String(selectedYear)}
                onSelectionChange={(key) => setSelectedYear(Number(key))}
                size="sm"
                radius="full"
                variant="solid"
                classNames={{
                  tabList: "bg-content2/80 p-1 rounded-full",
                  tab: "font-mono text-xs font-semibold px-4 rounded-full",
                  cursor: "rounded-full",
                }}
              >
                {years.map((year) => (
                  <Tab key={String(year)} title={String(year)} />
                ))}
              </Tabs>
            </div>
            <MonthGrid items={yearItems} />
          </section>
        </FadeIn>
      </div>
    </Providers>
  );
}

function totalYearsLabel(n: number): string {
  return n === 1 ? "1 ejercicio disponible" : `${n} ejercicios disponibles`;
}

function CurrentCard({ current }: { current: PeriodoItem }) {
  const month = monthOf(current);
  return (
    <a
      href={`/periodo/${current.perTributario}`}
      className="group relative block overflow-hidden rounded-[1.25rem] no-underline text-white bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-6 sm:p-7 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 shadow-[0_12px_40px_rgba(11,110,88,0.25)]"
    >
      <div aria-hidden="true" className="absolute -right-12 -top-16 size-48 rounded-full bg-primary-300/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
      <div aria-hidden="true" className="absolute -left-8 -bottom-12 size-32 rounded-full bg-warning-400/10 blur-2xl" />

      <span className="eyebrow bg-white/10 border-white/15 text-primary-100 mb-4">Periodo en curso</span>
      <p className="font-display text-[2.5rem] sm:text-[2.75rem] font-semibold tracking-tight leading-none">
        {MONTHS_LONG[month] ?? current.month}
      </p>
      <p className="font-mono text-sm text-primary-200/80 mt-1">{yearOf(current)} · {current.perTributario}</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
          <span className={`size-1.5 rounded-full ${current.presentado ? "bg-primary-200" : "bg-warning-300"}`} />
          {current.labelEstado}
        </span>
        <span className="btn-pill bg-white/10 border border-white/15 text-white">
          Ver propuesta
          <span className="btn-pill-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </span>
        </span>
      </div>
    </a>
  );
}

function MonthGrid({ items }: { items: PeriodoItem[] }) {
  if (items.length === 0) {
    return (
      <BezelCard innerClassName="px-8 py-16 text-center">
        <p className="text-sm text-default-400">Sin periodos registrados para este año.</p>
      </BezelCard>
    );
  }
  const sorted = [...items].sort((a, b) => monthOf(b) - monthOf(a));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {sorted.map((item, i) => (
        <FadeIn key={item.perTributario} delay={0.03 * i}>
          <MonthCard item={item} />
        </FadeIn>
      ))}
    </div>
  );
}

function MonthCard({ item }: { item: PeriodoItem }) {
  const month = monthOf(item);
  return (
    <BezelCard
      as="a"
      href={`/periodo/${item.perTributario}`}
      hover
      className={item.enCurso ? "ring-2 ring-primary/30" : ""}
      innerClassName="p-4 sm:p-5 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[1.75rem] sm:text-2xl font-semibold tracking-tight leading-none">
            {MONTHS_SHORT[month] ?? item.month}
          </p>
          <p className="font-mono text-[0.65rem] text-default-400 mt-2">{item.perTributario}</p>
        </div>
        {item.enCurso ? (
          <Chip size="sm" variant="flat" color="primary" className="h-5 text-tiny font-semibold">
            actual
          </Chip>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <span
          className={[
            "inline-flex items-center gap-1.5 text-xs font-medium",
            item.presentado ? "text-primary" : "text-warning-600 dark:text-warning-400",
          ].join(" ")}
        >
          <span className={`size-1.5 rounded-full ${item.presentado ? "bg-primary" : "bg-warning-500"}`} />
          {item.labelEstado}
        </span>
        <svg
          className="text-default-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-primary group-hover:translate-x-1"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </div>
    </BezelCard>
  );
}
