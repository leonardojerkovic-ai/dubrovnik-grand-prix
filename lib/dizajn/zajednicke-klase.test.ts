import { describe, expect, it } from "vitest";
import { jeKomentar, sviIzvori } from "./izvori";

/**
 * Naslov stranice i gumbi imaju zajedničke klase u globals.css
 * (.page-title, .btn-primary, .btn-secondary, .btn-sm, .btn-lg).
 *
 * Prije ih nije bilo, pa se isti gumb na dvije stranice razlikovao u
 * paddingu, a naslov u razmaku ispod sebe: šest različitih paddinga i pet
 * razmaka, bez pravila koje bi reklo koji je pravi. Ovaj test pazi da se
 * ručno sastavljene inačice ne vrate.
 */

/** Gumb sastavljen rukom: puna navy ploha sa svijetlim tekstom. */
const RUCNI_PRIMARNI = /bg-navy[^"'`]*text-(?:paper|white)|text-(?:paper|white)[^"'`]*bg-navy/;
/** Gumb sastavljen rukom: obrub i navy tekst s hover plohom. */
const RUCNI_SEKUNDARNI = /border-navy\/20[^"'`]*hover:bg-navy\/5/;

function rucniGumbi(): string[] {
  const nadeno: string[] = [];
  for (const { oznaka, sadrzaj } of sviIzvori()) {
    if (!oznaka.endsWith(".tsx")) continue;
    sadrzaj.split("\n").forEach((red, i) => {
      if (jeKomentar(red)) return;
      // Zanima nas samo niz klasa, i to onaj koji opisuje gumb: mora imati
      // zaobljenje. Kartice i obavijesti s navy plohom nisu gumbi.
      const m = red.match(/className=\{?[`"]([^"`]*)[`"]/);
      const klase = m?.[1];
      if (klase === undefined || !/\brounded(-md)?\b/.test(klase)) return;
      if (RUCNI_PRIMARNI.test(klase) || RUCNI_SEKUNDARNI.test(klase)) {
        nadeno.push(`${oznaka}:${i + 1} — ${klase.trim()}`);
      }
    });
  }
  return nadeno;
}

function rucniNaslovi(): string[] {
  const nadeno: string[] = [];
  for (const { oznaka, sadrzaj } of sviIzvori()) {
    if (!oznaka.endsWith(".tsx")) continue;
    sadrzaj.split("\n").forEach((red, i) => {
      if (jeKomentar(red)) return;
      if (!red.includes("<h1")) return;
      // font-hero je naslov na naslovnici, jedini namjerno poseban.
      if (red.includes("page-title") || red.includes("font-hero")) return;
      if (red.includes("className")) {
        nadeno.push(`${oznaka}:${i + 1} — ${red.trim()}`);
      }
    });
  }
  return nadeno;
}

describe("zajedničke klase", () => {
  it("gumbi se ne sastavljaju rukom", () => {
    const poruka = rucniGumbi().join("\n");
    expect(
      poruka,
      `Gumb je .btn-primary ili .btn-secondary, uz .btn-sm ili .btn-lg za veličinu.\n${poruka}`,
    ).toBe("");
  });

  it("naslov stranice koristi .page-title", () => {
    const poruka = rucniNaslovi().join("\n");
    expect(poruka, `Naslov stranice je .page-title.\n${poruka}`).toBe("");
  });
});
