import { describe, expect, test } from "bun:test";
import { PeriodoError, parsePeriodo } from "./periodo.ts";

describe("parsePeriodo", () => {
  test("202507 is valid", () => {
    expect(parsePeriodo("202507")).toBe("202507");
  });

  test("202513 fails", () => {
    expect(() => parsePeriodo("202513")).toThrow(PeriodoError);
  });

  test("20257 fails", () => {
    expect(() => parsePeriodo("20257")).toThrow(PeriodoError);
  });

  test("abc fails", () => {
    expect(() => parsePeriodo("abc")).toThrow(PeriodoError);
  });
});
