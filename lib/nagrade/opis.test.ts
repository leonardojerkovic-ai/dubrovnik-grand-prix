import { describe, expect, it } from "vitest";
import { opisUvjeta } from "./opis";
import type { NovcanaNagrada } from "./dodjela";

const nagrada = (over: Partial<NovcanaNagrada> = {}): NovcanaNagrada => ({
  id: "x",
  naziv: "Nagrada",
  iznos: 100,
  posebna: true,
  redoslijed: 0,
  broj: 1,
  ...over,
});

describe("opisUvjeta", () => {
  it("nagrada bez uvjeta nema što opisati", () => {
    expect(opisUvjeta(nagrada())).toBe("");
  });

  it("dobna oznaka ima prednost pred izvedenim granicama", () => {
    // Oznaka je ono što je u raspisu; granice su iz nje izvedene.
    expect(opisUvjeta(nagrada({ oznaka: "U16", birthYearMin: 2010 }))).toBe("U16");
  });

  it("granice godišta bez oznake", () => {
    expect(opisUvjeta(nagrada({ birthYearMin: 2010 }))).toBe("godište 2010 i mlađi");
    expect(opisUvjeta(nagrada({ birthYearMax: 1961 }))).toBe("godište 1961 i stariji");
  });

  it("gornja granica rejtinga prati uključivost iz raspisa", () => {
    expect(opisUvjeta(nagrada({ ratingMax: 1800 }))).toBe("rejting < 1800");
    expect(
      opisUvjeta(nagrada({ ratingMax: 1800, rejtingDoUkljucivo: true }))
    ).toBe("rejting ≤ 1800");
  });

  it("više uvjeta se niže redom", () => {
    expect(
      opisUvjeta(
        nagrada({ oznaka: "U12", gender: "F", ratingMax: 1600, clubMembersOnly: true })
      )
    ).toBe("U12, igračice, rejting < 1600, članovi Kluba");
  });
});
