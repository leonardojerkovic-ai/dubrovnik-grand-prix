import { describe, expect, it } from "vitest";
import { legendaTitula, opisTitule, prikazanaTitula } from "./titula";

describe("prikazanaTitula", () => {
  it("zapisana titula ima prednost pred današnjom", () => {
    // Igrač je na turniru bio IV, a danas je II — tablica mora pokazati IV.
    expect(prikazanaTitula("IV", "II")).toBe("IV");
  });

  it("NONE je zapisana vrijednost, ne praznina", () => {
    // Inače bi igrač koji tada nije imao titulu dobio današnju.
    expect(prikazanaTitula("NONE", "MK")).toBe("NONE");
  });

  it("bez zapisane pada na trenutnu — turniri spremljeni prije izmjene", () => {
    expect(prikazanaTitula(null, "MK")).toBe("MK");
    expect(prikazanaTitula(undefined, "NONE")).toBe("NONE");
  });
});

describe("opisTitule", () => {
  it("daje puni naziv titule i kategorije", () => {
    expect(opisTitule("WIM")).toBe("međunarodna majstorica");
    expect(opisTitule("MK")).toBe("majstorski kandidat");
    expect(opisTitule("III")).toBe("treća kategorija");
  });

  it("NONE, prazno i nepoznato nemaju naziv", () => {
    // Inače bi se uz igrača bez titule pojavio opis na prelazak mišem.
    expect(opisTitule("NONE")).toBeNull();
    expect(opisTitule("")).toBeNull();
    expect(opisTitule(undefined)).toBeNull();
    expect(opisTitule("XYZ")).toBeNull();
  });
});

describe("legendaTitula", () => {
  it("navodi samo oznake koje se pojavljuju, svaku jednom", () => {
    expect(legendaTitula(["V", "III", "NONE", "III", "V"])).toEqual([
      { oznaka: "III", opis: "treća kategorija" },
      { oznaka: "V", opis: "peta kategorija" },
    ]);
  });

  it("reda od najviše titule prema najnižoj, bez obzira na redoslijed unosa", () => {
    expect(legendaTitula(["IV", "MK", "GM"]).map((s) => s.oznaka)).toEqual([
      "GM",
      "MK",
      "IV",
    ]);
  });

  it("tablica bez ijedne titule nema legendu", () => {
    expect(legendaTitula(["NONE", null, undefined])).toEqual([]);
  });
});
