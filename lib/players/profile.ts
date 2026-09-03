import { prisma } from "@/lib/prisma";
import {
  buildPlayerStanding as buildGpStanding,
  calculateQuota,
} from "@/lib/scoring/gp/standings";
import { buildPlayerStanding as buildAkademijaStanding } from "@/lib/scoring/akademija/standings";
import { tournamentEntersStanding } from "@/lib/scoring/gp/tournament-scope";

/**
 * Podaci za javni profil igrača.
 *
 * Cilj je da igrač vidi ne samo koliko ima bodova, nego i KAKO su nastali i
 * KOJI rezultati ulaze u zbroj. Većina prigovora po čl. 29 zapravo je pitanje
 * o kvoti (čl. 16), a ne o formuli — pa se odgovor daje prije pitanja.
 */

export type ResultStatus =
  /** Ulazi u zbroj glavne ljestvice sezone. */
  | "counted"
  /** Ostvaren, ali izvan kvote najboljih rezultata (čl. 16). */
  | "discarded"
  /** Turnir ne ulazi u glavnu ljestvicu (npr. kategorijsko prvenstvo). */
  | "outside";

export interface ProfileResult {
  tournamentId: string;
  tournamentName: string;
  date: Date;
  tempo: string;
  level: string | null;
  isFinal: boolean;
  rank: number;
  gpPoints: number | null;
  /** Faktori kako su zabilježeni pri izračunu — vidi lib/scoring/rulebook.ts. */
  snapshot: Record<string, unknown> | null;
  status: ResultStatus;
}

export interface ProfileSeason {
  seasonId: string;
  yearLabel: string;
  system: "GP" | "AKADEMIJA";
  /** Naziv ljestvice prema kojoj se računa zbroj na profilu. */
  standingLabel: string;
  /** Broj redovnih rezultata koji ulaze u zbroj; null za Akademiju (fiksno 4). */
  quota: number | null;
  total: number;
  playedCount: number;
  results: ProfileResult[];
}

export interface RatingPoint {
  date: Date;
  value: number;
}

export interface PlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  fideId: string | null;
  birthYear: number;
  deceased: boolean;
  deceasedYear: number | null;
  isClubMember: boolean;
  memberSince: Date | null;
  current: { standard: number | null; rapid: number | null; blitz: number | null };
  ratingHistory: {
    standard: RatingPoint[];
    rapid: RatingPoint[];
    blitz: RatingPoint[];
  };
  seasons: ProfileSeason[];
}

export async function getPlayerProfile(
  playerId: string
): Promise<PlayerProfile | null> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      ratingsCurrent: true,
      ratingsHistory: { orderBy: { snapshotDate: "asc" } },
      results: {
        include: { tournament: { include: { season: true } } },
        orderBy: { tournament: { date: "asc" } },
      },
    },
  });

  if (!player) return null;

  // Sezone u kojima igrač ima barem jedan rezultat.
  const seasonIds = Array.from(
    new Set(player.results.map((r) => r.tournament.seasonId))
  );

  // Kalendari tih sezona — potrebni za kvotu (čl. 16 računa se iz KALENDARA,
  // ne iz broja turnira koje je igrač odigrao).
  const seasons = await prisma.season.findMany({
    where: { id: { in: seasonIds } },
    include: { tournaments: true },
    orderBy: { startDate: "desc" },
  });

  const profileSeasons: ProfileSeason[] = seasons.map((season) => {
    const own = player.results.filter(
      (r) => r.tournament.seasonId === season.id
    );

    if (season.system === "GP") {
      return buildGpSeason(season, own);
    }
    return buildAkademijaSeason(season, own);
  });

  const history = (type: "STANDARD" | "RAPID" | "BLITZ"): RatingPoint[] =>
    player.ratingsHistory
      .filter((s) => s.ratingType === type)
      .map((s) => ({ date: s.snapshotDate, value: s.ratingValue }));

  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    title: player.title,
    fideId: player.fideId,
    birthYear: player.birthYear,
    deceased: player.deceased,
    deceasedYear: player.deceasedYear,
    isClubMember: player.isClubMember,
    memberSince: player.memberSince,
    current: {
      standard: player.ratingsCurrent?.standard ?? null,
      rapid: player.ratingsCurrent?.rapid ?? null,
      blitz: player.ratingsCurrent?.blitz ?? null,
    },
    ratingHistory: {
      standard: history("STANDARD"),
      rapid: history("RAPID"),
      blitz: history("BLITZ"),
    },
    seasons: profileSeasons,
  };
}

interface ResultWithTournament {
  tournamentId: string;
  rank: number;
  gpPoints: number | null;
  scoringSnapshot: unknown;
  tournament: {
    id: string;
    name: string;
    date: Date;
    tempo: string;
    level: string | null;
    isFinal: boolean;
    isJuniorFinal: boolean;
    restrictedCategories: unknown;
  };
}

function toSnapshot(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function buildGpSeason(
  season: {
    id: string;
    yearLabel: string;
    tournaments: {
      isFinal: boolean;
      isJuniorFinal: boolean;
      restrictedCategories: unknown;
    }[];
  },
  own: ResultWithTournament[]
): ProfileSeason {
  // Zbroj na profilu prati Opći GP — ljestvicu kojoj svi članovi pripadaju.
  const inOpci = (t: {
    isFinal: boolean;
    isJuniorFinal: boolean;
    restrictedCategories: unknown;
  }) => tournamentEntersStanding(t, "OPCI");

  const regularInCalendar = season.tournaments.filter(
    (t) => !t.isFinal && inOpci(t)
  ).length;
  const quota = calculateQuota(regularInCalendar);

  const eligible = own.filter((r) => inOpci(r.tournament));

  const standing = buildGpStanding(
    "profile",
    eligible.map((r) => ({
      tournamentId: r.tournamentId,
      isFinal: r.tournament.isFinal,
      gpPoints: r.gpPoints ?? 0,
    })),
    quota
  );

  const countedIds = new Set(
    standing.countedResults.map((r) => r.tournamentId)
  );

  return {
    seasonId: season.id,
    yearLabel: season.yearLabel,
    system: "GP",
    standingLabel: "Opći GP",
    quota,
    total: standing.total,
    playedCount: own.length,
    results: own.map((r) => ({
      tournamentId: r.tournamentId,
      tournamentName: r.tournament.name,
      date: r.tournament.date,
      tempo: r.tournament.tempo,
      level: r.tournament.level,
      isFinal: r.tournament.isFinal,
      rank: r.rank,
      gpPoints: r.gpPoints,
      snapshot: toSnapshot(r.scoringSnapshot),
      status: !inOpci(r.tournament)
        ? "outside"
        : countedIds.has(r.tournamentId)
          ? "counted"
          : "discarded",
    })),
  };
}

function buildAkademijaSeason(
  season: { id: string; yearLabel: string },
  own: ResultWithTournament[]
): ProfileSeason {
  const standing = buildAkademijaStanding(
    "profile",
    own.map((r) => ({
      tournamentId: r.tournamentId,
      isFinal: r.tournament.isFinal,
      gpPoints: r.gpPoints ?? 0,
      rank: r.rank,
      wasFirstPlace: r.rank === 1,
    }))
  );

  const countedIds = new Set(
    standing.countedResults.map((r) => r.tournamentId)
  );

  return {
    seasonId: season.id,
    yearLabel: season.yearLabel,
    system: "AKADEMIJA",
    standingLabel: "GP Akademije",
    quota: null,
    total: standing.total,
    playedCount: own.length,
    results: own.map((r) => ({
      tournamentId: r.tournamentId,
      tournamentName: r.tournament.name,
      date: r.tournament.date,
      tempo: r.tournament.tempo,
      level: r.tournament.level,
      isFinal: r.tournament.isFinal,
      rank: r.rank,
      gpPoints: r.gpPoints,
      snapshot: toSnapshot(r.scoringSnapshot),
      status: countedIds.has(r.tournamentId) ? "counted" : "discarded",
    })),
  };
}
