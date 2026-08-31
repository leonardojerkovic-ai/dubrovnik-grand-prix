import { describe, expect, it } from "vitest";
import {
  calculateFN,
  calculateFinalPoints,
  calculateQualifierPoints,
  isEligibleForPoints,
} from "./formulas";

describe("Akademija calculateFN (čl. 8)", () => {
  it("odgovara orijentacijskoj tablici u potpunosti", () => {
    expect(calculateFN(7)).toBe(0.844);
    expect(calculateFN(8)).toBe(0.883);
    expect(calculateFN(10)).toBe(0.947);
    expect(calculateFN(12)).toBe(1.0);
    expect(calculateFN(14)).toBe(1.044);
    expect(calculateFN(16)).toBe(1.083);
    expect(calculateFN(18)).toBe(1.117);
    expect(calculateFN(20)).toBe(1.147);
    expect(calculateFN(24)).toBe(1.2);
    expect(calculateFN(33)).toBe(1.292);
  });

  it("cappa na 1,40 za 48 i više igrača", () => {
    expect(calculateFN(48)).toBe(1.4);
    expect(calculateFN(1000)).toBe(1.4);
  });
});

describe("Akademija calculateQualifierPoints (čl. 7) — kontrolni primjer, N=14", () => {
  const N = 14;

  it.each([
    [1, 104],
    [2, 94],
    [3, 85],
    [5, 66],
    [7, 49],
    [10, 26],
    [14, 3],
  ])("mjesto %i -> %i bodova", (rank, expected) => {
    expect(calculateQualifierPoints({ playerCount: N, rank })).toBe(expected);
  });

  it("primjer iz priloga: 4 pobjede na turnirima s 12 sudionika + 3. mjesto u finalu = 502 boda", () => {
    // FN(12) = 1.000 -> pobjeda (R=1, N=12) = round(100 * 1 * 1.000) = 100
    const winPoints = calculateQualifierPoints({ playerCount: 12, rank: 1 });
    expect(winPoints).toBe(100);
    const finalThird = calculateFinalPoints({ playerCount: 8, rank: 3 });
    expect(finalThird).toBe(102);
    expect(winPoints * 4 + finalThird).toBe(502);
  });
});

describe("Akademija calculateFinalPoints (čl. 13) — tablica za 8 sudionika", () => {
  it.each([
    [1, 150],
    [2, 125],
    [3, 102],
    [4, 80],
    [5, 59],
    [6, 40],
    [7, 23],
    [8, 9],
  ])("mjesto %i -> %i bodova", (rank, expected) => {
    expect(calculateFinalPoints({ playerCount: 8, rank })).toBe(expected);
  });
});

describe("Akademija rubni slučajevi", () => {
  it("minimalno 3 boda za odigranu partiju (čl. 9)", () => {
    const pts = calculateQualifierPoints({ playerCount: 20, rank: 20 });
    expect(pts).toBeGreaterThanOrEqual(3);
  });

  it("baca grešku za turnir s manje od 7 igrača (čl. 6)", () => {
    expect(() =>
      calculateQualifierPoints({ playerCount: 6, rank: 1 })
    ).toThrow();
  });
});

describe("isEligibleForPoints (čl. 3)", () => {
  it("igrač mlađi od 14 (na 1.1.) s niskim/bez rapid rejtinga ima pravo na bodove", () => {
    expect(
      isEligibleForPoints({
        birthDate: new Date(Date.UTC(2015, 5, 10)),
        seasonStartYear: 2026,
        rapidRatingAtFirstTournament: null,
      })
    ).toBe(true);
  });

  it("igrač koji je već navršio 14 do 1.1. NEMA pravo, bez obzira na rejting", () => {
    expect(
      isEligibleForPoints({
        birthDate: new Date(Date.UTC(2012, 5, 10)), // 14. rođendan 10.6.2026, prije toga već bio 14 iz prošle sezone
        seasonStartYear: 2027,
        rapidRatingAtFirstTournament: null,
      })
    ).toBe(false);
  });

  it("mlađi igrač s rapid rejtingom 1600+ NEMA pravo na bodove", () => {
    expect(
      isEligibleForPoints({
        birthDate: new Date(Date.UTC(2015, 5, 10)),
        seasonStartYear: 2026,
        rapidRatingAtFirstTournament: 1650,
      })
    ).toBe(false);
  });

  it("rubni slučaj: 14. rođendan pada TOČNO 1.1. sezone -> igrač je već navršio 14, NEMA pravo", () => {
    expect(
      isEligibleForPoints({
        birthDate: new Date(Date.UTC(2012, 0, 1)),
        seasonStartYear: 2026,
        rapidRatingAtFirstTournament: null,
      })
    ).toBe(false);
  });

  it("rubni slučaj: 14. rođendan pada dan NAKON 1.1. sezone -> igrač još nije navršio 14, IMA pravo", () => {
    expect(
      isEligibleForPoints({
        birthDate: new Date(Date.UTC(2012, 0, 2)),
        seasonStartYear: 2026,
        rapidRatingAtFirstTournament: null,
      })
    ).toBe(true);
  });

  it("baca grešku ako birthDate nedostaje", () => {
    expect(() =>
      isEligibleForPoints({
        // @ts-expect-error namjerno testiramo nedostajući obavezan podatak
        birthDate: undefined,
        seasonStartYear: 2026,
        rapidRatingAtFirstTournament: null,
      })
    ).toThrow();
  });
});
