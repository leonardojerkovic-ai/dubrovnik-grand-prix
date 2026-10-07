import { describe, expect, it } from "vitest";
import { jeAktivna, jeAktivnaSkupina } from "./nav-aktivno";

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

describe("jeAktivnaSkupina", () => {
  const ljestvice = ["/ljestvice/opci-gp", "/ljestvice/u20", "/ljestvice/akademija"];

  it("aktivna je kad smo na bilo kojoj stranici iz skupine", () => {
    expect(jeAktivnaSkupina("/ljestvice/u20", ljestvice)).toBe(true);
  });

  it("nije aktivna izvan skupine", () => {
    expect(jeAktivnaSkupina("/kalendar", ljestvice)).toBe(false);
  });

  it("prazna skupina nikad nije aktivna", () => {
    expect(jeAktivnaSkupina("/ljestvice/u20", [])).toBe(false);
  });
});
