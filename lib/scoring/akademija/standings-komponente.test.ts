import { describe, expect, it } from "vitest";
import {
  compareStandings,
  minuteIzVremena,
  poredajAkademiju,
} from "./standings";

const dan = (iso: string) => new Date(`${iso}T00:00:00.000Z`).getTime();
const r = (
  id: string,
  d: string,
  gp: number,
  rank: number,
  isFinal = false
) => ({
  tournamentId: id,
  isFinal,
  dan: dan(d),
  gpPoints: gp,
  rank,
  wasFirstPlace: rank === 1,
});

/** Suprotan predznak, uz 0 kao vlastitu suprotnost. */
function antisimetrično(x: number, y: number): boolean {
  return Math.sign(x) === 0 ? Math.sign(y) === 0 : Math.sign(x) === -Math.sign(y);
}

describe("compareStandings je antisimetričan", () => {
  it("i kad su dva zajednička turnira istog dana, a pokazuju u različite strane", () => {
    const a = {
      total: 100,
      allResults: [r("t1", "2026-10-01", 50, 2), r("t2", "2026-10-01", 50, 7)],
    };
    const b = {
      total: 100,
      allResults: [r("t2", "2026-10-01", 50, 3), r("t1", "2026-10-01", 50, 8)],
    };
    expect(antisimetrično(compareStandings(a, b), compareStandings(b, a))).toBe(
      true
    );
    // Ne pokazuju jednoglasno, pa kriterij 5 ne odlučuje — čl. 15 st. 6.
    expect(compareStandings(a, b)).toBe(0);
  });

  it("turniri istog dana koji pokazuju jednoglasno ipak odlučuju", () => {
    const a = {
      total: 100,
      allResults: [r("t1", "2026-10-01", 50, 2), r("t2", "2026-10-01", 50, 3)],
    };
    const b = {
      total: 100,
      allResults: [r("t1", "2026-10-01", 50, 8), r("t2", "2026-10-01", 50, 9)],
    };
    expect(compareStandings(a, b)).toBeLessThan(0);
    expect(compareStandings(b, a)).toBeGreaterThan(0);
  });
});

describe("kriterij 4 — finalist je ispred nefinalista (čl. 15 st. 4)", () => {
  /**
   * A i C igrali su Prvenstvo (A 2., C 3.), B nije. Kroz kriterije 1–3 su svi
   * izjednačeni. Klub je čl. 15 st. 4 protumačio tako da igrač bez nastupa
   * nema plasman, pa je iza obojice — izjednačenje se rješava već tu.
   *
   * Dok je kriterij 4 vrijedio samo kad su OBA igrala finale, bio je
   * netranzitivan (A = B, B = C, ali A < C), pa su isti igrači davali tri
   * različita poretka ovisno o redoslijedu ulaza.
   */
  const a = {
    ime: "A",
    total: 100,
    allResults: [r("f", "2026-12-01", 100, 2, true)],
  };
  const b = {
    ime: "B",
    total: 100,
    allResults: [r("t9", "2026-10-01", 100, 4)],
  };
  const c = {
    ime: "C",
    total: 100,
    allResults: [r("f", "2026-12-01", 100, 3, true)],
  };

  function permutacije<T>(niz: T[]): T[][] {
    if (niz.length <= 1) return [niz];
    const out: T[][] = [];
    niz.forEach((x, i) => {
      for (const ostatak of permutacije([
        ...niz.slice(0, i),
        ...niz.slice(i + 1),
      ])) {
        out.push([x, ...ostatak]);
      }
    });
    return out;
  }

  it("poredak je A, C, B — i nitko ne dijeli mjesto", () => {
    const p = poredajAkademiju([a, b, c]);
    expect(p.map((x) => x.entry.ime)).toEqual(["A", "C", "B"]);
    expect(p.map((x) => x.mjesto)).toEqual([1, 2, 3]);
    expect(p.some((x) => x.dijeljeno)).toBe(false);
  });

  it("ishod je isti za svaki redoslijed ulaza", () => {
    for (const ulaz of permutacije([a, b, c])) {
      expect(poredajAkademiju(ulaz).map((x) => x.entry.ime)).toEqual([
        "A",
        "C",
        "B",
      ]);
    }
  });

  it("dva nefinalista su međusobno izjednačena, ne jedan ispred drugoga", () => {
    const d = {
      ime: "D",
      total: 100,
      allResults: [r("t8", "2026-10-01", 100, 4)],
    };
    expect(compareStandings(b, d)).toBe(0);
    expect(compareStandings(d, b)).toBe(0);
  });
});

describe("zrcalni slučaj: obrnut redoslijed lista", () => {
  /**
   * Isti par kao gore, ali s obrnutim redoslijedom rezultata u listama. Dok
   * se uzimao „prvi nađeni" turnir posljednjeg dana, ovaj je slučaj davao
   * OBA poziva pozitivna — tada između para nema veze ni u jednom smjeru,
   * pa se gubi potpunost na kojoj počiva podjela na komponente, a sortiranje
   * po predstavnicima postaje nedefinirano.
   */
  const a = {
    total: 100,
    allResults: [r("t2", "2026-10-01", 50, 7), r("t1", "2026-10-01", 50, 2)],
  };
  const b = {
    total: 100,
    allResults: [r("t1", "2026-10-01", 50, 8), r("t2", "2026-10-01", 50, 3)],
  };

  it("i tada je antisimetričan, i to neodlučen", () => {
    expect(antisimetrično(compareStandings(a, b), compareStandings(b, a))).toBe(
      true
    );
    expect(compareStandings(a, b)).toBe(0);
  });

  it("potpunost vrijedi: barem jedan smjer je „nije lošiji od“", () => {
    expect(compareStandings(a, b) <= 0 || compareStandings(b, a) <= 0).toBe(
      true
    );
  });
});

describe("dva turnira istog dana s upisanim vremenom početka", () => {
  it("odlučuje kasniji turnir, jer on JE posljednji", () => {
    // t1 u 10:00 (a bolji), t2 u 16:00 (b bolji) — odlučuje t2.
    const a = {
      total: 100,
      allResults: [
        { ...r("t1", "2026-10-01", 50, 2), pocetak: 10 * 60 },
        { ...r("t2", "2026-10-01", 50, 7), pocetak: 16 * 60 },
      ],
    };
    const b = {
      total: 100,
      allResults: [
        { ...r("t1", "2026-10-01", 50, 8), pocetak: 10 * 60 },
        { ...r("t2", "2026-10-01", 50, 3), pocetak: 16 * 60 },
      ],
    };
    expect(compareStandings(a, b)).toBeGreaterThan(0);
    expect(compareStandings(b, a)).toBeLessThan(0);
  });
});

describe("minuteIzVremena", () => {
  it("čita HH:MM", () => {
    expect(minuteIzVremena("16:30")).toBe(16 * 60 + 30);
    expect(minuteIzVremena("9:05")).toBe(9 * 60 + 5);
  });

  it("prazno, besmislica i nemogući sat daju null", () => {
    expect(minuteIzVremena(null)).toBeNull();
    expect(minuteIzVremena("")).toBeNull();
    expect(minuteIzVremena("popodne")).toBeNull();
    expect(minuteIzVremena("25:00")).toBeNull();
    expect(minuteIzVremena("10:75")).toBeNull();
  });
});

describe("redoslijed prikaza unutar dijeljenog mjesta", () => {
  const z = (ime: string) => ({
    ime,
    total: 100,
    allResults: [r("t1", "2026-09-01", 100, 3)],
  });

  it("bez zaPrikaza mjesta su ista, samo redoslijed imena nije zajamčen", () => {
    const p = poredajAkademiju([z("Zec"), z("Ambulija"), z("Matić")]);
    expect(p.map((x) => x.mjesto)).toEqual([1, 1, 1]);
    expect(p.every((x) => x.dijeljeno)).toBe(true);
  });

  it("sa zaPrikazom je redoslijed stabilan i abecedni", () => {
    const po = (a: { ime: string }, b: { ime: string }) =>
      a.ime.localeCompare(b.ime, "hr");
    for (const ulaz of [
      [z("Zec"), z("Ambulija"), z("Matić")],
      [z("Matić"), z("Zec"), z("Ambulija")],
      [z("Ambulija"), z("Matić"), z("Zec")],
    ]) {
      expect(poredajAkademiju(ulaz, po).map((x) => x.entry.ime)).toEqual([
        "Ambulija",
        "Matić",
        "Zec",
      ]);
    }
  });
});
