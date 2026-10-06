import { describe, expect, it } from "vitest";
import { odluciPravo } from "./pravo";

const dan = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const osnova = {
  tournamentId: "t2",
  tournamentDate: dan("2026-11-01"),
  playerId: "p1",
  birthYear: 2014,
  seasonStartYear: 2026,
};

describe("odluciPravo — čl. 3", () => {
  it("prvi nastup u sezoni: pravo se utvrđuje sada", () => {
    const o = odluciPravo({ ...osnova, rapidRatingAtThisTournament: 1580 });
    expect(o.status).toBe("new");
    expect(o.isEligible).toBe(true);
    expect(o.zaUpis?.rapidRatingAtFirst).toBe(1580);
  });

  it("pravo zaključano na ranijem turniru se ne dira, ni kad je rejting narastao", () => {
    const o = odluciPravo({
      ...osnova,
      postojeci: {
        isEligible: true,
        firstTournamentId: "t1",
        firstTournamentDate: dan("2026-09-01"),
      },
      rapidRatingAtThisTournament: 1700,
    });
    expect(o.status).toBe("locked");
    expect(o.isEligible).toBe(true);
    expect(o.zaUpis).toBeNull();
  });

  it("ponovno spremanje ISTOG turnira preračunava — ispravak rejtinga ima učinak", () => {
    const o = odluciPravo({
      ...osnova,
      postojeci: {
        isEligible: true,
        firstTournamentId: "t2",
        firstTournamentDate: dan("2026-11-01"),
      },
      rapidRatingAtThisTournament: 1650,
    });
    expect(o.status).toBe("refreshed");
    expect(o.isEligible).toBe(false);
    expect(o.zaUpis).not.toBeNull();
  });

  it("naknadno unesen RANIJI turnir preračunava i javlja se kao recomputed", () => {
    const o = odluciPravo({
      ...osnova,
      tournamentId: "t0",
      tournamentDate: dan("2026-08-01"),
      postojeci: {
        isEligible: true,
        firstTournamentId: "t2",
        firstTournamentDate: dan("2026-11-01"),
      },
      rapidRatingAtThisTournament: 1620,
    });
    expect(o.status).toBe("recomputed");
    expect(o.isEligible).toBe(false);
    expect(o.zaUpis?.firstTournamentId).toBe("t0");
  });

  it("godište izvan Akademije nema pravo ni bez rejtinga", () => {
    const o = odluciPravo({
      ...osnova,
      birthYear: 2010,
      rapidRatingAtThisTournament: null,
    });
    expect(o.isEligible).toBe(false);
  });
});

describe("odluciPravo — zapis bez turnira (turnir obrisan)", () => {
  it("isti datum znači isti turnir, pa je preračunavanje, ne 'raniji turnir'", () => {
    const o = odluciPravo({
      ...osnova,
      postojeci: {
        isEligible: true,
        firstTournamentId: null,
        firstTournamentDate: dan("2026-11-01"),
      },
      rapidRatingAtThisTournament: 1650,
    });
    expect(o.status).toBe("refreshed");
  });

  it("stroži datum i dalje zaključava", () => {
    const o = odluciPravo({
      ...osnova,
      postojeci: {
        isEligible: true,
        firstTournamentId: null,
        firstTournamentDate: dan("2026-09-01"),
      },
      rapidRatingAtThisTournament: 1650,
    });
    expect(o.status).toBe("locked");
    expect(o.isEligible).toBe(true);
  });
});

describe("odluciPravo — dva turnira istog dana", () => {
  it("drugi turnir istog datuma je preračunavanje, ne „raniji turnir“", () => {
    const o = odluciPravo({
      ...osnova,
      tournamentId: "t2b",
      postojeci: {
        isEligible: true,
        firstTournamentId: "t2",
        firstTournamentDate: dan("2026-11-01"),
      },
      rapidRatingAtThisTournament: 1650,
    });
    expect(o.status).toBe("refreshed");
    expect(o.isEligible).toBe(false);
  });
});
