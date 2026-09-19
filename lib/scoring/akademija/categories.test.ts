import { describe, expect, it } from "vitest";
import {
  getAkademijaAgeCategories,
  isInAkademijaAgeCategory,
} from "./categories";

// Sezona 2026/27 -> G = 2026: U12 >= 2014, U10 >= 2016, U08 >= 2018 (čl. 20)
const G = 2026;

describe("getAkademijaAgeCategories (čl. 20)", () => {
  it("najmlađi igrač pripada svim trima kategorijama", () => {
    expect(getAkademijaAgeCategories(2018, G)).toEqual(["U12", "U10", "U08"]);
    expect(getAkademijaAgeCategories(2020, G)).toEqual(["U12", "U10", "U08"]);
  });

  it("poštuje granicu svake kategorije", () => {
    expect(getAkademijaAgeCategories(2017, G)).toEqual(["U12", "U10"]);
    expect(getAkademijaAgeCategories(2016, G)).toEqual(["U12", "U10"]);
    expect(getAkademijaAgeCategories(2015, G)).toEqual(["U12"]);
    expect(getAkademijaAgeCategories(2014, G)).toEqual(["U12"]);
  });

  it("prestar igrač nije ni u jednoj kategoriji", () => {
    expect(getAkademijaAgeCategories(2013, G)).toEqual([]);
  });

  it("vraća kategorije od šire prema užoj", () => {
    expect(getAkademijaAgeCategories(2019, G)).toEqual(["U12", "U10", "U08"]);
  });

  it("isInAkademijaAgeCategory se slaže s popisom", () => {
    expect(isInAkademijaAgeCategory(2016, G, "U10")).toBe(true);
    expect(isInAkademijaAgeCategory(2016, G, "U08")).toBe(false);
  });
});
