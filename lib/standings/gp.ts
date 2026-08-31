import { prisma } from "@/lib/prisma";
import {
  buildPlayerStanding,
  calculateQuota,
  compareStandings,
  type PlayerTournamentResult,
} from "@/lib/scoring/gp/standings";
import {
  getGpAgeCategories,
  getGpVeteranCategories,
  isInU1800Category,
  type GpAgeCategory,
  type GpVeteranCategory,
} from "@/lib/scoring/gp/categories";

export type GpCategoryCode =
  | "OPCI"
  | "ZENE"
  | "U1800"
  | GpAgeCategory
  | GpVeteranCategory;

export type GpStandingRow = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
  };
  total: number;
  countedResults: PlayerTournamentResult[];
  allResults: PlayerTournamentResult[];
};

/**
 * Pripada li igrač zadanoj kategoriji — koristi bodovni engine
 * (lib/scoring/gp/categories.ts) za dobne/veteranske/U1800 provjere.
 *
 * NAPOMENA / POJEDNOSTAVLJENJE: čl. 22 st. 3 zahtijeva da se pripadnost
 * kategoriji odredi NA DAN TURNIRA (snapshot), ne prema trenutnom stanju
 * igrača. Shema ima PlayerCategoryMembership tablicu za to, ali admin UI za
 * unos rezultata je trenutno ne popunjava. Ova funkcija zato računa
 * pripadnost "live" iz trenutnog birthYear/gender igrača — ispravno je
 * SVE DOK se igračeva kategorija ne promijeni usred sezone (rijedak
 * slučaj), ali nije 100% vjerno pravilniku. Vidi TODO za sljedeću fazu.
 */
function playerBelongsToCategory(
  player: { birthYear: number; gender: string },
  category: GpCategoryCode,
  seasonStartYear: number,
  ratingUsedOnTournament: number | null
): boolean {
  if (category === "OPCI") return true;
  if (category === "ZENE") return player.gender === "F";
  if (category === "U1800") return isInU1800Category(ratingUsedOnTournament);
  if (category === "U12" || category === "U16" || category === "U20") {
    return getGpAgeCategories(player.birthYear, seasonStartYear).includes(category);
  }
  if (category === "S50" || category === "S65") {
    return getGpVeteranCategories(player.birthYear, seasonStartYear).includes(
      category
    );
  }
  return false;
}

/**
 * Dohvaća i sastavlja ljestvicu za dani GP kategoriju u zadanoj sezoni.
 * Vraća null ako sezona ne postoji.
 */
export async function getGpStandings(
  seasonId: string,
  category: GpCategoryCode
): Promise<GpStandingRow[] | null> {
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

  if (!season || season.system !== "GP") return null;

  const seasonStartYear = season.startDate.getFullYear();

  // čl. 20 st. 2 (pojednostavljeno): kategorijska ljestvica uključuje otvorene
  // turnire + turnire eksplicitno ograničene na tu kategoriju. Opći GP
  // isključuje sve turnire s ograničenjem prava nastupa (čl. 15).
  const relevantTournaments = season.tournaments.filter((t) => {
    const restricted = t.restrictedCategories as string[] | null;
    if (category === "OPCI") return !restricted || restricted.length === 0;
    if (!restricted || restricted.length === 0) return true; // otvoren svima -> ulazi i u kategorijsku
    return restricted.includes(category);
  });

  const playerMap = new Map<
    string,
    { player: GpStandingRow["player"]; results: PlayerTournamentResult[] }
  >();

  for (const t of relevantTournaments) {
    for (const r of t.results) {
      if (!r.player.isClubMember) continue; // čl. 4 — samo članovi na službenim ljestvicama
      if (
        !playerBelongsToCategory(
          r.player,
          category,
          seasonStartYear,
          r.ratingSnapshotUsed
        )
      ) {
        continue;
      }

      const entry = playerMap.get(r.playerId) ?? {
        player: {
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
      });
      playerMap.set(r.playerId, entry);
    }
  }

  const regularCount = relevantTournaments.filter((t) => !t.isFinal).length;
  const quota = calculateQuota(regularCount);

  const standings: GpStandingRow[] = Array.from(playerMap.entries()).map(
    ([playerId, { player, results }]) => {
      const built = buildPlayerStanding(playerId, results, quota);
      return { player, ...built };
    }
  );

  return standings.sort(compareStandings);
}
