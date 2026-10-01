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

describe("dob iz oznake kad godišta nema", () => {
  // Swiss-Manager u konačnom poretku daje stupac „Vrsta" s U20/S65, ali ne i
  // godište. Bez ovoga bi sve dobne nagrade ostale nedodijeljene.
  const poredak: Natjecatelj[] = [
    { mjesto: 1, ime: "Stariji", godiste: null, spol: "M", rejting: 2300, clan: false, kategorije: [] },
    { mjesto: 2, ime: "Junior", godiste: null, spol: "M", rejting: 2100, clan: false, kategorije: ["U20"] },
    { mjesto: 3, ime: "Veteran", godiste: null, spol: "M", rejting: 2000, clan: false, kategorije: ["S65"] },
  ];

  it("oznaka iz poretka zamjenjuje nepoznato godište", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "u20", iznos: 100, posebna: true, birthYearMin: 2007, oznaka: "U20" }),
      nagrada({ id: "s65", iznos: 90, posebna: true, birthYearMax: 1962, oznaka: "S65" }),
    ]);
    expect(d.find((x) => x.nagradaId === "u20")!.ime).toBe("Junior");
    expect(d.find((x) => x.nagradaId === "s65")!.ime).toBe("Veteran");
  });

  it("oznaka se mora točno poklopiti — S65 ne pokriva S60", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "s60", iznos: 90, posebna: true, birthYearMax: 1967, oznaka: "S60" }),
    ]);
    expect(d[0]!.ime).toBeNull();
  });

  it("ostali uvjeti i dalje vrijede uz oznaku", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "u20zene", iznos: 100, posebna: true, birthYearMin: 2007, oznaka: "U20", gender: "F" }),
    ]);
    expect(d[0]!.ime).toBeNull();
  });

  it("poznato godište ima prednost pred oznakom", () => {
    const d = dodijeliNagrade(
      [{ mjesto: 1, ime: "Krivo označen", godiste: 1990, spol: "M", rejting: 2000, clan: false, kategorije: ["U20"] }],
      [nagrada({ id: "u20", iznos: 100, posebna: true, birthYearMin: 2007, oznaka: "U20" })]
    );
    expect(d[0]!.ime).toBeNull();
  });

  it("bez oznake na nagradi vrijedi samo godište", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "raspon", iznos: 100, posebna: true, birthYearMin: 2007 }),
    ]);
    expect(d[0]!.ime).toBeNull();
  });
});

describe("granice rejtinga", () => {
  const poredak = [
    igrac(1, "A1900", { rejting: 1900 }),
    igrac(2, "A1800", { rejting: 1800 }),
    igrac(3, "A1700", { rejting: 1700 }),
    igrac(4, "Bez", { rejting: null }),
  ];

  it("gornja granica je zadano isključiva — U1800 ne uzima 1800", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "u1800", iznos: 100, posebna: true, ratingMax: 1800 }),
    ]);
    expect(d[0]!.ime).toBe("A1700");
  });

  it("uključiva gornja granica uzima i točnu vrijednost", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({
        id: "do1800",
        iznos: 100,
        posebna: true,
        ratingMax: 1800,
        rejtingDoUkljucivo: true,
      }),
    ]);
    expect(d[0]!.ime).toBe("A1800");
  });

  it("raspon od–do uzima obje granice", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({
        id: "raspon",
        iznos: 100,
        posebna: true,
        ratingMin: 1750,
        ratingMax: 1850,
        rejtingDoUkljucivo: true,
      }),
    ]);
    expect(d[0]!.ime).toBe("A1800");
  });

  it("donja granica je uključiva", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "od1800", iznos: 100, posebna: true, ratingMin: 1800 }),
    ]);
    // A1900 je bolje plasiran i također prolazi.
    expect(d[0]!.ime).toBe("A1900");
  });

  it("igrač bez rejtinga računa se kao 1400", () => {
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "u1500", iznos: 100, posebna: true, ratingMax: 1500 }),
    ]);
    expect(d[0]!.ime).toBe("Bez");
  });

  it("rejting vrijedi i kad se dob čita iz oznake", () => {
    const poredakBezGodista: Natjecatelj[] = [
      { mjesto: 1, ime: "Jak junior", godiste: null, spol: "M", rejting: 2100, clan: false, kategorije: ["U20"] },
      { mjesto: 2, ime: "Slab junior", godiste: null, spol: "M", rejting: 1500, clan: false, kategorije: ["U20"] },
    ];
    const d = dodijeliNagrade(poredakBezGodista, [
      nagrada({
        id: "u20u1800",
        iznos: 100,
        posebna: true,
        birthYearMin: 2007,
        oznaka: "U20",
        ratingMax: 1800,
      }),
    ]);
    expect(d[0]!.ime).toBe("Slab junior");
  });
});

describe("oznaka prenesena", () => {
  it("n-to mjesto n-tom igraču nije prijenos", () => {
    const poredak = [1, 2, 3, 4].map((m) => igrac(m, `I${m}`));
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "1", naziv: "1. mjesto", iznos: 300 }),
      nagrada({ id: "2", naziv: "2. mjesto", iznos: 200 }),
      nagrada({ id: "3", naziv: "3. mjesto", iznos: 100 }),
    ]);
    expect(d.map((x) => x.ime)).toEqual(["I1", "I2", "I3"]);
    expect(d.some((x) => x.prenesena)).toBe(false);
  });

  it("isto vrijedi za niz nagrada s istim uvjetima", () => {
    const poredak = [
      igrac(1, "M1"),
      igrac(2, "Z1", { spol: "F" }),
      igrac(3, "Z2", { spol: "F" }),
    ];
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "z1", naziv: "Najbolja igračica", iznos: 200, posebna: true, gender: "F" }),
      nagrada({ id: "z2", naziv: "Druga igračica", iznos: 100, posebna: true, gender: "F" }),
    ]);
    expect(d.map((x) => x.ime)).toEqual(["Z1", "Z2"]);
    expect(d.some((x) => x.prenesena)).toBe(false);
  });

  it("prijenos se označi tek kad je netko uzeo veću nagradu", () => {
    const poredak = [
      igrac(1, "Ana", { spol: "F" }),
      igrac(2, "Boris"),
      igrac(3, "Cvita"),
    ];
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "zene", naziv: "Najbolja igračica", iznos: 500, posebna: true, gender: "F" }),
      nagrada({ id: "1", naziv: "1. mjesto", iznos: 300 }),
      nagrada({ id: "2", naziv: "2. mjesto", iznos: 200 }),
    ]);
    const po = (id: string) => d.find((x) => x.nagradaId === id)!;

    expect(po("zene").prenesena).toBe(false);
    // Ana je uzela nagradu za igračicu, pa prvo mjesto pada na Borisa.
    expect(po("1").ime).toBe("Boris");
    expect(po("1").prenesena).toBe(true);
    // Drugo mjesto bi ionako pripalo Borisu, ali on je uzeo prvo.
    expect(po("2").ime).toBe("Cvita");
    expect(po("2").prenesena).toBe(true);
  });

  it("nagrade s različitim uvjetima ne dijele brojač", () => {
    const poredak = [
      igrac(1, "Ana", { spol: "F", clan: true }),
      igrac(2, "Bara", { spol: "F" }),
    ];
    const d = dodijeliNagrade(poredak, [
      nagrada({ id: "zene", iznos: 200, posebna: true, gender: "F" }),
      nagrada({ id: "clan", iznos: 100, posebna: true, clubMembersOnly: true }),
    ]);
    // Ana uzima nagradu za igračicu; članska nema drugog člana i ostaje prazna.
    expect(d.find((x) => x.nagradaId === "zene")!.ime).toBe("Ana");
    expect(d.find((x) => x.nagradaId === "clan")!.ime).toBeNull();
  });
});
