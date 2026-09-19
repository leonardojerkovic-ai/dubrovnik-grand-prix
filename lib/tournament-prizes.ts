import { prisma } from "@/lib/prisma";
import {
  assignPrizes,
  wasPrizeTransferred,
  type PrizeCandidate,
  type PrizeDefinition,
} from "@/lib/scoring/prizes";

/**
 * Izračun i spremanje nagrada jednog turnira.
 *
 * Isto načelo kao kod medalja Akademije: sprema se, a ne računa u letu, jer
 * dodjela ovisi o cijelom poretku i jer se nagrade stvarno uručuju na dan
 * turnira — naknadni ispravak jednog plasmana ne smije tiho promijeniti tko
 * je što već primio. Ručno unesene dodjele (manual) ostaju netaknute.
 */
export async function syncTournamentPrizes(tournamentId: string): Promise<{
  awarded: number;
  keptManual: number;
  prizeCount: number;
}> {
  const [prizes, results] = await Promise.all([
    prisma.tournamentPrize.findMany({
      where: { tournamentId },
      orderBy: { priority: "asc" },
    }),
    prisma.tournamentResult.findMany({
      where: { tournamentId, gamesPlayed: true },
      orderBy: { rank: "asc" },
      include: {
        player: { select: { birthYear: true, gender: true } },
      },
    }),
  ]);

  if (prizes.length === 0 || results.length === 0) {
    return { awarded: 0, keptManual: 0, prizeCount: prizes.length };
  }

  const ranking: PrizeCandidate[] = results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    birthYear: r.player.birthYear,
    gender: r.player.gender,
    rating: r.ratingSnapshotUsed,
    wasClubMember: r.wasClubMember,
  }));

  const definitions: PrizeDefinition[] = prizes.map(toDefinition);

  const manual = await prisma.tournamentPrizeAward.findMany({
    where: { tournamentId, manual: true },
  });
  const takenSlots = new Set(manual.map((m) => `${m.prizeId}/${m.place}`));
  const takenPlayers = new Set(manual.map((m) => m.playerId));

  const computed = assignPrizes(ranking, definitions).filter(
    (a) =>
      !takenSlots.has(`${a.prizeId}/${a.place}`) &&
      !takenPlayers.has(a.playerId)
  );

  await prisma.$transaction([
    prisma.tournamentPrizeAward.deleteMany({
      where: { tournamentId, manual: false },
    }),
    prisma.tournamentPrizeAward.createMany({
      data: computed.map((a) => ({
        prizeId: a.prizeId,
        tournamentId,
        playerId: a.playerId,
        place: a.place,
        manual: false,
      })),
    }),
  ]);

  return {
    awarded: computed.length,
    keptManual: manual.length,
    prizeCount: prizes.length,
  };
}

type PrizeRow = {
  id: string;
  priority: number;
  count: number;
  gender: "M" | "F" | null;
  birthYearMin: number | null;
  birthYearMax: number | null;
  ratingMin: number | null;
  ratingMax: number | null;
  clubMembersOnly: boolean;
};

function toDefinition(prize: PrizeRow): PrizeDefinition {
  return {
    id: prize.id,
    priority: prize.priority,
    count: prize.count,
    gender: prize.gender,
    birthYearMin: prize.birthYearMin,
    birthYearMax: prize.birthYearMax,
    ratingMin: prize.ratingMin,
    ratingMax: prize.ratingMax,
    clubMembersOnly: prize.clubMembersOnly,
  };
}

export interface TournamentPrizeView {
  prizeId: string;
  label: string;
  shortLabel: string | null;
  place: number;
  playerId: string;
  playerName: string;
  manual: boolean;
  note: string | null;
  transferred: boolean;
}

/** Dodijeljene nagrade turnira, pripremljene za prikaz. */
export async function getTournamentPrizes(
  tournamentId: string
): Promise<TournamentPrizeView[]> {
  const [prizes, awards, results] = await Promise.all([
    prisma.tournamentPrize.findMany({
      where: { tournamentId },
      orderBy: { priority: "asc" },
    }),
    prisma.tournamentPrizeAward.findMany({
      where: { tournamentId },
      include: {
        player: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.tournamentResult.findMany({
      where: { tournamentId, gamesPlayed: true },
      orderBy: { rank: "asc" },
      include: { player: { select: { birthYear: true, gender: true } } },
    }),
  ]);

  if (awards.length === 0) return [];

  const ranking: PrizeCandidate[] = results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    birthYear: r.player.birthYear,
    gender: r.player.gender,
    rating: r.ratingSnapshotUsed,
    wasClubMember: r.wasClubMember,
  }));

  const byId = new Map(prizes.map((p) => [p.id, p]));
  const rankOf = new Map<string, number>(
    results.map((r) => [r.playerId, r.rank])
  );

  return awards
    .map((award) => {
      const prize = byId.get(award.prizeId);
      if (!prize) return null;
      return {
        prizeId: prize.id,
        label: prize.label,
        shortLabel: prize.shortLabel,
        place: award.place,
        playerId: award.playerId,
        playerName: `${award.player.lastName} ${award.player.firstName}`,
        manual: award.manual,
        note: award.note,
        transferred: wasPrizeTransferred(
          {
            prizeId: prize.id,
            playerId: award.playerId,
            place: award.place,
            rank: rankOf.get(award.playerId) ?? 0,
          },
          toDefinition(prize),
          ranking
        ),
        priority: prize.priority,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.priority - b.priority || a.place - b.place)
    .map(({ priority: _priority, ...rest }) => rest);
}

export interface PlayerPrizeView {
  id: string;
  tournamentId: string;
  tournamentName: string;
  seasonLabel: string;
  label: string;
  shortLabel: string | null;
  place: number;
  date: Date;
}

/** Sve nagrade jednog igrača, za vitrinu na profilu. */
export async function getPlayerPrizes(
  playerId: string
): Promise<PlayerPrizeView[]> {
  const awards = await prisma.tournamentPrizeAward.findMany({
    where: { playerId },
    include: {
      prize: { select: { label: true, shortLabel: true } },
      player: { select: { id: true } },
    },
  });

  if (awards.length === 0) return [];

  const tournaments = await prisma.tournament.findMany({
    where: { id: { in: awards.map((a) => a.tournamentId) } },
    include: { season: { select: { yearLabel: true } } },
  });
  const byId = new Map(tournaments.map((t) => [t.id, t]));

  return awards
    .map((a) => {
      const tournament = byId.get(a.tournamentId);
      if (!tournament) return null;
      return {
        id: a.id,
        tournamentId: a.tournamentId,
        tournamentName: tournament.name,
        seasonLabel: tournament.season.yearLabel,
        label: a.prize.label,
        shortLabel: a.prize.shortLabel,
        place: a.place,
        date: tournament.date,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.place - b.place);
}
