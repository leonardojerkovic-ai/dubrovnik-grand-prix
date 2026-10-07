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
 * ostaju dopuštene. Uz .tsx i .ts čita i CSS u app/, gdje se veličina može
 * postaviti kroz @apply ili ravno kao font-size.
 *
 * Što ni ovo ne hvata: `fontSize` atribut u SVG-u (graf rejtinga), jer to
 * nije ni Tailwind klasa ni CSS deklaracija.
 */

const KORIJENI = ["app", "components"];
const NASTAVCI = [".ts", ".tsx", ".css"];
const NAJMANJA_PX = 12;

/** Svi izvori pod zadanim direktorijem. */
function izvori(dir: string): string[] {
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

/**
 * Proizvoljna veličina teksta u Tailwind klasi: text-[12px], text-[0.75rem],
 * text-[.625rem], text-[length:0.9em]. Vodeća nula nije obvezna, pa je u
 * uzorku \d*\.?\d+ a ne \d+(\.\d+)? — prva inačica je .625rem propuštala.
 */
const KLASA = /text-\[(?:length:)?(\d*\.?\d+)(px|rem|em)\]/g;

/** Isto, ali kao CSS deklaracija: font-size: 10px. */
const DEKLARACIJA = /font-size:\s*(\d*\.?\d+)(px|rem|em)/g;

/** U pikselima; rem i em se računaju na zadanih 16 px. */
function uPiksele(vrijednost: number, jedinica: string): number {
  return jedinica === "px" ? vrijednost : vrijednost * 16;
}

/**
 * Komentari se preskaču. Test čita sirov tekst, pa bi inače pao i na
 * komentaru koji objašnjava zašto je neki text-[10px] uklonjen — a upravo
 * takve komentare ovaj projekt rado piše. Prepoznaju se po početku retka,
 * što pokriva sve komentare u projektu; veličina teksta ionako nikad ne
 * stoji u istom redu s komentarom.
 */
const POCETAK_KOMENTARA = ["//", "/*", "*/", "*", "{/*"];

function jeKomentar(red: string): boolean {
  const t = red.trimStart();
  return POCETAK_KOMENTARA.some((p) => t.startsWith(p));
}

type Nalaz = { mjesto: string; zapis: string; px: number };

/** Premale veličine u jednom sadržaju; `oznaka` ide u ispis uz redak. */
function premaleUTekstu(sadrzaj: string, oznaka: string): Nalaz[] {
  const nalazi: Nalaz[] = [];
  sadrzaj.split("\n").forEach((red, i) => {
    if (jeKomentar(red)) return;
    for (const uzorak of [KLASA, DEKLARACIJA]) {
      for (const m of red.matchAll(uzorak)) {
        const broj = Number(m[1]);
        const jedinica = m[2];
        if (!Number.isFinite(broj) || jedinica === undefined) continue;
        const px = uPiksele(broj, jedinica);
        if (px < NAJMANJA_PX) {
          nalazi.push({ mjesto: `${oznaka}:${i + 1}`, zapis: m[0], px });
        }
      }
    }
  });
  return nalazi;
}

function premaleVelicine(): Nalaz[] {
  const korijen = join(__dirname, "..", "..");
  const nalazi: Nalaz[] = [];
  for (const grana of KORIJENI) {
    for (const datoteka of izvori(join(korijen, grana))) {
      nalazi.push(
        ...premaleUTekstu(
          readFileSync(datoteka, "utf-8"),
          datoteka.slice(korijen.length + 1),
        ),
      );
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

  it("hvata sve zapise premale veličine", () => {
    const zapisi = [
      'className="text-[10px]"',
      'className="sm:text-[11px]"',
      'className="text-[10px]/4"',
      'className="text-[0.625rem]"',
      'className="text-[.625rem]"',
      'className="text-[length:0.6em]"',
      "  font-size: 10px;",
      "  @apply text-[11px];",
    ];
    for (const zapis of zapisi) {
      expect(premaleUTekstu(zapis, "x"), zapis).toHaveLength(1);
    }
  });

  it("ne pada na dopuštenim veličinama", () => {
    for (const zapis of [
      'className="text-xs"',
      'className="text-[40px]"',
      'className="text-[0.75rem]"',
      'className="text-[3rem]"',
      "  font-size: 12px;",
    ]) {
      expect(premaleUTekstu(zapis, "x"), zapis).toHaveLength(0);
    }
  });

  it("ne pada na komentaru koji spominje premalu veličinu", () => {
    const komentari = [
      "// prije je ovdje stajao text-[10px]",
      "   * text-[11px] je uklonjen jer se nije čitao",
      "  {/* text-[10px] ne koristiti */}",
      "/* font-size: 10px je bio prestar */",
    ];
    for (const red of komentari) {
      expect(premaleUTekstu(red, "x"), red).toHaveLength(0);
    }
  });
});
