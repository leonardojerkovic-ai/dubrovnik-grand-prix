import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Čitanje izvora za provjere dizajn sustava.
 *
 * Neka pravila dizajn sustava ne mogu se izraziti ni tipovima ni linterom
 * (najmanja veličina teksta, dopuštene nijanse sivog), pa ih čuvaju testovi
 * koji čitaju izvorni tekst. Ovo je njihov zajednički dio, da se obilazak
 * stabla i preskakanje komentara ne pišu dvaput.
 */

export const KORIJENI = ["app", "components"];
const NASTAVCI = [".ts", ".tsx", ".css"];

/** Korijen repozitorija, računat od ovog direktorija (lib/dizajn). */
export function korijenRepozitorija(): string {
  return join(__dirname, "..", "..");
}

/** Svi izvori pod zadanim direktorijem. */
export function izvori(dir: string): string[] {
  const nadeno: string[] = [];
  for (const unos of readdirSync(dir)) {
    const put = join(dir, unos);
    if (statSync(put).isDirectory()) {
      nadeno.push(...izvori(put));
    } else if (NASTAVCI.some((n) => put.endsWith(n))) {
      nadeno.push(put);
    }
  }
  return nadeno;
}

/** Svaki izvor u app/ i components/, kao {oznaka, sadrzaj}. */
export function sviIzvori(): { oznaka: string; sadrzaj: string }[] {
  const korijen = korijenRepozitorija();
  const sve: { oznaka: string; sadrzaj: string }[] = [];
  for (const grana of KORIJENI) {
    for (const datoteka of izvori(join(korijen, grana))) {
      sve.push({
        oznaka: datoteka.slice(korijen.length + 1),
        sadrzaj: readFileSync(datoteka, "utf-8"),
      });
    }
  }
  return sve;
}

/**
 * Komentari se u ovim provjerama preskaču: testovi čitaju sirov tekst, pa bi
 * inače pali na komentaru koji objašnjava zašto je neka klasa uklonjena — a
 * upravo takve komentare ovaj projekt rado piše. Prepoznaju se po početku
 * retka, što pokriva sve komentare u projektu.
 */
const POCETAK_KOMENTARA = ["//", "/*", "*/", "*", "{/*"];

export function jeKomentar(red: string): boolean {
  const t = red.trimStart();
  return POCETAK_KOMENTARA.some((p) => t.startsWith(p));
}
