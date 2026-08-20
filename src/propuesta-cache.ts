import type { Credentials } from "./credentials.ts";
import type { Periodo } from "./periodo.ts";
import { fetchPropuesta, type FetchedPropuesta } from "./sire.ts";

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; result: FetchedPropuesta }>();

export async function fetchPropuestaCached(input: {
  credentials: Credentials;
  periodo: Periodo;
}): Promise<FetchedPropuesta> {
  const hit = cache.get(input.periodo);
  if (hit !== undefined && Date.now() - hit.at < TTL_MS) {
    return hit.result;
  }
  const result = await fetchPropuesta(input);
  cache.set(input.periodo, { at: Date.now(), result });
  return result;
}
