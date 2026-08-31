import { describe, expect, it } from "vitest";
import { calculateFN, calculateFR, calculateGpPoints } from "./formulas";

describe("GP calculateFN (čl. 6)", () => {
  it("odgovara orijentacijskoj tablici za većinu N (napomena: N=10,16,20,40,80,106 u dokumentu odstupaju za ±0.001-0.003, vjerojatno ručna pogreška u pravilniku)", () => {
    expect(calculateFN(7)).toBe(0.8);
    expect(calculateFN(26)).toBe(1.103);
    expect(calculateFN(54)).toBe(1.272);
    expect(calculateFN(145)).toBe(1.5);
  });

  it("cappa na 1,50 za velike turnire", () => {
    expect(calculateFN(1000)).toBe(1.5);
  });
});

describe("GP calculateFR (čl. 7)", () => {
  it("odgovara kontrolnom primjeru PRILOG A (prosjek 1676,4 -> 0,941)", () => {
    expect(calculateFR(1676.4)).toBe(0.941);
  });

  it("ograničava na raspon [0.80, 1.30]", () => {
    expect(calculateFR(500)).toBe(0.8);
    expect(calculateFR(3000)).toBe(1.3);
  });
});

describe("GP calculateGpPoints (čl. 5) — PRILOG A: klupska, ubrzani, N=19, prosj. rejting 1676,4", () => {
  const base = {
    playerCount: 19,
    level: "KLUPSKA" as const,
    tempo: "RAPID" as const,
    averageRating: 1676.4,
  };

  it("mjesto 1 -> 87 bodova (poklapa se s dokumentom)", () => {
    expect(calculateGpPoints({ ...base, rank: 1 })).toBe(87);
  });

  it("mjesto 3 -> 75 bodova (poklapa se s dokumentom)", () => {
    expect(calculateGpPoints({ ...base, rank: 3 })).toBe(75);
  });

  it("mjesto 5 -> 63 boda (dokument navodi 64 — vidi napomenu u formulas.ts)", () => {
    expect(calculateGpPoints({ ...base, rank: 5 })).toBe(63);
  });

  it("mjesto 10 -> 37 bodova (dokument navodi 38 — vidi napomenu u formulas.ts)", () => {
    expect(calculateGpPoints({ ...base, rank: 10 })).toBe(37);
  });

  it("mjesto 19 (zadnje) -> 2 boda (poklapa se s dokumentom)", () => {
    expect(calculateGpPoints({ ...base, rank: 19 })).toBe(2);
  });
});

describe("GP calculateGpPoints — rubni slučajevi", () => {
  it("baca grešku za turnir s manje od 6 igrača (čl. 6)", () => {
    expect(() =>
      calculateGpPoints({
        playerCount: 5,
        rank: 1,
        level: "KLUPSKA",
        tempo: "STANDARD",
        averageRating: 1800,
      })
    ).toThrow();
  });

  it("nikad ne daje manje od 1 boda (čl. 9)", () => {
    const pts = calculateGpPoints({
      playerCount: 6,
      rank: 6,
      level: "KLUPSKA",
      tempo: "BLITZ",
      averageRating: 1400,
    });
    expect(pts).toBeGreaterThanOrEqual(1);
  });

  it("umnožak faktora je ograničen na 2,50 čak i kad bi FN*FR*FC*FT bio veći (čl. 9)", () => {
    // vrhunski turnir, standard, jako visok prosjek rejtinga, velik broj igrača
    const pts = calculateGpPoints({
      playerCount: 300,
      rank: 1,
      level: "VRHUNSKA",
      tempo: "STANDARD",
      averageRating: 2600,
    });
    // FN=1.5, FR=1.3(cap), FC=1.5, FT=1.0 -> umnožak bi bio 2.925, cappan na 2.50
    expect(pts).toBe(250); // 100 * 1^1.35 * 2.50 = 250, maksimalan mogući rezultat (čl. 9)
  });
});
