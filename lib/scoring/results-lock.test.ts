import { describe, expect, it } from "vitest";
import {
  getLockStatus,
  objectionDeadline,
  unlockExpiry,
  OBJECTION_PERIOD_DAYS,
} from "./results-lock";

const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

const published = new Date("2027-02-14T10:00:00Z");

describe("rok za prigovor (čl. 29)", () => {
  it("traje 7 dana od objave", () => {
    expect(objectionDeadline(published).toISOString()).toBe(
      "2027-02-21T10:00:00.000Z"
    );
    expect(OBJECTION_PERIOD_DAYS).toBe(7);
  });
});

describe("getLockStatus", () => {
  it("neobjavljeni rezultati slobodno se uređuju", () => {
    const s = getLockStatus(
      { resultsPublishedAt: null, unlockedUntil: null },
      published
    );
    expect(s.state).toBe("NEOBJAVLJENO");
    expect(s.editable).toBe(true);
    expect(s.objectionDeadline).toBeNull();
  });

  it("tijekom roka su rezultati izmjenjivi", () => {
    const s = getLockStatus(
      { resultsPublishedAt: published, unlockedUntil: null },
      new Date(published.getTime() + 3 * day)
    );
    expect(s.state).toBe("ROK_TECE");
    expect(s.editable).toBe(true);
    expect(s.daysRemaining).toBe(4);
  });

  it("zadnji dan roka još je otvoren", () => {
    const s = getLockStatus(
      { resultsPublishedAt: published, unlockedUntil: null },
      new Date(published.getTime() + 7 * day - hour)
    );
    expect(s.state).toBe("ROK_TECE");
    expect(s.daysRemaining).toBe(1);
  });

  it("točno na isteku roka rezultat je konačan", () => {
    const s = getLockStatus(
      { resultsPublishedAt: published, unlockedUntil: null },
      new Date(published.getTime() + 7 * day)
    );
    expect(s.state).toBe("ZAKLJUCANO");
    expect(s.editable).toBe(false);
  });

  it("nakon isteka roka rezultat je zaključan", () => {
    const s = getLockStatus(
      { resultsPublishedAt: published, unlockedUntil: null },
      new Date(published.getTime() + 30 * day)
    );
    expect(s.state).toBe("ZAKLJUCANO");
    expect(s.editable).toBe(false);
    expect(s.daysRemaining).toBe(0);
  });
});

describe("privremeno otključavanje", () => {
  const afterDeadline = new Date(published.getTime() + 30 * day);

  it("otvara uređivanje unutar prozora", () => {
    const s = getLockStatus(
      {
        resultsPublishedAt: published,
        unlockedUntil: unlockExpiry(afterDeadline),
      },
      new Date(afterDeadline.getTime() + hour)
    );
    expect(s.state).toBe("OTKLJUCANO");
    expect(s.editable).toBe(true);
  });

  it("nakon isteka prozora rezultat se opet zaključava", () => {
    const s = getLockStatus(
      {
        resultsPublishedAt: published,
        unlockedUntil: unlockExpiry(afterDeadline),
      },
      new Date(afterDeadline.getTime() + 3 * hour)
    );
    expect(s.state).toBe("ZAKLJUCANO");
    expect(s.editable).toBe(false);
  });

  it("staro otključavanje ne oživljava zaključan rezultat", () => {
    const s = getLockStatus(
      {
        resultsPublishedAt: published,
        unlockedUntil: new Date(published.getTime() + 8 * day),
      },
      new Date(published.getTime() + 60 * day)
    );
    expect(s.state).toBe("ZAKLJUCANO");
  });

  it("otključavanje tijekom roka ništa ne mijenja", () => {
    const s = getLockStatus(
      {
        resultsPublishedAt: published,
        unlockedUntil: new Date(published.getTime() + 100 * day),
      },
      new Date(published.getTime() + day)
    );
    expect(s.state).toBe("ROK_TECE");
  });
});
