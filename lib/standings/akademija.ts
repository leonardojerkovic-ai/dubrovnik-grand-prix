import { prisma } from "@/lib/prisma";
import { buildPlayerStanding, compareStandings, type AkademijaTournamentResult } from "@/lib/scoring/akademija/standings";

export type AkademijaStandingRow = {
  player: { id: string; firstName: string; lastName: string; title: string };
  total: number;
  countedResults: AkademijaTournamentResult[];
  allResults: AkademijaTournamentResult[];
};

export async function getAkademijaStandings(seasonId: string): Promise<AkademijaStandingRow[] | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { tournaments: { include: { results: { where: { gamesPlayed: true }, include: { player: true } } } } },
  });
  if (!season || season.system !== "AKADEMIJA") return null;

  const playerMap = new Map<string, { player: AkademijaStandingRow["player"]; results: AkademijaTournamentResult[] }>();
  for (const t of season.tournaments) {
    for (const r of t.results) {
      if (!r.wasClubMember) continue;
      const entry = playerMap.get(r.playerId) ?? { player: { id: r.player.id, firstName: r.player.firstName, lastName: r.player.lastName, title: r.player.title }, results: [] };
      entry.results.push({ tournamentId: t.id, isFinal: t.isFinal, gpPoints: r.gpPoints ?? 0, rank: r.rank, wasFirstPlace: r.rank === 1 });
      playerMap.set(r.playerId, entry);
    }
  }

  const standings = Array.from(playerMap.entries()).map(([playerId, { player, results }]) => {
    const built = buildPlayerStanding(playerId, results);
    return { player, ...built };
  });

  return standings.sort((a, b) => compareStandings(
    { playerId: a.player.id, total: a.total, countedResults: a.countedResults, allResults: a.allResults },
    { playerId: b.player.id, total: b.total, countedResults: b.countedResults, allResults: b.allResults }
  ));
}
