import { HeroUIProvider } from "@heroui/react";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}

export const MONTHS_SHORT = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function money(n: number): string {
  return n.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

export function tipoLabel(tipo: string): string {
  if (tipo === "01") return "Factura";
  if (tipo === "03") return "Boleta";
  if (tipo === "07") return "N. crédito";
  if (tipo === "08") return "N. débito";
  return tipo;
}
