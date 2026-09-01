import { describe, expect, it } from "vitest";
import { buildAkademijaSnapshot, buildGpSnapshot } from "./rulebook";
import { calculateGpPoints } from "./gp/formulas";
import {
  calculateFinalPoints,
  calculateQualifierPoints,
} from "./akademija/formulas";

/** Isto zaokruživanje kao u engineu (čl. 5 — 0,5 na veći cijeli broj). */
function roundHalfUp(v: number): number {
  return Math.floor(v + 0.5);
}

describe("GP snapshot", () => {
  const cases = [
    { rank: 1, expected: 87 },
    { rank: 3, expected: 75 },
    { rank: 5, expected: 63 },
    { rank: 10, expected: 37 },
    { rank: 19, expected: 2 },
  ];

  // PRILOG A: klupska razina, rapid, N=19, prosječni rejting 1676,4
  it.each(cases)(
    "reproducira Prilog A za $rank. mjesto",
    ({ rank, expected }) => {
      const points = calculateGpPoints({
        playerCount: 19,
        rank,
        level: "KLUPSKA",
        tempo: "RAPID",
        averageRating: 1676.4,
      });
      expect(points).toBe(expected);
    }
  );

  it("faktori iz snapshota daju isti broj bodova kao engine", () => {
    for (const { rank } of cases) {
      const points = calculateGpPoints({
        playerCount: 19,
        rank,
        level: "KLUPSKA",
        tempo: "RAPID",
        averageRating: 1676.4,
      });
      const snap = buildGpSnapshot({
        playerCount: 19,
        rank,
        level: "KLUPSKA",
        tempo: "RAPID",
        averageRating: 1676.4,
        points,
      });

      // Rekonstrukcija iz zapisanih faktora mora vratiti zapisani rezultat.
      const rebuilt = Math.max(
        1,
        roundHalfUp(100 * snap.ratio * snap.product)
      );
      expect(rebuilt).toBe(snap.points);
    }
  });

  it("bilježi razinu, tempo i verziju pravilnika", () => {
    const snap = buildGpSnapshot({
      playerCount: 19,
      rank: 1,
      level: "VRHUNSKA",
      tempo: "STANDARD",
      averageRating: 1900,
      points: 140,
    });
    expect(snap.system).toBe("GP");
    expect(snap.fc).toBe(1.5);
    expect(snap.ft).toBe(1);
    expect(snap.ruleVersion).toMatch(/^GP-/);
  });

  it("poštuje gornju granicu umnoška 2,50 (čl. 9)", () => {
    const snap = buildGpSnapshot({
      playerCount: 200,
      rank: 1,
      level: "VRHUNSKA",
      tempo: "STANDARD",
      averageRating: 2400,
      points: 250,
    });
    expect(snap.product).toBeLessThanOrEqual(2.5);
  });
});

describe("Akademija snapshot", () => {
  it("reproducira kvalifikacijski turnir s 14 igrača", () => {
    for (const [rank, expected] of [
      [1, 104],
      [2, 94],
      [3, 85],
      [5, 66],
      [7, 49],
      [10, 26],
    ] as const) {
      const points = calculateQualifierPoints({ playerCount: 14, rank });
      expect(points).toBe(expected);

      const snap = buildAkademijaSnapshot({
        playerCount: 14,
        rank,
        isFinal: false,
        eligible: true,
        points,
      });
      expect(roundHalfUp(100 * snap.ratio * snap.fn)).toBe(points);
    }
  });

  it("završni turnir koristi fiksni FN = 1,50 (čl. 13)", () => {
    const points = calculateFinalPoints({ playerCount: 8, rank: 1 });
    const snap = buildAkademijaSnapshot({
      playerCount: 8,
      rank: 1,
      isFinal: true,
      eligible: true,
      points,
    });
    expect(snap.fn).toBe(1.5);
    expect(snap.points).toBe(150);
  });

  it("nema GP faktore koje formula Akademije ne poznaje", () => {
    const snap = buildAkademijaSnapshot({
      playerCount: 12,
      rank: 3,
      isFinal: false,
      eligible: true,
      points: 81,
    });
    expect(snap).not.toHaveProperty("fr");
    expect(snap).not.toHaveProperty("fc");
    expect(snap).not.toHaveProperty("ft");
    expect(snap.ruleVersion).toMatch(/^AKD-/);
  });

  it("igrač bez prava na bodove ima snapshot s points = null", () => {
    const snap = buildAkademijaSnapshot({
      playerCount: 12,
      rank: 4,
      isFinal: false,
      eligible: false,
      points: null,
    });
    expect(snap.eligible).toBe(false);
    expect(snap.points).toBeNull();
  });
});
