import { afterEach, describe, expect, test } from "bun:test";
import { parseCredentials } from "./credentials.ts";
import { parsePeriodo } from "./periodo.ts";
import { fetchPropuesta } from "./sire.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("parseCredentials", () => {
  test("missing key throws", () => {
    expect(() => parseCredentials({})).toThrow("missing SUNAT_CLIENT_ID");
  });

  test("happy path concatenates ruc+user", () => {
    const creds = parseCredentials({
      SUNAT_CLIENT_ID: "id",
      SUNAT_CLIENT_SECRET: "secret",
      SUNAT_RUC: "20123456789",
      SUNAT_SOL_USER: "USER1",
      SUNAT_SOL_PASSWORD: "pass",
    });
    expect(`${creds.ruc}${creds.solUsuario}`).toBe("20123456789USER1");
  });
});

describe("fetchPropuesta", () => {
  test("token then exportapropuesta then poll 06 then zip bytes", async () => {
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]);
    const calls: { url: string; authorization: string | null }[] = [];

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      calls.push({ url, authorization: headers.get("Authorization") });

      if (url.includes("/oauth2/token/")) {
        return jsonResponse({ access_token: "tok-abc" });
      }
      if (url.includes("exportapropuesta")) {
        return jsonResponse({ numTicket: "T1" });
      }
      if (url.includes("consultaestadotickets")) {
        return jsonResponse({
          registros: [
            {
              numTicket: "T1",
              codEstadoProceso: "06",
              desEstadoProceso: "Terminado",
              perTributario: "202507",
              archivoReporte: [
                {
                  nomArchivoReporte: "LE202507.zip",
                  codTipoArchivoReporte: "0",
                },
              ],
            },
          ],
        });
      }
      if (url.includes("archivoreporte")) {
        return new Response(zipBytes, {
          status: 200,
          headers: { "Content-Type": "application/zip" },
        });
      }
      throw new Error(`unexpected url ${url}`);
    };

    const result = await fetchPropuesta({
      credentials: parseCredentials({
        SUNAT_CLIENT_ID: "id",
        SUNAT_CLIENT_SECRET: "secret",
        SUNAT_RUC: "20123456789",
        SUNAT_SOL_USER: "USER1",
        SUNAT_SOL_PASSWORD: "pass",
      }),
      periodo: parsePeriodo("202507"),
    });

    const propuestaCall = calls.find((c) => c.url.includes("exportapropuesta"));
    expect(propuestaCall).toBeDefined();
    expect(propuestaCall?.url).toContain("exportapropuesta");
    expect(propuestaCall?.authorization).toBe("Bearer tok-abc");
    expect(result.kind).toBe("file");
    if (result.kind !== "file") {
      throw new Error("expected file");
    }
    expect(result.ticket).toBe("T1");
    expect(result.nomArchivo).toBe("LE202507.zip");
    expect(result.bytes).toEqual(zipBytes);
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
