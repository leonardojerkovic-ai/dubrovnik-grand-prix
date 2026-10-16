import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  tournamentPrize: { findMany: vi.fn() },
  tournamentPrizeAward: { findMany: vi.fn() },
  tournamentResult: { findMany: vi.fn() },
  tournament: { findUnique: vi.fn(), findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getPlayerPrizes, getTournamentPrizes } from "./tournament-prizes";

/**
 * Javni prikaz nagrada ne smije odavati interno vrijednost, ni u jednom
 * načinu. Ovi testovi pokrivaju oba oblika javnih upita.
 */

function prize(id: string, priority: number, vrijednost: number | null, extra = {}) {
  return {
    id,
    tournamentId: "t1",
    label: `Nagrada ${id}`,
    shortLabel: id.toUpperCase(),
    priority,
    count: 1,
    gender: null,
    birthYearMin: null,
    birthYearMax: null,
    ratingMin: null,
    ratingMax: null,
    clubMembersOnly: false,
    vrijednost,
    ...extra,
  };
}

function result(playerId: string, rank: number) {
  return {
    playerId,
    rank,
    gamesPlayed: true,
    ratingSnapshotUsed: 1500,
    wasClubMember: false,
    player: { birthYear: 2000, gender: "M" },
  };
}

function award(prizeId: string, playerId: string, place: number) {
  return {
    prizeId,
    tournamentId: "t1",
    playerId,
    place,
    manual: false,
    note: null,
    player: { firstName: "Ime", lastName: playerId, isClubMember: true },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTournamentPrizes — javni prikaz", () => {
  it("u načinu VRIJEDNOST nema vrijednosti i popis slijedi plasman igrača", async () => {
    // "veca" ima veću vrijednost, ali je dodijeljena igraču koji je plasiran niže.
    db.tournamentPrize.findMany.mockResolvedValue([
      prize("manja", 1, 100),
      prize("veca", 2, 900),
    ]);
    db.tournamentPrizeAward.findMany.mockResolvedValue([
      award("veca", "ana", 1),
      award("manja", "ivan", 1),
    ]);
    db.tournamentResult.findMany.mockResolvedValue([
      result("ivan", 1),
      result("ana", 2),
    ]);
    db.tournament.findUnique.mockResolvedValue({
      nagradeRedoslijed: "VRIJEDNOST",
      nagradePravilo: "OPCE_PRIJE",
    });

    const out = await getTournamentPrizes("t1");

    expect(out.map((v) => v.playerId)).toEqual(["ivan", "ana"]);
    for (const v of out) {
      expect(v).not.toHaveProperty("vrijednost");
      expect(v).not.toHaveProperty("priority");
      expect(v).not.toHaveProperty("sortKey");
    }
    expect(JSON.stringify(out)).not.toContain("vrijednost");
    expect(JSON.stringify(out)).not.toContain("900");
  });

  it("u načinu RUCNO popis slijedi priority nagrada", async () => {
    db.tournamentPrize.findMany.mockResolvedValue([
      prize("prva", 1, 100),
      prize("druga", 2, 900),
    ]);
    db.tournamentPrizeAward.findMany.mockResolvedValue([
      award("druga", "ana", 1),
      award("prva", "ivan", 1),
    ]);
    db.tournamentResult.findMany.mockResolvedValue([
      result("ana", 1),
      result("ivan", 2),
    ]);
    db.tournament.findUnique.mockResolvedValue({
      nagradeRedoslijed: "RUCNO",
      nagradePravilo: "OPCE_PRIJE",
    });

    const out = await getTournamentPrizes("t1");

    expect(out.map((v) => v.prizeId)).toEqual(["prva", "druga"]);
    expect(JSON.stringify(out)).not.toContain("vrijednost");
  });
});

describe("getPlayerPrizes — javni prikaz", () => {
  it("vraća samo javna polja, bez vrijednosti", async () => {
    db.tournamentPrizeAward.findMany.mockResolvedValue([
      {
        id: "a1",
        tournamentId: "t1",
        place: 1,
        prize: { label: "Najbolja žena", shortLabel: "Ž" },
        player: { id: "ana" },
      },
    ]);
    db.tournament.findMany.mockResolvedValue([
      {
        id: "t1",
        name: "Turnir",
        date: new Date("2026-06-01"),
        season: { yearLabel: "2026" },
      },
    ]);

    const out = await getPlayerPrizes("ana");

    expect(out).toHaveLength(1);
    expect(Object.keys(out[0]!).sort()).toEqual(
      [
        "date",
        "id",
        "label",
        "place",
        "seasonLabel",
        "shortLabel",
        "tournamentId",
        "tournamentName",
      ].sort()
    );
    expect(JSON.stringify(out)).not.toContain("vrijednost");
  });
});
