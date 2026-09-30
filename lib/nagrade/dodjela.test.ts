import { describe, expect, it } from "vitest";
import {
  dodijeliNagrade,
  redoslijedDodjele,
  ukupnoIsplaceno,
  type NovcanaNagrada,
  type Natjecatelj,
} from "./dodjela";

function igrac(
  mjesto: number,
  ime: string,
  extra: Partial<Natjecatelj> = {}
): Natjecatelj {
  return {
    mjesto,
    ime,
    godiste: 1990,
    spol: "M",
    rejting: 2000,
    clan: false,
    ...extra,
  };
}

function nagrada(n: Partial<NovcanaNagrada> & { id: string; iznos: number }): NovcanaNagrada {
  return {
    naziv: n.id,
    posebna: false,
    redoslijed: 0,
    broj: 1,
    ...n,
  };
}

describe("dodijeliNagrade", () => {
  it("igrač koji osvoji više nagrada dobiva VEĆU", () => {
    const poredak = [
      igrac(1, "Ana", { spol: "F" }),
      igrac(2, "Boris"),
      igrac(3, "Cvita", { spol: "F" }),
    ];
    const nagrade = [
      nagrada({ id: "1.mjesto", naziv: "1. mjesto", iznos: 300 }),
      nagrada({ id: "zene", naziv: "Najbolja igračica", iznos: 500, posebna: true, gender: "F" }),
    ];

    const d = dodijeliNagrade(poredak, nagrade);
    const po = (id: string) => d.find((x) => x.nagradaId === id)!;

    // Ana je i prva i najbolja igračica. Veća je nagrada za igračicu.
    expect(po("zene").ime).toBe("Ana");
    // Prvo mjesto zato pada na sljedećeg, i to je prijenos.
    expect(po("1.mjesto").ime).toBe("Boris");
    expect(po("1.mjesto").prenesena).toBe(true);
  });

  it("pri jednakim iznosima opće mjesto je iznad posebne nagrade", () => {
    const poredak = [
      igrac(1, "Ana", { spol: "F" }),
      igrac(2, "Boris"),
      igrac(3, "Cvita", { spol: "F" }),
    ];
    const nagrade = [
      nagrada({ id: "zene", iznos: 200, posebna: true, gender: "F" }),
      nagrada({ id: "1.mjesto", iznos: 200 }),
    ];

    const d = dodijeliNagrade(poredak, nagrade);
    // Ana uzima prvo mjesto, pa nagrada za igračicu pada na Cvitu.
    expect(d.find((x) => x.nagradaId === "1.mjesto")!.ime).toBe("Ana");
    expect(d.find((x) => x.nagradaId === "zene")!.ime).toBe("Cvita");
    expect(d.find((x) => x.nagradaId === "zene")!.prenesena).toBe(true);
  });

  it("među jednakim posebnim nagradama odlučuje objavljeni redoslijed", () => {
    // Ana je i najbolja igračica i najbolja članica Kluba, obje po 150 €.
    const poredak = [igrac(1, "Ana", { spol: "F", clan: true })];
    const nagrade = [
      nagrada({ id: "clan", iznos: 150, posebna: true, redoslijed: 2, clubMembersOnly: true }),
      nagrada({ id: "zene", iznos: 150, posebna: true, redoslijed: 1, gender: "F" }),
    ];

    const d = dodijeliNagrade(poredak, nagrade);
    expect(d.find((x) => x.nagradaId === "zene")!.ime).toBe("Ana");
    expect(d.find((x) => x.nagradaId === "clan")!.ime).toBeNull();
  });

  it("oslobođena nagrada prelazi dalje, i opetovano", () => {
    // Prva tri su sve članice Kluba; nagrade za mjesta uzimaju ih redom,
    // pa nagrada za najbolju članicu pada na četvrtu.
    const poredak = [
      igrac(1, "Ana", { spol: "F", clan: true }),
      igrac(2, "Bara", { spol: "F", clan: true }),
      igrac(3, "Cvita", { spol: "F", clan: true }),
      igrac(4, "Dora", { spol: "F", clan: true }),
    ];
    const nagrade = [
      nagrada({ id: "1", iznos: 300 }),
      nagrada({ id: "2", iznos: 200 }),
      nagrada({ id: "3", iznos: 100 }),
      nagrada({ id: "clan", iznos: 50, posebna: true, clubMembersOnly: true }),
    ];

    const d = dodijeliNagrade(poredak, nagrade);
    expect(d.find((x) => x.nagradaId === "clan")!.ime).toBe("Dora");
    expect(d.find((x) => x.nagradaId === "clan")!.prenesena).toBe(true);
  });

  it("nagrada ostaje nedodijeljena kad nitko ne zadovoljava uvjete", () => {
    const poredak = [igrac(1, "Ana"), igrac(2, "Boris")];
    const nagrade = [nagrada({ id: "zene", iznos: 100, posebna: true, gender: "F" })];

    const d = dodijeliNagrade(poredak, nagrade);
    expect(d[0]!.ime).toBeNull();
    expect(ukupnoIsplaceno(d)).toBe(0);
  });

  it("dodjeljuje više primjeraka iste nagrade redom", () => {
    const poredak = [
      igrac(1, "Ana", { godiste: 2010 }),
      igrac(2, "Boris", { godiste: 2011 }),
      igrac(3, "Cvita", { godiste: 1980 }),
    ];
    const nagrade = [
      nagrada({ id: "juniori", iznos: 60, posebna: true, broj: 2, birthYearMin: 2007 }),
    ];

    const d = dodijeliNagrade(poredak, nagrade);
    expect(d.map((x) => x.ime)).toEqual(["Ana", "Boris"]);
    expect(ukupnoIsplaceno(d)).toBe(120);
  });

  it("igrač bez zapisanog spola ne uzima nagradu koja spol postavlja kao uvjet", () => {
    const poredak = [igrac(1, "Ana", { spol: null }), igrac(2, "Bara", { spol: "F" })];
    const nagrade = [nagrada({ id: "zene", iznos: 100, posebna: true, gender: "F" })];

    expect(dodijeliNagrade(poredak, nagrade)[0]!.ime).toBe("Bara");
  });

  it("igrač bez godišta ne uzima dobnu nagradu", () => {
    const poredak = [igrac(1, "Ana", { godiste: null }), igrac(2, "Bara", { godiste: 2010 })];
    const nagrade = [nagrada({ id: "u20", iznos: 100, posebna: true, birthYearMin: 2007 })];

    expect(dodijeliNagrade(poredak, nagrade)[0]!.ime).toBe("Bara");
  });

  it("zatvoreni raspon godišta uzima obje granice", () => {
    // Nagrada za rođene 1960.–1970., kakvu gotove oznake ne pokrivaju.
    const poredak = [
      igrac(1, "Ana", { godiste: 1955 }),
      igrac(2, "Boris", { godiste: 1965 }),
      igrac(3, "Cvita", { godiste: 1975 }),
    ];
    const nagrade = [
      nagrada({ id: "raspon", iznos: 80, posebna: true, birthYearMin: 1960, birthYearMax: 1970 }),
    ];

    expect(dodijeliNagrade(poredak, nagrade)[0]!.ime).toBe("Boris");
  });

  it("nitko ne dobiva dvije nagrade", () => {
    const poredak = [igrac(1, "Ana", { spol: "F", clan: true, godiste: 2010 })];
    const nagrade = [
      nagrada({ id: "1", iznos: 300 }),
      nagrada({ id: "zene", iznos: 200, posebna: true, gender: "F" }),
      nagrada({ id: "clan", iznos: 100, posebna: true, clubMembersOnly: true }),
    ];

    const dobitnici = dodijeliNagrade(poredak, nagrade).filter((d) => d.ime);
    expect(dobitnici).toHaveLength(1);
    expect(dobitnici[0]!.iznos).toBe(300);
  });
});

describe("redoslijedDodjele", () => {
  it("veći iznos ide prvi, pa opće prije posebne, pa objavljeni redoslijed", () => {
    const poredak = redoslijedDodjele([
      nagrada({ id: "opca-100", iznos: 100 }),
      nagrada({ id: "posebna-100-b", iznos: 100, posebna: true, redoslijed: 2 }),
      nagrada({ id: "posebna-100-a", iznos: 100, posebna: true, redoslijed: 1 }),
      nagrada({ id: "opca-300", iznos: 300 }),
    ]);

    expect(poredak.map((n) => n.id)).toEqual([
      "opca-300",
      "opca-100",
      "posebna-100-a",
      "posebna-100-b",
    ]);
  });
});
