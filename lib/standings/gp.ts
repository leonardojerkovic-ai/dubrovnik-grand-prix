import { prisma } from "@/lib/prisma";
import { buildPlayerStanding, calculateQuota, compareStandings, type PlayerTournamentResult } from "@/lib/scoring/gp/standings";
import { getGpAgeCategories, getGpVeteranCategories, isInU1800Category, type GpAgeCategory, type GpVeteranCategory } from "@/lib/scoring/gp/categories";

export type GpCategoryCode = "OPCI" | "ZENE" | "U1800" | GpAgeCategory | GpVeteranCategory;
export type GpStandingRow = { player: { id: string; firstName: string; lastName: string; title: string }; total: number; countedResults: PlayerTournamentResult[]; allResults: PlayerTournamentResult[] };

function playerBelongsToCategory(player: { birthYear: number; gender: string }, category: GpCategoryCode, seasonStartYear: number, ratingUsedOnTournament: number | null): boolean {
  if (category === "OPCI") return true;
  if (category === "ZENE") return player.gender === "F";
  if (category === "U1800") return isInU1800Category(ratingUsedOnTournament);
  if (category === "U12" || category === "U16" || category === "U20") return getGpAgeCategories(player.birthYear, seasonStartYear).includes(category);
  if (category === "S50" || category === "S65") return getGpVeteranCategories(player.birthYear, seasonStartYear).includes(category);
  return false;
}

export async function getGpStandings(seasonId: string, category: GpCategoryCode): Promise<GpStandingRow[] | null> {
  const season = await prisma.season.findUnique({ where: { id: seasonId }, include: { tournaments: { include: { results: { where: { gamesPlayed: true }, include: { player: true } } } } } });
  if (!season || season.system !== "GP") return null;
  const seasonStartYear = season.startDate.getFullYear();
  const relevantTournaments = season.tournaments.filter((t) => {
    const restricted = t.restrictedCategories as string[] | null;
    if (category === "OPCI") return !restricted || restricted.length === 0;
    if (!restricted || restricted.length === 0) return true;
    return restricted.includes(category);
  });
  const playerMap = new Map<string, { player: GpStandingRow["player"]; results: PlayerTournamentResult[] }>();
  for (const t of relevantTournaments) {
    for (const r of t.results) {
      if (!r.wasClubMember || !playerBelongsToCategory(r.player, category, seasonStartYear, r.ratingSnapshotUsed)) continue;
      const entry = playerMap.get(r.playerId) ?? { player: { id: r.player.id, firstName: r.player.firstName, lastName: r.player.lastName, title: r.player.title }, results: [] };
      entry.results.push({ tournamentId: t.id, isFinal: t.isFinal, gpPoints: r.gpPoints ?? 0 });
      playerMap.set(r.playerId, entry);
    }
  }
  const quota = calculateQuota(relevantTournaments.filter((t) => !t.isFinal).length);
  const standings = Array.from(playerMap.entries()).map(([playerId, { player, results }]) => ({ player, ...buildPlayerStanding(playerId, results, quota) }));
  return standings.sort((a, b) => compareStandings(
    { playerId: a.player.id, total: a.total, countedResults: a.countedResults, allResults: a.allResults },
    { playerId: b.player.id, total: b.total, countedResults: b.countedResults, allResults: b.allResults }
  ));
}
