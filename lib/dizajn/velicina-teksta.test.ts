import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Najmanja veličina teksta na stranici je 12 px (text-xs).
 *
 * Ispod toga se uz uppercase, razmaknuta slova i text-ink/60 na mobitelu
 * teško čita; 18 takvih mjesta je zato uklonjeno. Pravilo je prvo stajalo
 * kao ESLint selektor nad `text-[Npx]`, ali regex ne zna usporediti brojeve:
 * blokirao je i text-[40px], a propuštao text-[0.625rem], što je ista ona
 * veličina od 10 px napisana drukčije.
 *
 * Ovaj test zato pročita svaki `text-[…]` iz izvora, pretvori vrijednost u
 * piksele i padne samo na onima ispod 12. Velike proizvoljne veličine
 * ostaju dopuštene.
 *
 * Što ni ovo ne hvata: `fontSize` atribut u SVG-u (graf rejtinga), jer to
 * nije Tailwind klasa.
 */

const KORIJENI = ["app", "components"];
const NAJMANJA_PX = 12;

/** Svi .ts/.tsx izvori pod zadanim direktorijem. */
function izvori(dir: string): string[] {
  const nadeno: string[] = [];
  for (const unos of readdirSync(dir)) {
    const put = join(dir, unos);
    if (statSync(put).isDirectory()) {
      nadeno.push(...izvori(put));
    } else if (put.endsWith(".ts") || put.endsWith(".tsx")) {
      nadeno.push(put);
    }
  }
  return nadeno;
}

/**
 * Proizvoljna veličina teksta u Tailwind klasi: text-[12px], text-[0.75rem],
 * text-[length:0.9em]. Prefiks `length:` je dopušten oblik u Tailwindu.
 */
const UZORAK = /text-\[(?:length:)?(\d+(?:\.\d+)?)(px|rem|em)\]/g;

/** U pikselima; rem i em se računaju na zadanih 16 px. */
function uPiksele(vrijednost: number, jedinica: string): number {
  return jedinica === "px" ? vrijednost : vrijednost * 16;
}

type Nalaz = { mjesto: string; zapis: string; px: number };

function premaleVelicine(): Nalaz[] {
  const nalazi: Nalaz[] = [];
  const korijen = join(__dirname, "..", "..");
  for (const grana of KORIJENI) {
    for (const datoteka of izvori(join(korijen, grana))) {
      const redovi = readFileSync(datoteka, "utf-8").split("\n");
      redovi.forEach((red, i) => {
        for (const m of red.matchAll(UZORAK)) {
          const broj = Number(m[1]);
          const jedinica = m[2];
          if (!Number.isFinite(broj) || jedinica === undefined) continue;
          const px = uPiksele(broj, jedinica);
          if (px < NAJMANJA_PX) {
            nalazi.push({
              mjesto: `${datoteka.slice(korijen.length + 1)}:${i + 1}`,
              zapis: m[0],
              px,
            });
          }
        }
      });
    }
  }
  return nalazi;
}

describe("najmanja veličina teksta", () => {
  it("nijedan izvor ne postavlja tekst manji od 12 px", () => {
    const nalazi = premaleVelicine();
    const poruka = nalazi
      .map((n) => `${n.mjesto} — ${n.zapis} (${n.px} px)`)
      .join("\n");
    expect(poruka, `Najmanja veličina teksta je ${NAJMANJA_PX} px (text-xs):\n${poruka}`).toBe("");
  });

  it("pretvorba jedinica je ispravna", () => {
    expect(uPiksele(11, "px")).toBe(11);
    expect(uPiksele(0.625, "rem")).toBe(10);
    expect(uPiksele(0.75, "rem")).toBe(12);
    expect(uPiksele(0.9, "em")).toBeCloseTo(14.4);
  });

  it("uzorak hvata sve tri jedinice i length: prefiks", () => {
    const nadeno = [
      ...'text-[10px] text-[0.625rem] text-[length:0.6em] text-[40px]'.matchAll(UZORAK),
    ].map((m) => m[0]);
    expect(nadeno).toEqual([
      "text-[10px]",
      "text-[0.625rem]",
      "text-[length:0.6em]",
      "text-[40px]",
    ]);
  });
});
