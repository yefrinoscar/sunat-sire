import Providers, { MONTHS_SHORT } from "./Providers";
import {
  Card,
  CardBody,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

export type PeriodoItem = {
  perTributario: string;
  year: number;
  month: number;
  labelEstado: string;
  presentado: boolean;
  enCurso: boolean;
};

type Props = {
  items: PeriodoItem[];
  current: PeriodoItem | null;
  error?: string;
};

function EstadoChip({ presentado, label }: { presentado: boolean; label: string }) {
  return (
    <Chip color={presentado ? "success" : "warning"} variant="flat" size="sm">
      {label}
    </Chip>
  );
}

export default function PeriodosView({ items, current, error }: Props) {
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
  const defaultYear = current?.year ?? years[0] ?? new Date().getFullYear();

  return (
    <Providers>
      {error ? (
        <div className="rounded-large border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger mb-6">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Periodos</h1>
            <p className="text-default-500 mt-1 text-sm">
              Propuestas mensuales del libro RVIE según SUNAT. El estado indica si SUNAT ya marcó el periodo como generado.
            </p>
          </div>

          {current ? (
            <Card
              isPressable
              onPress={() => { window.location.href = `/periodo/${current.perTributario}`; }}
              shadow="sm"
              className="border border-divider hover:border-primary transition-colors"
            >
              <CardBody className="flex-row items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Periodo en curso</p>
                  <p className="text-lg font-semibold">{MONTHS_SHORT[current.month]} {current.year}</p>
                </div>
                <EstadoChip presentado={current.presentado} label={current.labelEstado} />
                <span aria-hidden="true" className="text-default-300">→</span>
              </CardBody>
            </Card>
          ) : null}

          <YearStats items={items} defaultYear={defaultYear} />

          <section>
            <Tabs aria-label="Año" selectedKey={String(defaultYear)} size="md" radius="sm" className="w-max">
              {years.map((year) => (
                <Tab key={String(year)} title={
                  <span>{year}</span>
                }>
                  <YearTable items={items.filter((i) => i.year === year)} />
                </Tab>
              ))}
            </Tabs>
          </section>
        </div>
      )}
    </Providers>
  );
}

function YearStats({ items, defaultYear }: { items: PeriodoItem[]; defaultYear: number }) {
  // stats siguen el año por defecto (el año en curso); los tabs filtran la tabla
  const yearItems = items.filter((i) => i.year === defaultYear);
  const presented = yearItems.filter((i) => i.presentado).length;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card shadow="sm" className="border border-divider">
        <CardBody className="py-3">
          <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Año visible</p>
          <p className="text-2xl font-bold">{defaultYear}</p>
          <p className="text-xs text-default-400">cambia con las pestañas</p>
        </CardBody>
      </Card>
      <Card shadow="sm" className="border border-divider">
        <CardBody className="py-3">
          <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Generados en SIRE</p>
          <p className="text-2xl font-bold tabular-nums">
            {presented}<span className="text-base text-default-400 font-medium">/{yearItems.length}</span>
          </p>
          <p className="text-xs text-default-400">periodos con libro generado</p>
        </CardBody>
      </Card>
      <Card shadow="sm" className="border border-divider">
        <CardBody className="py-3">
          <p className="text-xs uppercase tracking-wider text-default-500 font-medium">Faltan</p>
          <p className="text-2xl font-bold tabular-nums">{yearItems.length - presented}</p>
          <p className="text-xs text-default-400">por generar o revisar</p>
        </CardBody>
      </Card>
    </div>
  );
}

function YearTable({ items }: { items: PeriodoItem[] }) {
  const sorted = [...items].sort((a, b) => b.month - a.month);
  return (
    <Table removeWrapper aria-label={`Periodos`} classNames={{ base: "mt-3", wrapper: "" }}>
      <TableHeader>
        <TableColumn>PERIODO</TableColumn>
        <TableColumn>ESTADO SIRE</TableColumn>
        <TableColumn align="end">{" "}</TableColumn>
      </TableHeader>
      <TableBody emptyContent="Sin periodos registrados para este año.">
        {sorted.map((i) => (
          <TableRow key={i.perTributario} className={i.enCurso ? "bg-content2/60" : ""}>
            <TableCell className="font-medium min-w-40">
              {MONTHS_SHORT[i.month] ?? i.month} {i.year}
              {i.enCurso ? <Chip size="sm" variant="flat" className="ml-2 h-5 text-tiny">actual</Chip> : null}
            </TableCell>
            <TableCell><EstadoChip presentado={i.presentado} label={i.labelEstado} /></TableCell>
            <TableCell className="text-right">
              <a href={`/periodo/${i.perTributario}`} className="font-medium text-primary hover:underline">Ver propuesta →</a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
