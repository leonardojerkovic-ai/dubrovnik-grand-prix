import { describe, expect, it } from "vitest";
import {
  ageBoundsForCategory,
  assignPrizes,
  matchesCriteria,
  wasPrizeTransferred,
  type PrizeCandidate,
  type PrizeDefinition,
} from "./prizes";

function c(
  playerId: string,
  rank: number,
  birthYear: number,
  gender: "M" | "F",
  rating: number | null,
  wasClubMember = true
): PrizeCandidate {
  return { playerId, rank, birthYear, gender, rating, wasClubMember };
}

/**
 * Poredak za primjere — turnir u sezoni 2027 (G = 2027).
 *   1. A  1990 M 2150  član
 *   2. B  2008 M 1900  nije član
 *   3. C  1970 M 1850  član          -> S50 (<=1977)
 *   4. D  1999 Ž 1780  član          -> U1800
 *   5. E  2010 M 1650  član          -> U20 (>=2007), U1800
 *   6. F  1955 Ž 1500  nije član     -> S50, S65 (<=1962), U1800
 *   7. G  2012 Ž null  član          -> U20, U1800 (bez rejtinga = 1400)
 */
const ranking: PrizeCandidate[] = [
  c("A", 1, 1990, "M", 2150),
  c("B", 2, 2008, "M", 1900, false),
  c("C", 3, 1970, "M", 1850),
  c("D", 4, 1999, "F", 1780),
  c("E", 5, 2010, "M", 1650),
  c("F", 6, 1955, "F", 1500, false),
  c("G", 7, 2012, "F", null),
];

const OVERALL: PrizeDefinition = { id: "ukupno", priority: 1, count: 3 };
const ZENE: PrizeDefinition = { id: "zene", priority: 2, count: 1, gender: "F" };
const U1800: PrizeDefinition = {
  id: "u1800",
  priority: 3,
  count: 1,
  ratingMax: 1800,
};
const S50: PrizeDefinition = {
  id: "s50",
  priority: 4,
  count: 1,
  birthYearMax: 1977,
};
const CLAN: PrizeDefinition = {
  id: "clan",
  priority: 5,
  count: 1,
  clubMembersOnly: true,
};

describe("matchesCriteria", () => {
  it("prazan kriterij prihvaća svakoga", () => {
    expect(matchesCriteria(c("X", 1, 1990, "M", 2000), {})).toBe(true);
  });

  it("spol", () => {
    expect(matchesCriteria(ranking[3]!, { gender: "F" })).toBe(true);
    expect(matchesCriteria(ranking[0]!, { gender: "F" })).toBe(false);
  });

  it("gornja granica rejtinga je isključiva", () => {
    const exactly1800 = c("X", 1, 1990, "M", 1800);
    expect(matchesCriteria(exactly1800, { ratingMax: 1800 })).toBe(false);
    const just_below = c("Y", 1, 1990, "M", 1799);
    expect(matchesCriteria(just_below, { ratingMax: 1800 })).toBe(true);
  });

  it("igrač bez rejtinga računa se kao 1400", () => {
    expect(matchesCriteria(ranking[6]!, { ratingMax: 1800 })).toBe(true);
    expect(matchesCriteria(ranking[6]!, { ratingMin: 1500 })).toBe(false);
  });

  it("godište — mlađi od granice", () => {
    expect(matchesCriteria(ranking[4]!, { birthYearMin: 2007 })).toBe(true);
    expect(matchesCriteria(ranking[0]!, { birthYearMin: 2007 })).toBe(false);
  });

  it("godište — stariji od granice", () => {
    expect(matchesCriteria(ranking[2]!, { birthYearMax: 1977 })).toBe(true);
    expect(matchesCriteria(ranking[0]!, { birthYearMax: 1977 })).toBe(false);
  });

  it("članstvo na dan turnira", () => {
    expect(matchesCriteria(ranking[1]!, { clubMembersOnly: true })).toBe(false);
    expect(matchesCriteria(ranking[0]!, { clubMembersOnly: true })).toBe(true);
  });

  it("kriteriji se kombiniraju", () => {
    // najbolja juniorka: Ž i rođena 2007 ili kasnije -> G
    expect(
      matchesCriteria(ranking[6]!, { gender: "F", birthYearMin: 2007 })
    ).toBe(true);
    expect(
      matchesCriteria(ranking[3]!, { gender: "F", birthYearMin: 2007 })
    ).toBe(false);
  });
});

describe("assignPrizes", () => {
  const awards = assignPrizes(ranking, [OVERALL, ZENE, U1800, S50, CLAN]);
  const winner = (prizeId: string, place = 1) =>
    awards.find((a) => a.prizeId === prizeId && a.place === place)?.playerId;

  it("ukupni poredak dobiva prva tri", () => {
    expect(
      awards.filter((a) => a.prizeId === "ukupno").map((a) => a.playerId)
    ).toEqual(["A", "B", "C"]);
  });

  it("nitko ne prima dvije nagrade", () => {
    const ids = awards.map((a) => a.playerId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("kategorijska nagrada preskače one koji su već nagrađeni", () => {
    // C je treći ukupno i ujedno prvi S50; S50 zato pada na F.
    expect(winner("s50")).toBe("F");
  });

  it("najbolja žena je D, jer je najviše plasirana igračica bez nagrade", () => {
    expect(winner("zene")).toBe("D");
  });

  it("U1800 pada na E, jer je D uzela nagradu za žene", () => {
    expect(winner("u1800")).toBe("E");
  });

  it("nagrada za člana pada na G — jedini preostali član", () => {
    expect(winner("clan")).toBe("G");
  });

  it("redoslijed prioriteta odlučuje, ne redoslijed u nizu", () => {
    const obrnuto = assignPrizes(ranking, [CLAN, S50, U1800, ZENE, OVERALL]);
    expect(obrnuto.filter((a) => a.prizeId === "ukupno").map((a) => a.playerId))
      .toEqual(["A", "B", "C"]);
  });

  it("nagrada se ne dodjeljuje ako nema tko zadovoljava uvjete", () => {
    const nemoguca: PrizeDefinition = {
      id: "nemoguca",
      priority: 9,
      count: 1,
      ratingMin: 2500,
    };
    const rez = assignPrizes(ranking, [nemoguca]);
    expect(rez).toEqual([]);
  });

  it("prazan poredak ne daje nagrade", () => {
    expect(assignPrizes([], [OVERALL])).toEqual([]);
  });

  it("nagrada s više primjeraka popunjava mjesta redom", () => {
    const tri: PrizeDefinition = { id: "z3", priority: 1, count: 3, gender: "F" };
    const rez = assignPrizes(ranking, [tri]);
    expect(rez.map((a) => a.playerId)).toEqual(["D", "F", "G"]);
    expect(rez.map((a) => a.place)).toEqual([1, 2, 3]);
  });
});

describe("wasPrizeTransferred", () => {
  const awards = assignPrizes(ranking, [OVERALL, ZENE, U1800, S50, CLAN]);

  it("ukupni poredak nikad nije prenesen", () => {
    const first = awards.find((a) => a.prizeId === "ukupno" && a.place === 1)!;
    expect(wasPrizeTransferred(first, OVERALL, ranking)).toBe(false);
  });

  it("prepoznaje prijenos", () => {
    // S50 bi pripao C-u, ali je on već treći ukupno.
    const s50 = awards.find((a) => a.prizeId === "s50")!;
    expect(wasPrizeTransferred(s50, S50, ranking)).toBe(true);
  });

  it("ne prijavljuje prijenos kad je dobitnik prvi u svojoj skupini", () => {
    // D je najviše plasirana igračica i nagradu je dobila ona.
    const zene = awards.find((a) => a.prizeId === "zene")!;
    expect(wasPrizeTransferred(zene, ZENE, ranking)).toBe(false);
  });
});

describe("ageBoundsForCategory (čl. 22)", () => {
  it("dobne kategorije daju donju granicu godišta", () => {
    expect(ageBoundsForCategory("U20", 2027)).toEqual({
      birthYearMin: 2007,
      birthYearMax: null,
    });
    expect(ageBoundsForCategory("U12", 2027)).toEqual({
      birthYearMin: 2015,
      birthYearMax: null,
    });
  });

  it("veteranske kategorije daju gornju granicu godišta", () => {
    expect(ageBoundsForCategory("S50", 2027)).toEqual({
      birthYearMin: null,
      birthYearMax: 1977,
    });
    expect(ageBoundsForCategory("S65", 2027)).toEqual({
      birthYearMin: null,
      birthYearMax: 1962,
    });
  });
});
