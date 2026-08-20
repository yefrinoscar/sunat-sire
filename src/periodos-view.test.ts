import { describe, expect, test } from "bun:test";
import { flattenPeriodos } from "./periodos-view.ts";

describe("flattenPeriodos", () => {
  test("marks current month as en curso and sorts newest first", () => {
    const items = flattenPeriodos(
      [
        {
          lisPeriodos: [
            { perTributario: "202607", desEstado: "Presentado", codEstado: "01" },
            { perTributario: "202608", desEstado: "No Presentado", codEstado: "03" },
          ],
        },
      ],
      new Date(2026, 7, 20),
    );
    expect(items[0]?.perTributario).toBe("202608");
    expect(items[0]?.enCurso).toBe(true);
    expect(items[0]?.labelEstado).toBe("En curso");
    expect(items[1]?.labelEstado).toBe("Generado");
  });
});
