import { describe, expect, it } from "vitest";
import { isMinorByBirthYear } from "./guardian-rules";

describe("isMinorByBirthYear", () => {
  const now = new Date("2026-09-03T12:00:00Z");

  it("dijete rođeno 2010. je maloljetno u 2026.", () => {
    expect(isMinorByBirthYear(2010, now)).toBe(true);
  });

  it("godište koje puni 18 u tekućoj godini više nije maloljetno", () => {
    // 2026 − 2008 = 18
    expect(isMinorByBirthYear(2008, now)).toBe(false);
  });

  it("godište koje puni 17 još jest maloljetno", () => {
    expect(isMinorByBirthYear(2009, now)).toBe(true);
  });

  it("odrasli igrači nisu maloljetni", () => {
    for (const y of [1994, 1970, 2000]) {
      expect(isMinorByBirthYear(y, now)).toBe(false);
    }
  });

  it("granica se pomiče s godinom", () => {
    expect(isMinorByBirthYear(2009, new Date("2027-01-01"))).toBe(false);
  });
});
