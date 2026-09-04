import { describe, expect, it } from "vitest";
import { checkEligibility } from "./eligibility";

const G = 2027;

const player = (over: Partial<Parameters<typeof checkEligibility>[0]> = {}) => ({
  birthYear: 1994,
  gender: "M",
  tempoRating: 1900,
  rapidRating: 1900,
  ...over,
});

const gp = (restrictedCategories: unknown) => ({
  restrictedCategories,
  seasonSystem: "GP" as const,
  seasonStartYear: G,
  academyPointsOnly: false,
});

const akademija = (academyPointsOnly = true) => ({
  restrictedCategories: null,
  seasonSystem: "AKADEMIJA" as const,
  seasonStartYear: 2026,
  academyPointsOnly,
});

describe("otvoreni turnir", () => {
  it("prima svakoga", () => {
    expect(checkEligibility(player(), gp(null)).allowed).toBe(true);
    expect(checkEligibility(player(), gp([])).allowed).toBe(true);
  });
});

describe("dobno ograničenje (čl. 14)", () => {
  it("kadet smije na prvenstvo U16", () => {
    // godište 2027 − 16 = 2011 i mlađi
    expect(checkEligibility(player({ birthYear: 2012 }), gp(["U16"])).allowed).toBe(true);
  });

  it("junior ne smije na prvenstvo U16", () => {
    const r = checkEligibility(player({ birthYear: 2009 }), gp(["U16"]));
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toContain("Kadeti U16");
  });

  it("kadet smije na prvenstvo U20", () => {
    expect(checkEligibility(player({ birthYear: 2012 }), gp(["U20"])).allowed).toBe(true);
  });
});

describe("spolno ograničenje", () => {
  it("igračica smije na žensko prvenstvo", () => {
    expect(checkEligibility(player({ gender: "F" }), gp(["ZENE"])).allowed).toBe(true);
  });

  it("igrač ne smije", () => {
    const r = checkEligibility(player({ gender: "M" }), gp(["ZENE"]));
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toContain("Žene");
  });
});

describe("rejtinško ograničenje U1800", () => {
  it("igrač ispod 1800 smije", () => {
    expect(checkEligibility(player({ tempoRating: 1799 }), gp(["U1800"])).allowed).toBe(true);
  });

  it("igrač na 1800 i iznad ne smije", () => {
    expect(checkEligibility(player({ tempoRating: 1800 }), gp(["U1800"])).allowed).toBe(false);
  });

  it("neocijenjeni igrač smije (računa se kao 1400)", () => {
    expect(checkEligibility(player({ tempoRating: null }), gp(["U1800"])).allowed).toBe(true);
  });

  it("gleda se rejting TEMPA turnira, ne standardni", () => {
    // standard 1900, ali rapid turnir s rapid rejtingom 1650
    expect(checkEligibility(player({ tempoRating: 1650 }), gp(["U1800"])).allowed).toBe(true);
  });
});

describe("Akademija", () => {
  it("dijete s pravom na bodove smije", () => {
    const p = player({ birthYear: 2015, rapidRating: 1200 });
    expect(checkEligibility(p, akademija()).allowed).toBe(true);
  });

  it("prestaro dijete ne smije kad je ograničenje uključeno", () => {
    const r = checkEligibility(player({ birthYear: 2005, rapidRating: 1200 }), akademija());
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toContain("2012");
  });

  it("rapid rejting 1600 i iznad ne smije", () => {
    expect(
      checkEligibility(player({ birthYear: 2015, rapidRating: 1600 }), akademija()).allowed
    ).toBe(false);
  });

  it("kad je ograničenje isključeno, smiju svi (čl. 6)", () => {
    const p = player({ birthYear: 1994, rapidRating: 2100 });
    expect(checkEligibility(p, akademija(false)).allowed).toBe(true);
  });
});
