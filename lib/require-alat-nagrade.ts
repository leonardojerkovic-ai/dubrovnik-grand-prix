import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * Tko smije do alata za raspodjelu novčanih nagrada.
 *
 * Alat radi u pregledniku, ne čita iz baze i ne upisuje u nju, pa pristup
 * ne otvara nijedan podatak. Prijava se ipak traži da stranica ne bude
 * javno dostupna i da se zna tko je raspodjelu radio.
 *
 * Sudac postoji upravo zbog ovoga: nagrade na turniru dijeli on, a nema
 * razloga da uz to dobije i igrače, rezultate i korisnike.
 */
const DOPUSTENE = ["ADMIN", "GP_MANAGER", "SUDAC"] as const;

export type AlatNagradeRole = (typeof DOPUSTENE)[number];

export async function requireAlatNagrade(): Promise<AlatNagradeRole> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!role || !DOPUSTENE.includes(role as AlatNagradeRole)) {
    redirect("/prijava?callbackUrl=/alati/nagrade");
  }

  return role as AlatNagradeRole;
}
