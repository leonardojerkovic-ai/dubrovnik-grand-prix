import { describe, expect, it } from "vitest";
import {
  isMinorByBirthYear,
  needsGuardian,
  SELF_ACCOUNT_AGE,
} from "./guardian-rules";

const now = new Date("2026-09-05T12:00:00Z");

describe("needsGuardian — tko ne vodi račun sam", () => {
  it("granica je 16 godina", () => {
    expect(SELF_ACCOUNT_AGE).toBe(16);
  });

  it("dijete koje u tekućoj godini puni 15 treba skrbnika", () => {
    // 2026 − 2011 = 15
    expect(needsGuardian(2011, now)).toBe(true);
  });

  it("igrač koji u tekućoj godini puni 16 vodi račun sam", () => {
    expect(needsGuardian(2010, now)).toBe(false);
  });

  it("svi igrači Akademije trebaju skrbnika", () => {
    // Akademija: godište G−14 i mlađi
    for (const y of [2012, 2015, 2019]) {
      expect(needsGuardian(y, now)).toBe(true);
    }
  });

  it("odrasli vode račun sami", () => {
    for (const y of [1994, 1970, 2005]) {
      expect(needsGuardian(y, now)).toBe(false);
    }
  });

  it("granica se pomiče s godinom", () => {
    expect(needsGuardian(2011, new Date("2027-01-01"))).toBe(false);
  });
});

describe("isMinorByBirthYear — punoljetnost", () => {
  it("razlikuje se od granice za vlastiti račun", () => {
    // sedamnaestogodišnjak: maloljetan, ali vodi račun sam
    expect(isMinorByBirthYear(2009, now)).toBe(true);
    expect(needsGuardian(2009, now)).toBe(false);
  });

  it("godište koje puni 18 više nije maloljetno", () => {
    expect(isMinorByBirthYear(2008, now)).toBe(false);
  });
});
