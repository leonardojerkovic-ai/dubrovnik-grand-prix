import { describe, expect, it } from "vitest";
import { sadrzajIstekao } from "./audit-rokovi";

describe("sadrzajIstekao", () => {
  const sada = new Date("2026-10-07T12:00:00Z");

  it("zapis od prije pet mjeseci još ima sadržaj", () => {
    expect(sadrzajIstekao(new Date("2026-05-07T12:00:00Z"), sada)).toBe(false);
  });

  it("zapis od prije sedam mjeseci više nema sadržaj", () => {
    expect(sadrzajIstekao(new Date("2026-03-07T12:00:00Z"), sada)).toBe(true);
  });

  // keep-alive briše s interval '6 months', dakle kalendarski mjeseci, ne
  // 180 dana. Granica u sučelju mora pasti na isti dan.
  it("granica su kalendarski mjeseci, kao u SQL-u", () => {
    expect(sadrzajIstekao(new Date("2026-04-07T12:00:01Z"), sada)).toBe(false);
    expect(sadrzajIstekao(new Date("2026-04-07T11:59:59Z"), sada)).toBe(true);
  });
});
