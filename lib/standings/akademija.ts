import { prisma } from "@/lib/prisma";
import {
  buildPlayerStanding,
  compareStandings,
  type AkademijaTournamentResult,
} from "@/lib/scoring/akademija/standings";

export type AkademijaStandingRow = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    isClubMember: boolean;
  };
  total: number;
  countedResults: AkademijaTournamentResult[];
  allResults: AkademijaTournamentResult[];
};

/**
 * Dohvaća i sastavlja konačni poredak GP Akademije za zadanu sezonu (čl. 14).
 *
 * NAPOMENA / POJEDNOSTAVLJENJE: pravo na bodove (čl. 3 — dobna/rejting
 * granica) trenutno se ne provjerava ovdje; pretpostavlja se da je admin
 * pri unosu rezultata već uzeo u obzir tko ima pravo na bodove. Provjera
 * kroz isEligibleForPoints() (lib/scoring/akademija/formulas.ts) treba se
 * ugraditi u admin unos rezultata u idućoj iteraciji.
 */
export async function getAkademijaStandings(
  seasonId: string
): Promise<AkademijaStandingRow[] | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      tournaments: {
        include: {
          results: {
            where: { gamesPlayed: true },
            include: { player: true },
          },
        },
      },
    },
  });

  if (!season || season.system !== "AKADEMIJA") return null;

  const playerMap = new Map<
    string,
    {
      player: AkademijaStandingRow["player"];
      results: AkademijaTournamentResult[];
    }
  >();

  for (const t of season.tournaments) {
    for (const r of t.results) {
      // čl. 4 — članstvo NA DAN TURNIRA, ne trenutno stanje.
      if (!r.wasClubMember) continue;

      const entry = playerMap.get(r.playerId) ?? {
        player: {
          isClubMember: r.player.isClubMember,
          id: r.player.id,
          firstName: r.player.firstName,
          lastName: r.player.lastName,
          title: r.player.title,
        },
        results: [],
      };
      entry.results.push({
        tournamentId: t.id,
        isFinal: t.isFinal,
        gpPoints: r.gpPoints ?? 0,
        rank: r.rank,
        wasFirstPlace: r.rank === 1,
      });
      playerMap.set(r.playerId, entry);
    }
  }

  const standings: AkademijaStandingRow[] = Array.from(
    playerMap.entries()
  ).map(([playerId, { player, results }]) => {
    const built = buildPlayerStanding(playerId, results);
    return { player, ...built };
  });

  return standings.sort(compareStandings);
}
