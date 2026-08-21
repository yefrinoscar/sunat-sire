import type { APIRoute } from "astro";
import {
  fetchPropuestaCached,
  parsePeriodo,
  serverCredentials,
} from "../../../lib/sire.ts";

export const GET: APIRoute = async ({ params, url }) => {
  const raw = params.periodo ?? "";
  const libro = url.searchParams.get("libro") === "rce" ? "rce" : "rvie";
  try {
    const periodo = parsePeriodo(raw);
    const credentials = serverCredentials();
    const result = await fetchPropuestaCached({ credentials, periodo, libro });
    if (result.kind === "empty") {
      return new Response(JSON.stringify({ ok: false, error: "empty propuesta" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(result.bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.nomArchivo}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
