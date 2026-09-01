import { prisma } from "@/lib/prisma";
import { isEligibleForPoints } from "@/lib/scoring/akademija/formulas";

/**
 * Utvrđuje i ZAKLJUČAVA pravo igrača na bodove u GP-u Akademije — čl. 3.
 *
 * Pravo se veže uz dan prvog nastupa u sezoni i vrijedi do kraja sezone.
 * Igrač koji na prvom turniru ima rapid rejting 1580 zadržava pravo i ako
 * do svibnja naraste na 1700; obrnuto, tko na prvom nastupu ima 1620, ne
 * stječe pravo ako kasnije padne.
 *
 * Rezultati se ne unose nužno kronološki, pa se zapis preračunava ako se
 * naknadno unese turnir raniji od dosad zabilježenog prvog nastupa.
 */
export async function resolveAcademyEligibility(input: {
  seasonId: string;
  seasonStartDate: Date;
  tournamentId: string;
  tournamentDate: Date;
  playerId: string;
  birthDate: Date | null;
  rapidRatingAtThisTournament: number | null;
}): Promise<{ isEligible: boolean; status: "locked" | "new" | "recomputed" }> {
  const existing = await prisma.academyEligibility.findUnique({
    where: {
      seasonId_playerId: {
        seasonId: input.seasonId,
        playerId: input.playerId,
      },
    },
  });

  // Već zaključano na turniru koji nije kasniji od ovoga — vrijednost stoji.
  if (existing && existing.firstTournamentDate <= input.tournamentDate) {
    return { isEligible: existing.isEligible, status: "locked" };
  }

  const seasonStartYear = input.seasonStartDate.getFullYear();

  const isEligible = input.birthDate
    ? isEligibleForPoints({
        birthDate: input.birthDate,
        seasonStartYear,
        rapidRatingAtFirstTournament: input.rapidRatingAtThisTournament,
      })
    : false;

  await prisma.academyEligibility.upsert({
    where: {
      seasonId_playerId: {
        seasonId: input.seasonId,
        playerId: input.playerId,
      },
    },
    create: {
      seasonId: input.seasonId,
      playerId: input.playerId,
      isEligible,
      firstTournamentId: input.tournamentId,
      firstTournamentDate: input.tournamentDate,
      rapidRatingAtFirst: input.rapidRatingAtThisTournament,
      birthDateUsed: input.birthDate,
    },
    update: {
      isEligible,
      firstTournamentId: input.tournamentId,
      firstTournamentDate: input.tournamentDate,
      rapidRatingAtFirst: input.rapidRatingAtThisTournament,
      birthDateUsed: input.birthDate,
    },
  });

  return { isEligible, status: existing ? "recomputed" : "new" };
}
