/**
 * Provjerava pokriva li Lichessov FIDE API sve naše igrače.
 *
 * Ništa ne mijenja u bazi. Služi kao odluka prije nego se uvoz rejtinga
 * preseli s preuzimanja FIDE lista na Lichess:
 *
 *   npx tsx scripts/provjeri-lichess.ts
 *
 * Lichess sam povlači službene FIDE liste, ali ga FIDE ne blokira kao
 * GitHubove poslužitelje, pa bi mjesečni uvoz opet mogao raditi sam.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Pristojan razmak između poziva; 122 igrača je oko pola minute. */
const RAZMAK_MS = 250;

interface LichessIgrac {
  id: number;
  name: string;
  federation?: string;
  year?: number;
  standard?: number;
  rapid?: number;
  blitz?: number;
  gender?: string;
}

async function dohvati(fideId: string): Promise<LichessIgrac | null> {
  const res = await fetch(`https://lichess.org/api/fide/player/${fideId}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SK-Dubrovnik-GP (klupska evidencija rejtinga)",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 404) return null;
  if (res.status === 429) {
    console.log("  Lichess traži predah, čekam minutu…");
    await new Promise((r) => setTimeout(r, 60_000));
    return dohvati(fideId);
  }
  if (!res.ok) throw new Error(`Lichess je vratio ${res.status} ${res.statusText}`);

  return (await res.json()) as LichessIgrac;
}

async function main() {
  const igraci = await prisma.player.findMany({
    where: { fideId: { not: null } },
    select: { fideId: true, firstName: true, lastName: true, birthYear: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  console.log(`Provjeravam ${igraci.length} igrača s FIDE ID-om.\n`);

  const nepronadeni: string[] = [];
  const bezRejtinga: string[] = [];
  const krivoGodiste: string[] = [];
  let pokriveni = 0;
  const imaju = { standard: 0, rapid: 0, blitz: 0 };

  for (const igrac of igraci) {
    const ime = `${igrac.lastName} ${igrac.firstName}`;
    const podaci = await dohvati(igrac.fideId!);

    if (!podaci) {
      nepronadeni.push(`${ime} (${igrac.fideId})`);
    } else {
      pokriveni++;
      if (podaci.standard) imaju.standard++;
      if (podaci.rapid) imaju.rapid++;
      if (podaci.blitz) imaju.blitz++;
      if (!podaci.standard && !podaci.rapid && !podaci.blitz) {
        bezRejtinga.push(ime);
      }
      // Godište je dobra provjera da smo pogodili pravog igrača.
      if (podaci.year && igrac.birthYear && podaci.year !== igrac.birthYear) {
        krivoGodiste.push(`${ime}: kod nas ${igrac.birthYear}, na FIDE-u ${podaci.year}`);
      }
    }

    await new Promise((r) => setTimeout(r, RAZMAK_MS));
  }

  console.log(`Pronađeno na Lichessu: ${pokriveni} / ${igraci.length}`);
  console.log(`  sa standard rejtingom: ${imaju.standard}`);
  console.log(`  s rapid rejtingom:     ${imaju.rapid}`);
  console.log(`  s blitz rejtingom:     ${imaju.blitz}`);

  if (nepronadeni.length > 0) {
    console.log(`\nNIJE PRONAĐENO (${nepronadeni.length}):`);
    for (const x of nepronadeni) console.log(`  ${x}`);
  }

  if (bezRejtinga.length > 0) {
    console.log(`\nPronađeni, ali bez ijednog rejtinga (${bezRejtinga.length}):`);
    for (const x of bezRejtinga) console.log(`  ${x}`);
  }

  if (krivoGodiste.length > 0) {
    console.log(`\nGODIŠTE SE NE POKLAPA (${krivoGodiste.length}) — provjeri FIDE ID:`);
    for (const x of krivoGodiste) console.log(`  ${x}`);
  }

  console.log(
    nepronadeni.length === 0
      ? "\nSvi igrači su pokriveni. Uvoz se može preseliti na Lichess."
      : "\nNeki igrači nisu pokriveni. Vidi popis iznad prije odluke."
  );
}

main()
  .catch((err) => {
    console.error("\nProvjera nije uspjela:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
