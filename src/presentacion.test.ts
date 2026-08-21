import { describe, expect, test } from "bun:test";
import { buildPresentationPlan, preliminarOpenDate } from "./presentacion.ts";

describe("presentacion", () => {
  test("julio 2026 can open preliminar from 8 agosto", () => {
    const opens = preliminarOpenDate("202607");
    expect(opens.getFullYear()).toBe(2026);
    expect(opens.getMonth()).toBe(7);
    expect(opens.getDate()).toBe(8);
    const plan = buildPresentationPlan({
      periodo: "202607",
      alreadyGenerated: true,
      rvieHasRows: true,
      rceLoaded: true,
      rceHasRows: true,
      today: new Date(2026, 7, 20),
    });
    expect(plan.preliminarOpen).toBe(true);
    expect(plan.steps.find((s) => s.id === "generar")?.state).toBe("done");
    expect(plan.steps.find((s) => s.id === "rce")?.state).toBe("done");
  });

  test("agosto 2026 preliminar waits until 8 septiembre", () => {
    const plan = buildPresentationPlan({
      periodo: "202608",
      alreadyGenerated: false,
      rvieHasRows: true,
      today: new Date(2026, 7, 20),
    });
    expect(plan.preliminarOpensOn).toBe("2026-09-08");
    expect(plan.preliminarOpen).toBe(false);
    expect(plan.steps.find((s) => s.id === "ventana")?.state).toBe("later");
    expect(plan.steps.find((s) => s.id === "generar")?.state).toBe("blocked");
  });
});
