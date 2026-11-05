import { describe, expect, it } from "vitest";
import { porukaOdbijanja, smijePisati } from "./prepisivanje";

describe("smijePisati", () => {
  it("službena lista uvijek smije pisati", () => {
    // I preko Lichessovih vrijednosti — to je ispravan smjer ispravka.
    expect(smijePisati({ izvor: "fide", postojiSnimak: true, prepisi: false })).toBe(true);
    expect(smijePisati({ izvor: "fide", postojiSnimak: false, prepisi: false })).toBe(true);
  });

  it("Lichess smije kad za taj datum snimka još nema", () => {
    // Redovni mjesečni uvoz: prvi je, pa nema što pregaziti.
    expect(smijePisati({ izvor: "lichess", postojiSnimak: false, prepisi: false })).toBe(true);
  });

  it("Lichess ne smije preko postojećeg snimka", () => {
    // Slučaj od 1.11.2026.: službeni uvoz u 10:18, pa Lichess u 12:31 i
    // dvadeset i jedan igrač natrag na listopadski rejting.
    expect(smijePisati({ izvor: "lichess", postojiSnimak: true, prepisi: false })).toBe(false);
  });

  it("--prepisi otključava i taj slučaj", () => {
    expect(smijePisati({ izvor: "lichess", postojiSnimak: true, prepisi: true })).toBe(true);
  });
});

describe("porukaOdbijanja", () => {
  it("kaže datum, razlog i što učiniti", () => {
    const poruka = porukaOdbijanja("2026-12-01");
    expect(poruka).toContain("2026-12-01");
    expect(poruka).toContain("--izvor=fide");
    expect(poruka).toContain("--prepisi");
    expect(poruka).toContain("Ništa nije upisano.");
  });
});
