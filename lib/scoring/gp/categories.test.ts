import { describe, expect, it } from "vitest";
import {
  getGpAgeCategories,
  getGpVeteranCategories,
  isInGpAgeCategory,
  isInGpVeteranCategory,
  isInU1800Category,
} from "./categories";

describe("getGpAgeCategories (čl. 22) — sezona 2026 (G=2026)", () => {
  it("rođen 2014. -> U12, U16 i U20 istovremeno", () => {
    expect(getGpAgeCategories(2014, 2026)).toEqual(["U12", "U16", "U20"]);
  });

  it("rođen 2013. -> NIJE U12, ali JEST U16 i U20", () => {
    const cats = getGpAgeCategories(2013, 2026);
    expect(cats).not.toContain("U12");
    expect(cats).toEqual(["U16", "U20"]);
  });

  it("rođen 2009. (granica U20) -> samo U20", () => {
    expect(getGpAgeCategories(2009, 2026)).toEqual(["U20"]);
  });

  it("rođen 2010. (granica U16) -> U16 i U20", () => {
    expect(getGpAgeCategories(2010, 2026)).toEqual(["U16", "U20"]);
  });

  it("rođen 2006. (točna granica U20, G-20) -> još uvijek U20", () => {
    expect(getGpAgeCategories(2006, 2026)).toEqual(["U20"]);
  });

  it("rođen 2005. (godinu prestar za U20) -> nijedna dobna kategorija", () => {
    expect(getGpAgeCategories(2005, 2026)).toEqual([]);
  });
});

describe("isInGpAgeCategory", () => {
  it("potvrđuje pripadnost pojedinoj kategoriji", () => {
    expect(isInGpAgeCategory(2013, 2026, "U16")).toBe(true);
    expect(isInGpAgeCategory(2013, 2026, "U12")).toBe(false);
  });
});

describe("getGpVeteranCategories — sezona 2026 (G=2026)", () => {
  it("rođen 1976. -> S50 (granica)", () => {
    expect(getGpVeteranCategories(1976, 2026)).toEqual(["S50"]);
  });

  it("rođen 1977. -> nijedna veteranska kategorija (premlad za S50)", () => {
    expect(getGpVeteranCategories(1977, 2026)).toEqual([]);
  });

  it("rođen 1961. -> S50 i S65 istovremeno (granica S65)", () => {
    expect(getGpVeteranCategories(1961, 2026)).toEqual(["S50", "S65"]);
  });

  it("rođen 1962. -> samo S50 (premlad za S65)", () => {
    expect(getGpVeteranCategories(1962, 2026)).toEqual(["S50"]);
  });

  it("rođen 1950. -> S50 i S65 (stariji od obje granice)", () => {
    expect(getGpVeteranCategories(1950, 2026)).toEqual(["S50", "S65"]);
  });

  it("isInGpVeteranCategory potvrđuje pripadnost pojedinoj kategoriji", () => {
    expect(isInGpVeteranCategory(1961, 2026, "S65")).toBe(true);
    expect(isInGpVeteranCategory(1962, 2026, "S65")).toBe(false);
  });
});

describe("isInU1800Category", () => {
  it("rejting ispod 1800 -> uključen", () => {
    expect(isInU1800Category(1799)).toBe(true);
    expect(isInU1800Category(1400)).toBe(true);
  });

  it("rejting 1800 ili više -> nije uključen", () => {
    expect(isInU1800Category(1800)).toBe(false);
    expect(isInU1800Category(2200)).toBe(false);
  });

  it("bez rejtinga -> trenutno tretiran kao 1400 (uključen) — vidi napomenu u categories.ts", () => {
    expect(isInU1800Category(null)).toBe(true);
    expect(isInU1800Category(undefined)).toBe(true);
  });
});
