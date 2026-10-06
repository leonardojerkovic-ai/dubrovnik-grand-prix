import { prisma } from "@/lib/prisma";
import type { PostojecePravo } from "./pravo";

/**
 * Čitanje zapisa o pravu na bodove (čl. 3). Sama odluka je u ./pravo.ts, bez
 * Prisme, pa se može testirati.
 *
 * Odluka je ODVOJENA od upisa, i to je bitno: dosad se zvala u petlji, po
 * igraču, s 1–2 upita svaki (kod 30 igrača oko 60 upita), i upisivala je
 * PRIJE transakcije rezultata — pa su zapisi ostajali u bazi i kad spremanje
 * rezultata padne, s pravom zaključanim na turniru kojega u bazi nema.
 */

export * from "./pravo";

/** Postojeća prava za zadanu sezonu i popis igrača — jednim upitom. */
export async function ucitajPrava(
  seasonId: string,
  playerIds: string[]
): Promise<Map<string, PostojecePravo>> {
  if (playerIds.length === 0) return new Map();

  const zapisi = await prisma.academyEligibility.findMany({
    where: { seasonId, playerId: { in: playerIds } },
    select: {
      playerId: true,
      isEligible: true,
      firstTournamentId: true,
      firstTournamentDate: true,
    },
  });

  const mapa = new Map<string, PostojecePravo>();
  for (const z of zapisi) {
    mapa.set(z.playerId, {
      isEligible: z.isEligible,
      firstTournamentId: z.firstTournamentId,
      firstTournamentDate: z.firstTournamentDate,
    });
  }
  return mapa;
}
