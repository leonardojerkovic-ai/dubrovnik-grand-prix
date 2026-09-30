/**
 * Provjerava jesu li rejtinzi u bazi s tekuće FIDE liste.
 *
 * Postoji zato što uvoz NE MOŽE raditi na GitHubu: FIDE odbija promet iz
 * podatkovnih centara i veza na ratings.fide.com istekne prije nego se
 * uspostavi. S kućnog priključka isti uvoz prolazi.
 *
 * Zato zadatak na GitHubu više ne pokušava preuzimati listu, nego samo
 * gleda što piše u bazi i pada ako je zastarjela. Neuspjeh je podsjetnik
 * da se `npm run fide:import` pokrene lokalno, i to je jedina poruka koja
 * je ovdje uopće istinita.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pocetakTekucegMjeseca(): Date {
  const sada = new Date();
  return new Date(Date.UTC(sada.getUTCFullYear(), sada.getUTCMonth(), 1));
}

function hrvatskiDatum(datum: Date): string {
  return datum.toISOString().slice(0, 10);
}

async function main() {
  const ocekivano = pocetakTekucegMjeseca();

  const najnoviji = await prisma.playerRatingSnapshot.aggregate({
    _max: { snapshotDate: true },
  });
  const zadnji = najnoviji._max.snapshotDate;

  if (!zadnji) {
    console.error("U bazi nema nijednog rejtinga. Pokreni uvoz lokalno.");
    process.exitCode = 1;
    return;
  }

  const broj = await prisma.playerRatingSnapshot.count({
    where: { snapshotDate: zadnji },
  });

  console.log(`Najnovija lista u bazi: ${hrvatskiDatum(zadnji)} (${broj} vrijednosti)`);
  console.log(`Očekivana lista:        ${hrvatskiDatum(ocekivano)}`);

  if (zadnji.getTime() >= ocekivano.getTime()) {
    console.log("\nRejtinzi su tekući.");
    return;
  }

  console.error(
    [
      "",
      "Rejtinzi su zastarjeli.",
      "",
      "FIDE ne dopušta preuzimanje s GitHubovih poslužitelja, pa se uvoz",
      "pokreće na vlastitom računalu:",
      "",
      "    npm run fide:import -- --dry-run   (provjera)",
      "    npm run fide:import                (upis)",
      "",
      "Dok se to ne napravi, izračuni koji ovise o rejtingu — F_R (čl. 24)",
      "i rejtinška kategorija (čl. 22) — koriste prošlomjesečne vrijednosti.",
    ].join("\n")
  );
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Provjera nije uspjela:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
