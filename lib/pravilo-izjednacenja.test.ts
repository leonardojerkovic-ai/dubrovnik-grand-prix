import { describe, expect, it } from "vitest";
import { redoslijedDodjele, type NovcanaNagrada } from "./nagrade/dodjela";
import { redoslijedNagrada, type PrizeDefinition } from "./scoring/prizes";

/**
 * Pravilo izjednačenja (pri jednakoj vrijednosti opća ili posebna nagrada
 * prva) namjerno postoji na DVA mjesta:
 *
 *  - lib/nagrade/dodjela.ts — kalkulator novčanih nagrada, iznos + zastavica
 *    `posebna` na nagradi;
 *  - lib/scoring/prizes.ts — motor nagrada turnira, vrijednost + posebnost
 *    izvedena iz kriterija (opća = nijedan kriterij).
 *
 * Razlike između njih su dokumentirane u docs/odluke.md. Ove dvije grupe
 * testova imaju ISTE scenarije i ISTA očekivanja. One su jedina zaštita od
 * toga da jedan motor tiho odstupi od pravila. Ako test padne na jednom
 * motoru, a prolazi na drugom, pravilo se razišlo — popravi onaj koji
 * odstupa, a ne test.
 */

type Stavka = {
  id: string;
  /** Vrijednost (motor) ili iznos (kalkulator). null = bez vrijednosti. */
  vrijednost: number | null;
  /** true = posebna nagrada (kriterij), false = opća (bez kriterija). */
  posebna: boolean;
  /** Objavljeni redoslijed / priority: manji broj = ranije. */
  redoslijed: number;
};

type Motor = {
  naziv: string;
  poredaj: (stavke: Stavka[], pravilo: "OPCE_PRIJE" | "POSEBNA_PRIJE") => string[];
};

const kalkulator: Motor = {
  naziv: "redoslijedDodjele (kalkulator)",
  poredaj: (stavke, pravilo) =>
    redoslijedDodjele(
      stavke.map(
        (s): NovcanaNagrada => ({
          id: s.id,
          naziv: s.id,
          // Sučelje kalkulatora ne šalje nagrade bez iznosa (alat.tsx filtrira
          // iznos <= 0), pa se „bez vrijednosti“ ovdje prikazuje kao iznos 0.
          iznos: s.vrijednost ?? 0,
          posebna: s.posebna,
          redoslijed: s.redoslijed,
          broj: 1,
          gender: s.posebna ? "F" : null,
        })
      ),
      pravilo
    ).map((n) => n.id),
};

const motorTurnira: Motor = {
  naziv: "redoslijedNagrada (motor turnira)",
  poredaj: (stavke, pravilo) =>
    redoslijedNagrada(
      stavke.map(
        (s): PrizeDefinition & { vrijednost: number | null } => ({
          id: s.id,
          priority: s.redoslijed,
          count: 1,
          vrijednost: s.vrijednost,
          // Posebnost motora izvodi se iz kriterija: „F“ je jedan kriterij.
          gender: s.posebna ? "F" : null,
          birthYearMin: null,
          birthYearMax: null,
          ratingMin: null,
          ratingMax: null,
          clubMembersOnly: false,
        })
      ),
      "VRIJEDNOST",
      pravilo
    ).map((p) => p.id),
};

describe.each([kalkulator, motorTurnira])("pravilo izjednačenja — $naziv", (motor) => {
  it("jednaka vrijednost: pravilo OPCE_PRIJE stavlja opću prvu, POSEBNA_PRIJE posebnu", () => {
    const stavke: Stavka[] = [
      { id: "ukupno", vrijednost: 300, posebna: false, redoslijed: 1 },
      { id: "zene", vrijednost: 300, posebna: true, redoslijed: 2 },
    ];

    expect(motor.poredaj(stavke, "OPCE_PRIJE")).toEqual(["ukupno", "zene"]);
    expect(motor.poredaj(stavke, "POSEBNA_PRIJE")).toEqual(["zene", "ukupno"]);
  });

  it("nagrada bez vrijednosti ide zadnja, bez obzira na pravilo", () => {
    const stavke: Stavka[] = [
      { id: "bez", vrijednost: null, posebna: true, redoslijed: 1 },
      { id: "s", vrijednost: 10, posebna: false, redoslijed: 2 },
    ];

    expect(motor.poredaj(stavke, "OPCE_PRIJE")).toEqual(["s", "bez"]);
    expect(motor.poredaj(stavke, "POSEBNA_PRIJE")).toEqual(["s", "bez"]);
  });

  it("jednaka vrijednost i oba opća: odlučuje objavljeni redoslijed", () => {
    const stavke: Stavka[] = [
      { id: "drugo", vrijednost: 300, posebna: false, redoslijed: 2 },
      { id: "prvo", vrijednost: 300, posebna: false, redoslijed: 1 },
    ];

    expect(motor.poredaj(stavke, "OPCE_PRIJE")).toEqual(["prvo", "drugo"]);
    expect(motor.poredaj(stavke, "POSEBNA_PRIJE")).toEqual(["prvo", "drugo"]);
  });

  it("jednaka vrijednost i oba posebna: odlučuje objavljeni redoslijed", () => {
    const stavke: Stavka[] = [
      { id: "u20", vrijednost: 200, posebna: true, redoslijed: 2 },
      { id: "zene", vrijednost: 200, posebna: true, redoslijed: 1 },
    ];

    expect(motor.poredaj(stavke, "OPCE_PRIJE")).toEqual(["zene", "u20"]);
    expect(motor.poredaj(stavke, "POSEBNA_PRIJE")).toEqual(["zene", "u20"]);
  });
});
