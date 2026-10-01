import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { procitajTablicu } from "./unos";
import { dodijeliNagrade, type NovcanaNagrada } from "./dodjela";

/**
 * Isječak stvarnog ispisa iz Swiss-Managera, zalijepljen bez ijedne izmjene:
 * naslov iznad zaglavlja, dvadesetak stupaca, dob kao oznaka U20/S65, žene
 * označene slovom w, članstvo samo kroz naziv kluba.
 */
const ISPIS = readFileSync(new URL("./__fixtures__/swiss-manager.txt", import.meta.url), "utf8");

describe("ispis iz Swiss-Managera", () => {
  const { natjecatelji, greske } = procitajTablicu(ISPIS, {
    domaciKlub: "ŠK Dubrovnik",
  });

  it("preskače naslov iznad zaglavlja", () => {
    expect(greske).toEqual([]);
    expect(natjecatelji).toHaveLength(8);
    expect(natjecatelji[0]!.ime).toBe("Nikčević, Nebojša");
  });

  it("čita rejting iz stupca RtgI", () => {
    expect(natjecatelji[0]!.rejting).toBe(2318);
  });

  it("neregistriranom igraču 0 znači bez rejtinga", () => {
    const vice = natjecatelji.find((n) => n.ime === "Radulj, Vice")!;
    expect(vice.rejting).toBeNull();
  });

  it("čita dobnu oznaku iz stupca Vrsta", () => {
    expect(natjecatelji.find((n) => n.ime === "Begić, Domagoj")!.kategorije).toEqual(["U20"]);
    expect(natjecatelji.find((n) => n.ime === "Markotić, Gordan")!.kategorije).toEqual(["S65"]);
    expect(natjecatelji[0]!.kategorije).toEqual([]);
  });

  it("w znači igračicu, a prazna ćelija u tom stupcu igrača", () => {
    expect(natjecatelji.find((n) => n.ime === "Jovanović, Anja")!.spol).toBe("F");
    expect(natjecatelji[0]!.spol).toBe("M");
  });

  it("članstvo se čita iz naziva kluba, bez obzira na dijakritiku", () => {
    const clanovi = natjecatelji.filter((n) => n.clan).map((n) => n.ime);
    expect(clanovi).toEqual(["Markotić, Gordan", "Karač, Miho", "Radulj, Vice"]);
  });

  it("igrač bez kluba nije član", () => {
    expect(natjecatelji.find((n) => n.ime === "Djokić, Mihailo")!.clan).toBe(false);
  });

  it("bez zadanog domaćeg kluba nitko nije član", () => {
    const bez = procitajTablicu(ISPIS);
    expect(bez.natjecatelji.some((n) => n.clan)).toBe(false);
  });

  it("nagrade se na takvom unosu stvarno dodijele", () => {
    const nagrade: NovcanaNagrada[] = [
      { id: "1", naziv: "1. mjesto", iznos: 300, posebna: false, redoslijed: 0, broj: 1 },
      { id: "2", naziv: "2. mjesto", iznos: 200, posebna: false, redoslijed: 1, broj: 1 },
      {
        id: "zene", naziv: "Najbolja igračica", iznos: 150, posebna: true, redoslijed: 2, broj: 1,
        gender: "F",
      },
      {
        id: "u20", naziv: "Najbolji junior", iznos: 120, posebna: true, redoslijed: 3, broj: 1,
        birthYearMin: 2007, oznaka: "U20",
      },
      {
        id: "s65", naziv: "Najbolji veteran", iznos: 100, posebna: true, redoslijed: 4, broj: 1,
        birthYearMax: 1962, oznaka: "S65",
      },
      {
        id: "clan", naziv: "Najbolji član Kluba", iznos: 80, posebna: true, redoslijed: 5, broj: 1,
        clubMembersOnly: true,
      },
    ];

    const dodjele = dodijeliNagrade(natjecatelji, nagrade);
    const dobitnik = (id: string) => dodjele.find((d) => d.nagradaId === id)!.ime;

    expect(dobitnik("1")).toBe("Nikčević, Nebojša");
    expect(dobitnik("2")).toBe("Djokić, Mihailo");
    // Anja je najbolje plasirana igračica i ujedno U20; veća nagrada je za
    // igračicu, pa juniorska pada na sljedećeg U20 igrača.
    expect(dobitnik("zene")).toBe("Jovanović, Anja");
    expect(dobitnik("u20")).toBe("Begić, Domagoj");
    expect(dobitnik("s65")).toBe("Markotić, Gordan");
    // Markotić je uzeo veteransku, pa članska ide sljedećem članu.
    expect(dobitnik("clan")).toBe("Karač, Miho");
    // Nijedna nije ostala nedodijeljena.
    expect(dodjele.every((d) => d.ime !== null)).toBe(true);
  });
});

describe("titule iz Swiss-Managera", () => {
  const { natjecatelji } = procitajTablicu(ISPIS, { domaciKlub: "ŠK Dubrovnik" });

  it("čita stupac bez naziva lijevo od imena", () => {
    expect(natjecatelji.find((n) => n.ime === "Nikčević, Nebojša")!.titula).toBe("GM");
    expect(natjecatelji.find((n) => n.ime === "Djokić, Mihailo")!.titula).toBe("FM");
    expect(natjecatelji.find((n) => n.ime === "Markotić, Gordan")!.titula).toBe("IM");
  });

  it("nacionalne kategorije se prepisuju kakve jesu", () => {
    expect(natjecatelji.find((n) => n.ime === "Begić, Domagoj")!.titula).toBe("MK");
  });

  it("igrač bez titule nema zapisanu titulu", () => {
    expect(natjecatelji.find((n) => n.ime === "Jovanović, Anja")!.titula).toBeUndefined();
  });

  it("nagrada za titulu ide najbolje plasiranom nositelju", () => {
    const dodjele = dodijeliNagrade(natjecatelji, [
      { id: "1", naziv: "1. mjesto", iznos: 300, posebna: false, redoslijed: 0, broj: 1 },
      {
        id: "im", naziv: "Najbolji IM", iznos: 150, posebna: true, redoslijed: 1, broj: 1,
        titule: ["IM"],
      },
      {
        id: "fm", naziv: "Najbolji FM", iznos: 120, posebna: true, redoslijed: 2, broj: 1,
        titule: ["FM"],
      },
    ]);
    const dobitnik = (id: string) => dodjele.find((d) => d.nagradaId === id)!.ime;

    // Nikčević je GM i uzima prvo mjesto; Djokić je FM, Markotić IM.
    expect(dobitnik("1")).toBe("Nikčević, Nebojša");
    expect(dobitnik("fm")).toBe("Djokić, Mihailo");
    expect(dobitnik("im")).toBe("Markotić, Gordan");
  });

  it("jedna nagrada može obuhvatiti više titula", () => {
    const dodjele = dodijeliNagrade(natjecatelji, [
      {
        id: "imfm", naziv: "Najbolji IM ili FM", iznos: 150, posebna: true,
        redoslijed: 0, broj: 2, titule: ["IM", "FM"],
      },
    ]);
    expect(dodjele.map((d) => d.ime)).toEqual(["Djokić, Mihailo", "Markotić, Gordan"]);
  });

  it("GM ne uzima nagradu za IM-a", () => {
    const dodjele = dodijeliNagrade(
      natjecatelji.filter((n) => n.titula === "GM"),
      [{ id: "im", naziv: "Najbolji IM", iznos: 150, posebna: true, redoslijed: 0, broj: 1, titule: ["IM"] }]
    );
    expect(dodjele[0]!.ime).toBeNull();
  });
});
