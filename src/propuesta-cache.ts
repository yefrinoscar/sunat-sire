import type { Credentials } from "./credentials.ts";
import type { Periodo } from "./periodo.ts";
import { fetchPropuesta, type FetchedPropuesta, type Libro } from "./sire.ts";

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; result: FetchedPropuesta }>();

export async function fetchPropuestaCached(input: {
  credentials: Credentials;
  periodo: Periodo;
  libro?: Libro;
}): Promise<FetchedPropuesta> {
  const libro = input.libro ?? "rvie";
  const key = `${libro}:${input.periodo}`;
  const hit = cache.get(key);
  if (hit !== undefined && Date.now() - hit.at < TTL_MS) {
    return hit.result;
  }
  const result = await fetchPropuesta(input);
  cache.set(key, { at: Date.now(), result });
  return result;
}
