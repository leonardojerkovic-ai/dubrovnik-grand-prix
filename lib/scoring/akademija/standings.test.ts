import { describe, expect, it } from "vitest";
import {
  compareStandings,
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
