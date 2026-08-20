import { CredentialsError, parseCredentials } from "./credentials.ts";
import { PeriodoError, parsePeriodo } from "./periodo.ts";
import { fetchPropuesta, listPeriodos, SireError } from "./sire.ts";

export type Env = {
  API_KEY: string;
  SUNAT_CLIENT_ID: string;
  SUNAT_CLIENT_SECRET: string;
  SUNAT_RUC: string;
  SUNAT_SOL_USER: string;
  SUNAT_SOL_PASSWORD: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handle(request, env);
    } catch (error) {
      const status = statusOf(error);
      return json({ ok: false, error: messageOf(error) }, status);
    }
  },
};

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (request.method !== "GET") {
    return json({ ok: false, error: "method not allowed" }, 405);
  }
  if (url.pathname === "/" || url.pathname === "/health") {
    return json({ ok: true, service: "sunat-sire", routes: ["/periodos", "/propuesta"] });
  }
  if (!authorized(request, env.API_KEY)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const credentials = parseCredentials({
    SUNAT_CLIENT_ID: env.SUNAT_CLIENT_ID,
    SUNAT_CLIENT_SECRET: env.SUNAT_CLIENT_SECRET,
    SUNAT_RUC: env.SUNAT_RUC,
    SUNAT_SOL_USER: env.SUNAT_SOL_USER,
    SUNAT_SOL_PASSWORD: env.SUNAT_SOL_PASSWORD,
  });
  if (url.pathname === "/periodos") {
    const periodos = await listPeriodos(credentials);
    return json({ ok: true, periodos });
  }
  if (url.pathname === "/propuesta") {
    const rawPeriodo = url.searchParams.get("periodo");
    if (rawPeriodo === null || rawPeriodo === "") {
      return json({ ok: false, error: "periodo is required" }, 400);
    }
    const periodo = parsePeriodo(rawPeriodo);
    const result = await fetchPropuesta({ credentials, periodo });
    if (result.kind === "empty") {
      return json({ ok: true, kind: "empty", ticket: result.ticket });
    }
    return new Response(result.bytes, {
      status: 200,
      headers: {
        ...cors(),
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.nomArchivo}"`,
        "X-Sire-Ticket": result.ticket,
      },
    });
  }
  return json({ ok: false, error: "not found" }, 404);
}

function authorized(request: Request, apiKey: string): boolean {
  if (apiKey === "") {
    return false;
  }
  const header = request.headers.get("authorization");
  if (header === `Bearer ${apiKey}`) {
    return true;
  }
  return request.headers.get("x-api-key") === apiKey;
}

function json(body: unknown, status = 200): Response {
  return new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: {
      ...cors(),
      "Content-Type": "application/json",
    },
  });
}

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function statusOf(error: unknown): number {
  if (error instanceof CredentialsError || error instanceof PeriodoError) {
    return 400;
  }
  if (error instanceof SireError) {
    return 502;
  }
  return 500;
}
