import { describe, expect, it } from "vitest";
import {
  compareByRatingTitleSurname,
  type SortablePlayerEntry,
} from "./sort";

const p = (
  title: string,
  rating: number | null = 2000,
  lastName = "Test"
): SortablePlayerEntry => ({ firstName: "A", lastName, title, rating });

/** Redoslijed kojim FIDE navodi titule. */
const FIDE_ORDER = ["GM", "IM", "WGM", "FM", "WIM", "CM", "WFM", "WCM", "NONE"];

describe("poredak titula", () => {
  it("slijedi FIDE redoslijed pri jednakom rejtingu", () => {
    const shuffled = [...FIDE_ORDER].reverse().map((t) => p(t));
    const sorted = shuffled.sort(compareByRatingTitleSurname).map((x) => x.title);
    expect(sorted).toEqual(FIDE_ORDER);
  });

  it("WFM stoji između CM i WCM", () => {
    const sorted = [p("WCM"), p("WFM"), p("CM")]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.title);
    expect(sorted).toEqual(["CM", "WFM", "WCM"]);
  });

  it("nacionalne kategorije stoje ispod svih FIDE titula", () => {
    const sorted = [p("MK"), p("WCM"), p("I"), p("NONE"), p("V")]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.title);
    expect(sorted).toEqual(["WCM", "MK", "I", "V", "NONE"]);
  });

  it("nepoznata oznaka ne izbacuje igrača ispod nacionalnih kategorija", () => {
    const sorted = [p("IZMISLJENO"), p("V")]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.title);
    expect(sorted).toEqual(["V", "IZMISLJENO"]);
  });
});

describe("rejting ima prednost pred titulom", () => {
  it("viši rejting ide prvi bez obzira na titulu", () => {
    const sorted = [p("NONE", 2400), p("GM", 2300)]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.rating);
    expect(sorted).toEqual([2400, 2300]);
  });

  it("igrač bez rejtinga ide na dno", () => {
    const sorted = [p("NONE", null), p("NONE", 1200)]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.rating);
    expect(sorted).toEqual([1200, null]);
  });
});

describe("prezime kao zadnji kriterij", () => {
  it("hrvatska abeceda: Č dolazi nakon C", () => {
    const sorted = [p("NONE", 1500, "Čović"), p("NONE", 1500, "Cvitanović")]
      .sort(compareByRatingTitleSurname)
      .map((x) => x.lastName);
    expect(sorted).toEqual(["Cvitanović", "Čović"]);
  });
});
