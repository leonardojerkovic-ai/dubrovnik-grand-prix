import { describe, expect, it } from "vitest";
import { jeKomentar, sviIzvori } from "./izvori";

/**
 * Stranica ima dvije širine sadržaja.
 *
 *   max-w-6xl   liste i tablice (ljestvice, kalendar, igrači, turnir, admin)
 *   max-w-3xl   tekst i obrasci (o nama, FAQ, najave, privatnost)
 *
 * Prije ih je bilo devet imenovanih (od xs do 6xl). Posljedica se vidjela
 * golim okom: zaglavlje je bilo 6xl, a ljestvica 4xl, pa je rub sadržaja
 * skakao između rubrika iste stranice.
 *
 * Iznimke su stranice koje su namjerno uska kartica usred zaslona: prijava,
 * registracija i zaboravljena lozinka (max-w-sm) te 404 i stranica greške
 * (max-w-md). One nisu "sadržaj stranice" nego jedan okvir.
 *
 * Pravilo se tiče samo spremnika stranice — onoga s mx-auto. Unutarnja
 * ograničenja (max-w-prose za odlomak, max-w-xl za obrazac, max-w-3xl za
 * graf rejtinga) su nešto drugo i slobodna su.
 */

const SPREMNIK = /mx-auto[^"'`]*?\bmax-w-([a-z0-9]+)/g;
const DOPUSTENE = new Set(["6xl", "3xl", "sm", "md"]);

function odstupanja(): string[] {
  const nadeno: string[] = [];
  for (const { oznaka, sadrzaj } of sviIzvori()) {
    sadrzaj.split("\n").forEach((red, i) => {
      if (jeKomentar(red)) return;
      for (const m of red.matchAll(SPREMNIK)) {
        const sirina = m[1];
        if (sirina !== undefined && !DOPUSTENE.has(sirina)) {
          nadeno.push(`${oznaka}:${i + 1} — max-w-${sirina}`);
        }
      }
    });
  }
  return nadeno;
}

describe("širine sadržaja", () => {
  it("spremnik stranice koristi samo dopuštene širine", () => {
    const poruka = odstupanja().join("\n");
    expect(
      poruka,
      `Spremnik stranice je max-w-6xl (liste i tablice) ili max-w-3xl (tekst);\nuske kartice smiju max-w-sm i max-w-md.\n${poruka}`,
    ).toBe("");
  });
});
