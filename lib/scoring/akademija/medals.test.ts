import { describe, expect, it } from "vitest";
import {
  assignMedals,
  medalEventForTournament,
  wasTransferred,
} from "./medals";
import type { MedalCandidate } from "./medals";
import { getAkademijaAgeCategories } from "./categories";

const G = 2026;

function candidate(
  playerId: string,
  rank: number,
  birthYear: number,
  isFemale: boolean
): MedalCandidate {
  return {
    playerId,
    rank,
    ageCategories: getAkademijaAgeCategories(birthYear, G),
    isFemale,
  };
}

/**
 * Zajednički poredak za primjere.
 *   1. A 2018 M -> U12, U10, U08
 *   2. B 2015 Ž -> U12
 *   3. C 2016 M -> U12, U10
 *   4. D 2018 Ž -> U12, U10, U08
 *   5. E 2014 M -> U12
 *   6. F 2019 Ž -> U12, U10, U08
 */
const ranking: MedalCandidate[] = [
  candidate("A", 1, 2018, false),
  candidate("B", 2, 2015, true),
  candidate("C", 3, 2016, false),
  candidate("D", 4, 2018, true),
  candidate("E", 5, 2014, false),
  candidate("F", 6, 2019, true),
];

describe("assignMedals — kvalifikacijski turnir (čl. 19 st. 1)", () => {
  const awards = assignMedals(ranking, "KVALIFIKACIJSKI");

  it("dodjeljuje medalje za 1., 2. i 3. mjesto ukupnog poretka", () => {
    expect(
      awards.filter((a) => a.category === "UKUPNO").map((a) => a.playerId)
    ).toEqual(["A", "B", "C"]);
  });

  it("nitko ne prima dvije medalje", () => {
    const ids = awards.map((a) => a.playerId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("kategorijska medalja prelazi na sljedećeg igrača te kategorije", () => {
    // A, B i C su već uzeli medalje iz ukupnog poretka, pa U12 pada na D.
    expect(awards.find((a) => a.category === "U12")?.playerId).toBe("D");
    // U10: A, C i D otpadaju, prvi slobodan je F.
    expect(awards.find((a) => a.category === "U10")?.playerId).toBe("F");
  });

  it("medalja se ne dodjeljuje ako u kategoriji nema slobodnog igrača", () => {
    // Svi U08 igrači (A, D, F) već imaju medalju.
    expect(awards.find((a) => a.category === "U08")).toBeUndefined();
    // Iste su i sve tri igračice (B, D, F).
    expect(awards.find((a) => a.category === "ZENE")).toBeUndefined();
  });

  it("ukupno pet medalja na ovom primjeru", () => {
    expect(awards).toHaveLength(5);
  });
});

describe("assignMedals — Prvenstvo Akademije (čl. 19 st. 2)", () => {
  it("dodjeljuje samo tri medalje ukupnog poretka", () => {
    const awards = assignMedals(ranking, "PRVENSTVO");
    expect(awards).toHaveLength(3);
    expect(awards.every((a) => a.category === "UKUPNO")).toBe(true);
    expect(awards.map((a) => a.playerId)).toEqual(["A", "B", "C"]);
  });

  it("medalEventForTournament razlikuje završni turnir", () => {
    expect(medalEventForTournament(true)).toBe("PRVENSTVO");
    expect(medalEventForTournament(false)).toBe("KVALIFIKACIJSKI");
  });
});

describe("assignMedals — konačni poredak (čl. 19 st. 3)", () => {
  const awards = assignMedals(ranking, "KONACNI_POREDAK");

  it("prva trojica ukupnog poretka", () => {
    expect(
      awards.filter((a) => a.category === "UKUPNO").map((a) => a.playerId)
    ).toEqual(["A", "B", "C"]);
  });

  it("prijenos ide dalje od trećeg mjesta kategorije", () => {
    expect(
      awards.filter((a) => a.category === "U12").map((a) => a.playerId)
    ).toEqual(["D", "E", "F"]);
  });

  it("mjesta unutar kategorije numeriraju se od 1", () => {
    expect(
      awards.filter((a) => a.category === "U12").map((a) => a.place)
    ).toEqual([1, 2, 3]);
  });

  it("nitko ne prima dvije medalje ni ovdje", () => {
    const ids = awards.map((a) => a.playerId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("assignMedals — rubni slučajevi", () => {
  it("prazan poredak ne daje medalje", () => {
    expect(assignMedals([], "KVALIFIKACIJSKI")).toEqual([]);
  });

  it("turnir s dva igrača dodjeljuje samo ono što ima kome", () => {
    const small = [
      candidate("X", 1, 2015, false),
      candidate("Y", 2, 2015, false),
    ];
    const awards = assignMedals(small, "KVALIFIKACIJSKI");
    expect(awards.map((a) => a.playerId)).toEqual(["X", "Y"]);
    expect(awards.every((a) => a.category === "UKUPNO")).toBe(true);
  });

  it("igrač izvan svih kategorija može dobiti samo medalju ukupnog poretka", () => {
    const mixed = [
      candidate("STAR", 1, 2010, false), // nijedna kategorija
      candidate("MLAD", 2, 2019, false),
    ];
    const awards = assignMedals(mixed, "KVALIFIKACIJSKI");
    expect(awards.filter((a) => a.playerId === "STAR")).toHaveLength(1);
    expect(awards.find((a) => a.playerId === "STAR")?.category).toBe("UKUPNO");
  });
});

describe("wasTransferred", () => {
  const awards = assignMedals(ranking, "KVALIFIKACIJSKI");

  it("medalja ukupnog poretka nikad nije prenesena", () => {
    const overall = awards.filter((a) => a.category === "UKUPNO");
    expect(overall.every((a) => !wasTransferred(a, ranking))).toBe(true);
  });

  it("prepoznaje prenesenu kategorijsku medalju", () => {
    // U12 vodi A (1. mjesto), ali je medalju dobio D.
    const u12 = awards.find((a) => a.category === "U12")!;
    expect(wasTransferred(u12, ranking)).toBe(true);
  });

  it("ne prijavljuje prijenos kad je medalju dobio prvi u kategoriji", () => {
    const mixed: MedalCandidate[] = [
      candidate("STAR", 1, 2010, false),
      candidate("MLAD", 2, 2019, false),
    ];
    const small = assignMedals(mixed, "KVALIFIKACIJSKI");
    const u12 = small.find((a) => a.category === "U12");
    expect(u12).toBeUndefined();
  });
});
