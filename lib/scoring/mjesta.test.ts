import { describe, expect, it } from "vitest";
import { mjestaIzPoretka } from "./mjesta";

/** Komparator po zbroju, kakav vraćaju ljestvice: 0 = dijele mjesto. */
const poZbroju = (a: { t: number }, b: { t: number }) => b.t - a.t;

describe("mjestaIzPoretka", () => {
  it("bez izjednačenja daje 1, 2, 3", () => {
    const red = [{ t: 100 }, { t: 90 }, { t: 80 }];
    expect(mjestaIzPoretka(red, poZbroju).map((m) => m.mjesto)).toEqual([
      1, 2, 3,
    ]);
  });

  it("dijeljeno drugo mjesto preskače treće — 1, 2, 2, 4", () => {
    const red = [{ t: 100 }, { t: 90 }, { t: 90 }, { t: 80 }];
    expect(mjestaIzPoretka(red, poZbroju).map((m) => m.mjesto)).toEqual([
      1, 2, 2, 4,
    ]);
  });

  it("označava koja su mjesta dijeljena", () => {
    const red = [{ t: 100 }, { t: 90 }, { t: 90 }, { t: 80 }];
    expect(mjestaIzPoretka(red, poZbroju).map((m) => m.dijeljeno)).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });

  it("troje dijeli prvo mjesto — 1, 1, 1, 4", () => {
    const red = [{ t: 100 }, { t: 100 }, { t: 100 }, { t: 70 }];
    expect(mjestaIzPoretka(red, poZbroju).map((m) => m.mjesto)).toEqual([
      1, 1, 1, 4,
    ]);
  });

  it("prazna ljestvica", () => {
    expect(mjestaIzPoretka([], poZbroju)).toEqual([]);
  });

  it("jedan igrač nije dijeljeno mjesto", () => {
    expect(mjestaIzPoretka([{ t: 1 }], poZbroju)).toEqual([
      { mjesto: 1, dijeljeno: false },
    ]);
  });
});
