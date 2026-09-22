import { describe, expect, it } from "vitest";

/**
 * Tekst napomene ovisi o tome je li rok istekao. Logika je jednostavna, ali
 * pogrešan ishod znači da stranica tvrdi suprotno od čl. 29 — pa je vrijedna
 * testa koji ne ovisi o iscrtavanju.
 */
function isExpired(deadline: Date | null, now: Date): boolean {
  return deadline ? now > deadline : false;
}

const rok = new Date("2026-09-19T00:00:00Z");

describe("rok za prigovor (čl. 29)", () => {
  it("unutar roka nije istekao", () => {
    expect(isExpired(rok, new Date("2026-09-15T12:00:00Z"))).toBe(false);
  });

  it("poslije roka je istekao", () => {
    expect(isExpired(rok, new Date("2026-09-22T12:00:00Z"))).toBe(true);
  });

  it("bez poznatog roka se ne smatra isteklim", () => {
    expect(isExpired(null, new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });
});
