import { describe, expect, it } from "vitest";
import {
  assignPrizes,
  redoslijedNagrada,
  type PrizeCandidate,
} from "./prizes";

type Nagrada = Parameters<typeof redoslijedNagrada>[0][number];

function nagrada(
  id: string,
  priority: number,
  vrijednost: number | null,
  dodatno: Partial<Nagrada> = {}
): Nagrada {
  return {
    id,
    priority,
    count: 1,
    gender: null,
    birthYearMin: null,
    birthYearMax: null,
    ratingMin: null,
    ratingMax: null,
    clubMembersOnly: false,
    vrijednost,
    ...dodatno,
  };
}

function c(playerId: string, rank: number, gender: "M" | "F"): PrizeCandidate {
  return {
    playerId,
    rank,
    birthYear: 2000,
    gender,
    rating: 1500,
    wasClubMember: false,
  };
}

const OPCA = { id: "ukupno", count: 3 };
const ZENE = { id: "zene", gender: "F" as const };

describe("redoslijedNagrada — RUCNO", () => {
  it("zadržava redoslijed priority, vrijednost se ignorira", () => {
    const prizes = [
      nagrada("a", 2, 900),
      nagrada("b", 1, 100),
    ];
    const out = redoslijedNagrada(prizes, "RUCNO", "OPCE_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["b", "a"]);
    expect(out.map((p) => p.priority)).toEqual([1, 2]);
  });
});

describe("redoslijedNagrada — VRIJEDNOST", () => {
  it("veća vrijednost ide prije manje, bez obzira na priority", () => {
    const prizes = [
      nagrada("manja", 1, 100),
      nagrada("veca", 2, 500),
    ];
    const out = redoslijedNagrada(prizes, "VRIJEDNOST", "OPCE_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["veca", "manja"]);
    expect(out.map((p) => p.priority)).toEqual([1, 2]);
  });

  it("nagrada bez vrijednosti ide zadnja", () => {
    const prizes = [
      nagrada("bez", 1, null),
      nagrada("s", 2, 10),
    ];
    const out = redoslijedNagrada(prizes, "VRIJEDNOST", "OPCE_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["s", "bez"]);
  });

  it("pri jednakoj vrijednosti OPCE_PRIJE stavlja opću nagradu prvu", () => {
    const prizes = [
      nagrada("zene", 1, 300, ZENE),
      nagrada("ukupno", 2, 300, OPCA),
    ];
    const out = redoslijedNagrada(prizes, "VRIJEDNOST", "OPCE_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["ukupno", "zene"]);
  });

  it("pri jednakoj vrijednosti POSEBNA_PRIJE stavlja posebnu nagradu prvu", () => {
    const prizes = [
      nagrada("ukupno", 1, 300, OPCA),
      nagrada("zene", 2, 300, ZENE),
    ];
    const out = redoslijedNagrada(prizes, "VRIJEDNOST", "POSEBNA_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["zene", "ukupno"]);
  });

  it("među posebnim nagradama jednake vrijednosti odlučuje priority", () => {
    const prizes = [
      nagrada("u20", 3, 200, { birthYearMin: 2006 }),
      nagrada("zene", 1, 200, ZENE),
    ];
    const out = redoslijedNagrada(prizes, "VRIJEDNOST", "OPCE_PRIJE");
    expect(out.map((p) => p.id)).toEqual(["zene", "u20"]);
  });

  it("nagrade se dodjeljuju po novom redoslijedu: veća prva, i igrač dobije najveću", () => {
    // Žena je bolje plasirana od ukupno trećeg mjesta, ali dobiva veću nagradu.
    // Veća nagrada (zene, 500) se obrađuje prva pa zadržava igračicu.
    const prizes = [
      nagrada("ukupno", 1, 300, { ...OPCA }),
      nagrada("zene", 2, 500, ZENE),
    ];
    const ordered = redoslijedNagrada(prizes, "VRIJEDNOST", "OPCE_PRIJE");
    const awards = assignPrizes(
      [c("ana", 1, "F"), c("ivan", 2, "M"), c("petar", 3, "M")],
      ordered
    );
    const zena = awards.find((a) => a.prizeId === "zene");
    expect(zena?.playerId).toBe("ana");
    expect(awards.filter((a) => a.prizeId === "ukupno").map((a) => a.playerId)).toEqual([
      "ivan",
      "petar",
    ]);
  });
});
