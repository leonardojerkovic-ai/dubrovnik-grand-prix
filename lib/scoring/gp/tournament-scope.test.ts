import { describe, expect, it } from "vitest";
import {
  GP_RESTRICTION_CODES,
  parseRestrictions,
  standingsForTournament,
  tournamentEntersStanding,
  type GpStandingCode,
} from "./tournament-scope";

const ALL: GpStandingCode[] = [
  "OPCI",
  "ZENE",
  "U20",
  "U16",
  "U12",
  "S50",
  "S65",
  "U1800",
];

const t = (
  restrictedCategories: unknown,
  opts: { isFinal?: boolean; isJuniorFinal?: boolean } = {}
) => ({
  restrictedCategories,
  isFinal: opts.isFinal ?? false,
  isJuniorFinal: opts.isJuniorFinal ?? false,
});

describe("otvoreni turnir", () => {
  it("ulazi u Opći GP i u sve kategorijske ljestvice", () => {
    expect(standingsForTournament(t(null), ALL)).toEqual(ALL);
    expect(standingsForTournament(t([]), ALL)).toEqual(ALL);
  });
});

describe("ograničeni turnir ne ulazi u Opći GP (čl. 15)", () => {
  it.each(GP_RESTRICTION_CODES)("ograničenje %s", (code) => {
    expect(tournamentEntersStanding(t([code]), "OPCI")).toBe(false);
  });
});

describe("ugniježđivanje dobnih kategorija (čl. 20 st. 2)", () => {
  it("prvenstvo U20 ulazi u U20, U16 i U12", () => {
    expect(standingsForTournament(t(["U20"]), ALL)).toEqual([
      "U20",
      "U16",
      "U12",
    ]);
  });

  it("prvenstvo U16 ulazi u U16 i U12, ali NE u U20", () => {
    expect(standingsForTournament(t(["U16"]), ALL)).toEqual(["U16", "U12"]);
    expect(tournamentEntersStanding(t(["U16"]), "U20")).toBe(false);
  });

  it("prvenstvo U12 ulazi samo u U12", () => {
    expect(standingsForTournament(t(["U12"]), ALL)).toEqual(["U12"]);
  });
});

describe("ugniježđivanje veteranskih kategorija", () => {
  it("prvenstvo +50 ulazi u S50 i S65", () => {
    expect(standingsForTournament(t(["S50"]), ALL)).toEqual(["S50", "S65"]);
  });

  it("prvenstvo +65 ulazi samo u S65", () => {
    expect(standingsForTournament(t(["S65"]), ALL)).toEqual(["S65"]);
  });
});

describe("ostale kategorije", () => {
  it("žensko prvenstvo ulazi samo u ljestvicu Žene", () => {
    expect(standingsForTournament(t(["ZENE"]), ALL)).toEqual(["ZENE"]);
  });

  it("prvenstvo U1800 ulazi samo u U1800", () => {
    expect(standingsForTournament(t(["U1800"]), ALL)).toEqual(["U1800"]);
  });
});

describe("završni turniri", () => {
  it("GP Finale ulazi u Opći GP i sve kategorije (čl. 20 st. 4)", () => {
    expect(standingsForTournament(t(null, { isFinal: true }), ALL)).toEqual(ALL);
  });

  it("Juniorsko Finale ulazi u U20, U16 i U12 (čl. 20 st. 5)", () => {
    const junior = t(null, { isFinal: true, isJuniorFinal: true });
    expect(standingsForTournament(junior, ALL)).toEqual(["U20", "U16", "U12"]);
  });

  it("Juniorsko Finale NIKAD ne ulazi u Opći GP (čl. 24)", () => {
    const junior = t(null, { isFinal: true, isJuniorFinal: true });
    expect(tournamentEntersStanding(junior, "OPCI")).toBe(false);
    // ni ako mu netko greškom ne postavi ograničenje
    expect(
      tournamentEntersStanding(
        t(["U20"], { isFinal: true, isJuniorFinal: true }),
        "OPCI"
      )
    ).toBe(false);
  });

  it("Juniorsko Finale ne ulazi u Žene ni U1800", () => {
    const junior = t(null, { isFinal: true, isJuniorFinal: true });
    expect(tournamentEntersStanding(junior, "ZENE")).toBe(false);
    expect(tournamentEntersStanding(junior, "U1800")).toBe(false);
  });
});

describe("Prilog B — broj redovnih turnira po ljestvici", () => {
  // Kalendar 2027: 16 otvorenih + 6 kategorijskih prvenstava.
  const championships = [
    t(["ZENE"]),
    t(["S50"]),
    t(["S65"]),
    t(["U20"]),
    t(["U16"]),
    t(["U12"]),
  ];
  const open = Array.from({ length: 16 }, () => t(null));
  const calendar = [...open, ...championships];

  const countFor = (standing: GpStandingCode) =>
    calendar.filter((x) => tournamentEntersStanding(x, standing)).length;

  it.each([
    ["OPCI", 16],
    ["ZENE", 17],
    ["S50", 17],
    ["S65", 18],
    ["U20", 17],
    ["U16", 18],
    ["U12", 19],
    ["U1800", 16],
  ] as const)("%s ima %i redovnih turnira", (standing, expected) => {
    expect(countFor(standing)).toBe(expected);
  });
});

describe("parseRestrictions", () => {
  it("ignorira nepoznate oznake", () => {
    expect(parseRestrictions(["U16", "IZMISLJENO", 42])).toEqual(["U16"]);
  });

  it("vraća prazan popis za null i za ne-polje", () => {
    expect(parseRestrictions(null)).toEqual([]);
    expect(parseRestrictions("U16")).toEqual([]);
  });
});
