import { describe, expect, it } from "vitest";
import { jeKomentar, sviIzvori } from "./izvori";

/**
 * Sporedni tekst ima dvije nijanse: text-muted i text-subtle.
 *
 * Prije ih je bilo pet (text-ink/60, /65, /70, /75, /80). Razlika između
 * susjednih se ne primjećuje, a pri svakoj novoj komponenti trebalo je
 * nagađati koja je "prava" — pa ih je i nastajalo sve više. Tokeni stoje u
 * lib/design-tokens.ts; ovaj test pazi da se prozirne inačice ne vrate.
 *
 * Puni text-ink (bez prozirnosti) je i dalje u redu — to je primarni tekst.
 */

const PROZIRNI_INK = /text-ink\/\d+/g;

function nalazi(): string[] {
  const nadeno: string[] = [];
  for (const { oznaka, sadrzaj } of sviIzvori()) {
    sadrzaj.split("\n").forEach((red, i) => {
      if (jeKomentar(red)) return;
      for (const m of red.matchAll(PROZIRNI_INK)) {
        nadeno.push(`${oznaka}:${i + 1} — ${m[0]}`);
      }
    });
  }
  return nadeno;
}

describe("nijanse sporednog teksta", () => {
  it("nijedan izvor ne koristi text-ink s prozirnošću", () => {
    const poruka = nalazi().join("\n");
    expect(
      poruka,
      `Sporedni tekst ima dvije nijanse: text-muted i text-subtle.\n${poruka}`,
    ).toBe("");
  });
});
