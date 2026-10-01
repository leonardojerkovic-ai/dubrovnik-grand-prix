import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { procitajTablicu } from "./unos";
import { dodijeliNagrade } from "./dodjela";

/**
 * Isječak stvarnog ispisa iz Swiss-Managera na ENGLESKOM. Nazivi stupaca
 * su drugi — Rk., Name, Typ, sex — a stupca s klubom uopće nema.
 */
const ISPIS = readFileSync(new URL("./__fixtures__/swiss-manager-en.txt", import.meta.url), "utf8");

describe("engleski ispis iz Swiss-Managera", () => {
  const { natjecatelji, greske } = procitajTablicu(ISPIS, { domaciKlub: "ŠK Dubrovnik" });

  it("prepoznaje engleska zaglavlja i preskače naslov", () => {
    expect(greske).toEqual([]);
    expect(natjecatelji).toHaveLength(8);
    expect(natjecatelji[0]!.ime).toBe("Larkin, Vladyslav");
  });

  it("Name, RtgI, Typ i sex čitaju se kao i hrvatski nazivi", () => {
    expect(natjecatelji[0]).toMatchObject({ rejting: 2500, titula: "IM", kategorije: [] });
    const narmin = natjecatelji.find((n) => n.ime === "Mammadova, Narmin")!;
    expect(narmin).toMatchObject({ spol: "F", titula: "WGM" });
    expect(natjecatelji.find((n) => n.ime === "Simsek, Ayaz")!.kategorije).toEqual(["U20"]);
    expect(natjecatelji.find((n) => n.ime === "Filipovic, Branko")!.kategorije).toEqual(["S60"]);
  });

  it("bez stupca s klubom nitko nije član", () => {
    // Engleski ispis ovog turnira nema Club/City, pa se članstvo ne može
    // izvesti — mora se dodati stupac Član ručno.
    expect(natjecatelji.some((n) => n.clan)).toBe(false);
    expect(natjecatelji.some((n) => n.klub)).toBe(false);
  });

  it("neregistriranom igraču 0 znači bez rejtinga", () => {
    expect(natjecatelji.find((n) => n.ime === "Zikovic, Mario")!.rejting).toBeNull();
  });

  it("nagrade se dodijele na takvom unosu", () => {
    const dodjele = dodijeliNagrade(natjecatelji, [
      { id: "1", naziv: "1. mjesto", iznos: 400, posebna: false, redoslijed: 0, broj: 1 },
      {
        id: "zene", naziv: "Najbolja igračica", iznos: 200, posebna: true, redoslijed: 1,
        broj: 1, gender: "F",
      },
      {
        id: "s60", naziv: "Najbolji veteran", iznos: 150, posebna: true, redoslijed: 2,
        broj: 1, birthYearMax: 1967, oznaka: "S60",
      },
      {
        id: "im", naziv: "Najbolji IM", iznos: 120, posebna: true, redoslijed: 3,
        broj: 1, titule: ["IM"],
      },
    ]);
    const dobitnik = (id: string) => dodjele.find((d) => d.nagradaId === id)!.ime;

    expect(dobitnik("1")).toBe("Larkin, Vladyslav");
    expect(dobitnik("zene")).toBe("Mammadova, Narmin");
    expect(dobitnik("s60")).toBe("Filipovic, Branko");
    // Larkin je IM, ali je uzeo prvo mjesto; Filipović je IM i uzeo je
    // veteransku. Trećeg IM-a nema, pa nagrada ostaje nedodijeljena.
    expect(dobitnik("im")).toBeNull();
  });

  it("WGM ne uzima nagradu za GM-a", () => {
    const dodjele = dodijeliNagrade(natjecatelji, [
      { id: "gm", naziv: "Najbolji GM", iznos: 100, posebna: true, redoslijed: 0, broj: 1, titule: ["GM"] },
    ]);
    expect(dodjele[0]!.ime).toBe("Bogdanov, Egor");
  });
});
