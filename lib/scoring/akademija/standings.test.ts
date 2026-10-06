import { describe, expect, it } from "vitest";
import {
  compareStandings,
  poredajAkademiju,
  type AkademijaTournamentResult,
} from "./standings";

const dan = (iso: string) => new Date(`${iso}T00:00:00.000Z`).getTime();

function r(
  tournamentId: string,
  datum: string,
  gpPoints: number,
  rank: number,
  isFinal = false
): AkademijaTournamentResult {
  return {
    tournamentId,
    isFinal,
    dan: dan(datum),
    gpPoints,
    rank,
    wasFirstPlace: rank === 1,
  };
}

/**
 * Čl. 15 — razrješenje ravnopravnosti. Kriteriji 1–4 su bili ugrađeni;
 * kriterij 5 (posljednji zajednički odigrani turnir) nije, pa su igrači
 * ostajali izjednačeni i mjesto među njima dijelio je redoslijed u memoriji.
 */
describe("compareStandings — čl. 15 kriterij 5 (posljednji zajednički turnir)", () => {
  it("odlučuje plasman na posljednjem turniru koji su OBA odigrala", () => {
    // Sve do kriterija 5 je jednako: isti zbroj, isti svi rezultati, nula
    // prvih mjesta, isti broj turnira, nitko nije igrao finale.
    const a = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 60, 4), r("t2", "2026-10-01", 40, 7)],
    };
    const b = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 40, 7), r("t2", "2026-10-01", 60, 4)],
    };
    // Na t2 (kasniji) a je 7., b je 4. — b ide ispred.
    expect(compareStandings(a, b)).toBeGreaterThan(0);
    expect(compareStandings(b, a)).toBeLessThan(0);
  });

  it("gleda samo zajedničke turnire, ne i one koje je igrao samo jedan", () => {
    const a = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 50, 2), r("t9", "2026-12-01", 50, 9)],
    };
    const b = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 50, 5), r("t8", "2026-12-01", 50, 4)],
    };
    // t8 i t9 nisu zajednički; odlučuje t1, gdje je a 2., b 5.
    expect(compareStandings(a, b)).toBeLessThan(0);
  });

  it("bez zajedničkog turnira igrači dijele mjesto", () => {
    const a = { total: 50, allResults: [r("t1", "2026-09-01", 50, 3)] };
    const b = { total: 50, allResults: [r("t2", "2026-09-01", 50, 3)] };
    expect(compareStandings(a, b)).toBe(0);
  });

  it("jednak plasman i na posljednjem zajedničkom turniru znači dijeljeno mjesto", () => {
    const a = { total: 50, allResults: [r("t1", "2026-09-01", 50, 3)] };
    const b = { total: 50, allResults: [r("t1", "2026-09-01", 50, 3)] };
    expect(compareStandings(a, b)).toBe(0);
  });

  it("kriteriji prije njega i dalje imaju prednost — više prvih mjesta pobjeđuje", () => {
    const a = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 100, 1), r("t2", "2026-10-01", 0, 9)],
    };
    const b = {
      total: 100,
      allResults: [r("t1", "2026-09-01", 0, 9), r("t2", "2026-10-01", 100, 2)],
    };
    // Zbroj svih je jednak (100), a ima jedno prvo mjesto, b nijedno.
    expect(compareStandings(a, b)).toBeLessThan(0);
  });
});

describe("poredajAkademiju — krug u kriteriju 5 (čl. 15 st. 6)", () => {
  /**
   * A, B, C izjednačeni kroz kriterije 1–4 (isti zbroj, isti zbroj svih, nula
   * prvih mjesta, isti broj turnira, bez finala), a kriterij 5 ih vrti u
   * krug: A pobjeđuje B na t3, B pobjeđuje C na t2, C pobjeđuje A na t1.
   */
  const a = {
    ime: "A",
    total: 120,
    allResults: [r("t1", "2026-09-01", 60, 5), r("t3", "2026-11-01", 60, 2)],
  };
  const b = {
    ime: "B",
    total: 120,
    allResults: [r("t2", "2026-10-01", 60, 2), r("t3", "2026-11-01", 60, 6)],
  };
  const c = {
    ime: "C",
    total: 120,
    allResults: [r("t1", "2026-09-01", 60, 2), r("t2", "2026-10-01", 60, 6)],
  };

  /** D je izjednačen kroz 1–4, ali ga kriterij 5 stavlja ispred sve trojice. */
  const d = {
    ime: "D",
    total: 120,
    allResults: [
      r("t1", "2026-09-01", 60, 1),
      r("t2", "2026-10-01", 60, 1),
      r("t3", "2026-11-01", 60, 1),
    ],
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

  it("krug je stvarno krug", () => {
    expect(compareStandings(a, b)).toBeLessThan(0);
    expect(compareStandings(b, c)).toBeLessThan(0);
    expect(compareStandings(c, a)).toBeLessThan(0);
  });

  it("A, B i C dijele mjesto", () => {
    const p = poredajAkademiju([a, b, c]);
    expect(p.map((x) => x.mjesto)).toEqual([1, 1, 1]);
    expect(p.every((x) => x.dijeljeno)).toBe(true);
  });

  it("D, kojeg kriterij 5 razdvaja od sve trojice, NE dijeli mjesto s njima", () => {
    const p = poredajAkademiju([d, a, b, c]);
    expect(p[0]!.entry.ime).toBe("D");
    expect(p[0]!.mjesto).toBe(1);
    expect(p[0]!.dijeljeno).toBe(false);
    expect(p.slice(1).map((x) => x.mjesto)).toEqual([2, 2, 2]);
    expect(p.slice(1).every((x) => x.dijeljeno)).toBe(true);
  });

  it("rezultat je isti za svaki redoslijed ulaznog niza", () => {
    for (const ulaz of permutacije([a, b, c, d])) {
      const p = poredajAkademiju(ulaz);
      expect(p[0]!.entry.ime).toBe("D");
      expect(p.map((x) => x.mjesto)).toEqual([1, 2, 2, 2]);
      expect([...p.slice(1).map((x) => x.entry.ime)].sort()).toEqual([
        "A",
        "B",
        "C",
      ]);
    }
  });

  it("bez kruga kriterij 5 normalno poreda skupinu", () => {
    const x = {
      ime: "X",
      total: 100,
      allResults: [r("t1", "2026-09-01", 50, 2), r("t2", "2026-10-01", 50, 3)],
    };
    const y = {
      ime: "Y",
      total: 100,
      allResults: [r("t1", "2026-09-01", 50, 3), r("t2", "2026-10-01", 50, 5)],
    };
    const p = poredajAkademiju([y, x]);
    expect(p.map((e) => e.entry.ime)).toEqual(["X", "Y"]);
    expect(p.map((e) => e.mjesto)).toEqual([1, 2]);
    expect(p.some((e) => e.dijeljeno)).toBe(false);
  });

  it("skupine razdvojene kriterijima 1–4 ne miješaju se", () => {
    const bolji = {
      ime: "Z",
      total: 200,
      allResults: [r("t1", "2026-09-01", 200, 1)],
    };
    const p = poredajAkademiju([a, bolji, b, c]);
    expect(p[0]!.entry.ime).toBe("Z");
    expect(p.map((x) => x.mjesto)).toEqual([1, 2, 2, 2]);
  });
});
