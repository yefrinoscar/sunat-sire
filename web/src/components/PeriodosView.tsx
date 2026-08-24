import Providers, { MONTHS_SHORT } from "./Providers";
import { useState } from "react";
import { Chip, Progress, Tabs, Tab } from "@heroui/react";

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

  return (
    <Providers>
      <div className="space-y-10">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-end">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary font-semibold mb-3">
              Libros electrónicos · SIRE
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Periodos tributarios
            </h1>
            <p className="text-default-500 mt-4 max-w-xl text-[0.95rem] leading-relaxed">
              Propuestas mensuales del RVIE según SUNAT. El estado indica si SUNAT ya marcó el
              periodo como generado. Entra a un mes para ver la propuesta, las casillas del 621 y el
              checklist de presentación.
            </p>
          </div>

          {current ? <CurrentCard current={current} /> : null}
        </section>

        <YearStats items={items} year={selectedYear} totalYears={years.length} />

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-xl font-semibold tracking-tight">Meses por año</h2>
            <Tabs
              aria-label="Año"
              selectedKey={String(selectedYear)}
              onSelectionChange={(key) => setSelectedYear(Number(key))}
              size="sm"
              radius="md"
              variant="solid"
              classNames={{ tabList: "bg-content2", tab: "font-mono text-xs font-semibold px-4" }}
            >
              {years.map((year) => (
                <Tab key={String(year)} title={String(year)} />
              ))}
            </Tabs>
          </div>
          <MonthGrid items={items.filter((i) => yearOf(i) === selectedYear)} />
        </section>
      </div>
    </Providers>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-large border border-danger-200 bg-danger-50 dark:bg-danger-50/10 px-6 py-8 text-center">
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

function CurrentCard({ current }: { current: PeriodoItem }) {
  const month = monthOf(current);
  return (
    <a
      href={`/periodo/${current.perTributario}`}
      className="group relative overflow-hidden rounded-large no-underline text-white bg-gradient-to-br from-primary-700 via-primary-800 to-[#0a2e25] p-5 shadow-lg shadow-primary-900/20 transition-transform hover:-translate-y-0.5"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-14 size-44 rounded-full bg-primary-400/25 blur-2xl transition-transform group-hover:scale-125"
      />
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary-200 font-semibold">
        Periodo en curso
      </p>
      <p className="font-display text-3xl font-semibold mt-1.5 tracking-tight">
        {MONTHS_LONG[month] ?? current.month} {yearOf(current)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
          <span className={`size-1.5 rounded-full ${current.presentado ? "bg-primary-300" : "bg-warning-300"}`} />
          {current.labelEstado}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-100 group-hover:text-white transition-colors">
          Ver propuesta
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </a>
  );
}

function YearStats({ items, year, totalYears }: { items: PeriodoItem[]; year: number; totalYears: number }) {
  const yearItems = items.filter((i) => yearOf(i) === year);
  const presented = yearItems.filter((i) => i.presentado).length;
  const pct = yearItems.length > 0 ? Math.round((presented / yearItems.length) * 100) : 0;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatTile label="Año visible" value={String(year)} desc={`${totalYears} ejercicios disponibles`} />
      <div className="rounded-large border border-divider bg-content1 px-5 py-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold">
          Generados en SIRE
        </p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-display text-3xl font-semibold tabular-nums">{presented}</span>
          <span className="text-default-400 text-sm font-mono">/ {yearItems.length}</span>
        </div>
        <Progress
          aria-label={`${pct}% de periodos generados`}
          value={pct}
          size="sm"
          className="mt-2.5"
          classNames={{ track: "bg-content3 h-1.5", indicator: "bg-gradient-to-r from-primary-400 to-primary-600" }}
        />
      </div>
      <StatTile
        label="Faltan"
        value={String(yearItems.length - presented)}
        desc="periodos por generar o revisar"
      />
    </section>
  );
}

function StatTile({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="rounded-large border border-divider bg-content1 px-5 py-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-default-500 font-semibold">{label}</p>
      <p className="font-display text-3xl font-semibold tabular-nums mt-1">{value}</p>
      <p className="text-xs text-default-400 mt-1">{desc}</p>
    </div>
  );
}

function MonthGrid({ items }: { items: PeriodoItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-large border border-dashed border-divider px-6 py-12 text-center text-sm text-default-400">
        Sin periodos registrados para este año.
      </div>
    );
  }
  const sorted = [...items].sort((a, b) => monthOf(b) - monthOf(a));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
      {sorted.map((item) => (
        <MonthCard key={item.perTributario} item={item} />
      ))}
    </div>
  );
}

function MonthCard({ item }: { item: PeriodoItem }) {
  const month = monthOf(item);
  return (
    <a
      href={`/periodo/${item.perTributario}`}
      className={[
        "group relative rounded-large border bg-content1 p-4 no-underline text-foreground transition-all hover:-translate-y-0.5 hover:shadow-md",
        item.enCurso
          ? "border-primary/50 ring-1 ring-primary/30 hover:border-primary"
          : "border-divider hover:border-default-300",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight leading-none">
            {MONTHS_SHORT[month] ?? item.month}
          </p>
          <p className="font-mono text-[0.68rem] text-default-400 mt-1.5">{item.perTributario}</p>
        </div>
        {item.enCurso ? (
          <Chip size="sm" variant="flat" color="primary" className="h-5 text-tiny font-medium">
            actual
          </Chip>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={[
            "inline-flex items-center gap-1.5 text-xs font-medium",
            item.presentado ? "text-primary-600 dark:text-primary-400" : "text-warning-600 dark:text-warning-400",
          ].join(" ")}
        >
          <span className={`size-1.5 rounded-full ${item.presentado ? "bg-primary-500" : "bg-warning-500"}`} />
          {item.labelEstado}
        </span>
        <svg
          className="text-default-300 transition-all group-hover:text-primary group-hover:translate-x-0.5"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </div>
    </a>
  );
}
