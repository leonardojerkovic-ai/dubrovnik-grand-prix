import { describe, expect, it } from "vitest";
import { jeAktivna, jeAktivnaLjestvica } from "./nav-aktivno";

describe("jeAktivna", () => {
  it("prepoznaje točno istu stranicu", () => {
    expect(jeAktivna("/kalendar", "/kalendar")).toBe(true);
  });

  it("prepoznaje podstranicu", () => {
    expect(jeAktivna("/igraci/marko-maric", "/igraci")).toBe(true);
    expect(jeAktivna("/ljestvice/u20", "/ljestvice")).toBe(true);
  });

  it("ne pali se na stranici koja samo počinje istim slovima", () => {
    expect(jeAktivna("/igracima-u-pomoc", "/igraci")).toBe(false);
    expect(jeAktivna("/ljestvice/u200", "/ljestvice/u20")).toBe(false);
  });

  it("naslovnica je aktivna samo na naslovnici", () => {
    expect(jeAktivna("/", "/")).toBe(true);
    expect(jeAktivna("/kalendar", "/")).toBe(false);
  });

  it("ne smeta zavrsna kosa crta ni upit", () => {
    expect(jeAktivna("/kalendar/", "/kalendar")).toBe(true);
    expect(jeAktivna("/kalendar?sezona=2026", "/kalendar")).toBe(true);
  });

  it("bez putanje nema aktivne stavke", () => {
    expect(jeAktivna(null, "/kalendar")).toBe(false);
    expect(jeAktivna(undefined, "/kalendar")).toBe(false);
  });

  it("razlikuje dvije ljestvice", () => {
    expect(jeAktivna("/ljestvice/u20", "/ljestvice/u16")).toBe(false);
  });
});

describe("jeAktivnaLjestvica", () => {
  it("tekuca sezona radi kao i prije", () => {
    expect(jeAktivnaLjestvica("/ljestvice/u20", "/ljestvice/u20")).toBe(true);
    expect(jeAktivnaLjestvica("/ljestvice/u20", "/ljestvice/u16")).toBe(false);
  });

  it("arhivska putanja uparuje se po kategoriji", () => {
    expect(jeAktivnaLjestvica("/ljestvice/2025-2026/u20", "/ljestvice/u20")).toBe(true);
    expect(jeAktivnaLjestvica("/ljestvice/2025-2026/u20", "/ljestvice/u16")).toBe(false);
    expect(jeAktivnaLjestvica("/ljestvice/2024-2025/akademija", "/ljestvice/akademija")).toBe(
      true,
    );
  });

  it("ne uparuje dvije arhivske kategorije", () => {
    expect(jeAktivnaLjestvica("/ljestvice/2025-2026/zene", "/ljestvice/u20")).toBe(false);
  });

  it("ne pali se izvan /ljestvice", () => {
    expect(jeAktivnaLjestvica("/kalendar", "/ljestvice/u20")).toBe(false);
    expect(jeAktivnaLjestvica("/igraci/2025-2026/u20", "/ljestvice/u20")).toBe(false);
  });

  it("bez putanje nema aktivne stavke", () => {
    expect(jeAktivnaLjestvica(null, "/ljestvice/u20")).toBe(false);
  });
});

describe("gumb Ljestvice", () => {
  // Gumb se oznacava prefiksom, pa pokriva i tekucu i arhivsku putanju.
  it("aktivan je na svakoj ljestvici", () => {
    expect(jeAktivna("/ljestvice/u20", "/ljestvice")).toBe(true);
    expect(jeAktivna("/ljestvice/2025-2026/u20", "/ljestvice")).toBe(true);
  });

  it("nije aktivan izvan ljestvica", () => {
    expect(jeAktivna("/kalendar", "/ljestvice")).toBe(false);
  });
});
