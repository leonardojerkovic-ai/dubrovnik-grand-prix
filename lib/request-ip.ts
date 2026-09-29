import { headers } from "next/headers";

/**
 * Adresa s koje je stigao zahtjev, onoliko pouzdano koliko je moguće iza
 * Vercelovog posrednika.
 *
 * Kad je nema, vraća se zajednička oznaka: bolje je da svi neprepoznati
 * dijele jedno ograničenje nego da ga nitko nema.
 */
export async function requestIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || h.get("x-real-ip")?.trim() || "nepoznata-adresa";
}
