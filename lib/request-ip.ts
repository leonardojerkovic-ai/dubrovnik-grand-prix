import { headers } from "next/headers";
import { ADRESA_NEPOZNATA, izvuciAdresu } from "@/lib/rate-limit-rules";

/**
 * Adresa s koje je stigao zahtjev, onoliko pouzdano koliko je moguće iza
 * Vercelovog posrednika.
 *
 * Razbijanje zaglavlja je u izvuciAdresu (lib/rate-limit-rules), da se može
 * testirati bez Nexta; ovdje ostaje samo čitanje zahtjeva.
 *
 * Kad adrese nema, vraća se zajednička oznaka: bolje je da svi neprepoznati
 * dijele jedno ograničenje nego da ga nitko nema. Isto vrijedi i ako se
 * pozove izvan zahtjeva — radije zajednička kvota nego srušena prijava.
 */
export async function requestIp(): Promise<string> {
  try {
    const h = await headers();
    return izvuciAdresu(h.get("x-forwarded-for"), h.get("x-real-ip"));
  } catch (e) {
    // Tiho vraćanje zajedničke oznake značilo bi da svi neprepoznati dijele
    // jedan brojač, a da se to nigdje ne vidi. Pozivatelj odlučuje što će s
    // tim (prijava preskače ograničenje po stroju), ali u produkciji mora
    // ostati trag. Lokalno se preskače — vidi adresaPrijave u lib/auth.ts.
    if (process.env.NODE_ENV === "production") {
      console.error("[request-ip] zaglavlja se nisu mogla pročitati:", e);
    }
    return ADRESA_NEPOZNATA;
  }
}
