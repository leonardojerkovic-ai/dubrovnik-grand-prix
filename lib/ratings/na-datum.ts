import { prisma } from "@/lib/prisma";

/**
 * Rejting koji je vrijedio NA ODREĐENI DAN.
 *
 * Tablica odigranog turnira ne smije se mijenjati kad FIDE objavi novu
 * listu. Rejting uz ime znači „rejting na dan turnira" — po njemu se
 * provjerava F_R (čl. 24) i rejtinška kategorija (čl. 22) — pa prikaz
 * današnje vrijednosti uz prošlomjesečni rezultat nije osvježavanje nego
 * krivotvorina koja se ne vidi.
 *
 * Uzima se zadnji snimak s datumom manjim ili jednakim traženom. Prazno
 * znači da igrač tada nije imao rejting u tom tempu.
 */

import { bezNule, type Tempo } from "@/lib/ratings/vrijednost";

// Pure pomoćne funkcije stoje u vrijednost.ts, da ih se može testirati bez
// Prisma klijenta; ovdje se samo proslijeđuju dalje.
export { tempoKaoPolje, bezNule, type Tempo } from "@/lib/ratings/vrijednost";

export async function rejtinziNaDatum(options: {
  playerIds: string[];
  tempo: string;
  datum: Date;
}): Promise<Map<string, number | null>> {
  const { playerIds, tempo, datum } = options;
  const rezultat = new Map<string, number | null>();
  if (playerIds.length === 0) return rezultat;

  // Svi snimci do tog datuma, od najnovijeg. Prvi viđeni po igraču je onaj
  // koji je tada vrijedio.
  const snimci = await prisma.playerRatingSnapshot.findMany({
    where: {
      playerId: { in: playerIds },
      ratingType: tempo as Tempo,
      snapshotDate: { lte: datum },
    },
    orderBy: { snapshotDate: "desc" },
    select: { playerId: true, ratingValue: true },
  });

  for (const snimak of snimci) {
    if (!rezultat.has(snimak.playerId)) {
      rezultat.set(snimak.playerId, bezNule(snimak.ratingValue));
    }
  }

  return rezultat;
}
