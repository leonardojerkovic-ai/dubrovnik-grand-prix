/**
 * Jednokratno čišćenje: rejting 0 u `player_ratings_current` postaje prazno.
 *
 * Nula u bazi znači „nema rejtinga", ne rejting nula — tako je zapisuju FIDE
 * liste i Swiss-Manager, i tako je kroz uvoz dospjela ovamo. Izračuni to
 * podnose (`bezNule` u lib/ratings/vrijednost.ts, a F_R u
 * lib/scoring/gp/formulas.ts gleda i `r === 0`), ali prikaz i izvoz ne: nula
 * uz ime izgleda kao da je netko izgubio podatak, a u SQL-u je broj.
 *
 * Zamjena je zato SEMANTIČKI NEUTRALNA — ni jedan izračun ne mijenja ishod:
 *   F_R (čl. 24)        0 i prazno oba daju 1400
 *   U1800 (čl. 22)      0 i 1400 su oba pod 1800
 *   nagrade (čl. 26)    isto, po istom pravilu
 * Mijenja se samo ono što čovjek vidi.
 *
 * ŠTO SKRIPTA NE DIRA: `player_rating_snapshots`. Tamo je `ratingValue` tip
 * `Int`, pa nula ne može postati prazno — mogla bi se samo izbrisati, a
 * brisanje mijenja povijest. `na-datum.ts` traži zadnji snimak do dana
 * turnira, pa bi izbrisana nula otkrila stariji snimak sa stvarnom
 * vrijednošću i time promijenila F_R na turnirima koji su već objavljeni.
 * Sezone 2025. i 2026. su zaključane i ostaju kakve su.
 *
 * Zadano je probni prolaz. Upisuje se samo s --izvrsi.
 *
 *   npm run rejtinzi:nule              — samo prebroji
 *   npm run rejtinzi:nule -- --izvrsi  — upiši
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { TEMPO_POLJA, type TempoPolje } from "../lib/ratings/vrijednost";

const prisma = new PrismaClient();

const POZNATE_ZASTAVICE = ["--izvrsi"];

function provjeriZastavice(args: string[]): void {
  const nepoznate = args.filter((a) => !POZNATE_ZASTAVICE.includes(a));
  if (nepoznate.length > 0) {
    throw new Error(
      [
        `Nepoznata zastavica: ${nepoznate.join(", ")}`,
        "",
        "Dopušteno:",
        "  --izvrsi    upiši promjene (bez nje je samo prebrojavanje)",
        "",
        "Ništa nije upisano.",
      ].join("\n")
    );
  }
}

/**
 * Po tempu: prebrojavanje i čišćenje, oboje s izričitim imenom stupca.
 *
 * Stupac se namjerno NE sastavlja kao `{ [polje]: 0 }`. Prismin `where` je
 * tip s poznatim poljima, a izračunati ključ mu daje indeksni potpis — pa
 * provjera tipova više ne vidi je li ime stupca ispravno, što je upravo ono
 * zbog čega su ovdje tipovi i korisni.
 */
const PO_TEMPU: Record<
  TempoPolje,
  { prebroji: () => Promise<number>; ocisti: () => Prisma.PrismaPromise<{ count: number }> }
> = {
  standard: {
    prebroji: () => prisma.playerRatingCurrent.count({ where: { standard: 0 } }),
    ocisti: () =>
      prisma.playerRatingCurrent.updateMany({
        where: { standard: 0 },
        data: { standard: null },
      }),
  },
  rapid: {
    prebroji: () => prisma.playerRatingCurrent.count({ where: { rapid: 0 } }),
    ocisti: () =>
      prisma.playerRatingCurrent.updateMany({
        where: { rapid: 0 },
        data: { rapid: null },
      }),
  },
  blitz: {
    prebroji: () => prisma.playerRatingCurrent.count({ where: { blitz: 0 } }),
    ocisti: () =>
      prisma.playerRatingCurrent.updateMany({
        where: { blitz: 0 },
        data: { blitz: null },
      }),
  },
};

async function prebroji(polje: TempoPolje): Promise<number> {
  return PO_TEMPU[polje].prebroji();
}

async function main() {
  const args = process.argv.slice(2);
  provjeriZastavice(args);
  const izvrsi = args.includes("--izvrsi");

  console.log(
    izvrsi
      ? "Čišćenje nula u player_ratings_current — UPIS"
      : "Čišćenje nula u player_ratings_current — samo prebrojavanje (dodaj --izvrsi za upis)"
  );

  const prije = new Map<TempoPolje, number>();
  for (const polje of TEMPO_POLJA) {
    prije.set(polje, await prebroji(polje));
  }

  const ukupno = [...prije.values()].reduce((a, b) => a + b, 0);
  for (const polje of TEMPO_POLJA) {
    console.log(`  ${polje.padEnd(9)} nula: ${prije.get(polje)}`);
  }

  if (ukupno === 0) {
    console.log("\nNema nula. Ništa za promjenu.");
    return;
  }

  if (!izvrsi) {
    console.log(
      `\nZa upis: npm run rejtinzi:nule -- --izvrsi  (${ukupno} vrijednosti)`
    );
    return;
  }

  // Jedna transakcija: ili sva tri tempa ili nijedan. Djelomično očišćena
  // tablica je stanje koje se ne vidi, a drugo pokretanje bi ga sakrilo.
  const rezultati = await prisma.$transaction(
    TEMPO_POLJA.map((polje) => PO_TEMPU[polje].ocisti())
  );

  TEMPO_POLJA.forEach((polje, i) => {
    console.log(`  ${polje.padEnd(9)} očišćeno: ${rezultati[i]?.count ?? 0}`);
  });

  // Ponovno prebrojavanje, jer poruka „očišćeno" govori što je upit tvrdio,
  // a ne što u bazi stoji.
  let ostalo = 0;
  for (const polje of TEMPO_POLJA) {
    ostalo += await prebroji(polje);
  }

  if (ostalo > 0) {
    console.error(`\nNakon upisa je ostalo ${ostalo} nula. Pogledaj bazu.`);
    process.exitCode = 1;
    return;
  }

  console.log("\nGotovo. Nula više nema. Snimci (povijest) su nedirnuti.");
}

main()
  .catch((err) => {
    console.error("Čišćenje nije uspjelo:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
