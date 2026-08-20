import { describe, expect, test } from "bun:test";
import worker, { type Env } from "./worker.ts";

const env: Env = {
  API_KEY: "test-key",
  SUNAT_CLIENT_ID: "id",
  SUNAT_CLIENT_SECRET: "secret",
  SUNAT_RUC: "20123456789",
  SUNAT_SOL_USER: "USER1",
  SUNAT_SOL_PASSWORD: "pass",
};

describe("worker", () => {
  test("health is public", async () => {
    const res = await worker.fetch(new Request("https://sire.test/health"), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      service: "sunat-sire",
      routes: ["/periodos", "/propuesta"],
    });
  });

  test("periodos without key is 401", async () => {
    const res = await worker.fetch(new Request("https://sire.test/periodos"), env);
    expect(res.status).toBe(401);
  });

  test("propuesta without periodo is 400", async () => {
    const res = await worker.fetch(
      new Request("https://sire.test/propuesta", {
        headers: { Authorization: "Bearer test-key" },
      }),
      env,
    );
    expect(res.status).toBe(400);
  });
});
