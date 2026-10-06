import type { Prisma } from "@prisma/client";
import { odluciPravo } from "./pravo";
import { bezNule } from "@/lib/ratings/vrijednost";

/**
 * Ponovno utvrđuje pravo na bodove (čl. 3) igračima kojima je zapis vezan na
 * turnir koji više ne vrijedi — jer su s njega maknuti ili je turnir obrisan.
 *
 * Zašto nije dovoljno samo obrisati zapis: dok ga nema, samoprijava se
 * ponovno vrednuje po DANAŠNJEM rejtingu (to je bio nalaz 9), a novi zapis
 * nastao bi tek kad admin slučajno prvi spremi neki drugi turnir tog igrača
 * — i zaključao bi pravo na tom, a ne na najranijem. Zato se pravo odmah
 * utvrđuje po NAJRANIJEM preostalom nastupu u sezoni, s rejtingom koji je na
 * tom turniru i ušao u izračun.
 *
 * Mora se pozvati U ISTOJ transakciji u kojoj se briše ono što je zapis
 * vezalo na turnir, da u bazi ne ostane stanje bez zapisa.
 *
 * `preostaliIgraci` su igrači koji NA TOM TURNIRU ostaju (pri spremanju
 * rezultata); kod brisanja cijelog turnira nema takvih, pa se izostavlja.
 *
 * `zapisi` se predaje kad je turnir već obrisan: veza
 * AcademyEligibility → Tournament je SetNull, pa nakon brisanja upit po
 * firstTournamentId više ne nalazi ništa i zapise treba pročitati PRIJE.
 * Za to služi ucitajZapiseTurnira.
 */
export async function preracunajPrava(
  tx: Prisma.TransactionClient,
  options: {
    seasonId: string;
    tournamentId: string;
    preostaliIgraci?: string[];
    zapisi?: { playerId: string; isEligible: boolean }[];
  }
): Promise<{
  /** Pravo je preračunato i ODLUKA SE PROMIJENILA. */
  promijenjeno: string[];
  /** Nema drugog nastupa u sezoni, pa je zapis uklonjen. */
  bezNastupa: string[];
}> {
  const { seasonId, tournamentId, preostaliIgraci = [], zapisi } = options;

  const izgubili =
    zapisi ??
    (await tx.academyEligibility.findMany({
      where: {
        seasonId,
        firstTournamentId: tournamentId,
        playerId: { notIn: preostaliIgraci },
      },
      select: { playerId: true, isEligible: true },
    }));

  if (izgubili.length === 0) return { promijenjeno: [], bezNastupa: [] };

  const igraci = await tx.player.findMany({
    where: { id: { in: izgubili.map((z) => z.playerId) } },
    select: { id: true, birthYear: true, firstName: true, lastName: true },
  });
  const igracPo = new Map(igraci.map((p) => [p.id, p]));

  const sezona = await tx.season.findUnique({
    where: { id: seasonId },
    select: { startDate: true },
  });
  const seasonStartYear = (sezona?.startDate ?? new Date()).getFullYear();

  // Kad su zapisi predani, turnir je već obrisan i firstTournamentId je
  // prazan, pa se briše po igračima.
  await tx.academyEligibility.deleteMany({
    where: zapisi
      ? { seasonId, playerId: { in: izgubili.map((z) => z.playerId) } }
      : {
          seasonId,
          firstTournamentId: tournamentId,
          playerId: { notIn: preostaliIgraci },
        },
  });

  // Svi preostali nastupi tih igrača u sezoni, kronološki — prvi u nizu po
  // igraču je njegov najraniji.
  const ostali = await tx.tournamentResult.findMany({
    where: {
      playerId: { in: izgubili.map((z) => z.playerId) },
      gamesPlayed: true,
      tournamentId: { not: tournamentId },
      tournament: { seasonId },
    },
    select: {
      playerId: true,
      ratingSnapshotUsed: true,
      tournamentId: true,
      tournament: { select: { date: true } },
    },
    orderBy: { tournament: { date: "asc" } },
  });

  const promijenjeno: string[] = [];
  const bezNastupa: string[] = [];

  for (const z of izgubili) {
    const igrac = igracPo.get(z.playerId);
    const label = igrac ? `${igrac.lastName} ${igrac.firstName}` : z.playerId;

    const najraniji = ostali.find((o) => o.playerId === z.playerId);
    if (!najraniji) {
      bezNastupa.push(label);
      continue;
    }

    const odluka = odluciPravo({
      tournamentId: najraniji.tournamentId,
      tournamentDate: najraniji.tournament.date,
      playerId: z.playerId,
      birthYear: igrac?.birthYear ?? 0,
      seasonStartYear,
      rapidRatingAtThisTournament: bezNule(najraniji.ratingSnapshotUsed),
    });

    if (odluka.zaUpis) {
      await tx.academyEligibility.create({
        data: { seasonId, ...odluka.zaUpis },
      });
    }

    if (odluka.isEligible !== z.isEligible) promijenjeno.push(label);
  }

  return { promijenjeno, bezNastupa };
}

/**
 * Zapisi o pravu na bodove koji se pozivaju na zadani turnir.
 *
 * Čita se PRIJE brisanja turnira, jer veza je SetNull i nakon brisanja se
 * više ne može znati koji su zapisi bili vezani na njega.
 */
export async function ucitajZapiseTurnira(
  tx: Prisma.TransactionClient,
  seasonId: string,
  tournamentId: string
): Promise<{ playerId: string; isEligible: boolean }[]> {
  return tx.academyEligibility.findMany({
    where: { seasonId, firstTournamentId: tournamentId },
    select: { playerId: true, isEligible: true },
  });
}
