import { headers } from "next/headers";
import { izvuciAdresu } from "@/lib/rate-limit-rules";

/**
 * IP klijenta unutar poslužiteljskog zahtjeva.
 *
 * Čitanje zaglavlja je izdvojeno od logike (izvuciAdresu) da se logika može
 * testirati bez Nexta. Ako se pozove izvan zahtjeva — a NextAuth authorize
 * jest unutar njega, ali to nije zajamčeno zauvijek — vraća "nepoznato"
 * umjesto da sruši prijavu.
 */
export async function adresaKlijenta(): Promise<string> {
  try {
    const h = await headers();
    return izvuciAdresu(h.get("x-forwarded-for"), h.get("x-real-ip"));
  } catch {
    return "nepoznato";
  }
}
